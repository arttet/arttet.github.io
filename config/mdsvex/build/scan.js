import { compile } from 'mdsvex';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { createMarkdownEngine } from '../engine/index.js';
import { contentPasses, optimizationPasses, securityPasses } from '../engine/pass-groups.js';
import { validateFrontmatterSchema } from './frontmatter-schema.js';

import { DIAGNOSTIC_CODES, SEVERITY, VALIDATION_MODE } from '../constants.js';

const contentDir = 'content/blog';

/**
 * @param {Record<string, unknown>} fm
 * @returns {Record<string, unknown>}
 */
function normalizeFrontmatter(fm) {
	const normalized = { ...fm };
	if (normalized.created instanceof Date) {
		normalized.created = normalized.created.toISOString().slice(0, 10);
	}
	if (normalized.updated instanceof Date) {
		normalized.updated = normalized.updated.toISOString().slice(0, 10);
	}
	return normalized;
}

/**
 * Discover every published post under `content/blog/<year>/`, parse its
 * frontmatter and run the markdown pipeline to extract AST metadata
 * (readingTime, extracted headings/links, detection flags). Drafts are
 * filtered out.
 *
 * @returns {Promise<{ posts: import('../../../src/entities/post/post').Post[]; fileMap: Map<string, string>; diagnostics: import('../engine/diagnostics.js').Diagnostic[] }>}
 */
export async function scanPosts() {
	const { config, ctx } = await createMarkdownEngine()
		.use(contentPasses())
		.use(securityPasses())
		.use(optimizationPasses())
		.toMdsvexConfig();

	const years = await readdir(contentDir).catch(() => []);

	const yearFiles = await Promise.all(
		years.map(async (year) => {
			const yearDir = join(contentDir, year);
			const files = await readdir(yearDir).catch(() => []);
			return files.filter((f) => f.endsWith('.md')).map((file) => ({ yearDir, file }));
		})
	);

	const allFiles = yearFiles.flat();

	const results = await Promise.all(
		allFiles.map(async ({ yearDir, file }) => {
			const filePath = join(yearDir, file);
			const resolved = resolve(filePath);
			const rel = relative(resolve(contentDir), resolved);
			if (rel.startsWith('..') || rel.startsWith('.') || rel.includes('..')) {
				// Path traversal defense: skip files outside content/blog
				return null;
			}
			const content = await readFile(filePath, 'utf8');
			const result = await compile(content, config);
			const data = result?.data;
			const fm = normalizeFrontmatter(
				/** @type {Record<string, unknown>} */ (data?.fm ?? {})
			);

			const schemaErrors = validateFrontmatterSchema(fm, filePath);
			if (schemaErrors.length > 0) {
				// Schema violations are surfaced as build-time diagnostics.
				for (const message of schemaErrors) {
					ctx.diagnostics.add({
						code: DIAGNOSTIC_CODES.INVALID_FRONTMATTER,
						severity: ctx.mode === VALIDATION_MODE.STRICT ? SEVERITY.CRITICAL : SEVERITY.WARNING,
						step: 'frontmatter-schema',
						message,
						file: filePath,
					});
				}
			}

			const slug = file.replace('.md', '');
			const post = Object.freeze(
				/** @type {import('../../../src/entities/post/post').Post} */ (
					/** @type {unknown} */ ({
						...fm,
						slug,
						readingTime: typeof fm.readingTime === 'number' ? fm.readingTime : 1,
						contentHash: createHash('sha256').update(content).digest('hex'),
					})
				)
			);
			return { post, filePath };
		})
	);

	const validResults = /** @type {{ post: import('../../../src/entities/post/post').Post; filePath: string }[]} */ (
		results.filter((r) => r !== null)
	);
	const posts = validResults.map((r) => r.post);
	const fileMap = new Map(validResults.map((r) => [r.post.slug, r.filePath]));

	return {
		posts: posts.filter((post) => !post.draft).toSorted(
			(a, b) => new Date(String(b.created)).getTime() - new Date(String(a.created)).getTime()
		),
		fileMap,
		diagnostics: ctx.diagnostics.list(),
	};
}

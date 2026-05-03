import { compile } from 'mdsvex';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createMarkdownEngine } from '../engine/index.js';
import { contentPasses, optimizationPasses, securityPasses } from '../engine/pass-groups.js';
import { validateFrontmatterSchema } from './frontmatter-schema.js';

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
 * @returns {Promise<{ posts: import('../../../src/entities/post/post').Post[]; fileMap: Map<string, string> }>}
 */
export async function scanPosts() {
	const { config } = await createMarkdownEngine({ mode: 'warn' })
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
			const content = await readFile(filePath, 'utf8');
			const result = await compile(content, config);
			const data = result?.data;
			const fm = normalizeFrontmatter(
				/** @type {Record<string, unknown>} */ (data?.fm ?? {})
			);

			const schemaErrors = validateFrontmatterSchema(fm, filePath);
			if (schemaErrors.length > 0) {
				// Schema violations are surfaced as build-time diagnostics.
				 
				console.error(`[frontmatter-schema] ${filePath}: ${schemaErrors.join('; ')}`);
			}

			const slug = file.replace('.md', '');
			const post = Object.freeze(
				/** @type {import('../../../src/entities/post/post').Post} */ (
					/** @type {unknown} */ ({
						...fm,
						slug,
						readingTime: typeof fm.readingTime === 'number' ? fm.readingTime : 1,
					})
				)
			);
			return { post, filePath };
		})
	);

	const posts = results.map((r) => r.post);
	const fileMap = new Map(results.map((r) => [r.post.slug, r.filePath]));

	return {
		posts: posts.filter((post) => !post.draft).toSorted(
			(a, b) => new Date(String(b.created)).getTime() - new Date(String(a.created)).getTime()
		),
		fileMap,
	};
}

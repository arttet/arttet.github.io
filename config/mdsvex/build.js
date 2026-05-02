import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { load as loadYaml, JSON_SCHEMA } from 'js-yaml';
import { createContentManifest } from './manifest.js';
import { createDiagnosticsReport } from './diagnostics.js';
import { createKnowledgeGraph } from './knowledge-graph.js';
import { createGeneratedArtifacts, writeGeneratedArtifacts } from './generated-artifacts.js';

const contentDir = 'content/blog';

/**
 * @param {import('./engine.js').MarkdownPipelineContext} ctx
 */
export async function generateMarkdownArtifacts(ctx) {
  const posts = await scanPosts();
  validateDuplicateSlugs(posts, ctx);
  const diagnostics = ctx.diagnostics.list();
  const validPosts = filterValidPosts(posts, diagnostics, ctx.mode);
  const manifest = createContentManifest(validPosts);
  const knowledgeGraph = createKnowledgeGraph(validPosts);
  const report = createDiagnosticsReport(diagnostics, {
    pipelineVersion: manifest.pipelineVersion,
  });

  const artifacts = createGeneratedArtifacts({ manifest, diagnostics: report, knowledgeGraph });
  await writeGeneratedArtifacts(artifacts);
}

/**
 * @param {import('../../src/entities/post/post').Post[]} posts
 * @param {import('./engine.js').MarkdownPipelineContext} ctx
 */
function validateDuplicateSlugs(posts, ctx) {
  const seen = new Map();
  for (const post of posts) {
    if (seen.has(post.slug)) {
      ctx.diagnostics.add({
        code: 'MDX007_DUPLICATE_SLUG',
        severity: 'critical',
        step: 'slug-guard',
        message:
          ctx.mode === 'warn'
            ? `Duplicate post slug detected: "${post.slug}". This post would be skipped in strict mode.`
            : `Duplicate post slug detected: "${post.slug}".`,
      });
    }
    seen.set(post.slug, true);
  }
}

/**
 * @param {import('../../src/entities/post/post').Post[]} posts
 * @param {import('./diagnostics.js').Diagnostic[]} diagnostics
 * @param {import('./engine.js').MarkdownMode} mode
 * @returns {import('../../src/entities/post/post').Post[]}
 */
function filterValidPosts(posts, diagnostics, mode) {
  if (mode !== 'strict') return posts;

  const invalidSlugs = new Set();
  for (const diagnostic of diagnostics) {
    if (diagnostic.severity === 'critical' && diagnostic.file) {
      const slug = extractSlugFromPath(diagnostic.file);
      if (slug) invalidSlugs.add(slug);
    }
  }

  return posts.filter((post) => !invalidSlugs.has(post.slug));
}

/**
 * @param {string} filePath
 * @returns {string | undefined}
 */
function extractSlugFromPath(filePath) {
  return filePath.split('/').pop()?.replace('.md', '');
}

/**
 * @returns {Promise<import('../../src/entities/post/post').Post[]>}
 */
async function scanPosts() {
  const years = await readdir(contentDir).catch(() => []);

  const posts = await Promise.all(
    years.map(async (year) => {
      const yearDir = join(contentDir, year);
      const files = await readdir(yearDir).catch(() => []);

      const yearPosts = await Promise.all(
        files
          .filter((file) => file.endsWith('.md'))
          .map(async (file) => {
            const content = await readFile(join(yearDir, file), 'utf8');
            const fm = parseFrontmatter(content);
            const slug = file.replace('.md', '');
            const body = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
            return /** @type {import('../../src/entities/post/post').Post} */ (
              /** @type {unknown} */ (
                Object.assign({}, fm, {
                  slug,
                  readingTime: computeReadingTime(body),
                })
              )
            );
          })
      );

      return yearPosts;
    })
  );

  return posts
    .flat()
    .filter((post) => !post.draft)
    .toSorted(
      (a, b) => new Date(String(b.created)).getTime() - new Date(String(a.created)).getTime()
    );
}

/**
 * @param {string} content
 * @returns {number}
 */
function computeReadingTime(content) {
  const words = content
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * @param {string} content
 * @returns {Record<string, unknown>}
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  return /** @type {Record<string, unknown>} */ (loadYaml(match[1], { schema: JSON_SCHEMA }));
}

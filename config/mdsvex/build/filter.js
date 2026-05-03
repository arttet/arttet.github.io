import { basename } from 'node:path';
import { DIAGNOSTIC_CODES, SEVERITY, VALIDATION_MODE } from '../constants.js';

/**
 * Emit a critical diagnostic for every post slug that appears more than once
 * across the scanned content tree.
 *
 * @param {import('../../../src/entities/post/post').Post[]} posts
 * @param {import('../engine/index.js').MarkdownPipelineContext} ctx
 */
/**
 * @param {import('../../../src/entities/post/post').Post[]} posts
 * @param {import('../engine/index.js').MarkdownPipelineContext} ctx
 * @param {Map<string, string>} fileMap
 */
export function validateDuplicateSlugs(posts, ctx, fileMap) {
  const seen = new Map();
  for (const post of posts) {
    if (seen.has(post.slug)) {
      ctx.diagnostics.add({
        code: DIAGNOSTIC_CODES.DUPLICATE_SLUG,
        severity: SEVERITY.CRITICAL,
        step: 'slug-guard',
        message:
          ctx.mode === VALIDATION_MODE.WARN
            ? `Duplicate post slug detected: "${post.slug}". This post would be skipped in strict mode.`
            : `Duplicate post slug detected: "${post.slug}".`,
        file: fileMap.get(post.slug),
      });
    }
    seen.set(post.slug, true);
  }
}

/**
 * In strict mode, drop every post whose slug has any critical diagnostic.
 * In warn mode, return the input unchanged.
 *
 * @param {import('../../../src/entities/post/post').Post[]} posts
 * @param {import('../engine/diagnostics.js').Diagnostic[]} diagnostics
 * @param {import('../engine/index.js').MarkdownMode} mode
 * @returns {import('../../../src/entities/post/post').Post[]}
 */
export function filterValidPosts(posts, diagnostics, mode) {
  if (mode !== VALIDATION_MODE.STRICT) {
return posts;
}

  const invalidSlugs = new Set();
  for (const diagnostic of diagnostics) {
    if (diagnostic.severity === SEVERITY.CRITICAL && diagnostic.file) {
      const slug = extractSlugFromPath(diagnostic.file);
      if (slug) {
invalidSlugs.add(slug);
}
    }
  }

  return posts.filter((post) => !invalidSlugs.has(post.slug));
}

/**
 * @param {string} filePath
 * @returns {string | undefined}
 */
function extractSlugFromPath(filePath) {
  return basename(filePath, '.md');
}

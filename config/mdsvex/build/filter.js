import { basename } from 'node:path';
import { DIAGNOSTIC_CODES, SEVERITY, VALIDATION_MODE } from '../constants.js';
import { emitDiagnostic } from '../engine/diagnostics.js';

/**
 * Emit a critical diagnostic for every post slug that appears more than once
 * across the scanned content tree.
 *
 * @param {import('../../../src/entities/post/post').Post[]} posts
 * @param {Map<string, string>} fileMap
 * @param {import('../engine/context.js').BuildContext} build
 */
export function validateDuplicateSlugs(posts, fileMap, build) {
  const seen = new Map();
  for (const post of posts) {
    if (seen.has(post.slug)) {
      emitDiagnostic(
        { mode: build.mode, diagnostics: build.diagnostics },
        {
          code: DIAGNOSTIC_CODES.DUPLICATE_SLUG,
          pass: 'slug-guard',
          severity: SEVERITY.CRITICAL,
          message: `Duplicate post slug detected: "${post.slug}".`,
          file: fileMap.get(post.slug),
        }
      );
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
 * Emit a critical diagnostic for every duplicate canonical URL across posts.
 *
 * @param {import('../../../src/entities/post/post').Post[]} posts
 * @param {Map<string, string>} fileMap
 * @param {import('../engine/context.js').BuildContext} build
 */
export function validateCanonicalUniqueness(posts, fileMap, build) {
  const seen = new Map();
  for (const post of posts) {
    const canonical = post.canonical ?? `/blog/${post.slug}`;
    if (seen.has(canonical)) {
      emitDiagnostic(
        { mode: build.mode, diagnostics: build.diagnostics },
        {
          code: DIAGNOSTIC_CODES.DUPLICATE_CANONICAL,
          pass: 'canonical-guard',
          severity: SEVERITY.CRITICAL,
          message: `Duplicate canonical URL detected: "${canonical}".`,
          file: fileMap.get(post.slug),
        }
      );
    } else {
      seen.set(canonical, post.slug);
    }
  }
}

/**
 * @param {string} filePath
 * @returns {string | undefined}
 */
function extractSlugFromPath(filePath) {
  return basename(filePath, '.md');
}

import { describe, expect, it } from 'vitest';
import { createBuildContext } from '../engine/context.js';
import {
  filterValidPosts,
  validateCanonicalUniqueness,
  validateDuplicateSlugs,
} from './filter.js';

/**
 * @param {string} slug
 * @param {Partial<import('../../../src/entities/post/post').Post>} [overrides]
 * @returns {import('../../../src/entities/post/post').Post}
 */
function createTestPost(slug, overrides = {}) {
  return { slug, title: slug, created: '2026-01-01', tags: [], readingTime: 1, ...overrides };
}

describe('validateDuplicateSlugs', () => {
  it('reports duplicate slugs', () => {
    const build = createBuildContext('warn');
    const posts = [createTestPost('a'), createTestPost('a')];
    const fileMap = new Map([
      ['a', 'content/blog/2026/a.md'],
    ]);
    validateDuplicateSlugs(posts, fileMap, build);
    expect(build.diagnostics.list()).toHaveLength(1);
    expect(build.diagnostics.list()[0].code).toBe('MDX007_DUPLICATE_SLUG');
  });

  it('is silent when all slugs are unique', () => {
    const build = createBuildContext('warn');
    const posts = [createTestPost('a'), createTestPost('b')];
    const fileMap = new Map([
      ['a', 'content/blog/2026/a.md'],
      ['b', 'content/blog/2026/b.md'],
    ]);
    validateDuplicateSlugs(posts, fileMap, build);
    expect(build.diagnostics.list()).toHaveLength(0);
  });

  it('uses warning message in warn mode', () => {
    const build = createBuildContext('warn');
    const posts = [createTestPost('x'), createTestPost('x')];
    const fileMap = new Map([['x', 'x.md']]);
    validateDuplicateSlugs(posts, fileMap, build);
    expect(build.diagnostics.list()[0].message).toContain('would be skipped in strict mode');
  });

  it('uses strict message in strict mode', () => {
    const build = createBuildContext('strict');
    const posts = [createTestPost('x'), createTestPost('x')];
    const fileMap = new Map([['x', 'x.md']]);
    validateDuplicateSlugs(posts, fileMap, build);
    expect(build.diagnostics.list()[0].message).not.toContain('would be skipped in strict mode');
  });
});

describe('filterValidPosts', () => {
  it('returns all posts in warn mode', () => {
    const posts = [createTestPost('a'), createTestPost('b')];
    /** @type {import('../engine/diagnostics.js').Diagnostic[]} */
    const diagnostics = [
      { severity: 'critical', file: 'content/blog/2026/a.md', code: 'X', pass: 'p', message: 'm' },
    ];
    const result = filterValidPosts(posts, diagnostics, 'warn');
    expect(result).toHaveLength(2);
  });

  it('filters posts with critical diagnostics in strict mode', () => {
    const posts = [createTestPost('a'), createTestPost('b')];
    /** @type {import('../engine/diagnostics.js').Diagnostic[]} */
    const diagnostics = [
      { severity: 'critical', file: 'content/blog/2026/a.md', code: 'X', pass: 'p', message: 'm' },
    ];
    const result = filterValidPosts(posts, diagnostics, 'strict');
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('b');
  });

  it('ignores diagnostics without a file in strict mode', () => {
    const posts = [createTestPost('a')];
    /** @type {import('../engine/diagnostics.js').Diagnostic[]} */
    const diagnostics = [
      { severity: 'critical', file: undefined, code: 'X', pass: 'p', message: 'm' },
    ];
    const result = filterValidPosts(posts, diagnostics, 'strict');
    expect(result).toHaveLength(1);
  });

  it('ignores non-critical diagnostics in strict mode', () => {
    const posts = [createTestPost('a')];
    /** @type {import('../engine/diagnostics.js').Diagnostic[]} */
    const diagnostics = [
      { severity: 'warning', file: 'content/blog/2026/a.md', code: 'X', pass: 'p', message: 'm' },
    ];
    const result = filterValidPosts(posts, diagnostics, 'strict');
    expect(result).toHaveLength(1);
  });
});

describe('validateCanonicalUniqueness', () => {
  it('reports duplicate canonical URLs', () => {
    const build = createBuildContext('warn');
    const posts = [
      createTestPost('a', { canonical: '/blog/same' }),
      createTestPost('b', { canonical: '/blog/same' }),
    ];
    const fileMap = new Map([
      ['a', 'a.md'],
      ['b', 'b.md'],
    ]);
    validateCanonicalUniqueness(posts, fileMap, build);
    expect(build.diagnostics.list()).toHaveLength(1);
    expect(build.diagnostics.list()[0].code).toBe('MDX013_DUPLICATE_CANONICAL');
  });

  it('falls back to /blog/:slug when canonical is absent', () => {
    const build = createBuildContext('warn');
    const posts = [createTestPost('a'), createTestPost('a')];
    const fileMap = new Map([['a', 'a.md']]);
    validateCanonicalUniqueness(posts, fileMap, build);
    expect(build.diagnostics.list()).toHaveLength(1);
    expect(build.diagnostics.list()[0].message).toContain('/blog/a');
  });

  it('is silent when canonical URLs are unique', () => {
    const build = createBuildContext('warn');
    const posts = [
      createTestPost('a', { canonical: '/blog/a' }),
      createTestPost('b', { canonical: '/blog/b' }),
    ];
    const fileMap = new Map([
      ['a', 'a.md'],
      ['b', 'b.md'],
    ]);
    validateCanonicalUniqueness(posts, fileMap, build);
    expect(build.diagnostics.list()).toHaveLength(0);
  });

  it('uses warning message in warn mode', () => {
    const build = createBuildContext('warn');
    const posts = [
      createTestPost('a', { canonical: '/dup' }),
      createTestPost('b', { canonical: '/dup' }),
    ];
    const fileMap = new Map([
      ['a', 'a.md'],
      ['b', 'b.md'],
    ]);
    validateCanonicalUniqueness(posts, fileMap, build);
    expect(build.diagnostics.list()[0].message).toContain('would be skipped in strict mode');
  });

  it('uses strict message in strict mode', () => {
    const build = createBuildContext('strict');
    const posts = [
      createTestPost('a', { canonical: '/dup' }),
      createTestPost('b', { canonical: '/dup' }),
    ];
    const fileMap = new Map([
      ['a', 'a.md'],
      ['b', 'b.md'],
    ]);
    validateCanonicalUniqueness(posts, fileMap, build);
    expect(build.diagnostics.list()[0].message).not.toContain('would be skipped in strict mode');
  });
});

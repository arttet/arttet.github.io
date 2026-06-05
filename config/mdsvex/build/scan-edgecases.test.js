// @ts-nocheck
// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { scanPosts } from './scan.js';
import { createBuildContext } from '../engine/context.js';
import { RESOURCE_LIMITS } from '../constants.js';
import { readdir, readFile } from 'node:fs/promises';
import { compile } from 'mdsvex';
import { loadCachedPost, saveCachedPost } from './cache.js';
import { validateFrontmatterSchema } from './frontmatter-schema.js';
import { join, relative } from 'node:path';

vi.mock('node:fs/promises', () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
}));

vi.mock('mdsvex', () => ({
  compile: vi.fn(),
}));

vi.mock('./cache.js', () => ({
  computeCacheKey: vi.fn().mockReturnValue('cache-key'),
  loadCachedPost: vi.fn().mockResolvedValue(null),
  saveCachedPost: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./frontmatter-schema.js', () => ({
  validateFrontmatterSchema: vi.fn().mockReturnValue([]),
}));

vi.mock('node:path', async () => {
  const actual = await vi.importActual('node:path');
  return {
    ...actual,
    relative: vi.fn((from, to) => actual.relative(from, to)),
  };
});

/**
 * @param {string[]} files
 */
function setupReaddir(files) {
  readdir.mockImplementation((path) => {
    if (path === 'content/blog') {
      return Promise.resolve(['2024']);
    }
    if (path === join('content', 'blog', '2024')) {
      return Promise.resolve(files);
    }
    return Promise.resolve([]);
  });
}

describe('scanPosts edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips files outside content/blog (path traversal)', async () => {
    setupReaddir(['test.md']);
    readFile.mockResolvedValue('content');
    relative.mockReturnValueOnce('../../outside');

    const build = createBuildContext('warn');
    const result = await scanPosts(build, {});

    expect(result.posts).toHaveLength(0);
    expect(result.fileMap.size).toBe(0);
  });

  it('emits diagnostic when file exceeds size limit', async () => {
    setupReaddir(['huge.md']);
    const hugeContent = 'x'.repeat(RESOURCE_LIMITS.MAX_FILE_BYTES + 1);
    readFile.mockResolvedValue(hugeContent);

    compile.mockResolvedValueOnce({
      data: {
        fm: { title: 'Huge', created: '2026-01-01', readingTime: 1 },
      },
    });

    const build = createBuildContext('warn');
    const result = await scanPosts(build, {});

    expect(result.diagnostics.some((d) => d.code === 'MDX201_RESOURCE_FILE_SIZE')).toBe(true);
    expect(result.posts).toHaveLength(1);
  });

  it('uses cached post when available', async () => {
    setupReaddir(['cached.md']);
    readFile.mockResolvedValue('content');

    const cachedPost = {
      slug: 'cached',
      title: 'Cached',
      created: '2026-01-01',
      readingTime: 1,
      contentHash: 'abc',
      hasMath: false,
    };
    loadCachedPost.mockResolvedValueOnce({
      version: 'test-version',
      post: cachedPost,
      diagnostics: [{ code: 'A', severity: 'warning', pass: 'test', message: 'M' }],
    });

    const build = createBuildContext('warn');
    const result = await scanPosts(build, {});

    expect(result.posts).toHaveLength(1);
    expect(result.posts[0].slug).toBe('cached');
    expect(compile).not.toHaveBeenCalled();
  });

  it('surfaces schema validation errors as diagnostics', async () => {
    setupReaddir(['bad.md']);
    readFile.mockResolvedValue('content');

    validateFrontmatterSchema.mockReturnValueOnce(['title: Required']);
    compile.mockResolvedValueOnce({
      data: {
        fm: { title: 'Bad', created: '2026-01-01', readingTime: 1 },
      },
    });

    const build = createBuildContext('warn');
    const result = await scanPosts(build, {});

    expect(result.diagnostics.some((d) => d.code === 'MDX010_INVALID_FRONTMATTER')).toBe(true);
    expect(result.posts).toHaveLength(1);
  });

  it('defaults readingTime to 1 when missing', async () => {
    setupReaddir(['no-time.md']);
    readFile.mockResolvedValue('content');

    compile.mockResolvedValueOnce({
      data: {
        fm: { title: 'No Time', created: '2026-01-01' },
      },
    });

    const build = createBuildContext('warn');
    const result = await scanPosts(build, {});

    expect(result.posts[0].readingTime).toBe(1);
  });

  it('defaults hasMath to false when extracted is missing', async () => {
    setupReaddir(['no-math.md']);
    readFile.mockResolvedValue('content');

    compile.mockResolvedValueOnce({
      data: {
        fm: { title: 'No Math', created: '2026-01-01', readingTime: 1 },
      },
    });

    const build = createBuildContext('warn');
    const result = await scanPosts(build, {});

    expect(result.posts[0].hasMath).toBe(false);
  });

  it('saves post to cache after compilation', async () => {
    setupReaddir(['fresh.md']);
    readFile.mockResolvedValue('content');

    compile.mockResolvedValueOnce({
      data: {
        fm: { title: 'Fresh', created: '2026-01-01', readingTime: 1 },
      },
    });

    const build = createBuildContext('warn');
    await scanPosts(build, {});

    expect(saveCachedPost).toHaveBeenCalled();
  });
});

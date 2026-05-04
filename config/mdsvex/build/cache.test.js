import { describe, expect, it } from 'vitest';
import { computeCacheKey, loadCachedPost, saveCachedPost } from './cache.js';
import { PIPELINE_VERSION } from '../constants.js';

describe('content-addressed cache', () => {
  it('computes deterministic cache keys', () => {
    const keyA = computeCacheKey('2024/hello.md', 'hello world');
    const keyB = computeCacheKey('2024/hello.md', 'hello world');
    const keyC = computeCacheKey('2024/hello.md', 'hello world!');
    expect(keyA).toBe(keyB);
    expect(keyA).not.toBe(keyC);
    expect(keyA).toHaveLength(64);
  });

  it('returns null for missing cache entries', async () => {
    const result = await loadCachedPost('nonexistent-key-12345');
    expect(result).toBeNull();
  });

  it('round-trips post and diagnostics', async () => {
    const post = {
      slug: 'test-post',
      title: 'Test',
      created: '2024-01-15',
      readingTime: 3,
      contentHash: 'abc123',
      tags: [],
    };
    /** @type {import('../engine/diagnostics.js').Diagnostic[]} */
    const diagnostics = [
      { code: 'MDX001', severity: /** @type {const} */ ('warning'), pass: 'test', message: 'Test diagnostic' },
    ];

    const key = computeCacheKey('2024/test.md', 'content');
    await saveCachedPost(key, post, diagnostics);

    const cached = await loadCachedPost(key);
    expect(cached).not.toBeNull();
    expect(cached?.post.slug).toBe('test-post');
    expect(cached?.diagnostics).toHaveLength(1);
    expect(cached?.diagnostics[0].code).toBe('MDX001');
    expect(cached?.version).toBe(PIPELINE_VERSION);
  });

  it('invalidates cache on pipeline version mismatch', async () => {
    const key = computeCacheKey('2024/old.md', 'old content');

    // Manually write an old-version cache file
    const fs = await import('node:fs/promises');
    const path = (await import('node:path')).join;
    const cacheFile = path('.cache/mdsvex/posts', `${key}.json`);
    await fs.mkdir(path('.cache/mdsvex/posts'), { recursive: true });
    await fs.writeFile(
      cacheFile,
      JSON.stringify({ version: 'v0-old', post: {}, diagnostics: [] }),
      'utf8'
    );

    const cached = await loadCachedPost(key);
    expect(cached).toBeNull();
  });
});

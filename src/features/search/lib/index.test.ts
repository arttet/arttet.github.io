import { beforeEach, describe, expect, it } from 'vitest';
import { buildIndex, search } from './index';

describe('search index lib', () => {
  const mockPayload = {
    posts: [
      { slug: 'post-1', title: 'Hello World', tags: ['news'], created: '2026-01-01' },
      { slug: 'post-2', title: 'Svelte 5', tags: ['svelte', 'js'], created: '2026-01-02' },
    ],
    index: {}, // empty index for fallback
  };

  beforeEach(async () => {
    await buildIndex(mockPayload);
  });

  it('searches by title', async () => {
    const results = await search('Hello');
    expect(results.length).toBe(1);
    expect(results[0].slug).toBe('post-1');
  });

  it('searches by tags', async () => {
    const results = await search('svelte');
    expect(results.length).toBe(1);
    expect(results[0].slug).toBe('post-2');
  });

  it('returns empty for no match', async () => {
    const results = await search('nonexistent');
    expect(results.length).toBe(0);
  });

  it('handles empty query', async () => {
    const results = await search('');
    expect(results).toEqual([]);
  });
});

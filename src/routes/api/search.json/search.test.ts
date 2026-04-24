// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

vi.mock('$entities/post/api.server', () => ({
  getPosts: () => [
    {
      slug: 'post-1',
      title: 'Post 1',
      tags: ['t1'],
      created: '2026-04-21',
      summary: 'Summary 1',
      readingTime: 5,
    },
  ],
}));

// Mock flexsearch since it might not work well in jsdom/vitest without heavy setup
vi.mock('flexsearch', () => ({
  Document: class {
    add() {}
    export(cb: (key: string, data: string) => void) {
      cb('0', 'index-data');
    }
  },
}));

describe('search.json API', () => {
  it('returns posts and exported index', async () => {
    const { GET } = await import('./+server');
    const response = await GET();
    const data = await response.json();

    expect(data.posts.length).toBe(1);
    expect(data.posts[0].slug).toBe('post-1');
    expect(data.index).toBeDefined();
    expect(data.index['0']).toBe('index-data');
  });
});

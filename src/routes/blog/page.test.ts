import { describe, expect, it, vi } from 'vitest';

vi.mock('$entities/post/api', () => ({
  getPosts: () => [
    { slug: 'a', title: 'First', tags: ['svelte'], created: '2026-04-03', readingTime: 1 },
    { slug: 'b', title: 'Second', tags: ['webgpu'], created: '2026-04-02', readingTime: 2 },
    { slug: 'c', title: 'Third', tags: ['testing'], created: '2026-04-01', readingTime: 3 },
  ],
}));

describe('blog page loader', () => {
  it('parses page query params and clamps out-of-range pages', async () => {
    const { load, _parsePageParam } = await import('./+page');

    expect(_parsePageParam(null)).toBe(1);
    expect(_parsePageParam('0')).toBe(1);
    expect(_parsePageParam('-1')).toBe(1);
    expect(_parsePageParam('abc')).toBe(1);
    expect(_parsePageParam('2')).toBe(2);

    const data = await load({
      url: new URL('https://arttet.github.io/blog?page=99'),
    } as Parameters<typeof load>[0]);

    expect(data).toBeTruthy();
    if (!data) {
      throw new Error('Expected blog page load data to be defined');
    }

    expect(data.totalPosts).toBe(3);
    expect(data.currentPage).toBe(1);
    expect(data.pageCount).toBe(1);
    expect(data.posts).toHaveLength(3);
  });
});

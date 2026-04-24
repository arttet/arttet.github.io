// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

vi.mock('$entities/post/api', () => ({
  getPosts: () => [
    { slug: 'post-1', title: 'Post 1' },
    { slug: 'post-2', title: 'Post 2' },
  ],
}));

describe('blog [slug] page entries', () => {
  it('generates prerender entries for all posts', async () => {
    const { entries } = await import('./+page');

    expect(entries()).toEqual([{ slug: 'post-1' }, { slug: 'post-2' }]);
  });

  it('throws 404 for unknown post slugs', async () => {
    const { load } = await import('./+page');
    expect.assertions(2);

    try {
      load({ params: { slug: 'missing-post' } });
    } catch (thrown) {
      const error = thrown as { status?: number; body?: { message?: string } };
      expect(error.status).toBe(404);
      expect(error.body?.message).toBe('Post not found');
    }
  });
});

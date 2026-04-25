// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

vi.mock('$entities/post/api', () => ({
  getPosts: () => [
    { slug: 'post-1', title: 'Post 1', tags: [], created: '2026-02-01', readingTime: 1 },
    { slug: 'post-2', title: 'Post 2', tags: [], created: '2026-01-01', readingTime: 1 },
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

  it('returns post with prevPost and nextPost', async () => {
    const { load } = await import('./+page');

    const result1 = load({ params: { slug: 'post-1' } });
    expect(result1.post.slug).toBe('post-1');
    expect(result1.prevPost?.slug).toBe('post-2');
    expect(result1.nextPost).toBeNull();

    const result2 = load({ params: { slug: 'post-2' } });
    expect(result2.post.slug).toBe('post-2');
    expect(result2.prevPost).toBeNull();
    expect(result2.nextPost?.slug).toBe('post-1');
  });
});

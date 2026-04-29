// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

vi.mock('$entities/post/api', () => ({
  getPosts: () => [
    {
      slug: 'newer-post',
      title: 'Newer',
      tags: [],
      created: '2026-02-01',
      readingTime: 1,
    },
    {
      slug: '2026-04-12-blog-initialization',
      title: 'Initialization',
      tags: [],
      created: '2026-01-01',
      readingTime: 1,
    },
    {
      slug: 'older-post',
      title: 'Older',
      tags: [],
      created: '2025-12-01',
      readingTime: 1,
    },
  ],
}));

describe('blog [slug] page entries', () => {
  it('generates prerender entries for all posts', async () => {
    const { entries } = await import('./+page.server');

    expect(entries()).toEqual([
      { slug: 'newer-post' },
      { slug: '2026-04-12-blog-initialization' },
      { slug: 'older-post' },
    ]);
  });

  it('throws 404 for unknown post slugs', async () => {
    const { load } = await import('./+page.server');
    expect.assertions(2);

    try {
      await load({ params: { slug: 'missing-post' } });
    } catch (thrown) {
      const error = thrown as { status?: number; body?: { message?: string } };
      expect(error.status).toBe(404);
      expect(error.body?.message).toBe('Post not found');
    }
  });

  it('returns post with prevPost and nextPost', async () => {
    const { buildPostPageData } = await import('./page-data');
    const posts = [
      { slug: 'newer-post', title: 'Newer', tags: [], created: '2026-02-01', readingTime: 1 },
      {
        slug: '2026-04-12-blog-initialization',
        title: 'Initialization',
        tags: [],
        created: '2026-01-01',
        readingTime: 1,
      },
      { slug: 'older-post', title: 'Older', tags: [], created: '2025-12-01', readingTime: 1 },
    ];

    const result = buildPostPageData(posts, 1, '<h2>Code Formatting</h2>');

    expect(result.post.slug).toBe('2026-04-12-blog-initialization');
    expect(result.prevPost?.slug).toBe('older-post');
    expect(result.nextPost?.slug).toBe('newer-post');
    expect(result.postHtml).toContain('Code Formatting');
  });
});

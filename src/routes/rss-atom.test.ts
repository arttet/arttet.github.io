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
    },
  ],
}));

describe('RSS/Atom feed generators', () => {
  it('atom.xml returns valid content', async () => {
    const { GET } = await import('./atom.xml/+server');
    const response = await GET();
    const text = await response.text();
    expect(response.headers.get('Content-Type')).toContain('atom+xml');
    expect(text).toContain('<title>Post 1</title>');
  });

  it('rss.xml returns valid content', async () => {
    const { GET } = await import('./rss.xml/+server');
    const response = await GET();
    const text = await response.text();
    expect(response.headers.get('Content-Type')).toContain('rss+xml');
    expect(text).toContain('<title>Post 1</title>');
  });
});

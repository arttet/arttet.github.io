// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/markdown/core/manifest', () => ({
  getManifestPosts: () => [
    {
      slug: 'post-1',
      frontmatter: {
        title: 'Post 1',
        tags: ['t1'],
        created: '2026-04-21',
        description: 'Summary 1',
      },
      flags: {},
      extracted: {},
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

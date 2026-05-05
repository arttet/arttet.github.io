// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

// Mock post fetching
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

describe('RSS feed generator', () => {
  it('returns valid RSS XML', async () => {
    const { GET } = await import('./+server');
    const response = await GET();
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('rss+xml');
    expect(text).toContain('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">');
    expect(text).toContain(
      '<atom:link href="https://arttet.github.io/rss.xml" rel="self" type="application/rss+xml" />'
    );
    expect(text).toContain('<title>Post 1</title>');
  });
});

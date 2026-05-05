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

describe('Atom feed generator', () => {
  it('returns valid Atom XML', async () => {
    const { GET } = await import('./+server');
    const response = await GET();
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('atom+xml');
    expect(text).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
    expect(text).toContain('<title>Post 1</title>');
  });
});

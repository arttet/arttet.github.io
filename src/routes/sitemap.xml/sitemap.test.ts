// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

// Mock the api.server getPosts at the top level
vi.mock('$entities/post/api.server', () => ({
  getPosts: () => [{ slug: 'post-1', updated: '2026-04-21', created: '2026-04-21' }],
}));

describe('sitemap.xml generator', () => {
  it('generates a valid XML sitemap', async () => {
    const { GET } = await import('./+server');
    const response = await GET();
    const text = await response.text();

    expect(response.headers.get('Content-Type')).toBe('application/xml');
    expect(text).toContain('<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(text).toContain('<loc>https://arttet.github.io/blog/post-1</loc>');
    expect(text).toContain('<lastmod>2026-04-21</lastmod>');
  });
});

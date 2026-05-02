import { expect, test } from '@playwright/test';

const BLOG_INIT_POST = '/blog/2026-04-12-blog-initialization';

test.describe('SEO & Sitemap', () => {
  test('home page has JSON-LD', async ({ page }) => {
    await page.goto('/');
    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    expect(jsonLd).toBeDefined();
    const data = JSON.parse(jsonLd || '{}');
    expect(data['@type']).toBe('WebSite');

    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /^https:\/\/arttet\.github\.io\/_app\/immutable\/assets\/og-image\..+\.png$/
    );
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
      'content',
      /^https:\/\/arttet\.github\.io\/_app\/immutable\/assets\/og-image\..+\.png$/
    );
  });

  test('blog post has Article JSON-LD', async ({ page }) => {
    await page.goto(BLOG_INIT_POST);
    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    expect(jsonLd).toBeDefined();
    const data = JSON.parse(jsonLd || '{}');
    expect(data['@type']).toBe('BlogPosting');
    expect(data.headline).toBeDefined();
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image'
    );
  });

  test('sitemap.xml is valid and reachable', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);
    const contentType = response?.headers()['content-type'];
    expect(contentType).toMatch(/xml/);

    const content = await response?.text();
    expect(content).toContain('<urlset');
    expect(content).toContain('<loc>');
  });

  test('rss.xml and atom.xml are reachable', async ({ page }) => {
    const rss = await page.goto('/rss.xml');
    expect(rss?.status()).toBe(200);

    const atom = await page.goto('/atom.xml');
    expect(atom?.status()).toBe(200);
  });

  test('manifest.json is valid and reachable', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);
    if (!response) {
      throw new Error('No response from manifest.json');
    }
    const data = await response.json();
    expect(data.name).toBe('Artyom Tetyukhin');
    expect(data.icons.length).toBeGreaterThan(0);
    expect(data.icons[0].src).toMatch(/\.png/);
  });
});

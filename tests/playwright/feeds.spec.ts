import { expect, test } from '@playwright/test';

test.describe('RSS and Atom Feeds', () => {
  test('rss.xml returns valid xml', async ({ request }) => {
    const response = await request.get('/rss.xml');
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toMatch(/xml/);
    const body = await response.text();
    expect(body).toContain('<rss version="2.0"');
    expect(body).toContain('<channel>');
  });

  test('rss.xml exposes a self link', async ({ request }) => {
    const response = await request.get('/rss.xml');
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toMatch(/xml/);
    const body = await response.text();
    expect(body).toContain('<atom:link href="');
    expect(body).toContain('rss.xml" rel="self" type="application/rss+xml" />');
  });

  test('atom.xml returns valid atom xml', async ({ request }) => {
    const response = await request.get('/atom.xml');
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toMatch(/xml/);
    const body = await response.text();
    expect(body).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
    expect(body).toContain('<title>');
    expect(body).toContain('<link href="');
    expect(body).toContain('atom.xml" rel="self" type="application/atom+xml" />');
  });
});

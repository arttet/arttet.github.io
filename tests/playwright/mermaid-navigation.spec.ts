import { expect, test } from '@playwright/test';

const FIRST_POST = '/blog/2026-04-12-blog-initialization';

test.describe('Mermaid navigation', () => {
  test('mermaid diagrams render after SPA navigation between posts', async ({ page }) => {
    await page.goto(FIRST_POST);

    await expect(page.locator('.mermaid svg').first()).toBeVisible({ timeout: 5000 });

    const nextLink = page.getByRole('link', { name: /Next page|Previous page/ }).first();
    await nextLink.click();

    await page.waitForURL((url) => !url.pathname.endsWith('2026-04-12-blog-initialization'));

    await expect(page.locator('.mermaid svg').first()).toBeVisible({ timeout: 5000 });
  });
});

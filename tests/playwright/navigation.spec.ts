import { expect, test } from '@playwright/test';

test.describe('Navigation', () => {
  test('about page renders', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('main')).toBeVisible();
  });

  test('all nav links resolve', async ({ page }) => {
    const links = ['/', '/blog', '/about'];

    for (const path of links) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
    }
  });

  test('non-existent page shows 404 fallback', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    // adapter-static serves index.html as fallback
    await expect(page).toHaveURL(/\/this-page-does-not-exist/);
  });
});

import { expect, test } from '@playwright/test';

test.describe('Homepage', () => {
  test('background initializes in preview without runtime errors', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    const asset404s: string[] = [];

    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    page.on('response', (response) => {
      if (response.status() === 404 && response.url().includes('/_app/immutable/')) {
        asset404s.push(response.url());
      }
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    expect(pageErrors).toEqual([]);
    expect(asset404s).toEqual([]);

    // Ignore 'Failed to fetch', 'No GPU adapter', and 'WebGPU not supported' console errors
    // which are common in CI environments without GPU support.
    const actualConsoleErrors = consoleErrors.filter(
      (err) =>
        !err.includes('Failed to fetch dynamically imported module') &&
        !err.includes('No GPU adapter') &&
        !err.includes('WebGPU not supported') &&
        !err.includes('Background scene initialization failed: Error')
    );
    expect(actualConsoleErrors).toEqual([]);
  });

  test('renders with title and navigation', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: 'Blog' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'About' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'GitHub' })).toBeVisible();
  });

  test('skip link targets the main content container', async ({ page }) => {
    await page.goto('/');

    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toHaveText('Skip to content');

    await skipLink.focus();

    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused({ timeout: 10000 });
  });

  test('nav links navigate correctly', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('main').getByRole('link', { name: 'Blog' }).click();
    await expect(page).toHaveURL(/\/blog/);
    await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible();

    await page.goto('/');
    await page.getByRole('main').getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL(/\/about/);
  });

  test('light theme renders correctly', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
    });
    await page.goto('/');

    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

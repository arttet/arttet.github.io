import { expect, test } from '@playwright/test';

test.describe('Homepage', () => {
  test('renders with title and navigation', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: 'Blog' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'About' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'GitHub' })).toBeVisible();
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

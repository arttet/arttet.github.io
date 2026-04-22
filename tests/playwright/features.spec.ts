import { expect, test } from '@playwright/test';

const BLOG_INIT_POST = '/blog/2026-04-12-blog-initialization';
const ARCHITECTURE_POST = '/blog/2026-04-20-architecture-and-stack';

test.describe('Features', () => {
  test('command palette opens and searches', async ({ page }) => {
    await page.goto('/');

    await page
      .getByRole('button', { name: 'Search (⌘K)' })
      .evaluate((button: HTMLButtonElement) => button.click());
    const dialog = page.getByRole('dialog', { name: 'Search posts' });
    await expect(dialog).toBeVisible();

    await expect(page.getByText('Browse by tag')).toBeVisible();

    const input = page.getByPlaceholder('Search posts…');
    await input.fill('architecture');

    await expect(page.locator('#search-result-0')).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(ARCHITECTURE_POST);
    await expect(dialog).not.toBeVisible();
  });

  test('theme toggle works and persists', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');

    await expect(html).toHaveClass(/dark/);

    const toggle = page.getByRole('button', { name: 'Toggle theme' });
    await toggle.evaluate((button: HTMLButtonElement) => button.click());
    await expect(html).not.toHaveClass(/dark/);

    await page.reload();
    await expect(html).not.toHaveClass(/dark/);

    await page
      .getByRole('button', { name: 'Toggle theme' })
      .evaluate((button: HTMLButtonElement) => button.click());
    await expect(html).toHaveClass(/dark/);
  });

  test('reading mode toggle simplifies layout', async ({ page }) => {
    await page.goto(BLOG_INIT_POST);

    await page
      .getByRole('button', { name: 'Settings' })
      .evaluate((button: HTMLButtonElement) => button.click());

    const readingToggle = page.getByRole('button', { name: 'Toggle reading mode' });
    await readingToggle.evaluate((button: HTMLButtonElement) => button.click());
    await expect.poll(() => page.evaluate(() => localStorage.getItem('readingMode'))).toBe('true');

    await readingToggle.evaluate((button: HTMLButtonElement) => button.click());
    await expect.poll(() => page.evaluate(() => localStorage.getItem('readingMode'))).toBe('false');
  });
});

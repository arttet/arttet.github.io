import { expect, test } from '@playwright/test';

test.describe('Blog listing', () => {
  test('shows blog page with posts', async ({ page }) => {
    await page.goto('/blog');

    await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible();

    await expect(page.locator('article').first()).toBeVisible();
  });

  test('post card has title, date, tags and reading time', async ({ page }) => {
    await page.goto('/blog');

    const firstPost = page.locator('article').first();
    await expect(firstPost).toBeVisible();

    await expect(firstPost.locator('h2')).toBeVisible();
    await expect(firstPost.locator('time')).toBeVisible();
    await expect(firstPost.getByText(/min read/)).toBeVisible();
    await expect(firstPost.locator('a[href^="/blog/tag/"]').first()).toBeVisible();
  });

  test('clicking a tag navigates to filtered view', async ({ page }) => {
    await page.goto('/blog');

    const firstTag = page.locator('article').first().locator('a[href^="/blog/tag/"]').first();
    await firstTag.click();
    await page.waitForURL(/\/blog\/tag\//);

    await expect(page.getByText('Filtering by')).toBeVisible();
  });

  test('clicking a post navigates to post page', async ({ page }) => {
    await page.goto('/blog');

    await page.locator('article').first().locator('h2 a').click();

    await expect(page).toHaveURL(/\/blog\//);
    await expect(page.locator('article.max-w-3xl')).toBeVisible();
  });
});

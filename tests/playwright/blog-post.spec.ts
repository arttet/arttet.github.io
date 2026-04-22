import { expect, test } from '@playwright/test';

const BLOG_INIT_POST = '/blog/2026-04-12-blog-initialization';

test.describe('Blog post', () => {
  test('renders post with title, date, tags and content', async ({ page }) => {
    await page.goto(BLOG_INIT_POST);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('time').first()).toBeVisible();
    await expect(page.getByText(/min read/)).toBeVisible();
    await expect(page.locator('a[href^="/blog/tag/"]').first()).toBeVisible();
    const article = page.locator('article');
    await expect(article).toBeVisible();
  });

  test('back link returns to blog listing', async ({ page }) => {
    await page.goto(BLOG_INIT_POST);

    await page
      .getByRole('link', { name: 'Back to blog' })
      .evaluate((link: HTMLAnchorElement) => link.click());
    await expect(page).toHaveURL(/\/blog$/);
  });

  test('code blocks are rendered', async ({ page }) => {
    await page.goto(BLOG_INIT_POST);

    const codeBlocks = page.locator('pre.shiki');
    await expect(codeBlocks.first()).toBeVisible();
  });

  test('math formulas are rendered', async ({ page }) => {
    await page.goto(BLOG_INIT_POST);

    await expect(page.locator('.katex-display').first()).toBeVisible();
    await expect(page.locator('.katex').first()).toBeVisible();
  });

  test('tag link navigates to filtered blog', async ({ page }) => {
    await page.goto(BLOG_INIT_POST);

    const firstTag = page.locator('a[href^="/blog/tag/"]').first();
    await firstTag.evaluate((link: HTMLAnchorElement) => link.click());
    await page.waitForURL(/\/blog\/tag\//);
  });
});

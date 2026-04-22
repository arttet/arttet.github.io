import { expect, test } from '@playwright/test';

const BLOG_INIT_POST = '/blog/2026-04-12-blog-initialization';

test.describe('Post Interaction', () => {
  test('copy button in code blocks works', async ({ page }) => {
    await page.goto(BLOG_INIT_POST);

    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: () => Promise.resolve(),
          readText: () => Promise.resolve(''),
        },
      });
    });

    const tabs = page.locator('[data-code-tabs-content]').first();
    await tabs.hover();

    const copyButton = tabs.locator('.copy-btn').first();
    await expect(copyButton).toBeVisible();

    await copyButton.evaluate((button: HTMLButtonElement) => button.click());

    await expect(copyButton).toContainText('Copied!');
    await expect(copyButton).toHaveAttribute('data-copied', '');

    await expect(copyButton).not.toHaveAttribute('data-copied', '', { timeout: 2500 });
  });

  test('back to top button works', async ({ page }) => {
    await page.goto(BLOG_INIT_POST);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const topButton = page.getByRole('button', { name: /Top/ });
    await expect(topButton).toBeVisible();

    await topButton.evaluate((button: HTMLButtonElement) => button.click());

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(100);
  });
});

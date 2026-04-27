import { expect, test } from '@playwright/test';

const POST = '/blog/2026-04-12-blog-initialization';

test.describe('Anchor Navigation', () => {
  test('clicking an anchor link scrolls to the heading without resetting to top', async ({
    page,
  }) => {
    await page.goto(POST);

    const h2 = page.locator('h2[id]').first();
    const h2Id = await h2.getAttribute('id');
    expect(h2Id).toBeTruthy();

    const anchor = h2.locator('a.anchor');
    await anchor.click();

    await expect(page).toHaveURL(new RegExp(`#${h2Id}$`));

    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 2000 })
      .toBeGreaterThan(0);

    const { scrollY, h2Top } = await page.evaluate((id) => {
      const el = document.getElementById(id!);
      return {
        scrollY: window.scrollY,
        h2Top: el ? el.getBoundingClientRect().top + window.scrollY : 0,
      };
    }, h2Id);

    expect(Math.abs(scrollY - h2Top)).toBeLessThan(100);
  });

  test('navigating directly to a deep anchor scrolls to that section', async ({ page }) => {
    await page.goto(`${POST}#markdown-kitchen-sink`);

    await expect(page).toHaveURL(/#markdown-kitchen-sink$/);

    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 2000 })
      .toBeGreaterThan(500);
  });
});

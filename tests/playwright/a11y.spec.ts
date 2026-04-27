import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const BLOG_POST_PATH = '/blog/2026-04-12-blog-initialization';

async function expectNoCriticalViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === 'critical');
  expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
}

test.describe('Accessibility (axe-core)', () => {
  test('homepage has no critical violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoCriticalViolations(page);
  });

  test('blog post has no critical violations', async ({ page }) => {
    await page.goto(BLOG_POST_PATH);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoCriticalViolations(page);
  });
});

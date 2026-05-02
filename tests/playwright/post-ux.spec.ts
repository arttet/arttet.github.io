import { expect, test, type Page } from '@playwright/test';

const SEED_POSTS = [
  { slug: '2026-04-12-blog-initialization', url: '/blog/2026-04-12-blog-initialization' },
  { slug: '2026-04-20-architecture-and-stack', url: '/blog/2026-04-20-architecture-and-stack' },
] as const;

const THEMES = ['light', 'dark'] as const;

async function preparePage(page: Page, theme: (typeof THEMES)[number]) {
  await page.addInitScript((t) => {
    localStorage.setItem('theme', t);
    localStorage.setItem('readingMode', 'true');
  }, theme);
}

async function hideChrome(page: Page) {
  await page.addStyleTag({
    content: 'header, footer, aside { display: none !important; }',
  });
}

async function waitForContentSettled(page: Page) {
  await page.waitForFunction(() => {
    const diagrams = document.querySelectorAll('.mermaid');
    if (diagrams.length === 0) {
      return true;
    }
    return Array.from(diagrams).every((el) => (el as HTMLElement).dataset.processed === 'true');
  });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  );
}

test.describe('Post UX — reading-mode visual regression', () => {
  for (const post of SEED_POSTS) {
    for (const theme of THEMES) {
      test(`${post.slug} — ${theme}`, async ({ page }, testInfo) => {
        test.skip(
          testInfo.project.name !== 'chrome-desktop',
          'visual regression validated on chrome-desktop only'
        );

        await preparePage(page, theme);
        await page.goto(post.url);
        await page.waitForLoadState('networkidle');

        await expect(
          page.locator('canvas, div[aria-hidden="true"][style*="background-image"]')
        ).toHaveCount(0);

        await page.evaluate(() => document.fonts.ready);
        await waitForContentSettled(page);
        await hideChrome(page);

        await expect(page).toHaveScreenshot(`${post.slug}-${theme}.png`, {
          fullPage: true,
          animations: 'disabled',
          mask: [page.locator('time')],
          timeout: 15_000,
        });
      });
    }
  }
});

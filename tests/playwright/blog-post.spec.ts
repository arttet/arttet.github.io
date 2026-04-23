import { expect, test } from '@playwright/test';

const BLOG_INIT_POST = '/blog/2026-04-12-blog-initialization';

test.describe.fixme('Blog post', () => {
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
    await expect(page).toHaveURL(/\/blog\/?$/);
  });

  test('code blocks are rendered', async ({ page }) => {
    await page.goto(BLOG_INIT_POST);

    const codeBlocks = page.locator('pre.shiki');
    await expect(codeBlocks.first()).toBeVisible();

    const firstCodeBlock = codeBlocks.first();
    await expect(firstCodeBlock).toContainText('fmt.Println("Hello, World!")');

    const firstCodeText = await firstCodeBlock.locator('code').textContent();
    expect(firstCodeText).toContain('\n');

    const whiteSpace = await firstCodeBlock.evaluate((node) => getComputedStyle(node).whiteSpace);
    expect(['pre', 'pre-wrap', 'break-spaces']).toContain(whiteSpace);
  });

  test('tabbed code preserves multiline formatting', async ({ page }) => {
    await page.goto(BLOG_INIT_POST);

    const tabbedPanel = page.locator('[data-code-tabs-content]').first();
    const tabbedCode = tabbedPanel.locator('pre.shiki').first();
    await expect(tabbedCode).toBeVisible();

    const text = await tabbedCode.locator('code').textContent();
    expect(text).toContain('\n');
    expect(text).toContain('\tlo, hi := 0, len(nums)-1');

    const whiteSpace = await tabbedCode.evaluate((node) => getComputedStyle(node).whiteSpace);
    expect(['pre', 'pre-wrap', 'break-spaces', 'pre-line', 'normal']).toContain(whiteSpace);
  });

  test('math formulas are rendered', async ({ page }) => {
    await page.goto(BLOG_INIT_POST);

    await expect(page.locator('.katex-display').first()).toBeVisible();
    await expect(page.locator('.katex').first()).toBeVisible();
  });

  test('markdown kitchen sink elements are rendered', async ({ page }) => {
    await page.goto(BLOG_INIT_POST);

    const article = page.locator('article');

    await expect(article.getByRole('heading', { name: 'Markdown Kitchen Sink' })).toBeVisible();
    await expect(article.locator('blockquote')).toBeVisible();
    await expect(article.locator('ul').first()).toBeVisible();
    await expect(article.locator('ol')).toBeVisible();
    await expect(article.locator('table')).toBeVisible();
    await expect(article.locator('thead')).toBeVisible();
    await expect(article.locator('tbody')).toBeVisible();
    await expect(article.locator('hr')).toBeVisible();
    await expect(article.getByRole('cell', { name: 'Lists' })).toBeVisible();
    await expect(article.getByRole('cell', { name: 'Ready' }).first()).toBeVisible();
  });

  test('tag link navigates to filtered blog', async ({ page }) => {
    await page.goto(BLOG_INIT_POST);

    const firstTag = page.locator('a[href^="/blog/tag/"]').first();
    await firstTag.evaluate((link: HTMLAnchorElement) => link.click());
    await page.waitForURL(/\/blog\/tag\//);
  });
});

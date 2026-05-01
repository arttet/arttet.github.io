// @vitest-environment node
import katex from 'katex';
import { describe, expect, it, vi } from 'vitest';
import { mathPreprocess } from './math-preprocessor';

describe('math-preprocessor errors', () => {
  const markup = mathPreprocess().markup;

  if (!markup) {
    throw new Error('mathPreprocess markup preprocessor is not available');
  }

  it('handles KaTeX render errors for display math', async () => {
    vi.spyOn(katex, 'renderToString').mockImplementationOnce(() => {
      throw new Error('katex fail');
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const content = '$$fail$$';
    const result = await markup({ content, filename: 'test.md' });

    expect(result?.code).toContain('<code>$$fail$$</code>');
    expect(consoleSpy).toHaveBeenCalledWith('KaTeX display render failed:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('handles KaTeX render errors for inline math', async () => {
    vi.spyOn(katex, 'renderToString').mockImplementationOnce(() => {
      throw new Error('katex fail');
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const content = '$fail$';
    const result = await markup({ content, filename: 'test.md' });

    expect(result?.code).toContain('<MathCopy display={false}');
    expect(consoleSpy).toHaveBeenCalledWith('KaTeX inline render failed:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('converts :::code-tabs blocks into static highlighted markup', async () => {
    const content = `:::code-tabs
\`\`\`go title="Go"
func main() {}
\`\`\`

\`\`\`rust title="Rust"
fn main() {}
\`\`\`
:::`;
    const result = await markup({ content, filename: 'test.md' });

    expect(result?.code).not.toContain("import CodeTabs from '$shared/ui/CodeTabs.svelte';");
    expect(result?.code).toContain("import StaticHtml from '$shared/ui/StaticHtml.svelte';");
    expect(result?.code).not.toContain('<CodeTabs tabs={[');
    expect(result?.code).toContain('<StaticHtml html={`');
    expect(result?.code).toContain('role="tablist"');
    expect(result?.code).toContain('role="tab"');
    expect(result?.code).toContain('role="tabpanel"');
    expect(result?.code).toContain('aria-selected="true"');
    expect(result?.code).toContain('aria-controls=');
    expect(result?.code).toContain('data-code-tabs-content');
    expect(result?.code).toContain('data-language="go"');
    expect(result?.code).toContain('data-language="rust"');
    expect(result?.code).toContain('func main() {}');
    expect(result?.code).toContain('Rust');
  });

  it('does not parse $-prefixed code inside :::code-tabs as math', async () => {
    const content = `Inline math: $E = mc^2$

:::code-tabs
\`\`\`ts title="Svelte"
const count = $state(0);
const home = '$HOME';
\`\`\`
:::`;
    const result = await markup({ content, filename: 'test.md' });

    expect(result?.code).not.toContain("import CodeTabs from '$shared/ui/CodeTabs.svelte';");
    expect(result?.code).toContain("import StaticHtml from '$shared/ui/StaticHtml.svelte';");
    expect(result?.code).toContain("import MathCopy from '$shared/ui/MathCopy.svelte';");
    expect(result?.code).toContain("import KaTeXStyles from '$shared/ui/KaTeXStyles.svelte';");
    expect(result?.code).toContain('<KaTeXStyles />');
    expect(result?.code).toContain('Inline math: <MathCopy display={false}');
    expect(result?.code).toContain('const count = $state(0);');
    expect(result?.code).toContain("const home = '$HOME';");
    expect(result?.code).not.toContain('const count = <MathCopy');
    expect(result?.code).not.toContain("const home = '<MathCopy");
  });

  it('keeps replacement tokens inside :::code-tabs code untouched', async () => {
    const content = `:::code-tabs
\`\`\`ts title="Tokens"
const token = '$&';
\`\`\`
:::`;
    const result = await markup({ content, filename: 'test.md' });

    expect(result?.code).toContain("const token = '$&amp;';");
  });

  it('keeps display math outside :::code-tabs while leaving tab code untouched', async () => {
    const content = `:::code-tabs
\`\`\`ts title="Svelte"
const value = $derived(items.length);
\`\`\`
:::

$$
\\\\frac{n!}{k!(n-k)!}
$$`;
    const result = await markup({ content, filename: 'test.md' });

    expect(result?.code).toContain('const value = $derived(items.length);');
    expect(result?.code).toContain('<MathCopy display={true}');
    expect(result?.code).toContain('<KaTeXStyles />');
    expect(result?.code).not.toContain('const value = <MathCopy');
  });

  it('inserts imports into uppercase svelte script tags', async () => {
    const content = `<SCRIPT lang="js" generics="T">
  const existing = true;
</SCRIPT  >

Inline math: $E = mc^2$`;
    const result = await markup({ content, filename: 'test.md' });

    expect(result?.code).toContain(
      '<SCRIPT lang="js" generics="T">\n  import MathCopy from \'$shared/ui/MathCopy.svelte\';'
    );
    expect(result?.code).toContain('</SCRIPT  >\n\n<KaTeXStyles />');
    expect(result?.code).not.toContain('<script>');
  });

  it('does not treat script-like html as a svelte script block', async () => {
    const content = `Text <script src="https://example.com/x.js"></script>

Inline math: $E = mc^2$`;
    const result = await markup({ content, filename: 'test.md' });

    expect(result?.code).toMatch(
      /^<script>\n  import MathCopy from '\$shared\/ui\/MathCopy\.svelte';/
    );
    expect(result?.code).toContain('<script src="https://example.com/x.js"></script>');
  });

  it('does not inject template imports into module scripts', async () => {
    const content = `<script module>
  export const prerender = true;
</script>

Inline math: $E = mc^2$`;
    const result = await markup({ content, filename: 'test.md' });

    expect(result?.code).toMatch(
      /^<script>\n  import MathCopy from '\$shared\/ui\/MathCopy\.svelte';/
    );
    expect(result?.code).toContain('<script module>');
  });

  it('ignores script tags inside comments and code examples', async () => {
    const content = `<!-- <script></script> -->

\`\`\`html
<script></script>
\`\`\`

<script title="actual">
  const existing = true;
</script>

Inline math: $E = mc^2$`;
    const result = await markup({ content, filename: 'test.md' });

    expect(result?.code).toContain(
      '<script title="actual">\n  import MathCopy from \'$shared/ui/MathCopy.svelte\';'
    );
    expect(result?.code).toContain('<!-- <script></script> -->');
    expect(result?.code).toContain('```html\n<script></script>\n```');
  });

  it('handles quoted angle brackets and attribute text without false src matches', async () => {
    const content = `<script title="> src is mentioned here">
  const existing = true;
</script>

Inline math: $E = mc^2$`;
    const result = await markup({ content, filename: 'test.md' });

    expect(result?.code).toContain(
      '<script title="> src is mentioned here">\n  import MathCopy from \'$shared/ui/MathCopy.svelte\';'
    );
    expect(result?.code).toContain('</script>\n\n<KaTeXStyles />');
  });
});

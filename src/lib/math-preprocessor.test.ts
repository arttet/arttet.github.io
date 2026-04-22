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

  it('converts :::code-tabs blocks into CodeTabs component markup', async () => {
    const content = `:::code-tabs
\`\`\`go title="Go"
func main() {}
\`\`\`

\`\`\`rust title="Rust"
fn main() {}
\`\`\`
:::`;
    const result = await markup({ content, filename: 'test.md' });

    expect(result?.code).toContain("import CodeTabs from '$shared/ui/CodeTabs.svelte';");
    expect(result?.code).toContain('<CodeTabs tabs={[');
    expect(result?.code).toContain("lang: 'go'");
    expect(result?.code).toContain("label: 'Go'");
    expect(result?.code).toContain('func main() {}');
    expect(result?.code).toContain("lang: 'rust'");
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

    expect(result?.code).toContain("import CodeTabs from '$shared/ui/CodeTabs.svelte';");
    expect(result?.code).toContain("import MathCopy from '$shared/ui/MathCopy.svelte';");
    expect(result?.code).toContain('Inline math: <MathCopy display={false}');
    expect(result?.code).toContain('const count = $state(0);');
    expect(result?.code).toContain("const home = '$HOME';");
    expect(result?.code).not.toContain('const count = <MathCopy');
    expect(result?.code).not.toContain("const home = '<MathCopy");
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
    expect(result?.code).not.toContain('const value = <MathCopy');
  });
});

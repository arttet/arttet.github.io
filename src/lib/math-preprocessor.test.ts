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
});

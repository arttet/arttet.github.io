import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CodeBlock from './CodeBlock.svelte';

const hlMock = {
  value: '',
  highlight: vi.fn(),
};

vi.mock('../core/useHighlighter.svelte', () => ({
  useHighlighter: () => hlMock,
}));

describe('CodeBlock', () => {
  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
    hlMock.value = '';
    hlMock.highlight.mockClear();
  });

  it('renders fallback code correctly before highlighting', () => {
    const code = 'const x = 1;';
    render(CodeBlock, { code, lang: 'javascript' });

    expect(screen.getByText(code)).toBeInTheDocument();
    expect(hlMock.highlight).toHaveBeenCalledWith(code, 'javascript');
  });

  it('renders highlighted code when highlighter returns a value', async () => {
    hlMock.value = `<pre class="shiki"><code>const x = 1;</code></pre>`;
    const code = 'const x = 1;';

    render(CodeBlock, { code, lang: 'javascript' });

    const pre = document.querySelector('pre.shiki');
    expect(pre).toBeInTheDocument();
    expect(pre).toHaveClass('m-0');
    expect(pre).toHaveAttribute('tabindex', '-1');
  });

  it('copies code to clipboard when clicked', async () => {
    const code = 'print("hello")';
    render(CodeBlock, { code, lang: 'python' });

    const button = screen.getByLabelText('Copy python');
    await fireEvent.click(button);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(code);
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('trims fallback code rendering before highlighting resolves', () => {
    render(CodeBlock, { code: '\nconst y = 2;\n', lang: 'typescript' });

    const code = document.querySelector('pre code');
    expect(code?.textContent).toBe('const y = 2;');
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CodeBlock from './CodeBlock.svelte';

// Mock highlighter locally for component test
vi.mock('$lib/highlighter', () => ({
  getHighlighter: vi.fn().mockImplementation(() => Promise.resolve({})),
  loadLanguage: vi.fn().mockImplementation(() => Promise.resolve()),
  setThemes: vi.fn(),
  highlightCode: vi
    .fn()
    .mockImplementation((code: string) => `<pre class="shiki"><code>${code}</code></pre>`),
  LANGS: ['typescript', 'python', 'rust'],
}));

describe('CodeBlock', () => {
  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('renders code correctly before highlighting', () => {
    const code = 'const x = 1;';
    render(CodeBlock, { code, lang: 'javascript' });

    expect(screen.getByText(code)).toBeInTheDocument();
  });

  it('renders highlighted code after highlighter loads', async () => {
    const code = 'const x = 1;';
    render(CodeBlock, { code, lang: 'javascript' });

    await waitFor(() => {
      const shiki = document.querySelector('.shiki');
      expect(shiki).toBeInTheDocument();
    });

    expect(document.querySelector('.shiki')).toHaveClass('m-0');
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

  it('renders fallback if highlighter returns empty value', async () => {
    const { highlightCode } = await import('$lib/highlighter');
    vi.mocked(highlightCode).mockReturnValueOnce('');

    render(CodeBlock, { code: 'fallback', lang: 'js' });

    expect(screen.getByText('fallback')).toBeInTheDocument();
    expect(document.querySelector('pre')).toHaveClass('shiki');
  });
});

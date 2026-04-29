import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CodeTabs from './CodeTabs.svelte';

// Mock highlighter locally
vi.mock('$lib/highlighter', () => ({
  getHighlighter: vi.fn().mockImplementation(() => Promise.resolve({})),
  loadLanguage: vi.fn().mockImplementation(() => Promise.resolve()),
  setThemes: vi.fn(),
  highlightCode: vi
    .fn()
    .mockImplementation((code: string) => `<pre class="shiki"><code>${code}</code></pre>`),
  LANGS: ['ts', 'go'],
}));

describe('CodeTabs', () => {
  const tabs = [
    { lang: 'ts', label: 'TypeScript', code: 'const x = 1;' },
    { lang: 'go', label: 'Go', code: 'package main' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('renders labels correctly', () => {
    render(CodeTabs, { tabs });
    expect(screen.getAllByText('TypeScript')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Go')[0]).toBeInTheDocument();
  });

  it('keeps language tabs in keyboard tab order before copy', () => {
    render(CodeTabs, { tabs });
    expect(screen.getByRole('button', { name: 'TypeScript' })).not.toHaveAttribute('tabindex');
    expect(screen.getByRole('button', { name: 'Go' })).not.toHaveAttribute('tabindex');
    expect(screen.getByLabelText('Copy TypeScript')).not.toHaveAttribute('tabindex');
  });

  it('switches tabs on click', async () => {
    render(CodeTabs, { tabs });

    // Initially TS is active
    expect(screen.getByText('const x = 1;')).toBeInTheDocument();

    // Click Go tab
    await fireEvent.click(screen.getByText('Go'));

    expect(screen.getByText('package main')).toBeInTheDocument();
  });

  it('copies active tab code', async () => {
    render(CodeTabs, { tabs });

    const copyButton = screen.getByLabelText('Copy TypeScript');
    await fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const x = 1;');
  });

  it('renders highlighted code', async () => {
    render(CodeTabs, { tabs });

    await waitFor(() => {
      const shiki = document.querySelector('.shiki');
      expect(shiki).toBeInTheDocument();
    });

    expect(document.querySelector('.shiki')).toHaveClass('m-0');
    expect(document.querySelector('.shiki')).toHaveAttribute('tabindex', '-1');
  });

  it('falls back to the language name when the label is empty', () => {
    render(CodeTabs, {
      tabs: [{ lang: 'bash', label: '', code: 'echo hello' }],
    });

    expect(screen.getByLabelText('Copy bash')).toBeInTheDocument();
  });

  it('updates highlighting when switching tabs', async () => {
    const { highlightCode } = await import('$lib/highlighter');
    render(CodeTabs, { tabs });

    // Wait for initial render highlight
    await waitFor(() => {
      expect(highlightCode).toHaveBeenCalledWith('const x = 1;', 'ts');
    });

    vi.mocked(highlightCode).mockClear();
    await fireEvent.click(screen.getByText('Go'));

    await waitFor(() => {
      expect(highlightCode).toHaveBeenCalledWith('package main', 'go');
    });
  });
});

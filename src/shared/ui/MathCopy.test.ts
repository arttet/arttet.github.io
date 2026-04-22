import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MathCopy from './MathCopy.svelte';

// Helper to encode to base64 for tests
const toB64 = (str: string) => btoa(unescape(encodeURIComponent(str)));

describe('MathCopy', () => {
  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('renders inline math correctly', () => {
    const latex = '\\sum x';
    const html = '<span class="katex">...</span>';

    render(MathCopy, {
      display: false,
      b64Latex: toB64(latex),
      b64Html: toB64(html),
    });

    expect(screen.getByText('...')).toBeInTheDocument();
    const button = screen.getByLabelText('Copy LaTeX');
    expect(button).toBeInTheDocument();
  });

  it('renders display math correctly', () => {
    const latex = '\\int f(x) dx';
    const html = '<div class="katex-display">...</div>';

    render(MathCopy, {
      display: true,
      b64Latex: toB64(latex),
      b64Html: toB64(html),
    });

    expect(screen.getByText('...')).toBeInTheDocument();
    const button = screen.getByLabelText('Copy LaTeX');
    expect(button).toBeInTheDocument();
  });

  it('copies LaTeX to clipboard when clicked', async () => {
    const latex = 'E = mc^2';
    const html = '<span>...</span>';

    render(MathCopy, {
      display: false,
      b64Latex: toB64(latex),
      b64Html: toB64(html),
    });

    const button = screen.getByLabelText('Copy LaTeX');
    await fireEvent.click(button);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(latex);

    // Check for the check icon (it has the class 'lucide-check')
    const icon = document.querySelector('.lucide-check');
    expect(icon).toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CopyButton from './CopyButton.svelte';

describe('CopyButton', () => {
  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('renders correctly with label', () => {
    render(CopyButton, { content: 'test code', label: 'JS' });
    expect(screen.getByLabelText('Copy JS')).not.toHaveAttribute('tabindex');
    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  it('renders correctly without label (fallback)', () => {
    render(CopyButton, { content: 'test code' });
    expect(screen.getByLabelText('Copy')).toBeInTheDocument();
    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveClass('copy-btn');
  });

  it('copies content to clipboard when clicked', async () => {
    const content = 'hello world';
    render(CopyButton, { content, label: 'text' });

    const button = screen.getByLabelText('Copy text');
    await fireEvent.click(button);
    await new Promise((r) => setTimeout(r, 0)); // Flush pending promises for coverage

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(content);
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('renders inline version correctly', async () => {
    render(CopyButton, { content: 'test', inline: true, class: 'extra-class' });
    const button = screen.getByLabelText('Copy');
    expect(button).toHaveClass('copy-btn-inline');
    expect(button).toHaveClass('extra-class');
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument();

    await fireEvent.click(button);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test');
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument(); // Still shouldn't be there since inline=true
  });

  it('updates styling and aria-label gracefully when copied without label', async () => {
    render(CopyButton, { content: 'test', inline: true });
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Copy');

    await fireEvent.click(button);

    expect(button).toHaveAttribute('data-copied', '');
    expect(button).toHaveStyle('color: var(--color-accent)');
  });
});

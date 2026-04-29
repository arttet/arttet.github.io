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

  it('copies content to clipboard when clicked', async () => {
    const content = 'hello world';
    render(CopyButton, { content, label: 'text' });

    const button = screen.getByLabelText('Copy text');
    await fireEvent.click(button);

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
});

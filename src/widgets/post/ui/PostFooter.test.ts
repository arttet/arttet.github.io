import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import PostFooter from './PostFooter.svelte';

describe('PostFooter', () => {
  it('renders navigation links', () => {
    render(PostFooter);
    expect(screen.getByText('← All posts')).toBeInTheDocument();
    expect(screen.getByText('↑ Top')).toBeInTheDocument();
  });

  it('scrolls to top when button is clicked', async () => {
    const scrollToMock = vi.fn();
    window.scrollTo = scrollToMock;

    render(PostFooter);
    await fireEvent.click(screen.getByRole('button', { name: '↑ Top' }));

    expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});

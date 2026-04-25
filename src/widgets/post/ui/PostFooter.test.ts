import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import PostFooter from './PostFooter.svelte';

const mockPost = (slug: string, title: string) => ({
  slug,
  title,
  tags: [],
  created: '2026-01-01',
  readingTime: 1,
});

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

  it('renders no post navigation when prevPost and nextPost are absent', () => {
    render(PostFooter);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders prev post link when provided', () => {
    render(PostFooter, { prevPost: mockPost('old-post', 'Old Post') });
    expect(screen.getByText('Old Post')).toBeInTheDocument();
    expect(screen.getByText('← Older')).toBeInTheDocument();
  });

  it('renders next post link when provided', () => {
    render(PostFooter, { nextPost: mockPost('new-post', 'New Post') });
    expect(screen.getByText('New Post')).toBeInTheDocument();
    expect(screen.getByText('Newer →')).toBeInTheDocument();
  });

  it('renders both prev and next post links', () => {
    render(PostFooter, {
      prevPost: mockPost('old-post', 'Old Post'),
      nextPost: mockPost('new-post', 'New Post'),
    });
    expect(screen.getByText('Old Post')).toBeInTheDocument();
    expect(screen.getByText('New Post')).toBeInTheDocument();
  });
});

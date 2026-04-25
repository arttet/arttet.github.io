import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import PostFooter from './PostFooter.svelte';

const mockPost = (slug: string, title: string, summary?: string) => ({
  slug,
  title,
  tags: [],
  created: '2026-01-01',
  readingTime: 1,
  summary,
});

describe('PostFooter', () => {
  it('renders all posts link and top button', () => {
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

  it('renders prev card with label, title and summary', () => {
    render(PostFooter, { prevPost: mockPost('old', 'Old Post', 'A summary') });
    expect(screen.getByText('← Previous page')).toBeInTheDocument();
    expect(screen.getByText('Old Post')).toBeInTheDocument();
    expect(screen.getByText('A summary')).toBeInTheDocument();
  });

  it('renders prev card without summary when absent', () => {
    render(PostFooter, { prevPost: mockPost('old', 'Old Post') });
    expect(screen.getByText('← Previous page')).toBeInTheDocument();
    expect(screen.getByText('Old Post')).toBeInTheDocument();
  });

  it('renders next card with label and title', () => {
    render(PostFooter, { nextPost: mockPost('new', 'New Post', 'Next summary') });
    expect(screen.getByText('Next page →')).toBeInTheDocument();
    expect(screen.getByText('New Post')).toBeInTheDocument();
    expect(screen.getByText('Next summary')).toBeInTheDocument();
  });

  it('renders both prev and next cards', () => {
    render(PostFooter, {
      prevPost: mockPost('old', 'Old Post'),
      nextPost: mockPost('new', 'New Post'),
    });
    expect(screen.getByText('← Previous page')).toBeInTheDocument();
    expect(screen.getByText('Next page →')).toBeInTheDocument();
    expect(screen.getByText('Old Post')).toBeInTheDocument();
    expect(screen.getByText('New Post')).toBeInTheDocument();
  });

  it('prev card links to correct post', () => {
    render(PostFooter, { prevPost: mockPost('old-slug', 'Old Post') });
    expect(screen.getByRole('link', { name: /Old Post/ })).toHaveAttribute(
      'href',
      '/blog/old-slug'
    );
  });

  it('next card links to correct post', () => {
    render(PostFooter, { nextPost: mockPost('new-slug', 'New Post') });
    expect(screen.getByRole('link', { name: /New Post/ })).toHaveAttribute(
      'href',
      '/blog/new-slug'
    );
  });
});

import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import PostCard from '$entities/post/ui/PostCard.svelte';

describe('PostCard', () => {
  const mockPost = {
    slug: 'p1',
    title: 'Test Post',
    tags: ['t1'],
    created: '2026-04-21',
    readingTime: 5,
    summary: 'Test summary',
  };

  it('renders correctly', () => {
    render(PostCard, { post: mockPost });
    expect(screen.getByText('Test Post')).toBeInTheDocument();
  });

  it('uses the whole card link as the post focus target', () => {
    render(PostCard, { post: mockPost });

    const postLink = screen.getByRole('link', { name: 'Test Post' });

    expect(postLink).toHaveAttribute('href', '/blog/p1');
    expect(postLink).toHaveClass('absolute', 'inset-0');
    expect(screen.getByRole('heading', { name: 'Test Post' })).not.toContainElement(postLink);
  });

  it('shows expansion button and expands tags on click', async () => {
    render(PostCard, {
      post: { ...mockPost, tags: ['t1', 't2', 't3', 't4'] },
    });

    const btn = screen.getByRole('button', { name: /\+1 more/i });
    await fireEvent.click(btn);
    expect(screen.getByText('#t4')).toBeInTheDocument();
  });

  it('shows less button when tags are expanded', async () => {
    render(PostCard, {
      post: { ...mockPost, tags: ['t1', 't2', 't3', 't4'] },
    });

    await fireEvent.click(screen.getByRole('button', { name: /\+1 more/i }));
    expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
    expect(screen.getByText('#t4')).toBeInTheDocument();
  });
});

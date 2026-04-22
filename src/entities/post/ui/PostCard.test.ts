import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
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
    render(PostCard, {
      post: mockPost,
      index: 0,
      expandedTags: new Set<number>(),
      onToggleExpand: () => {},
    });
    expect(screen.getByText('Test Post')).toBeInTheDocument();
  });

  it('shows expansion button and handles expansion', async () => {
    const toggleSpy = vi.fn();
    render(PostCard, {
      post: {
        ...mockPost,
        tags: ['t1', 't2', 't3', 't4'],
      },
      index: 0,
      expandedTags: new Set<number>(),
      onToggleExpand: toggleSpy,
    });

    await fireEvent.click(screen.getByRole('button', { name: /\+1 more/i }));
    expect(toggleSpy).toHaveBeenCalledWith(0);
  });

  it('shows less button when tags are expanded', () => {
    render(PostCard, {
      post: {
        ...mockPost,
        tags: ['t1', 't2', 't3', 't4'],
      },
      index: 0,
      expandedTags: new Set<number>([0]),
      onToggleExpand: () => {},
    });

    expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
    expect(screen.getByText('#t4')).toBeInTheDocument();
  });
});

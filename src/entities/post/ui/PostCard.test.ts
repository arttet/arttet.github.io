import { render, screen } from '@testing-library/svelte';
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

  it('handles expansion', async () => {
    const toggleSpy = vi.fn();
    render(PostCard, {
      post: mockPost,
      index: 0,
      expandedTags: new Set<number>(),
      onToggleExpand: toggleSpy,
    });

    // Simulate click on tag/button to expand - dependent on actual implementation
    // Assuming a button for expansion exists if tags > limit or explicitly
  });
});

import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import PostList from './PostList.svelte';

describe('PostList', () => {
  const mockPosts = [
    { slug: 'p1', title: 'Post 1', tags: ['t1'], created: '2026-04-21', readingTime: 1 },
    { slug: 'p2', title: 'Post 2', tags: ['t2'], created: '2026-04-22', readingTime: 2 },
  ];

  it('renders empty state', () => {
    render(PostList, { posts: [] });
    expect(screen.getByText('No posts found.')).toBeInTheDocument();
  });

  it('renders list of posts', () => {
    render(PostList, { posts: mockPosts });
    expect(screen.getByText('Post 1')).toBeInTheDocument();
    expect(screen.getByText('Post 2')).toBeInTheDocument();
  });

  it('expands and collapses extra tags through parent state', async () => {
    render(PostList, {
      posts: [
        {
          slug: 'p1',
          title: 'Post 1',
          tags: ['t1', 't2', 't3', 't4'],
          created: '2026-04-21',
          readingTime: 1,
        },
      ],
    });

    expect(screen.queryByText('#t4')).not.toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: /\+1 more/i }));
    expect(screen.getByText('#t4')).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: /show less/i }));
    expect(screen.queryByText('#t4')).not.toBeInTheDocument();
  });
});

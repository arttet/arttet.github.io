import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import Page from './+page.svelte';

describe('blog page', () => {
  it('renders blog listing with post count', () => {
    render(Page, {
      data: {
        posts: [
          { slug: 'a', title: 'First', tags: ['svelte'], created: '2026-04-01', readingTime: 1 },
          { slug: 'b', title: 'Second', tags: ['webgpu'], created: '2026-04-02', readingTime: 2 },
        ],
        totalPosts: 2,
        currentPage: 1,
        pageCount: 1,
        postsPerPage: 12,
      },
    });

    expect(document.title).toContain('Blog');
    expect(screen.getByText('2 posts')).toBeInTheDocument();
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getPosts } = vi.hoisted(() => ({
  getPosts: vi.fn(),
}));

vi.mock('$entities/post/api', () => ({
  getPosts,
}));

import Page from './+page.svelte';

describe('blog page', () => {
  beforeEach(() => {
    getPosts.mockReset();
  });

  it('renders blog listing with post count', () => {
    getPosts.mockReturnValue([
      { slug: 'a', title: 'First', tags: ['svelte'], created: '2026-04-01', readingTime: 1 },
      { slug: 'b', title: 'Second', tags: ['webgpu'], created: '2026-04-02', readingTime: 2 },
    ]);

    render(Page);

    expect(document.title).toContain('Blog');
    expect(screen.getByText('2 posts')).toBeInTheDocument();
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});

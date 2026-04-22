import { render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getPosts } = vi.hoisted(() => ({
  getPosts: vi.fn(),
}));

vi.mock('$app/state', () => ({
  page: {
    params: { tag: 'sveltekit' },
    url: new URL('https://arttet.github.io/blog/tag/sveltekit'),
  },
}));

vi.mock('$entities/post/api', () => ({
  getPosts,
}));

import Page from './+page.svelte';

describe('tag page', () => {
  beforeEach(() => {
    getPosts.mockReset();
  });

  it('filters posts by current tag', () => {
    getPosts.mockReturnValue([
      {
        slug: 'one',
        title: 'Tagged',
        tags: ['sveltekit', 'blog'],
        created: '2026-04-01',
        readingTime: 1,
      },
      {
        slug: 'two',
        title: 'Other',
        tags: ['webgpu'],
        created: '2026-04-02',
        readingTime: 2,
      },
    ]);

    render(Page);

    expect(document.title).toContain('#sveltekit');
    expect(screen.getAllByText('#sveltekit')).toHaveLength(2);
    expect(screen.getByText('(1 post)')).toBeInTheDocument();
    expect(screen.getByText('Tagged')).toBeInTheDocument();
    expect(screen.queryByText('Other')).not.toBeInTheDocument();
  });
});

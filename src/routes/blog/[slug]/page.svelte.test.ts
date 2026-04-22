import { render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getPosts } = vi.hoisted(() => ({
  getPosts: vi.fn(),
}));

vi.mock('$app/state', () => ({
  page: {
    params: { slug: '2026-04-12-blog-initialization' },
    url: new URL('https://arttet.github.io/blog/2026-04-12-blog-initialization'),
  },
}));

vi.mock('$entities/post/api', () => ({
  getPosts,
}));

vi.mock('$shared/lib/actions/copy', () => ({
  copy: vi.fn(() => ({ destroy: vi.fn() })),
}));

vi.mock('$shared/lib/actions/mermaid', () => ({
  mermaid: vi.fn(() => ({ destroy: vi.fn() })),
}));

import Page from './+page.svelte';

describe('blog slug page', () => {
  beforeEach(() => {
    getPosts.mockReset();
  });

  it('renders post header and markdown content for matching slug', () => {
    getPosts.mockReturnValue([
      {
        slug: '2026-04-12-blog-initialization',
        title: 'Content Pipeline Is Ready',
        summary: 'A quick overview',
        tags: ['blog', 'content'],
        created: '2026-04-12',
        updated: '2026-04-21',
        readingTime: 2,
      },
    ]);

    render(Page);

    expect(screen.getByRole('heading', { name: 'Content Pipeline Is Ready' })).toBeInTheDocument();
    expect(screen.getByText('Code Formatting')).toBeInTheDocument();
    expect(screen.getByText('Public API & Resources')).toBeInTheDocument();
    expect(screen.getByText(/2 min read/i)).toBeInTheDocument();
  });

  it('renders nothing when post is missing', () => {
    getPosts.mockReturnValue([]);

    const { container } = render(Page);

    expect(container.textContent).toBe('');
    expect(container.querySelector('article')).toBe(null);
  });
});

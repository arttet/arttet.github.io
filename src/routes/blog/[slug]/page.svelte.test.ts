import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

vi.mock('$shared/lib/actions/copy', () => ({
  copy: vi.fn(() => ({ destroy: vi.fn() })),
}));

vi.mock('$shared/lib/actions/mermaid', () => ({
  mermaid: vi.fn(() => ({ destroy: vi.fn() })),
}));

import Page from './+page.svelte';

const mockPost = {
  slug: '2026-04-12-blog-initialization',
  title: 'Content Pipeline Is Ready',
  summary: 'A quick overview',
  tags: ['blog', 'content'],
  created: '2026-04-12',
  updated: '2026-04-21',
  readingTime: 2,
};

describe('blog slug page', () => {
  it('renders post header and markdown content for matching slug', () => {
    render(Page, {
      data: {
        post: mockPost,
        prevPost: undefined as any,
        nextPost: undefined as any,
      },
    });

    expect(screen.getByRole('heading', { name: /Content Pipeline Is Ready/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Code Formatting/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Public API & Resources/ })).toBeInTheDocument();
    expect(screen.getByText(/2 min read/i)).toBeInTheDocument();
  });

  it('renders table of contents before post content and footer navigation', async () => {
    const { container } = render(Page, {
      data: {
        post: mockPost,
        prevPost: undefined as any,
        nextPost: undefined as any,
      },
    });

    const toc = await waitFor(() => screen.getByRole('navigation', { name: 'Table of contents' }));
    const prose = container.querySelector('.prose');
    const postFooter = container.querySelector('article footer');

    expect(prose).toBeInTheDocument();
    expect(postFooter).toBeInTheDocument();
    expect(toc.closest('aside')).toHaveClass('lg:col-start-2');
    expect(toc.compareDocumentPosition(prose as Element)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(toc.compareDocumentPosition(postFooter as Element)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });
});

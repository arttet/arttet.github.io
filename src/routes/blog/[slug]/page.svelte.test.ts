import { render, screen } from '@testing-library/svelte';
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

    expect(screen.getByRole('heading', { name: 'Content Pipeline Is Ready' })).toBeInTheDocument();
    expect(screen.getByText('Code Formatting')).toBeInTheDocument();
    expect(screen.getByText('Public API & Resources')).toBeInTheDocument();
    expect(screen.getByText(/2 min read/i)).toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import PostHeader from './PostHeader.svelte';

describe('PostHeader', () => {
  const mockPost = {
    title: 'Test Post',
    slug: 'test-slug',
    tags: ['svelte', 'test'],
    created: '2026-04-21',
    readingTime: 5,
    summary: 'Test summary',
  };

  it('renders post details', () => {
    render(PostHeader, { post: mockPost });
    expect(screen.getByText('Test Post')).toBeInTheDocument();
    expect(screen.getByText('5 min read')).toBeInTheDocument();
    expect(screen.getByText('#svelte')).toBeInTheDocument();
  });

  it('prefers updated date when present', () => {
    render(PostHeader, {
      post: {
        ...mockPost,
        updated: '2026-04-22',
      },
    });

    expect(screen.getByText(/Updated April 22, 2026/i)).toBeInTheDocument();
  });

  it('toggles tags visibility when there are more than five tags', async () => {
    render(PostHeader, {
      post: {
        ...mockPost,
        tags: ['svelte', 'test', 'blog', 'webgpu', 'docs', 'tailwind'],
      },
    });

    expect(screen.queryByText('#tailwind')).not.toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: /\+1 more/i }));
    expect(screen.getByText('#tailwind')).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: /show less/i }));
    expect(screen.queryByText('#tailwind')).not.toBeInTheDocument();
  });

  it('updates reading progress on scroll', async () => {
    render(PostHeader, { post: mockPost });

    Object.defineProperty(document.documentElement, 'scrollTop', {
      value: 50,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 200,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 100,
      configurable: true,
    });

    await fireEvent.scroll(window);

    expect(document.querySelector('[aria-hidden="true"]')).toHaveAttribute('style', 'width: 50%;');
  });
});

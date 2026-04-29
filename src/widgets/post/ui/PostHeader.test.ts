import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
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
    expect(screen.getByRole('heading', { name: 'Test Post' })).toBeInTheDocument();
    expect(screen.getByText('5 min read')).toBeInTheDocument();
    expect(screen.getByText('#svelte')).toBeInTheDocument();
  });

  it('renders breadcrumb navigation', () => {
    render(PostHeader, { post: mockPost });

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(breadcrumb).toBeInTheDocument();
    expect(breadcrumb.querySelector('[aria-current="page"]')).toHaveTextContent('Test Post');
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

  it('computes milestones from .prose h2 positions via requestAnimationFrame', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    const prose = document.createElement('div');
    prose.className = 'prose';
    const h2 = document.createElement('h2');
    h2.textContent = 'Section';
    prose.appendChild(h2);
    document.body.appendChild(prose);

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', { value: 500, configurable: true });

    const { container } = render(PostHeader, { post: mockPost });

    expect(container.querySelector('.fixed.w-full[aria-hidden="true"]')).toBeInTheDocument();
    expect(container.querySelector('.fixed.w-full[aria-hidden="true"]')?.children).toHaveLength(1);

    document.body.removeChild(prose);
    rafSpy.mockRestore();
  });

  it('skips milestone computation when scroll height equals viewport', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 500,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', { value: 500, configurable: true });

    const { container } = render(PostHeader, { post: mockPost });

    expect(container.querySelector('.fixed.w-full[aria-hidden="true"]')).toBeNull();

    rafSpy.mockRestore();
  });

  it('renders without a summary block when post.summary is missing', () => {
    const { container } = render(PostHeader, {
      post: { ...mockPost, summary: undefined },
    });
    expect(container.querySelector('header p')).toBeNull();
  });

  it('renders without a TagList when post.tags is empty', () => {
    render(PostHeader, {
      post: { ...mockPost, tags: [] },
    });
    expect(screen.queryByText(/^#/)).not.toBeInTheDocument();
  });
});

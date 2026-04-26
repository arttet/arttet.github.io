import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import BlogHeader from './BlogHeader.svelte';

describe('BlogHeader', () => {
  it('renders title and count', () => {
    render(BlogHeader, { count: 5 });
    expect(screen.getByText('Blog')).toBeInTheDocument();
    expect(screen.getByText('5 posts')).toBeInTheDocument();
  });

  it('renders tag filter', () => {
    render(BlogHeader, { tag: 'svelte', count: 2 });
    expect(screen.getByText('#svelte')).toBeInTheDocument();
    expect(screen.getByText('(2 posts)')).toBeInTheDocument();
    expect(screen.getByText('✕ clear filter')).toBeInTheDocument();
  });

  it('uses singular "post" when count is 1', () => {
    render(BlogHeader, { count: 1 });
    expect(screen.getByText('1 post')).toBeInTheDocument();
  });

  it('uses singular "post" in tag filter when count is 1', () => {
    render(BlogHeader, { tag: 'svelte', count: 1 });
    expect(screen.getByText('(1 post)')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Breadcrumb from './Breadcrumb.svelte';

describe('Breadcrumb', () => {
  it('renders navigable parent items and the current page', () => {
    const { container } = render(Breadcrumb, {
      items: [
        { label: 'Home', href: '/', isHome: true },
        { label: 'Blog', href: '/blog' },
        { label: 'Architecture and Tech Stack' },
      ],
    });

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(breadcrumb).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('tabindex');
    expect(screen.getByRole('link', { name: 'Blog' })).not.toHaveAttribute('tabindex');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveTextContent('Home');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'data-sveltekit-preload-data',
      'hover'
    );
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute(
      'data-sveltekit-preload-data',
      'hover'
    );
    expect(container.querySelector('[aria-current="page"]')).toHaveTextContent(
      'Architecture and Tech Stack'
    );
    expect(container.querySelector('[aria-current="page"]')).toHaveAttribute(
      'title',
      'Architecture and Tech Stack'
    );
    expect(screen.queryByRole('link', { name: 'Architecture and Tech Stack' })).toBeNull();
  });

  it('renders an empty semantic breadcrumb when items are absent', () => {
    const { container } = render(Breadcrumb);

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(container.querySelectorAll('.breadcrumb-item')).toHaveLength(0);
  });

  it('keeps decorative separators and overflow outside the accessibility tree', () => {
    const { container } = render(Breadcrumb, {
      items: [
        { label: 'Home', href: '/', isHome: true },
        { label: 'Blog', href: '/blog' },
        { label: 'Post' },
      ],
    });

    expect(container.querySelectorAll('.with-separator')).toHaveLength(2);
    expect(container.querySelector('.breadcrumb-item.current')).toHaveTextContent('Post');
    expect(container.querySelector('.breadcrumb-item.current')).toHaveClass('current');
    expect(container.querySelector('.breadcrumb-item.home')).toBeInTheDocument();
    expect(container.querySelector('.breadcrumb-item')).toHaveStyle({ zIndex: '3' });
    expect(container.querySelector('.breadcrumb-item')).toHaveStyle({
      '--segment-bg': 'var(--breadcrumb-step-1)',
      '--segment-fg': 'var(--breadcrumb-fg-1)',
    });
    expect(container.querySelector('.breadcrumb')).toHaveClass('overflow-x-auto');
    expect(container.querySelector('ol')).toHaveClass('whitespace-nowrap');
    expect(container.querySelector('.crumb-text')).toHaveClass('crumb-text');
    expect(container).not.toHaveTextContent('→');
    expect(container).not.toHaveTextContent('');
  });
});

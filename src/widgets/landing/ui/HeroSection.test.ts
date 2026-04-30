// cspell:words noopener noreferrer
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

const { siteMock } = vi.hoisted(() => ({
  siteMock: {
    nav: {
      links: [
        { label: 'Blog', href: '/blog' },
        { label: 'About', href: '/about' },
      ],
    },
  },
}));

vi.mock('$shared/config/site', async (importOriginal) => {
  const actual = await importOriginal<typeof import('$shared/config/site')>();
  return {
    ...actual,
    site: {
      ...actual.site,
      nav: siteMock.nav,
    },
  };
});

import HeroSection from './HeroSection.svelte';

describe('HeroSection', () => {
  it('renders author name and title', () => {
    render(HeroSection);
    expect(screen.getByText(/Artyom Tetyukhin/i)).toBeInTheDocument();
    expect(screen.getByText(/Software Development Engineer/i)).toBeInTheDocument();
  });

  it('renders navigation links and correctly assigns data-focus-boundary-start', () => {
    render(HeroSection);
    const blogLink = screen.getByRole('link', { name: 'Blog' });
    const aboutLink = screen.getByRole('link', { name: 'About' });

    expect(blogLink).toBeInTheDocument();
    expect(blogLink).toHaveAttribute('data-focus-boundary-start', '');

    expect(aboutLink).toBeInTheDocument();
    expect(aboutLink).not.toHaveAttribute('data-focus-boundary-start');
  });

  it('renders correctly without links', () => {
    // Modify the mocked array before rendering
    siteMock.nav.links = [];
    render(HeroSection);
    expect(screen.queryByRole('link', { name: 'Blog' })).not.toBeInTheDocument();
  });

  it('renders external GitHub link correctly', () => {
    render(HeroSection);
    const gitHubLink = screen.getByLabelText('GitHub');
    expect(gitHubLink).toBeInTheDocument();
    expect(gitHubLink).toHaveAttribute('target', '_blank');
    expect(gitHubLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(gitHubLink.querySelector('svg')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import HeroSection from './HeroSection.svelte';

describe('HeroSection', () => {
  it('renders author name and title', () => {
    render(HeroSection);
    expect(screen.getByText(/Artyom Tetyukhin/i)).toBeInTheDocument();
    expect(screen.getByText(/Software Development Engineer/i)).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(HeroSection);
    expect(screen.getByRole('link', { name: 'Blog' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';

describe('about page', () => {
  it('renders intro and projects', () => {
    render(Page);

    expect(document.title).toContain('About');
    expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument();
    expect(
      screen.getByText(/Here I write about things in software engineering/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dotfiles/i })).toHaveAttribute(
      'href',
      'https://github.com/arttet/dotfiles'
    );
    expect(screen.getByRole('link', { name: /envctl/i })).toHaveAttribute(
      'href',
      'https://github.com/arttet/envctl'
    );
    expect(screen.getByText('configuration-management')).toBeInTheDocument();
    expect(screen.getByText('starship')).toBeInTheDocument();
  });
});

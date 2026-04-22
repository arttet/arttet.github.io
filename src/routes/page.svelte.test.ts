import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';

describe('home page', () => {
  it('renders hero content and sets title', () => {
    render(Page);

    expect(document.title).toContain('Artyom Tetyukhin');
    expect(screen.getByText('Artyom Tetyukhin')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'GitHub' })).toBeInTheDocument();
  });
});

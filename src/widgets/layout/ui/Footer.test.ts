import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Footer from './Footer.svelte';

describe('Footer', () => {
  it('renders copyright and license links', () => {
    render(Footer);

    expect(screen.getByText(/Artyom Tetyukhin/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'GPL-3.0-or-later' })).toHaveAttribute(
      'href',
      'https://www.gnu.org/licenses/gpl-3.0.en.html'
    );
    expect(screen.getByRole('link', { name: 'CC BY-NC-SA 4.0' })).toHaveAttribute(
      'href',
      'https://creativecommons.org/licenses/by-nc-sa/4.0/'
    );
    expect(screen.getByText('Unless otherwise noted.')).toBeInTheDocument();
  });
});

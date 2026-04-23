import { render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { viewportState } = vi.hoisted(() => ({
  viewportState: {
    footerVisible: true,
  },
}));

vi.mock('$shared/lib/viewport.svelte', () => ({
  viewport: viewportState,
}));

import Footer from './Footer.svelte';

describe('Footer', () => {
  beforeEach(() => {
    viewportState.footerVisible = true;
  });

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

  it('hides the footer when the viewport state says it should be hidden', () => {
    viewportState.footerVisible = false;
    const { container } = render(Footer);

    expect(container.firstElementChild?.className).toContain('translate-y-[calc(100%+1rem)]');
  });
});

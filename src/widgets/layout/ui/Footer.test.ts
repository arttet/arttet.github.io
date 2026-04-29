import { render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-29T00:00:00Z'));
    viewportState.footerVisible = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders copyright and license links', () => {
    const { container } = render(Footer);

    expect(screen.getByText('© 2026 Artyom Tetyukhin')).toBeInTheDocument();
    expect(container.textContent).toContain(
      'Code: GPL-3.0-or-later • Content: CC BY-NC-SA 4.0 • Unless otherwise noted.'
    );
    expect(screen.getByRole('link', { name: 'GPL-3.0-or-later' })).toHaveAttribute(
      'href',
      'https://www.gnu.org/licenses/gpl-3.0.en.html'
    );
    expect(screen.getByRole('link', { name: 'GPL-3.0-or-later' })).toHaveAttribute(
      'tabindex',
      '-1'
    );
    expect(screen.getByRole('link', { name: 'CC BY-NC-SA 4.0' })).toHaveAttribute(
      'href',
      'https://creativecommons.org/licenses/by-nc-sa/4.0/'
    );
    expect(screen.getByRole('link', { name: 'CC BY-NC-SA 4.0' })).toHaveAttribute('tabindex', '-1');
  });

  it('hides the footer when the viewport state says it should be hidden', () => {
    viewportState.footerVisible = false;
    const { container } = render(Footer);

    expect(container.firstElementChild?.className).toContain('translate-y-[calc(100%+1rem)]');
  });
});

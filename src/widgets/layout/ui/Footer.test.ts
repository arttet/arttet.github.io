import { tick } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { viewport } from '$shared/lib/viewport.svelte';

import Footer from './Footer.svelte';

describe('Footer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-29T00:00:00Z'));
    viewport.footerVisible = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders copyright and license links', () => {
    const { container } = render(Footer);

    expect(screen.getByText('© 2026 Artyom Tetyukhin')).toBeInTheDocument();
    expect(container.textContent).toContain(
      'Code: AGPL-3.0 • Content: CC BY-NC-SA 4.0 • Unless otherwise noted.'
    );
    expect(screen.getByRole('link', { name: 'AGPL-3.0' })).toHaveAttribute(
      'href',
      'https://www.gnu.org/licenses/agpl-3.0.en.html'
    );
    expect(screen.getByRole('link', { name: 'AGPL-3.0' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('link', { name: 'CC BY-NC-SA 4.0' })).toHaveAttribute(
      'href',
      'https://creativecommons.org/licenses/by-nc-sa/4.0/'
    );
    expect(screen.getByRole('link', { name: 'CC BY-NC-SA 4.0' })).toHaveAttribute('tabindex', '-1');
  });

  it('hides the footer when the viewport state says it should be hidden', async () => {
    const { container } = render(Footer);
    expect(container.firstElementChild?.className).toContain('translate-y-0');

    viewport.footerVisible = false;
    await tick();

    expect(container.firstElementChild?.className).toContain('translate-y-[calc(100%+1rem)]');
  });

  it('shows the footer when the viewport state says it should be shown', async () => {
    viewport.footerVisible = false;
    const { container } = render(Footer);
    expect(container.firstElementChild?.className).toContain('translate-y-[calc(100%+1rem)]');

    viewport.footerVisible = true;
    await tick();

    expect(container.firstElementChild?.className).toContain('translate-y-0');
  });

  it('unmounts cleanly', () => {
    const { unmount } = render(Footer);
    unmount();
  });
});

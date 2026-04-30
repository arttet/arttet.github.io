import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { viewport } from '$shared/lib/viewport.svelte';

// Mock Search results and Theme
vi.mock('$features/search/model/searchModel.svelte', () => ({
  searchModel: { open: false, openPalette: vi.fn().mockResolvedValue(undefined) },
}));

import Header from '$widgets/layout/ui/Header.svelte';

describe('Layout Header', () => {
  it('renders all navigation links', () => {
    render(Header);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search (⌘K)')).toBeInTheDocument();
  });

  it('opens command palette when search button is clicked', async () => {
    const { searchModel } = await import('$features/search/model/searchModel.svelte');
    render(Header);

    const searchBtn = screen.getByLabelText('Search (⌘K)');
    await fireEvent.click(searchBtn);

    expect(searchModel.openPalette).toHaveBeenCalled();
  });

  it('keeps hidden header controls in tab order so focus can reveal it', () => {
    render(Header);
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('tabindex');
    expect(screen.getByLabelText('Search (⌘K)')).not.toHaveAttribute('tabindex');
  });

  it('shows the header while focus is inside the navbar', async () => {
    viewport.navVisible = false;
    const { container } = render(Header);
    const wrapper = container.firstElementChild as HTMLElement;

    expect(wrapper.className).toContain('-translate-y-[calc(100%+1rem)]');

    const homeLink = screen.getByRole('link', { name: 'Home' });
    await fireEvent.focusIn(homeLink);
    expect(wrapper.className).toContain('translate-y-0');
  });

  it('hides the header when focus leaves the navbar', async () => {
    viewport.navVisible = false;
    const { container } = render(Header);
    const wrapper = container.firstElementChild as HTMLElement;
    const homeLink = screen.getByRole('link', { name: 'Home' });

    // Focus inside
    await fireEvent.focusIn(homeLink);
    expect(wrapper.className).toContain('translate-y-0');

    // Focus outside
    await fireEvent.focusOut(homeLink, { relatedTarget: document.body });
    expect(wrapper.className).toContain('-translate-y-[calc(100%+1rem)]');
  });

  it('keeps the header visible when focus moves within the navbar', async () => {
    viewport.navVisible = false;
    const { container } = render(Header);
    const wrapper = container.firstElementChild as HTMLElement;
    const homeLink = screen.getByRole('link', { name: 'Home' });
    const searchBtn = screen.getByLabelText('Search (⌘K)');

    // Focus inside
    await fireEvent.focusIn(homeLink);
    expect(wrapper.className).toContain('translate-y-0');

    // Focus moves to another element inside
    await fireEvent.focusOut(homeLink, { relatedTarget: searchBtn });
    expect(wrapper.className).toContain('translate-y-0');
  });

  it('measures nav items on mount and window resize', async () => {
    render(Header);

    // Trigger window resize to invoke the measure function bound in the effect
    await fireEvent(window, new Event('resize'));
    // We just verify it doesn't crash and the resize event listener is processed
    expect(true).toBe(true);
  });

  it('renders GitHub link with data-focus-boundary-end', () => {
    render(Header);
    const gitHubLink = screen.getByLabelText('GitHub');
    expect(gitHubLink).toBeInTheDocument();
    expect(gitHubLink).toHaveAttribute('data-focus-boundary-end');
  });
});

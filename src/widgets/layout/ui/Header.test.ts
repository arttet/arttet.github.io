import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

const { viewportState } = vi.hoisted(() => ({
  viewportState: {
    navVisible: false,
  },
}));

// Mock Search results and Theme
vi.mock('$features/search/model/searchModel.svelte', () => ({
  searchModel: { open: false, openPalette: vi.fn() },
}));

vi.mock('$shared/lib/viewport.svelte', () => ({
  viewport: viewportState,
}));

import Header from '$widgets/layout/ui/Header.svelte';

describe('Layout Header', () => {
  it('renders all navigation links', () => {
    render(Header);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search (⌘K)')).toBeInTheDocument();
  });

  it('keeps hidden header controls in tab order so focus can reveal it', () => {
    render(Header);
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('tabindex');
    expect(screen.getByLabelText('Search (⌘K)')).not.toHaveAttribute('tabindex');
  });

  it('shows the header while focus is inside the navbar', async () => {
    const { container } = render(Header);
    const wrapper = container.firstElementChild as HTMLElement;

    expect(wrapper.className).toContain('-translate-y-[calc(100%+1rem)]');

    await fireEvent.focusIn(screen.getByRole('link', { name: 'Home' }));

    expect(wrapper.className).toContain('translate-y-0');
  });
});

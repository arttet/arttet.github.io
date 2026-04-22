import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Header from '$widgets/layout/ui/Header.svelte';

// Mock Search results and Theme
vi.mock('$features/search/model/searchModel.svelte', () => ({
  searchModel: { open: false, openPalette: vi.fn() },
}));

describe('Layout Header', () => {
  it('renders all navigation links', () => {
    render(Header);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search (⌘K)')).toBeInTheDocument();
  });
});

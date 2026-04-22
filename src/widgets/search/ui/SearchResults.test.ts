import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import * as navigation from '$app/navigation';
import { searchModel } from '$features/search/model/searchModel.svelte';
import SearchResults from './SearchResults.svelte';

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

describe('SearchResults', () => {
  it('renders search results correctly', async () => {
    // Setup model state
    searchModel.results = [{ slug: 'p1', title: 'Test Post', tags: ['t1'], created: '2026-04-21' }];

    render(SearchResults);
    expect(screen.getByText('Test Post')).toBeInTheDocument();
    expect(screen.getByText('#t1')).toBeInTheDocument();
  });

  it('navigates on item click', async () => {
    searchModel.results = [{ slug: 'p1', title: 'Test Post', tags: ['t1'], created: '2026-04-21' }];
    searchModel.open = true;

    render(SearchResults);
    const item = screen.getByRole('button', { name: /Test Post/i });
    await fireEvent.click(item);

    expect(navigation.goto).toHaveBeenCalledWith('/blog/p1');
    expect(searchModel.open).toBe(false);
  });

  it('updates selected result on hover', async () => {
    searchModel.results = [
      { slug: 'p1', title: 'First', tags: ['t1'], created: '2026-04-21' },
      { slug: 'p2', title: 'Second', tags: ['t2'], created: '2026-04-22' },
    ];
    searchModel.selected = 0;

    render(SearchResults);
    const second = screen.getByRole('button', { name: /Second/i });

    await fireEvent.mouseEnter(second);

    expect(searchModel.selected).toBe(1);
  });
});

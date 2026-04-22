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

    render(SearchResults);
    const item = screen.getByRole('button', { name: /Test Post/i });
    await fireEvent.click(item);

    expect(navigation.goto).toHaveBeenCalledWith('/blog/p1');
    // Also expect searchModel.close to have been called (via handleNavigate)
    // Note: searchModel is a singleton, need to watch it
  });
});

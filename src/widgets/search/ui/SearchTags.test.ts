import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { goto } from '$app/navigation';
import { searchModel } from '$features/search/model/searchModel.svelte';
import SearchTags from './SearchTags.svelte';

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

describe('SearchTags interactions', () => {
  beforeEach(() => {
    searchModel.query = '';
    searchModel.showAllTags = false;
    searchModel.tags = [];
  });

  it('toggles tag list', async () => {
    searchModel.tags = [
      { name: 't1', count: 1 },
      { name: 't2', count: 1 },
      { name: 't3', count: 1 },
      { name: 't4', count: 1 },
    ];
    render(SearchTags);

    // Default show 3, so t4 shouldn't be visible initially
    expect(screen.queryByText('#t4')).not.toBeInTheDocument();

    const btn = screen.getByText('+1 more');
    await fireEvent.click(btn);

    expect(searchModel.showAllTags).toBe(true);
    expect(screen.getByText('#t4')).toBeInTheDocument();
  });

  it('navigates to tag page and closes search palette', async () => {
    searchModel.open = true;
    searchModel.tags = [{ name: 'svelte', count: 2 }];
    render(SearchTags);

    await fireEvent.click(screen.getByRole('link', { name: /#svelte/i }));

    expect(goto).toHaveBeenCalledWith('/blog/tag/svelte');
    expect(searchModel.open).toBe(false);
  });

  it('shows empty query message when searching text', () => {
    searchModel.query = 'missing';
    render(SearchTags);

    expect(screen.getByText('No results for "missing"')).toBeInTheDocument();
  });
});

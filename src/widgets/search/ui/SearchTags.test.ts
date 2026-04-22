import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { searchModel } from '$features/search/model/searchModel.svelte';
import SearchTags from './SearchTags.svelte';

describe('SearchTags interactions', () => {
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
});

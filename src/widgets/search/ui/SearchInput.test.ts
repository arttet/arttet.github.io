import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { searchModel } from '$features/search/model/searchModel.svelte';
import SearchInput from './SearchInput.svelte';

describe('SearchInput', () => {
  it('binds input query to searchModel', async () => {
    render(SearchInput);
    const input = screen.getByPlaceholderText('Search posts…') as HTMLInputElement;

    await fireEvent.input(input, { target: { value: 'svelte' } });
    expect(searchModel.query).toBe('svelte');
  });

  it('calls searchModel.close on close button click', async () => {
    const closeSpy = vi.spyOn(searchModel, 'close');
    render(SearchInput);
    const btn = screen.getByLabelText('Close');
    await fireEvent.click(btn);
    expect(closeSpy).toHaveBeenCalled();
  });
});

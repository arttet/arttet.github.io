import { render } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as navigation from '$app/navigation';
import { searchModel } from '$features/search/model/searchModel.svelte';
import CommandPalette from './CommandPalette.svelte';

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

describe('CommandPalette interactions', () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    searchModel.close();
    searchModel.results = [];
    searchModel.selected = 0;
    vi.restoreAllMocks();
  });

  it('navigates on Enter and closes', async () => {
    vi.spyOn(searchModel, 'executeSearch').mockImplementation(async () => {});
    searchModel.open = true;
    searchModel.results = [{ slug: 'p1', title: 'P1', tags: [], created: '2026-04-21' }];
    searchModel.selected = 0;

    render(CommandPalette);
    await Promise.resolve();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    await new Promise((r) => setTimeout(r, 10));

    expect(navigation.goto).toHaveBeenCalledWith('/blog/p1');
    expect(searchModel.open).toBe(false);
  });

  it('handles arrow navigation', async () => {
    vi.spyOn(searchModel, 'executeSearch').mockImplementation(async () => {});
    searchModel.open = true;
    searchModel.results = [
      { slug: 'p1', title: 'P1', tags: [], created: '2026-04-21' },
      { slug: 'p2', title: 'P2', tags: [], created: '2026-04-21' },
    ];
    searchModel.selected = 0;

    render(CommandPalette);
    await Promise.resolve();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(searchModel.selected).toBe(1);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(searchModel.selected).toBe(0);
  });

  it('closes on Escape', async () => {
    searchModel.open = true;
    render(CommandPalette);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(searchModel.open).toBe(false);
  });
});

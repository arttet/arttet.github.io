import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/index', () => ({
  buildIndex: vi.fn(async () => undefined),
  search: vi.fn(async () => []),
}));

import { searchModel } from './searchModel.svelte';
import { buildIndex, search } from '../lib/index';

const buildIndexMock = vi.mocked(buildIndex);
const searchMock = vi.mocked(search);

describe('searchModel', () => {
  beforeEach(() => {
    searchModel.close();
    (searchModel as any).indexPromise = null;
    searchModel.isLoading = false;
    searchModel.tags = [];
    buildIndexMock.mockReset();
    searchMock.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('ensureIndex fetches, builds index, and aggregates tag counts sorted by count then name', async () => {
    const payload = {
      posts: [
        { slug: 'a', title: 'A', tags: ['svelte', 'zig'], created: '2026-01-01' },
        { slug: 'b', title: 'B', tags: ['svelte'], created: '2026-01-02' },
        { slug: 'c', title: 'C', tags: ['rust'], created: '2026-01-03' },
      ],
      index: {},
    };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      json: async () => payload,
    } as Response);

    await searchModel.ensureIndex();

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/search.json');
    expect(buildIndexMock).toHaveBeenCalledWith(payload);
    expect(searchModel.isLoading).toBe(false);
    expect(searchModel.tags).toEqual([
      { name: 'svelte', count: 2 },
      { name: 'rust', count: 1 },
      { name: 'zig', count: 1 },
    ]);
  });

  it('ensureIndex is idempotent — second call is a no-op', async () => {
    (searchModel as any).indexPromise = Promise.resolve();
    await searchModel.ensureIndex();
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(buildIndexMock).not.toHaveBeenCalled();
  });

  it('openPalette opens and triggers ensureIndex', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      json: async () => ({ posts: [], index: {} }),
    } as Response);

    await searchModel.openPalette();

    expect(searchModel.open).toBe(true);
    expect(searchModel.isLoading).toBe(false);
  });

  it('close resets every reactive field', () => {
    searchModel.open = true;
    searchModel.query = 'foo';
    searchModel.results = [{ slug: 'x', title: 'X', tags: [], created: '2026-01-01' }];
    searchModel.selected = 4;
    searchModel.showAllTags = true;

    searchModel.close();

    expect(searchModel.open).toBe(false);
    expect(searchModel.query).toBe('');
    expect(searchModel.results).toEqual([]);
    expect(searchModel.selected).toBe(0);
    expect(searchModel.showAllTags).toBe(false);
  });

  it('executeSearch with empty/whitespace query clears results without calling search', async () => {
    searchModel.results = [{ slug: 'stale', title: 'Stale', tags: [], created: '2026' }];
    searchModel.query = '   ';

    await searchModel.executeSearch();

    expect(searchModel.results).toEqual([]);
    expect(searchMock).not.toHaveBeenCalled();
  });

  it('executeSearch debounces and stores results from the lib', async () => {
    vi.useFakeTimers();
    searchMock.mockResolvedValueOnce([
      { slug: 'r', title: 'Result', tags: [], created: '2026-01-01' },
    ]);
    searchModel.query = 'foo';

    await searchModel.executeSearch();
    expect(searchModel.selected).toBe(0);
    expect(searchMock).not.toHaveBeenCalled();

    await vi.runAllTimersAsync();

    expect(searchMock).toHaveBeenCalledWith('foo');
    expect(searchModel.results).toEqual([
      { slug: 'r', title: 'Result', tags: [], created: '2026-01-01' },
    ]);
  });

  it('executeSearch cancels pending timer when called again rapidly', async () => {
    vi.useFakeTimers();
    searchMock.mockResolvedValue([]);

    searchModel.query = 'first';
    await searchModel.executeSearch();
    searchModel.query = 'second';
    await searchModel.executeSearch();

    await vi.runAllTimersAsync();

    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(searchMock).toHaveBeenCalledWith('second');
  });
});

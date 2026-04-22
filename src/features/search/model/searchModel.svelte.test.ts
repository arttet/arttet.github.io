import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as searchLib from '../lib/index';
import { searchModel } from './searchModel.svelte';

vi.mock('../lib/index', () => ({
  buildIndex: vi.fn(),
  search: vi
    .fn()
    .mockImplementation(async (q) => (q === 'test' ? [{ slug: 'test-slug', tags: ['a'] }] : [])),
}));

describe('searchModel advanced', () => {
  beforeEach(() => {
    searchModel.close();
    vi.clearAllMocks();
    globalThis.fetch = vi.fn().mockImplementation(async () => ({
      json: async () => ({
        posts: [
          { slug: 'p1', tags: ['t1', 't2'] },
          { slug: 'p2', tags: ['t1'] },
        ],
        index: {},
      }),
    }));
  });

  it('calculates tag counts correctly', async () => {
    await searchModel.ensureIndex();
    expect(searchModel.tags).toEqual([
      { name: 't1', count: 2 },
      { name: 't2', count: 1 },
    ]);
  });

  it('toggles showAllTags', () => {
    expect(searchModel.showAllTags).toBe(false);
    searchModel.showAllTags = true;
    expect(searchModel.showAllTags).toBe(true);
  });

  it('handles debounce and rapid typing', async () => {
    vi.useFakeTimers();
    searchModel.query = 'a';
    searchModel.executeSearch();
    searchModel.query = 'ab';
    searchModel.executeSearch();

    vi.advanceTimersByTime(100);
    expect(searchLib.search).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    await Promise.resolve();
    expect(searchLib.search).toHaveBeenCalledWith('ab');
    vi.useRealTimers();
  });
});

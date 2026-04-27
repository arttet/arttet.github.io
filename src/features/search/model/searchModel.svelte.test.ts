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
    (searchModel as any).indexPromise = null;
    searchModel.isLoading = false;
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

    await Promise.resolve(); // Let microtasks run to schedule timers

    vi.advanceTimersByTime(100);
    expect(searchLib.search).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    await Promise.resolve();
    expect(searchLib.search).toHaveBeenCalledWith('ab');
    vi.useRealTimers();
  });

  it('awaits index load before searching', async () => {
    vi.useFakeTimers();
    let resolveJson: ((val: any) => void) | undefined;
    globalThis.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolve({
            json: () =>
              new Promise((r) => {
                resolveJson = r;
              }),
          });
        })
    );

    const ensurePromise = searchModel.ensureIndex();
    expect(searchModel.isLoading).toBe(true);

    await Promise.resolve(); // let await fetch resolve
    await Promise.resolve(); // let .json() be called

    searchModel.query = 'test';
    searchModel.executeSearch();

    vi.advanceTimersByTime(200);
    expect(searchLib.search).not.toHaveBeenCalled();

    resolveJson!({ posts: [], index: {} });

    // Wait for the indexing process to fully finish
    await ensurePromise;

    // Let executeSearch resume and schedule the timeout
    await Promise.resolve();

    // Advance the timer to trigger the search
    vi.advanceTimersByTime(200);

    // Let the search timeout callback run
    await Promise.resolve();

    expect(searchLib.search).toHaveBeenCalledWith('test');
    expect(searchModel.isLoading).toBe(false);
    vi.useRealTimers();
  });
});

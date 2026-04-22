import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readingMode } from './readingMode.svelte';

// Mock SvelteKit environment
vi.mock('$app/environment', () => ({
  browser: true,
}));

describe('ReadingModeState', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset state if possible, though it's a singleton
    readingMode.value = false;
  });

  it('initializes with default value', () => {
    expect(readingMode.value).toBe(false);
  });

  it('toggles value', () => {
    readingMode.toggle();
    expect(readingMode.value).toBe(true);
    expect(localStorage.getItem('readingMode')).toBe('true');

    readingMode.toggle();
    expect(readingMode.value).toBe(false);
    expect(localStorage.getItem('readingMode')).toBe('false');
  });

  it('updates via setter', () => {
    readingMode.value = true;
    expect(readingMode.value).toBe(true);
    expect(localStorage.getItem('readingMode')).toBe('true');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { backgroundMode } from './backgroundMode.svelte';

vi.mock('$app/environment', () => ({
  browser: true,
}));

describe('backgroundMode state', () => {
  beforeEach(() => {
    localStorage.clear();
    backgroundMode.value = 'particles';
  });

  it('updates background mode and persists to storage', () => {
    expect(backgroundMode.value).toBe('particles');
    backgroundMode.value = 'flow';
    expect(backgroundMode.value).toBe('flow');
    expect(localStorage.getItem('backgroundMode')).toBe('flow');
  });
});

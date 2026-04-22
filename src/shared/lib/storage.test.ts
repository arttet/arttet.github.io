import { beforeEach, describe, expect, it, vi } from 'vitest';
import { storage } from './storage';

// Mock browser environment as true globally
vi.mock('$app/environment', () => ({
  browser: true,
}));

describe('storage advanced', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('handles non-existent keys', () => {
    expect(storage.get('missing')).toBeNull();
  });

  it('removes keys correctly', () => {
    storage.set('x', 'y');
    storage.remove('x');
    expect(storage.get('x')).toBeNull();
  });
});

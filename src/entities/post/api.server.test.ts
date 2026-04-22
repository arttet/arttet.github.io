import { describe, expect, it } from 'vitest';
import { getPosts } from './api.server';

// Mock import.meta.glob
// Vitest handles import.meta.glob by transforming it.
// We can use vi.stubGlobal or similar, but the easiest is to mock the modules.
// However, api.server.ts uses a string pattern.
// Let's use a workaround for testing the logic.

describe('api.server', () => {
  it('is defined', () => {
    expect(getPosts).toBeDefined();
  });

  it('can be called (even if it returns empty due to mock env)', () => {
    const posts = getPosts();
    expect(Array.isArray(posts)).toBe(true);
  });
});

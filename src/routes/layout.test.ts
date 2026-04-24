// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { prerender } from './+layout';

describe('+layout.ts', () => {
  it('enables prerendering', () => {
    expect(prerender).toBe(true);
  });
});

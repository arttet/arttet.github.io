// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { backgroundState } from './background.svelte';

describe('backgroundState model', () => {
  it('updates glass rect', () => {
    expect(backgroundState.glassRect).toBe(null);
    const rect = { x: 10, y: 20, w: 100, h: 200 };
    backgroundState.glassRect = rect;
    expect(backgroundState.glassRect).toEqual(rect);
  });

  it('provides current background mode', () => {
    expect(backgroundState.mode).toBeDefined();
  });
});

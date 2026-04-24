// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { navAnchored, navAnchorPositions } from './navAnchor.svelte';

describe('navAnchor states', () => {
  it('updates navAnchored boolean state', () => {
    expect(navAnchored.value).toBe(false);
    navAnchored.value = true;
    expect(navAnchored.value).toBe(true);
  });

  it('updates navAnchorPositions array state', () => {
    expect(navAnchorPositions.value).toEqual([]);
    const pos = [{ x: 10, y: 20 }];
    navAnchorPositions.value = pos;
    expect(navAnchorPositions.value).toEqual(pos);
  });
});

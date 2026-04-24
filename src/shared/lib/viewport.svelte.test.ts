// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { viewport } from './viewport.svelte';

describe('ViewportState', () => {
  it('initializes with default values', () => {
    expect(viewport.mouseY).toBe(-1);
    expect(viewport.scrollDir).toBe('up');
    expect(viewport.navVisible).toBe(false);
    expect(viewport.footerVisible).toBe(false);
  });

  it('updates mouseY and visibility', () => {
    viewport.updateMouseY(10);
    expect(viewport.mouseY).toBe(10);
    expect(viewport.navVisible).toBe(true);
    expect(viewport.footerVisible).toBe(false);

    viewport.updateMouseY(viewport.winHeight - 10);
    expect(viewport.footerVisible).toBe(true);
  });

  it('updates scroll direction', () => {
    viewport.updateScroll(100);
    expect(viewport.scrollDir).toBe('down');

    viewport.updateScroll(50);
    expect(viewport.scrollDir).toBe('up');
  });

  it('stays "up" near the top', () => {
    viewport.updateScroll(100);
    expect(viewport.scrollDir).toBe('down');
    viewport.updateScroll(20);
    expect(viewport.scrollDir).toBe('up');
  });
});

import { render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { backgroundState } from '../model/background.svelte';
import GlassEffect from './GlassEffect.svelte';

describe('GlassEffect', () => {
  it('stores parent rect on mount and resets on destroy', async () => {
    backgroundState.glassRect = null;

    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    const { container, unmount } = render(GlassEffect);
    const el = container.firstElementChild as HTMLElement;
    const parent = el.parentElement as HTMLElement;

    parent.getBoundingClientRect = () =>
      ({
        left: 10,
        top: 20,
        width: 200,
        height: 120,
      }) as DOMRect;

    window.dispatchEvent(new Event('scroll'));

    expect(backgroundState.glassRect).toEqual({ x: 10, y: 20, w: 200, h: 120 });

    unmount();

    expect(backgroundState.glassRect).toBe(null);

    rafSpy.mockRestore();
  });
});

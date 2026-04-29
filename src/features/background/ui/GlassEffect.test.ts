import { render } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { backgroundState } from '../model/background.svelte';
import GlassEffect from './GlassEffect.svelte';

describe('GlassEffect', () => {
  let resizeCallback: ResizeObserverCallback | undefined;

  beforeEach(() => {
    backgroundState.glassRect = null;
    resizeCallback = undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resizeCallback = callback;
        }
        observe = vi.fn();
        disconnect = vi.fn();
      }
    );
  });

  it('stores parent rect on mount and resets on destroy', async () => {
    const callbacks: FrameRequestCallback[] = [];
    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      callbacks.push(cb);
      return callbacks.length;
    });
    const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});

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

    callbacks.shift()?.(0);
    expect(backgroundState.glassRect).toEqual({ x: 10, y: 20, w: 200, h: 120 });

    parent.getBoundingClientRect = () =>
      ({
        left: 12,
        top: 24,
        width: 210,
        height: 130,
      }) as DOMRect;

    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
    resizeCallback?.([], {} as ResizeObserver);

    expect(callbacks).toHaveLength(1);
    callbacks.shift()?.(0);
    expect(backgroundState.glassRect).toEqual({ x: 12, y: 24, w: 210, h: 130 });

    window.dispatchEvent(new Event('scroll'));
    unmount();

    expect(backgroundState.glassRect).toBe(null);
    expect(cancelSpy).toHaveBeenCalled();

    rafSpy.mockRestore();
    cancelSpy.mockRestore();
  });
});

import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { backgroundState } from '../model/background.svelte';
import GlassEffect from './GlassEffect.svelte';

describe('GlassEffect', () => {
  it('stores parent rect on mount and resets on destroy', () => {
    backgroundState.glassRect = null;

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

    window.dispatchEvent(new Event('resize'));

    expect(backgroundState.glassRect).toEqual({ x: 10, y: 20, w: 200, h: 120 });

    unmount();

    expect(backgroundState.glassRect).toBe(null);
  });
});

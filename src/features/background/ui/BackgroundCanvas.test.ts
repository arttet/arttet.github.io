import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  init,
  setMode,
  setBgColor,
  renderFrame,
  updateGlassRect,
  setParticleColors,
  setThemeMode,
  setCursor,
  clearCursor,
  clickBurst,
  destroy,
} = vi.hoisted(() => ({
  init: vi.fn(),
  setMode: vi.fn(),
  setBgColor: vi.fn(),
  renderFrame: vi.fn(),
  updateGlassRect: vi.fn(),
  setParticleColors: vi.fn(),
  setThemeMode: vi.fn(),
  setCursor: vi.fn(),
  clearCursor: vi.fn(),
  clickBurst: vi.fn(),
  destroy: vi.fn(),
}));

vi.mock('$app/environment', () => ({
  browser: true,
}));

vi.mock('$features/background/core/BackgroundScene', () => ({
  BackgroundScene: class {
    init = init;
    setMode = setMode;
    setBgColor = setBgColor;
    render = renderFrame;
    updateGlassRect = updateGlassRect;
    setParticleColors = setParticleColors;
    setThemeMode = setThemeMode;
    setCursor = setCursor;
    clearCursor = clearCursor;
    clickBurst = clickBurst;
    destroy = destroy;
  },
}));

vi.mock('$features/theme/model/theme.svelte', () => ({
  theme: { current: 'dark' },
}));

import { backgroundState } from '../model/background.svelte';
import BackgroundCanvas from './BackgroundCanvas.svelte';

describe('BackgroundCanvas', () => {
  beforeEach(() => {
    init.mockReset().mockResolvedValue(undefined);
    setMode.mockReset();
    setBgColor.mockReset();
    renderFrame.mockReset();
    updateGlassRect.mockReset();
    setParticleColors.mockReset();
    setThemeMode.mockReset();
    setCursor.mockReset();
    clearCursor.mockReset();
    clickBurst.mockReset();
    destroy.mockReset();

    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1)
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal(
      'getComputedStyle',
      vi.fn(() => ({
        getPropertyValue: vi.fn(() => '#112233'),
      }))
    );

    backgroundState.glassRect = { x: 1, y: 2, w: 3, h: 4 };
  });

  it('initializes scene and wires canvas interactions', async () => {
    let rafCallback: ((time: number) => void) | undefined;
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: (time: number) => void) => {
        rafCallback = cb;
        return 1;
      })
    );

    const { container, unmount } = render(BackgroundCanvas, { mode: 'flow' });
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;

    canvas.getBoundingClientRect = () =>
      ({
        left: 10,
        top: 20,
        width: 400,
        height: 300,
      }) as DOMRect;

    await waitFor(() => expect(init).toHaveBeenCalled());

    expect(setMode).toHaveBeenCalledWith('flow');
    expect(setBgColor).toHaveBeenCalledWith(17 / 255, 34 / 255, 51 / 255);

    rafCallback?.(100);
    expect(renderFrame).toHaveBeenCalledWith(16);

    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    rafCallback?.(200);

    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    rafCallback?.(300);

    await fireEvent.mouseMove(canvas, { clientX: 50, clientY: 80 });
    expect(setCursor).toHaveBeenCalledWith(40, 60);

    await fireEvent.mouseLeave(canvas);
    expect(clearCursor).toHaveBeenCalled();

    await fireEvent.click(canvas, { clientX: 70, clientY: 110 });
    expect(clickBurst).toHaveBeenCalledWith(60, 90);

    unmount();

    expect(destroy).toHaveBeenCalled();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
  });

  it('renders static fallback when initialization fails', async () => {
    init.mockRejectedValueOnce(new Error('gpu fail'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(BackgroundCanvas);

    await waitFor(() =>
      expect(container.querySelector('div[aria-hidden="true"]')).toBeInTheDocument()
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      'Background scene initialization failed:',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });
});

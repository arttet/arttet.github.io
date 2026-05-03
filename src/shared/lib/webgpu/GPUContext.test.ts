import { describe, expect, it, vi } from 'vitest';
import { GPUContext } from './GPUContext';

describe('GPUContext', () => {
  it('throws when WebGPU is unavailable', async () => {
    Object.defineProperty(navigator, 'gpu', {
      value: undefined,
      configurable: true,
    });

    await expect(GPUContext.create(document.createElement('canvas'))).rejects.toThrow(
      'WebGPU not supported'
    );
  });

  it('throws when adapter is missing', async () => {
    Object.defineProperty(navigator, 'gpu', {
      value: {
        requestAdapter: vi.fn().mockResolvedValue(null),
      },
      configurable: true,
    });

    await expect(GPUContext.create(document.createElement('canvas'))).rejects.toThrow(
      'No GPU adapter'
    );
  });

  it('creates, reconfigures, and destroys context', async () => {
    const configure = vi.fn();
    const destroy = vi.fn();
    const requestDevice = vi.fn().mockResolvedValue({ destroy });
    const requestAdapter = vi.fn().mockResolvedValue({ requestDevice });
    const getPreferredCanvasFormat = vi.fn().mockReturnValue('bgra8unorm');

    Object.defineProperty(navigator, 'gpu', {
      value: {
        requestAdapter,
        getPreferredCanvasFormat,
      },
      configurable: true,
    });

    Object.defineProperty(globalThis, 'devicePixelRatio', {
      value: 3,
      configurable: true,
    });

    const canvas = document.createElement('canvas');
    Object.defineProperty(canvas, 'clientWidth', { value: 100, configurable: true });
    Object.defineProperty(canvas, 'clientHeight', { value: 50, configurable: true });
    canvas.getContext = vi.fn().mockReturnValue({ configure }) as typeof canvas.getContext;

    const ctx = await GPUContext.create(canvas);

    expect(requestAdapter).toHaveBeenCalled();
    expect(requestDevice).toHaveBeenCalled();
    expect(getPreferredCanvasFormat).toHaveBeenCalled();
    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(100);
    expect(ctx.dpr).toBe(2);
    expect(ctx.width).toBe(200);
    expect(ctx.height).toBe(100);

    ctx.reconfigure();
    expect(configure).toHaveBeenCalledTimes(2);

    ctx.destroy();
    expect(destroy).toHaveBeenCalled();
  });
});

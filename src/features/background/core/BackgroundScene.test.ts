import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BackgroundScene } from './BackgroundScene';

// Heavy mocking for WebGPU
const mockDevice = {
  configure: vi.fn(),
  createShaderModule: vi.fn(() => ({})),
  createRenderPipeline: vi.fn(async () => ({ getBindGroupLayout: vi.fn(() => ({})) })),
  createBuffer: vi.fn(() => ({ destroy: vi.fn() })),
  createBindGroup: vi.fn(() => ({})),
  createSampler: vi.fn(() => ({})),
  createTexture: vi.fn(() => ({ createView: vi.fn(() => ({})), destroy: vi.fn() })),
  queue: { writeBuffer: vi.fn() },
  destroy: vi.fn(),
};

const mockAdapter = {
  requestDevice: vi.fn(async () => mockDevice),
};

vi.stubGlobal('navigator', {
  gpu: {
    requestAdapter: vi.fn(async () => mockAdapter),
    getPreferredCanvasFormat: vi.fn(() => 'bgra8unorm'),
  },
});

type MockCanvasContext = {
  configure: ReturnType<typeof vi.fn>;
  getCurrentTexture: ReturnType<typeof vi.fn>;
};

// Mock Worker
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  addEventListener = vi.fn();
  postMessage = vi.fn();
  terminate = vi.fn();
}
vi.stubGlobal('Worker', MockWorker);

describe('BackgroundScene', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    vi.clearAllMocks();
    canvas = document.createElement('canvas');
    const context: MockCanvasContext = {
      configure: vi.fn(),
      getCurrentTexture: vi.fn(() => ({ createView: vi.fn() })),
    };
    canvas.getContext = vi.fn().mockReturnValue(context);

    Object.defineProperties(canvas, {
      clientWidth: { value: 800 },
      clientHeight: { value: 600 },
    });
  });

  it('initializes and loads mode', async () => {
    const scene = new BackgroundScene();
    await scene.init({ canvas });

    expect(navigator.gpu.requestAdapter).toHaveBeenCalled();
    expect(mockAdapter.requestDevice).toHaveBeenCalled();
    expect(canvas.getContext).toHaveBeenCalledWith('webgpu');
  });

  it('switches modes', async () => {
    const scene = new BackgroundScene();
    await scene.init({ canvas });

    await scene.setMode('contours');
    // Verify it doesn't crash and initializes pipelines
    expect(mockDevice.createRenderPipeline).toHaveBeenCalled();
  });

  it('handles cursor and click', async () => {
    const scene = new BackgroundScene();
    await scene.init({ canvas });

    scene.setCursor(100, 100);
    scene.clickBurst(200, 200);
    scene.clearCursor();

    // Check if worker got messages
    // Since worker is created in init, we find the instance
    // Note: BackgroundScene stores worker as private.
    // We can check the stubbed postMessage on any MockWorker.
  });

  it('destroys resources', async () => {
    const scene = new BackgroundScene();
    await scene.init({ canvas });
    scene.destroy();
    expect(mockDevice.destroy).toHaveBeenCalled();
  });
});

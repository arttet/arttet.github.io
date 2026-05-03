import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BackgroundScene } from './BackgroundScene';

// Heavy mocking for WebGPU
const mockRenderPass = {
  setPipeline: vi.fn(),
  setBindGroup: vi.fn(),
  setVertexBuffer: vi.fn(),
  draw: vi.fn(),
  end: vi.fn(),
};

const mockCommandEncoder = {
  beginRenderPass: vi.fn(() => mockRenderPass),
  finish: vi.fn(() => ({})),
  copyTextureToTexture: vi.fn(),
};

const mockDevice = {
  configure: vi.fn(),
  createShaderModule: vi.fn(() => ({})),
  createRenderPipeline: vi.fn(async () => ({ getBindGroupLayout: vi.fn(() => ({})) })),
  createBuffer: vi.fn(() => ({ destroy: vi.fn(), usage: 0, size: 0 })),
  createBindGroup: vi.fn(() => ({})),
  createSampler: vi.fn(() => ({})),
  createTexture: vi.fn(() => ({
    createView: vi.fn(() => ({})),
    destroy: vi.fn(),
    width: 0,
    height: 0,
  })),
  createCommandEncoder: vi.fn(() => mockCommandEncoder),
  queue: {
    writeBuffer: vi.fn(),
    submit: vi.fn(),
  },
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
let lastWorkerInstance: MockWorker | null = null;
class MockWorker {
  private listeners = new Map<string, (event: MessageEvent) => void>();
  addEventListener = vi.fn((type: string, cb: (event: MessageEvent) => void) => {
    this.listeners.set(type, cb);
  });
  postMessage = vi.fn();
  terminate = vi.fn();

  dispatchMessage(event: MessageEvent) {
    this.listeners.get('message')?.(event);
  }
}

function createMockWorker() {
  const worker = new MockWorker();
  lastWorkerInstance = worker;
  return worker;
}
vi.stubGlobal('Worker', createMockWorker);

// Mock ResizeObserver
let lastObserverInstance: MockResizeObserver | null = null;
class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  constructor(public callback: ResizeObserverCallback) {}
}

function createMockObserver(callback: ResizeObserverCallback) {
  const observer = new MockResizeObserver(callback);
  lastObserverInstance = observer;
  return observer;
}
vi.stubGlobal('ResizeObserver', createMockObserver);

describe('BackgroundScene', () => {
  let canvas: HTMLCanvasElement;
  let scene: BackgroundScene;

  beforeEach(async () => {
    vi.clearAllMocks();
    canvas = document.createElement('canvas');
    const context: MockCanvasContext = {
      configure: vi.fn(),
      getCurrentTexture: vi.fn(() => ({ createView: vi.fn() })),
    };
    canvas.getContext = vi.fn().mockReturnValue(context);

    Object.defineProperties(canvas, {
      clientWidth: { value: 800, configurable: true },
      clientHeight: { value: 600, configurable: true },
    });

    scene = new BackgroundScene();
    await scene.init({ canvas });
  });

  it('initializes and loads mode', async () => {
    expect(navigator.gpu.requestAdapter).toHaveBeenCalled();
    expect(mockAdapter.requestDevice).toHaveBeenCalled();
    expect(canvas.getContext).toHaveBeenCalledWith('webgpu');
  });

  it('switches modes', async () => {
    await scene.setMode('contours');
    expect(mockDevice.createRenderPipeline).toHaveBeenCalled();

    await scene.setMode('flow');
    expect(mockDevice.createRenderPipeline).toHaveBeenCalled();

    // Idempotent call
    const callCount = mockDevice.createRenderPipeline.mock.calls.length;
    await scene.setMode('flow');
    expect(mockDevice.createRenderPipeline.mock.calls.length).toBe(callCount);
  });

  it('renders a frame', async () => {
    // Simulate worker sending a frame
    lastWorkerInstance?.dispatchMessage({
      data: { type: 'frame', particles: new Float32Array(100) },
    } as MessageEvent);

    scene.render(16);

    expect(mockDevice.createCommandEncoder).toHaveBeenCalled();
    expect(mockCommandEncoder.beginRenderPass).toHaveBeenCalled();
    expect(mockDevice.queue.submit).toHaveBeenCalled();
  });

  it('handles resize', () => {
    if (!lastObserverInstance) {
      throw new Error('Observer not created');
    }

    // Change dimensions
    Object.defineProperties(canvas, {
      clientWidth: { value: 1024 },
      clientHeight: { value: 768 },
    });

    lastObserverInstance.callback(
      [{ contentRect: { width: 1024, height: 768 } }] as any,
      lastObserverInstance as unknown as ResizeObserver
    );

    expect(canvas.width).toBe(1024 * (window.devicePixelRatio || 1));
  });

  it('updates state and theme', () => {
    scene.setThemeMode(true);
    scene.setBgColor(0.1, 0.1, 0.1);
    scene.setParticleColors([[1, 0, 0]]);
    scene.updateGlassRect(10, 10, 100, 100);

    expect(mockDevice.queue.writeBuffer).toHaveBeenCalled();
  });

  it('handles cursor and click', () => {
    scene.setCursor(100, 100);
    scene.clickBurst(200, 200);
    scene.clearCursor();

    expect(lastWorkerInstance?.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ cmd: 'setCursor' })
    );
    expect(lastWorkerInstance?.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ cmd: 'clickBurst' })
    );
  });

  it('destroys resources', () => {
    scene.destroy();
    expect(mockDevice.destroy).toHaveBeenCalled();
    expect(lastWorkerInstance?.terminate).toHaveBeenCalled();
  });
});

// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { CompositePass } from './CompositePass';

const mockPipeline = {
  getBindGroupLayout: vi.fn(() => ({})),
};

const mockTexture = {
  createView: vi.fn(() => ({})),
  destroy: vi.fn(),
};

const mockDevice = {
  createShaderModule: vi.fn(() => ({})),
  createRenderPipeline: vi.fn(async () => mockPipeline),
  createBindGroup: vi.fn(() => ({})),
  createBuffer: vi.fn(() => ({})),
  createSampler: vi.fn(() => ({})),
  createTexture: vi.fn(() => mockTexture),
  queue: {
    writeBuffer: vi.fn(),
  },
};

describe('CompositePass', () => {
  it('initializes pipelines', async () => {
    const pass = new CompositePass();
    // @ts-expect-error
    await pass.init(mockDevice, 'bgra8unorm', 800, 600);
    expect(mockDevice.createRenderPipeline).toHaveBeenCalled();
  });
});

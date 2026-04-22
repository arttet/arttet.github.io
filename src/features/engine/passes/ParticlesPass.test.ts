import { describe, expect, it, vi } from 'vitest';
import { ParticlesPass } from './ParticlesPass';

const mockPipeline = {
  getBindGroupLayout: vi.fn(() => ({})),
};

const mockDevice = {
  createShaderModule: vi.fn(() => ({})),
  createRenderPipeline: vi.fn(async () => mockPipeline),
  createBindGroup: vi.fn(() => ({})),
  createBuffer: vi.fn(() => ({})),
  queue: {
    writeBuffer: vi.fn(),
  },
};

describe('ParticlesPass', () => {
  it('initializes pipelines', async () => {
    const pass = new ParticlesPass();
    // @ts-expect-error
    await pass.init(mockDevice, 'bgra8unorm', 800, 600);
    expect(mockDevice.createRenderPipeline).toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { ContoursPass } from './ContoursPass';

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

describe('ContoursPass', () => {
  it('initializes pipelines', async () => {
    const pass = new ContoursPass();
    // @ts-expect-error
    await pass.init(mockDevice, 'bgra8unorm', 800, 600);
    expect(mockDevice.createRenderPipeline).toHaveBeenCalled();
  });
});

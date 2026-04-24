// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { FlowPass } from './FlowPass';

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

describe('FlowPass', () => {
  it('initializes pipelines', async () => {
    const pass = new FlowPass();
    // @ts-expect-error
    await pass.init(mockDevice, 'bgra8unorm', 800, 600);
    expect(mockDevice.createRenderPipeline).toHaveBeenCalled();
  });
});

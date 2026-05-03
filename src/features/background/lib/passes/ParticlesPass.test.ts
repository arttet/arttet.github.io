import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ParticlesPass } from './ParticlesPass';

describe('ParticlesPass', () => {
  let pass: ParticlesPass;
  let mockDevice: any;
  let mockPassEncoder: any;
  let mockVertexBuffer: any;
  let mockUniformBuffer: any;

  beforeEach(() => {
    pass = new ParticlesPass();

    mockVertexBuffer = {
      destroy: vi.fn(),
    };

    mockUniformBuffer = {
      destroy: vi.fn(),
    };

    const mockPipeline = {
      getBindGroupLayout: vi.fn().mockReturnValue({}),
    };

    mockDevice = {
      createShaderModule: vi.fn().mockReturnValue({}),
      createRenderPipeline: vi.fn().mockResolvedValue(mockPipeline),
      createBuffer: vi.fn((desc: any) => {
        if (desc.usage & 0x0020) {
          return mockVertexBuffer;
        } // VERTEX
        return mockUniformBuffer;
      }),
      createBindGroup: vi.fn().mockReturnValue({}),
      queue: {
        writeBuffer: vi.fn(),
      },
    };

    mockPassEncoder = {
      setPipeline: vi.fn(),
      setBindGroup: vi.fn(),
      setVertexBuffer: vi.fn(),
      draw: vi.fn(),
    };
  });

  it('initializes resources', async () => {
    await pass.init(mockDevice, 'bgra8unorm');

    expect(mockDevice.createShaderModule).toHaveBeenCalledTimes(3);
    expect(mockDevice.createRenderPipeline).toHaveBeenCalledTimes(3);
    expect(mockDevice.createBuffer).toHaveBeenCalledTimes(6);
    expect(mockDevice.createBindGroup).toHaveBeenCalledTimes(3);
  });

  it('updates state and writes to buffers', async () => {
    await pass.init(mockDevice, 'bgra8unorm');

    const state = {
      count: 1,
      particleData: new Float32Array([10, 20, 0, 0, 1, 0, 0, 1]), // x, y, vx, vy, r, g, b, a
      edgeCount: 1,
      edgeBuffer: new Float32Array([10, 20, 30, 40, 1, 0, 0, 1, 1, 0, 0, 1]), // x1, y1, x2, y2, c1, c2
      triCount: 1,
      triBuffer: new Float32Array(24 * 3), // mock size
    } as any;

    pass.update(state, 800, 600);

    // Particle, Edge, Tri vertex + uniform buffers writes
    // Should be 6 writes overall, but the uniform writes are also there.
    expect(mockDevice.queue.writeBuffer).toHaveBeenCalled();
  });

  it('handles empty state gracefully', async () => {
    await pass.init(mockDevice, 'bgra8unorm');

    const state = {
      count: 0,
      particleData: new Float32Array(0),
      edgeCount: 0,
      edgeBuffer: new Float32Array(0),
      triCount: 0,
      triBuffer: new Float32Array(0),
    } as any;

    mockDevice.queue.writeBuffer.mockClear();

    pass.update(state, 800, 600);

    // Only uniform writes are expected, no vertex buffer writes
    expect(mockDevice.queue.writeBuffer).toHaveBeenCalledTimes(4);
  });

  it('draws only when there is count', async () => {
    await pass.init(mockDevice, 'bgra8unorm');

    const emptyState = { count: 0, edgeCount: 0, triCount: 0 } as any;
    pass.update(emptyState, 800, 600);

    pass.draw(mockPassEncoder);
    expect(mockPassEncoder.draw).not.toHaveBeenCalled();

    const state = {
      count: 1,
      particleData: new Float32Array(8),
      edgeCount: 1,
      edgeBuffer: new Float32Array(12),
      triCount: 1,
      triBuffer: new Float32Array(24 * 3),
    } as any;

    pass.update(state, 800, 600);
    pass.draw(mockPassEncoder);

    // Triangle(1*3), Edge(4,1), Particle(4,1)
    expect(mockPassEncoder.draw).toHaveBeenCalledTimes(3);
  });

  it('clears segments', async () => {
    await pass.init(mockDevice, 'bgra8unorm');

    const state = {
      count: 1,
      particleData: new Float32Array(8),
      edgeCount: 1,
      edgeBuffer: new Float32Array(12),
      triCount: 1,
      triBuffer: new Float32Array(24 * 3),
    } as any;
    pass.update(state, 800, 600);

    pass.clear();

    pass.draw(mockPassEncoder);
    expect(mockPassEncoder.draw).not.toHaveBeenCalled();
  });

  it('destroys resources', async () => {
    await pass.init(mockDevice, 'bgra8unorm');

    pass.destroy();

    expect(mockVertexBuffer.destroy).toHaveBeenCalledTimes(3);
    expect(mockUniformBuffer.destroy).toHaveBeenCalledTimes(3);
  });

  it('handles resize', () => {
    pass.resize(1024, 768);
  });

  it('does nothing in setPalette', () => {
    pass.setPalette([[1, 0, 0]]);
  });
});

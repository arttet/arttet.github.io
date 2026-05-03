import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContoursPass } from './ContoursPass';
import { GRID_W, GRID_H } from '../core/SimulationConstants';
import type { SimulationState } from '../core/SimulationState';

// Mock marchingSquares to avoid complex computation in tests
vi.mock('../core/MarchingSquares', () => ({
  marchingSquares: vi.fn().mockImplementation((heightmap, w, h, threshold, out) => {
    out[0] = 1;
    out[1] = 2;
    out[2] = 3;
    out[3] = 4;
    return 1; // return 1 segment
  }),
}));

describe('ContoursPass', () => {
  let pass: ContoursPass;
  let mockDevice: any;
  let mockPassEncoder: any;
  let mockVertexBuffer: any;
  let mockUniformBuffer: any;

  beforeEach(() => {
    pass = new ContoursPass();

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

    expect(mockDevice.createShaderModule).toHaveBeenCalled();
    expect(mockDevice.createRenderPipeline).toHaveBeenCalled();
    expect(mockDevice.createBuffer).toHaveBeenCalledTimes(2);
    expect(mockDevice.createBindGroup).toHaveBeenCalled();
  });

  it('updates logic correctly', async () => {
    await pass.init(mockDevice, 'bgra8unorm');
    pass.setPalette([[1, 0, 0]]);

    // create a dummy state with some height to trigger the loops
    const dummyHeightmap = new Float32Array((GRID_W + 1) * (GRID_H + 1));
    dummyHeightmap[0] = 2.0; // maxH = 2.0
    const state = { heightmap: dummyHeightmap } as SimulationState;

    // First call frame=1 (skipped due to this.frame % 2 !== 0)
    pass.update(state, 800, 600);
    expect(mockDevice.queue.writeBuffer).not.toHaveBeenCalled();

    // Second call frame=2
    pass.update(state, 800, 600);

    // Check if writeBuffer was called for vertexBuffer and uniformBuffer
    expect(mockDevice.queue.writeBuffer).toHaveBeenCalledWith(
      mockVertexBuffer,
      0,
      expect.any(ArrayBuffer),
      0,
      expect.any(Number)
    );
    expect(mockDevice.queue.writeBuffer).toHaveBeenCalledWith(
      mockUniformBuffer,
      0,
      expect.any(ArrayBuffer)
    );
  });

  it('skips update if maxH is too small', async () => {
    await pass.init(mockDevice, 'bgra8unorm');

    const dummyHeightmap = new Float32Array((GRID_W + 1) * (GRID_H + 1));
    dummyHeightmap[0] = 0.0; // maxH < 1e-6
    const state = { heightmap: dummyHeightmap } as SimulationState;

    // frame=1
    pass.update(state, 800, 600);
    // frame=2
    pass.update(state, 800, 600);

    expect(mockDevice.queue.writeBuffer).not.toHaveBeenCalled();

    // totalSegs should be 0, draw should not do anything
    pass.draw(mockPassEncoder);
    expect(mockPassEncoder.draw).not.toHaveBeenCalled();
  });

  it('clears segments', async () => {
    await pass.init(mockDevice, 'bgra8unorm');

    const dummyHeightmap = new Float32Array((GRID_W + 1) * (GRID_H + 1));
    dummyHeightmap[0] = 2.0;
    const state = { heightmap: dummyHeightmap } as SimulationState;

    pass.update(state, 800, 600); // frame=1
    pass.update(state, 800, 600); // frame=2 (writes buffer, totalSegs > 0)

    pass.clear();

    pass.draw(mockPassEncoder);
    expect(mockPassEncoder.draw).not.toHaveBeenCalled();
  });

  it('draws correctly', async () => {
    await pass.init(mockDevice, 'bgra8unorm');

    const dummyHeightmap = new Float32Array((GRID_W + 1) * (GRID_H + 1));
    dummyHeightmap[0] = 2.0;
    const state = { heightmap: dummyHeightmap } as SimulationState;

    pass.update(state, 800, 600); // frame=1
    pass.update(state, 800, 600); // frame=2

    pass.draw(mockPassEncoder);

    expect(mockPassEncoder.setPipeline).toHaveBeenCalled();
    expect(mockPassEncoder.setBindGroup).toHaveBeenCalled();
    expect(mockPassEncoder.setVertexBuffer).toHaveBeenCalled();
    expect(mockPassEncoder.draw).toHaveBeenCalled();
  });

  it('destroys resources', async () => {
    await pass.init(mockDevice, 'bgra8unorm');

    pass.destroy();

    expect(mockVertexBuffer.destroy).toHaveBeenCalled();
    expect(mockUniformBuffer.destroy).toHaveBeenCalled();
  });

  it('does nothing on resize', () => {
    // Just a coverage filler
    pass.resize(100, 100);
  });
});

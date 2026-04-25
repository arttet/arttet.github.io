import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FlowPass } from './FlowPass';
import { VF_W, VF_H } from '../core/SimulationConstants';
import type { SimulationState } from '../core/SimulationState';

describe('FlowPass', () => {
  let pass: FlowPass;
  let mockDevice: any;
  let mockPassEncoder: any;
  let mockVertexBuffer: any;
  let mockUniformBuffer: any;

  beforeEach(() => {
    pass = new FlowPass();

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
        if (desc.usage & 0x0020) return mockVertexBuffer; // VERTEX
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

  it('updates logic correctly and covers bilinearSample', async () => {
    await pass.init(mockDevice, 'bgra8unorm');
    pass.setPalette([[1, 0, 0]]);

    const dummyVelField = new Float32Array((VF_W + 1) * (VF_H + 1) * 2);
    // fill the field with positive velocity to trigger the flow logic
    for (let i = 0; i < dummyVelField.length; i++) {
      dummyVelField[i] = 1.0;
    }
    const state = { velField: dummyVelField } as SimulationState;

    pass.update(state, 800, 600); // frame=1
    pass.update(state, 800, 600); // frame=2

    // frame=3 (triggers update logic)
    pass.update(state, 800, 600);

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

  it('handles low velocity in bilinearSample correctly', async () => {
    await pass.init(mockDevice, 'bgra8unorm');

    const dummyVelField = new Float32Array((VF_W + 1) * (VF_H + 1) * 2);
    // All 0s so length is < 0.01
    const state = { velField: dummyVelField } as SimulationState;

    pass.update(state, 800, 600); // frame=1
    pass.update(state, 800, 600); // frame=2
    pass.update(state, 800, 600); // frame=3

    // totalSegs should be 0 since length < 0.01 breaks the loop
    pass.draw(mockPassEncoder);
    expect(mockPassEncoder.draw).not.toHaveBeenCalled();
  });

  it('clears segments', async () => {
    await pass.init(mockDevice, 'bgra8unorm');

    const dummyVelField = new Float32Array((VF_W + 1) * (VF_H + 1) * 2);
    dummyVelField.fill(1.0);
    const state = { velField: dummyVelField } as SimulationState;

    pass.update(state, 800, 600); // f1
    pass.update(state, 800, 600); // f2
    pass.update(state, 800, 600); // f3 -> generates segments

    pass.clear();

    pass.draw(mockPassEncoder);
    expect(mockPassEncoder.draw).not.toHaveBeenCalled();
  });

  it('draws correctly', async () => {
    await pass.init(mockDevice, 'bgra8unorm');

    const dummyVelField = new Float32Array((VF_W + 1) * (VF_H + 1) * 2);
    dummyVelField.fill(1.0);
    const state = { velField: dummyVelField } as SimulationState;

    pass.update(state, 800, 600); // f1
    pass.update(state, 800, 600); // f2
    pass.update(state, 800, 600); // f3

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

  it('handles resize', () => {
    pass.resize(1024, 768);
  });
});

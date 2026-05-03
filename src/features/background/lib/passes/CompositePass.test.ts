import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompositePass } from './CompositePass';

describe('CompositePass', () => {
  let pass: CompositePass;
  let mockDevice: any;
  let mockEncoder: any;
  let mockPassEncoder: any;
  let mockTexture: any;
  let mockBuffer: any;

  beforeEach(() => {
    pass = new CompositePass();

    mockTexture = {
      createView: vi.fn().mockReturnValue({}),
      destroy: vi.fn(),
    };

    mockBuffer = {
      destroy: vi.fn(),
    };

    const mockPipeline = {
      getBindGroupLayout: vi.fn().mockReturnValue({}),
    };

    mockDevice = {
      createShaderModule: vi.fn().mockReturnValue({}),
      createRenderPipeline: vi.fn().mockResolvedValue(mockPipeline),
      createSampler: vi.fn().mockReturnValue({}),
      createBuffer: vi.fn().mockReturnValue(mockBuffer),
      createTexture: vi.fn().mockReturnValue(mockTexture),
      createBindGroup: vi.fn().mockReturnValue({}),
      queue: {
        writeBuffer: vi.fn(),
      },
    };

    mockPassEncoder = {
      setPipeline: vi.fn(),
      setBindGroup: vi.fn(),
      draw: vi.fn(),
      end: vi.fn(),
    };

    mockEncoder = {
      beginRenderPass: vi.fn().mockReturnValue(mockPassEncoder),
    };
  });

  it('initializes and creates offscreen resources', async () => {
    await pass.init(mockDevice, 'bgra8unorm', 800, 600);

    expect(mockDevice.createShaderModule).toHaveBeenCalled();
    expect(mockDevice.createRenderPipeline).toHaveBeenCalledTimes(2);
    expect(mockDevice.createSampler).toHaveBeenCalled();
    expect(mockDevice.createBuffer).toHaveBeenCalled();
    expect(mockDevice.createTexture).toHaveBeenCalled();
    expect(mockDevice.createBindGroup).toHaveBeenCalledTimes(3);

    expect(pass.getOffscreenView()).toBeDefined();
  });

  it('resizes offscreen texture', async () => {
    await pass.init(mockDevice, 'bgra8unorm', 800, 600);

    mockTexture.destroy.mockClear();
    pass.resize(mockDevice, 1024, 768);

    expect(mockTexture.destroy).toHaveBeenCalled();
    expect(mockDevice.createTexture).toHaveBeenCalledWith(
      expect.objectContaining({
        size: [1024, 768],
      })
    );
  });

  it('updates uniforms and writes to buffer', async () => {
    await pass.init(mockDevice, 'bgra8unorm', 800, 600);

    pass.setBgColor(1, 0.5, 0.2);
    pass.setThemeMode(1);
    pass.setGlassRect(10, 20, 100, 200);

    pass.update(16.6, 800, 600);

    expect(mockDevice.queue.writeBuffer).toHaveBeenCalledWith(
      mockBuffer,
      0,
      expect.any(ArrayBuffer)
    );
  });

  it('does not draw if not initialized', () => {
    pass.draw(mockEncoder, {} as GPUTextureView);
    expect(mockEncoder.beginRenderPass).not.toHaveBeenCalled();
  });

  it('draws blit pipeline and glass pipeline if glass is set', async () => {
    await pass.init(mockDevice, 'bgra8unorm', 800, 600);
    pass.setGlassRect(0, 0, 100, 100);

    pass.draw(mockEncoder, {} as GPUTextureView);

    expect(mockEncoder.beginRenderPass).toHaveBeenCalled();
    expect(mockPassEncoder.setPipeline).toHaveBeenCalledTimes(2); // Blit + Glass
    expect(mockPassEncoder.draw).toHaveBeenCalledTimes(2);
    expect(mockPassEncoder.end).toHaveBeenCalled();
  });

  it('draws only blit pipeline if glass is not set', async () => {
    await pass.init(mockDevice, 'bgra8unorm', 800, 600);

    pass.draw(mockEncoder, {} as GPUTextureView);

    expect(mockEncoder.beginRenderPass).toHaveBeenCalled();
    expect(mockPassEncoder.setPipeline).toHaveBeenCalledTimes(1); // Blit only
    expect(mockPassEncoder.draw).toHaveBeenCalledTimes(1);
    expect(mockPassEncoder.end).toHaveBeenCalled();
  });

  it('destroys resources', async () => {
    await pass.init(mockDevice, 'bgra8unorm', 800, 600);

    pass.destroy();

    expect(mockTexture.destroy).toHaveBeenCalled();
    expect(mockBuffer.destroy).toHaveBeenCalled();
  });
});

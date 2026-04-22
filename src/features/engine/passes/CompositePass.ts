import compositeShader from '../shaders/composite.wgsl?raw';

export class CompositePass {
  private offscreenTexture: GPUTexture | null = null;
  private offscreenView: GPUTextureView | null = null;
  private blitPipeline: GPURenderPipeline | null = null;
  private glassPipeline: GPURenderPipeline | null = null;
  private sampler: GPUSampler | null = null;
  private blitSceneBindGroup: GPUBindGroup | null = null;
  private glassSceneBindGroup: GPUBindGroup | null = null;
  private glassUniformBuffer: GPUBuffer | null = null;
  private glassBindGroup: GPUBindGroup | null = null;
  private glassUniform = new Float32Array(12); // rect(4) + resolution(2) + time + themeMode + bgColor(4)
  private format: GPUTextureFormat = 'bgra8unorm';
  private device: GPUDevice | null = null;
  private time = 0;
  private hasGlass = false;

  async init(
    device: GPUDevice,
    format: GPUTextureFormat,
    width: number,
    height: number
  ): Promise<void> {
    this.device = device;
    this.format = format;

    const module = device.createShaderModule({ code: compositeShader });

    this.blitPipeline = await device.createRenderPipeline({
      layout: 'auto',
      vertex: { module, entryPoint: 'blitVS' },
      fragment: { module, entryPoint: 'blitFS', targets: [{ format }] },
      primitive: { topology: 'triangle-strip' },
    });

    this.glassPipeline = await device.createRenderPipeline({
      layout: 'auto',
      vertex: { module, entryPoint: 'glassVS' },
      fragment: {
        module,
        entryPoint: 'glassFS',
        targets: [
          {
            format,
            blend: {
              color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
              alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
            },
          },
        ],
      },
      primitive: { topology: 'triangle-strip' },
    });

    this.sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });

    this.glassUniformBuffer = device.createBuffer({
      size: 48, // 12 floats × 4 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.createOffscreen(device, width, height);
  }

  private createOffscreen(device: GPUDevice, width: number, height: number): void {
    this.offscreenTexture?.destroy();
    this.offscreenTexture = device.createTexture({
      size: [width, height],
      format: this.format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.offscreenView = this.offscreenTexture.createView();

    if (this.blitPipeline && this.sampler) {
      this.blitSceneBindGroup = device.createBindGroup({
        layout: this.blitPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: this.offscreenView },
          { binding: 1, resource: this.sampler },
        ],
      });
    }

    if (this.glassPipeline && this.sampler) {
      this.glassSceneBindGroup = device.createBindGroup({
        layout: this.glassPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: this.offscreenView },
          { binding: 1, resource: this.sampler },
        ],
      });
    }

    if (this.glassPipeline && this.glassUniformBuffer) {
      this.glassBindGroup = device.createBindGroup({
        layout: this.glassPipeline.getBindGroupLayout(1),
        entries: [{ binding: 0, resource: { buffer: this.glassUniformBuffer } }],
      });
    }
  }

  resize(device: GPUDevice, width: number, height: number): void {
    this.createOffscreen(device, width, height);
  }

  setBgColor(r: number, g: number, b: number): void {
    this.glassUniform[8] = r;
    this.glassUniform[9] = g;
    this.glassUniform[10] = b;
    this.glassUniform[11] = 0;
  }

  setThemeMode(mode: number): void {
    this.glassUniform[7] = mode;
  }

  setGlassRect(x: number, y: number, w: number, h: number): void {
    this.glassUniform[0] = x;
    this.glassUniform[1] = y;
    this.glassUniform[2] = w;
    this.glassUniform[3] = h;
    this.hasGlass = true;
  }

  update(dt: number, width: number, height: number): void {
    this.time += dt * 0.001;
    this.glassUniform[4] = width;
    this.glassUniform[5] = height;
    this.glassUniform[6] = this.time;
    if (this.device && this.glassUniformBuffer) {
      this.device.queue.writeBuffer(this.glassUniformBuffer, 0, this.glassUniform.buffer);
    }
  }

  getOffscreenView(): GPUTextureView {
    // biome-ignore lint/style/noNonNullAssertion: guaranteed non-null after init()
    return this.offscreenView!;
  }

  draw(encoder: GPUCommandEncoder, swapchainView: GPUTextureView): void {
    if (!this.blitPipeline || !this.blitSceneBindGroup) {
      return;
    }

    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: swapchainView,
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });

    pass.setPipeline(this.blitPipeline);
    pass.setBindGroup(0, this.blitSceneBindGroup);
    pass.draw(4);

    if (this.hasGlass && this.glassPipeline && this.glassSceneBindGroup && this.glassBindGroup) {
      pass.setPipeline(this.glassPipeline);
      pass.setBindGroup(0, this.glassSceneBindGroup);
      pass.setBindGroup(1, this.glassBindGroup);
      pass.draw(4);
    }

    pass.end();
  }

  destroy(): void {
    this.offscreenTexture?.destroy();
    this.glassUniformBuffer?.destroy();
    this.offscreenTexture = null;
    this.offscreenView = null;
    this.blitPipeline = null;
    this.glassPipeline = null;
    this.sampler = null;
    this.blitSceneBindGroup = null;
    this.glassSceneBindGroup = null;
    this.glassUniformBuffer = null;
    this.glassBindGroup = null;
    this.device = null;
  }
}

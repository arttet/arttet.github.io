import type { SimulationState } from '../../model/SimulationState';
import edgesShader from '../../shaders/edges.wgsl?raw';
import particlesShader from '../../shaders/particles.wgsl?raw';
import trianglesShader from '../../shaders/triangles.wgsl?raw';
import type { IPass } from './IPass';

// Pre-allocate buffers for up to this many particles (covers spawn pool)
const MAX_PARTICLES = 500;

const ADDITIVE_BLEND: GPUBlendState = {
  color: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' },
  alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
};

export class ParticlesPass implements IPass {
  private device: GPUDevice | null = null;

  // Particle pipeline
  private particlePipeline: GPURenderPipeline | null = null;
  private particleVertexBuffer: GPUBuffer | null = null;
  private particleUniformBuffer: GPUBuffer | null = null;
  private particleBindGroup: GPUBindGroup | null = null;
  private particleUniform = new Float32Array([2.0, 0, 0, 0]); // pointScale, time, w, h

  // Edge pipeline
  private edgePipeline: GPURenderPipeline | null = null;
  private edgeVertexBuffer: GPUBuffer | null = null;
  private edgeUniformBuffer: GPUBuffer | null = null;
  private edgeBindGroup: GPUBindGroup | null = null;
  private edgeUniform = new Float32Array(4); // opacity, width, w, h
  private edgeCount = 0;

  // Triangle pipeline
  private trianglePipeline: GPURenderPipeline | null = null;
  private triangleVertexBuffer: GPUBuffer | null = null;
  private triangleUniformBuffer: GPUBuffer | null = null;
  private triangleBindGroup: GPUBindGroup | null = null;
  private triangleUniform = new Float32Array(4); // opacity, pad, w, h
  private triangleCount = 0;
  private particleCount = 0;

  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: read via destructuring in upload methods
  private width = 0;
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: read via destructuring in upload methods
  private height = 0;
  private time = 0;

  // Reused CPU buffer for edge NDC conversion
  private edgeNdcData = new Float32Array(MAX_PARTICLES * 6 * 12);

  async init(device: GPUDevice, format: GPUTextureFormat): Promise<void> {
    this.device = device;

    const particleModule = device.createShaderModule({ code: particlesShader });
    const edgeModule = device.createShaderModule({ code: edgesShader });
    const triModule = device.createShaderModule({ code: trianglesShader });

    this.particlePipeline = await device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: particleModule,
        entryPoint: 'vertexMain',
        buffers: [
          {
            arrayStride: 24,
            stepMode: 'instance',
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x2' },
              { shaderLocation: 1, offset: 8, format: 'float32x4' },
            ],
          },
        ],
      },
      fragment: {
        module: particleModule,
        entryPoint: 'fragmentMain',
        targets: [{ format, blend: ADDITIVE_BLEND }],
      },
      primitive: { topology: 'triangle-strip' },
    });

    this.edgePipeline = await device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: edgeModule,
        entryPoint: 'vertexMain',
        buffers: [
          {
            arrayStride: 48,
            stepMode: 'instance',
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x2' },
              { shaderLocation: 1, offset: 8, format: 'float32x2' },
              { shaderLocation: 2, offset: 16, format: 'float32x4' },
              { shaderLocation: 3, offset: 32, format: 'float32x4' },
            ],
          },
        ],
      },
      fragment: {
        module: edgeModule,
        entryPoint: 'fragmentMain',
        targets: [{ format, blend: ADDITIVE_BLEND }],
      },
      primitive: { topology: 'triangle-strip' },
    });

    this.trianglePipeline = await device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: triModule,
        entryPoint: 'vertexMain',
        buffers: [
          {
            arrayStride: 24,
            stepMode: 'vertex',
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x2' },
              { shaderLocation: 1, offset: 8, format: 'float32x4' },
            ],
          },
        ],
      },
      fragment: {
        module: triModule,
        entryPoint: 'fragmentMain',
        targets: [{ format, blend: ADDITIVE_BLEND }],
      },
      primitive: { topology: 'triangle-list' },
    });

    this.particleVertexBuffer = device.createBuffer({
      size: MAX_PARTICLES * 24,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.particleUniformBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.edgeVertexBuffer = device.createBuffer({
      size: MAX_PARTICLES * 6 * 48,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.edgeUniformBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.triangleVertexBuffer = device.createBuffer({
      size: MAX_PARTICLES * 4 * 3 * 24,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.triangleUniformBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.particleBindGroup = device.createBindGroup({
      layout: this.particlePipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: this.particleUniformBuffer } }],
    });
    this.edgeBindGroup = device.createBindGroup({
      layout: this.edgePipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: this.edgeUniformBuffer } }],
    });
    this.triangleBindGroup = device.createBindGroup({
      layout: this.trianglePipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: this.triangleUniformBuffer } }],
    });
  }

  update(state: SimulationState, width: number, height: number): void {
    if (!this.device) {
      return;
    }
    this.width = width;
    this.height = height;
    this.time += 1 / 60;

    this.uploadParticles(state);
    this.uploadEdges(state);
    this.uploadTriangles(state);
  }

  private uploadParticles(state: SimulationState): void {
    const { device, particleVertexBuffer, particleUniformBuffer } = this;
    if (!device || !particleVertexBuffer || !particleUniformBuffer) {
      return;
    }
    const { width, height } = this;

    const data = new Float32Array(state.count * 6);
    for (let i = 0; i < state.count; i++) {
      const s = i * 8;
      const d = i * 6;
      data[d + 0] = (state.particleData[s + 0] / width) * 2 - 1;
      data[d + 1] = 1 - (state.particleData[s + 1] / height) * 2;
      data[d + 2] = state.particleData[s + 4]; // r
      data[d + 3] = state.particleData[s + 5]; // g
      data[d + 4] = state.particleData[s + 6]; // b
      data[d + 5] = state.particleData[s + 7]; // alpha
    }
    device.queue.writeBuffer(particleVertexBuffer, 0, data.buffer, 0, state.count * 24);
    this.particleCount = state.count;

    this.particleUniform[0] = 2.0;
    this.particleUniform[1] = this.time;
    this.particleUniform[2] = width;
    this.particleUniform[3] = height;
    device.queue.writeBuffer(particleUniformBuffer, 0, this.particleUniform.buffer, 0, 16);
  }

  private uploadEdges(state: SimulationState): void {
    const { device, edgeVertexBuffer, edgeUniformBuffer } = this;
    if (!device || !edgeVertexBuffer || !edgeUniformBuffer) {
      return;
    }
    const { width, height } = this;

    const { edgeBuffer: buffer, edgeCount: count } = state;
    const ndc = this.edgeNdcData;
    for (let i = 0; i < count; i++) {
      const s = i * 12;
      ndc[s + 0] = (buffer[s + 0] / width) * 2 - 1;
      ndc[s + 1] = 1 - (buffer[s + 1] / height) * 2;
      ndc[s + 2] = (buffer[s + 2] / width) * 2 - 1;
      ndc[s + 3] = 1 - (buffer[s + 3] / height) * 2;
      for (let j = 4; j < 12; j++) {
        ndc[s + j] = buffer[s + j];
      }
    }
    if (count > 0) {
      device.queue.writeBuffer(edgeVertexBuffer, 0, ndc.buffer, 0, count * 48);
    }

    this.edgeUniform[0] = 0.5; // opacity
    this.edgeUniform[1] = 2.0; // width
    this.edgeUniform[2] = width;
    this.edgeUniform[3] = height;
    device.queue.writeBuffer(edgeUniformBuffer, 0, this.edgeUniform.buffer);
    this.edgeCount = count;
  }

  private uploadTriangles(state: SimulationState): void {
    const { device, triangleVertexBuffer, triangleUniformBuffer } = this;
    if (!device || !triangleVertexBuffer || !triangleUniformBuffer) {
      return;
    }
    const { width, height } = this;

    const { triBuffer: buffer, triCount: count } = state;
    if (count > 0) {
      device.queue.writeBuffer(triangleVertexBuffer, 0, buffer.buffer, 0, count * 3 * 24);
    }

    this.triangleUniform[0] = 1.0; // opacity
    this.triangleUniform[1] = 0.0;
    this.triangleUniform[2] = width;
    this.triangleUniform[3] = height;
    device.queue.writeBuffer(triangleUniformBuffer, 0, this.triangleUniform.buffer);
    this.triangleCount = count;
  }

  draw(pass: GPURenderPassEncoder): void {
    // ── Triangle pass ─────────────────────────────────────────────────────
    if (
      this.trianglePipeline &&
      this.triangleVertexBuffer &&
      this.triangleBindGroup &&
      this.triangleCount > 0
    ) {
      pass.setPipeline(this.trianglePipeline);
      pass.setBindGroup(0, this.triangleBindGroup);
      pass.setVertexBuffer(0, this.triangleVertexBuffer);
      pass.draw(this.triangleCount * 3);
    }

    // ── Edge pass ─────────────────────────────────────────────────────────
    if (this.edgePipeline && this.edgeVertexBuffer && this.edgeBindGroup && this.edgeCount > 0) {
      pass.setPipeline(this.edgePipeline);
      pass.setBindGroup(0, this.edgeBindGroup);
      pass.setVertexBuffer(0, this.edgeVertexBuffer);
      pass.draw(4, this.edgeCount);
    }

    // ── Particle pass ─────────────────────────────────────────────────────
    if (
      this.particlePipeline &&
      this.particleVertexBuffer &&
      this.particleBindGroup &&
      this.particleCount > 0
    ) {
      pass.setPipeline(this.particlePipeline);
      pass.setBindGroup(0, this.particleBindGroup);
      pass.setVertexBuffer(0, this.particleVertexBuffer);
      pass.draw(4, this.particleCount);
    }
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  setPalette(_colors: [number, number, number][]): void {}

  clear(): void {
    this.particleCount = 0;
    this.edgeCount = 0;
    this.triangleCount = 0;
  }

  destroy(): void {
    this.particleVertexBuffer?.destroy();
    this.particleUniformBuffer?.destroy();
    this.edgeVertexBuffer?.destroy();
    this.edgeUniformBuffer?.destroy();
    this.triangleVertexBuffer?.destroy();
    this.triangleUniformBuffer?.destroy();
    this.device = null;
    this.particlePipeline = null;
    this.edgePipeline = null;
    this.trianglePipeline = null;
    this.particleVertexBuffer = null;
    this.particleUniformBuffer = null;
    this.edgeVertexBuffer = null;
    this.edgeUniformBuffer = null;
    this.triangleVertexBuffer = null;
    this.triangleUniformBuffer = null;
    this.particleBindGroup = null;
    this.edgeBindGroup = null;
    this.triangleBindGroup = null;
  }
}

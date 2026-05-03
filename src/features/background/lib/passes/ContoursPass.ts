import { marchingSquares } from '../../model/MarchingSquares';
import { GRID_H, GRID_W } from '../../model/SimulationConstants';
import type { SimulationState } from '../../model/SimulationState';
import edgesShader from '../../shaders/edges.wgsl?raw';
import type { IPass } from './IPass';

const LEVELS = 6;
const MAX_SEGS = 24_000;

const ADDITIVE_BLEND: GPUBlendState = {
  color: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' },
  alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
};

export class ContoursPass implements IPass {
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: used via destructuring
  private device: GPUDevice | null = null;
  private pipeline: GPURenderPipeline | null = null;
  private vertexBuffer: GPUBuffer | null = null;
  private uniformBuffer: GPUBuffer | null = null;
  private bindGroup: GPUBindGroup | null = null;
  private uniform = new Float32Array(4); // opacity, lineWidth, w, h
  private cpuBuffer = new Float32Array(MAX_SEGS * 12);
  private heightmap = new Float32Array((GRID_W + 1) * (GRID_H + 1));
  private segTemp = new Float32Array(MAX_SEGS * 4);
  private totalSegs = 0;
  private frame = 0;
  private palette: [number, number, number][] = [[0.0, 1.0, 1.0]];

  async init(device: GPUDevice, format: GPUTextureFormat): Promise<void> {
    this.device = device;
    const module = device.createShaderModule({ code: edgesShader });

    this.pipeline = await device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module,
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
        module,
        entryPoint: 'fragmentMain',
        targets: [{ format, blend: ADDITIVE_BLEND }],
      },
      primitive: { topology: 'triangle-strip' },
    });

    this.vertexBuffer = device.createBuffer({
      size: MAX_SEGS * 48,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.uniformBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.bindGroup = device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: this.uniformBuffer } }],
    });
  }

  update(state: SimulationState, width: number, height: number): void {
    const { device, vertexBuffer, uniformBuffer } = this;
    if (!device || !vertexBuffer || !uniformBuffer) {
      return;
    }
    this.frame++;
    if (this.frame % 2 !== 0) {
      return;
    }

    this.heightmap.set(state.heightmap);
    let maxH = 0;
    for (let i = 0; i < this.heightmap.length; i++) {
      if (this.heightmap[i] > maxH) {
        maxH = this.heightmap[i];
      }
    }
    if (maxH < 1e-6) {
      this.totalSegs = 0;
      return;
    }

    let out = 0;
    for (let lv = 0; lv < LEVELS; lv++) {
      const threshold = (maxH * (lv + 1)) / (LEVELS + 1);
      const alpha = 0.08 + (lv / (LEVELS - 1)) * 0.57;
      const color = this.palette[lv % this.palette.length];

      const count = marchingSquares(this.heightmap, GRID_W, GRID_H, threshold, this.segTemp);
      for (let i = 0; i < count && out < MAX_SEGS; i++, out++) {
        const s = i * 4;
        const x1 = (this.segTemp[s + 0] / GRID_W) * 2 - 1;
        const y1 = 1 - (this.segTemp[s + 1] / GRID_H) * 2;
        const x2 = (this.segTemp[s + 2] / GRID_W) * 2 - 1;
        const y2 = 1 - (this.segTemp[s + 3] / GRID_H) * 2;
        const d = out * 12;
        this.cpuBuffer[d + 0] = x1;
        this.cpuBuffer[d + 1] = y1;
        this.cpuBuffer[d + 2] = x2;
        this.cpuBuffer[d + 3] = y2;
        this.cpuBuffer[d + 4] = color[0];
        this.cpuBuffer[d + 5] = color[1];
        this.cpuBuffer[d + 6] = color[2];
        this.cpuBuffer[d + 7] = alpha;
        this.cpuBuffer[d + 8] = color[0];
        this.cpuBuffer[d + 9] = color[1];
        this.cpuBuffer[d + 10] = color[2];
        this.cpuBuffer[d + 11] = alpha;
      }
    }
    this.totalSegs = out;
    if (out > 0) {
      device.queue.writeBuffer(vertexBuffer, 0, this.cpuBuffer.buffer, 0, out * 48);
    }

    this.uniform[0] = 1.0; // opacity
    this.uniform[1] = 1.5; // lineWidth
    this.uniform[2] = width;
    this.uniform[3] = height;
    device.queue.writeBuffer(uniformBuffer, 0, this.uniform.buffer);
  }

  draw(pass: GPURenderPassEncoder): void {
    if (!this.pipeline || !this.vertexBuffer || !this.bindGroup || this.totalSegs === 0) {
      return;
    }
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.draw(4, this.totalSegs);
  }

  resize(_w: number, _h: number): void {}

  setPalette(colors: [number, number, number][]): void {
    this.palette = colors;
  }

  clear(): void {
    this.totalSegs = 0;
  }

  destroy(): void {
    this.vertexBuffer?.destroy();
    this.uniformBuffer?.destroy();
    this.device = null;
    this.pipeline = null;
    this.vertexBuffer = null;
    this.uniformBuffer = null;
    this.bindGroup = null;
  }
}

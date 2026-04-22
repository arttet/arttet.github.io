import { VF_H, VF_W } from '../core/SimulationConstants';
import type { SimulationState } from '../core/SimulationState';
import edgesShader from '../shaders/edges.wgsl?raw';
import type { IPass } from './IPass';

const SEEDS_X = 20;
const SEEDS_Y = 12;
const STEPS = 20;
const STEP_PX = 15;
const MAX_SEGS = 4_560; // SEEDS_X × SEEDS_Y × (STEPS - 1)

const ADDITIVE_BLEND: GPUBlendState = {
  color: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' },
  alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
};

function bilinearSample(
  field: Float32Array,
  gridW: number,
  gridH: number,
  u: number,
  v: number
): [number, number] {
  const x = Math.max(0, Math.min(gridW - 0.001, u));
  const y = Math.max(0, Math.min(gridH - 0.001, v));
  const col = Math.floor(x);
  const row = Math.floor(y);
  const tx = x - col;
  const ty = y - row;
  const stride = gridW + 1;
  const i00 = (row * stride + col) * 2;
  const i10 = (row * stride + col + 1) * 2;
  const i01 = ((row + 1) * stride + col) * 2;
  const i11 = ((row + 1) * stride + col + 1) * 2;
  const vx =
    field[i00] * (1 - tx) * (1 - ty) +
    field[i10] * tx * (1 - ty) +
    field[i01] * (1 - tx) * ty +
    field[i11] * tx * ty;
  const vy =
    field[i00 + 1] * (1 - tx) * (1 - ty) +
    field[i10 + 1] * tx * (1 - ty) +
    field[i01 + 1] * (1 - tx) * ty +
    field[i11 + 1] * tx * ty;
  return [vx, vy];
}

export class FlowPass implements IPass {
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: used via destructuring
  private device: GPUDevice | null = null;
  private pipeline: GPURenderPipeline | null = null;
  private vertexBuffer: GPUBuffer | null = null;
  private uniformBuffer: GPUBuffer | null = null;
  private bindGroup: GPUBindGroup | null = null;
  private uniform = new Float32Array(4); // opacity, lineWidth, w, h
  private cpuBuffer = new Float32Array(MAX_SEGS * 12);
  private velField = new Float32Array((VF_W + 1) * (VF_H + 1) * 2);
  private totalSegs = 0;
  private frame = 0;
  private palette: [number, number, number][] = [[0.0, 1.0, 1.0]];
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: used via destructuring
  private width = 0;
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: used via destructuring
  private height = 0;

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
    this.width = width;
    this.height = height;
    this.frame++;
    if (this.frame % 3 !== 0) {
      return;
    }

    this.velField.set(state.velField);

    const cellW = width / VF_W;
    const cellH = height / VF_H;
    let out = 0;

    for (let sy = 0; sy < SEEDS_Y; sy++) {
      for (let sx = 0; sx < SEEDS_X; sx++) {
        let x = (sx + 0.5) * (width / SEEDS_X);
        let y = (sy + 0.5) * (height / SEEDS_Y);
        const color = this.palette[(sy * SEEDS_X + sx) % this.palette.length];

        for (let step = 0; step < STEPS - 1 && out < MAX_SEGS; step++) {
          const [vx, vy] = bilinearSample(this.velField, VF_W, VF_H, x / cellW, y / cellH);
          const len = Math.hypot(vx, vy);
          if (len < 0.01) {
            break;
          }

          const nx = x + (vx / len) * STEP_PX;
          const ny = y + (vy / len) * STEP_PX;
          const alpha = 0.6 * (1 - step / STEPS);

          const ndcX1 = (x / width) * 2 - 1;
          const ndcY1 = 1 - (y / height) * 2;
          const ndcX2 = (nx / width) * 2 - 1;
          const ndcY2 = 1 - (ny / height) * 2;

          const d = out * 12;
          this.cpuBuffer[d + 0] = ndcX1;
          this.cpuBuffer[d + 1] = ndcY1;
          this.cpuBuffer[d + 2] = ndcX2;
          this.cpuBuffer[d + 3] = ndcY2;
          this.cpuBuffer[d + 4] = color[0];
          this.cpuBuffer[d + 5] = color[1];
          this.cpuBuffer[d + 6] = color[2];
          this.cpuBuffer[d + 7] = alpha;
          this.cpuBuffer[d + 8] = color[0];
          this.cpuBuffer[d + 9] = color[1];
          this.cpuBuffer[d + 10] = color[2];
          this.cpuBuffer[d + 11] = alpha * 0.3;

          out++;
          x = nx;
          y = ny;
        }
      }
    }

    this.totalSegs = out;
    if (out > 0) {
      device.queue.writeBuffer(vertexBuffer, 0, this.cpuBuffer.buffer, 0, out * 48);
    }

    this.uniform[0] = 1.0; // opacity
    this.uniform[1] = 1.0; // lineWidth
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

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

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

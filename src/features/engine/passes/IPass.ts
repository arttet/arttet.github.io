import type { SimulationState } from '../core/SimulationState';

export interface IPass {
  init(device: GPUDevice, format: GPUTextureFormat): Promise<void>;
  update(state: SimulationState, width: number, height: number): void;
  draw(pass: GPURenderPassEncoder): void;
  resize(width: number, height: number): void;
  setPalette(colors: [number, number, number][]): void;
  clear(): void;
  destroy(): void;
}

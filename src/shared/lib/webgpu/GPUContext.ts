export class GPUContext {
  readonly device: GPUDevice;
  readonly context: GPUCanvasContext;
  readonly format: GPUTextureFormat;
  readonly dpr: number;
  width: number;
  height: number;

  private constructor(
    device: GPUDevice,
    context: GPUCanvasContext,
    format: GPUTextureFormat,
    dpr: number,
    width: number,
    height: number
  ) {
    this.device = device;
    this.context = context;
    this.format = format;
    this.dpr = dpr;
    this.width = width;
    this.height = height;
  }

  static async create(canvas: HTMLCanvasElement): Promise<GPUContext> {
    if (!navigator.gpu) {
      throw new Error('WebGPU not supported');
    }
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error('No GPU adapter');
    }
    const device = await adapter.requestDevice();
    const context = canvas.getContext('webgpu') as GPUCanvasContext;
    const format = navigator.gpu.getPreferredCanvasFormat();
    const dpr = Math.min(devicePixelRatio, 2);
    const width = canvas.clientWidth * dpr;
    const height = canvas.clientHeight * dpr;
    canvas.width = width;
    canvas.height = height;
    context.configure({ device, format, alphaMode: 'premultiplied' });
    return new GPUContext(device, context, format, dpr, width, height);
  }

  reconfigure(): void {
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'premultiplied',
    });
  }

  destroy(): void {
    this.device.destroy();
  }
}

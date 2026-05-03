import type { SimulationState } from '../model/SimulationState';
import { CompositePass } from '../lib/passes/CompositePass';
import { ContoursPass } from '../lib/passes/ContoursPass';
import { FlowPass } from '../lib/passes/FlowPass';
import type { IPass } from '../lib/passes/IPass';
import { ParticlesPass } from '../lib/passes/ParticlesPass';

import { site } from '$shared/config/site';

export type ModeName = 'particles' | 'contours' | 'flow';

interface BackgroundSceneConfig {
  canvas: HTMLCanvasElement;
  particleCount?: number;
  particleSpeed?: number;
  cursorRadius?: number;
  cursorForce?: number;
  cursorMode?: 'attract' | 'repulse';
  maxDist?: number;
  colors?: [number, number, number][];
}

export class BackgroundScene {
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private format: GPUTextureFormat = 'bgra8unorm';
  private worker: Worker | null = null;
  private lastState: SimulationState | null = null;
  private currentMode: IPass | null = null;
  private composite: CompositePass | null = null;
  private modeName: ModeName = 'particles';
  private width = 0;
  private height = 0;
  private dpr = 1;
  private canvas: HTMLCanvasElement | null = null;
  private resizeObserver: ResizeObserver | null = null;

  async init(config: BackgroundSceneConfig): Promise<void> {
    const {
      canvas,
      particleCount = 200,
      particleSpeed = 0.15,
      cursorRadius = 200,
      cursorForce = 0.5,
      cursorMode = 'attract',
      maxDist = 150,
      colors = [
        [1.0, 0.4, 0.3],
        [0.0, 0.83, 0.67],
        [1.0, 1.0, 0.0],
        [0.5, 0.3, 1.0],
      ],
    } = config;
    this.canvas = canvas;

    if (!navigator.gpu) {
      throw new Error('WebGPU not supported');
    }
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error('No GPU adapter');
    }
    this.device = await adapter.requestDevice();

    this.context = canvas.getContext('webgpu') as GPUCanvasContext;
    this.format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'premultiplied',
    });

    this.dpr = Math.min(devicePixelRatio, 2);
    this.width = canvas.clientWidth * this.dpr;
    this.height = canvas.clientHeight * this.dpr;
    canvas.width = this.width;
    canvas.height = this.height;

    this.worker = new Worker(new URL('../model/simulation.worker.ts', import.meta.url), {
      type: 'module',
    });
    this.worker.addEventListener('message', (e: MessageEvent) => {
      if (e.data.type === 'frame') {
        this.lastState = e.data as SimulationState;
      }
    });
    this.worker?.postMessage({
      cmd: 'init',
      config: {
        count: particleCount,
        width: this.width,
        height: this.height,
        speed: particleSpeed,
        colors,
        cursorRadius,
        cursorForce,
        cursorMode,
        maxDist,
      },
    });

    this.composite = new CompositePass();
    await this.composite.init(this.device, this.format, this.width, this.height);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(canvas);

    await this.loadMode('particles');
  }

  async setMode(name: ModeName): Promise<void> {
    if (name === this.modeName && this.currentMode) {
      return;
    }
    this.currentMode?.destroy();
    this.currentMode = null;
    this.modeName = name;
    await this.loadMode(name);
  }

  private async loadMode(name: ModeName): Promise<void> {
    if (!this.device) {
      return;
    }
    let mode: IPass;
    if (name === 'contours') {
      mode = new ContoursPass();
    } else if (name === 'flow') {
      mode = new FlowPass();
    } else {
      mode = new ParticlesPass();
    }
    await mode.init(this.device, this.format);
    mode.resize(this.width, this.height);
    const isDark = document.documentElement.classList.contains('dark');
    mode.setPalette(site.particles.colors[isDark ? 'dark' : 'light']);
    this.currentMode = mode;
  }

  render(dt: number): void {
    if (!this.device || !this.context || !this.currentMode || !this.composite) {
      return;
    }

    this.worker?.postMessage({ cmd: 'step', dt });

    if (this.lastState) {
      this.currentMode.update(this.lastState, this.width, this.height);
    }
    this.composite.update(dt, this.width, this.height);

    const encoder = this.device.createCommandEncoder();

    const offscreenPass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.composite.getOffscreenView(),
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });
    this.currentMode.draw(offscreenPass);
    offscreenPass.end();

    const swapchainView = this.context.getCurrentTexture().createView();
    this.composite.draw(encoder, swapchainView);

    this.device.queue.submit([encoder.finish()]);
  }

  setCursor(x: number, y: number): void {
    this.worker?.postMessage({ cmd: 'setCursor', x: x * this.dpr, y: y * this.dpr });
  }

  clearCursor(): void {
    this.worker?.postMessage({ cmd: 'clearCursor' });
  }

  setBgColor(r: number, g: number, b: number): void {
    this.composite?.setBgColor(r, g, b);
  }

  setThemeMode(isDark: boolean): void {
    this.lastState = null;
    this.currentMode?.clear();
    this.composite?.setThemeMode(isDark ? 1 : 0);
    // Force write buffer immediately
    if (this.device && this.composite) {
      this.composite.update(0, this.width, this.height);
    }
    const palette = site.particles.colors[isDark ? 'dark' : 'light'];
    this.currentMode?.setPalette(palette);
  }

  setParticleColors(colors: [number, number, number][]): void {
    this.lastState = null;
    this.currentMode?.clear();
    this.currentMode?.setPalette(colors);
    this.worker?.postMessage({ cmd: 'setColors', colors });
  }

  updateGlassRect(x: number, y: number, w: number, h: number): void {
    this.composite?.setGlassRect(x * this.dpr, y * this.dpr, w * this.dpr, h * this.dpr);
  }

  clickBurst(x: number, y: number): void {
    this.worker?.postMessage({
      cmd: 'clickBurst',
      x: x * this.dpr,
      y: y * this.dpr,
      radius: 150,
      force: 5,
    });
  }

  private handleResize(): void {
    if (!this.canvas || !this.device || !this.context) {
      return;
    }
    const dpr = Math.min(devicePixelRatio, 2);
    const w = this.canvas.clientWidth * dpr;
    const h = this.canvas.clientHeight * dpr;
    if (w === this.width && h === this.height) {
      return;
    }
    this.dpr = dpr;
    this.canvas.width = w;
    this.canvas.height = h;
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'premultiplied',
    });
    this.worker?.postMessage({ cmd: 'resize', width: w, height: h });
    this.currentMode?.resize(w, h);
    this.composite?.resize(this.device, w, h);
    this.width = w;
    this.height = h;
  }

  destroy(): void {
    this.resizeObserver?.disconnect();
    this.worker?.terminate();
    this.worker = null;
    this.currentMode?.destroy();
    this.composite?.destroy();
    this.device?.destroy();
    this.device = null;
    this.context = null;
    this.lastState = null;
    this.currentMode = null;
    this.composite = null;
  }
}

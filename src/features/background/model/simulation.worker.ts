import { Simulation } from './Simulation';
import { GRID_H, GRID_W, VF_H, VF_W } from './SimulationConstants';

type Color = [number, number, number];

type SimulationConfig = {
  count: number;
  width: number;
  height: number;
  speed: number;
  colors: Color[];
  cursorRadius: number;
  cursorForce: number;
  cursorMode: 'attract' | 'repulse';
  maxDist: number;
};

type WorkerCommand =
  | { cmd: 'init'; config: SimulationConfig }
  | { cmd: 'step'; dt: number }
  | { cmd: 'setCursor'; x: number; y: number }
  | { cmd: 'clearCursor' }
  | { cmd: 'setColors'; colors: Color[] }
  | { cmd: 'clickBurst'; x: number; y: number; radius: number; force: number }
  | { cmd: 'resize'; width: number; height: number };

let sim: Simulation | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPositiveNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

function isColor(value: unknown): value is Color {
  return Array.isArray(value) && value.length === 3 && value.every(isFiniteNumber);
}

function isColors(value: unknown): value is Color[] {
  return Array.isArray(value) && value.length > 0 && value.every(isColor);
}

function isCursorMode(value: unknown): value is SimulationConfig['cursorMode'] {
  return value === 'attract' || value === 'repulse';
}

function isSimulationConfig(value: unknown): value is SimulationConfig {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isPositiveNumber(value.count) &&
    isPositiveNumber(value.width) &&
    isPositiveNumber(value.height) &&
    isFiniteNumber(value.speed) &&
    isColors(value.colors) &&
    isPositiveNumber(value.cursorRadius) &&
    isFiniteNumber(value.cursorForce) &&
    isCursorMode(value.cursorMode) &&
    isPositiveNumber(value.maxDist)
  );
}

function parseWorkerCommand(data: unknown): WorkerCommand | null {
  if (!isRecord(data) || typeof data.cmd !== 'string') {
    return null;
  }

  switch (data.cmd) {
    case 'init':
      return isSimulationConfig(data.config) ? { cmd: 'init', config: data.config } : null;
    case 'step':
      return isFiniteNumber(data.dt) ? { cmd: 'step', dt: data.dt } : null;
    case 'setCursor':
      return isFiniteNumber(data.x) && isFiniteNumber(data.y)
        ? { cmd: 'setCursor', x: data.x, y: data.y }
        : null;
    case 'clearCursor':
      return { cmd: 'clearCursor' };
    case 'setColors':
      return isColors(data.colors) ? { cmd: 'setColors', colors: data.colors } : null;
    case 'clickBurst':
      return isFiniteNumber(data.x) &&
        isFiniteNumber(data.y) &&
        isPositiveNumber(data.radius) &&
        isFiniteNumber(data.force)
        ? { cmd: 'clickBurst', x: data.x, y: data.y, radius: data.radius, force: data.force }
        : null;
    case 'resize':
      return isPositiveNumber(data.width) && isPositiveNumber(data.height)
        ? { cmd: 'resize', width: data.width, height: data.height }
        : null;
    default:
      return null;
  }
}

function postFrame() {
  if (!sim) {
    return;
  }
  const { buffer: edgeBuf, count: edgeCount } = sim.getEdgeData();
  const { buffer: triBuf, count: triCount } = sim.getTriangleData();

  const particleData = sim.data.slice();
  const edgeBuffer = edgeBuf.slice(0, edgeCount * 12);
  const triBuffer = triBuf.slice(0, triCount * 18);
  const heightmap = new Float32Array((GRID_W + 1) * (GRID_H + 1));
  const velField = new Float32Array((VF_W + 1) * (VF_H + 1) * 2);
  sim.generateHeightmap(GRID_W, GRID_H, heightmap);
  sim.getVelocityField(VF_W, VF_H, velField);

  // biome-ignore lint/suspicious/noExplicitAny: postMessage with transferables
  (self as any).postMessage(
    {
      type: 'frame',
      count: sim.count,
      particleData,
      edgeBuffer,
      edgeCount,
      triBuffer,
      triCount,
      heightmap,
      velField,
    },
    [particleData.buffer, edgeBuffer.buffer, triBuffer.buffer, heightmap.buffer, velField.buffer]
  );
}

self.addEventListener('message', (e: MessageEvent) => {
  const message = parseWorkerCommand(e.data);
  if (!message) {
    return;
  }

  if (message.cmd === 'init') {
    sim = new Simulation(message.config);
  } else if (message.cmd === 'step' && sim) {
    sim.step(message.dt);
    postFrame();
  } else if (message.cmd === 'setCursor' && sim) {
    sim.setCursor(message.x, message.y);
  } else if (message.cmd === 'clearCursor' && sim) {
    sim.clearCursor();
  } else if (message.cmd === 'setColors' && sim) {
    sim.setColors(message.colors);
    postFrame();
  } else if (message.cmd === 'clickBurst' && sim) {
    sim.clickBurst(message.x, message.y, message.radius, message.force);
  } else if (message.cmd === 'resize' && sim) {
    sim.resize(message.width, message.height);
  }
});

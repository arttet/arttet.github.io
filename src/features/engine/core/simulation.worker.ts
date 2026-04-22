import { Simulation } from './Simulation';
import { GRID_H, GRID_W, VF_H, VF_W } from './SimulationConstants';

let sim: Simulation | null = null;

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
  const { cmd } = e.data;
  if (cmd === 'init') {
    sim = new Simulation(e.data.config);
  } else if (cmd === 'step' && sim) {
    sim.step(e.data.dt);
    postFrame();
  } else if (cmd === 'setCursor' && sim) {
    sim.setCursor(e.data.x, e.data.y);
  } else if (cmd === 'clearCursor' && sim) {
    sim.clearCursor();
  } else if (cmd === 'setColors' && sim) {
    sim.setColors(e.data.colors);
    postFrame();
  } else if (cmd === 'clickBurst' && sim) {
    sim.clickBurst(e.data.x, e.data.y, e.data.radius, e.data.force);
  } else if (cmd === 'resize' && sim) {
    sim.resize(e.data.width, e.data.height);
  }
});

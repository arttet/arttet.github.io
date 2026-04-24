// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { Simulation } from './Simulation';

describe('Simulation exhaustive logic', () => {
  const config = {
    count: 10,
    width: 1000,
    height: 1000,
    speed: 1,
    colors: [[1, 0, 0] as [number, number, number]],
    cursorRadius: 100,
    cursorForce: 1,
    cursorMode: 'repulse' as const,
    maxDist: 150,
  };

  it('handles resize and scales positions', () => {
    const sim = new Simulation(config);
    sim.data[0] = 500; // center
    sim.data[1] = 500;

    sim.resize(2000, 2000);
    expect(sim.data[0]).toBe(1000);
    expect(sim.data[1]).toBe(1000);
  });

  it('wraps particles at field boundaries', () => {
    const sim = new Simulation(config);
    // Boundary is 10000 (FIELD constant). Particles wrap when x > FIELD or x < -FIELD.
    sim.data[0] = 10001;
    sim.data[1] = 500;
    sim.data[2] = 0; // stop movement to test only wrap
    sim.data[3] = 0;

    sim.step(16);
    // 10001 > 10000 -> 10001 - 20000 = -9999
    expect(sim.data[0]).toBeLessThan(0);

    sim.data[0] = -10001;
    sim.step(16);
    // -10001 < -10000 -> -10001 + 20000 = 9999
    expect(sim.data[0]).toBeGreaterThan(0);
  });

  it('updates colors and recomputes edges', () => {
    const sim = new Simulation(config);
    const newColors: [number, number, number][] = [[0, 1, 0]];
    sim.setColors(newColors);
    expect(sim.data[4]).toBe(0); // r
    expect(sim.data[5]).toBe(1); // g
    expect(sim.data[6]).toBe(0); // b
  });

  it('calculates velocity field correctly', () => {
    const sim = new Simulation(config);
    sim.data[0] = 100;
    sim.data[1] = 100;
    sim.data[2] = 50; // vx
    sim.data[3] = 50; // vy

    const vf = new Float32Array(20 * 20 * 2);
    sim.getVelocityField(19, 19, vf);

    const sum = vf.reduce((a, b) => a + b, 0);
    expect(sum).toBeGreaterThan(0);
  });

  it('returns NDC positions with alpha', () => {
    const sim = new Simulation(config);
    sim.data[0] = 0;
    sim.data[1] = 0;
    sim.data[7] = 0.8; // alpha

    const ndc = new Float32Array(sim.count * 3);
    sim.getPositionsNDC(ndc);

    expect(ndc[0]).toBe(-1); // left
    expect(ndc[1]).toBe(1); // top
    // Use toBeCloseTo for float precision
    expect(ndc[2]).toBeCloseTo(0.8, 5);
  });

  it('returns screen positions and colors', () => {
    const sim = new Simulation(config);
    sim.data[0] = 123;
    sim.data[4] = 0.5; // r

    const out = new Float32Array(sim.count * 6);
    sim.getPositionsAndColors(out);

    expect(out[0]).toBe(123);
    expect(out[2]).toBe(0.5);
  });
});

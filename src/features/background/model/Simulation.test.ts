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
    sim.data[0] = 10001; // x > FIELD
    sim.data[1] = 10001; // y > FIELD
    sim.data[2] = 0; // stop movement to test only wrap
    sim.data[3] = 0;

    sim.step(16);
    expect(sim.data[0]).toBeLessThan(0);
    expect(sim.data[1]).toBeLessThan(0);

    sim.data[0] = -10001; // x < -FIELD
    sim.data[1] = -10001; // y < -FIELD
    sim.step(16);
    expect(sim.data[0]).toBeGreaterThan(0);
    expect(sim.data[1]).toBeGreaterThan(0);
  });

  it('applies clickBurst correctly', () => {
    const sim = new Simulation(config);
    sim.data[0] = 505; // close to cursor
    sim.data[1] = 500;
    sim.data[2] = 0; // vx
    sim.data[3] = 0; // vy

    sim.clickBurst(500, 500, 100, 10);

    // Particle should have gained velocity
    expect(sim.data[2]).not.toBe(0);
  });

  it('interacts with cursor during step', () => {
    const sim = new Simulation(config);
    sim.setCursor(500, 500);
    sim.data[0] = 505;
    sim.data[1] = 500;
    sim.data[2] = 0;
    sim.data[3] = 0;

    sim.step(16);

    // Should have gained velocity due to cursor force
    expect(sim.data[2]).not.toBe(0);

    sim.clearCursor();
  });

  it('clamps speed if it exceeds maxSpeed', () => {
    const sim = new Simulation(config);
    sim.data[0] = 500;
    sim.data[1] = 500;
    sim.data[2] = 100; // huge vx
    sim.data[3] = 100; // huge vy

    sim.step(16);

    const speed = Math.hypot(sim.data[2], sim.data[3]);
    expect(speed).toBeLessThanOrEqual(config.speed * 1.5 * 1.01); // maxBaseSpeed * 1.5 + precision
  });

  it('skips triangles with high fade (distance near maxDist)', () => {
    const sim = new Simulation({ ...config, count: 3 }); // 3 particles to force 1 triangle

    // Place them in a triangle, but one edge is very long (distance > 143, maxDist is 150)
    sim.data[0] = 0;
    sim.data[1] = 0;
    sim.data[8] = 145;
    sim.data[9] = 0; // Distance 145
    sim.data[16] = 72;
    sim.data[17] = 10;

    // Recompute edges
    sim.step(16);

    const { count } = sim.getTriangleData();
    // Because fade is < 0.01 (145/150^2), it should skip the triangle
    expect(count).toBe(0);
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

import { Delaunay } from 'd3-delaunay';

interface SimulationConfig {
  count: number;
  width: number;
  height: number;
  speed: number;
  colors: [number, number, number][];
  cursorRadius: number;
  cursorForce: number;
  cursorMode: 'attract' | 'repulse';
  maxDist: number; // max edge distance for connections
}

// Particle layout per slot (STRIDE = 8):
// 0: x, 1: y    — current position (screen coords)
// 2: vx, 3: vy  — velocity
// 4: r, 5: g, 6: b — assigned color
// 7: alpha      — render opacity
const STRIDE = 8;

const FIELD = 10_000; // virtual wrap boundary (pixels from origin)

export class Simulation {
  readonly count: number;
  readonly data: Float32Array;

  private width: number;
  private height: number;
  private speed: number;
  private colors: [number, number, number][];
  private cursorRadius: number;
  private cursorForce: number;
  private cursorMode: 'attract' | 'repulse';
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: false positive
  private cursorX = -9999;
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: false positive
  private cursorY = -9999;

  // Delaunay
  private maxDist: number;
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: false positive
  private edgeData: Float32Array; // [x1, y1, x2, y2, r1, g1, b1, alpha1, r2, g2, b2, alpha2] per edge
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: false positive
  private edgeIndices: Uint32Array;
  private triangleData: Float32Array; // 3 verts × 6 floats per triangle
  private frameCounter = 2; // start near threshold so edges compute on 1st step
  private readonly DELAUNAY_INTERVAL = 1; // recompute every frame
  private time = 0; // seconds, drives per-particle drift phase
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: false positive
  private edgeCount = 0;
  private triCount = 0;

  constructor(cfg: SimulationConfig) {
    this.count = cfg.count;
    this.width = cfg.width;
    this.height = cfg.height;
    this.speed = cfg.speed;
    this.colors = cfg.colors;
    this.cursorRadius = cfg.cursorRadius;
    this.cursorForce = cfg.cursorForce;
    this.cursorMode = cfg.cursorMode;
    this.maxDist = cfg.maxDist;
    this.data = new Float32Array(this.count * STRIDE);
    this.edgeData = new Float32Array(this.count * 6 * 12); // pre-alloc max edges
    this.edgeIndices = new Uint32Array(this.count * 6 * 2);
    this.triangleData = new Float32Array(this.count * 4 * 3 * 6); // max tris × 3 verts × 6 floats
    this.init();
  }

  private init() {
    const { data, count, width, height, speed, colors } = this;
    for (let i = 0; i < count; i++) {
      const base = i * STRIDE;
      data[base + 0] = Math.random() * width; // x — spawn within canvas
      data[base + 1] = Math.random() * height; // y
      const angle = Math.random() * Math.PI * 2;
      const s = (0.2 + Math.random() * 0.8) * speed;
      data[base + 2] = Math.cos(angle) * s; // vx
      data[base + 3] = Math.sin(angle) * s; // vy
      const [r, g, b] = colors[Math.floor(Math.random() * colors.length)];
      data[base + 4] = r;
      data[base + 5] = g;
      data[base + 6] = b;
      data[base + 7] = 0.5 + Math.random() * 0.5; // alpha
    }
  }

  setCursor(x: number, y: number) {
    this.cursorX = x;
    this.cursorY = y;
  }

  setColors(colors: [number, number, number][]) {
    this.colors = colors;
    const { data, count } = this;
    for (let i = 0; i < count; i++) {
      const base = i * STRIDE;
      const [r, g, b] = colors[Math.floor(Math.random() * colors.length)];
      data[base + 4] = r;
      data[base + 5] = g;
      data[base + 6] = b;
    }
    this.computeEdges();
  }

  clearCursor() {
    this.cursorX = -9999;
    this.cursorY = -9999;
  }

  clickBurst(x: number, y: number, radius: number, force: number) {
    const { data, count } = this;
    const radiusSq = radius * radius;
    for (let i = 0; i < count; i++) {
      const base = i * STRIDE;
      const dx = data[base + 0] - x;
      const dy = data[base + 1] - y;
      const distSq = dx * dx + dy * dy;
      if (distSq < radiusSq && distSq > 0.01) {
        const dist = Math.sqrt(distSq);
        const f = (1 - dist / radius) * force;
        data[base + 2] += (dx / dist) * f;
        data[base + 3] += (dy / dist) * f;
      }
    }
  }

  resize(width: number, height: number) {
    const scaleX = width / this.width;
    const scaleY = height / this.height;
    const { data, count } = this;
    for (let i = 0; i < count; i++) {
      const base = i * STRIDE;
      data[base + 0] *= scaleX;
      data[base + 1] *= scaleY;
    }
    this.width = width;
    this.height = height;
  }

  step(dt: number) {
    const {
      data,
      count,
      cursorRadius,
      cursorForce,
      cursorMode,
      cursorX,
      cursorY,
      speed: maxBaseSpeed,
    } = this;
    const dtClamped = Math.min(dt, 32);
    const dtSec = dtClamped * 0.001;
    this.time += dtSec;
    const t = this.time;

    for (let i = 0; i < count; i++) {
      const base = i * STRIDE;
      let x = data[base + 0];
      let y = data[base + 1];
      let vx = data[base + 2];
      let vy = data[base + 3];

      // Gentle sinusoidal drift — unique phase per particle (golden-angle spacing)
      const phase = i * 2.3999;
      vx += Math.sin(t * 0.25 + phase) * 0.00015 * dtClamped;
      vy += Math.cos(t * 0.19 + phase * 1.37) * 0.00015 * dtClamped;

      // Cursor interaction
      const cdx = x - cursorX;
      const cdy = y - cursorY;
      const distSq = cdx * cdx + cdy * cdy;
      const radiusSq = cursorRadius * cursorRadius;
      if (distSq < radiusSq && distSq > 0.01) {
        const dist = Math.sqrt(distSq);
        const forceMag = (1 - dist / cursorRadius) * cursorForce;
        const sign = cursorMode === 'repulse' ? 1 : -1;
        vx += (cdx / dist) * sign * forceMag * dtSec;
        vy += (cdy / dist) * sign * forceMag * dtSec;
      }

      // Damping — keeps drift gentle without stopping
      vx *= 0.994;
      vy *= 0.994;

      // Speed clamp
      const speed = Math.sqrt(vx * vx + vy * vy);
      const maxSpeed = maxBaseSpeed * 1.5;
      if (speed > maxSpeed) {
        vx = (vx / speed) * maxSpeed;
        vy = (vy / speed) * maxSpeed;
      }

      x += vx * dtClamped * 0.06;
      y += vy * dtClamped * 0.06;

      // Wrap at extended virtual field boundary (±FIELD)
      if (x < -FIELD) {
        x += FIELD * 2;
      }

      if (x > FIELD) {
        x -= FIELD * 2;
      }

      if (y < -FIELD) {
        y += FIELD * 2;
      }

      if (y > FIELD) {
        y -= FIELD * 2;
      }

      data[base + 0] = x;
      data[base + 1] = y;
      data[base + 2] = vx;
      data[base + 3] = vy;
    }

    // Recompute Delaunay every frame
    this.frameCounter++;
    if (this.frameCounter % this.DELAUNAY_INTERVAL === 0) {
      this.computeEdges();
    }
  }

  /** NDC positions for rendering: [-1, 1] */
  getPositionsNDC(out: Float32Array) {
    const { data, count, width, height } = this;
    for (let i = 0; i < count; i++) {
      const base = i * STRIDE;
      out[i * 3 + 0] = (data[base + 0] / width) * 2 - 1;
      out[i * 3 + 1] = 1 - (data[base + 1] / height) * 2;
      out[i * 3 + 2] = data[base + 7]; // alpha
    }
  }

  /** Screen positions + colors for rendering */
  getPositionsAndColors(out: Float32Array) {
    const { data, count } = this;
    for (let i = 0; i < count; i++) {
      const base = i * STRIDE;
      const outBase = i * 6;
      out[outBase + 0] = data[base + 0];
      out[outBase + 1] = data[base + 1];
      out[outBase + 2] = data[base + 4]; // r
      out[outBase + 3] = data[base + 5]; // g
      out[outBase + 4] = data[base + 6]; // b
      out[outBase + 5] = data[base + 7]; // alpha
    }
  }

  /** Compute Delaunay edges and triangles — called from step() */
  private computeEdges() {
    const { data, count, maxDist, edgeIndices } = this;
    const maxDistSq = maxDist * maxDist;
    // Extended threshold for fade zone: edges up to 1.2× maxDist are included
    // so they can fade out rather than hard-cut.
    const fadeDistSq = maxDistSq * 1.44;

    const points: [number, number][] = Array.from({ length: count });
    for (let i = 0; i < count; i++) {
      const base = i * STRIDE;
      points[i] = [data[base + 0], data[base + 1]];
    }

    const delaunay = Delaunay.from(points);

    // ── Edges ──────────────────────────────────────────────────────────────
    const edges = new Set<string>();
    let edgeCount = 0;

    for (let i = 0; i < count; i++) {
      for (const j of delaunay.neighbors(i)) {
        if (j <= i) {
          continue;
        }

        const key = `${i}-${j}`;
        if (edges.has(key)) {
          continue;
        }
        edges.add(key);

        const bi = i * STRIDE;
        const bj = j * STRIDE;
        const dx = data[bi + 0] - data[bj + 0];
        const dy = data[bi + 1] - data[bj + 1];
        if (dx * dx + dy * dy > fadeDistSq) {
          continue; // include fade zone
        }

        edgeIndices[edgeCount * 2 + 0] = i;
        edgeIndices[edgeCount * 2 + 1] = j;
        edgeCount++;
      }
    }
    this.edgeCount = edgeCount;

    // Triangles
    const tris = delaunay.triangles;
    let triCount = 0;

    for (let t = 0; t < tris.length; t += 3) {
      const i0 = tris[t + 0];
      const i1 = tris[t + 1];
      const i2 = tris[t + 2];
      const b0 = i0 * STRIDE;
      const b1 = i1 * STRIDE;
      const b2 = i2 * STRIDE;

      const dx01 = data[b0] - data[b1];
      const dy01 = data[b0 + 1] - data[b1 + 1];
      const dx12 = data[b1] - data[b2];
      const dy12 = data[b1 + 1] - data[b2 + 1];
      const dx20 = data[b2] - data[b0];
      const dy20 = data[b2 + 1] - data[b0 + 1];
      const maxEdgeSq = Math.max(
        dx01 * dx01 + dy01 * dy01,
        dx12 * dx12 + dy12 * dy12,
        dx20 * dx20 + dy20 * dy20
      );

      // Quadratic fade: 1 at dist=0, 0 at dist=maxDist
      const tDist = Math.min(1, maxEdgeSq / maxDistSq);
      const fade = (1 - tDist) * (1 - tDist);
      if (fade < 0.01) {
        continue;
      }

      const out = triCount * 18; // 3 verts × 6 floats
      for (const [vi, bi] of [
        [0, b0],
        [1, b1],
        [2, b2],
      ] as [number, number][]) {
        const o = out + vi * 6;
        this.triangleData[o + 0] = (data[bi + 0] / this.width) * 2 - 1;
        this.triangleData[o + 1] = 1 - (data[bi + 1] / this.height) * 2;
        this.triangleData[o + 2] = data[bi + 4]; // r
        this.triangleData[o + 3] = data[bi + 5]; // g
        this.triangleData[o + 4] = data[bi + 6]; // b
        this.triangleData[o + 5] = data[bi + 7] * 0.08 * fade;
      }
      triCount++;
    }
    this.triCount = triCount;
  }

  /** Return edge data buffer + count */
  getEdgeData(): { buffer: Float32Array; count: number } {
    const { data, edgeIndices, edgeCount, edgeData, maxDist } = this;
    const maxDistSq = maxDist * maxDist;
    for (let i = 0; i < edgeCount; i++) {
      const idxA = edgeIndices[i * 2 + 0];
      const idxB = edgeIndices[i * 2 + 1];
      const ba = idxA * STRIDE;
      const bb = idxB * STRIDE;
      const out = i * 12;

      edgeData[out + 0] = data[ba + 0];
      edgeData[out + 1] = data[ba + 1];
      edgeData[out + 2] = data[bb + 0];
      edgeData[out + 3] = data[bb + 1];
      // rgb
      for (let j = 0; j < 3; j++) {
        edgeData[out + 4 + j] = data[ba + 4 + j];
        edgeData[out + 8 + j] = data[bb + 4 + j];
      }
      // alpha with quadratic distance fade
      const dx = data[ba + 0] - data[bb + 0];
      const dy = data[ba + 1] - data[bb + 1];
      const tDist = Math.min(1, (dx * dx + dy * dy) / maxDistSq);
      const fade = (1 - tDist) * (1 - tDist);
      edgeData[out + 7] = data[ba + 7] * fade;
      edgeData[out + 11] = data[bb + 7] * fade;
    }
    return { buffer: edgeData, count: edgeCount };
  }

  /** Return triangle vertex data (NDC positions + colors) + count */
  getTriangleData(): { buffer: Float32Array; count: number } {
    return { buffer: this.triangleData, count: this.triCount };
  }

  /** Gaussian density heightmap on a (gridW+1)×(gridH+1) grid */
  generateHeightmap(gridW: number, gridH: number, out: Float32Array, sigma = 120): void {
    out.fill(0);
    const cellW = this.width / gridW;
    const cellH = this.height / gridH;
    const sigSq = sigma * sigma;
    const cutoff = sigma * 2;
    for (let i = 0; i < this.count; i++) {
      const px = this.data[i * STRIDE + 0];
      const py = this.data[i * STRIDE + 1];
      const c0 = Math.max(0, Math.floor((px - cutoff) / cellW));
      const c1 = Math.min(gridW, Math.ceil((px + cutoff) / cellW));
      const r0 = Math.max(0, Math.floor((py - cutoff) / cellH));
      const r1 = Math.min(gridH, Math.ceil((py + cutoff) / cellH));
      for (let row = r0; row <= r1; row++) {
        for (let col = c0; col <= c1; col++) {
          const dx = col * cellW - px;
          const dy = row * cellH - py;
          out[row * (gridW + 1) + col] += Math.exp(-(dx * dx + dy * dy) / sigSq);
        }
      }
    }
  }

  /** Gaussian-weighted velocity field on a (gridW+1)×(gridH+1) grid, flat [vx,vy,...] */
  getVelocityField(gridW: number, gridH: number, out: Float32Array, sigma = 180): void {
    out.fill(0);
    const cellW = this.width / gridW;
    const cellH = this.height / gridH;
    const sigSq = sigma * sigma;
    for (let i = 0; i < this.count; i++) {
      const px = this.data[i * STRIDE + 0];
      const py = this.data[i * STRIDE + 1];
      const vx = this.data[i * STRIDE + 2];
      const vy = this.data[i * STRIDE + 3];
      for (let row = 0; row <= gridH; row++) {
        for (let col = 0; col <= gridW; col++) {
          const dx = col * cellW - px;
          const dy = row * cellH - py;
          const w = Math.exp(-(dx * dx + dy * dy) / sigSq);
          const idx = (row * (gridW + 1) + col) * 2;
          out[idx] += vx * w;
          out[idx + 1] += vy * w;
        }
      }
    }
  }
}

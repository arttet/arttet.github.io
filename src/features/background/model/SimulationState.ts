export interface SimulationState {
  count: number;
  /** count × 8 floats: x, y, vx, vy, r, g, b, alpha (screen coords) */
  particleData: Float32Array;
  /** edgeCount × 12 floats: x1, y1, x2, y2, r1, g1, b1, a1, r2, g2, b2, a2 (screen coords) */
  edgeBuffer: Float32Array;
  edgeCount: number;
  /** triCount × 18 floats: 3 verts × (x, y, r, g, b, a) in NDC */
  triBuffer: Float32Array;
  triCount: number;
  /** (GRID_W+1) × (GRID_H+1) Gaussian density heightmap */
  heightmap: Float32Array;
  /** (VF_W+1) × (VF_H+1) × 2 Gaussian-weighted velocity field */
  velField: Float32Array;
}

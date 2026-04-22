// Marching squares: edges 0=top(TL→TR), 1=right(TR→BR), 2=bottom(BL→BR), 3=left(TL→BL)
// Corner bits: TL=1, TR=2, BR=4, BL=8
const EDGE_TABLE: readonly (readonly [number, number][])[] = [
  [],
  [[3, 0]],
  [[0, 1]],
  [[3, 1]],
  [[1, 2]],
  [
    [3, 0],
    [1, 2],
  ],
  [[0, 2]],
  [[3, 2]],
  [[2, 3]],
  [[0, 2]],
  [
    [0, 1],
    [2, 3],
  ],
  [[1, 2]],
  [[3, 1]],
  [[0, 1]],
  [[3, 0]],
  [],
];

function edgeCrossing(
  edge: number,
  col: number,
  row: number,
  tl: number,
  tr: number,
  br: number,
  bl: number,
  threshold: number
): [number, number] {
  let a: number, b: number;
  if (edge === 0) {
    a = tl;
    b = tr;
  } else if (edge === 1) {
    a = tr;
    b = br;
  } else if (edge === 2) {
    a = bl;
    b = br;
  } else {
    a = tl;
    b = bl;
  }
  const t = Math.abs(b - a) < 1e-9 ? 0.5 : (threshold - a) / (b - a);
  if (edge === 0) {
    return [col + t, row];
  }
  if (edge === 1) {
    return [col + 1, row + t];
  }
  if (edge === 2) {
    return [col + t, row + 1];
  }
  return [col, row + t];
}

/**
 * Run marching squares for one threshold level.
 * @param heights  flat array, (gridW+1)×(gridH+1) corner values
 * @param out      output [x1,y1,x2,y2,...] in grid coords, pre-allocated
 * @returns number of segments written into `out`
 */
export function marchingSquares(
  heights: Float32Array,
  gridW: number,
  gridH: number,
  threshold: number,
  out: Float32Array
): number {
  let n = 0;
  const stride = gridW + 1;
  for (let row = 0; row < gridH; row++) {
    for (let col = 0; col < gridW; col++) {
      const tl = heights[row * stride + col];
      const tr = heights[row * stride + col + 1];
      const br = heights[(row + 1) * stride + col + 1];
      const bl = heights[(row + 1) * stride + col];
      const idx =
        (tl >= threshold ? 1 : 0) |
        (tr >= threshold ? 2 : 0) |
        (br >= threshold ? 4 : 0) |
        (bl >= threshold ? 8 : 0);
      for (const [e1, e2] of EDGE_TABLE[idx]) {
        const [x1, y1] = edgeCrossing(e1, col, row, tl, tr, br, bl, threshold);
        const [x2, y2] = edgeCrossing(e2, col, row, tl, tr, br, bl, threshold);
        out[n * 4] = x1;
        out[n * 4 + 1] = y1;
        out[n * 4 + 2] = x2;
        out[n * 4 + 3] = y2;
        n++;
      }
    }
  }
  return n;
}

import { describe, expect, it } from 'vitest';
import { marchingSquares } from './MarchingSquares';

describe('MarchingSquares exhaustive', () => {
  const gridW = 1;
  const gridH = 1;
  const out = new Float32Array(100);

  // Test all 16 cases of the index
  it('covers all possible corner combinations', () => {
    for (let i = 0; i < 16; i++) {
      const heights = new Float32Array([
        i & 1 ? 1 : 0,
        i & 2 ? 1 : 0,
        i & 8 ? 1 : 0,
        i & 4 ? 1 : 0,
      ]);
      const count = marchingSquares(heights, gridW, gridH, 0.5, out);
      if (i === 0 || i === 15) {
        expect(count).toBe(0);
      } else if (i === 5 || i === 10) {
        expect(count).toBe(2); // saddle points
      } else {
        expect(count).toBe(1);
      }
    }
  });

  it('handles edge cases with floating point precision', () => {
    const heights = new Float32Array([0.5, 0.5, 0.5, 0.5]);
    const count = marchingSquares(heights, 1, 1, 0.5, out);
    expect(count).toBe(0); // All equal to threshold -> all "on" -> no segments
  });
});

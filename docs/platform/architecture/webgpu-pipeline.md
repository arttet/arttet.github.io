---
title: WebGPU Pipeline
status: active
last_updated: 2026-05-04
purpose: Off-thread particle simulation + modular pass-based render architecture for the background canvas.
related:
  - ./index.md
  - ./style-design.md
  - ../developer/extending.md
---

# WebGPU Pipeline <Badge type="warning">beta</Badge>

Particle simulation runs in a Web Worker; render runs on the main thread. Visualization modes (particles, contours, flow) are independent passes that write to an offscreen texture, then a composite pass blits and applies the glass effect. Falls back to a CSS `mesh-gradient` when WebGPU is unavailable.

## Core Philosophy

1. **Off-main-thread simulation**: physics (particles, triangulation, fields) run in a dedicated Web Worker to prevent UI jank.
2. **Modular pass architecture**: visualization modes are interchangeable passes implementing `IPass`.
3. **Low-overhead rendering**: minimize state changes, transfer particle data via GPU buffer writes.
4. **Graceful fallback**: detect WebGPU; otherwise use CSS `.mesh-gradient`.

## Layers

### Simulation Layer (Web Worker)

The worker manages simulation lifecycle and posts buffers to the main thread.

**Data structures (`SimulationState`):**

- **Particle data**: `[x, y, vx, vy, r, g, b, a]` — STRIDE = 8.
- **Edge data**: lines/triangles derived from Delaunay triangulation (`d3-delaunay`).
- **Density heightmap**: 2D grid for contour extraction.
- **Velocity field**: 2D grid of Gaussian-weighted movement vectors.

**Physics step:**

1. Integrate particle positions and velocities.
2. Every N frames: Delaunay triangulation; filter edges by `maxDist = 150`.
3. Reconstruct heightmap and velocity field.
4. Post buffers to main thread.

### Render Layer (Main Thread)

`BackgroundScene` orchestrates a sequence of passes implementing `IPass`:

1. **Mode pass** (Particles | Contours | Flow): renders the primary visualization into an offscreen texture using a specialized WGSL shader.
2. **Composite pass**:
   - **Blit** the offscreen texture to the swapchain.
   - **Glass effect** — dynamic blur/distortion in a rect (usually behind the navbar) via a multi-sampled sampler.
   - Manage dark/light theme background transitions.

## Files

- Entry: `src/features/background/ui/BackgroundCanvas.svelte`.
- Orchestrator: `src/features/background/core/BackgroundScene.ts`.
- Engine core: `src/features/engine/core/{GPUContext,Simulation,simulation.worker,MarchingSquares}.ts`.
- Passes: `src/features/engine/passes/{IPass,ParticlesPass,ContoursPass,FlowPass,CompositePass}.ts`.
- WGSL: `src/features/engine/shaders/{particles,edges,triangles,composite}.wgsl`.

## Data Transfer Policy

- **Per-frame buffers**: `device.queue.writeBuffer` for small/per-frame writes.
- **Worker → Main**: `Transferable` ArrayBuffers (zero-copy SharedArrayBuffer planned).

## Resource Management

- **Lifecycle**: `BackgroundScene.destroy()` explicitly destroys all GPU resources (buffers, textures, pipelines) and terminates the worker.
- **Resize**: `ResizeObserver` triggers context reconfiguration and texture recreation. DPR capped at 2.0.

## Invariants

- **FPS target**: 60fps on modern integrated GPUs.
- **Memory limit**: ≤ 100 MB GPU (textures + buffers).
- **Bundle isolation**: WGSL loaded as raw strings at build-time; no WebGPU code in the main bundle for unsupported clients.
- **Init**: device init must not block Svelte mount (async).

## Future

- Compute integration: move integration + triangulation entirely to WGSL compute.
- Post-processing: bloom, chromatic aberration.
- Interaction modes: fluid simulation.

## Related

- [Architecture Overview](./index.md)
- [Design System](./style-design.md)
- [Extending the Platform](../developer/extending.md)

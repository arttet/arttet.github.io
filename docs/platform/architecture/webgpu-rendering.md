---
title: WebGPU Rendering Architecture
status: target
last_updated: 2026-05-05
purpose: Reusable WebGPU platform architecture and background visualization integration.
related:
  - ./index.md
  - ./style-design.md
  - ../developer/extending.md
---

# WebGPU Rendering Architecture

This document defines the target architecture for the WebGPU rendering system.

The key principle: **WebGPU platform code is reusable cross-cutting infrastructure**, while the background canvas is only one feature built on top of it.

---

## 1. Core Principle

```txt
src/lib/webgpu = reusable WebGPU rendering engine
features/background = concrete background visualization
```

The engine layer (`src/lib/webgpu`) must not know about:

- particles;
- contours;
- flow mode;
- navbar glass effect;
- `SimulationState`;
- Svelte feature state;
- background-specific palettes.

Feature code may depend on `src/lib/webgpu`, but `src/lib/webgpu` must never depend on `features/*`.

## 2. Layering

```txt
Svelte UI
  ↓
Feature Layer (features/background)
  ↓
WebGPU Engine (src/lib/webgpu)
  ↓
WebGPU API
```

### UI Layer

Owns the Svelte component and canvas lifecycle.

### Feature Layer

Owns background-specific logic:

- BackgroundScene;
- simulation worker;
- particle state;
- background passes;
- visual modes;
- palette;
- glass rectangle.

### WebGPU Engine

Owns reusable GPU primitives:

- GPU context;
- pass lifecycle;
- frame loop;
- resize handling;
- resource lifecycle;
- buffer utilities;
- frame graph;
- shader loading.

## 3. Directory Structure

```bash
src/
  lib/
    webgpu/
      core/
        GPUContext.ts
        FrameLoop.ts
        ResizeController.ts

      passes/
        IPass.ts
        RenderContext.ts

      graph/
        FrameGraph.ts
        PassNode.ts

      resources/
        ResourceRegistry.ts

      buffers/
        RingBuffer.ts
        TripleBuffer.ts

      shaders/
        shaderLoader.ts

  features/
    background/
      ui/
        BackgroundCanvas.svelte

      engine/
        BackgroundScene.ts
        Simulation.ts
        simulation.worker.ts
        MarchingSquares.ts

      model/
        SimulationState.ts
        BackgroundConfig.ts

      passes/
        SimulationConsumer.ts
        PaletteConsumer.ts
        ParticlesPass.ts
        ContoursPass.ts
        FlowPass.ts
        CompositePass.ts

      shaders/
        particles.wgsl
        contours.wgsl
        flow.wgsl
        composite.wgsl
```

## 4. Engine Contracts

### 4.1 RenderContext

```ts
export interface RenderContext {
  device: GPUDevice;
  queue: GPUQueue;
  format: GPUTextureFormat;
}
```

### 4.2 RenderSize

```ts
export interface RenderSize {
  width: number;
  height: number;
  dpr: number;
}
```

### 4.3 FrameContext

```ts
export interface FrameContext {
  encoder: GPUCommandEncoder;
  outputView: GPUTextureView;
  size: RenderSize;
  resources: FrameResources;
}

export interface FrameResources {
  // throws if missing
  getTextureView(name: string): GPUTextureView;
}
```

_Rule: `FrameResources` is read-only during `execute()`. Resource creation and destruction happen outside of passes. A missing resource must be treated as a programmer error (not a runtime fallback)._

### 4.4 IPass

```ts
export interface IPass {
  readonly name: string;
  init(ctx: RenderContext): void | Promise<void>;
  resize(ctx: RenderContext, size: RenderSize): void;
  execute(ctx: RenderContext, frame: FrameContext): void;
  destroy(): void;
}
```

### 4.5 Resource Ownership

- Passes do not own shared frame resources (textures, targets).
- Passes own only resources created in `init()`.
- Shared resources are managed by `BackgroundScene` or a central `ResourceRegistry`.
- A pass must not destroy resources it did not create.

### 4.6 Frame Graph (Minimal Model)

The render pipeline is expressed as an ordered sequence of passes.

Example:

- `ParticlesPass → SceneTexture`
- `ContoursPass  → SceneTexture`
- `FlowPass      → SceneTexture`
- `CompositePass → Swapchain`

Constraints:

- Pass execution order is deterministic.
- No implicit dependencies.
- Each pass declares which resources it reads/writes.

### 4.7 Pipeline & BindGroup Lifecycle

- Pipelines must be created in `init()` and reused across frames.
- Pipelines must not be recreated per frame.
- Bind groups may be recreated only when underlying resources change.
- Bind group layouts must be stable across frames.
- Shader modules are created once and reused.
- Resize must not recreate pipelines unless the texture format or layout changes.

### 4.8 Command Encoding Contract

- The pass is responsible for its own `beginRenderPass` / `end` calls.
- `FrameContext` provides render targets and the active `encoder`, not active render passes.
- Each pass must fully close any render or compute pass it opens before returning.

## 5. Pass Rules

A pass must:

- create GPU resources only in init;
- recreate size-dependent resources only in resize;
- record GPU commands only in execute;
- release owned resources in destroy;
- avoid GPU allocations inside execute;
- avoid importing feature-specific types.

`IPass` must stay generic. It must not contain `update(state: SimulationState): void;`, `setPalette(...): void;`, `draw(pass: GPURenderPassEncoder): void;`, or `clear(): void;`. Those are feature-specific concerns.

## 6. Feature-Specific Pass Extensions

Background-specific interfaces live inside: `src/features/background/passes/`

### SimulationConsumer

```ts
import type { SimulationState } from '../model/SimulationState';

export interface SimulationConsumer {
  updateSimulation(state: SimulationState): void;
}
```

### PaletteConsumer

Colors are normalized linear RGB values in `[0, 1]`.

```ts
export type RGBLinear = readonly [r: number, g: number, b: number];

export interface PaletteConsumer {
  setPalette(colors: readonly RGBLinear[]): void;
}
```

A concrete pass may implement multiple contracts:

```ts
export class ParticlesPass implements IPass, SimulationConsumer, PaletteConsumer {
  readonly name = 'particles';

  init(ctx: RenderContext): void {
    // create pipeline, buffers, bind groups
  }

  updateSimulation(state: SimulationState): void {
    // update CPU-side snapshot references or GPU buffers
  }

  setPalette(colors: readonly RGBLinear[]): void {
    // update palette resources
  }

  resize(ctx: RenderContext, size: RenderSize): void {
    // recreate size-dependent resources
  }

  execute(ctx: RenderContext, frame: FrameContext): void {
    // record commands
  }

  destroy(): void {
    // destroy owned resources
  }
}
```

## 7. GPUContext Responsibilities

GPUContext lives in: `src/lib/webgpu/core/GPUContext.ts`

**Responsibilities:**

- request adapter;
- request device;
- create canvas context;
- configure swapchain;
- track width, height, DPR;
- handle resize;
- expose device.lost;
- provide idempotent destroy.

## 8. BackgroundScene & Worker Lifecycle

BackgroundScene lives in: `src/features/background/engine/BackgroundScene.ts`

**Responsibilities:**

- initialize GPUContext;
- initialize background passes;
- own render loop;
- start simulation worker;
- receive simulation snapshots;
- enforce latest-snapshot-only policy;
- route simulation data to passes;
- handle resize;
- handle device loss fallback;
- destroy all resources.

It is the boundary between: Svelte UI ↔ WebGPU Engine ↔ background feature.

### Worker Lifecycle

- Worker must be terminated on scene destroy.
- Worker must not outlive `GPUContext`.
- Worker must not send messages after destroy.

## 9. Simulation Data Flow

- **Current baseline:** Worker → Transferable ArrayBuffer → Main Thread → queue.writeBuffer → GPU
- **Target:** Worker → SharedArrayBuffer + Triple Buffering → Main Thread → GPU upload
- **Intermediate Compute:** CPU simulation → GPU field computation → CPU reduced data → GPU render
- **Future:** GPU Compute → GPU Render

## 10. Frame Loop & Submission Model

### Frame Loop Contract

- Single RAF-driven loop managed by `FrameLoop`.
- Frame execution order:
  1. Consume latest snapshot.
  2. Update passes (CPU-side logic).
  3. Record GPU commands (`execute()` on all passes).
  4. Submit commands to queue.
- No re-entrant frames allowed.

### Submission Model

- All command buffers are submitted once per frame.
- Only the orchestrator (`BackgroundScene` / `FrameLoop`) performs `device.queue.submit`.
- Passes must not submit commands directly.

### Non-Blocking Guarantees

- Render loop must never block on worker messages.
- Worker must never block on main thread.
- GPU submission must not wait on CPU synchronization.

## 11. Backpressure Policy

The system uses: **Latest snapshot only**

Every worker message must include:

```ts
export interface SimulationMessage {
  type: 'snapshot';
  frameId: number;
  timestamp: number;
  state: SimulationState; // or bufferIndex for SAB
}
```

For transferable buffers, the main thread keeps only one pending snapshot:

```ts
let pendingSnapshot: SimulationMessage | null = null;
let lastSeenFrameId = 0;
let lastConsumedFrameId = 0;

function onWorkerMessage(message: SimulationMessage) {
  if (message.frameId <= lastSeenFrameId) return;

  lastSeenFrameId = message.frameId;
  pendingSnapshot = message;
}

function render() {
  const snapshot = pendingSnapshot;
  pendingSnapshot = null;

  if (snapshot && snapshot.frameId > lastConsumedFrameId) {
    lastConsumedFrameId = snapshot.frameId;
    updatePasses(snapshot.state);
  }

  drawFrame();
}
```

Rules:

- stale frames are ignored;
- main stores only one pending snapshot;
- newer snapshot replaces older pending snapshot;
- render loop consumes and clears pending snapshot;
- the render loop never waits for old snapshots;
- message queues must not grow unbounded;
- newest valid snapshot wins.

## 12. SharedArrayBuffer Target Design

### Capability Detection

SAB usage must be gated:

```ts
const supportsSAB = typeof SharedArrayBuffer !== 'undefined' && crossOriginIsolated;
```

If not supported, the engine must transparently fallback to Transferable buffers.

### Buffer States

```ts
export enum BufferState {
  FREE = 0,
  WRITING = 1,
  READY = 2,
  READING = 3,
}
```

### State Transitions

- **Worker:** `FREE → WRITING → READY`
- **Main:** `READY → READING → FREE`

**Invariant:** Only the owner advances the state. Worker never frees `READY` or `READING` buffers. Main never writes simulation data.

## 13. Triple Buffering

Target layout:

- Buffer A: worker writing
- Buffer B: ready snapshot
- Buffer C: main reading/uploading

Each SAB buffer must contain a header _inside_ the buffer:

```ts
export interface SnapshotHeader {
  frameId: number;
  timestamp: number;
}
```

The main thread must validate `frameId` from the buffer itself, not only from the message, to prevent race conditions during buffer reuse.

## 14. Resize Policy & Safety

**GPUContext owns canvas/swapchain resize.**
**BackgroundScene owns feature resource resize.**

**Flow:**
ResizeObserver fires → `GPUContext.resize()` → if changed: → `BackgroundScene.resizePasses()` → recreate offscreen textures → update uniforms.

**Resize Safety:**

- A frame must never use destroyed GPU resources.
- Resize must complete before the next frame execution.
- Resource swap must be atomic from the render loop perspective.
- DPR is capped (default 2.0).

## 15. Error Handling & Device Loss

### Error Handling

- Shader compilation failures must fall back to CSS gracefully.
- GPU validation errors must not crash the render loop.
- In development mode, validation errors must be logged.

### Device Loss Policy

WebGPU device loss must be handled.
**Flow:** `device.lost` → stop render loop → destroy stale resources → attempt reinit → fallback to CSS if reinit fails.

**Invariants:**

- Expected destroy (e.g. unmount) must not trigger fallback/reinit.
- Unexpected device loss triggers reinit/fallback.
- Device loss must never leave a permanently blank canvas.

## 16. GPU Upload Policy

- `queue.writeBuffer` is allowed only for small or bounded updates.
- Large buffers should be reused and updated via offsets.
- Per-frame full buffer uploads must be avoided when possible.

## 17. Shader Management

- Shaders are loaded at build time (e.g., via Vite string imports).
- Shader modules are created once, cached, and reused across passes.
- Changes in shader source (HMR) must invalidate the pipeline cache.

## 18. Composite Pass

The composite pass is background-specific.
**Responsibilities:** render offscreen texture to swapchain; apply theme-aware blending; apply glass region effect.

Preferred target pipeline: `Scene Texture → Downsample → Gaussian Blur / Kawase Blur → Masked Composite → Swapchain`.

## 19. Performance Invariants & Degradation

| Area                     | Target               |
| :----------------------- | :------------------- |
| FPS                      | 60                   |
| Frame time               | ≤ 16.6ms             |
| GPU memory               | ≤ 100MB              |
| DPR                      | ≤ 2.0                |
| Worker backlog           | latest snapshot only |
| Hot-path GPU allocations | forbidden            |

### Adaptive Degradation

If performance drops below the target for a sustained period:

- reduce particle count;
- reduce field resolution;
- disable expensive passes (e.g. contours, blur);
- lower the update frequency of the CPU simulation.

## 20. Observability

Development builds should support a debug overlay.
Recommended metrics: FPS, CPU simulation ms, GPU frame ms, upload bytes/frame, particle count, dropped frames, device fallback reason.

## 21. Bundle Isolation

WebGPU code should be loaded dynamically to ensure unsupported clients do not pay the full WebGPU bundle cost. Feature detection (`'gpu' in navigator`) is the first step, but a robust implementation must also check `navigator.gpu.requestAdapter()` before loading modules, as hardware or browser policies might disable the adapter.

```ts
if ('gpu' in navigator) {
  // optionally await navigator.gpu.requestAdapter() here if needed before import
  const { BackgroundScene } = await import('../engine/BackgroundScene');
}
```

## 22. Compute Synchronization (Future)

- Compute passes must complete before render passes.
- GPU barriers must be respected between compute and render stages.
- No CPU readback from compute buffers in the hot path.

## 23. Invariants

- `src/lib/webgpu` never imports from `features/*`.
- Feature passes may extend generic pass contracts.
- `IPass` remains generic and simulation-agnostic.
- No GPU resources are allocated inside execute.
- Worker messages are bounded by latest-snapshot-only policy.
- Resize and destroy are idempotent.
- Expected destroy must not trigger fallback/reinit.
- Unexpected device loss triggers reinit/fallback.
- CSS fallback preserves page usability.
- SAB is optional and guarded by capability detection.
- Transferable buffer fallback remains supported.

## 24. Definition of Done

- Stable 60fps on target hardware.
- No crashes on resize; unexpected device loss triggers fallback or reinit.
- No GPU resource leaks after destroy/reinit.
- Worker → Main data flow is bounded and uses latest-snapshot-only semantics.
- `frameId` prevents stale frame overwrite.
- `Transferable ArrayBuffer` fallback implemented.
- `SharedArrayBuffer` protocol documented behind capability detection (Phase 1) and implemented when COOP/COEP is available (Phase 2).
- Pass architecture is explicit, modular, and free of per-frame GPU allocations.

## 25. Roadmap

- **Phase 1: Platform Hardening**: harden GPUContext; finalize IPass + FrameContext; migrate background passes; add pendingSnapshot backpressure; add safe resize; add unexpected device loss handling.
- **Phase 2: Data Flow Optimization**: add TripleBuffer; add SAB capability detection and transport; keep transferable fallback; separate simulation and render buffers.
- **Phase 3: Intermediate Compute**: CPU simulation → GPU field computation → CPU reduced data → GPU render.
- **Phase 4: GPU Compute Preparation**: align WGSL structs; move particle data into storage buffers; reduce queue.writeBuffer; prepare ping-pong GPU buffers.
- **Phase 5: Compute Migration**: move particle integration to compute; evaluate GPU marching squares.
- **Phase 6: Rendering Effects**: rewrite glass effect; add downsample + blur; add bloom; add chromatic aberration if visually justified.

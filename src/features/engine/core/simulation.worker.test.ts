// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

type WorkerMessage = { data: Record<string, unknown> };

// We need to simulate the worker environment
// In vitest, we can't easily run the actual worker file with 'self'
// but we can test its logic by mocking 'self' and calling the handler.

describe('simulation.worker logic', () => {
  let messageHandler: (e: WorkerMessage) => void;

  const validConfig = {
    count: 5,
    width: 100,
    height: 100,
    speed: 1,
    colors: [[1, 1, 1]],
    cursorRadius: 50,
    cursorForce: 1,
    cursorMode: 'attract',
    maxDist: 100,
  };

  beforeEach(async () => {
    vi.stubGlobal('self', {
      addEventListener: (type: string, handler: (e: WorkerMessage) => void) => {
        if (type === 'message') {
          messageHandler = handler;
        }
      },
      postMessage: vi.fn(),
    });

    // Reset simulation by re-importing or clearing state if it was a singleton
    // Since 'sim' is a module-level let, we might need to reset the module.
    vi.resetModules();
    await import('./simulation.worker');
  });

  it('initializes and steps simulation', async () => {
    messageHandler({
      data: {
        cmd: 'init',
        config: validConfig,
      },
    });

    messageHandler({
      data: {
        cmd: 'step',
        dt: 16,
      },
    });

    expect(self.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'frame',
        count: 5,
      }),
      expect.any(Array) // transferables
    );
  });

  it('delegates cursor and color commands', async () => {
    // Init first
    messageHandler({
      data: { cmd: 'init', config: { ...validConfig, count: 1 } },
    });

    messageHandler({ data: { cmd: 'setCursor', x: 10, y: 20 } });
    messageHandler({ data: { cmd: 'setColors', colors: [[0, 0, 0]] } });
    messageHandler({ data: { cmd: 'clickBurst', x: 50, y: 50, radius: 20, force: 10 } });
    messageHandler({ data: { cmd: 'resize', width: 200, height: 200 } });
    messageHandler({ data: { cmd: 'clearCursor' } });

    // These shouldn't crash
    expect(true).toBe(true);
  });

  it('ignores non-object and unknown messages', async () => {
    for (const data of [null, 'step', 1, [], { cmd: 'dispose' }]) {
      messageHandler({ data: data as Record<string, unknown> });
    }

    expect(self.postMessage).not.toHaveBeenCalled();
  });

  it('rejects malformed init payloads', async () => {
    messageHandler({ data: { cmd: 'init' } });
    messageHandler({ data: { cmd: 'init', config: { ...validConfig, count: 0 } } });
    messageHandler({ data: { cmd: 'init', config: { ...validConfig, colors: [] } } });
    messageHandler({ data: { cmd: 'init', config: { ...validConfig, cursorMode: 'push' } } });
    messageHandler({ data: { cmd: 'step', dt: 16 } });

    expect(self.postMessage).not.toHaveBeenCalled();
  });

  it('rejects malformed active commands after init', async () => {
    messageHandler({ data: { cmd: 'init', config: validConfig } });

    messageHandler({ data: { cmd: 'step', dt: Number.NaN } });
    messageHandler({ data: { cmd: 'setCursor', x: 1 } });
    messageHandler({ data: { cmd: 'setColors', colors: [[1, 1]] } });
    messageHandler({ data: { cmd: 'clickBurst', x: 1, y: 1, radius: 0, force: 1 } });
    messageHandler({ data: { cmd: 'resize', width: 0, height: 100 } });

    expect(self.postMessage).not.toHaveBeenCalled();
  });
});

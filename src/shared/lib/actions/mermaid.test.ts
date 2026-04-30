import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mermaid } from './mermaid';

const mermaidFactoryCalls = vi.hoisted(() => vi.fn());

// Mock mermaid library
vi.mock('mermaid', () => {
  mermaidFactoryCalls();
  return {
    default: {
      initialize: vi.fn(),
      run: vi.fn().mockResolvedValue(undefined),
    },
  };
});

describe('mermaid action robust', () => {
  type MermaidModule = Awaited<typeof import('mermaid')>;
  type MermaidMock = MermaidModule['default'] & {
    initialize: ReturnType<typeof vi.fn>;
    run: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('handles theme updates and re-rendering', async () => {
    const node = document.createElement('div');
    const b64 = btoa('graph TD; A-->B;');
    node.innerHTML = `<div class="mermaid" data-content="${b64}">...</div>`;
    document.body.appendChild(node);

    const action = mermaid(node, 'dark');

    const mermaidLib = (await import('mermaid')).default as MermaidMock;

    await vi.waitFor(() => {
      if (mermaidLib.initialize.mock.calls.length === 0) {
        throw new Error('Not initialized yet');
      }
    });

    expect(mermaidLib.initialize).toHaveBeenCalledWith(expect.objectContaining({ theme: 'dark' }));

    // Update theme
    action.update('light');

    await vi.waitFor(() => {
      if (mermaidLib.initialize.mock.calls.length < 2) {
        throw new Error('Not updated yet');
      }
    });

    const lastCall = mermaidLib.initialize.mock.calls[1]?.[0];
    expect(['default', 'neutral']).toContain(lastCall.theme);

    const el = node.querySelector('.mermaid');
    expect(el?.getAttribute('data-processed')).toBeNull();
  });

  it('returns early when there are no diagrams to process', async () => {
    const node = document.createElement('div');
    document.body.appendChild(node);

    mermaid(node, 'dark');

    await Promise.resolve();

    expect(mermaidFactoryCalls).not.toHaveBeenCalled();
  });

  it('does not import mermaid for already processed diagrams until rerender is requested', async () => {
    const node = document.createElement('div');
    const b64 = btoa('graph TD; A-->B;');
    node.innerHTML = `<div class="mermaid" data-processed="true" data-content="${b64}">rendered</div>`;
    document.body.appendChild(node);

    mermaid(node, 'dark');
    await Promise.resolve();

    expect(mermaidFactoryCalls).not.toHaveBeenCalled();
  });

  it('restores processed diagram source before rerendering on theme change', async () => {
    const node = document.createElement('div');
    const source = 'graph TD; A-->B;';
    const b64 = btoa(source);
    node.innerHTML =
      '<div class="mermaid" data-processed="true" data-content="' +
      b64 +
      '" id="mermaid-1">rendered</div>';
    document.body.appendChild(node);

    const action = mermaid(node, 'dark');
    const mermaidLib = (await import('mermaid')).default as MermaidMock;

    action.update('light');
    await vi.waitFor(() => {
      if (mermaidLib.run.mock.calls.length === 0) {
        throw new Error('Not updated yet');
      }
    });

    const el = node.querySelector('.mermaid') as HTMLElement;
    expect(el.textContent).toBe(source);
    expect(el.dataset.processed).toBeUndefined();
    expect(el.id).toBe('');
  });

  it('updates without timer delay when not in browser', async () => {
    vi.resetModules();
    vi.doMock('$app/environment', () => ({
      browser: false,
    }));

    // dynamically import mermaid to use the mocked browser
    const { mermaid: mermaidMockedEnv } = await import('./mermaid');

    const node = document.createElement('div');
    const source = 'graph TD; A-->B;';
    const b64 = btoa(source);
    node.innerHTML =
      '<div class="mermaid" data-processed="true" data-content="' + b64 + '">rendered</div>';
    document.body.appendChild(node);

    const action = mermaidMockedEnv(node, 'dark');
    const mermaidLib = (await import('mermaid')).default as MermaidMock;
    mermaidLib.initialize.mockClear();

    action.update('light');

    await vi.waitFor(() => {
      if (mermaidLib.initialize.mock.calls.length === 0) {
        throw new Error('Not initialized yet');
      }
    });

    vi.doUnmock('$app/environment');
  });

  it('ignores empty content diagrams on reset', () => {
    const node = document.createElement('div');
    node.innerHTML = `<div class="mermaid" data-processed="true" data-content=""></div>`;
    document.body.appendChild(node);

    // Call destroy directly to trigger reset
    const action = mermaid(node, 'dark');
    action.destroy();

    const el = node.querySelector('.mermaid');
    expect(el?.getAttribute('data-processed')).toBe('true'); // Should be untouched
  });

  it('ignores updates to the exact same theme', async () => {
    const node = document.createElement('div');
    node.innerHTML = `<div class="mermaid">graph TD; A-->B;</div>`;
    document.body.appendChild(node);

    const action = mermaid(node, 'dark');
    await Promise.resolve();

    const mermaidLib = (await import('mermaid')).default as MermaidMock;
    mermaidLib.initialize.mockClear();

    // Call update with the same theme
    action.update('dark');

    expect(mermaidLib.initialize).not.toHaveBeenCalled();
  });
});

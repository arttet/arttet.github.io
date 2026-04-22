import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mermaid } from './mermaid';

// Mock mermaid library
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    run: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('mermaid action robust', () => {
  type MermaidModule = Awaited<typeof import('mermaid')>;
  type MermaidMock = MermaidModule['default'] & {
    initialize: ReturnType<typeof vi.fn>;
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
});

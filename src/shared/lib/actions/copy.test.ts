import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { copy } from './copy';

describe('copy action advanced', () => {
  let writeTextMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeTextMock = vi.fn().mockImplementation(() => Promise.resolve());
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('skips if button already exists', () => {
    const node = document.createElement('div');
    node.innerHTML = `
      <pre class="shiki"><button class="copy-code-btn"></button><code>code</code></pre>
    `;
    copy(node);
    const btns = node.querySelectorAll('.copy-code-btn');
    expect(btns.length).toBe(1);
  });

  it('handles clipboard errors', async () => {
    const node = document.createElement('div');
    node.innerHTML = '<pre class="shiki"><code>code</code></pre>';
    copy(node);
    const btn = node.querySelector('.copy-btn') as HTMLButtonElement;

    const err = new Error('clipboard fail');
    writeTextMock.mockImplementationOnce(() => Promise.reject(err));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await btn.click();
    expect(consoleSpy).toHaveBeenCalledWith('Clipboard copy failed:', err);
    consoleSpy.mockRestore();
  });

  it('destroys and cleans up listeners', () => {
    const node = document.createElement('div');
    node.innerHTML = '<pre class="shiki"><code>code</code></pre>';
    const action = copy(node);
    const btn = node.querySelector('.copy-btn') as HTMLButtonElement;
    const removeSpy = vi.spyOn(btn, 'removeEventListener');

    action.destroy();
    expect(removeSpy).toHaveBeenCalled();
    expect(node.querySelector('.copy-btn')).toBeNull();
  });

  it('updates when content changes', () => {
    const node = document.createElement('div');
    node.innerHTML = '<pre class="shiki"><code>1</code></pre>';
    const action = copy(node);
    expect(node.querySelectorAll('.copy-btn').length).toBe(1);

    node.innerHTML += '<pre class="shiki"><code>2</code></pre>';
    action.update();
    expect(node.querySelectorAll('.copy-btn').length).toBe(2);
  });

  it('adds copy button for mermaid blocks and copies source text', async () => {
    const node = document.createElement('div');
    node.innerHTML =
      '<div class="mermaid-block group" data-copy-content="Z3JhcGggTFI7IEEtLT5COw==" data-copy-label="Mermaid"><div class="mermaid"></div></div>';

    copy(node);
    const btn = node.querySelector('.copy-btn') as HTMLButtonElement;

    expect(btn).toBeTruthy();
    await btn.click();
    expect(writeTextMock).toHaveBeenCalledWith('graph LR; A-->B;');
  });
});

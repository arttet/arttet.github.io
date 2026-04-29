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
    vi.runAllTimers();
    const btns = node.querySelectorAll('.copy-code-btn');
    expect(btns.length).toBe(1);
  });

  it('handles clipboard errors', async () => {
    const node = document.createElement('div');
    node.innerHTML = '<pre class="shiki"><code>code</code></pre>';
    copy(node);
    vi.runAllTimers();
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
    vi.runAllTimers();
    const btn = node.querySelector('.copy-btn') as HTMLButtonElement;
    const removeSpy = vi.spyOn(btn, 'removeEventListener');

    expect(node.querySelector('pre')).toHaveAttribute('tabindex', '-1');

    action.destroy();
    expect(removeSpy).toHaveBeenCalled();
    expect(node.querySelector('.copy-btn')).toBeNull();
  });

  it('updates when content changes', () => {
    const node = document.createElement('div');
    node.innerHTML = '<pre class="shiki"><code>1</code></pre>';
    const action = copy(node);
    vi.runAllTimers();
    expect(node.querySelectorAll('.copy-btn').length).toBe(1);

    node.innerHTML += '<pre class="shiki"><code>2</code></pre>';
    action.update();
    vi.runAllTimers();
    expect(node.querySelectorAll('.copy-btn').length).toBe(2);
  });

  it('adds copy button for mermaid blocks and copies source text', async () => {
    const node = document.createElement('div');
    node.innerHTML =
      '<div class="mermaid-block group" data-copy-content="Z3JhcGggTFI7IEEtLT5COw==" data-copy-label="Mermaid"><div class="mermaid"></div></div>';

    copy(node);
    vi.runAllTimers();
    const btn = node.querySelector('.copy-btn') as HTMLButtonElement;

    expect(node.querySelector('.mermaid-block')).toHaveAttribute('tabindex', '-1');
    expect(btn).toBeTruthy();
    expect(btn).not.toHaveAttribute('tabindex');
    await btn.click();
    expect(writeTextMock).toHaveBeenCalledWith('graph LR; A-->B;');
  });

  it('restores button state after successful copy', async () => {
    const node = document.createElement('div');
    node.innerHTML = '<pre class="shiki" data-language="ts"><code>const x = 1;</code></pre>';

    copy(node);
    vi.runAllTimers();
    const btn = node.querySelector('.copy-btn') as HTMLButtonElement;

    await btn.click();
    expect(btn.dataset.copied).toBe('1');
    expect(btn.textContent).toContain('Copied!');

    vi.advanceTimersByTime(1800);

    expect(btn.dataset.copied).toBeUndefined();
    expect(btn.textContent).toContain('Ts');
    expect(btn.style.color).toBe('');
    expect(btn.style.borderColor).toBe('');
    expect(btn.style.zIndex).toBe('');
    expect(btn.style.pointerEvents).toBe('');
  });

  it('uses Copy label for plain text code blocks and skips empty copy targets', () => {
    const node = document.createElement('div');
    node.innerHTML = `
      <pre class="shiki" data-language="text"><code>plain text</code></pre>
      <pre class="shiki"><code>no lang</code></pre>
      <div data-copy-content="" data-copy-label="Mermaid"></div>
      <div data-copy-content="YmFzZTY0" data-copy-label="  "></div>
      <div data-copy-content="YmFzZTY0"></div>
    `;

    copy(node);
    vi.runAllTimers();

    const buttons = node.querySelectorAll('.copy-btn');
    expect(buttons).toHaveLength(4);
    expect(buttons[0]).toHaveTextContent('Copy'); // text lang
    expect(buttons[1]).toHaveTextContent('Copy'); // missing lang
    expect(buttons[2]).toHaveTextContent('Copy'); // spaces label
    expect(buttons[3]).toHaveTextContent('Copy'); // missing label
  });

  it('falls back to pre.textContent or empty string if no code element', () => {
    const node = document.createElement('div');
    node.innerHTML = `
      <pre class="shiki">just text inside pre</pre>
      <pre class="shiki"></pre>
    `;
    copy(node);
    vi.runAllTimers();

    // The copy logic will still create buttons.
    // The first one will copy "just text inside pre"
    // The second one will copy ""
    const buttons = node.querySelectorAll('.copy-btn');
    expect(buttons).toHaveLength(2);
  });
});

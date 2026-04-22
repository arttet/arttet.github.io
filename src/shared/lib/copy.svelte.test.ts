import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCopy } from './copy.svelte';

describe('useCopy rune', () => {
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

  it('copies text and sets copied state', async () => {
    const copy = useCopy();
    expect(copy.copied).toBe(false);

    await copy.copy('hello');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello');
    expect(copy.copied).toBe(true);
    expect(copy.error).toBe(null);

    vi.advanceTimersByTime(1800);
    expect(copy.copied).toBe(false);
  });

  it('handles errors during copy', async () => {
    const err = new Error('fail');
    writeTextMock.mockImplementationOnce(() => Promise.reject(err));

    const copy = useCopy();
    await copy.copy('hello');

    expect(copy.copied).toBe(false);
    expect(copy.error).toBe(err);
  });

  it('ignores empty text', async () => {
    const copy = useCopy();
    await copy.copy('');
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it('clears the previous reset timer when copying again', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const copy = useCopy();

    await copy.copy('first');
    await copy.copy('second');

    expect(writeTextMock).toHaveBeenNthCalledWith(1, 'first');
    expect(writeTextMock).toHaveBeenNthCalledWith(2, 'second');
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});

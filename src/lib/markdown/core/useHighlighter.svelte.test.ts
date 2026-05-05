// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import * as highlightLib from './highlighter';
import { useHighlighter } from './useHighlighter.svelte';

vi.mock('./highlighter', () => ({
  highlightOnDemand: vi.fn().mockImplementation(async (code, _lang) => `<span>${code}</span>`),
}));

describe('useHighlighter rune', () => {
  const highlightOnDemandMock = vi.mocked(highlightLib.highlightOnDemand);

  it('highlights code and updates value', async () => {
    const hl = useHighlighter();
    expect(hl.value).toBe('');
    expect(hl.loading).toBe(false);

    const promise = hl.highlight('const x = 1;', 'ts');
    expect(hl.loading).toBe(true);

    await promise;
    expect(hl.value).toBe('<span>const x = 1;</span>');
    expect(hl.loading).toBe(false);
    expect(highlightLib.highlightOnDemand).toHaveBeenCalledWith('const x = 1;', 'ts');
  });

  it('clears value for empty code', async () => {
    const hl = useHighlighter();
    await hl.highlight('   ', 'ts');
    expect(hl.value).toBe('');
  });

  it('handles highlight errors gracefully', async () => {
    highlightOnDemandMock.mockImplementationOnce(() => Promise.reject('error'));
    const hl = useHighlighter();

    await expect(hl.highlight('code', 'ts')).resolves.toBeUndefined();
    expect(hl.loading).toBe(false);
  });
});

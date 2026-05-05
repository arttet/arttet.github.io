import { render, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import KaTeXStyles from './KaTeXStyles.svelte';

vi.mock('katex/dist/katex.min.css?url', () => ({
  default: '/mocked-katex-styles.css',
}));

describe('KaTeXStyles', () => {
  it('injects katex css link into head', async () => {
    render(KaTeXStyles);
    await waitFor(() => {
      const link = document.head.querySelector(
        'link[rel="stylesheet"][href="/mocked-katex-styles.css"]'
      );
      expect(link).toBeInTheDocument();
    });
  });
});

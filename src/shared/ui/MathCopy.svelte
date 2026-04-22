<script lang="ts">
import { useCopy } from '$shared/lib/copy.svelte';
import CopyButton from './CopyButton.svelte';

const {
  display = false,
  b64Latex = '',
  b64Html = '',
}: {
  display?: boolean;
  b64Latex?: string;
  b64Html?: string;
} = $props();

function decode(b64: string) {
  if (!b64) {
    return '';
  }
  try {
    // atob() with escape/decodeURIComponent for robust UTF-8 handling
    return decodeURIComponent(escape(atob(b64)));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Base64 decode failed:', e);
    return '';
  }
}

const latex = $derived(decode(b64Latex));
const html = $derived(decode(b64Html));
</script>

{#if display}
  <div class="math-copy-wrapper relative my-3 group">
    <div
      class="katex-display-container overflow-x-auto transition-colors duration-200"
      style="background-color: var(--code-bg); padding: 0.875rem 1.5rem; border-radius: var(--radius-md);"
    >
      <div class="katex-display m-0">{@html html}</div>
    </div>

    <!-- Copy button for display math -->
    <CopyButton content={latex} label="LaTeX" />
  </div>
{:else}
  <span
    class="math-copy-wrapper relative inline-group group px-1 rounded transition-colors duration-150"
  >
    <span class="katex-inline"> {@html html} </span>

    <!-- Inline copy button - small icon shown on hover -->
    <CopyButton content={latex} inline={true} label="LaTeX" />
  </span>
{/if}

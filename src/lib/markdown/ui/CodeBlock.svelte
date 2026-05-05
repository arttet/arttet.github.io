<script lang="ts">
import { useHighlighter } from '../core/useHighlighter.svelte';
import CopyButton from './CopyButton.svelte';

const {
  code = '',
  lang = '',
}: {
  code?: string;
  lang?: string;
} = $props();

const hl = useHighlighter();

$effect(() => {
  hl.highlight(code, lang);
});
</script>

<div class="code-block-wrapper relative my-6 group">
  {#if hl.value}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- Shiki SSR output, not user input -->
    {@html hl.value.replace('<pre class="shiki', '<pre tabindex="-1" class="shiki m-0')}
  {:else}
    <pre tabindex="-1" class="shiki m-0 font-mono"><code>{code.trim()}</code></pre>
  {/if}

  <!-- Copy button with language -->
  <CopyButton content={code} label={lang} />
</div>

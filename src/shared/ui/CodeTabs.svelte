<script lang="ts">
import { useHighlighter } from '$shared/lib/highlighter.svelte';
import CopyButton from './CopyButton.svelte';

interface Tab {
  lang: string;
  label: string;
  code: string;
}

const { tabs }: { tabs: Tab[] } = $props();

let active = $state(0);
const hl = useHighlighter();

$effect(() => {
  const tab = tabs[active];
  if (tab) {
    hl.highlight(tab.code.trim(), tab.lang);
  }
});
</script>

<div class="not-prose my-6 rounded-lg border border-[--color-border] overflow-hidden">
  <!-- Tab bar — language tabs only, no copy here -->
  <div class="flex items-center bg-[--code-bg] border-b border-[--color-border] px-1">
    {#each tabs as tab, i (tab.lang)}
      <button
        type="button"
        class="px-4 py-2 text-xs font-mono transition-colors duration-[100ms]
				       {i === active
					? 'text-[--color-accent] border-b-2 border-[--color-accent]'
					: 'text-[--code-accent] opacity-70 hover:opacity-100'}"
        onclick={() => {
					active = i;
				}}
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <!-- Code panel — language label inside copy button -->
  <div class="relative group" data-code-tabs-content>
    <!-- Copy button -->
    <CopyButton content={tabs[active].code} label={tabs[active].label || tabs[active].lang} />

    {#if hl.value}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -- Shiki SSR output, not user input -->
      {@html hl.value.replace('class="shiki', 'class="shiki m-0')}
    {:else}
      <pre class="shiki m-0 font-mono"><code>{tabs[active].code.trim()}</code></pre>
    {/if}
  </div>
</div>

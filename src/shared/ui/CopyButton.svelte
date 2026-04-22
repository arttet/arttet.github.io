<script lang="ts">
import { Check, Copy } from 'lucide-svelte';
import { useCopy } from '$shared/lib/copy.svelte';

const {
  content,
  label = '',
  inline = false,
  class: className = '',
}: {
  content: string;
  label?: string;
  inline?: boolean;
  class?: string;
} = $props();

const copyState = useCopy();
</script>

<button
  type="button"
  onclick={() => copyState.copy(content)}
  class="{inline ? 'copy-btn-inline' : 'copy-btn'} {className}"
  data-copied={copyState.copied ? '' : undefined}
  style="z-index: 100; pointer-events: auto; {copyState.copied ? 'color: var(--color-accent); border-color: var(--color-accent);' : ''}"
  aria-label={label ? `Copy ${label}` : "Copy"}
>
  {#if copyState.copied}
    <Check size={inline ? 10 : 11} strokeWidth={inline ? 2.5 : 2} />
    {#if !inline}
      <span>Copied!</span>
    {/if}
  {:else}
    <Copy size={inline ? 10 : 11} strokeWidth={inline ? 2 : 1.5} />
    {#if !inline}
      <span>{label || "Copy"}</span>
    {/if}
  {/if}
</button>

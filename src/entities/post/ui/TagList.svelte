<script lang="ts">
import { resolve } from '$app/paths';

const { tags, max = 3 } = $props<{ tags: string[]; max?: number }>();

let expanded = $state(false);
</script>

<div class="flex flex-wrap items-center justify-center gap-1.5 pt-2">
  {#each tags as tag, ti (tag)}
    {#if expanded || ti < max}
      <a
        href={resolve('/blog/tag/[tag]', { tag })}
        class="px-2 py-0.5 rounded text-xs font-mono bg-surface-1 text-accent hover:bg-surface-2 transition-colors duration-[150ms]"
      >
        #{tag}
      </a>
    {/if}
  {/each}
  {#if tags.length > max && !expanded}
    <button
      type="button"
      onclick={() => (expanded = true)}
      class="px-2 py-0.5 rounded text-xs font-mono bg-surface-1 hover:opacity-70 transition-opacity duration-[150ms] cursor-pointer text-accent"
    >
      +{tags.length - max} more
    </button>
  {/if}
  {#if tags.length > max && expanded}
    <button
      type="button"
      onclick={() => (expanded = false)}
      class="px-2 py-0.5 rounded text-xs font-mono bg-surface-1 hover:opacity-70 transition-opacity duration-[150ms] cursor-pointer text-accent"
    >
      show less
    </button>
  {/if}
</div>

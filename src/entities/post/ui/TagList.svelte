<script lang="ts">
const { tags, max = 3 } = $props<{ tags: string[]; max?: number }>();

let expanded = $state(false);
</script>

<div class="flex flex-wrap items-center justify-center gap-1.5 pt-2">
  {#each tags as tag, ti}
    {#if expanded || ti < max}
      <a
        href={`/blog/tag/${tag}`}
        class="px-2 py-0.5 rounded text-xs font-mono bg-black/5 dark:bg-white/5 text-accent hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-[150ms]"
      >
        #{tag}
      </a>
    {/if}
  {/each}
  {#if tags.length > max && !expanded}
    <button
      type="button"
      onclick={() => (expanded = true)}
      class="px-2 py-0.5 rounded text-xs font-mono bg-black/5 dark:bg-white/5 hover:opacity-70 transition-opacity duration-[150ms] cursor-pointer text-accent"
    >
      +{tags.length - max} more
    </button>
  {/if}
  {#if tags.length > max && expanded}
    <button
      type="button"
      onclick={() => (expanded = false)}
      class="px-2 py-0.5 rounded text-xs font-mono bg-black/5 dark:bg-white/5 hover:opacity-70 transition-opacity duration-[150ms] cursor-pointer text-accent"
    >
      show less
    </button>
  {/if}
</div>

<script lang="ts">
import { goto } from '$app/navigation';
import { searchModel } from '$features/search/model/searchModel.svelte';

async function handleNavigate(tag: string) {
  await goto(`/blog/tag/${tag}`);
  searchModel.close();
}
</script>

{#if searchModel.query.trim()}
  <p class="px-4 py-6 text-center text-sm text-[--color-text-muted]">
    No results for "{searchModel.query}"
  </p>
{:else}
  {#if searchModel.tags.length}
    <div class="px-4 pt-3 pb-2 border-b border-[--color-border]/50">
      <p class="text-xs font-mono text-[--color-text-muted] mb-2">Browse by tag</p>
      <div class="flex flex-wrap gap-2">
        {#each searchModel.showAllTags ? searchModel.tags : searchModel.tags.slice(0, 3) as t}
          <a
            href={`/blog/tag/${t.name}`}
            onclick={(e) => {
              e.preventDefault();
              handleNavigate(t.name);
            }}
            class="px-2 py-0.5 rounded text-xs font-mono bg-black/5 dark:bg-white/5 text-accent hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-[150ms]"
            >#{t.name}<span class="opacity-40 ml-1">{t.count}</span></a
          >
        {/each}
        {#if searchModel.tags.length > 3}
          <button
            type="button"
            onclick={() => (searchModel.showAllTags = !searchModel.showAllTags)}
            class="px-2 py-0.5 rounded text-xs font-mono bg-black/5 dark:bg-white/5 text-accent hover:opacity-70 transition-opacity duration-150"
          >
            {searchModel.showAllTags ? "show less" : `+${searchModel.tags.length - 3} more`}
          </button>
        {/if}
      </div>
    </div>
  {/if}
  <p class="px-4 pb-6 pt-4 text-center text-sm text-[--color-text-muted] font-mono">
    Type to search posts…
  </p>
{/if}

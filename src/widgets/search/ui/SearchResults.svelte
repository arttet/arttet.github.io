<script lang="ts">
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { searchModel } from '$features/search/model/searchModel.svelte';

function handleSelect(i: number) {
  searchModel.selected = i;
}

async function handleNavigate(slug: string) {
  await goto(resolve('/blog/[slug]', { slug }));
  searchModel.close();
}
</script>

<ul class="py-1 max-h-80 overflow-y-auto" id="search-results-list">
  {#each searchModel.results as result, i (result.slug)}
    <li>
      <button
        type="button"
        id="search-result-{i}"
        class="w-full px-4 py-3 text-left flex flex-col gap-1 transition-colors duration-100 {i === searchModel.selected ? 'bg-[--color-accent]/10 dark:bg-white/10' : 'hover:bg-[--color-accent]/5 dark:hover:bg-white/5'}"
        onmouseenter={() => handleSelect(i)}
        onclick={() => handleNavigate(result.slug)}
      >
        <span class="text-sm font-medium text-[--color-text]">{result.title}</span>
        <div class="flex items-center gap-2">
          <time class="text-xs font-mono text-[--color-text-muted]">
            {new Date(result.created).toLocaleDateString("en", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </time>
          {#each result.tags as tag (tag)}
            <span
              class="px-1.5 py-0.5 rounded text-xs font-mono bg-surface-1 text-accent"
              >#{tag}</span
            >
          {/each}
        </div>
      </button>
    </li>
  {/each}
</ul>

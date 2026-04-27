<script lang="ts">
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { searchModel } from '$features/search/model/searchModel.svelte';
import { focusTrap } from '$shared/lib/actions/focusTrap';
import SearchFooter from './SearchFooter.svelte';
import SearchInput from './SearchInput.svelte';
import SearchResults from './SearchResults.svelte';
import SearchTags from './SearchTags.svelte';

let inputEl: HTMLInputElement | undefined = $state();

$effect(() => {
  if (!browser) {
    return;
  }

  const onKey = async (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (searchModel.open) {
        searchModel.close();
      } else {
        await searchModel.openPalette();
      }
    }
    if (!searchModel.open) {
      return;
    }
    if (e.key === 'Escape') {
      searchModel.close();
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      searchModel.selected = Math.min(searchModel.selected + 1, searchModel.results.length - 1);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      searchModel.selected = Math.max(searchModel.selected - 1, 0);
    }
    if (e.key === 'Enter' && searchModel.results[searchModel.selected]) {
      await goto(
        resolve('/blog/[slug]', { slug: searchModel.results[searchModel.selected].slug })
      );
      searchModel.close();
    }
  };

  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
});

$effect(() => {
  if (searchModel.open) {
    searchModel.executeSearch();
  }
});

// Focus input when palette opens
$effect(() => {
  if (searchModel.open) {
    setTimeout(() => inputEl?.focus(), 0);
  }
});

// Scroll selected item into view
$effect(() => {
  if (!searchModel.open || searchModel.results.length === 0) {
    return;
  }
  const el = document.getElementById(`search-result-${searchModel.selected}`);
  if (el) {
    el.scrollIntoView({ block: 'nearest' });
  }
});
</script>

{#if searchModel.open}
  <!-- Backdrop -->
  <button
    type="button"
    class="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm"
    aria-label="Close search"
    onclick={() => searchModel.close()}
    tabindex="-1"
  ></button>

  <!-- Dialog -->
  <div
    role="dialog"
    aria-modal="true"
    aria-label="Search posts"
    use:focusTrap
    class="fixed left-1/2 top-[20%] z-110 w-full max-w-xl -translate-x-1/2 rounded-xl border border-[--color-border] shadow-2xl overflow-hidden"
    style="background-color: var(--color-bg-secondary)"
  >
    <SearchInput bind:inputEl />

    {#if searchModel.results.length}
      <SearchResults />
    {:else}
      <SearchTags />
    {/if}

    <SearchFooter />
  </div>
{/if}

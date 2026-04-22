<script lang="ts">
import { Search, X } from 'lucide-svelte';
import { searchModel } from '$features/search/model/searchModel.svelte';

let { inputEl = $bindable() } = $props<{
  inputEl?: HTMLInputElement;
}>();
</script>

<div class="flex items-center gap-3 px-4 py-3 border-b border-[--color-border]">
  <Search size={16} strokeWidth={1.5} class="shrink-0 text-[--color-text-muted]" />
  <input
    bind:this={inputEl}
    bind:value={searchModel.query}
    type="text"
    placeholder="Search posts…"
    class="flex-1 bg-transparent text-sm text-[--color-text] placeholder:text-[--color-text-muted] outline-none"
  >
  <button
    type="button"
    onclick={() => searchModel.close()}
    aria-label="Close"
    class="text-[--color-text-muted] hover:text-[--color-text]"
  >
    <X size={14} strokeWidth={1.5} />
  </button>
</div>

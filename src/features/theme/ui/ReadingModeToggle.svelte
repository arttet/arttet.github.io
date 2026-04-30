<script lang="ts">
import { readingMode } from '../model/readingMode.svelte';
</script>

<div class="flex items-center justify-between px-3 py-2.5">
  <span class="text-sm text-[--color-text-muted]">Reading mode</span>

  <button
    type="button"
    onclick={() => readingMode.toggle()}
    style="background: {readingMode.value ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)'}"
    class="relative w-9 h-5 rounded-full transition-colors duration-200"
    aria-label="Toggle reading mode"
  >
    <span
      style="transform: translateX({readingMode.value ? '1.125rem' : '0.125rem'})"
      class="absolute left-0 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
    ></span>
  </button>
</div>

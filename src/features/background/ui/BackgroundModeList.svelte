<script lang="ts">
import { backgroundMode } from '../backgroundMode.svelte';

import type { ModeName } from '../core/BackgroundScene';

const MODES: { id: ModeName; label: string }[] = [
  { id: 'particles', label: 'Particles' },

  { id: 'contours', label: 'Contours' },

  { id: 'flow', label: 'Flow' },
];
</script>

<p class="px-3 pt-2 pb-1 text-xs font-mono text-[--color-text-muted]">Background effect</p>

{#each MODES as m (m.id)}
  <button
    type="button"
    onclick={() => { backgroundMode.value = m.id; }}
    class="w-full flex items-center gap-3 px-3 py-2

	       text-sm text-left transition-colors duration-[100ms]

	       {backgroundMode.value === m.id

		? 'bg-black/5 dark:bg-white/10 text-[--color-heading]'

		: 'text-[--color-text-muted] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[--color-text]'}"
  >
    <span class="flex-1 font-mono text-xs">{m.label}</span>

    {#if backgroundMode.value === m.id}
      <span class="text-[--color-accent] text-xs">✓</span>
    {/if}
  </button>
{/each}

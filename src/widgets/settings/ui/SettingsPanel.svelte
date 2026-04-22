<script lang="ts">
import { Settings } from 'lucide-svelte';
import BackgroundModeList from '$features/background/ui/BackgroundModeList.svelte';
import { navAnchored } from '$features/theme/model/navAnchor.svelte';
import { readingMode } from '$features/theme/model/readingMode.svelte';
import CodeThemeList from '$features/theme/ui/CodeThemeList.svelte';
import ReadingModeToggle from '$features/theme/ui/ReadingModeToggle.svelte';
import { clickOutside } from '$shared/lib/actions/clickOutside';
import { focusTrap } from '$shared/lib/actions/focusTrap';

let isOpen = $state(false);

$effect(() => {
  navAnchored.value = isOpen;
});

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    isOpen = false;
  }
}
</script>

<svelte:window onkeydown={onKeyDown} />

<div class="relative" use:clickOutside={() => (isOpen = false)}>
  <button
    type="button"
    onclick={() => {
            isOpen = !isOpen;
        }}
    aria-label="Settings"
    class="flex items-center justify-center w-8 h-8 rounded-md text-accent hover:text-text hover:bg-white/5 transition-colors duration-150"
  >
    <Settings size={14} strokeWidth={2} />
  </button>

  {#if isOpen}
    <div
      class="absolute right-0 top-10 z-110 w-56 rounded-xl border border-[--color-border] shadow-xl overflow-hidden py-1"
      style="background-color: var(--color-bg-elevated)"
    >
      <ReadingModeToggle />

      {#if !readingMode.value}
        <BackgroundModeList />
      {/if}

      <div class="border-t border-[--color-border] my-1"></div>

      <CodeThemeList />
    </div>
  {/if}
</div>

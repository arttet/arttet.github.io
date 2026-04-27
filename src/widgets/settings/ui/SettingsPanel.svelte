<script lang="ts">
import { Settings } from 'lucide-svelte';
import BackgroundModeList from '$features/background/ui/BackgroundModeList.svelte';
import { navAnchored } from '$features/theme/model/navAnchor.svelte';
import { readingMode } from '$features/theme/model/readingMode.svelte';
import CodeThemeList from '$features/theme/ui/CodeThemeList.svelte';
import ReadingModeToggle from '$features/theme/ui/ReadingModeToggle.svelte';
import { clickOutside } from '$shared/lib/actions/clickOutside';

let isOpen = $state(false);
let triggerEl: HTMLButtonElement | undefined = $state();
let panelEl: HTMLDivElement | undefined = $state();

$effect(() => {
  navAnchored.value = isOpen;
});

// Restore focus when closing
$effect(() => {
  if (!isOpen && triggerEl && document.activeElement !== triggerEl) {
    // Only focus if we are not already on it (e.g. initial mount)
    // and if we are in the browser
    if (typeof window !== 'undefined' && document.body.contains(triggerEl)) {
        triggerEl.focus();
    }
  }
});

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    isOpen = false;
  }
}

function onPanelKeyDown(e: KeyboardEvent) {
  if (e.key === 'Tab') {
    const focusables = panelEl?.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables || focusables.length === 0) return;

    const first = focusables[0] as HTMLElement;
    const last = focusables[focusables.length - 1] as HTMLElement;

    if (e.shiftKey && document.activeElement === first) {
      isOpen = false;
    } else if (!e.shiftKey && document.activeElement === last) {
      isOpen = false;
    }
  }
}
</script>

<svelte:window onkeydown={onKeyDown} />

<div class="relative" use:clickOutside={() => (isOpen = false)}>
  <button
    bind:this={triggerEl}
    type="button"
    onclick={() => {
      isOpen = !isOpen;
    }}
    aria-label="Settings"
    aria-expanded={isOpen}
    aria-pressed={isOpen}
    class="flex items-center justify-center w-8 h-8 rounded-md text-accent hover:text-text hover:bg-white/5 transition-colors duration-150"
  >
    <Settings size={14} strokeWidth={2} />
  </button>

  {#if isOpen}
    <div
      bind:this={panelEl}
      onkeydown={onPanelKeyDown}
      role="none"
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

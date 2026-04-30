<script lang="ts">
import { Settings } from 'lucide-svelte';
import type { Component } from 'svelte';
import { navAnchored } from '$features/theme/model/navAnchor.svelte';
import { readingMode } from '$features/theme/model/readingMode.svelte';
import ReadingModeToggle from '$features/theme/ui/ReadingModeToggle.svelte';
import { clickOutside } from '$shared/lib/actions/clickOutside';

let isOpen = $state(false);
let triggerEl: HTMLButtonElement | undefined = $state();
let panelEl: HTMLDivElement | undefined = $state();
let restoreFocusOnClose = $state(false);
let BackgroundModeList = $state<Component | null>(null);
let CodeThemeList = $state<Component | null>(null);
let backgroundModeLoadStarted = false;
let codeThemeLoadStarted = false;

function loadCodeThemeList() {
  if (CodeThemeList || codeThemeLoadStarted) {
    return;
  }

  codeThemeLoadStarted = true;
  void import('$features/theme/ui/CodeThemeList.svelte')
    .then((module) => {
      CodeThemeList = module.default;
    })
    .catch(() => {
      codeThemeLoadStarted = false;
    });
}

function loadBackgroundModeList() {
  if (BackgroundModeList || backgroundModeLoadStarted || readingMode.value) {
    return;
  }

  backgroundModeLoadStarted = true;
  void import('$features/background/ui/BackgroundModeList.svelte')
    .then((module) => {
      BackgroundModeList = module.default;
    })
    .catch(() => {
      backgroundModeLoadStarted = false;
    });
}

function loadSettingsContent() {
  loadCodeThemeList();
  loadBackgroundModeList();
}

$effect(() => {
  navAnchored.value = isOpen;
  if (isOpen) {
    void loadSettingsContent();
  }
});

// Restore focus when closing
$effect(() => {
  if (!isOpen && restoreFocusOnClose && triggerEl && document.activeElement !== triggerEl) {
    if (document.body.contains(triggerEl)) {
      triggerEl.focus();
      restoreFocusOnClose = false;
    }
  }
});

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    restoreFocusOnClose = isOpen;
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

    const isFirstActive = first.contains(document.activeElement) || e.target === first;
    const isLastActive = last.contains(document.activeElement) || e.target === last;

    if (e.shiftKey && isFirstActive) {
      restoreFocusOnClose = false;
      isOpen = false;
    } else if (!e.shiftKey && isLastActive) {
      restoreFocusOnClose = false;
      isOpen = false;
    }
  }
}
</script>

<svelte:window onkeydown={onKeyDown} />

<div
  class="relative"
  use:clickOutside={() => {
    restoreFocusOnClose = false;
    isOpen = false;
  }}
>
  <button
    bind:this={triggerEl}
    type="button"
    onclick={() => {
      restoreFocusOnClose = isOpen;
      isOpen = !isOpen;
    }}
    aria-label="Settings"
    aria-expanded={isOpen}
    aria-pressed={isOpen}
    class="flex items-center justify-center w-8 h-8 rounded-md text-accent hover:text-text hover:bg-surface-1 transition-colors duration-150"
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

      {#if !readingMode.value && BackgroundModeList}
        <BackgroundModeList />
      {/if}

      <div class="border-t border-[--color-border] my-1"></div>

      {#if CodeThemeList}
        <CodeThemeList />
      {/if}
    </div>
  {/if}
</div>

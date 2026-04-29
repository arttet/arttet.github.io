<script lang="ts">
import '@fontsource-variable/geist';
import '@fontsource-variable/jetbrains-mono';
import geistLatinUrl from '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url';
import '../app.css';
import type { Component } from 'svelte';
import { onDestroy } from 'svelte';
import { browser } from '$app/environment';
import { afterNavigate, onNavigate } from '$app/navigation';
import { page } from '$app/state';
import type { ModeName } from '$features/background/core/BackgroundScene';
import { backgroundState } from '$features/background/model/background.svelte';
import { readingMode } from '$features/theme/model/readingMode.svelte';
import { setThemes } from '$lib/highlighter';
import { site } from '$shared/config/site';
import { focusBoundary } from '$shared/lib/actions/focusBoundary';
import { viewport } from '$shared/lib/viewport.svelte';
import Seo from '$shared/ui/Seo.svelte';
import Footer from '$widgets/layout/ui/Footer.svelte';
import Header from '$widgets/layout/ui/Header.svelte';
import CommandPalette from '$widgets/search/ui/CommandPalette.svelte';
import ThemeManager from '$widgets/theme/ui/ThemeManager.svelte';

const { children } = $props();
let BackgroundCanvas = $state<Component<{ mode?: ModeName }> | null>(null);
let backgroundLoadStarted = false;
let idleHandle: number | undefined;

// Initialize highlighter themes
setThemes(site.codeThemes.map((t) => t.id));

onNavigate((navigation) => {
  if (!document.startViewTransition) {
    return;
  }
  return new Promise((resolve) => {
    document.startViewTransition(async () => {
      resolve();
      await navigation.complete;
    });
  });
});

$effect(() => {
  if (!browser || !page.url.hash) return;
  const id = decodeURIComponent(page.url.hash.slice(1));
  const timer = setTimeout(() => {
    const el = document.getElementById(id);
    if (el) {
      el.focus({ preventScroll: true });
      el.scrollIntoView();
    }
  }, 100);
  return () => clearTimeout(timer);
});

afterNavigate((nav) => {
  if (nav.to?.url.hash) return;
  window.scrollTo({ top: 0, behavior: 'instant' });
});

// Avoid rendering layout Seo if page has its own Seo (e.g., blog posts)
const isBlogPage = $derived(page.url.pathname.startsWith('/blog'));

function runWhenIdle(cb: () => void): number {
  if (typeof window.requestIdleCallback === 'function') {
    return window.requestIdleCallback(cb);
  }
  return window.setTimeout(cb, 0);
}

function cancelIdle(handle: number) {
  if (typeof window.cancelIdleCallback === 'function') {
    window.cancelIdleCallback(handle);
    return;
  }
  window.clearTimeout(handle);
}

function requestBackgroundCanvas() {
  if (!browser || backgroundLoadStarted || readingMode.value) {
    return;
  }

  backgroundLoadStarted = true;
  idleHandle = runWhenIdle(async () => {
    idleHandle = undefined;
    BackgroundCanvas = (await import('$features/background/ui/BackgroundCanvas.svelte')).default;
  });
}

$effect(() => {
  requestBackgroundCanvas();
});

onDestroy(() => {
  if (idleHandle !== undefined) {
    cancelIdle(idleHandle);
  }
});
</script>

<svelte:window
  bind:innerHeight={viewport.winHeight}
  onmousemove={(e) => {
    viewport.updateMouseY(e.clientY);
  }}
  onmouseleave={() => {
    viewport.updateMouseY(-1);
  }}
  onscroll={() => {
    viewport.updateScroll(window.scrollY);
  }}
/>

<svelte:head>
  <link rel="preload" as="font" type="font/woff2" href={geistLatinUrl} crossorigin="anonymous" />
</svelte:head>

{#if !isBlogPage}
  <Seo />
{/if}

<div use:focusBoundary class="flex flex-col min-h-dvh bg-[--color-bg] text-[--color-text]">
  {#if !readingMode.value && BackgroundCanvas}
    <BackgroundCanvas mode={backgroundState.mode} />
  {/if}

  <main id="main-content" tabindex="-1" class="flex-1">{@render children()}</main>

  <Header />

  <ThemeManager />
  <CommandPalette />

  <Footer />
</div>

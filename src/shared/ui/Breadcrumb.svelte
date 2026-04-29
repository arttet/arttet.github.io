<script module lang="ts">
  export interface RouteSegment {
    label: string;
    href?: string;
    isHome?: boolean;
  }
</script>

<script lang="ts">
  import { Home as HomeIcon } from 'lucide-svelte';

  const { items = [] }: { items?: RouteSegment[] } = $props();
</script>

<nav
  aria-label="Breadcrumb"
  class="breadcrumb mb-10 max-w-full overflow-x-auto overflow-y-hidden py-px font-mono text-xs"
>
  <ol class="breadcrumb-track flex min-w-max items-center whitespace-nowrap">
    {#each items as item, index (item.href ?? item.label)}
      <li
        class="breadcrumb-item relative min-w-0"
        class:first={index === 0}
        class:current={!item.href}
        class:home={item.isHome}
        class:with-separator={index < items.length - 1}
        style:z-index={items.length - index}
        style:--segment-bg={`var(--breadcrumb-step-${Math.min(index + 1, 3)})`}
        style:--segment-fg={`var(--breadcrumb-fg-${Math.min(index + 1, 3)})`}
      >
        {#if item.href}
          <!-- item.href is a resolved navigation prop supplied by the route/widget layer. -->
          <!-- eslint-disable svelte/no-navigation-without-resolve -->
          <a
            href={item.href}
            aria-label={item.isHome ? item.label : undefined}
            title={item.label}
            data-sveltekit-preload-data="hover"
            class="breadcrumb-link relative z-20 flex min-w-0 items-center transition-colors
              focus-visible:outline-none"
          >
            {#if item.isHome}
              <HomeIcon size={13} strokeWidth={2.2} aria-hidden="true" />
            {:else}
              <span class="crumb-text">{item.label}</span>
            {/if}
          </a>
          <!-- eslint-enable svelte/no-navigation-without-resolve -->
        {:else}
          <span
            aria-current="page"
            title={item.label}
            class="breadcrumb-link relative z-20 flex min-w-0 items-center"
          >
            <span class="crumb-text">{item.label}</span>
          </span>
        {/if}
      </li>
    {/each}
  </ol>
</nav>

<style>
  .breadcrumb {
    --separator-size: 1rem;
    --segment-pad-x: 0.95rem;
    --segment-height: 1.85rem;
    --breadcrumb-step-1: color-mix(
      in srgb,
      var(--color-bg, Canvas) 86%,
      var(--color-accent, CanvasText)
    );
    --breadcrumb-step-2: color-mix(
      in srgb,
      var(--color-bg-elevated, Canvas) 62%,
      var(--color-accent, CanvasText)
    );
    --breadcrumb-step-3: var(--color-accent, CanvasText);
    --breadcrumb-fg-1: var(--color-text, CanvasText);
    --breadcrumb-fg-2: var(--color-text, CanvasText);
    --breadcrumb-fg-3: var(--color-bg, Canvas);
    scrollbar-width: none;
  }

  .breadcrumb::-webkit-scrollbar {
    display: none;
  }

  .breadcrumb-track {
    gap: 0;
    width: 100%;
    max-width: 100%;
    overflow: hidden;
    border-radius: var(--radius-md, 0.625rem);
  }

  .breadcrumb-item {
    flex: 0 1 auto;
    min-width: 0;
    background: var(--segment-bg);
    color: var(--segment-fg);
  }

  .breadcrumb-item + .breadcrumb-item {
    margin-left: calc(-1 * var(--separator-size));
  }

  .breadcrumb-link {
    min-height: var(--segment-height);
    padding-block: 0.25rem;
    padding-inline: calc(var(--segment-pad-x) + var(--separator-size) * 1.45)
      calc(var(--segment-pad-x) + var(--separator-size) * 1.2);
    box-shadow: inset 0 0 0 0 transparent;
  }

  .breadcrumb-link:focus-visible {
    border-radius: var(--radius-sm, 0.25rem);
    box-shadow: inset 0 0 0 2px var(--color-accent, currentColor);
  }

  .breadcrumb-item.home {
    flex: 0 0 auto;
    border-top-left-radius: var(--radius-md, 0.625rem);
    border-bottom-left-radius: var(--radius-md, 0.625rem);
  }

  .breadcrumb-item.home .breadcrumb-link {
    justify-content: center;
    width: calc(var(--segment-height) + var(--separator-size) + 0.25rem);
    padding-left: 0.5rem;
    padding-right: calc(var(--separator-size) + 0.4rem);
  }

  .breadcrumb-item.current .breadcrumb-link {
    padding-left: calc(var(--segment-pad-x) + var(--separator-size) * 1.55);
    padding-right: var(--segment-pad-x);
    font-weight: 600;
  }

  .breadcrumb-item.current {
    flex: 1 1 auto;
    border-top-right-radius: var(--radius-md, 0.625rem);
    border-bottom-right-radius: var(--radius-md, 0.625rem);
    overflow: hidden;
  }

  .breadcrumb-item.current .crumb-text {
    max-width: none;
  }

  .crumb-text {
    display: block;
    max-width: min(24ch, 52vw);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .breadcrumb-item.with-separator::after {
    content: '';
    position: absolute;
    top: -1px;
    bottom: -1px;
    left: calc(100% - 1px);
    z-index: 30;
    width: calc(var(--separator-size) + 2px);
    background: inherit;
    clip-path: polygon(0 0, 100% 50%, 0 100%);
    pointer-events: none;
  }
</style>

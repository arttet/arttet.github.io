<script lang="ts">
import { resolve } from '$app/paths';
import Logo from '$shared/ui/Logo.svelte';

const { tag, count } = $props<{ tag?: string; count: number }>();
</script>

<header class="mb-10">
  <!-- Row 1: Blog heading + clear filter -->
  <div class="flex items-center justify-between gap-4 flex-wrap">
    <div class="flex items-center gap-4">
      <a
        href={resolve('/')}
        aria-label="Home"
        class="shrink-0 hover:scale-105 transition-transform duration-200"
      >
        <Logo size="w-10 h-10" shadow="drop-shadow-sm" />
      </a>
      <h1 class="text-4xl font-bold text-heading tracking-tight">Blog</h1>
    </div>
    {#if tag}
      <a
        href={resolve('/blog')}
        class="text-sm text-text-muted hover:text-text
      transition-colors shrink-0"
      >
        ✕ clear filter
      </a>
    {/if}
  </div>

  <!-- Row 2: Post count -->
  {#if tag}
    <div class="mt-4 flex items-center gap-2">
      <span class="text-sm text-text-muted">Filtering by</span>
      <span class="text-sm font-mono text-accent">
        #{tag}
      </span>
      <span class="text-sm text-text-muted">
        ({count} {#if count === 1}post{:else}posts{/if})
      </span>
    </div>
  {:else}
    <p class="mt-4 text-sm text-text-muted">
      {count} {#if count === 1}post{:else}posts{/if}
    </p>
  {/if}
</header>

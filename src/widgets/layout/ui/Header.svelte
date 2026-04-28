<script lang="ts">
import { Search } from 'lucide-svelte';
import { resolve } from '$app/paths';
import { searchModel } from '$features/search/model/searchModel.svelte';
import { navAnchored, navAnchorPositions } from '$features/theme/model/navAnchor.svelte';
import ThemeToggle from '$features/theme/ui/ThemeToggle.svelte';
import { site } from '$shared/config/site';
import { viewport } from '$shared/lib/viewport.svelte';
import Logo from '$shared/ui/Logo.svelte';
import SettingsPanel from '$widgets/settings/ui/SettingsPanel.svelte';

let navEl: HTMLElement | undefined = $state();

$effect(() => {
  if (!navEl) {
    return;
  }
  function measure() {
    const buttons = navEl?.querySelectorAll<HTMLElement>('a[href], button');
    const positions: { x: number; y: number }[] = [];
    for (const btn of buttons ?? []) {
      const r = btn.getBoundingClientRect();
      positions.push({
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
      });
    }
    navAnchorPositions.value = positions;
  }
  measure();
  window.addEventListener('resize', measure, { passive: true });
  return () => window.removeEventListener('resize', measure);
});

const isVisible = $derived(viewport.navVisible || navAnchored.value);
</script>

<div
  class="fixed top-4 left-0 right-0 z-50 flex justify-center transition-transform duration-300 ease-in-out pointer-events-none {isVisible
          ? 'translate-y-0'
          : '-translate-y-[calc(100%+1rem)]'}"
>
  <header class="glass rounded-2xl pointer-events-auto">
    <nav bind:this={navEl} class="px-3 h-12 flex items-center gap-1">
      <!-- Logo icon -->
      <a
        href={resolve('/')}
        aria-label="Home"
        class="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-1 transition-colors duration-150"
      >
        <Logo size="w-5 h-5" />
      </a>

      <div class="w-px h-4 bg-surface-2 mx-1"></div>

      <!-- Nav links -->
      {#each site.nav.links as { label, href } (href)}
        <a
          href={resolve(href)}
          class="px-3 py-1.5 text-sm text-accent visited:text-accent
                 hover:text-heading transition-colors duration-150"
        >
          {label}
        </a>
      {/each}

      <div class="w-px h-4 bg-surface-2 mx-1"></div>

      <!-- Actions -->
      <button
        type="button"
        onclick={() => searchModel.openPalette()}
        aria-label="Search (⌘K)"
        class="flex items-center justify-center w-8 h-8 rounded-lg text-accent hover:text-heading hover:bg-surface-1 transition-colors duration-150"
      >
        <Search size={14} strokeWidth={2} />
      </button>
      <SettingsPanel />
      <ThemeToggle />

      <div class="w-px h-4 bg-surface-2 mx-1"></div>

      <!-- GitHub — separate group at end -->
      <a
        href="https://github.com/{site.author.github}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
        class="flex items-center justify-center w-8 h-8 rounded-lg text-accent hover:text-heading hover:bg-surface-1 transition-colors duration-[150ms]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path
            d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
          />
        </svg>
      </a>
    </nav>
  </header>
</div>

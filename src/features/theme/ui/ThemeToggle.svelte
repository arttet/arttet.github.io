<script lang="ts">
import { Moon, Sun } from 'lucide-svelte';
import { theme } from '../model/theme.svelte';

function toggle(e: MouseEvent) {
  const x = `${((e.clientX / window.innerWidth) * 100).toFixed(1)}%`;
  const y = `${((e.clientY / window.innerHeight) * 100).toFixed(1)}%`;
  document.documentElement.style.setProperty('--theme-x', x);
  document.documentElement.style.setProperty('--theme-y', y);

  if (!document.startViewTransition) {
    theme.toggle();
    return;
  }

  document.documentElement.dataset.themeTransition = '1';
  const t = document.startViewTransition(() => theme.toggle());
  t.finished.finally(() => {
    delete document.documentElement.dataset.themeTransition;
  });
}
</script>

<button
  type="button"
  onclick={toggle}
  aria-label="Toggle theme"
  aria-pressed={theme.current === "dark"}
  class="flex items-center justify-center w-8 h-8 rounded-md text-accent
	       hover:text-text hover:bg-white/5
	       transition-colors duration-[150ms]"
>
  {#if theme.current === "dark"}
    <Sun size={16} strokeWidth={2} />
  {:else}
    <Moon size={16} strokeWidth={2} />
  {/if}
</button>

<script lang="ts">
import { site } from '$shared/config/site';
import { darkCodeTheme, lightCodeTheme } from '../model/codeTheme.svelte';
import { theme } from '../model/theme.svelte';

const isDark = $derived(theme.current === 'dark');
const themes = $derived(site.codeThemes.filter((t) => t.kind === (isDark ? 'dark' : 'light')));
const active = $derived(isDark ? darkCodeTheme.value : lightCodeTheme.value);

function selectCodeTheme(id: string) {
  if (isDark) {
    darkCodeTheme.value = id;
  } else {
    lightCodeTheme.value = id;
  }
}
</script>

<p class="px-3 pt-2 pb-1 text-xs font-mono text-[--color-text-muted]">Code theme</p>
{#each themes as t (t.id)}
  <button
    type="button"
    onclick={() => selectCodeTheme(t.id)}
    class="w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors duration-100 {active ===
        t.id
            ? 'bg-black/5 dark:bg-white/10 text-[--color-heading]'
            : 'text-[--color-text-muted] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[--color-text]'}"
  >
    <span
      class="shrink-0 w-5 h-5 rounded-md border border-white/10 flex items-center justify-center"
      style="background: {t.bg}"
    >
      <span class="w-2.5 h-2.5 rounded-full" style="background: {t.accent}"></span>
    </span>
    <span class="flex-1 font-mono text-xs leading-snug">{t.label}</span>
    {#if active === t.id}
      <span class="text-[--color-accent] text-xs">✓</span>
    {/if}
  </button>
{/each}

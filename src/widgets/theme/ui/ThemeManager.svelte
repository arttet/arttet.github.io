<script lang="ts">
import { browser } from '$app/environment';
import {
  applyCodeTheme,
  darkCodeTheme,
  lightCodeTheme,
} from '$features/theme/model/codeTheme.svelte';
import { theme } from '$features/theme/model/theme.svelte';
import { site } from '$shared/config/site';
import { generateThemeCSS } from '$shared/lib/theme-utils';

// Handle dark mode class toggle on <html>
$effect(() => {
  if (browser) {
    document.documentElement.classList.toggle('dark', theme.current === 'dark');
  }
});

// Handle code theme application attribute on <html>
$effect(() => {
  if (browser) {
    const id = theme.current === 'dark' ? darkCodeTheme.value : lightCodeTheme.value;
    applyCodeTheme(id);
  }
});
const themeStyle = $derived(`<style>${generateThemeCSS(site.codeThemes)}</style>`);
</script>

<svelte:head> {@html themeStyle} </svelte:head>

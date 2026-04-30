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

$effect(() => {
  if (browser) {
    const id = theme.current === 'dark' ? darkCodeTheme.value : lightCodeTheme.value;
    applyCodeTheme(id);
  }
});

const themeStyle = $derived(`<style>${generateThemeCSS(site.codeThemes)}</style>`);
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -- generated <style> tag from typed site config, no user input -->
<svelte:head> {@html themeStyle} </svelte:head>

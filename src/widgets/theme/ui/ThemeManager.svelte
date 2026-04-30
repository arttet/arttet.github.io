<script lang="ts">
import { browser } from '$app/environment';
import { theme } from '$features/theme/model/theme.svelte';

// Handle dark mode class toggle on <html>
$effect(() => {
  if (browser) {
    document.documentElement.classList.toggle('dark', theme.current === 'dark');
  }
});
</script>

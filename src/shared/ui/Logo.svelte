<script lang="ts">
import logoUrl from '$lib/assets/icons/logo.svg?url';

const {
  size = 'w-10 h-10',
  shadow = '',
}: {
  size?: string;
  shadow?: string;
} = $props();
</script>

<img src={logoUrl} alt="logo" class={`invert dark:invert-0 ${size} ${shadow}`.trim()}>

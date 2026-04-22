<script lang="ts">
const {
  size = 'w-10 h-10',
  shadow = '',
}: {
  size?: string;
  shadow?: string;
} = $props();
</script>

<img src="/icons/logo.svg" alt="logo" class={`invert dark:invert-0 ${size} ${shadow}`.trim()}>

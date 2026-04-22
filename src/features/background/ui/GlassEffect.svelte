<script lang="ts">
import { onMount } from 'svelte';
import { backgroundState } from '../model/background.svelte';

let el: HTMLElement | undefined = $state();

function update() {
  if (el?.parentElement) {
    const r = el.parentElement.getBoundingClientRect();
    backgroundState.glassRect = { x: r.left, y: r.top, w: r.width, h: r.height };
  }
}

onMount(() => {
  update();
  window.addEventListener('resize', update);
  window.addEventListener('scroll', update, { passive: true });

  return () => {
    window.removeEventListener('resize', update);
    window.removeEventListener('scroll', update);
    backgroundState.glassRect = null;
  };
});
</script>

<div bind:this={el} class="absolute inset-0 pointer-events-none" aria-hidden="true"></div>

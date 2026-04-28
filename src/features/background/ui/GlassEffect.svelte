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
  let raf = 0;
  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      update();
    });
  }

  const ro = new ResizeObserver(update);
  if (el?.parentElement) ro.observe(el.parentElement);

  update();
  window.addEventListener('scroll', onScroll, { passive: true });

  return () => {
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('scroll', onScroll);
    ro.disconnect();
    backgroundState.glassRect = null;
  };
});
</script>

<div bind:this={el} class="absolute inset-0 pointer-events-none" aria-hidden="true"></div>

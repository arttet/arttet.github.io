<script lang="ts">
import { onMount } from 'svelte';
import { backgroundState } from '../model/background.svelte';

let el: HTMLElement | undefined = $state();
let raf = 0;

function update() {
  if (el?.parentElement) {
    const r = el.parentElement.getBoundingClientRect();
    backgroundState.glassRect = { x: r.left, y: r.top, w: r.width, h: r.height };
  }
}

function scheduleUpdate() {
  if (raf) {return;}
  raf = requestAnimationFrame(() => {
    raf = 0;
    update();
  });
}

onMount(() => {
  const ro = new ResizeObserver(scheduleUpdate);
  if (el?.parentElement) {
    ro.observe(el.parentElement);
  }

  scheduleUpdate();
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });

  return () => {
    if (raf) {cancelAnimationFrame(raf);}
    raf = 0;
    window.removeEventListener('scroll', scheduleUpdate);
    window.removeEventListener('resize', scheduleUpdate);
    ro.disconnect();
    backgroundState.glassRect = null;
  };
});
</script>

<div bind:this={el} class="absolute inset-0 pointer-events-none" aria-hidden="true"></div>

<script lang="ts">
import { onDestroy, onMount } from 'svelte';
import { browser } from '$app/environment';
import type { ModeName } from '$features/background/core/BackgroundScene';
import { BackgroundScene } from '$features/background/core/BackgroundScene';
import { theme } from '$features/theme/model/theme.svelte';
import { site } from '$shared/config/site';
import { backgroundState } from '../model/background.svelte';

let { mode = $bindable<ModeName>('particles') }: { mode?: ModeName } = $props();

let canvas = $state<HTMLCanvasElement | null>(null);
let scene = $state<BackgroundScene | null>(null);
let failed = $state(false);
let rafId = 0;
let lastTime = 0;
let paused = false;
let removeVisibility: (() => void) | undefined;

function parseBgColor(): [number, number, number] {
  const hex = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-bg')
    .trim()
    .replace('#', '');
  return [
    parseInt(hex.slice(0, 2), 16) / 255,
    parseInt(hex.slice(2, 4), 16) / 255,
    parseInt(hex.slice(4, 6), 16) / 255,
  ];
}

onMount(async () => {
  if (!browser || !canvas) {
    return;
  }

  const s = new BackgroundScene();
  try {
    await s.init({
      canvas,
      particleCount: 200,
      particleSpeed: 0.15,
      cursorRadius: 200,
      cursorForce: 0.5,
      cursorMode: 'attract',
    });
  } catch (e) {
     
    console.error('Background scene initialization failed:', e);
    failed = true;
    return;
  }
  await s.setMode(mode);
  scene = s;

  const [r, g, b] = parseBgColor();
  scene.setBgColor(r, g, b);

  const loop = (time: number) => {
    if (!paused && scene) {
      const dt = lastTime ? time - lastTime : 16;
      lastTime = time;
      scene.render(dt);
    }
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);

  const onVisibility = () => {
    paused = document.hidden;
    if (!paused) {
      lastTime = 0;
    }
  };
  document.addEventListener('visibilitychange', onVisibility);
  removeVisibility = () => document.removeEventListener('visibilitychange', onVisibility);
});

$effect(() => {
  if (scene) {
    scene.setMode(mode);
  }
});

$effect(() => {
  if (scene) {
    const rect = backgroundState.glassRect;
    if (rect) {
      scene.updateGlassRect(rect.x, rect.y, rect.w, rect.h);
    } else {
      scene.updateGlassRect(0, 0, 0, 0);
    }
  }
});

$effect(() => {
  const isDark = theme.current === 'dark';
  if (!browser || !scene) {
    return;
  }

  // Update particle colors
  const palette = site.particles.colors[isDark ? 'dark' : 'light'];
  scene.setParticleColors(palette);
  scene.setThemeMode(isDark);

  Promise.resolve().then(() => {
    const [r, g, b] = parseBgColor();
    scene?.setBgColor(r, g, b);
  });
});

onDestroy(() => {
  if (!browser) {
    return;
  }
  cancelAnimationFrame(rafId);
  scene?.destroy();
  removeVisibility?.();
});
</script>

{#if failed}
  <div
    class="fixed inset-0 z-[-10] pointer-events-none bg-[--color-bg]"
    aria-hidden="true"
    style="background-image: radial-gradient(circle at 50% 50%, var(--color-bg-elevated) 0%, var(--color-bg) 100%)"
  ></div>
{:else}
  <canvas
    bind:this={canvas}
    class="fixed inset-0 w-full h-full z-[-10]"
    onmousemove={(e) => {      const r = canvas?.getBoundingClientRect();
      if (r) {
        scene?.setCursor(e.clientX - r.left, e.clientY - r.top);
      }
    }}
    onmouseleave={() => scene?.clearCursor()}
    onclick={(e) => {
      const r = canvas?.getBoundingClientRect();
      if (r) {
        scene?.clickBurst(e.clientX - r.left, e.clientY - r.top);
      }
    }}
  ></canvas>
{/if}

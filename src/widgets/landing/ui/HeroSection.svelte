<script lang="ts">
import GlassEffect from '$features/background/ui/GlassEffect.svelte';
import { site } from '$shared/config/site';
import Logo from '$shared/ui/Logo.svelte';
</script>

<div class="relative flex flex-col items-center justify-center h-dvh px-6 overflow-hidden">
  <!-- Business card -->
  <div class="glass relative z-10 rounded-3xl w-72 flex flex-col items-center py-10 px-8 gap-5">
    <GlassEffect />
    <!-- Logo -->
    <Logo size="w-16 h-16" shadow="drop-shadow-lg" />

    <!-- Identity -->
    <div class="flex flex-col items-center gap-1 text-center">
      <h1 class="text-xl font-semibold text-heading tracking-tight drop-shadow-sm">
        {site.author.name}
      </h1>
      <p class="text-sm text-text-muted font-mono">{site.author.title}</p>
    </div>

    <div class="w-full h-px bg-border"></div>

    <!-- Nav buttons -->
    <div class="flex flex-col w-full gap-2">
      {#each site.nav.links as { label, href }}
        <a
          {href}
          class="w-full py-2 rounded-xl text-sm text-center font-mono
                 text-accent border border-border
                 bg-black/5 dark:bg-white/5
                 hover:text-text hover:bg-black/10 dark:hover:bg-white/10
                 transition-all duration-[150ms]"
        >
          {label}
        </a>
      {/each}
    </div>

    <div class="w-full h-px bg-border"></div>

    <!-- GitHub -->
    <a
      href="https://github.com/{site.author.github}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GitHub"
      class="text-accent hover:text-text transition-colors duration-150"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path
          d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
        />
      </svg>
    </a>
  </div>
</div>

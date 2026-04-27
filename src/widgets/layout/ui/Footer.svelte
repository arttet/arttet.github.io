<script lang="ts">
import { site } from '$shared/config/site';
import { viewport } from '$shared/lib/viewport.svelte';
</script>

<div
  class="fixed bottom-4 left-0 right-0 z-50 flex justify-center transition-transform duration-300 ease-in-out pointer-events-none {viewport.footerVisible
          ? 'translate-y-0'
          : 'translate-y-[calc(100%+1rem)]'}"
>
  <footer class="glass rounded-2xl pointer-events-auto max-w-[calc(100vw-2rem)]">
    <div
      class="px-4 py-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-[--color-text-muted] font-mono text-center"
    >
      <span>© {new Date().getFullYear()} {site.author.name}</span>
      <span class="hidden sm:inline">•</span>
      <span>
        Code:
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external license URL -->
        <a href={site.licenses.code.href}
          target="_blank"
          rel="noopener noreferrer"
          class="text-accent hover:text-heading transition-colors"
        >
          {site.licenses.code.label}
        </a>
      </span>
      <span class="hidden sm:inline">•</span>
      <span>
        Content:
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external license URL -->
        <a href={site.licenses.content.href}
          target="_blank"
          rel="noopener noreferrer"
          class="text-accent hover:text-heading transition-colors"
        >
          {site.licenses.content.label}
        </a>
      </span>
      <span class="basis-full">Unless otherwise noted.</span>
    </div>
  </footer>
</div>

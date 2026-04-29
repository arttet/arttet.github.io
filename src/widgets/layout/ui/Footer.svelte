<script lang="ts">
import { site } from '$shared/config/site';
import { visibleTabScope } from '$shared/lib/actions/visibleTabScope';
import { viewport } from '$shared/lib/viewport.svelte';
</script>

<div
  use:visibleTabScope={viewport.footerVisible}
  class="fixed bottom-4 left-0 right-0 z-50 flex justify-center transition-transform duration-300 ease-in-out pointer-events-none {viewport.footerVisible
          ? 'translate-y-0'
          : 'translate-y-[calc(100%+1rem)]'}"
>
  <footer class="glass rounded-2xl pointer-events-auto max-w-[calc(100vw-2rem)]">
    <div
      class="px-4 py-3 flex flex-col items-center justify-center gap-1 text-xs text-[--color-text-muted] font-mono text-center leading-relaxed"
    >
      <p>© {new Date().getFullYear()} {site.author.name}</p>
      <p>
        Code:
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external license URL -->
        <a href={site.licenses.code.href}
          target="_blank"
          rel="noopener noreferrer"
          tabindex="-1"
          class="text-accent hover:text-heading transition-colors"
        >
          {site.licenses.code.label}
        </a>
        <span aria-hidden="true"> • </span>
        Content:
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external license URL -->
        <a href={site.licenses.content.href}
          target="_blank"
          rel="noopener noreferrer"
          tabindex="-1"
          class="text-accent hover:text-heading transition-colors"
        >
          {site.licenses.content.label}
        </a>
        <span> Unless otherwise noted.</span>
      </p>
    </div>
  </footer>
</div>

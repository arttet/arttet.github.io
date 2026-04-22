<script lang="ts">
import { site } from '$shared/config/site';
import { viewport } from '$shared/lib/viewport.svelte';
</script>

<div
  class="fixed bottom-4 left-0 right-0 z-50 flex justify-center transition-transform duration-300 ease-in-out pointer-events-none {viewport.footerVisible
          ? 'translate-y-0'
          : 'translate-y-[calc(100%+1rem)]'}"
>
  <footer class="glass rounded-2xl pointer-events-auto">
    <div class="px-6 h-10 flex items-center gap-3 text-xs text-[--color-text-muted] font-mono">
      <span>© {new Date().getFullYear()} {site.author.name}</span>
    </div>
  </footer>
</div>

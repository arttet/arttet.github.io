import mermaidLib from 'mermaid';
import { browser } from '$app/environment';
import { site } from '$shared/config/site';

export function mermaid(node: HTMLElement, currentTheme: 'dark' | 'light') {
  const init = async (force = false) => {
    const selector = force ? '.mermaid' : '.mermaid:not([data-processed="true"])';
    const diagrams = Array.from(node.querySelectorAll(selector)) as HTMLElement[];
    if (diagrams.length === 0) {
      return;
    }

    // Mermaid stores theme globally, but run() needs it initialized
    mermaidLib.initialize({
      startOnLoad: false,
      theme: currentTheme === 'dark' ? 'dark' : 'neutral',
      maxTextSize: site.mermaid.maxTextSize,
    });

    for (const el of diagrams) {
      if (force && el.dataset.processed === 'true') {
        const content = el.dataset.content;
        if (content) {
          // Restore original source from base64
          el.innerHTML = atob(content);
          el.removeAttribute('data-processed');
          // Important: mermaid.run needs a fresh ID or no ID to avoid conflicts
          el.removeAttribute('id');
        }
      }
    }

    // Filter again after potential restoration
    const toProcess = Array.from(
      node.querySelectorAll('.mermaid:not([data-processed="true"])')
    ) as HTMLElement[];

    if (toProcess.length > 0) {
      await mermaidLib.run({
        nodes: toProcess,
      });
    }
  };

  init();

  return {
    update(newTheme: 'dark' | 'light') {
      if (newTheme !== currentTheme) {
        currentTheme = newTheme;
        // Small delay to ensure CSS variables are updated before mermaid renders
        if (browser) {
          setTimeout(() => init(true), 0);
        } else {
          init(true);
        }
      }
    },
  };
}

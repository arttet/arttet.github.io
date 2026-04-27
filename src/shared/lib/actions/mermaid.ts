import mermaidLib from 'mermaid';
import { browser } from '$app/environment';
import { site } from '$shared/config/site';

let configuredTheme: 'dark' | 'light' | null = null;

function configure(theme: 'dark' | 'light') {
  if (configuredTheme === theme) {
    return;
  }
  mermaidLib.initialize({
    startOnLoad: false,
    theme: theme === 'dark' ? 'dark' : 'neutral',
    maxTextSize: site.mermaid.maxTextSize,
  });
  configuredTheme = theme;
}

function reset(node: HTMLElement) {
  const rendered = node.querySelectorAll<HTMLElement>('.mermaid[data-processed="true"]');
  for (const el of rendered) {
    const content = el.dataset.content;
    if (!content) {
      continue;
    }
    el.innerHTML = atob(content);
    el.removeAttribute('data-processed');
    el.removeAttribute('id');
  }
}

export function mermaid(node: HTMLElement, currentTheme: 'dark' | 'light') {
  const run = async (force = false) => {
    if (force) {
      reset(node);
    }

    const toProcess = Array.from(
      node.querySelectorAll<HTMLElement>('.mermaid:not([data-processed="true"])')
    );
    if (toProcess.length === 0) {
      return;
    }

    configure(currentTheme);
    await mermaidLib.run({ nodes: toProcess });
  };

  run();

  return {
    update(newTheme: 'dark' | 'light') {
      if (newTheme === currentTheme) {
        return;
      }
      currentTheme = newTheme;
      // Small delay to ensure CSS variables are updated before mermaid renders
      if (browser) {
        setTimeout(() => run(true), 0);
      } else {
        run(true);
      }
    },
    destroy() {
      reset(node);
    },
  };
}

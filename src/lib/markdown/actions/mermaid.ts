import { browser } from '$app/environment';
import { site } from '$shared/config/site';

type MermaidLib = (typeof import('mermaid'))['default'];

let mermaidPromise: Promise<MermaidLib> | null = null;
let configuredTheme: 'dark' | 'light' | null = null;

function getMermaid() {
  mermaidPromise ??= import('mermaid').then((mod) => mod.default);
  return mermaidPromise;
}

function configure(mermaidLib: MermaidLib, theme: 'dark' | 'light') {
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

function decodeBase64Utf8(content: string) {
  const bytes = Uint8Array.from(atob(content), (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function reset(node: HTMLElement) {
  const rendered = node.querySelectorAll<HTMLElement>('.mermaid[data-processed="true"]');
  for (const el of rendered) {
    const content = el.dataset.content;
    if (!content) {
      continue;
    }
    el.textContent = decodeBase64Utf8(content);
    el.removeAttribute('data-processed');
    el.removeAttribute('id');
  }
}

export function mermaid(node: HTMLElement, currentTheme: 'dark' | 'light' | null) {
  if (!currentTheme) {
    return { update() {}, destroy() {} };
  }

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

    const mermaidLib = await getMermaid();
    if (!currentTheme) {
      return;
    }
    configure(mermaidLib, currentTheme);
    await mermaidLib.run({ nodes: toProcess });
  };

  run();

  return {
    update(newTheme: 'dark' | 'light' | null) {
      if (!newTheme || newTheme === currentTheme) {
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

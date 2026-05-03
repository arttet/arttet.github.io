async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch (error) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    if (typeof document.execCommand !== 'function') {
      textarea.remove();
      throw error;
    }
    document.execCommand('copy');
    textarea.remove();
  }
}

export function useCopy() {
  let copied = $state(false);
  let error = $state<Error | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function copy(text: string) {
    if (!text) {
      return;
    }

    try {
      await writeClipboard(text);
      copied = true;
      error = null;

      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        copied = false;
      }, 1800);
    } catch (e) {
      copied = false;
      error = e instanceof Error ? e : new Error(String(e));

      console.error('Clipboard copy failed:', error);
    }
  }

  return {
    get copied() {
      return copied;
    },
    get error() {
      return error;
    },
    copy,
  };
}

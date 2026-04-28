export function useCopy() {
  let copied = $state(false);
  let error = $state<Error | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function copy(text: string) {
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
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
      // eslint-disable-next-line no-console
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

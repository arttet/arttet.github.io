export function decodeBase64Utf8(encoded: string): string {
  try {
    const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return atob(encoded);
  }
}

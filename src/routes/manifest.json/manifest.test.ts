// @vitest-environment node
import { describe, expect, it } from 'vitest';

describe('manifest.json generator', () => {
  it('generates a valid web manifest', async () => {
    const { GET } = await import('./+server');
    const response = await GET();
    const data = await response.json();

    expect(data.name).toBe('Artyom Tetyukhin');
    expect(data.short_name).toBe('arttet');
    expect(data.display).toBe('standalone');
    expect(data.icons).toHaveLength(3);

    // Verify all icons have a src (the imported/hashed URL)
    data.icons.forEach((icon: { src: string }) => {
      expect(icon.src).toBeDefined();
      expect(typeof icon.src).toBe('string');
    });

    expect(data.icons[0].sizes).toBe('32x32');
    expect(data.icons[1].sizes).toBe('180x180');
    expect(data.icons[2].type).toBe('image/svg+xml');
  });
});

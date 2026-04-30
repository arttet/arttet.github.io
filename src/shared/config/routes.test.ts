import { describe, expect, it } from 'vitest';
import { BLOG_POST_ROUTE_ID, supportsCodeThemeSettings } from './routes';

describe('route config', () => {
  it('enables code theme settings on post-like routes', () => {
    expect(supportsCodeThemeSettings(BLOG_POST_ROUTE_ID)).toBe(true);
  });

  it('disables code theme settings outside post-like routes', () => {
    expect(supportsCodeThemeSettings('/blog')).toBe(false);
    expect(supportsCodeThemeSettings('/about')).toBe(false);
    expect(supportsCodeThemeSettings(null)).toBe(false);
    expect(supportsCodeThemeSettings(undefined)).toBe(false);
  });
});

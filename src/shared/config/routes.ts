export const BLOG_POST_ROUTE_ID = '/blog/[slug]';

const CODE_THEME_SETTINGS_ROUTE_IDS = new Set<string>([BLOG_POST_ROUTE_ID]);

export function supportsCodeThemeSettings(routeId: string | null | undefined) {
  return routeId ? CODE_THEME_SETTINGS_ROUTE_IDS.has(routeId) : false;
}

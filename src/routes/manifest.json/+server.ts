import { json } from '@sveltejs/kit';
import appleTouchIcon from '$lib/assets/apple-touch-icon.png?url';
import faviconPng from '$lib/assets/icons/favicon.png?url';
import logoSvg from '$lib/assets/icons/logo.svg?url';

export const prerender = true;

export const GET = () => {
  return json({
    name: 'Artyom Tetyukhin',
    short_name: 'arttet',
    description: 'Personal blog and portfolio of Artyom Tetyukhin.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050816',
    theme_color: '#050816',
    icons: [
      {
        src: faviconPng,
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: appleTouchIcon,
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: logoSvg,
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  });
};

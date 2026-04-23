import { extname, join, normalize, resolve } from 'node:path';

const root = resolve('target/build');
const fallbackPath = join(root, '404.html');
const port = Number(process.env.PLAYWRIGHT_PORT ?? '4173');

function safePath(pathname: string): string {
  const sanitized = pathname.replace(/^\/+/, '');
  const normalized = normalize(sanitized);
  return normalized.replace(/^(\.\.(\/|\\|$))+/, '');
}

function candidatePaths(pathname: string): string[] {
  const safe = safePath(decodeURIComponent(pathname));
  const candidates = new Set<string>();

  if (!safe || safe === '.') {
    candidates.add(join(root, 'index.html'));
  } else {
    candidates.add(join(root, safe));

    if (pathname.endsWith('/')) {
      candidates.add(join(root, safe, 'index.html'));
    } else if (!extname(safe)) {
      candidates.add(join(root, safe, 'index.html'));
      candidates.add(join(root, `${safe}.html`));
    }
  }

  return [...candidates];
}

function withinRoot(path: string): boolean {
  return path === root || path.startsWith(`${root}${process.platform === 'win32' ? '\\' : '/'}`);
}

async function pickFile(pathname: string): Promise<Bun.BunFile | null> {
  const files = await Promise.all(
    candidatePaths(pathname).map(async (candidate) => {
      const absolute = resolve(candidate);
      if (!withinRoot(absolute)) {
        return null;
      }

      const file = Bun.file(absolute);
      return (await file.exists()) ? file : null;
    })
  );

  for (const file of files) {
    if (file) {
      return file;
    }
  }

  return null;
}

const server = Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    const file = await pickFile(url.pathname);

    if (file) {
      return new Response(file);
    }

    const fallback = Bun.file(fallbackPath);
    if (await fallback.exists()) {
      return new Response(fallback, { status: 404 });
    }

    return new Response('Not found', { status: 404 });
  },
});

process.stdout.write(`Playwright static server listening on http://localhost:${server.port}\n`);

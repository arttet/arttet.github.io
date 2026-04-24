import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

function parseArgs(argv) {
  const options = {
    out: 'target/infra-pages',
    playwright: [],
    lighthouse: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--out') {
      options.out = argv[++index];
      continue;
    }

    if (arg === '--playwright') {
      options.playwright.push(argv[++index]);
      continue;
    }

    if (arg === '--lighthouse') {
      options.lighthouse.push(argv[++index]);
    }
  }

  return options;
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function copyDirIfExists(source, destination) {
  if (!existsSync(source) || !statSync(source).isDirectory()) {
    return false;
  }

  ensureDir(dirname(destination));
  cpSync(source, destination, { recursive: true });
  return true;
}

function listHtmlFiles(root) {
  const files = [];

  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  }

  if (existsSync(root) && statSync(root).isDirectory()) {
    walk(root);
  }

  return files.toSorted((left, right) => left.localeCompare(right));
}

function toPosixPath(path) {
  return path.split(sep).join('/');
}

function toHref(root, file) {
  return `/${toPosixPath(relative(root, file))}`;
}

const options = parseArgs(process.argv.slice(2));
const outputDir = resolve(options.out);

rmSync(outputDir, { recursive: true, force: true });
ensureDir(outputDir);

const manifest = {
  root: '/',
  playwright: [],
  lighthouse: null,
};

for (const definition of options.playwright) {
  const [targetKey, source] = definition.split('=');
  if (!targetKey || !source) {
    continue;
  }

  const resolvedSource = resolve(source);
  const destination = join(outputDir, 'playwright', targetKey);
  if (!copyDirIfExists(resolvedSource, destination)) {
    continue;
  }

  const entryFile = existsSync(join(destination, 'index.html'))
    ? join(destination, 'index.html')
    : listHtmlFiles(destination)[0];

  manifest.playwright.push({
    targetKey,
    href: entryFile ? toHref(outputDir, entryFile) : `/playwright/${targetKey}/`,
  });
}

for (const source of options.lighthouse) {
  const resolvedSource = resolve(source);
  const destination = join(outputDir, 'lighthouse');
  if (!copyDirIfExists(resolvedSource, destination)) {
    continue;
  }

  const htmlFiles = listHtmlFiles(destination);
  const preferred = htmlFiles.find((file) => file.endsWith('.report.html')) ?? htmlFiles[0];

  manifest.lighthouse = preferred
    ? {
        href: toHref(outputDir, preferred),
      }
    : {
        href: '/lighthouse/',
      };
  break;
}

if (!manifest.playwright.length && !manifest.lighthouse) {
  writeFileSync(join(outputDir, 'links.json'), JSON.stringify(manifest, null, 2));
  process.exit(0);
}

const sections = [];

if (manifest.playwright.length) {
  sections.push(`
    <section>
      <h2>Playwright</h2>
      <ul>
        ${manifest.playwright
          .map((report) => `<li><a href="${report.href}">${report.targetKey}</a></li>`)
          .join('\n')}
      </ul>
    </section>`);
}

if (manifest.lighthouse) {
  sections.push(`
    <section>
      <h2>Lighthouse</h2>
      <ul>
        <li><a href="${manifest.lighthouse.href}">latest report</a></li>
      </ul>
    </section>`);
}

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CI Infra Reports</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: "JetBrains Mono", "Segoe UI", monospace;
        background: #081018;
        color: #d8e2f0;
      }
      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at top, rgba(88, 166, 255, 0.16), transparent 38%),
          linear-gradient(180deg, #09111b 0%, #05080d 100%);
      }
      main {
        max-width: 720px;
        margin: 0 auto;
        padding: 48px 20px 64px;
      }
      h1, h2 {
        margin: 0 0 12px;
      }
      p {
        color: #9db0c7;
      }
      section {
        margin-top: 28px;
        padding: 20px 24px;
        border: 1px solid rgba(157, 176, 199, 0.2);
        border-radius: 18px;
        background: rgba(7, 15, 24, 0.72);
        box-shadow: 0 14px 48px rgba(0, 0, 0, 0.28);
      }
      ul {
        margin: 0;
        padding-left: 20px;
      }
      li + li {
        margin-top: 8px;
      }
      a {
        color: #8cc9ff;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>CI Infra Reports</h1>
      <p>Browsable reports published from GitHub Actions.</p>
      ${sections.join('\n')}
    </main>
  </body>
</html>`;

writeFileSync(join(outputDir, 'index.html'), html);
writeFileSync(join(outputDir, 'links.json'), JSON.stringify(manifest, null, 2));

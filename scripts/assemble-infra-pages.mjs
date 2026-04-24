import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
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
    bundle: [],
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
      continue;
    }

    if (arg === '--bundle') {
      options.bundle.push(argv[++index]);
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

function toPosixPath(path) {
  return path.split(sep).join('/');
}

function toHref(root, file) {
  return `/${toPosixPath(relative(root, file))}`;
}

function listFiles(root, extension) {
  const files = [];

  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = join(current, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  }

  if (existsSync(root) && statSync(root).isDirectory()) {
    walk(root);
  }

  return files.toSorted((left, right) => left.localeCompare(right));
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function normalizeRoutePath(urlValue) {
  if (!urlValue) {
    return '/';
  }

  try {
    const { pathname } = new URL(urlValue);
    if (!pathname || pathname === '/') {
      return '/';
    }

    return pathname.endsWith('/') ? pathname : `${pathname}/`;
  } catch {
    return '/';
  }
}

function routeSlug(routePath) {
  if (routePath === '/') {
    return 'home';
  }

  return routePath
    .replace(/^\/+|\/+$/g, '')
    .replaceAll('/', '-')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function routeLabel(routePath) {
  return routePath;
}

function formatDate(value) {
  if (!value) {
    return 'unknown time';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().replace('.000Z', 'Z');
}

function formatScore(score) {
  if (typeof score !== 'number') {
    return 'n/a';
  }

  return `${Math.round(score * 100)}`;
}

function describeScores(report) {
  const categories = report.categories ?? {};

  return [
    `perf ${formatScore(categories.performance?.score)}`,
    `a11y ${formatScore(categories.accessibility?.score)}`,
    `bp ${formatScore(categories['best-practices']?.score)}`,
    `seo ${formatScore(categories.seo?.score)}`,
  ].join(' • ');
}

function detectPlaywrightMeta(targetKey) {
  const [browser = 'other', device = 'other'] = targetKey.split('-');
  return {
    browser,
    device,
  };
}

const options = parseArgs(process.argv.slice(2));
const outputDir = resolve(options.out);
const prioritizedRoutes = ['/', '/blog/', '/about/'];

rmSync(outputDir, { recursive: true, force: true });
ensureDir(outputDir);

const manifest = {
  root: '/',
  playwright: [],
  lighthouse: null,
  lighthouseTargets: [],
  bundle: null,
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
    : listFiles(destination, '.html')[0];

  const meta = detectPlaywrightMeta(targetKey);
  manifest.playwright.push({
    targetKey,
    browser: meta.browser,
    device: meta.device,
    href: entryFile ? toHref(outputDir, entryFile) : `/playwright/${targetKey}/`,
  });
}

const lighthouseTargets = new Map();

for (const definition of options.lighthouse) {
  const [targetKey, source] = definition.split('=');
  if (!targetKey || !source) {
    continue;
  }

  const resolvedSource = resolve(source);
  if (!existsSync(resolvedSource) || !statSync(resolvedSource).isDirectory()) {
    continue;
  }

  const routes = new Map();

  for (const jsonPath of listFiles(resolvedSource, '.json')) {
    const fileName = jsonPath.split(sep).at(-1) ?? '';
    if (!fileName.startsWith('lhr-')) {
      continue;
    }

    const runId = fileName.replace(/^lhr-/, '').replace(/\.json$/, '');
    const htmlPath = join(dirname(jsonPath), `lhr-${runId}.html`);
    if (!existsSync(htmlPath)) {
      continue;
    }

    const report = JSON.parse(readFileSync(jsonPath, 'utf8'));
    const routePath = normalizeRoutePath(
      report.finalDisplayedUrl ?? report.finalUrl ?? report.requestedUrl
    );
    const slug = routeSlug(routePath);
    const destinationDir = join(outputDir, 'lighthouse', targetKey, slug, runId);

    ensureDir(destinationDir);
    copyFileSync(htmlPath, join(destinationDir, 'index.html'));
    copyFileSync(jsonPath, join(destinationDir, 'report.json'));

    const routeEntry = routes.get(routePath) ?? {
      route: routePath,
      slug,
      latestHref: '',
      runs: [],
    };

    routeEntry.runs.push({
      runId,
      fetchTime: report.fetchTime ?? '',
      href: toHref(outputDir, join(destinationDir, 'index.html')),
      scores: describeScores(report),
    });

    routes.set(routePath, routeEntry);
  }

  const sortedRoutes = [...routes.values()]
    .map((entry) => {
      entry.runs = entry.runs.toSorted((left, right) => right.runId.localeCompare(left.runId));
      return entry;
    })
    .toSorted((left, right) => {
      const leftPriority = prioritizedRoutes.indexOf(left.route);
      const rightPriority = prioritizedRoutes.indexOf(right.route);

      if (leftPriority !== -1 || rightPriority !== -1) {
        return (
          (leftPriority === -1 ? Number.MAX_SAFE_INTEGER : leftPriority) -
          (rightPriority === -1 ? Number.MAX_SAFE_INTEGER : rightPriority)
        );
      }

      return left.route.localeCompare(right.route);
    })
    .map((entry) => {
      entry.latestHref = entry.runs[0]?.href ?? '';
      return entry;
    });

  const [browser = 'other', device = 'other'] = targetKey.split('-');
  lighthouseTargets.set(targetKey, {
    targetKey,
    browser,
    device,
    routes: sortedRoutes,
  });
}

manifest.lighthouseTargets = ['chrome-desktop', 'chrome-mobile']
  .map((targetKey) => lighthouseTargets.get(targetKey))
  .filter(Boolean);
manifest.lighthouse = manifest.lighthouseTargets[0]?.routes[0]?.runs[0]
  ? { href: manifest.lighthouseTargets[0].routes[0].runs[0].href }
  : null;

for (const source of options.bundle) {
  const resolvedSource = resolve(source);
  if (!existsSync(resolvedSource) || !statSync(resolvedSource).isDirectory()) {
    continue;
  }

  const destination = join(outputDir, 'bundle');
  if (!copyDirIfExists(resolvedSource, destination)) {
    continue;
  }

  const summaryJsonPath = join(destination, 'summary.json');
  const summaryMdPath = join(destination, 'summary.md');
  const statsHtmlPath = join(destination, 'stats.html');

  let report = null;

  if (existsSync(summaryJsonPath)) {
    report = JSON.parse(readFileSync(summaryJsonPath, 'utf8'));
  }

  manifest.bundle = {
    href: existsSync(statsHtmlPath) ? toHref(outputDir, statsHtmlPath) : '/bundle/',
    summaryHref: existsSync(summaryMdPath) ? toHref(outputDir, summaryMdPath) : '',
    status: report?.comparison?.failures?.length ? 'fail' : 'pass',
    hasBaseline: Boolean(report?.hasBaseline),
    failures: report?.comparison?.failures ?? [],
    totals: report?.summary?.totals ?? null,
    largestJsChunk: report?.summary?.largestJsChunk ?? null,
    threshold: report?.threshold ?? null,
  };
  break;
}

const playwrightCells = new Map(manifest.playwright.map((report) => [report.targetKey, report]));
const playwrightRows = [
  {
    browser: 'chrome',
    label: 'Chrome',
    cells: ['chrome-desktop', 'chrome-mobile'],
  },
  {
    browser: 'firefox',
    label: 'Firefox',
    cells: ['firefox-desktop', 'firefox-mobile'],
  },
];

const playwrightTable = manifest.playwright.length
  ? `
    <section>
      <h2>Playwright Matrix</h2>
      <table>
        <thead>
          <tr>
            <th>Browser</th>
            <th>Desktop</th>
            <th>Mobile</th>
          </tr>
        </thead>
        <tbody>
          ${playwrightRows
            .map(
              (row) => `
            <tr>
              <th scope="row">${row.label}</th>
              ${row.cells
                .map((targetKey) => {
                  const report = playwrightCells.get(targetKey);
                  return report
                    ? `<td><a href="${report.href}">${targetKey}</a></td>`
                    : '<td><span class="muted">not published</span></td>';
                })
                .join('')}
            </tr>`
            )
            .join('\n')}
        </tbody>
      </table>
    </section>`
  : `
    <section>
      <h2>Playwright Matrix</h2>
      <p class="muted">No Playwright reports were published for this run.</p>
    </section>`;

const lighthouseCells = new Map(
  manifest.lighthouseTargets.map((target) => [target.targetKey, target])
);
const lighthouseSection = manifest.lighthouseTargets.length
  ? `
    <section>
      <h2>Lighthouse Matrix</h2>
      <table>
        <thead>
          <tr>
            <th>Browser</th>
            <th>Desktop</th>
            <th>Mobile</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Chrome</th>
            ${['chrome-desktop', 'chrome-mobile']
              .map((targetKey) => {
                const target = lighthouseCells.get(targetKey);
                if (!target) {
                  return '<td><span class="muted">not published</span></td>';
                }

                return `<td><a href="${target.routes[0]?.latestHref ?? '#'}">${targetKey}</a></td>`;
              })
              .join('')}
          </tr>
        </tbody>
      </table>
      ${manifest.lighthouseTargets
        .map(
          (target) => `
        <div class="route-block">
          <h3>${escapeHtml(target.targetKey)}</h3>
          <div class="route-grid">
            ${target.routes
              .map(
                (routeEntry) => `
              <article class="route-card">
                <h4>${escapeHtml(routeLabel(routeEntry.route))}</h4>
                <ul>
                  ${routeEntry.runs
                    .map(
                      (run) => `
                    <li>
                      <a href="${run.href}">${escapeHtml(run.runId)}</a>
                      <span>${escapeHtml(formatDate(run.fetchTime))}</span>
                      <span>${escapeHtml(run.scores)}</span>
                    </li>`
                    )
                    .join('\n')}
                </ul>
              </article>`
              )
              .join('\n')}
          </div>
        </div>`
        )
        .join('\n')}
    </section>`
  : `
    <section>
      <h2>Lighthouse Matrix</h2>
      <p class="muted">No Lighthouse reports were published for this run.</p>
    </section>`;

function formatKiB(bytes) {
  if (typeof bytes !== 'number') {
    return 'n/a';
  }

  return `${(bytes / 1024).toFixed(2)} KiB`;
}

const bundleSection = manifest.bundle
  ? `
    <section>
      <h2>Bundle Budget</h2>
      <p class="${manifest.bundle.status === 'fail' ? 'status-fail' : 'status-pass'}">
        ${manifest.bundle.status === 'fail' ? 'Budget exceeded' : 'Within budget'}
      </p>
      <dl class="metrics">
        <div>
          <dt>Total JS gzip</dt>
          <dd>${formatKiB(manifest.bundle.totals?.js?.gzipLength)}</dd>
        </div>
        <div>
          <dt>Total JS rendered</dt>
          <dd>${formatKiB(manifest.bundle.totals?.js?.renderedLength)}</dd>
        </div>
        <div>
          <dt>Largest JS chunk gzip</dt>
          <dd>${formatKiB(manifest.bundle.largestJsChunk?.gzipLength)}</dd>
        </div>
        <div>
          <dt>Threshold</dt>
          <dd>${typeof manifest.bundle.threshold === 'number' ? `${(manifest.bundle.threshold * 100).toFixed(0)}%` : 'n/a'}</dd>
        </div>
      </dl>
      <p>
        <a href="${manifest.bundle.href}">Open visualizer</a>
        ${manifest.bundle.summaryHref ? ` · <a href="${manifest.bundle.summaryHref}">Open summary</a>` : ''}
      </p>
      ${
        manifest.bundle.failures.length
          ? `<ul>${manifest.bundle.failures
              .map((failure) => `<li>${escapeHtml(failure)}</li>`)
              .join('')}</ul>`
          : '<p class="muted">No bundle budget failures detected.</p>'
      }
    </section>`
  : `
    <section>
      <h2>Bundle Budget</h2>
      <p class="muted">No bundle report was published for this run.</p>
    </section>`;

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
        max-width: 1080px;
        margin: 0 auto;
        padding: 48px 20px 64px;
      }
      h1, h2, h3, h4 {
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
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        padding: 12px 10px;
        border-bottom: 1px solid rgba(157, 176, 199, 0.14);
        text-align: left;
        vertical-align: top;
      }
      td a, li a {
        color: #8cc9ff;
      }
      .route-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
      }
      .route-block {
        margin-top: 20px;
      }
      .route-card {
        padding: 18px;
        border-radius: 16px;
        background: rgba(9, 20, 33, 0.72);
        border: 1px solid rgba(157, 176, 199, 0.14);
      }
      ul {
        margin: 0;
        padding-left: 18px;
      }
      li + li {
        margin-top: 10px;
      }
      li span {
        display: block;
        margin-top: 4px;
        color: #9db0c7;
        font-size: 0.92rem;
      }
      .muted {
        color: #9db0c7;
      }
      .metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
        margin: 18px 0;
      }
      .metrics div {
        padding: 14px;
        border-radius: 14px;
        background: rgba(9, 20, 33, 0.72);
        border: 1px solid rgba(157, 176, 199, 0.14);
      }
      .metrics dt {
        color: #9db0c7;
        font-size: 0.92rem;
      }
      .metrics dd {
        margin: 8px 0 0;
        font-size: 1.05rem;
      }
      .status-pass {
        color: #9af7c3;
      }
      .status-fail {
        color: #ff9aa8;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>CI Infra Reports</h1>
      <p>Browsable reports published from GitHub Actions.</p>
      ${playwrightTable}
      ${lighthouseSection}
      ${bundleSection}
    </main>
  </body>
</html>`;

writeFileSync(join(outputDir, 'index.html'), html);
writeFileSync(join(outputDir, 'links.json'), JSON.stringify(manifest, null, 2));

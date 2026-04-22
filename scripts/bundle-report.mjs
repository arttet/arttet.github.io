#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

function parseArgs(argv) {
  const positionals = [];
  const options = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      positionals.push(arg);
      continue;
    }

    const [key, inlineValue] = arg.slice(2).split('=', 2);
    if (inlineValue !== undefined) {
      options[key] = inlineValue;
      continue;
    }

    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      options[key] = 'true';
      continue;
    }

    options[key] = next;
    i += 1;
  }

  return { positionals, options };
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeText(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value);
}

function detectType(file) {
  if (file.endsWith('.js')) {
    return 'js';
  }
  if (file.endsWith('.css')) {
    return 'css';
  }
  return 'other';
}

function formatKiB(bytes) {
  return `${(bytes / 1024).toFixed(2)} KiB`;
}

function formatPercent(delta) {
  const sign = delta > 0 ? '+' : '';
  return `${sign}${(delta * 100).toFixed(1)}%`;
}

function collectChunks(stats) {
  const chunks = new Map();

  for (const meta of Object.values(stats.nodeMetas ?? {})) {
    for (const [file, partUid] of Object.entries(meta.moduleParts ?? {})) {
      const part = stats.nodeParts?.[partUid];
      if (!part) {
        continue;
      }

      const existing = chunks.get(file) ?? {
        file,
        type: detectType(file),
        renderedLength: 0,
        gzipLength: 0,
        brotliLength: 0,
      };

      existing.renderedLength += part.renderedLength ?? 0;
      existing.gzipLength += part.gzipLength ?? 0;
      existing.brotliLength += part.brotliLength ?? 0;

      chunks.set(file, existing);
    }
  }

  return [...chunks.values()]
    .filter((chunk) => chunk.renderedLength > 0)
    .toSorted((a, b) => b.gzipLength - a.gzipLength || b.renderedLength - a.renderedLength);
}

function sumChunks(chunks) {
  return chunks.reduce(
    (acc, chunk) => {
      acc.renderedLength += chunk.renderedLength;
      acc.gzipLength += chunk.gzipLength;
      acc.count += 1;
      return acc;
    },
    { renderedLength: 0, gzipLength: 0, count: 0 }
  );
}

function buildSummary(statsPath) {
  const stats = readJson(statsPath);
  const chunks = collectChunks(stats);
  const jsChunks = chunks.filter((chunk) => chunk.type === 'js');

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    statsPath: statsPath.replace(/\\/g, '/'),
    totals: {
      all: sumChunks(chunks),
      js: sumChunks(jsChunks),
    },
    largestJsChunk: jsChunks[0] ?? null,
    topJsChunks: jsChunks.slice(0, 10),
    trackedChunks: chunks.slice(0, 20).map((chunk) => ({
      file: chunk.file,
      type: chunk.type,
      renderedLength: chunk.renderedLength,
      gzipLength: chunk.gzipLength,
    })),
  };
}

function compareMetric(label, current, baseline, threshold, failures) {
  if (!baseline || baseline <= 0) {
    return null;
  }

  const delta = (current - baseline) / baseline;
  if (delta > threshold) {
    failures.push(
      `${label} grew by ${formatPercent(delta)} (${formatKiB(current)} vs ${formatKiB(baseline)})`
    );
  }

  return delta;
}

function compareWithBaseline(summary, baseline, threshold) {
  const failures = [];
  const deltas = {};

  deltas.totalJsGzip = compareMetric(
    'Total JS gzip',
    summary.totals.js.gzipLength,
    baseline?.totals?.js?.gzipLength,
    threshold,
    failures
  );
  deltas.totalJsRendered = compareMetric(
    'Total JS rendered',
    summary.totals.js.renderedLength,
    baseline?.totals?.js?.renderedLength,
    threshold,
    failures
  );
  deltas.largestJsChunkGzip = compareMetric(
    'Largest JS chunk gzip',
    summary.largestJsChunk?.gzipLength ?? 0,
    baseline?.largestJsChunk?.gzipLength,
    threshold,
    failures
  );

  const currentChunks = new Map(summary.trackedChunks.map((chunk) => [chunk.file, chunk]));
  for (const chunk of baseline?.trackedChunks ?? []) {
    const current = currentChunks.get(chunk.file);
    if (!current) {
      continue;
    }

    compareMetric(
      `Chunk ${chunk.file} gzip`,
      current.gzipLength,
      chunk.gzipLength,
      threshold,
      failures
    );
  }

  return { failures, deltas };
}

function deltaForChunk(chunk, baselineMap) {
  const baseline = baselineMap.get(chunk.file);
  if (!baseline || baseline.gzipLength <= 0) {
    return 'new';
  }

  return formatPercent((chunk.gzipLength - baseline.gzipLength) / baseline.gzipLength);
}

function toMarkdown(summary, baseline, comparison, threshold) {
  const baselineMap = new Map((baseline?.trackedChunks ?? []).map((chunk) => [chunk.file, chunk]));
  const lines = [
    '# Bundle Report',
    '',
    `Threshold: ${(threshold * 100).toFixed(0)}% over baseline`,
    '',
    '| Metric | Current | Baseline | Delta |',
    '| --- | ---: | ---: | ---: |',
    `| Total JS gzip | ${formatKiB(summary.totals.js.gzipLength)} | ${baseline ? formatKiB(baseline.totals.js.gzipLength) : 'n/a'} | ${comparison.deltas.totalJsGzip == null ? 'n/a' : formatPercent(comparison.deltas.totalJsGzip)} |`,
    `| Total JS rendered | ${formatKiB(summary.totals.js.renderedLength)} | ${baseline ? formatKiB(baseline.totals.js.renderedLength) : 'n/a'} | ${comparison.deltas.totalJsRendered == null ? 'n/a' : formatPercent(comparison.deltas.totalJsRendered)} |`,
    `| Largest JS chunk gzip | ${summary.largestJsChunk ? formatKiB(summary.largestJsChunk.gzipLength) : 'n/a'} | ${baseline?.largestJsChunk ? formatKiB(baseline.largestJsChunk.gzipLength) : 'n/a'} | ${comparison.deltas.largestJsChunkGzip == null ? 'n/a' : formatPercent(comparison.deltas.largestJsChunkGzip)} |`,
    '',
    '## Top JS Chunks',
    '',
    '| Chunk | Gzip | Rendered | Delta vs baseline |',
    '| --- | ---: | ---: | ---: |',
    ...summary.topJsChunks.map(
      (chunk) =>
        `| \`${chunk.file}\` | ${formatKiB(chunk.gzipLength)} | ${formatKiB(chunk.renderedLength)} | ${deltaForChunk(chunk, baselineMap)} |`
    ),
  ];

  if (comparison.failures.length > 0) {
    lines.push('', '## Budget Failures', '');
    for (const failure of comparison.failures) {
      lines.push(`- ${failure}`);
    }
  } else {
    lines.push('', '## Budget', '', 'Within threshold.');
  }

  return `${lines.join('\n')}\n`;
}

const { positionals, options } = parseArgs(process.argv.slice(2));
const command = positionals[0] ?? 'check';
const statsPath = resolve(options.stats ?? 'target/bundle/stats.json');
const baselinePath = resolve(options.baseline ?? 'misc/bundle-baseline.json');
const summaryPath = options.summary ? resolve(options.summary) : null;
const jsonPath = options.json ? resolve(options.json) : null;
const threshold = Number.parseFloat(options.threshold ?? '0.3');
const shouldFail = options.fail !== 'false';

const summary = buildSummary(statsPath);

if (command === 'baseline') {
  writeText(baselinePath, `${JSON.stringify(summary, null, 2)}\n`);
  process.stdout.write(`Wrote baseline to ${baselinePath}\n`);
  process.exit(0);
}

const baseline = (() => {
  try {
    return readJson(baselinePath);
  } catch {
    return null;
  }
})();

const comparison = compareWithBaseline(summary, baseline, threshold);
const markdown = toMarkdown(summary, baseline, comparison, threshold);

if (summaryPath) {
  writeText(summaryPath, markdown);
}

if (jsonPath) {
  writeText(
    jsonPath,
    `${JSON.stringify({ summary, threshold, comparison, hasBaseline: Boolean(baseline) }, null, 2)}\n`
  );
}

if (process.env.GITHUB_STEP_SUMMARY) {
  writeText(process.env.GITHUB_STEP_SUMMARY, markdown);
}

process.stdout.write(markdown);

if (shouldFail && comparison.failures.length > 0) {
  process.exit(1);
}

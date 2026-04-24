import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

function parseArgs(argv) {
  const options = {
    target: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--target') {
      options.target = argv[++index] ?? '';
    }
  }

  return options;
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const { target } = parseArgs(process.argv.slice(2));

if (!target) {
  throw new Error('Missing required --target option.');
}

const config = JSON.parse(readFileSync(resolve('.lighthouserc.json'), 'utf8'));
const workDir = resolve(`target/lighthouse-${target}`);
const buildDir = resolve('target/build');
const isDesktop = target === 'chrome-desktop';

rmSync(workDir, { recursive: true, force: true });
mkdirSync(workDir, { recursive: true });

config.ci.collect.staticDistDir = buildDir;
config.ci.collect.settings ??= {};

if (isDesktop) {
  config.ci.collect.settings.preset = 'desktop';
} else {
  delete config.ci.collect.settings.preset;
}

writeFileSync(resolve(workDir, 'lighthouserc.json'), `${JSON.stringify(config, null, 2)}\n`);

run('bunx', ['lhci', 'collect', '--config=./lighthouserc.json'], workDir);
run('bunx', ['lhci', 'assert', '--config=./lighthouserc.json'], workDir);

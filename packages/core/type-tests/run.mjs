#!/usr/bin/env node
/**
 * T-types: type-checks the apps' setups against the packed package, the way the apps install it.
 *
 * Usage: node type-tests/run.mjs [--keep] [fixture...]   (from packages/core, after `npm run build`)
 *
 * Packs @teact/core, copies each fixture of this directory (default: all) to a temporary directory outside the
 * workspace and installs the tarball there with `--no-workspaces`, next to the fixture's own TypeScript and
 * @types/react, so that npm cannot hand it the workspace's versions. Then, in each fixture:
 *   - `tsc -p tsconfig.json`: the app type-checks with `skipLibCheck: true`, as both apps do;
 *   - `tsc -p tsconfig.lib-check.json`: with `skipLibCheck: false`, no error is reported in the package's own
 *     declaration files. Errors in other packages' files are listed but not counted: @types/react reports the
 *     conflict between its `ref` and Teact's (src/jsx.d.ts), which is why the apps need `skipLibCheck: true`.
 * `--keep` keeps the temporary directory. Exits with 1 when a check fails.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import {
  cpSync, mkdtempSync, readdirSync, rmSync, statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPE_TESTS_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_DIR = resolve(TYPE_TESTS_DIR, '..');
const OWN_DECLARATIONS = 'node_modules/@teact/core/';
const DIAGNOSTIC_RE = /^(.+?)\(\d+,\d+\): error (TS\d+): /;

const args = process.argv.slice(2);
const keep = args.includes('--keep');
const allFixtures = readdirSync(TYPE_TESTS_DIR).filter((name) => statSync(join(TYPE_TESTS_DIR, name)).isDirectory());
const fixtures = args.filter((arg) => !arg.startsWith('--'));
const unknown = fixtures.filter((name) => !allFixtures.includes(name));
if (unknown.length) {
  console.error(`Unknown fixtures: ${unknown.join(', ')}. Available: ${allFixtures.join(', ')}`);
  process.exit(2);
}

function run(command, commandArgs, cwd) {
  return spawnSync(command, commandArgs, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function tsc(cwd, ...tscArgs) {
  const result = run(process.execPath, ['node_modules/typescript/bin/tsc', ...tscArgs], cwd);
  return { status: result.status, output: `${result.stdout}${result.stderr}`.trim() };
}

const tempDir = mkdtempSync(join(tmpdir(), 'teact-type-tests-'));
let failed = false;

try {
  const [{ filename }] = JSON.parse(execFileSync('npm', ['pack', '--json', '--pack-destination', tempDir], {
    cwd: PACKAGE_DIR, encoding: 'utf8',
  }));
  const tarball = join(tempDir, filename);
  console.log(`Packed ${filename} into ${tempDir}`);

  for (const fixture of fixtures.length ? fixtures : allFixtures) {
    const dir = join(tempDir, fixture);
    cpSync(join(TYPE_TESTS_DIR, fixture), dir, { recursive: true });

    const install = run('npm', [
      'install', '--no-workspaces', '--no-audit', '--no-fund', '--ignore-scripts', '--loglevel=error', tarball,
    ], dir);
    if (install.status !== 0) {
      console.error(`\n${fixture}: npm install failed\n${install.stdout}${install.stderr}`);
      failed = true;
      continue;
    }

    const version = tsc(dir, '--version').output;
    console.log(`\n${fixture} (TypeScript ${version.replace(/^Version /, '')})`);

    const app = tsc(dir, '-p', 'tsconfig.json', '--pretty', 'false');
    if (app.status === 0) {
      console.log('  ok    tsconfig.json');
    } else {
      console.log(`  FAIL  tsconfig.json\n${app.output.replace(/^/gm, '        ')}`);
      failed = true;
    }

    const libCheck = tsc(dir, '-p', 'tsconfig.lib-check.json', '--pretty', 'false');
    const diagnostics = libCheck.output.split('\n')
      .map((line) => line.match(DIAGNOSTIC_RE))
      .filter(Boolean)
      .map(([line, file, code]) => ({ line, file, code }));
    const own = diagnostics.filter(({ file }) => file.startsWith(OWN_DECLARATIONS));
    const others = [...new Set(diagnostics.filter((diagnostic) => !own.includes(diagnostic))
      .map(({ file, code }) => `${code} in ${file}`))];

    if (own.length) {
      console.log(`  FAIL  tsconfig.lib-check.json: errors in the package's declarations\n${
        own.map(({ line }) => `        ${line}`).join('\n')}`);
      failed = true;
    } else if (libCheck.status !== 0 && !diagnostics.length) {
      console.log(`  FAIL  tsconfig.lib-check.json\n${libCheck.output.replace(/^/gm, '        ')}`);
      failed = true;
    } else {
      const elsewhere = others.length ? `; elsewhere: ${others.join(', ')}` : '';
      console.log(`  ok    tsconfig.lib-check.json (no skipLibCheck): no errors in ${OWN_DECLARATIONS}${elsewhere}`);
    }
  }
} finally {
  if (keep) {
    console.log(`\nKept ${tempDir}`);
  } else {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

process.exit(failed ? 1 : 0);

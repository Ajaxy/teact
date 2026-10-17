#!/usr/bin/env node
/**
 * Assembles the GitHub Pages site in site/dist (`npm run build:site` builds the parts first):
 *
 *   /                                         site/public (the landing page)
 *   /demo/                                    demo/dist
 *   /benchmark/                               benchmark/dist
 *   /Fasterdom-Optimized-Browser-Rendering/   docs/Fasterdom-Optimized-Browser-Rendering, byte for byte
 *
 * These are the paths that the legacy Pages build serves from docs/ today, so the URLs stay the same. The article is
 * copied from docs/ while docs/ still serves Pages; once .github/workflows/pages.yml deploys the site, it moves to
 * site/public and docs/demo and docs/benchmark are deleted.
 */
import { createHash } from 'node:crypto';
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SITE_DIR, '..');
const OUT_DIR = join(SITE_DIR, 'dist');

const PARTS = [
  { from: 'site/public', to: '.' },
  { from: 'demo/dist', to: 'demo', build: 'npm run build -w teact-demo' },
  { from: 'benchmark/dist', to: 'benchmark', build: 'npm run build -w teact-benchmark' },
  { from: 'docs/Fasterdom-Optimized-Browser-Rendering', to: 'Fasterdom-Optimized-Browser-Rendering', verbatim: true },
];

rmSync(OUT_DIR, { recursive: true, force: true });

for (const { from, to, build, verbatim } of PARTS) {
  const source = join(ROOT, from);
  if (!existsSync(source)) {
    console.error(`${from} does not exist${build ? `: run \`${build}\` first` : ''}`);
    process.exit(1);
  }

  const target = join(OUT_DIR, to);
  cpSync(source, target, { recursive: true });

  if (verbatim) {
    checkIdentical(source, target);
  }

  console.log(`${from} -> site/dist/${to === '.' ? '' : `${to}/`} (${listFiles(target).length} files)`);
}

function checkIdentical(source, target) {
  const sourceFiles = listFiles(source);
  const targetFiles = listFiles(target);
  if (sourceFiles.join('\n') !== targetFiles.join('\n')) {
    console.error(`${relative(ROOT, target)} does not have the same files as ${relative(ROOT, source)}`);
    process.exit(1);
  }

  for (const file of sourceFiles) {
    if (hashFile(join(source, file)) !== hashFile(join(target, file))) {
      console.error(`${relative(ROOT, join(target, file))} differs from ${relative(ROOT, join(source, file))}`);
      process.exit(1);
    }
  }
}

function listFiles(dir, prefix = '') {
  return readdirSync(dir).sort().flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path, `${prefix}${name}/`) : [`${prefix}${name}`];
  });
}

function hashFile(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

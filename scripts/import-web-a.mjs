#!/usr/bin/env node
/**
 * Imports Teact from a Telegram Web A (Ajaxy/telegram-tt) checkout.
 *
 * Usage: node scripts/import-web-a.mjs <web-a-checkout> <sha>
 *
 * Copies every file of the closure below, byte for byte, from `<sha>:src/<path>` to
 * `packages/core/src/<path>`, checks that the copied files import nothing outside the closure
 * and the boundary modules, and rewrites `packages/core/UPSTREAM`. Files that leave the closure
 * are not deleted.
 *
 * Of an existing UPSTREAM, the `mtw` entry is kept, and so is the `private` entry (the commit in
 * the private Ajaxy/telegram-t whose closure is byte-identical) when `<sha>` is unchanged.
 * Files that no longer match the blob recorded in UPSTREAM carry local patches; the copy
 * overwrites them, and the script lists them so that they can be re-applied.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE_DIR = join(ROOT, 'packages/core');
const UPSTREAM_FILE = join(PACKAGE_DIR, 'UPSTREAM');
const UPSTREAM_REPO = 'Ajaxy/telegram-tt';

// Everything reachable through relative imports from `src/lib/teact/*` and `src/lib/fasterdom/fasterdom.ts`
// in Web A, relative to `src/`. The traversal stops at BOUNDARY.
const CLOSURE = [
  'lib/teact/teact.ts',
  'lib/teact/teact-dom.ts',
  'lib/teact/teactn.tsx',
  'lib/teact/dom-events.ts',
  'lib/teact/heavyAnimation.ts',
  'lib/teact/jsx-runtime.ts',
  'lib/teact/jsx-dev-runtime.ts',
  'lib/fasterdom/fasterdom.ts',
  'lib/fasterdom/stricterdom.ts',
  'lib/fasterdom/layoutCauses.ts',
  'util/Deferred.ts',
  'util/areShallowEqual.ts',
  'util/callbacks.ts',
  'util/debugOverlay.ts',
  'util/generateUniqueId.ts',
  'util/iteratees.ts',
  'util/safeExec.ts',
  'util/schedulers.ts',
  'util/signals.ts',
  'hooks/useForceUpdate.ts',
  'hooks/useUniqueId.ts',
];

// App modules the closure imports. The package replaces them with its own modules, so they are not copied.
const BOUNDARY = [
  'config.ts',
  'util/handleError.ts',
];

// Bare specifiers the closure may import (type-only).
const ALLOWED_EXTERNALS = new Set(['react']);

const IMPORT_RE = /(?:^|[;\n])\s*(?:import|export)\s(?:[^'";]*?\sfrom\s)?\s*'([^']+)'/g;
const RESOLVE_SUFFIXES = ['', '.ts', '.tsx', '/index.ts'];

function git(checkout, args, encoding = 'utf8') {
  return execFileSync('git', ['-C', checkout, ...args], { encoding, maxBuffer: 64 * 1024 * 1024 });
}

function hashBlob(content) {
  return createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex');
}

function findImportProblems(path, source) {
  const known = new Set([...CLOSURE, ...BOUNDARY]);
  const problems = [];

  for (const [, specifier] of source.matchAll(IMPORT_RE)) {
    if (!specifier.startsWith('.')) {
      if (!ALLOWED_EXTERNALS.has(specifier)) {
        problems.push(`${path}: unexpected package import '${specifier}'`);
      }
      continue;
    }

    const target = posix.normalize(posix.join(posix.dirname(path), specifier));
    if (!RESOLVE_SUFFIXES.some((suffix) => known.has(target + suffix))) {
      problems.push(`${path}: imports '${specifier}', which is outside the closure`);
    }
  }

  return problems;
}

function main() {
  const [checkout, sha] = process.argv.slice(2);
  if (!checkout || !sha) {
    console.error('Usage: node scripts/import-web-a.mjs <web-a-checkout> <sha>');
    process.exit(2);
  }

  const fullSha = git(checkout, ['rev-parse', '--verify', `${sha}^{commit}`]).trim();
  const previous = existsSync(UPSTREAM_FILE) ? JSON.parse(readFileSync(UPSTREAM_FILE, 'utf8')) : {};
  const files = {};
  const problems = [];
  const overwrittenPatches = [];

  for (const path of CLOSURE) {
    const upstreamPath = `src/${path}`;
    const libPath = `src/${path}`;
    const blob = git(checkout, ['rev-parse', '--verify', `${fullSha}:${upstreamPath}`]).trim();
    const content = git(checkout, ['cat-file', 'blob', blob], 'buffer');

    const target = join(PACKAGE_DIR, libPath);
    const recordedBlob = previous.files?.[libPath]?.blob;
    if (recordedBlob && existsSync(target) && hashBlob(readFileSync(target)) !== recordedBlob) {
      overwrittenPatches.push(libPath);
    }

    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);

    files[libPath] = { upstreamPath, blob };
    problems.push(...findImportProblems(path, content.toString('utf8')));
  }

  const keepsPrivate = previous.private && previous.sha === fullSha;
  const upstream = {
    repo: UPSTREAM_REPO,
    sha: fullSha,
    importedAt: new Date().toISOString().slice(0, 10),
    ...(keepsPrivate && { private: previous.private }),
    files,
    ...(previous.mtw && { mtw: previous.mtw }),
  };
  writeFileSync(UPSTREAM_FILE, `${JSON.stringify(upstream, undefined, 2)}\n`);

  console.log(`Imported ${CLOSURE.length} files from ${UPSTREAM_REPO}@${fullSha}`);

  if (previous.private && !keepsPrivate) {
    console.warn(`\nDropped the private baseline ${previous.private.repo}@${previous.private.sha}, which matched `
      + `${previous.sha}. Add the ${previous.private.repo} commit whose closure matches ${fullSha} to UPSTREAM `
      + 'as `private`; scripts/upstream-check.mjs checks that it does.');
  }

  if (overwrittenPatches.length) {
    console.warn('\nThese files had local patches, which the import overwrote. '
      + `\`git diff\` shows what was reverted; re-apply it:\n  ${overwrittenPatches.join('\n  ')}`);
  }

  if (problems.length) {
    console.error(`\nThe closure has changed upstream; update CLOSURE or BOUNDARY:\n  ${problems.join('\n  ')}`);
    process.exit(1);
  }
}

main();

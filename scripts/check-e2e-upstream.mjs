#!/usr/bin/env node
/**
 * Checks that Telegram Web A's test components in `e2e/src/components/test` are still verbatim.
 *
 * Usage: node scripts/check-e2e-upstream.mjs
 *
 * `e2e/UPSTREAM` records the Web A commit they were copied from and each file's git blob hash. The check fails when
 * a file differs from its recorded blob (for example after an `eslint --fix`), when a recorded file is missing, or
 * when the directory has a file that UPSTREAM does not list. To take a newer version from Web A, copy the file
 * unchanged and update its blob and the commit in UPSTREAM; test-only components belong in `e2e/src/fixtures`.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const E2E_DIR = join(ROOT, 'e2e');
const UPSTREAM_FILE = join(E2E_DIR, 'UPSTREAM');
const VENDORED_DIR = 'src/components/test';

// The same hash as `git hash-object <file>`
function getBlobHash(content) {
  return createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex');
}

const upstream = JSON.parse(readFileSync(UPSTREAM_FILE, 'utf8'));
const recorded = new Map(Object.entries(upstream.files));
const problems = [];

for (const [path, { blob }] of recorded) {
  let content;
  try {
    content = readFileSync(join(E2E_DIR, path));
  } catch {
    problems.push(`e2e/${path} is missing`);
    continue;
  }

  const actual = getBlobHash(content);
  if (actual !== blob) {
    problems.push(`e2e/${path} differs from ${upstream.repo}@${upstream.sha.slice(0, 9)} (blob ${actual}, `
      + `expected ${blob})`);
  }
}

for (const entry of readdirSync(join(E2E_DIR, VENDORED_DIR), { recursive: true, withFileTypes: true })) {
  if (!entry.isFile()) continue;

  const path = join(entry.parentPath, entry.name).slice(E2E_DIR.length + 1).replaceAll('\\', '/');
  if (!recorded.has(path)) {
    problems.push(`e2e/${path} is not listed in e2e/UPSTREAM`);
  }
}

if (problems.length) {
  console.error(`Web A's test components in e2e/${VENDORED_DIR} must stay verbatim:`);
  problems.forEach((problem) => console.error(`  - ${problem}`));
  console.error('Revert the change, or copy the file from Web A unchanged and record its blob in e2e/UPSTREAM.');
  process.exit(1);
}

console.log(`${recorded.size} files in e2e/${VENDORED_DIR} match ${upstream.repo}@${upstream.sha.slice(0, 9)}`);

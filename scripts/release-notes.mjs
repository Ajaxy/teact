#!/usr/bin/env node
/**
 * Prints the changelog entry of a @teact/core version, for its GitHub Release.
 *
 * Usage: node scripts/release-notes.mjs <version>
 *
 * The entry is the section under `## <version>` in packages/core/CHANGELOG.md, which `changeset version` writes.
 * Exits with 1 when the changelog has no such section.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHANGELOG = join(ROOT, 'packages/core/CHANGELOG.md');

const [version] = process.argv.slice(2);
if (!version) {
  console.error('Usage: node scripts/release-notes.mjs <version>');
  process.exit(2);
}

const lines = readFileSync(CHANGELOG, 'utf8').split('\n');
const start = lines.indexOf(`## ${version}`);
if (start === -1) {
  console.error(`packages/core/CHANGELOG.md has no entry for ${version}`);
  process.exit(1);
}

const next = lines.findIndex((line, index) => index > start && line.startsWith('## '));
const entry = lines.slice(start + 1, next === -1 ? undefined : next).join('\n').trim();

console.log(entry);

#!/usr/bin/env node
/**
 * Decides whether the release workflow publishes @teact/core, and under which npm dist-tag.
 *
 * Usage: node scripts/release-plan.mjs
 *
 * Prints `version`, `dist-tag` and `publish` (`true` or `false`) as `key=value` lines, and appends them to the file
 * in $GITHUB_OUTPUT when it is set. The dist-tag is the Changesets prerelease tag (`next`) while .changeset/pre.json
 * is in pre mode, and `latest` otherwise.
 *
 * `publish` is false when npm already has the version, and also when npm does not have the package at all: npm
 * accepts a trusted publisher only for a package that exists, so its first version is published by hand (see the
 * comment at the top of .github/workflows/release.yml).
 *
 * Exits with 1 when the registry cannot be queried, or when a prerelease version would be published as `latest`.
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE_NAME = '@teact/core';
const PACKAGE_JSON = join(ROOT, 'packages/core/package.json');
const PRE_STATE_FILE = join(ROOT, '.changeset/pre.json');

const { name, version } = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8'));
if (name !== PACKAGE_NAME) {
  fail(`Expected ${PACKAGE_JSON} to be ${PACKAGE_NAME}, found ${name}`);
}

const preState = existsSync(PRE_STATE_FILE) ? JSON.parse(readFileSync(PRE_STATE_FILE, 'utf8')) : undefined;
const distTag = preState?.mode === 'pre' ? preState.tag : 'latest';
if (distTag === 'latest' && version.includes('-')) {
  fail(`${PACKAGE_NAME}@${version} is a prerelease, but Changesets is not in pre mode: it would become latest`);
}

const publishedVersions = getPublishedVersions();
let publish = false;
if (!publishedVersions) {
  annotate('warning', [
    `${PACKAGE_NAME} is not on npm yet, so ${version} is not published here.`,
    'Publish the first version by hand and set up trusted publishing, as the comment at the top of release.yml says.',
  ].join(' '));
} else if (publishedVersions.includes(version)) {
  annotate('notice', `${PACKAGE_NAME}@${version} is already on npm.`);
} else {
  publish = true;
}

const outputs = [`version=${version}`, `dist-tag=${distTag}`, `publish=${publish}`];
console.log(outputs.join('\n'));
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `${outputs.join('\n')}\n`);
}

// The published versions, or `undefined` when npm does not have the package
function getPublishedVersions() {
  let output;
  try {
    output = execFileSync('npm', ['view', PACKAGE_NAME, 'versions', '--json'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    // With `--json`, npm prints the error as JSON on stdout
    if (parseJson(error.stdout)?.error?.code === 'E404') {
      return undefined;
    }

    fail(`Could not query the npm registry for ${PACKAGE_NAME}:\n${error.stderr || error.message}`);
  }

  const versions = parseJson(output);
  if (typeof versions === 'string') return [versions];
  if (Array.isArray(versions)) return versions;

  return fail(`Unexpected output of \`npm view ${PACKAGE_NAME} versions --json\`: ${output}`);
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function annotate(level, message) {
  console.log(process.env.GITHUB_ACTIONS ? `::${level}::${message}` : `${level}: ${message}`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

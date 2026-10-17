#!/usr/bin/env node
/**
 * Reports Teact changes made in the apps since the baselines recorded in `packages/core/UPSTREAM`.
 *
 * Usage: node scripts/upstream-check.mjs [--web-a <checkout>] [--web-a-ref <ref>] [--web-a-base <ref>]
 *                                        [--mtw <checkout>] [--mtw-ref <ref>] [--mtw-base <ref>] [--diff]
 *
 * Web A (public Ajaxy/telegram-tt or private Ajaxy/telegram-t):
 *   - commits that touched the closure since the baseline;
 *   - a path-normalised diff of every closure file in `packages/core` against the checkout at `--web-a-ref`;
 *   - imports in the upstream closure that the package cannot satisfy: relative modules it does not have
 *     (the closure grew) and packages other than ALLOWED_EXTERNALS.
 * MyTonWallet (public mytonwallet-org/mytonwallet or private mytonwalletorg/mytonwallet-dev):
 *   - commits that touched MTW's copy of Teact since the baseline.
 *
 * The public mirrors do not share history with the private repos, so UPSTREAM records a baseline in each:
 * `sha` and `private.sha` (and the same under `mtw`), with byte-identical closures. The check uses the first
 * of them that is an ancestor of the checked ref; `--web-a-base` and `--mtw-base` set the baseline instead.
 * For Web A, the baseline's closure is compared with the blobs recorded at import time.
 *
 * Refs default to HEAD. `--diff` prints the full diff of every changed file.
 * Exits with 1 when there are new upstream commits or new dependencies, or when the Web A baseline does not
 * match the import, so a scheduled run fails visibly; with 2 when it cannot run.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE_DIR = join(ROOT, 'packages/core');
const UPSTREAM_FILE = join(PACKAGE_DIR, 'UPSTREAM');

// MyTonWallet's Teact closure at the recorded baseline (it differs from Web A's in a few util and hook files)
const MTW_CLOSURE = [
  'src/lib/teact/teact.ts',
  'src/lib/teact/teact-dom.ts',
  'src/lib/teact/teactn.tsx',
  'src/lib/teact/dom-events.ts',
  'src/lib/teact/heavyAnimation.ts',
  'src/lib/teact/jsx-runtime.ts',
  'src/lib/teact/jsx-dev-runtime.ts',
  'src/lib/fasterdom/fasterdom.ts',
  'src/lib/fasterdom/stricterdom.ts',
  'src/lib/fasterdom/layoutCauses.ts',
  'src/util/Deferred.ts',
  'src/util/animation.ts',
  'src/util/arePropsShallowEqual.ts',
  'src/util/callbacks.ts',
  'src/util/debugOverlay.ts',
  'src/util/generateUniqueId.ts',
  'src/util/iteratees.ts',
  'src/util/safeExec.ts',
  'src/util/schedulers.ts',
  'src/util/signals.ts',
  'src/hooks/useEffectOnce.ts',
  'src/hooks/useForceUpdate.ts',
  'src/hooks/usePrevious.ts',
  'src/hooks/useSyncEffect.ts',
  'src/hooks/useUniqueId.ts',
];

// Packages the closure may import (type-only), as in scripts/import-web-a.mjs. Any other package is a new
// dependency of @teact/core.
const ALLOWED_EXTERNALS = new Set(['react']);

const IMPORT_RE = /(?:^|[;\n])\s*(?:import|export)\s(?:[^'";]*?\sfrom\s)?\s*'([^']+)'/g;
const RESOLVE_SUFFIXES = ['', '.ts', '.tsx', '/index.ts'];

function parseArgs(argv) {
  const args = { webARef: 'HEAD', mtwRef: 'HEAD', diff: false };
  const valueOptions = {
    '--web-a': 'webA',
    '--web-a-ref': 'webARef',
    '--web-a-base': 'webABase',
    '--mtw': 'mtw',
    '--mtw-ref': 'mtwRef',
    '--mtw-base': 'mtwBase',
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--diff') {
      args.diff = true;
    } else if (valueOptions[arg] && argv[i + 1]) {
      args[valueOptions[arg]] = argv[++i];
    } else {
      return undefined;
    }
  }

  return args.webA || args.mtw ? args : undefined;
}

function git(checkout, args) {
  return execFileSync('git', ['-C', checkout, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function readUpstreamFile(checkout, ref, path) {
  const result = spawnSync('git', ['-C', checkout, 'show', `${ref}:${path}`], {
    encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  });
  return result.status === 0 ? result.stdout : undefined;
}

function tryRevParse(checkout, revision) {
  const result = spawnSync('git', ['-C', checkout, 'rev-parse', '--verify', '--quiet', revision], {
    encoding: 'utf8',
  });
  return result.status === 0 ? result.stdout.trim() : undefined;
}

function resolveCommit(checkout, ref, label) {
  const commit = tryRevParse(checkout, `${ref}^{commit}`);
  if (!commit) {
    throw new Error(`${label}: ${ref} is not a commit in ${checkout}; fetch it first`);
  }
  return commit;
}

function isAncestor(checkout, ancestor, descendant) {
  return spawnSync('git', ['-C', checkout, 'merge-base', '--is-ancestor', ancestor, descendant]).status === 0;
}

// A baseline is usable only if it is in the checked ref's history: a public commit fetched into a private clone
// (or the other way round) would make `baseline..ref` list the whole history of the checkout.
function selectBaseline(checkout, head, entry, explicitBase, label, baseOption) {
  if (explicitBase) {
    const commit = resolveCommit(checkout, explicitBase, `${label} baseline`);
    if (!isAncestor(checkout, commit, head)) {
      throw new Error(`${label} baseline: ${explicitBase} is not an ancestor of ${head.slice(0, 9)} in ${checkout}`);
    }
    return { repo: `given with ${baseOption}`, sha: commit };
  }

  const candidates = [{ repo: entry.repo, sha: entry.sha }, ...(entry.private ? [entry.private] : [])];
  for (const candidate of candidates) {
    const commit = tryRevParse(checkout, `${candidate.sha}^{commit}`);
    if (commit && isAncestor(checkout, commit, head)) {
      return { repo: candidate.repo, sha: commit };
    }
  }

  const recorded = candidates.map(({ repo, sha }) => `${repo}@${sha.slice(0, 10)}`).join(', ');
  throw new Error(`${label}: none of the baselines in UPSTREAM (${recorded}) is an ancestor of ${head.slice(0, 9)} `
    + `in ${checkout}. Use a clone of one of these repos, or name a baseline with ${baseOption}`);
}

// Closure files whose content at the baseline differs from what was imported
function findBaselineMismatches(checkout, baseline, files) {
  return files
    .filter(([, { upstreamPath, blob }]) => tryRevParse(checkout, `${baseline}:${upstreamPath}`) !== blob)
    .map(([, { upstreamPath }]) => upstreamPath);
}

function printCommits(checkout, from, to, paths) {
  const range = `${from}..${to}`;
  const log = git(checkout, ['log', '--format=%h %ad %an: %s', '--date=short', range, '--', ...paths]).trim();
  const commits = log ? log.split('\n') : [];
  console.log(commits.length ? commits.map((line) => `  ${line}`).join('\n') : '  none');
  return commits.length;
}

function diffFiles(upstreamContent, localPath, tempDir) {
  const upstreamPath = join(tempDir, 'upstream');
  writeFileSync(upstreamPath, upstreamContent);
  const run = (...options) => spawnSync(
    'git',
    ['diff', '--no-index', '--no-color', ...options, upstreamPath, localPath],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  ).stdout;

  const [added, deleted] = run('--numstat').trim().split('\t');
  const patch = run().replace(/^(?:diff|index|---|\+\+\+) .*\n/gm, '').trimEnd().replace(/^/gm, '      ');

  return { stat: `+${added} -${deleted}`, patch };
}

function isFile(path) {
  return Boolean(statSync(path, { throwIfNoEntry: false })?.isFile());
}

function findNewDependencies(path, source, closurePaths) {
  const missing = [];

  for (const [, specifier] of source.matchAll(IMPORT_RE)) {
    if (!specifier.startsWith('.')) {
      if (!ALLOWED_EXTERNALS.has(specifier)) missing.push(`${path} imports package '${specifier}'`);
      continue;
    }

    // The package mirrors Web A's paths, so a module the package provides itself (a shim) also counts
    const target = posix.normalize(posix.join(posix.dirname(path), specifier));
    const isKnown = RESOLVE_SUFFIXES.some((suffix) => (
      closurePaths.has(target + suffix) || isFile(join(PACKAGE_DIR, target + suffix))
    ));
    if (!isKnown) missing.push(`${path} imports '${specifier}'`);
  }

  return missing;
}

function listPackageSources(dir = join(PACKAGE_DIR, 'src')) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listPackageSources(path) : [relative(PACKAGE_DIR, path).split('\\').join('/')];
  });
}

function checkWebA(upstream, checkout, ref, explicitBase, printDiff) {
  const head = resolveCommit(checkout, ref, 'Web A');
  const baseline = selectBaseline(checkout, head, upstream, explicitBase, 'Web A', '--web-a-base');
  const files = Object.entries(upstream.files);
  const upstreamPaths = files.map(([, { upstreamPath }]) => upstreamPath);

  console.log(`Web A: baseline ${baseline.sha.slice(0, 9)} (${baseline.repo}; imported from `
    + `${upstream.repo}@${upstream.sha.slice(0, 9)} on ${upstream.importedAt}), `
    + `checkout ${checkout} at ${ref} (${head.slice(0, 9)})`);

  const baselineMismatches = findBaselineMismatches(checkout, baseline.sha, files);
  if (baselineMismatches.length) {
    console.log(`\nThe baseline does not match the imported closure, so the commit list below is unreliable:\n  `
      + baselineMismatches.join('\n  '));
  }

  console.log(`\nCommits touching the closure since ${baseline.sha.slice(0, 9)}:`);
  const commitCount = printCommits(checkout, baseline.sha, head, upstreamPaths);

  console.log(`\nPath-normalised diff, packages/core vs ${ref} (upstream → package):`);
  const tempDir = mkdtempSync(join(tmpdir(), 'teact-upstream-'));
  const closurePaths = new Set(upstreamPaths);
  const newDependencies = [];
  let identicalCount = 0;

  try {
    for (const [libPath, { upstreamPath }] of files) {
      const upstreamContent = readUpstreamFile(checkout, head, upstreamPath);
      const localPath = join(PACKAGE_DIR, libPath);
      const localContent = existsSync(localPath) ? readFileSync(localPath, 'utf8') : undefined;
      const label = libPath === upstreamPath ? libPath : `${upstreamPath} → ${libPath}`;

      if (upstreamContent === undefined) {
        console.log(`  deleted upstream  ${label}`);
        continue;
      }

      newDependencies.push(...findNewDependencies(upstreamPath, upstreamContent, closurePaths));

      if (localContent === undefined) {
        console.log(`  missing locally   ${label}`);
      } else if (localContent === upstreamContent) {
        identicalCount++;
      } else {
        const { stat, patch } = diffFiles(upstreamContent, localPath, tempDir);
        console.log(`  changed           ${label} (${stat})`);
        if (printDiff) console.log(patch);
      }
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }

  console.log(`  ${identicalCount} of ${files.length} closure files are identical`);

  const libPaths = new Set(files.map(([libPath]) => libPath));
  const packageOnly = listPackageSources().filter((path) => !libPaths.has(path)).sort();
  console.log(`\nPackage-only files (not in the closure):\n  ${packageOnly.join('\n  ') || 'none'}`);

  console.log('\nNew upstream dependencies of the closure:');
  console.log(newDependencies.length ? newDependencies.map((line) => `  ${line}`).join('\n') : '  none');

  return commitCount > 0 || newDependencies.length > 0 || baselineMismatches.length > 0;
}

function checkMtw(upstream, checkout, ref, explicitBase) {
  if (!upstream.mtw) {
    throw new Error('UPSTREAM has no `mtw` baseline');
  }

  const head = resolveCommit(checkout, ref, 'MTW');
  const baseline = selectBaseline(checkout, head, upstream.mtw, explicitBase, 'MTW', '--mtw-base');

  console.log(`MyTonWallet: baseline ${baseline.sha.slice(0, 9)} (${baseline.repo}), `
    + `checkout ${checkout} at ${ref} (${head.slice(0, 9)})`);
  console.log(`\nCommits touching Teact since ${baseline.sha.slice(0, 9)}:`);
  return printCommits(checkout, baseline.sha, head, MTW_CLOSURE) > 0;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args) {
    console.error('Usage: node scripts/upstream-check.mjs [--web-a <checkout>] [--web-a-ref <ref>] '
      + '[--web-a-base <ref>] [--mtw <checkout>] [--mtw-ref <ref>] [--mtw-base <ref>] [--diff]');
    process.exit(2);
  }

  const upstream = JSON.parse(readFileSync(UPSTREAM_FILE, 'utf8'));
  let hasDrift = false;

  if (args.webA) {
    hasDrift = checkWebA(upstream, args.webA, args.webARef, args.webABase, args.diff) || hasDrift;
  }

  if (args.mtw) {
    if (args.webA) console.log('');
    hasDrift = checkMtw(upstream, args.mtw, args.mtwRef, args.mtwBase) || hasDrift;
  }

  process.exit(hasDrift ? 1 : 0);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(2);
}

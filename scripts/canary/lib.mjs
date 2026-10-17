// Shared steps of the canaries (scripts/canary/*/run.mjs). Each canary checks @teact/core against an app that uses it:
// it packs the package, copies the app into a work directory, installs the tarball there, applies the migration that
// the extraction plan describes for the app and runs the app's own checks. The app checkout is only read.
import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import {
  dirname, join, relative, resolve,
} from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Parses `--name value` and `--flag` arguments. `spec` maps option names to 'string' or 'boolean'; string options may
 * be repeated, the last one wins.
 */
export function parseArgs(argv, spec, usage) {
  const options = {};

  for (let i = 0; i < argv.length; i++) {
    const name = argv[i].replace(/^--/, '');
    if (!argv[i].startsWith('--') || !spec[name]) fail(`Unknown argument: ${argv[i]}\n\n${usage}`);

    if (spec[name] === 'boolean') {
      options[name] = true;
    } else {
      if (i + 1 >= argv.length) fail(`--${name} needs a value\n\n${usage}`);
      options[name] = argv[++i];
    }
  }

  return options;
}

export function fail(message) {
  console.error(message);
  process.exit(2);
}

let stepStartedAt;

export function step(title) {
  finishStep();
  stepStartedAt = Date.now();
  console.log(`\n==> ${title}`);
}

export function finishStep() {
  if (stepStartedAt) {
    console.log(`    (${Math.round((Date.now() - stepStartedAt) / 1000)} s)`);
    stepStartedAt = undefined;
  }
}

/** Runs a command with inherited output; throws when it fails */
export function run(command, args, { cwd, env } = {}) {
  console.log(`$ ${[command, ...args].join(' ')}${cwd ? `  (in ${cwd})` : ''}`);
  const result = spawnSync(command, args, {
    cwd, env: { ...process.env, ...env }, stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`\`${[command, ...args].join(' ')}\` failed with ${result.status ?? result.signal}`);
  }
}

/** Runs a command and returns its exit status and output, without failing */
export function runCaptured(command, args, { cwd, env } = {}) {
  console.log(`$ ${[command, ...args].join(' ')}${cwd ? `  (in ${cwd})` : ''}`);
  const result = spawnSync(command, args, {
    cwd, env: { ...process.env, ...env }, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024,
  });

  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

/**
 * The errors in `tsc --pretty false` output, counted by file and error code. Positions and messages are left out, so
 * that the counts compare before and after a migration that changes imports and the names in type messages.
 */
export function parseTscErrors(output) {
  const counts = new Map();
  for (const line of output.split('\n')) {
    const match = line.match(/^(.+?)\(\d+,\d+\): error (TS\d+): /);
    if (match) {
      // "Cannot find name" comes as TS2552 when TypeScript has a similar name to suggest, which depends on what else
      // the program declares
      const key = `${match[1]} ${match[2] === 'TS2552' ? 'TS2304' : match[2]}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }

  return counts;
}

/** Fails when `after` has more errors of a code in a file than `before` (the app's baseline) */
export function checkNoNewTscErrors(label, before, after) {
  const total = (counts) => [...counts.values()].reduce((sum, count) => sum + count, 0);
  const added = [...after]
    .filter(([key, count]) => count > (before.get(key) || 0))
    .map(([key, count]) => `${key}: ${before.get(key) || 0} before, ${count} after`);

  console.log(`    ${label}: ${total(before)} errors before the migration (baseline), ${total(after)} after; `
    + `${added.length} file and code pairs with more errors`);
  if (added.length) throw new Error(`${label}: more type errors than before the migration:\n${added.join('\n')}`);
}

/**
 * Runs Jest or Vitest with a JSON report (both write Jest's format) and returns the failed tests, as "file > full name";
 * a file that cannot run counts as one failure
 */
export function runTests(command, args, { cwd, env, reportPath }) {
  const { status } = runCaptured(command, args, { cwd, env });
  if (!existsSync(reportPath)) throw new Error(`The test run wrote no report (exit ${status})`);

  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  const failed = new Set(report.testResults.flatMap((file) => {
    const path = relative(cwd, file.name);
    const failedTests = file.assertionResults.filter((test) => test.status === 'failed');
    return failedTests.length || file.status !== 'failed'
      ? failedTests.map((test) => `${path} > ${test.fullName}`)
      : [`${path} (could not run: ${(file.message || '').split('\n').find(Boolean)})`];
  }));
  console.log(`    exit ${status}: ${report.numTotalTestSuites} suites, ${report.numTotalTests} tests, `
    + `${report.numFailedTests} failed tests, ${report.numFailedTestSuites} failed suites`);

  return failed;
}

/** Fails when a test fails after the migration that did not fail before it */
export function checkNoNewTestFailures(before, after) {
  const added = [...after].filter((test) => !before.has(test));
  console.log(`    ${before.size} failing before the migration, ${after.size} after, ${added.length} new`);
  if (before.size) console.log(`    failing before the migration too:\n      ${[...before].join('\n      ')}`);
  if (added.length) throw new Error(`New test failures:\n${added.join('\n')}`);
}

export function createWorkDir(work, prefix) {
  if (!work) return mkdtempSync(join(tmpdir(), prefix));

  const dir = resolve(work);
  if (existsSync(dir) && readdirSync(dir).length) fail(`The work directory is not empty: ${dir}`);
  mkdirSync(dir, { recursive: true });

  return dir;
}

/** Builds and packs @teact/core into `dir`, or uses the given tarball; returns its path */
export function packCore(dir, tarball) {
  if (tarball) return resolve(tarball);

  run('npm', ['run', 'build', '-w', '@teact/core'], { cwd: ROOT });
  const [{ filename }] = JSON.parse(execFileSync('npm', [
    'pack', '-w', '@teact/core', '--json', '--pack-destination', dir,
  ], { cwd: ROOT, encoding: 'utf8' }));

  return join(dir, filename);
}

/** Copies the files of `ref` in a git checkout to `dest` (`git archive`, so the checkout itself is not touched) */
export function copyApp(checkout, ref, dest) {
  const source = resolve(checkout);
  if (!existsSync(join(source, '.git'))) fail(`Not a git checkout: ${source}`);

  const commit = execFileSync('git', ['-C', source, 'rev-parse', '--verify', `${ref}^{commit}`], {
    encoding: 'utf8',
  }).trim();
  mkdirSync(dest, { recursive: true });
  execFileSync('sh', ['-c', 'git -C "$1" archive --format=tar "$2" | tar -x -C "$3"', 'sh', source, commit, dest], {
    stdio: 'inherit',
  });

  return commit;
}

/**
 * Installs the app's dependencies from its lockfile, or copies an existing `node_modules` (on macOS as a copy-on-write
 * clone), which is much faster for local runs
 */
export function installDependencies(appDir, { nodeModulesFrom, npmCiArgs = [] }) {
  if (nodeModulesFrom) {
    const source = resolve(nodeModulesFrom);
    if (!existsSync(source)) fail(`No such directory: ${source}`);
    run('cp', [...(process.platform === 'darwin' ? ['-c'] : []), '-R', source, join(appDir, 'node_modules')]);
    return;
  }

  run('npm', ['ci', '--no-audit', '--no-fund', ...npmCiArgs], { cwd: appDir });
}

export function installTarball(appDir, tarball) {
  run('npm', [
    'install', '--no-audit', '--no-fund', '--ignore-scripts', '--save-exact', '--min-release-age=0', tarball,
  ], { cwd: appDir });
}

/** Applies `edit` to a file of the app; fails when the file does not change */
export function editFile(appDir, path, edit) {
  const fullPath = join(appDir, path);
  const source = readFileSync(fullPath, 'utf8');
  const result = edit(source);
  if (result === source) throw new Error(`${path}: the edit changed nothing`);

  writeFileSync(fullPath, result);
  console.log(`    edited ${path}`);
}

export function writeAppFile(appDir, path, content) {
  writeFileSync(join(appDir, path), content);
  console.log(`    wrote ${path}`);
}

export function deleteAppFiles(appDir, paths) {
  for (const path of paths) {
    if (!existsSync(join(appDir, path))) throw new Error(`${path} does not exist`);
    rmSync(join(appDir, path), { recursive: true });
  }
  console.log(`    deleted ${paths.join(', ')}`);
}

/** Replaces exactly one match of `search` (a string or a regular expression); fails on none or several */
export function replaceOnce(source, search, replacement, label = String(search)) {
  const count = typeof search === 'string'
    ? source.split(search).length - 1
    : (source.match(new RegExp(search.source, search.flags.includes('g') ? search.flags : `${search.flags}g`)) || [])
      .length;
  if (count !== 1) throw new Error(`Expected one match of ${label}, found ${count}`);

  return source.replace(search, replacement);
}

/**
 * Removes top-level declarations (functions, variables, types) by name, with the comment lines right above them.
 * Fails when a name is not declared at the start of a line.
 */
export function removeDeclarations(source, names) {
  let result = source;

  for (const name of names) {
    const match = new RegExp(
      `^(?:export )?(?:async )?(?:function|const|let|type) ${name}\\b`,
      'm',
    ).exec(result);
    if (!match) throw new Error(`No top-level declaration of \`${name}\``);

    let start = match.index;
    // The comment lines directly above
    while (start > 0) {
      const lineStart = result.lastIndexOf('\n', start - 2) + 1;
      if (!/^\s*\/\//.test(result.slice(lineStart, start))) break;
      start = lineStart;
    }

    const end = findStatementEnd(result, match.index + match[0].length);
    result = result.slice(0, start) + result.slice(end);
  }

  return result.replace(/\n{3,}/g, '\n\n');
}

// The end of a declaration: a function's closing brace, or the `;` (or line end) after balanced brackets
function findStatementEnd(source, from) {
  const isFunction = /function \w+$/.test(source.slice(source.lastIndexOf('\n', from) + 1, from));
  let depth = 0;
  let quote;

  for (let i = from; i < source.length; i++) {
    const char = source[i];

    if (quote) {
      if (char === '\\') i++;
      else if (char === quote) quote = undefined;
      continue;
    }

    if (char === '\'' || char === '"' || char === '`') {
      quote = char;
    } else if (char === '/' && source[i + 1] === '/') {
      i = source.indexOf('\n', i) - 1;
    } else if ('({['.includes(char)) {
      depth++;
    } else if (')}]'.includes(char)) {
      depth--;
      if (isFunction && depth === 0 && char === '}') return i + 1;
    } else if (!isFunction && depth === 0 && (char === ';' || char === '\n')) {
      // With a trailing comment on the same line (`const A = 35; // < 30 FPS`)
      if (char === ';') return i + 1 + (source.slice(i + 1).match(/^[ \t]*\/\/[^\n]*/)?.[0].length ?? 0);
      // A declaration that continues on the next line (`type A =\n  | 'a'`) is not finished yet
      if (!/^\s*[|&=]/.test(source.slice(i + 1, source.indexOf('\n', i + 1)))) return i;
    }
  }

  throw new Error('Unterminated declaration');
}

// The JSX additions that the package's jsx.d.ts now declares (plan §3g), as the apps declare them in the
// `declare namespace React` block of their src/@types/global.d.ts
const TEACT_JSX_INTERFACES = ['CSSProperties', 'ClassAttributes', 'Attributes', 'VideoHTMLAttributes', 'MouseEvent',
  'KeyboardEvent'];

/**
 * Deletes the app's own declarations of Teact's JSX additions, with their comments, and keeps the app-specific ones
 * (Web A's `onFileHoverOpen` and `LiHTMLAttributes`, MyTonWallet's `data-focus-scroll-position` and `autoCorrect`, and
 * `teactExperimentControlled` while an app still sets it)
 */
export function removeTeactJsxDeclarations(source) {
  let result = replaceOnce(
    source,
    /(\n[ \t]*\/\/[^\n]*)*\n[ \t]*teactFastList\?: boolean;/,
    '',
    '`teactFastList` in global.d.ts',
  );

  for (const name of TEACT_JSX_INTERFACES) {
    result = replaceOnce(
      result,
      new RegExp(`(\\n[ \\t]*//[^\\n]*)*\\n[ \\t]*interface ${name}\\b[^{]*\\{[^}]*\\}\\n`),
      '\n',
      `\`interface ${name}\` in global.d.ts`,
    );
  }

  // Blank lines left where declarations were
  return result.replace(/\n{3,}/g, '\n\n').replace(/\{\n\n/g, '{\n').replace(/\n\n(\s*)\}/g, '\n$1}');
}

/** Source files under `dirs` of the app (relative paths), without node_modules */
export function listSourceFiles(appDir, dirs, pattern = /\.(ts|tsx|js|jsx|mjs|cjs)$/) {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (pattern.test(entry.name)) files.push(relative(appDir, path));
    }
  };
  dirs.filter((dir) => existsSync(join(appDir, dir))).forEach((dir) => walk(join(appDir, dir)));

  return files;
}

/** Fails when an app file still imports one of the old Teact paths */
export function checkNoOldImports(appDir, dirs, pattern) {
  const offenders = listSourceFiles(appDir, dirs).flatMap((path) => readFileSync(join(appDir, path), 'utf8')
    .split('\n')
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => /\b(from|import|mock|requireActual)\b/.test(line) && pattern.test(line))
    .map(({ line, index }) => `${path}:${index + 1}: ${line.trim()}`));

  if (offenders.length) throw new Error(`Imports of the old Teact paths are left:\n${offenders.join('\n')}`);
  console.log('    no imports of the old paths are left');
}

/** Counts the `.js` files under `dir` that contain each marker */
export function countMarkers(dir, markers) {
  const files = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.js')) files.push(path);
    }
  };
  walk(dir);

  return Object.fromEntries(markers.map((marker) => [
    marker, files.filter((path) => readFileSync(path, 'utf8').includes(marker)).length,
  ]));
}

/** Compares marker counts with the expected ones; throws with all differences */
export function checkMarkers(label, counts, expected) {
  const wrong = Object.entries(expected).filter(([marker, count]) => counts[marker] !== count);
  for (const [marker, count] of Object.entries(counts)) {
    console.log(`    ${count === expected[marker] ? 'ok  ' : 'FAIL'} ${label}: "${marker}" in ${count} file(s), `
      + `expected ${expected[marker]}`);
  }
  if (wrong.length) throw new Error(`${label}: unexpected bundle markers`);
}

export function isDirectory(path) {
  return existsSync(path) && statSync(path).isDirectory();
}

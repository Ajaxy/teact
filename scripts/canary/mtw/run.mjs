#!/usr/bin/env node
/**
 * Canary: MyTonWallet on the packed @teact/core.
 *
 * Usage: node scripts/canary/mtw/run.mjs --app <mytonwallet-checkout> [--ref <ref>] [--work <dir>]
 *          [--node-modules <dir>] [--tarball <file>] [--build] [--skip-tests] [--jest-args "<args>"]
 *
 *   --app           A git checkout of mytonwallet-org/mytonwallet (public) or mytonwalletorg/mytonwallet-dev
 *                   (private). Only read.
 *   --ref           The commit to test (default: HEAD of the checkout).
 *   --work          Where to put the app copy (default: a new temporary directory). Kept afterwards, so that a
 *                   failure can be inspected.
 *   --node-modules  Copy this node_modules instead of installing with `npm ci --ignore-scripts` and patch-package.
 *   --tarball       Use this @teact/core tarball instead of building and packing the workspace.
 *   --build         Also build the main web app and the portfolio site (production) and check bundle markers.
 *   --skip-tests    Skip Jest.
 *   --jest-args     Extra Jest arguments, such as test paths, for both Jest runs.
 *
 * Steps, as the extraction plan describes the MyTonWallet migration (§5E, E1 config with the E2 codemod):
 *   1. Pack @teact/core and copy the app (`git archive`) into the work directory; install its dependencies and the
 *      tarball, and generate the default translations (`i18n:build:default`), as the app's CI does. Baselines: `tsc`
 *      and Jest before the migration, since the app may have failures of its own.
 *   2. Config: Jest transforms @teact (`transformIgnorePatterns`); src/util/setupTeact.ts wires
 *      `configureTeact({ onError: handleError })` and the dev tools under DEBUG, imported by the UI entries after
 *      util/handleError; tests/init.ts calls `configureTeact({ onError: console.error })`; Vite (plugins/viteBase.ts)
 *      resolves the `teact-dev` condition for development and staging; util/schedulers.ts re-exports the package's
 *      scheduler primitives; global.d.ts loses the JSX declarations that the package now ships.
 *   3. The §6b codemod (teact-imports.py), partial `jest.mock` factories of `@teact/core/fasterdom` spread
 *      `jest.requireActual`, the vendored Teact files are deleted, and no import of the old paths may be left.
 *   4. Checks: no `tsc` errors and no failing Jest test that did not fail before the migration; optionally production
 *      builds of the main app and the portfolio with bundle markers.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  checkMarkers, checkNoNewTestFailures, checkNoNewTscErrors, checkNoOldImports, copyApp, countMarkers, createWorkDir,
  deleteAppFiles, editFile, finishStep, installDependencies, installTarball, isDirectory, listSourceFiles, packCore,
  parseArgs, parseTscErrors, removeDeclarations, removeTeactJsxDeclarations, replaceOnce, ROOT, run, runCaptured,
  runTests, step, writeAppFile,
} from '../lib.mjs';

const USAGE = readFileSync(new URL(import.meta.url), 'utf8').match(/\/\*\*\n([\s\S]*?)\*\//)[1]
  .replace(/^ \* ?/gm, '');

const options = parseArgs(process.argv.slice(2), {
  app: 'string',
  ref: 'string',
  work: 'string',
  'node-modules': 'string',
  tarball: 'string',
  build: 'boolean',
  'skip-tests': 'boolean',
  'jest-args': 'string',
}, USAGE);
if (!options.app) {
  console.error(USAGE);
  process.exit(2);
}

const VENDORED_FILES = [
  'src/lib/teact/teact.ts',
  'src/lib/teact/teact-dom.ts',
  'src/lib/teact/teactn.tsx',
  'src/lib/teact/heavyAnimation.ts',
  'src/lib/teact/dom-events.ts',
  'src/lib/teact/jsx-runtime.ts',
  'src/lib/teact/jsx-dev-runtime.ts',
  'src/lib/fasterdom/fasterdom.ts',
  'src/lib/fasterdom/stricterdom.ts',
  'src/lib/fasterdom/layoutCauses.ts',
  'src/util/signals.ts',
  'src/util/arePropsShallowEqual.ts',
  'src/util/debugOverlay.ts',
];

// Plan §6b's check
const OLD_IMPORT_RE = /lib\/(teact|fasterdom)\/|util\/signals'/;

// The UI entries, which load util/handleError first: they get the Teact setup right after it
const UI_ENTRIES = ['src/index.tsx', 'src/portfolio/index.tsx', 'src/multisend/index.tsx', 'src/mfa/index.tsx',
  'src/push/index.tsx'];

// util/schedulers.ts re-exports the package's primitives, so there is one rAF and tick-end batch. MyTonWallet keeps its
// own async `throttle` and `onIdle`, which calls `onTickEnd`.
const SCHEDULER_DECLARATIONS = [
  'Scheduler', 'throttleWithTickEnd', 'throttleWith', 'FAST_RAF_TIMEOUT_FALLBACK_MS', 'fastRafCallbacks',
  'fastRafFallbackCallbacks', 'fastRafFallbackTimeout', 'fastRaf', 'onTickEndCallbacks', 'onTickEnd',
];

const SETUP_TEACT = `// Teact setup: Teact's errors go to the app's handler; the dev tools when DEBUG is on.
// Imported by the UI entries only: util/handleError.ts also runs in the API worker, the extension service worker and
// the Air SDK, which do not need Teact.
import { configureTeact, installTeactDevTools } from '@teact/core';
import { installTeactNDevTools } from '@teact/core/teactn';

import { DEBUG } from '../config';
import { handleError } from './handleError';

configureTeact({ onError: handleError });

if (DEBUG) {
  installTeactDevTools();
  installTeactNDevTools();
}
`;

const DEV_MARKER = '[Teact] Children keys are not unique';
const SIGNAL_MARKER = 'teact.signal';

const workDir = createWorkDir(options.work, 'teact-canary-mtw-');
const appDir = join(workDir, 'app');
const jestArgs = options['jest-args'] ? options['jest-args'].split(/\s+/).filter(Boolean) : [];

function runJest(reportName) {
  const reportPath = join(workDir, reportName);
  return runTests('npx', ['jest', '--ci', '--silent', '--json', `--outputFile=${reportPath}`, ...jestArgs], {
    cwd: appDir, env: { APP_ENV: 'test' }, reportPath,
  });
}

try {
  step('Pack @teact/core');
  const tarball = packCore(workDir, options.tarball);
  console.log(`    ${tarball}`);

  step(`Copy MyTonWallet from ${options.app}`);
  const commit = copyApp(options.app, options.ref || 'HEAD', appDir);
  console.log(`    ${commit} into ${appDir}`);

  step('Install dependencies');
  // Install scripts download Electron and build native tools that the checks do not need; the app's own patches still
  // apply
  installDependencies(appDir, { nodeModulesFrom: options['node-modules'], npmCiArgs: ['--ignore-scripts'] });
  if (!options['node-modules']) run('npx', ['patch-package', '--error-on-fail'], { cwd: appDir });

  step('Generate the default translations, as MyTonWallet\'s CI does before its checks');
  run('npm', ['run', 'i18n:build:default'], { cwd: appDir });

  step('Baseline: tsc before the migration');
  const tscBefore = runCaptured('npx', ['tsc', '--pretty', 'false'], { cwd: appDir }).output;
  writeFileSync(join(workDir, 'tsc-before.txt'), tscBefore);
  const tscErrorsBefore = parseTscErrors(tscBefore);

  let jestFailedBefore;
  if (!options['skip-tests']) {
    step('Baseline: Jest before the migration');
    jestFailedBefore = runJest('jest-before.json');
  }

  step('Install the tarball');
  installTarball(appDir, tarball);

  step('Migration: configuration (E1)');
  editFile(appDir, 'jest.config.js', (source) => replaceOnce(
    source, '(axios|uint8arrays|multiformats)', '(axios|uint8arrays|multiformats|@teact)',
  ));
  writeAppFile(appDir, 'src/util/setupTeact.ts', SETUP_TEACT);
  for (const entry of UI_ENTRIES.filter((path) => listSourceFiles(appDir, ['src']).includes(path))) {
    editFile(appDir, entry, (source) => replaceOnce(source, /^import '(\.\.?)\/util\/handleError';\n/m, (line, dir) => (
      `${line}import '${dir}/util/setupTeact';\n`
    )));
  }
  editFile(appDir, 'tests/init.ts', (source) => replaceOnce(
    source,
    'import \'dotenv/config\';\n',
    'import \'dotenv/config\';\n\nimport { configureTeact } from \'@teact/core\';\n',
  ).replace(/\n*$/, '\n\n// Errors caught by Teact\nconfigureTeact({ onError: console.error });\n'));
  editFile(appDir, 'plugins/viteBase.ts', (source) => {
    let result = replaceOnce(source, 'import { transformWithOxc } from \'vite\';', (
      'import { defaultClientConditions, transformWithOxc } from \'vite\';'
    ));
    result = replaceOnce(result, /\n {4}mode,\n {4}base: '\.\/',\n/, (match) => [
      match,
      '    // Teact\'s development build wherever the app\'s DEBUG is on (config.ts)\n',
      '    resolve: { conditions: [...defaultClientConditions, ...(IS_DEV_TEACT ? [\'teact-dev\'] : [])] },\n',
    ].join(''));
    return replaceOnce(result, /\nexport const ROOT_DIR = /, (match) => (
      '\nconst IS_DEV_TEACT = process.env.APP_ENV === \'development\' || process.env.APP_ENV === \'staging\';\n'
      + match
    ));
  });
  editFile(appDir, 'src/util/schedulers.ts', (source) => {
    const result = removeDeclarations(source, SCHEDULER_DECLARATIONS);
    return replaceOnce(result, 'import Deferred from \'./Deferred\';\n', [
      'import { fastRaf, onTickEnd } from \'@teact/core/fasterdom\';',
      '',
      'import Deferred from \'./Deferred\';',
      '',
      'export {',
      '  fastRaf, onTickEnd, throttleWith, throttleWithTickEnd, type Scheduler,',
      '} from \'@teact/core/fasterdom\';',
      '',
    ].join('\n'));
  });
  editFile(appDir, 'src/@types/global.d.ts', removeTeactJsxDeclarations);

  step('Migration: the import codemod (plan §6b), partial mocks and the deletion of the vendored Teact');
  run('python3', ['-I', join(ROOT, 'scripts/canary/mtw/teact-imports.py'), appDir]);
  const testFiles = listSourceFiles(appDir, ['src', 'tests'], /\.test\.(ts|tsx|js|jsx)$/);
  for (const path of testFiles) {
    const source = readFileSync(join(appDir, path), 'utf8');
    const result = source.replace(
      /jest\.mock\((['"])@teact\/core\/fasterdom\1, \(\) => \(\{(\s*)/g,
      (match, quote, space) => `${match}...jest.requireActual(${quote}@teact/core/fasterdom${quote}),${space}`,
    );
    if (result !== source) editFile(appDir, path, () => result);
  }
  deleteAppFiles(appDir, VENDORED_FILES.filter((path) => listSourceFiles(appDir, ['src']).includes(path)));
  checkNoOldImports(appDir, ['src', 'tests'], OLD_IMPORT_RE);

  step('Type-check: no new tsc errors');
  const tscAfter = runCaptured('npx', ['tsc', '--pretty', 'false'], { cwd: appDir }).output;
  writeFileSync(join(workDir, 'tsc-after.txt'), tscAfter);
  checkNoNewTscErrors('tsc', tscErrorsBefore, parseTscErrors(tscAfter));

  if (!options['skip-tests']) {
    step('Jest after the migration: no new failures');
    checkNoNewTestFailures(jestFailedBefore, runJest('jest-after.json'));
  }

  if (options.build) {
    for (const [label, config, outDir] of [
      ['main web app', 'vite.config.ts', 'dist'],
      ['portfolio', 'vite-portfolio.config.ts', 'dist-portfolio'],
    ]) {
      step(`Build the ${label} (production) and check bundle markers`);
      run('npx', ['vite', 'build', '--config', config], { cwd: appDir });
      if (!isDirectory(join(appDir, outDir))) throw new Error(`No ${outDir} after the build`);
      checkMarkers(label, countMarkers(join(appDir, outDir), [DEV_MARKER, SIGNAL_MARKER]), {
        [DEV_MARKER]: 0, [SIGNAL_MARKER]: 1,
      });
    }
  }

  finishStep();
  console.log(`\nMyTonWallet canary passed (${commit}). The app copy is in ${appDir}`);
} catch (error) {
  finishStep();
  console.error(`\nMyTonWallet canary FAILED: ${error.message}\nThe app copy is in ${appDir}`);
  process.exit(1);
}

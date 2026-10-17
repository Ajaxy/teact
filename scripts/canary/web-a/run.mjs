#!/usr/bin/env node
/**
 * Canary: Telegram Web A on the packed @teact/core.
 *
 * Usage: node scripts/canary/web-a/run.mjs --app <web-a-checkout> [--ref <ref>] [--work <dir>]
 *          [--node-modules <dir>] [--tarball <file>] [--build] [--eslint] [--skip-tests]
 *
 *   --app           A git checkout of Ajaxy/telegram-tt (public) or Ajaxy/telegram-t (private). Only read.
 *   --ref           The commit to test (default: HEAD of the checkout).
 *   --work          Where to put the app copy (default: a new temporary directory). Kept afterwards, so that a
 *                   failure can be inspected.
 *   --node-modules  Copy this node_modules (for example the checkout's own) instead of running `npm ci`.
 *   --tarball       Use this @teact/core tarball instead of building and packing the workspace.
 *   --build         Also run `build:mocked` and `build:staging` (development Teact) and `build:production`, and check
 *                   bundle markers.
 *   --eslint        Also run ESLint (`--fix`, as the migration does) on the files that the migration changed.
 *   --skip-tests    Skip Vitest (before and after the migration).
 *
 * Steps, as the extraction plan describes the Web A migration (§5D):
 *   1. Pack @teact/core and copy the app (`git archive`) into the work directory; install its dependencies and the
 *      tarball, and remove the unused `react` package.
 *   2. Commit 1 (config): `jsxImportSource: '@teact/core'` and no `@teact` paths in the tsconfigs; Vite resolves the
 *      `teact-dev` condition when APP_ENV is not production (Vitest uses the Vite config); src/util/setupTeact.ts wires
 *      `configureTeact({ onError: handleError })` and the dev tools under DEBUG, imported after util/handleError;
 *      util/schedulers.ts re-exports the package's scheduler primitives; global.d.ts loses the JSX declarations that
 *      the package now ships.
 *   3. Commit 2 (mechanical): the §6a codemod (teact-imports.mjs), then the vendored Teact files are deleted, and no
 *      import of the old paths may be left.
 *   4. Checks: `tsc -p tsconfig.json` without errors; `tsc -p tsconfig.script.json` (tests and configs, which Web A
 *      does not type-check in CI and which have errors of their own) and Vitest without failures that they did not
 *      have before the migration; optionally the builds with bundle markers, and ESLint. `npm run gramjs:tl` runs
 *      first. (The public mirror has no tests/ directory, so Vitest cannot run there, before or after.)
 *
 * Not run: Web A's own Playwright suite (tests/playwright). Web A runs it nowhere (its tests.yml is manual-only, with
 * the Playwright steps commented out), and the public mirror does not have it. The migration PR runs it locally (§5D);
 * this repository's browser suites and e2e (Web A's test components) cover Teact in browsers.
 *
 * The public telegram-tt may lag behind the private repo: before the controlled-inputs change (Ajaxy/telegram-t#7422)
 * reaches it, its components still set `teactExperimentControlled`, which then stays declared in its global.d.ts.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  checkMarkers, checkNoNewTestFailures, checkNoNewTscErrors, checkNoOldImports, copyApp, countMarkers, createWorkDir,
  deleteAppFiles, editFile, finishStep, installDependencies, installTarball, packCore, parseArgs, parseTscErrors,
  removeDeclarations, removeTeactJsxDeclarations, replaceOnce, ROOT, run, runCaptured, runTests, step, writeAppFile,
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
  eslint: 'boolean',
  'skip-tests': 'boolean',
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
  'src/util/safeExec.ts',
  'src/util/debugOverlay.ts',
];

// Plan §6a's check: no import of the old paths, and no `@teact` specifier other than `@teact/core`
const OLD_IMPORT_RE = /lib\/(teact|fasterdom)\/|util\/signals|'\.\/signals'|'\.\.\/signals'|'@teact(?!\/core)['/]/;

// The scheduler primitives that Teact uses: util/schedulers.ts re-exports the package's instead of its own copies, so
// there is one rAF and tick-end batch. `onIdle` is dropped: only Teact used it.
const SCHEDULER_DECLARATIONS = [
  'Scheduler', 'throttleWithTickEnd', 'throttleWith', 'FAST_RAF_TIMEOUT_FALLBACK_MS', 'fastRafCallbacks',
  'fastRafFallbackCallbacks', 'fastRafFallbackTimeout', 'fastRaf', 'onTickEndCallbacks', 'onTickEnd', 'IDLE_TIMEOUT',
  'onIdleCallbacks', 'onIdle',
];

const SETUP_TEACT = `// Teact setup: Teact's errors go to the app's handler; the dev tools when DEBUG is on
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

// Bundle markers, counted in `.js` files (§5D verification)
const DEV_MARKER = '[Teact] Children keys are not unique';
const SIGNAL_MARKER = 'teact.signal';
const REACT_MARKER = 'react.transitional.element';

const workDir = createWorkDir(options.work, 'teact-canary-web-a-');
const appDir = join(workDir, 'app');

// As `npm test` runs it, with a JSON report
function runVitest(reportName) {
  const reportPath = join(workDir, reportName);
  return runTests('npx', ['vitest', 'run', '--silent=true', '--reporter=json', `--outputFile=${reportPath}`], {
    cwd: appDir, env: { APP_ENV: 'test' }, reportPath,
  });
}

try {
  step('Pack @teact/core');
  const tarball = packCore(workDir, options.tarball);
  console.log(`    ${tarball}`);

  step(`Copy Web A from ${options.app}`);
  const commit = copyApp(options.app, options.ref || 'HEAD', appDir);
  console.log(`    ${commit} into ${appDir}`);

  step('Install dependencies and the tarball');
  installDependencies(appDir, { nodeModulesFrom: options['node-modules'] });
  installTarball(appDir, tarball);
  const packageJson = JSON.parse(readFileSync(join(appDir, 'package.json'), 'utf8'));
  if (packageJson.devDependencies?.react) {
    run('npm', ['uninstall', '--no-audit', '--no-fund', '--ignore-scripts', 'react'], { cwd: appDir });
  }

  step('Generate the GramJS TL modules');
  run('npm', ['run', 'gramjs:tl'], { cwd: appDir });

  // Web A does not type-check tsconfig.script.json (tests, configs) in CI, and it has errors of its own: the
  // migration must not add any
  step('Baseline: tsc -p tsconfig.script.json before the migration');
  const scriptCheckBefore = runCaptured('npx', ['tsc', '-p', 'tsconfig.script.json', '--pretty', 'false'], {
    cwd: appDir,
  }).output;
  writeFileSync(join(workDir, 'tsc-script-before.txt'), scriptCheckBefore);
  const scriptErrorsBefore = parseTscErrors(scriptCheckBefore);

  let testsFailedBefore;
  if (!options['skip-tests']) {
    step('Baseline: Vitest before the migration');
    testsFailedBefore = runVitest('vitest-before.json');
  }

  step('Migration commit 1: configuration');
  for (const path of ['tsconfig.base.json', 'tsconfig.json']) {
    editFile(appDir, path, (source) => {
      let result = source.replace('"jsxImportSource": "@teact"', '"jsxImportSource": "@teact/core"');
      result = replaceOnce(result, /\n\s*"@teact": \[[^\]]*\],/, '', `"@teact" in ${path}`);
      return replaceOnce(result, /\n\s*"@teact\/\*": \[[^\]]*\],/, '', `"@teact/*" in ${path}`);
    });
  }
  editFile(appDir, 'vite.config.ts', (source) => {
    const result = replaceOnce(
      source, /import \{ ([^}]*) \} from 'vite';/, 'import { defaultClientConditions, $1 } from \'vite\';',
    );
    return replaceOnce(result, /\n(\s*)resolve: \{\n/, (match, indent) => `${match}${indent}  // Teact's development `
      + `build wherever the app's DEBUG is on (config.ts)\n${indent}  conditions: [...defaultClientConditions, `
      + '...(appEnv !== \'production\' ? [\'teact-dev\'] : [])],\n');
  });
  writeAppFile(appDir, 'src/util/setupTeact.ts', SETUP_TEACT);
  editFile(appDir, 'src/index.tsx', (source) => replaceOnce(
    source, 'import \'./util/handleError\';\n', 'import \'./util/handleError\';\nimport \'./util/setupTeact\';\n',
  ));
  editFile(appDir, 'src/util/schedulers.ts', (source) => [
    'import { fastRaf, onTickEnd } from \'@teact/core/fasterdom\';',
    '',
    'export {',
    '  fastRaf, onTickEnd, throttleWith, throttleWithTickEnd, type Scheduler,',
    '} from \'@teact/core/fasterdom\';',
    '',
    removeDeclarations(source, SCHEDULER_DECLARATIONS).trimStart(),
  ].join('\n'));
  editFile(appDir, 'src/@types/global.d.ts', removeTeactJsxDeclarations);
  if (options.eslint) {
    // The vendored Teact is gone, so the import groups no longer single it out (plan §5D)
    editFile(appDir, 'eslint.config.js', (source) => source
      .replace('\'^(\\\\.+/)+(lib/(teact|gramjs))(/.*|$)\'', '\'^(\\\\.+/)+(lib/gramjs)(/.*|$)\'')
      .replace('\'^(\\\\.+/)+(lib)(?!/(gramjs|teact))(/.*|$)\'', '\'^(\\\\.+/)+(lib)(?!/gramjs)(/.*|$)\''));
  }

  step('Migration commit 2: the import codemod (plan §6a) and the deletion of the vendored Teact');
  run(process.execPath, [join(ROOT, 'scripts/canary/web-a/teact-imports.mjs'), appDir]);
  deleteAppFiles(appDir, VENDORED_FILES);
  checkNoOldImports(appDir, ['src', 'tests'], OLD_IMPORT_RE);

  if (options.eslint) {
    step('ESLint --fix on the changed files, before the checks below');
    const changed = readFileSync(join(appDir, '.teact-codemod-changed.txt'), 'utf8').split('\n').filter(Boolean);
    // As the migration does; fails on what it cannot fix. All of Web A at once needs more than Node's default heap.
    run('npx', ['eslint', '--fix', ...changed, 'src/util/schedulers.ts', 'src/util/setupTeact.ts'], { cwd: appDir });
  }

  step('Type-check: tsconfig.json (no errors) and tsconfig.script.json (no new errors)');
  run('npx', ['tsc', '-p', 'tsconfig.json'], { cwd: appDir });
  const scriptCheckAfter = runCaptured('npx', ['tsc', '-p', 'tsconfig.script.json', '--pretty', 'false'], {
    cwd: appDir,
  }).output;
  writeFileSync(join(workDir, 'tsc-script-after.txt'), scriptCheckAfter);
  checkNoNewTscErrors('tsconfig.script.json', scriptErrorsBefore, parseTscErrors(scriptCheckAfter));

  if (!options['skip-tests']) {
    step('Vitest after the migration: no new failures');
    checkNoNewTestFailures(testsFailedBefore, runVitest('vitest-after.json'));
  }

  if (options.build) {
    // Builds other than the mocked one (APP_ENV=test) require API credentials; placeholders do, since the builds are
    // only inspected
    const credentials = {
      TELEGRAM_API_ID: process.env.TELEGRAM_API_ID || '1',
      TELEGRAM_API_HASH: process.env.TELEGRAM_API_HASH || 'canary',
    };
    // Development Teact wherever APP_ENV is not production (Vite resolves `teact-dev`, as config.ts sets DEBUG)
    const builds = [
      { script: 'build:mocked', teact: 'development', devMarkers: 1 },
      { script: 'build:staging', teact: 'development', devMarkers: 1, env: credentials },
      { script: 'build:production', teact: 'production', devMarkers: 0, env: credentials },
    ];

    for (const { script, teact, devMarkers, env } of builds) {
      step(`Build with ${teact} Teact (${script}) and check bundle markers`);
      run('npm', ['run', script], { cwd: appDir, env });
      checkMarkers(script, countMarkers(join(appDir, 'dist'), [DEV_MARKER, SIGNAL_MARKER, REACT_MARKER]), {
        [DEV_MARKER]: devMarkers, [SIGNAL_MARKER]: 1, [REACT_MARKER]: 0,
      });
    }
  }

  finishStep();
  console.log(`\nWeb A canary passed (${commit}). The app copy is in ${appDir}`);
} catch (error) {
  finishStep();
  console.error(`\nWeb A canary FAILED: ${error.message}\nThe app copy is in ${appDir}`);
  process.exit(1);
}

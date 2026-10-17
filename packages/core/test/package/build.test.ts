// T-build and T-dist: what the production build (dist/) and the development build (dist/dev/) contain
import { describe, expect, test } from 'vitest';

import {
  BUILDS, ENTRIES, LICENSE_BANNER, listBuildFiles, PACKAGE_DIR, readPackageFile,
} from './package';

// Messages from `if (DEBUG)` blocks: in the development build only
const DEV_MARKERS = [
  '[Teact] Children keys are not unique',
  '[Teact] Cached virtual element was moved within tree',
  '[Teact] Slow component render',
  '[TeactN.setGlobal] Attempt to set an outdated global',
  '[TeactN] Slow containers update',
  'GLOBAL CONTAINERS',
];

// Unsafe in extension pages (MV3 content security policy) or tied to a bundler or Node
const FORBIDDEN_IN_JS = [
  { name: '`process.env`', pattern: /\bprocess\.env\b/ },
  { name: '`import.meta.env`', pattern: /\bimport\.meta\.env\b/ },
  { name: '`eval(`', pattern: /\beval\s*\(/ },
  { name: '`new Function`', pattern: /\bnew\s+Function\b/ },
];

// The helper types that the apps declare globally; the package imports its own (src/types.ts)
const APP_GLOBAL_TYPES = ['AnyLiteral', 'AnyFunction', 'AnyToVoidFunction', 'NoneToVoidFunction', 'Falsy'];

// An import from a chunk, or an export of names, from a chunk or imported before
const REEXPORT_STATEMENT = /^(import \{[^}]*\} from "\.\/[\w-]+\.js"|export \{[^}]*\}( from "\.\/[\w-]+\.js")?);$/;

const jsFiles = (build: (typeof BUILDS)[number]) => listBuildFiles(build).filter((path) => path.endsWith('.js'));
const declarationFiles = listBuildFiles('dist').filter((path) => path.endsWith('.d.ts'));

describe.each(BUILDS)('%s', (build) => {
  test('every JavaScript file starts with the license banner', () => {
    for (const path of jsFiles(build)) {
      expect(readPackageFile(path).startsWith(`${LICENSE_BANNER}\n`), path).toBe(true);
    }
  });

  test('source maps embed their sources (entries that only re-export chunks have none)', () => {
    const mapped = jsFiles(build).filter((path) => readPackageFile(path).includes('\n//# sourceMappingURL='));

    expect(mapped.length).toBeGreaterThan(0);
    for (const path of mapped) {
      const sourceMap = JSON.parse(readPackageFile(`${path}.map`)) as { sources: string[]; sourcesContent: string[] };
      expect(sourceMap.sourcesContent, path).toHaveLength(sourceMap.sources.length);
      expect(sourceMap.sourcesContent.every(Boolean), path).toBe(true);
    }
    for (const path of jsFiles(build).filter((file) => !mapped.includes(file))) {
      const statements = readPackageFile(path).split('\n').filter(Boolean).slice(1);
      expect(statements.every((line) => REEXPORT_STATEMENT.test(line)), path).toBe(true);
    }
  });

  test('every entry of the exports map exists', () => {
    expect(listBuildFiles(build)).toEqual(expect.arrayContaining(
      ENTRIES.map(({ files }) => files[build].slice(PACKAGE_DIR.length)),
    ));
  });

  test('no build-time flag is left', () => {
    for (const path of jsFiles(build)) {
      expect(readPackageFile(path), path).not.toMatch(/__TEACT_(DEV|DEBUG_MORE)__/);
    }
  });

  test('signals are marked with `Symbol.for(\'teact.signal\')`, in one module', () => {
    const marked = jsFiles(build).filter((path) => readPackageFile(path).includes('Symbol.for("teact.signal")'));

    expect(marked).toHaveLength(1);
  });

  test.each(FORBIDDEN_IN_JS)('no $name (T-dist)', ({ pattern }) => {
    for (const path of jsFiles(build)) {
      expect(readPackageFile(path), path).not.toMatch(pattern);
    }
  });

  test('`innerHTML` only applies `dangerouslySetInnerHTML` (T-dist)', () => {
    const lines = jsFiles(build).flatMap((path) => readPackageFile(path).split('\n').filter((line) => (
      line.includes('innerHTML')
    )));

    expect(lines.length).toBeGreaterThan(0);
    expect(lines.filter((line) => !line.includes('key === "dangerouslySetInnerHTML"'))).toEqual([]);
  });
});

describe('Development markers', () => {
  test.each(DEV_MARKERS)('"%s" is in dist/dev only', (marker) => {
    const inBuild = (build: (typeof BUILDS)[number]) => jsFiles(build).some((path) => (
      readPackageFile(path).includes(marker)
    ));

    expect(inBuild('dist/dev')).toBe(true);
    expect(inBuild('dist')).toBe(false);
  });
});

describe('Declarations', () => {
  test('are emitted once, in dist/, without declaration maps or references to them', () => {
    expect(declarationFiles.length).toBeGreaterThan(0);
    expect(listBuildFiles('dist/dev').filter((path) => path.includes('.d.ts'))).toEqual([]);
    expect(listBuildFiles('dist').filter((path) => path.endsWith('.d.ts.map'))).toEqual([]);
    expect(declarationFiles.filter((path) => readPackageFile(path).includes('sourceMappingURL'))).toEqual([]);
  });

  test('every declaration file, jsx.d.ts included, starts with the license banner', () => {
    expect(declarationFiles).toContain('dist/jsx.d.ts');
    for (const path of declarationFiles) {
      expect(readPackageFile(path).startsWith(`${LICENSE_BANNER}\n`), path).toBe(true);
    }
  });

  test('the entries that apps use for JSX reference jsx.d.ts, which augments React\'s JSX types', () => {
    const reference = '/// <reference path="./jsx.d.ts" />';

    for (const path of ['dist/index.d.ts', 'dist/jsx-runtime.d.ts', 'dist/jsx-dev-runtime.d.ts']) {
      expect(readPackageFile(path).split('\n').slice(0, 2), path).toEqual([LICENSE_BANNER, reference]);
    }
    expect(readPackageFile('dist/jsx.d.ts')).toContain('declare module \'react\'');
    expect(readPackageFile('dist/jsx.d.ts')).not.toContain('teactExperimentControlled');
  });

  test('use no name that they do not declare or import, such as the apps\' global helper types', () => {
    const undeclared = declarationFiles.flatMap((path) => {
      const source = readPackageFile(path);

      return APP_GLOBAL_TYPES
        .filter((name) => new RegExp(`\\b${name}\\b`).test(source))
        .filter((name) => !new RegExp(`(\\btype ${name}\\b|^import .*\\b${name}\\b)`, 'm').test(source))
        .map((name) => `${path}: ${name}`);
    });

    expect(undeclared).toEqual([]);
  });

  test('do not mention `moveBefore`, which TypeScript 5.8 does not know (H12)', () => {
    for (const path of declarationFiles) {
      expect(readPackageFile(path), path).not.toContain('moveBefore');
    }
  });
});

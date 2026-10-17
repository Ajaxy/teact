// The built package as the exports map describes it. The tests in this directory need `npm run build` first.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

type ExportTarget = { types: string; 'teact-dev': string; default: string };

// Set by vitest.config.ts (`import.meta.url` is not a file URL in the jsdom environment)
export const PACKAGE_DIR = process.env.TEACT_PACKAGE_DIR!;

const packageJson = JSON.parse(readFileSync(join(PACKAGE_DIR, 'package.json'), 'utf8')) as {
  name: string;
  version: string;
  exports: Record<string, ExportTarget | string>;
};

export const LICENSE_BANNER = `/*! ${packageJson.name} v${packageJson.version} | MIT License | `
  + '(c) Alexander Zinchuk and contributors */';

export const BUILDS = ['dist', 'dist/dev'] as const;
export type Build = (typeof BUILDS)[number];

/** Every subpath of the exports map with its files, as absolute paths */
export const ENTRIES = Object.entries(packageJson.exports)
  .filter((entry): entry is [string, ExportTarget] => typeof entry[1] === 'object')
  .map(([subpath, target]) => ({
    specifier: subpath === '.' ? packageJson.name : `${packageJson.name}/${subpath.slice(2)}`,
    types: join(PACKAGE_DIR, target.types),
    files: {
      dist: join(PACKAGE_DIR, target.default),
      'dist/dev': join(PACKAGE_DIR, target['teact-dev']),
    } satisfies Record<Build, string>,
  }));

if (!existsSync(join(PACKAGE_DIR, 'dist/index.js'))) {
  throw new Error('The package is not built: run `npm run build` (or `npm run test:dist`) first');
}

/** Files of a build (paths relative to the package), without the other build's subdirectory */
export function listBuildFiles(build: Build) {
  const dir = join(PACKAGE_DIR, build);

  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(PACKAGE_DIR, join(dir, entry.name)))
    .sort();
}

export function readPackageFile(path: string) {
  return readFileSync(join(PACKAGE_DIR, path), 'utf8');
}

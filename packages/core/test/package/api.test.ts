// T-api on the built package: every entry of both builds exports the documented names (test/api.ts), and its
// declarations export the same values plus the documented types
import * as ts from 'typescript';
import { describe, expect, test } from 'vitest';

import { RUNTIME_EXPORTS, TYPE_EXPORTS } from '../api';
import { BUILDS, ENTRIES } from './package';

describe.each(BUILDS)('%s', (build) => {
  test.each(ENTRIES)('$specifier', async ({ specifier, files }) => {
    const module = await import(/* @vite-ignore */ files[build]) as Record<string, unknown>;

    expect(Object.keys(module).sort()).toEqual([...RUNTIME_EXPORTS[specifier]].sort());
  });
});

describe('Declarations', () => {
  const program = ts.createProgram(ENTRIES.map(({ types }) => types), {
    noEmit: true,
    strict: true,
    skipLibCheck: true,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
  });
  const checker = program.getTypeChecker();

  test.each(ENTRIES)('$specifier', ({ specifier, types }) => {
    const moduleSymbol = checker.getSymbolAtLocation(program.getSourceFile(types)!)!;
    const names = checker.getExportsOfModule(moduleSymbol).map(({ name }) => name);

    expect(names.sort()).toEqual([...RUNTIME_EXPORTS[specifier], ...TYPE_EXPORTS[specifier]].sort());
  });

  test('`@teact/core` declares its default export as `{ createElement, Fragment }`', () => {
    const { types } = ENTRIES.find(({ specifier }) => specifier === '@teact/core')!;
    const moduleSymbol = checker.getSymbolAtLocation(program.getSourceFile(types)!)!;
    const defaultExport = checker.getExportsOfModule(moduleSymbol).find(({ name }) => name === 'default')!;
    const defaultType = checker.getTypeOfSymbol(defaultExport);

    expect(defaultType.getProperties().map(({ name }) => name).sort()).toEqual(['Fragment', 'createElement']);
  });
});

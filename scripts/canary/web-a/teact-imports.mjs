#!/usr/bin/env node
// Codemod: rewrites Telegram Web A's imports of its vendored Teact (src/lib/teact, src/lib/fasterdom, src/util/signals)
// to the `@teact/core` entry points (extraction plan §6a). Web A commits it as dev/codemods/teactImports.mjs in the
// migration PR; scripts/canary/web-a/run.mjs runs this copy.
//
// Usage: node teact-imports.mjs <repoRoot> [--dry]
// Then: npx eslint --fix $(cat .teact-codemod-changed.txt), which merges duplicate imports (import-x/no-duplicates)
// and sorts them (simple-import-sort).
//
// Based on the copy verified for the plan (plan-wa-inventory/codemod/teact-imports.mjs). Changes: `cleanupEffect` is
// exported from the package root now, so imports from util/signals are no longer split; a type-only import of an entry
// that the file also imports values from is merged into the value import (see `mergeTypeImports`); the run fails when
// an import of the vendored Teact is left unmapped.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const dry = process.argv.includes('--dry');

// Vendored module (repo-relative, no extension) -> package subpath
const MODULE_MAP = {
  'src/lib/teact/teact': '@teact/core',
  'src/lib/teact/heavyAnimation': '@teact/core',
  'src/lib/teact/teact-dom': '@teact/core/dom',
  'src/lib/teact/teactn': '@teact/core/teactn',
  'src/lib/teact/jsx-runtime': '@teact/core/jsx-runtime',
  'src/lib/teact/jsx-dev-runtime': '@teact/core/jsx-dev-runtime',
  'src/lib/teact/dom-events': '@teact/core/internal',
  'src/lib/fasterdom/fasterdom': '@teact/core/fasterdom',
  'src/lib/fasterdom/stricterdom': '@teact/core/fasterdom',
  'src/util/signals': '@teact/core',
};
// Names that must go to a different subpath than the module default (the statement gets split)
const NAME_OVERRIDES = {};
const SKIP_PREFIXES = ['src/lib/teact/', 'src/lib/fasterdom/'];
const SKIP_FILES = new Set(['src/util/signals.ts']);

const STMT_RE = /(^|[;\n])([ \t]*)(import|export)(\s+)((?:type\s+)?[^'";]*?)(\s+from\s+)(['"])([^'"]+)\7(;?)/gs;
const DYN_RE = /\b(import|vi\.mock|vi\.doMock|vi\.importActual)\(\s*(['"])([^'"]+)\2/g;

function resolveTarget(fileRel, spec) {
  let base;
  if (spec === '@teact' || spec === '@teact.ts') base = 'src/lib/teact/teact';
  else if (spec.startsWith('@teact/') && !spec.startsWith('@teact/core')) base = `src/lib/teact/${spec.slice(7)}`;
  else if (spec.startsWith('.')) base = path.posix.normalize(path.posix.join(path.posix.dirname(fileRel), spec));
  else return undefined;
  base = base.replace(/\.(tsx?|jsx?)$/, '');
  return base;
}

function splitNames(clause) {
  // returns { typeOnly, defaultName, ns, specifiers: [{ text, name }] } or undefined if not splittable
  const typeOnly = /^type\s/.test(clause);
  const body = typeOnly ? clause.replace(/^type\s+/, '') : clause;
  const m = body.match(/^\s*(?:([A-Za-z_$][\w$]*)\s*,?\s*)?(?:\{([^}]*)\})?\s*$/s);
  if (!m) return undefined;
  const specifiers = (m[2] || '').split(',').map((s) => s.trim()).filter(Boolean).map((text) => ({
    text,
    name: text.replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim(),
  }));
  return { typeOnly, defaultName: m[1], specifiers };
}

const stats = {
  files: 0, statements: 0, bySubpath: {}, unmapped: [], mergedTypeImports: 0,
};

// A file that imported values from one vendored module and only types from another (`import type { Signal } from
// '../util/signals'`) now has a value import and a type-only import of the same entry. `eslint --fix`
// (import-x/no-duplicates) merges such a pair wrongly when the value import has inline `type` specifiers: it produced
// `import type { type ElementRef, memo, … }` in Message.tsx, which does not compile. So the type-only import is merged
// into the value import here, as inline `type` specifiers.
const VALUE_IMPORT_RE = /^import (?!type\s)(?:[\w$]+\s*,\s*)?\{([^}]*)\} from (['"])(@teact\/core[^'"]*)\2;$/gm;
const TYPE_IMPORT_RE = /^import type \{([^}]*)\} from (['"])(@teact\/core[^'"]*)\2;\n/gm;

function mergeTypeImports(source) {
  const valueImports = new Map([...source.matchAll(VALUE_IMPORT_RE)].map((match) => [match[3], match]));

  let result = source;
  for (const [statement, names, , specifier] of source.matchAll(TYPE_IMPORT_RE)) {
    const valueImport = valueImports.get(specifier);
    if (!valueImport) continue;

    const [valueStatement, valueNames] = valueImport;
    const existing = new Set(valueNames.split(',').map((name) => name.trim().replace(/^type\s+/, '')));
    const added = names.split(',').map((name) => name.trim()).filter((name) => name && !existing.has(name));
    const isMultiline = valueNames.includes('\n');
    const mergedNames = isMultiline
      ? `${valueNames.replace(/,?\s*$/, ',\n')}${added.map((name) => `  type ${name},\n`).join('')}`
      : ` ${[valueNames.trim().replace(/,$/, ''), ...added.map((name) => `type ${name}`)].join(', ')} `;
    const mergedStatement = valueStatement.replace(`{${valueNames}}`, `{${mergedNames}}`);

    result = result.replace(statement, '').replace(valueStatement, mergedStatement);
    valueImports.set(specifier, [mergedStatement, mergedNames]);
    stats.mergedTypeImports++;
  }

  return result;
}

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = ['src', 'tests'].flatMap((d) => (fs.existsSync(path.join(root, d)) ? walk(path.join(root, d), []) : []));
const changedFiles = [];

for (const full of files) {
  const rel = path.relative(root, full).split(path.sep).join('/');
  if (SKIP_FILES.has(rel) || SKIP_PREFIXES.some((p) => rel.startsWith(p))) continue;
  const src = fs.readFileSync(full, 'utf8');
  let changed = false;

  let out = src.replace(STMT_RE, (all, lead, indent, kw, sp1, clause, fromPart, q, spec, semi) => {
    const target = resolveTarget(rel, spec);
    if (!target) return all;
    const subpath = MODULE_MAP[target];
    if (!subpath) {
      if (target.startsWith('src/lib/teact/') || target.startsWith('src/lib/fasterdom/')) {
        stats.unmapped.push(`${rel}: ${spec}`);
      }
      return all;
    }
    changed = true;
    stats.statements++;
    const overrides = NAME_OVERRIDES[target];
    const parsed = overrides && splitNames(clause);
    if (parsed && parsed.specifiers.some((s) => overrides[s.name])) {
      const groups = new Map();
      for (const s of parsed.specifiers) {
        const sp = overrides[s.name] || subpath;
        if (!groups.has(sp)) groups.set(sp, []);
        groups.get(sp).push(s.text);
      }
      const stmts = [...groups].map(([sp, specs]) => {
        stats.bySubpath[sp] = (stats.bySubpath[sp] || 0) + 1;
        return `${indent}${kw} ${parsed.typeOnly ? 'type ' : ''}{ ${specs.join(', ')} } from ${q}${sp}${q};`;
      });
      return `${lead}${stmts.join('\n')}`;
    }
    stats.bySubpath[subpath] = (stats.bySubpath[subpath] || 0) + 1;
    return `${lead}${indent}${kw}${sp1}${clause}${fromPart}${q}${subpath}${q}${semi}`;
  });

  out = out.replace(DYN_RE, (all, fn, q, spec) => {
    const target = resolveTarget(rel, spec);
    const subpath = target && MODULE_MAP[target];
    if (!subpath) return all;
    changed = true;
    stats.statements++;
    return `${fn}(${q}${subpath}${q}`;
  });

  if (changed) out = mergeTypeImports(out);

  if (changed) {
    stats.files++;
    changedFiles.push(rel);
    if (!dry) fs.writeFileSync(full, out);
  }
}

console.log(JSON.stringify({ ...stats, changedFilesSample: changedFiles.slice(0, 5) }, undefined, 2));
if (!dry) fs.writeFileSync(path.join(root, '.teact-codemod-changed.txt'), `${changedFiles.join('\n')}\n`);

// Any other target under lib/teact or lib/fasterdom has no place in the package
if (stats.unmapped.length) {
  console.error(`Imports of vendored modules that the package does not replace:\n${stats.unmapped.join('\n')}`);
  process.exit(1);
}

#!/usr/bin/env python3
"""Codemod: migrates MyTonWallet from its vendored Teact (src/lib/teact, src/lib/fasterdom, src/util/signals.ts) to
the @teact/core package (extraction plan §6b). Keeps the classic JSX runtime (`import React from '@teact/core'`).
MyTonWallet commits it as dev/codemods/teactImports.py in the migration PR; scripts/canary/mtw/run.mjs runs this copy.
It is the copy verified for the plan (plan-mtw-inventory/codemod_mtw_teact.py), unchanged except for this header.

Usage: python3 -I teact-imports.py <repo_root> [--dry-run]

Rules (resolution-based: every relative specifier is resolved to a file first, so any `../` depth and the
`./lib/...`, `../src/lib/...` and `../fasterdom/...` spellings are covered):
  src/lib/teact/teact.ts           -> '@teact/core'            (INTERNAL_NAMES -> '@teact/core/internal')
  src/lib/teact/heavyAnimation.ts  -> '@teact/core'
  src/util/signals.ts              -> '@teact/core'
  src/lib/teact/teact-dom.ts       -> '@teact/core/dom'
  src/lib/teact/teactn.tsx         -> '@teact/core/teactn'     (its default import `React` -> '@teact/core')
  src/lib/teact/jsx-runtime.ts     -> '@teact/core/jsx-runtime'
  src/lib/teact/jsx-dev-runtime.ts -> '@teact/core/jsx-dev-runtime'
  src/lib/fasterdom/fasterdom.ts   -> '@teact/core/fasterdom'
  src/lib/fasterdom/stricterdom.ts -> '@teact/core/fasterdom'
It rewrites `import ... from`, `export ... from`, `import type ... from`, and the string argument of
`jest.mock` / `jest.requireActual` / `jest.requireMock` / `jest.doMock` / `jest.unmock` / `import()`.
After rewriting, statements of the same kind (value vs `import type`) from the same new specifier are merged
into the first one. Files inside the deleted directories are skipped.
"""
import os
import re
import sys

ROOT = os.path.abspath(sys.argv[1])
DRY = '--dry-run' in sys.argv
SCAN_DIRS = ['src', 'tests']
SKIP_PREFIXES = ('src/lib/teact/', 'src/lib/fasterdom/')
SKIP_FILES = {'src/util/signals.ts'}
EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']

TARGET_MAP = {
    'src/lib/teact/teact.ts': '@teact/core',
    'src/lib/teact/heavyAnimation.ts': '@teact/core',
    'src/util/signals.ts': '@teact/core',
    'src/lib/teact/teact-dom.ts': '@teact/core/dom',
    'src/lib/teact/teactn.tsx': '@teact/core/teactn',
    'src/lib/teact/jsx-runtime.ts': '@teact/core/jsx-runtime',
    'src/lib/teact/jsx-dev-runtime.ts': '@teact/core/jsx-dev-runtime',
    'src/lib/fasterdom/fasterdom.ts': '@teact/core/fasterdom',
    'src/lib/fasterdom/stricterdom.ts': '@teact/core/fasterdom',
}
# Names that are not part of the curated root API (PLAN D10) and live in the unstable `./internal` entry
INTERNAL_NAMES = {
    'VirtualType', 'MountState', 'isParentElement', 'DEBUG_resolveComponentName', 'renderComponent',
    'mountComponent', 'unmountComponent', 'hasElementChanged', 'captureImmediateEffects', 'FC_withDebug',
    'VirtualElementTag', 'VirtualElementComponent', 'VirtualElementFragment', 'VirtualElementChildren',
    'VirtualElementParent', 'VirtualElementReal', 'VirtualElementText', 'VirtualElementEmpty',
}

STMT_RE = re.compile(
    r'''(?P<indent>^[ \t]*)(?P<kw>import|export)(?P<typekw>[ \t]+type)?[ \t]+(?P<clause>(?:(?!\bfrom\b)[^;'"])*?)\s*\bfrom\s*(?P<q>['"])(?P<spec>[^'"]+)(?P=q)(?P<semi>;?)''',
    re.M | re.S,
)
CALL_RE = re.compile(
    r'''(?P<fn>\bjest\.(?:mock|requireActual|requireMock|doMock|unmock|dontMock|setMock)|\bimport)\s*\(\s*(?P<q>['"])(?P<spec>[^'"]+)(?P=q)''')


def resolve(fromfile, spec):
    if not spec.startswith('.'):
        return None
    base = os.path.normpath(os.path.join(os.path.dirname(fromfile), spec))
    for c in [base] + [base + e for e in EXTS] + [os.path.join(base, 'index' + e) for e in EXTS]:
        if os.path.isfile(c):
            return os.path.relpath(c, ROOT)
    return None


def split_clause(clause):
    """-> (default, namespace, [named items as written])"""
    clause = clause.strip()
    default = ns = None
    named = []
    m = re.search(r'\{(.*)\}', clause, re.S)
    head = clause
    if m:
        named = [p.strip() for p in m.group(1).split(',') if p.strip()]
        head = clause[:m.start()]
    head = head.strip().rstrip(',').strip()
    if head:
        nm = re.match(r'\*\s+as\s+(\w+)$', head)
        if nm:
            ns = nm.group(1)
        else:
            parts = [p.strip() for p in head.split(',') if p.strip()]
            for p in parts:
                nm = re.match(r'\*\s+as\s+(\w+)$', p)
                if nm:
                    ns = nm.group(1)
                else:
                    default = p
    return default, ns, named


def bare_name(item):
    return re.sub(r'^type\s+', '', item).split(' as ')[0].strip()


def render(kw, is_type, default, ns, named, spec, indent='', semi=';'):
    parts = []
    if default:
        parts.append(default)
    if ns:
        parts.append(f'* as {ns}')
    if named:
        parts.append('{ ' + ', '.join(named) + ' }')
    clause = ', '.join(parts)
    t = ' type' if is_type else ''
    one = f"{indent}{kw}{t} {clause} from '{spec}'{semi}"
    if len(one) <= 120 or not named:
        return one
    # MTW's max-len is 120: wrap named imports one per line
    head = ', '.join(parts[:-1])
    head = head + ', ' if head else ''
    body = ''.join(f'{indent}  {n},\n' for n in named)
    return f"{indent}{kw}{t} {head}{{\n{body}{indent}}} from '{spec}'{semi}"


def process(path):
    rel = os.path.relpath(path, ROOT)
    src = open(path, encoding='utf-8').read()
    out = []
    pos = 0
    changed = False
    # (kind, spec) -> index in `out` of the first statement record, for merging
    first_stmt = {}
    records = []  # mutable statement records placed into `out`

    for m in STMT_RE.finditer(src):
        target = resolve(path, m.group('spec'))
        new_spec = TARGET_MAP.get(target) if target else None
        if not new_spec:
            continue
        changed = True
        out.append(src[pos:m.start()])
        pos = m.end()
        kw = m.group('kw')
        is_type = bool(m.group('typekw'))
        default, ns, named = split_clause(m.group('clause'))
        pieces = []  # (spec, default, ns, named)
        if kw == 'import' and new_spec == '@teact/core/teactn' and default:
            pieces.append(('@teact/core', default, None, []))
            default = None
        if new_spec == '@teact/core':
            internal = [n for n in named if bare_name(n) in INTERNAL_NAMES]
            if internal:
                pieces.append(('@teact/core/internal', None, None, internal))
                named = [n for n in named if n not in internal]
        if default or ns or named:
            pieces.insert(0, (new_spec, default, ns, named))
        emitted = 0
        for spec, d, n, nm in pieces:
            key = (kw, is_type, spec)
            if kw == 'import' and key in first_stmt and not n and not first_stmt[key]['ns']:
                rec = first_stmt[key]
                if d and rec['default'] and rec['default'] != d:
                    pass  # conflicting default names: keep separate
                else:
                    rec['default'] = rec['default'] or d
                    for item in nm:
                        if bare_name(item) not in {bare_name(x) for x in rec['named']}:
                            rec['named'].append(item)
                    continue
            rec = dict(kw=kw, is_type=is_type, default=d, ns=n, named=list(nm), spec=spec,
                       indent=m.group('indent'), semi=m.group('semi') or ';')
            records.append(rec)
            if kw == 'import':
                first_stmt.setdefault(key, rec)
            out.append(rec)
            out.append('\n')
            emitted += 1
        if emitted:
            out.pop()  # drop the separator after the last piece
        elif src[pos:pos + 1] == '\n':
            pos += 1  # the whole statement was merged into an earlier one: drop its line too
    out.append(src[pos:])

    def emit(x):
        if isinstance(x, dict):
            return render(x['kw'], x['is_type'], x['default'], x['ns'], x['named'], x['spec'], x['indent'], x['semi'])
        return x

    new_src = ''.join(emit(x) for x in out)

    def call_sub(m):
        nonlocal changed
        target = resolve(path, m.group('spec'))
        new_spec = TARGET_MAP.get(target) if target else None
        if not new_spec:
            return m.group(0)
        changed = True
        return f"{m.group('fn')}({m.group('q')}{new_spec}{m.group('q')}"

    new_src = CALL_RE.sub(call_sub, new_src)
    if changed and new_src != src:
        if not DRY:
            open(path, 'w', encoding='utf-8').write(new_src)
        return rel
    return None


changed_files = []
for d in SCAN_DIRS:
    for dp, dn, fn in os.walk(os.path.join(ROOT, d)):
        for f in fn:
            if not re.search(r'\.(ts|tsx|js|jsx|mjs|cjs)$', f):
                continue
            p = os.path.join(dp, f)
            rel = os.path.relpath(p, ROOT)
            if rel.startswith(SKIP_PREFIXES) or rel in SKIP_FILES:
                continue
            r = process(p)
            if r:
                changed_files.append(r)
print(f'{"would change" if DRY else "changed"} {len(changed_files)} files')

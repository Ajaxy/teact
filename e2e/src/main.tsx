// The e2e fixtures app: `?test=<Name>` renders one test component into `#test-root`; without it, a list of links.
// Components are loaded on demand, so the side effects of one (testTick.tsx renders itself, TestNoRedundancy.tsx
// sets `document.ondblclick`) do not reach the others.
import type { FC } from '@teact/core';
import TeactDOM from '@teact/core/dom';

const MODULES: Record<string, () => Promise<{ default?: FC }>> = Object.fromEntries(
  Object.entries({
    // Telegram Web A's src/components/test, verbatim (byte-identical to telegram-tt@f67a40879, as recorded in
    // e2e/UPSTREAM and checked by scripts/check-e2e-upstream.mjs), except TestLocale.tsx and demo/, which need Web A's
    // localization and styles. App modules they import resolve to `stubs/`.
    ...import.meta.glob<{ default?: FC }>('./components/test/*.tsx'),
    // Ported from Ajaxy/teact#6/#7 and the regression specs written for them
    ...import.meta.glob<{ default?: FC }>('./fixtures/*.tsx'),
  }).map(([path, load]) => [path.replace(/^.*\/(\w+)\.tsx$/, '$1'), load]),
);

const root = document.getElementById('test-root')!;

async function main() {
  const name = new URLSearchParams(window.location.search).get('test');

  if (!name) {
    TeactDOM.render(<TestList />, root);
    return;
  }

  const load = MODULES[name];
  if (!load) {
    root.textContent = `Unknown test: ${name}`;
    return;
  }

  const { default: Component } = await load();
  // Modules without a default export (testTick.tsx) render themselves
  if (Component) {
    TeactDOM.render(<Component />, root);
  }

  document.documentElement.dataset.test = name;
}

function TestList() {
  return (
    <ul>
      {Object.keys(MODULES).sort().map((name) => (
        <li key={name}><a href={`?test=${name}`}>{name}</a></li>
      ))}
    </ul>
  );
}

void main();

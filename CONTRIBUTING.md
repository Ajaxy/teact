# Contributing to Teact

Thank you for helping. Teact runs [Telegram Web A](https://web.telegram.org/a) and [MyTonWallet](https://mytonwallet.io), so changes are reviewed with both apps in mind: small, tested pull requests with a clear reason go in fastest.

Report security vulnerabilities privately, as [SECURITY.md](SECURITY.md) describes, not in issues or pull requests.

## Teact changes land here first

This repository is the source of Teact. A change to Teact goes through a pull request here, is released as a new version of `@teact/core`, and reaches the apps when each of them updates its pinned version. When an app needs a fix before it is released, the app can patch the package (for example with `patch-package`) and link the pull request here; the patch goes away with the next version bump.

### Until the apps use the package

Web A and MyTonWallet still contain their own copies of Teact until their migration pull requests switch them to `@teact/core`. Until then, the copies are kept in sync this way:

- [`packages/core/UPSTREAM`](packages/core/UPSTREAM) records the Web A commit that the package was imported from, and MyTonWallet's baseline.
- `npm run upstream:check -- --web-a <checkout> --mtw <checkout>` lists the commits in the apps that changed their copy of Teact since then, with a diff against the package. It exits with 1 when there are any.
- Each such change is ported here in a pull request of its own, which names the app commit and comes with a test and a changeset like any other change.
- A change made here first reaches each app with its switch to the package.

Once both apps use the package, their copies are gone, and `UPSTREAM` and the check are retired.

## Every change needs a test and a changeset

### Tests

- A bug fix comes with a test that fails without the fix.
- A behaviour change updates the tests that describe the old behaviour. If it fixes an entry in [KNOWN-ISSUES.md](KNOWN-ISSUES.md), the test that pinned the bug changes its assertion and its title, and the entry is removed.
- Put the test where the behaviour can be observed:
  - `packages/core/test/unit`: Vitest with jsdom, for logic that needs no layout, such as signals, schedulers, TeactN and error routing.
  - `packages/core/test/browser`: Vitest in real browsers, for rendering, events, inputs and frame timing.
  - `e2e/specs`: Playwright on a built app, for whole components. The components in `e2e/src/components/test` are copied verbatim from Web A (`npm run check:e2e-upstream` checks that); add new ones to `e2e/src/fixtures`.
  - `packages/core/test/package`: checks of the built package.
- A change to the renderer (`packages/core/src/lib/teact/teact-dom.ts`) should keep `npm run test:mutations` passing: every mutant in the script must still be caught.

### Changesets

Every pull request that changes the published package adds a changeset:

```sh
npx changeset
```

Pick `@teact/core` and the bump, and write the summary for the changelog: what changes for users of the package, not how it is implemented. While Teact is at 0.x, use `minor` for a change in behaviour or API and `patch` for a fix that keeps the documented behaviour. A pull request that changes nothing in the package, such as tests, CI or documentation, needs no changeset.

The repository is in prerelease mode (`.changeset/pre.json`), so releases are `0.1.0-next.N`. During this phase, Changesets prints `Package teact-demo must depend on the current version of @teact/core` and the same for the other private workspaces; they depend on `*` on purpose, and the message can be ignored. Maintainers release by merging the "Release: Version packages" pull request that `.github/workflows/release.yml` keeps up to date.

## Performance changes need numbers

A pull request made for performance includes measurements from before and after the change: the same machine, browser and build, with the method described, so that a reviewer can repeat them. Possible methods:

- the [benchmark](benchmark/README.md): `npm run build:benchmark`, then `npm run preview -w teact-benchmark`;
- a browser profile of a scenario in Web A or MyTonWallet;
- a focused micro-benchmark, included in the pull request.

Report the medians of several runs, not one run. A change that makes something faster and something else slower says so.

## Size budget

`npm run size` bundles two apps against the production build, minifies them and measures them gzipped: a counter app, and an app that imports everything from `@teact/core` and `@teact/core/dom`. The limits are in [`packages/core/.size-limit.js`](packages/core/.size-limit.js), and CI fails above them. A change that needs more raises the limit, and the recorded baseline next to it, in the same pull request, and explains why.

## Pull requests

- **Title:** `<Area>: <Imperative summary>`, like the commit messages in this repository, for example `TeactDOM: Keep the caret when a controlled input rejects a character`. Areas: `Teact`, `TeactDOM`, `TeactN`, `Fasterdom`, `Types`, `Build`, `Tests`, `CI`, `Docs`, `Benchmark`.
- Keep a pull request to one change. Refactorings go in pull requests of their own.
- Describe the reason for the change and how you tested it. The pull request template lists the rest.

### Developer Certificate of Origin

Sign off every commit:

```sh
git commit -s
```

This adds a line `Signed-off-by: Your Name <your@email>` to the commit message. With it, you certify the [Developer Certificate of Origin 1.1](https://developercertificate.org): that you wrote the change, or otherwise have the right to submit it under this project's MIT license. Use your real name. To sign off commits that you already made, run `git rebase --signoff main` and push with `--force-with-lease`.

## Development

Requirements: Node.js 24 (see `.nvmrc`) and npm 11.

```sh
npm ci
npx playwright install chromium        # browser tests and e2e; add firefox and webkit to test those too
```

| Command | What it does |
|---|---|
| `npm run lint` | ESLint over the whole repository |
| `npm run typecheck` | TypeScript in every workspace |
| `npm run build` | Builds `@teact/core` into `packages/core/dist` (production and development builds, declarations) |
| `npm test` | Unit, browser and package tests |
| `npm run test:unit` | Vitest with jsdom |
| `npm run test:browser` | Vitest in Chromium; `TEACT_BROWSERS=chromium,firefox,webkit` (or `all`) for more |
| `npm run test:dist` | Builds the package and checks the build: entry points, exports, side effects, development markers |
| `npm run test:types` | Packs the package and type-checks it with TypeScript 5.8 and 6.0, outside the workspace |
| `npm run test:e2e` | Builds the e2e app and runs Playwright on it |
| `npm run test:mutations` | Injects known bugs into the renderer and checks that the tests catch each of them |
| `npm run size` | The size budget |
| `npm run dev:demo` | The demo on a Vite dev server |
| `npm run build:site` | The GitHub Pages site: landing page, demo, benchmark and the Fasterdom article |
| `npm run canary:web-a -- --app <checkout>`, `npm run canary:mtw -- --app <checkout>` | Migrates a checkout of an app to the packed package and runs its checks |

On every pull request, CI runs lint, the type checks, the build, `publint`, `attw` and the site build, and these suites: unit, browser, package (`test:dist`, `test:types` and the size budget) and e2e. The browser tests must pass in Chromium, Firefox and WebKit. CI does not run `npm run test:mutations`: run it locally when you change the renderer, as [Tests](#tests) asks. The canaries run on pull requests that change the package.

## Code style

ESLint and the existing code set the style. Teact's source follows Web A's conventions, so that changes can be compared with the apps: two-space indentation, single quotes, semicolons, trailing commas and lines of up to 120 characters. Comments explain why, not what.

## Code of conduct

Everyone taking part in this project follows the [code of conduct](CODE_OF_CONDUCT.md).

# Benchmark

Renders the same large trees with Teact (this workspace's `@teact/core`), React and Preact, and shows the median time of a render. The library versions are pinned in `package.json`.

```sh
npm run build:benchmark            # builds @teact/core and the page
npm run preview -w teact-benchmark # serves benchmark/dist
```

Measure the built page: `npm run dev:benchmark` serves React's and Preact's development builds, which are much slower. The published page is at https://ajaxy.github.io/teact/benchmark/.

The scenarios are in `src/scenarios.ts`, and each library's adapter is in `src/libraries.ts`.

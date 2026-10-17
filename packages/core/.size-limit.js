// Size budgets for apps built with the production build (`npm run size`): each fixture in size/ is bundled and
// minified with rolldown (@size-limit/preset-small-lib) and measured gzipped.
//
// Baselines recorded in B3 for 0.1.0-next.0: counter 6,099 B, everything 7,513 B. The limits leave about 3% for
// small changes; raise them on purpose, together with the baselines, when Teact grows.
export default [
  {
    name: 'Counter app',
    path: 'size/counter.js',
    gzip: true,
    limit: '6.3 kB',
  },
  {
    name: 'Everything in @teact/core and @teact/core/dom',
    path: 'size/everything.js',
    import: '*',
    gzip: true,
    limit: '7.75 kB',
  },
];

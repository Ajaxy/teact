// size-limit fixture: every export of `@teact/core` and `@teact/core/dom` (production build), so that nothing is
// tree-shaken
export * from '../dist/index.js';
export { default } from '../dist/index.js';
export * from '../dist/dom.js';
export { default as TeactDOM } from '../dist/dom.js';

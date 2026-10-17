// T-noside on the built package: importing any entry of either build, in Node (no DOM) and in a module Worker (no
// `window` or `document`), neither throws nor adds globals or event listeners. Apps import Teact from code that runs
// outside pages too, such as Web A's gramjs worker and MyTonWallet's API worker, extension service worker and SDK.
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { join, normalize, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { type Browser, chromium } from 'playwright';
import {
  afterAll, beforeAll, describe, expect, test,
} from 'vitest';

import { BUILDS, ENTRIES, PACKAGE_DIR } from './package';

type ProbeResult = {
  ok: boolean;
  error?: string;
  exports?: number;
  addedGlobals?: string[];
  listeners?: string[];
};

// Runs before the entry is imported: records the global names and every `addEventListener` call
const PROBE_SETUP = `
const globalNames = new Set(Reflect.ownKeys(globalThis).map(String));
const listeners = [];
const { addEventListener } = EventTarget.prototype;
EventTarget.prototype.addEventListener = function (type, ...args) {
  listeners.push(String(type));
  return addEventListener.call(this, type, ...args);
};
const report = async (entry) => {
  try {
    const module = await import(entry);
    const addedGlobals = Reflect.ownKeys(globalThis).map(String).filter((name) => !globalNames.has(name));
    return { ok: true, exports: Object.keys(module).length, addedGlobals, listeners };
  } catch (error) {
    return { ok: false, error: String(error && error.stack || error) };
  }
};
`;

const NODE_PROBE = `${PROBE_SETUP}
const processListeners = () => ['uncaughtException', 'unhandledRejection']
  .map((event) => process.listenerCount(event));
const processListenersBefore = processListeners();
const result = await report(process.env.TEACT_ENTRY);
if (String(processListeners()) !== String(processListenersBefore)) result.listeners.push('process');
process.stdout.write(JSON.stringify(result));
`;

const WORKER_PROBE = `${PROBE_SETUP}
self.postMessage(await report(new URL(self.location.href).searchParams.get('entry')));
`;

const cases = BUILDS.flatMap((build) => ENTRIES.map(({ specifier, files }) => ({
  name: `${build}: ${specifier}`,
  path: relative(PACKAGE_DIR, files[build]),
})));

function expectNoSideEffects(result: ProbeResult) {
  expect(result.error).toBeUndefined();
  expect(result).toMatchObject({ ok: true, addedGlobals: [], listeners: [] });
  expect(result.exports).toBeGreaterThan(0);
}

describe('In Node, without a DOM', () => {
  test.each(cases)('$name', ({ path }) => {
    const { stdout, stderr, status } = spawnSync(process.execPath, ['--input-type=module', '--eval', NODE_PROBE], {
      env: { ...process.env, TEACT_ENTRY: pathToFileURL(join(PACKAGE_DIR, path)).href },
      encoding: 'utf8',
    });

    expect(stderr).toBe('');
    expect(status).toBe(0);
    expectNoSideEffects(JSON.parse(stdout) as ProbeResult);
  });
});

describe('In a module Worker (Chromium)', () => {
  let server: Server;
  let browser: Browser;
  let origin: string;

  beforeAll(async () => {
    server = createServer(async (request, response) => {
      const { pathname } = new URL(request.url!, 'http://localhost');
      if (pathname === '/probe.js') {
        response.writeHead(200, { 'content-type': 'text/javascript' }).end(WORKER_PROBE);
        return;
      }
      if (pathname === '/') {
        response.writeHead(200, { 'content-type': 'text/html' }).end('<!doctype html><title>T-noside</title>');
        return;
      }

      // Serves the builds only
      const path = normalize(pathname.slice(1));
      if (!path.startsWith('dist/') || !path.endsWith('.js')) {
        response.writeHead(404).end();
        return;
      }

      try {
        const content = await readFile(join(PACKAGE_DIR, path));
        response.writeHead(200, { 'content-type': 'text/javascript' }).end(content);
      } catch {
        response.writeHead(404).end();
      }
    });
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser?.close();
    await new Promise((resolve) => {
      server?.close(resolve);
    });
  });

  test.each(cases)('$name', async ({ path }) => {
    const page = await browser.newPage();
    await page.goto(`${origin}/`);

    // Each entry gets a new worker, so that the globals of one import cannot hide those of another
    const result = await page.evaluate((entryUrl) => new Promise<ProbeResult>((resolve) => {
      const worker = new Worker(`/probe.js?entry=${encodeURIComponent(entryUrl)}`, { type: 'module' });
      worker.onmessage = ({ data }: MessageEvent<ProbeResult>) => {
        worker.terminate();
        resolve(data);
      };
      worker.onerror = (event) => {
        resolve({ ok: false, error: event.message || 'The worker failed to load' });
      };
    }), `${origin}/${path}`);
    await page.close();

    expectNoSideEffects(result);
  });
});

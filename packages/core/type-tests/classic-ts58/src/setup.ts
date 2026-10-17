// An app's Teact setup, as plan steps D and E1 describe it: error routing, dev tools, scheduler re-exports, signals,
// TeactN and the internals that the apps use
import {
  beginHeavyAnimation, cleanupEffect, configureTeact, createSignal, getIsHeavyAnimating, installTeactDevTools, isSignal,
  onFullyIdle, type Signal, type SignalSetter, type TeactConfig, throttleWithFullyIdle,
} from '@teact/core';
import {
  disableStrict, enableStrict, fastRaf, forceMeasure, forceMutation, getPhase, onIdle, onTickEnd, requestForcedReflow,
  requestMeasure, requestMutation, requestNextMutation, type Scheduler, setHandler, setPhase, suppressStrict,
  throttleWith, throttleWithTickEnd,
} from '@teact/core/fasterdom';
import { resolveEventType, VirtualType } from '@teact/core/internal';
import { type ActionOptions, installTeactNDevTools, typify } from '@teact/core/teactn';

// Both apps' `handleError` signatures fit `onError`
function handleWebAError(err: Error) {
  void err;
}
function handleMtwError(err: Error | string) {
  void err;
}
configureTeact({ onError: handleWebAError });
configureTeact({ onError: handleMtwError });
const config: TeactConfig = { onError: console.error };
configureTeact(config);

const DEBUG = Boolean(import.meta);
if (DEBUG) {
  const uninstall: () => void = installTeactDevTools();
  const uninstallTeactN: () => void = installTeactNDevTools();
  uninstall();
  uninstallTeactN();
}

// util/schedulers.ts in the apps: a local import for local helpers, and re-exports
export function rafPromise() {
  return new Promise<void>((resolve) => {
    fastRaf(resolve);
  });
}
export {
  fastRaf, onTickEnd, onIdle, throttleWith, throttleWithTickEnd, type Scheduler,
};

// Signals
const [getCount, setCount] = createSignal(0);
const countSignal: Signal<number> = getCount;
const countSetter: SignalSetter<number> = setCount;
const unsubscribe = countSignal.subscribe(() => countSetter(countSignal() + 1));
unsubscribe();
cleanupEffect(() => undefined);
export const isCount = isSignal(getCount) && !getIsHeavyAnimating();

// Heavy animations and fasterdom
const endAnimation = beginHeavyAnimation(300, true);
onFullyIdle(endAnimation);
const throttled = throttleWithFullyIdle((value: number) => void value);
throttled(1);
requestMeasure(() => {
  const height = document.body.offsetHeight;
  requestMutation(() => {
    document.body.style.height = `${height}px`;
  });
});
requestNextMutation(() => undefined);
requestForcedReflow(() => () => undefined);
setPhase('measure');
forceMutation(() => document.body.append('x'), document.body, getPhase() === 'measure');
forceMeasure(() => document.body.offsetWidth);
suppressStrict(() => undefined);
setHandler((error) => console.error(error));
enableStrict();
disableStrict();
export const throttledOnTickEnd = throttleWithTickEnd(() => undefined);

// TeactN
type GlobalState = { count: number; isReady?: boolean };
type ActionPayloads = { increment: { by: number } | undefined; reset: undefined };

const {
  getGlobal, setGlobal, getActions, addActionHandler, withGlobal,
} = typify<GlobalState, ActionPayloads>();

addActionHandler('increment', (global, actions, payload) => ({ ...global, count: global.count + (payload?.by ?? 1) }));
addActionHandler('reset', (global) => ({ ...global, count: 0 }));
const options: ActionOptions = { forceOnHeavyAnimation: true };
setGlobal({ ...getGlobal(), isReady: true }, options);
getActions().increment({ by: 2 });
getActions().reset();
export const withCount = withGlobal<{ id: string }>((global, { id }) => ({ count: global.count, id }));

// Internals that the apps use (MyTonWallet's tests, Web A's useVideoCleanup)
export const isTag = VirtualType.Tag === 2 && resolveEventType('onDoubleClick', document.body) === 'dblclick';

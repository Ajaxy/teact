import { useRef, useUnmountCleanup } from '../teact/teact';
import { isSignal } from '../util/signals';

export function useSignalEffect(effect: NoneToVoidFunction, dependencies: readonly any[]) {
  // This runs before all effects
  const prevDepsRef = useRef<readonly unknown[]>();
  const subscribedEffectRef = useRef<NoneToVoidFunction>();

  const prevDeps = prevDepsRef.current;
  const hasChanged = !prevDeps
    || dependencies.length !== prevDeps.length
    || dependencies.some((dep, i) => dep !== prevDeps[i]);

  if (hasChanged) {
    if (subscribedEffectRef.current) {
      const currentEffect = subscribedEffectRef.current;
      prevDepsRef.current?.forEach?.((dependency) => {
        if (isSignal(dependency)) {
          dependency.subscribe(currentEffect);
        }
      });
    }

    subscribedEffectRef.current = effect;
    prevDepsRef.current = dependencies;

    dependencies.forEach((dependency) => {
      if (isSignal(dependency)) {
        dependency.subscribe(effect);
      }
    });

    effect();
  }

  useUnmountCleanup(() => {
    if (subscribedEffectRef.current) {
      const currentEffect = subscribedEffectRef.current;
      prevDepsRef.current?.forEach?.((dependency) => {
        if (isSignal(dependency)) {
          dependency.subscribe(currentEffect);
        }
      });
    }
  });
}

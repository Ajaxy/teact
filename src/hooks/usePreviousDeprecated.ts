import { useRef } from '../teact/teact';

export default function usePreviousDeprecated<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>();
  const result = ref.current;
  ref.current = value;
  return result;
}

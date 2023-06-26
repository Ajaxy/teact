import { useRef } from '../teact/teact';
import generateUniqueId from '../util/generateUniqueId';

export default function useUniqueId() {
  const idRef = useRef<string>();

  if (!idRef.current) {
    idRef.current = generateUniqueId();
  }

  return idRef.current;
}

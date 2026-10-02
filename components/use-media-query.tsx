'use client';
import { useCallback, useSyncExternalStore } from 'react';

/**
 * Tracks a CSS media query with `useSyncExternalStore`.
 *
 * The previous version stored the match in state and assigned it inside an
 * effect, which the React Compiler lints as a cascading render: the component
 * paints once with a stale value and again once the effect runs. Reading the
 * query during render avoids the extra pass and keeps the value correct.
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const result = matchMedia(query);
      result.addEventListener('change', onStoreChange);
      return () => result.removeEventListener('change', onStoreChange);
    },
    [query]
  );

  const getSnapshot = useCallback(() => matchMedia(query).matches, [query]);

  // The server has no matchMedia, so assume false to keep hydration consistent.
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
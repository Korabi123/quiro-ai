import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Tracks the mobile breakpoint via `useSyncExternalStore`.
 *
 * The previous implementation stored the match in state and set it inside an
 * effect, which the React Compiler lints as a cascading render: the component
 * paints once with the wrong value, then again once the effect runs.
 * `useSyncExternalStore` reads the match during render instead, and React
 * re-renders automatically when the query changes.
 */
const subscribe = (onStoreChange: () => void) => {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", onStoreChange)
  return () => mql.removeEventListener("change", onStoreChange)
}

const getSnapshot = () => window.innerWidth < MOBILE_BREAKPOINT

/**
 * The value read on the server and during the hydration render. Returning
 * `false` keeps the first client render identical to the server's, so there is
 * no hydration mismatch before the real value is read.
 */
const getServerSnapshot = () => false

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
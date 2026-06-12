import { useSyncExternalStore } from "react"

const emptySubscribe = () => () => {}

/**
 * False on the server and during hydration's first render, true after mount.
 * Gate localStorage-backed state behind this to avoid hydration mismatches.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

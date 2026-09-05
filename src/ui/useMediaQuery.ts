// Viewport queries as React state.

import { useEffect, useState } from 'react'

/** Matches Tailwind's `lg` breakpoint: the width at which the navigation rail appears. */
export const DESKTOP_QUERY = '(min-width: 1024px)'

/** True when `query` matches; false during server-less first render until the effect runs. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => (typeof window !== 'undefined' && 'matchMedia' in window ? window.matchMedia(query).matches : false))
  useEffect(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return
    const mql = window.matchMedia(query)
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP_QUERY)
}

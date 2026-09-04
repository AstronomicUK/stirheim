// Sets the browser tab title for a screen and puts the previous one back when the screen unmounts.
// Kept tiny so any page can adopt it with one line.

import { useEffect } from 'react'

export const APP_NAME = 'Stirheim'

/** "Your warbands · Stirheim"; an empty title gives just "Stirheim". */
export function pageTitle(title: string | null | undefined): string {
  const t = title?.trim()
  return t ? `${t} · ${APP_NAME}` : APP_NAME
}

export function usePageTitle(title: string | null | undefined): void {
  useEffect(() => {
    if (typeof document === 'undefined') return
    const previous = document.title
    document.title = pageTitle(title)
    return () => {
      document.title = previous
    }
  }, [title])
}

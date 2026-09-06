// Getting out of a page on a phone. The tab bar can only reach the five roots, so anything deeper —
// a warband, a match, the trading post — needs a way back. Shown in the phone header on every page
// that is not itself a tab root; the desktop rail makes it unnecessary above `lg`.

import { useLocation, useNavigate } from 'react-router'
import { Icon } from '../ui/icons'

/** The tab roots: at one of these, back would leave the app. */
const ROOTS = new Set(['/', '/campaigns', '/scenarios', '/simulator', '/account'])

/** One level up from a path: "/warbands/x/trading" -> "/warbands/x". */
function parentOf(pathname: string): string {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean)
  if (parts.length <= 1) return '/'
  return `/${parts.slice(0, -1).join('/')}`
}

export function BackButton() {
  const { pathname, key } = useLocation()
  const navigate = useNavigate()
  if (ROOTS.has(pathname)) return null

  // A page opened directly (a shared link, a refresh) has no history to go back to: go up instead.
  const fresh = key === 'default'
  return (
    <button
      type="button"
      onClick={() => (fresh ? navigate(parentOf(pathname)) : navigate(-1))}
      className="-ml-2 flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-semibold text-ink-dim hover:text-ink"
    >
      <Icon name="back" size={20} />
      Back
    </button>
  )
}

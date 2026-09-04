import { NavLink } from 'react-router'

const tabs = [
  { to: '/', label: 'Warbands', end: true },
  { to: '/campaigns', label: 'Campaigns', end: false },
  { to: '/scenarios', label: 'Scenarios', end: false },
  { to: '/account', label: 'Account', end: false },
]

/** Phone-style bottom tab bar, shown only when signed in. Hidden in print (data-print-hide). */
export function BottomNav() {
  return (
    <nav
      data-print-hide
      aria-label="Main"
      className="sticky bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80"
    >
      <ul className="mx-auto grid w-full max-w-md grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((t) => (
          <li key={t.to}>
            <NavLink
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex min-h-12 items-center justify-center text-xs font-medium tracking-wide ${
                  isActive ? 'text-brass' : 'text-ink-dim hover:text-ink'
                }`
              }
            >
              {t.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

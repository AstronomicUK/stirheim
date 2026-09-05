import { Link, NavLink } from 'react-router'
import { Icon } from '../ui/icons'
import { NAV_TABS } from './navTabs'
import { useSession } from './session'

/** Desktop navigation: a fixed-width rail with the wordmark, the four tabs and who is signed in. */
export function SideRail() {
  const user = useSession((s) => s.user)
  const profile = useSession((s) => s.profile)
  return (
    <aside data-print-hide className="sticky top-0 hidden h-dvh flex-col gap-7 border-r border-border bg-surface-low px-4 pb-6 pt-6 lg:flex">
      <Link to="/" className="block px-2 no-underline" aria-label="Stirheim, your warbands">
        <img src="/brand/stirheim-logo-tight.png" alt="Stirheim" width={740} height={250} className="h-auto w-full drop-shadow-[0_3px_6px_rgba(36,31,26,0.2)]" />
        <span className="mt-2 block text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-dim">Campaign ledger</span>
      </Link>
      <nav aria-label="Main">
        <ul className="flex flex-col gap-1">
          {NAV_TABS.map((t) => (
            <li key={t.to}>
              <NavLink
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-md px-3 text-[15px] font-semibold no-underline transition-colors ${
                    isActive ? 'bg-surface text-ink shadow-[inset_3px_0_0_var(--color-brass)]' : 'text-ink-dim hover:bg-surface hover:text-ink'
                  }`
                }
              >
                <Icon name={t.icon} size={20} />
                {t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      {user ? (
        <div className="mt-auto px-3 text-sm text-ink-dim">
          <span className="block truncate font-semibold text-ink">{profile?.display_name ?? 'Signed in'}</span>
          <span className="block truncate text-xs">{user.email}</span>
        </div>
      ) : null}
    </aside>
  )
}

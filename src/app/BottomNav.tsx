import { NavLink } from 'react-router'
import { Icon } from '../ui/icons'
import { NAV_TABS } from './navTabs'

/** Phone tab bar: icon over label, 64 px tall. Hidden from `lg`, where the SideRail takes over, and in print. */
export function BottomNav({unread=0}:{unread?:number}) {
  return (
    <nav
      data-print-hide
      aria-label="Main"
      className="sticky bottom-0 z-20 border-t border-border bg-surface-low/95 backdrop-blur supports-[backdrop-filter]:bg-surface-low/85 lg:hidden"
    >
      <ul className="mx-auto grid w-full max-w-md grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {NAV_TABS.map((t) => (
          <li key={t.to}>
            <NavLink
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold no-underline ${isActive ? 'text-brass' : 'text-ink-dim hover:text-ink'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon name={t.icon} size={24} className={isActive ? 'fill-brass/15' : ''} />
                    {t.to==='/account'&&unread>0?<><span aria-hidden className="absolute -right-1 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface-low bg-brass"/><span className="sr-only">{unread} unread updates. </span></>:null}
                  </span>
                  {t.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

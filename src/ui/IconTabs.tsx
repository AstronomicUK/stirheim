// A row of tiles for switching between the sections of a page (the trading post's counters, who to
// recruit): an icon over a short label, the chosen one raised in brass. Wraps on a phone.

import { Icon, type IconName } from './icons'

export interface IconTab<T extends string> {
  value: T
  label: string
  icon: IconName
  /** One line under the label: "22 gc", "3 items". */
  detail?: string
  /** A count to draw the eye: shown as an oxblood badge. */
  count?: number | null
}

export interface IconTabsProps<T extends string> {
  tabs: IconTab<T>[]
  value: T
  onChange: (value: T) => void
  /** Accessible name for the group. */
  label: string
}

export function IconTabs<T extends string>({ tabs, value, onChange, label }: IconTabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className="grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${tabs.length > 4 ? '5.5rem' : '7rem'}, 1fr))` }}>
      {tabs.map((tab) => {
        const selected = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={`relative flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-md border px-2 py-2 text-center transition-colors ${
              selected ? 'border-brass bg-surface-low text-ink shadow-[inset_0_0_0_1px_var(--color-brass)]' : 'border-border bg-surface-low/60 text-ink-dim hover:bg-surface-high hover:text-ink'
            }`}
          >
            <Icon name={tab.icon} size={22} className={selected ? 'text-brass' : 'text-ink-dim'} />
            <span className="text-xs font-semibold leading-tight">{tab.label}</span>
            {tab.detail ? <span className="text-[11px] leading-tight text-ink-dim">{tab.detail}</span> : null}
            {tab.count !== undefined && tab.count !== null && tab.count > 0 ? (
              <span className="absolute right-1.5 top-1.5 rounded-full bg-accent px-1.5 py-px text-[11px] font-bold leading-4 text-surface-low">{tab.count}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

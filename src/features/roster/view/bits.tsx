// Small presentational pieces shared by the roster cards: tags, the XP bar, section headings and
// equipment lines with optional catalogue descriptions.

import type { ReactNode } from 'react'
import { findItem } from '../../../rules/data/items'
import type { CharacterRole } from '../../../rules/types'
import type { RosterItem } from '../../../rules/types/roster'
import { itemName } from '../shared/names'
import { xpProgress } from './lookups'

type TagTone = 'neutral' | 'warn' | 'danger' | 'brass'

const tagTones: Record<TagTone, string> = {
  neutral: 'border-border text-ink-dim',
  warn: 'border-warn/60 text-warn',
  danger: 'border-accent-strong/60 text-accent-strong',
  brass: 'border-brass/60 text-brass',
}

export function Tag({ tone = 'neutral', children }: { tone?: TagTone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs leading-5 ${tagTones[tone]}`}>{children}</span>
}

export function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xs uppercase tracking-[0.25em] text-ink-dim">{title}</h2>
        {aside ? <span className="text-xs text-ink-dim">{aside}</span> : null}
      </div>
      {children}
    </section>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-md border border-border bg-surface-low ${className}`}>{children}</div>
}

/** Experience against the next advance box, with a badge when advances have been earned but not rolled. */
export function XpBar({ xp, levelUps, role }: { xp: number; levelUps: number; role: CharacterRole }) {
  const p = xpProgress(xp, levelUps, role)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3 text-xs text-ink-dim">
        <span>
          <span className="font-mono tabular-nums text-ink">{xp}</span> xp
          {p.next !== null ? <span> · next advance at {p.next}</span> : <span> · no further advances</span>}
        </span>
        {p.advancesOwed > 0 ? <Tag tone="brass">{p.advancesOwed === 1 ? 'Advance owed' : `${p.advancesOwed} advances owed`}</Tag> : null}
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-surface-high" aria-hidden>
        <div className="h-full bg-brass/80" style={{ width: `${Math.round(p.fraction * 100)}%` }} />
      </div>
    </div>
  )
}

export interface ItemLinesProps {
  items: RosterItem[]
  /** Show the catalogue description, range/strength and special rules under each line. */
  detailed?: boolean
  emptyText?: string
}

export function ItemLines({ items, detailed = false, emptyText = 'No equipment' }: ItemLinesProps) {
  if (items.length === 0) return <p className="text-sm text-ink-dim">{emptyText}</p>
  return (
    <ul className="flex flex-col gap-1.5 text-sm">
      {items.map((item, i) => {
        const catalogue = item.itemId ? findItem(item.itemId) : undefined
        return (
          <li key={`${item.itemId ?? item.customName}-${i}`} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-ink">
                {itemName(item)}
                {item.quantity > 1 ? <span className="text-ink-dim"> ×{item.quantity}</span> : null}
              </span>
              {catalogue?.range || catalogue?.strength ? (
                <span className="shrink-0 font-mono text-xs text-ink-dim">
                  {[catalogue.range, catalogue.strength ? `S ${catalogue.strength}` : null].filter(Boolean).join(' · ')}
                </span>
              ) : null}
            </div>
            {item.notes ? <p className="text-xs text-ink-dim">{item.notes}</p> : null}
            {detailed && catalogue ? (
              <div className="flex flex-col gap-1 border-l border-border pl-3 text-xs leading-relaxed text-ink-dim">
                {catalogue.armourSave ? <p>Armour save {catalogue.armourSave}+</p> : null}
                {catalogue.specialRules.map((rule) => (
                  <p key={rule.name}>
                    <span className="text-ink">{rule.name}.</span> {rule.text}
                  </p>
                ))}
                {catalogue.specialRules.length === 0 && catalogue.description ? <p>{catalogue.description}</p> : null}
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

export function RuleList({ rules }: { rules: { name: string; text: string }[] }) {
  if (rules.length === 0) return null
  return (
    <dl className="flex flex-col gap-2 text-xs leading-relaxed">
      {rules.map((rule) => (
        <div key={rule.name}>
          <dt className="font-medium text-ink">{rule.name}</dt>
          <dd className="whitespace-pre-line text-ink-dim">{rule.text}</dd>
        </div>
      ))}
    </dl>
  )
}

export function KeyValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-ink-dim">{label}</span>
      <span className="font-mono text-base tabular-nums text-ink">{value}</span>
    </div>
  )
}

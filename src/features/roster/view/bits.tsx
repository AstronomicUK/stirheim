// Small presentational pieces shared by the roster cards: tags, the XP bar, section headings and
// equipment lines with optional catalogue descriptions.

import { useState, type ReactNode } from 'react'
import { findItem } from '../../../rules/data/items'
import type { CharacterRole } from '../../../rules/types'
import type { RosterItem } from '../../../rules/types/roster'
import { itemName, itemProfile } from '../shared/names'
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
  /** Open every line's catalogue details from the start (the player can still tap a line to close it). */
  detailed?: boolean
  emptyText?: string
  /** Read-only text lines (printing): no tap targets. */
  plain?: boolean
}

/**
 * The kit as a list. Every line is tappable: a weapon opens to its range, Strength and special
 * rules, armour to its save, anything else to its catalogue text. Range and Strength also sit on
 * the line itself so a bow's reach is one glance away.
 */
export function ItemLines({ items, detailed = false, emptyText = 'No equipment', plain = false }: ItemLinesProps) {
  if (items.length === 0) return <p className="text-sm text-ink-dim">{emptyText}</p>
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {items.map((item, i) => (
        <ItemLine key={`${item.itemId ?? item.customName}-${i}-${detailed ? 'd' : 'c'}`} item={item} open={detailed} plain={plain} />
      ))}
    </ul>
  )
}

function ItemLine({ item, open, plain }: { item: RosterItem; open: boolean; plain: boolean }) {
  const [expanded, setExpanded] = useState(open)
  const catalogue = item.itemId ? findItem(item.itemId) : undefined
  const profile = itemProfile(item)
  const canOpen = !plain && (Boolean(catalogue) || Boolean(item.notes))
  const head = (
    <>
      <span className="text-ink">
        {itemName(item)}
        {item.quantity > 1 ? <span className="text-ink-dim"> ×{item.quantity}</span> : null}
      </span>
      {profile ? <span className="shrink-0 font-mono text-xs text-ink-dim">{profile}</span> : null}
    </>
  )
  return (
    <li className="flex flex-col gap-1">
      {canOpen ? (
        <button type="button" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)} className="flex min-h-9 w-full items-baseline justify-between gap-3 rounded text-left hover:bg-surface-high/60">
          {head}
        </button>
      ) : (
        <div className="flex items-baseline justify-between gap-3 py-1">{head}</div>
      )}
      {expanded && (catalogue || item.notes) ? (
        <div className="flex flex-col gap-1 border-l border-border pl-3 text-xs leading-relaxed text-ink-dim">
          {item.notes ? <p className="text-ink">{item.notes}</p> : null}
          {catalogue?.range ? (
            <p>
              <span className="text-ink">Range.</span> {catalogue.range}
              {catalogue.strength ? (
                <>
                  {' · '}
                  <span className="text-ink">Strength.</span> {catalogue.strength}
                </>
              ) : null}
            </p>
          ) : catalogue?.strength ? (
            <p>
              <span className="text-ink">Strength.</span> {catalogue.strength}
            </p>
          ) : null}
          {catalogue?.armourSave ? <p>Armour save {catalogue.armourSave}+</p> : null}
          {catalogue?.specialRules.map((rule) => (
            <p key={rule.name}>
              <span className="text-ink">{rule.name}.</span> {rule.text}
            </p>
          ))}
          {catalogue && catalogue.specialRules.length === 0 && catalogue.description ? <p>{catalogue.description}</p> : null}
          {catalogue ? (
            <p>
              {catalogue.price.text}
              {catalogue.availability.text ? ` · ${catalogue.availability.text}` : ''}
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
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

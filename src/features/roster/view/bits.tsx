// Small presentational pieces shared by the roster cards: tags, the XP bar, section headings and
// equipment lines with optional catalogue descriptions.

import type { ReactNode } from 'react'
import { findItem } from '../../../rules/data/items'
import type { Item } from '../../../rules/types/items'
import { HoverCard } from '../../../ui/HoverCard'
import type { AdvanceRate } from '../../../rules/data/campaign/experience'
import type { CharacterRole } from '../../../rules/types'
import type { RosterItem } from '../../../rules/types/roster'
import { itemLineName, itemName, itemProfile } from '../shared/names'
import { isPlainNote, xpProgress, xpTrack } from './lookups'
import { useRosterView } from './context'
import { Icon, type IconName } from '../../../ui/icons'

type TagTone = 'neutral' | 'warn' | 'danger' | 'brass'

const tagTones: Record<TagTone, string> = {
  neutral: 'border-border text-ink-dim',
  warn: 'border-warn text-warn',
  danger: 'border-accent text-accent',
  brass: 'border-brass bg-brass text-surface-low',
}

export function Tag({ tone = 'neutral', children }: { tone?: TagTone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold leading-5 ${tagTones[tone]}`}>{children}</span>
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

/**
 * Experience as a segmented track: one segment per gap between advance boxes (2, 4, 6, 8, 11, 14…
 * for heroes; 2, 5, 9, 14 for henchmen), filled to the current total, the next box named. A
 * warrior who has just reached a box shows that box full rather than an empty bar.
 */
/**
 * The experience track as on the roster sheet: one pip per point of experience, every advance box
 * drawn as a taller node, earned points filled in brass. Segments between boxes stay together when
 * the row wraps, so a glance shows how far the next skill is.
 */
export function XpBar({ xp, levelUps, role, rate = 'normal', noExperience = false }: { xp: number; levelUps: number; role: CharacterRole; rate?: AdvanceRate; noExperience?: boolean }) {
  const p = xpProgress(xp, levelUps, role, rate)
  const segments = xpTrack(xp, role, rate)
  if (noExperience) return <p className="text-xs text-ink-dim">Gains no experience.</p>
  const toGo = p.next !== null ? p.next - xp : null
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3 text-xs text-ink-dim">
        <span>
          <span className="font-semibold text-ink">{xp} xp</span>
          {p.next !== null ? (
            <span>
              {' '}· next advance at {p.next} ({toGo} to go){rate === 'half' ? ', half rate' : ''}
            </span>
          ) : (
            <span> · no further advances</span>
          )}
        </span>
        {p.advancesOwed > 0 ? <Tag tone="brass">{p.advancesOwed === 1 ? 'Advance owed' : `${p.advancesOwed} advances owed`}</Tag> : null}
      </div>
      <div className="flex flex-wrap items-end gap-x-1.5 gap-y-1" aria-hidden>
        {segments.map((seg) => (
          <span key={seg.to} className="flex items-end gap-px">
            {Array.from({ length: seg.to - seg.from }, (_, i) => seg.from + i + 1).map((point) => {
              const earned = point <= xp
              const node = point === seg.to
              return (
                <span
                  key={point}
                  title={node ? `Advance at ${point} xp` : `${point} xp`}
                  className={`${node ? 'h-3.5 w-2 rounded-[2px] border' : 'h-2 w-1.5 rounded-[1px]'} ${
                    earned ? (node ? 'border-brass bg-brass' : 'bg-brass') : node ? 'border-ink-dim/70 bg-surface-low' : 'bg-surface-high'
                  }`}
                />
              )
            })}
          </span>
        ))}
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
 * The kit as a list. Hover or tap a name for its rules: a weapon's range, Strength and special
 * rules, armour's save, anything else's catalogue text. Range and Strength also sit on the line
 * itself so a bow's reach is one glance away. `detailed` prints every entry open instead.
 */
export function ItemLines({ items, detailed = false, emptyText = 'No equipment', plain = false }: ItemLinesProps) {
  if (items.length === 0) return <p className="text-sm text-ink-dim">{emptyText}</p>
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {items.map((item, i) => (
        <ItemLine key={`${item.itemId ?? item.customName}-${i}-${detailed ? 'd' : 'c'}`} item={item} companions={items} open={detailed} plain={plain} />
      ))}
    </ul>
  )
}

function ItemLine({ item, companions, open, plain }: { item: RosterItem; companions: RosterItem[]; open: boolean; plain: boolean }) {
  const catalogue = item.itemId ? findItem(item.itemId) : undefined
  const profile = itemProfile(item, companions)
  const hasDetail = Boolean(catalogue) || Boolean(item.notes)
  const line = itemLineName(item)
  const name = (
    <>
      {line.name}
      {line.count > 1 ? <span className="text-ink-dim"> ×{line.count}</span> : null}
    </>
  )
  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3 py-0.5">
        <span className="text-ink">
          {hasDetail && !plain && !open ? (
            <HoverCard label={name} title={itemName(item)}>
              <ItemDetail item={item} catalogue={catalogue} />
            </HoverCard>
          ) : (
            name
          )}
        </span>
        {profile ? <span className="shrink-0 text-xs tabular-nums text-ink-dim">{profile}</span> : null}
      </div>
      {open && hasDetail ? (
        <div className="flex flex-col gap-1 border-l border-border pl-3 text-xs leading-relaxed text-ink-dim">
          <ItemDetail item={item} catalogue={catalogue} />
        </div>
      ) : null}
    </li>
  )
}

/** The first sentence stands; the rest is struck through with the house rule named. */
function HouseRuledText({ text }: { text: string }) {
  const cut = text.indexOf('. ')
  if (cut === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, cut + 1)} <s className="text-ink-dim/70">{text.slice(cut + 2)}</s> <span className="text-ink-dim">(disabled by house rules)</span>
    </>
  )
}

/** Range, Strength, save, special rules, description and price: the catalogue entry as a few lines. */
function ItemDetail({ item, catalogue }: { item: RosterItem; catalogue: Item | undefined }) {
  const { houseRules } = useRosterView()
  const rabbitsFootBattleOnly = item.itemId === 'rabbits_foot' && houseRules?.rabbitsFootBattleOnly === true
  return (
    <>
      {item.notes ? <p className="text-ink">{item.notes}</p> : null}
      {catalogue?.range ? (
        <p>
          <span className="font-semibold text-ink">Range.</span> {catalogue.range}
        </p>
      ) : null}
      {catalogue?.strength ? (
        <p>
          <span className="font-semibold text-ink">Strength.</span> {catalogue.strength}
        </p>
      ) : null}
      {catalogue?.armourSave ? <p>Armour save {catalogue.armourSave}+</p> : null}
      {catalogue?.specialRules.map((rule, i) => (
        <p key={`${rule.name}-${i}`}>
          {isPlainNote(rule.name) ? null : <span className="font-semibold text-ink">{rule.name}. </span>}
          {rabbitsFootBattleOnly ? <HouseRuledText text={rule.text} /> : rule.text}
        </p>
      ))}
      {catalogue && catalogue.specialRules.length === 0 && catalogue.description ? <p>{catalogue.description}</p> : null}
      {catalogue ? (
        <p className="text-ink-dim">
          {catalogue.price.text}
          {catalogue.availability.text ? ` · ${catalogue.availability.text}` : ''}
        </p>
      ) : null}
    </>
  )
}

export function RuleList({ rules }: { rules: { name: string; text: string }[] }) {
  if (rules.length === 0) return null
  return (
    <dl className="flex flex-col gap-2 text-xs leading-relaxed">
      {rules.map((rule, i) => (
        <div key={`${rule.name}-${i}`}>
          {isPlainNote(rule.name) ? null : <dt className="font-medium text-ink">{rule.name}</dt>}
          <dd className="whitespace-pre-line text-ink-dim">{rule.text}</dd>
        </div>
      ))}
    </dl>
  )
}

export function KeyValue({ label, value, icon }: { label: string; value: ReactNode; icon?: IconName }) {
  return (
    <div className="flex items-start gap-2">
      {icon ? <Icon name={icon} size={20} className="mt-0.5 text-brass" /> : null}
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-dim">{label}</span>
        <span className="text-xl font-semibold leading-tight tabular-nums text-ink">{value}</span>
      </div>
    </div>
  )
}

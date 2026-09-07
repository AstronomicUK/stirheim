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
import { normaliseName } from '../../importer/rosterImport'
import type { NamedRule } from '../../../rules/types'
import { isPlainNote, xpNotches, xpProgress } from './lookups'
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
 * The stretch to the next advance, drawn across the full width: one notch per point of experience
 * between the box he last crossed and the box he is heading for, filled as far as he has got. The
 * empty notches are the answer to "how much more" without anyone having to do the arithmetic, and
 * because the bar always ends at the next box it needs no marker of its own.
 */
export function XpBar({ xp, levelUps, role, rate = 'normal', noExperience = false }: { xp: number; levelUps: number; role: CharacterRole; rate?: AdvanceRate; noExperience?: boolean }) {
  const p = xpProgress(xp, levelUps, role, rate)
  const notches = xpNotches(xp, role, rate)
  if (noExperience) return <p className="text-xs text-ink-dim">Gains no experience.</p>
  const toGo = p.next !== null ? p.next - xp : null
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3 text-xs text-ink-dim">
        <span>
          <span className="font-semibold text-ink">{xp} xp</span>
          {p.next !== null ? (
            <span>
              {' '}
              · next advance at {p.next} ({toGo} to go){rate === 'half' ? ', half rate' : ''}
            </span>
          ) : (
            <span> · no further advances</span>
          )}
        </span>
        {p.advancesOwed > 0 ? <Tag tone="brass">{p.advancesOwed === 1 ? 'Advance owed' : `${p.advancesOwed} advances owed`}</Tag> : null}
      </div>
      {notches.length > 0 ? (
        <div className="flex w-full items-center gap-1" aria-hidden>
          {notches.map((notch) => (
            <span key={notch.point} title={`${notch.point} xp`} className={`h-2.5 min-w-0 flex-1 rounded-[2px] ${notch.earned ? 'bg-brass' : 'bg-surface-high'}`} />
          ))}
        </div>
      ) : null}
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
  /**
   * The owner's own special rules (a hired sword's, mainly). Some entries write a special ability
   * into the kit line rather than the item list — the Kislev Ranger's "Hunter's Cloak" is a rule,
   * not a piece of armour, and the catalogue has nothing to say about it — so an item with no
   * catalogue match is checked against these by name before giving up on a tooltip.
   */
  ownerRules?: NamedRule[]
}

/**
 * The kit as a list. Hover or tap a name for its rules: a weapon's range, Strength and special
 * rules, armour's save, anything else's catalogue text. Range and Strength also sit on the line
 * itself so a bow's reach is one glance away. `detailed` prints every entry open instead.
 */
export function ItemLines({ items, detailed = false, emptyText = 'No equipment', plain = false, ownerRules = [] }: ItemLinesProps) {
  if (items.length === 0) return <p className="text-sm text-ink-dim">{emptyText}</p>
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {items.map((item, i) => (
        <ItemLine key={`${item.itemId ?? item.customName}-${i}-${detailed ? 'd' : 'c'}`} item={item} companions={items} open={detailed} plain={plain} ownerRules={ownerRules} />
      ))}
    </ul>
  )
}

/** A written-in kit line that is actually one of the owner's own named rules ("Hunter's Cloak"), not a catalogue item. */
function ownerRuleFor(item: RosterItem, ownerRules: NamedRule[]): NamedRule | undefined {
  if (item.itemId || !item.customName) return undefined
  const wanted = normaliseName(item.customName)
  return ownerRules.find((r) => normaliseName(r.name) === wanted)
}

function ItemLine({ item, companions, open, plain, ownerRules }: { item: RosterItem; companions: RosterItem[]; open: boolean; plain: boolean; ownerRules: NamedRule[] }) {
  const catalogue = item.itemId ? findItem(item.itemId) : undefined
  const rule = catalogue ? undefined : ownerRuleFor(item, ownerRules)
  const profile = itemProfile(item, companions)
  const hasDetail = Boolean(catalogue) || Boolean(item.notes) || Boolean(rule)
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
              {rule ? rule.text : <ItemDetail item={item} catalogue={catalogue} />}
            </HoverCard>
          ) : (
            name
          )}
        </span>
        {profile ? <span className="shrink-0 text-xs tabular-nums text-ink-dim">{profile}</span> : null}
      </div>
      {open && hasDetail ? (
        <div className="flex flex-col gap-1 border-l border-border pl-3 text-xs leading-relaxed text-ink-dim">
          {rule ? <p>{rule.text}</p> : <ItemDetail item={item} catalogue={catalogue} />}
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

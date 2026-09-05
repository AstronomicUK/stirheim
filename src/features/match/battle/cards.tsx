// Card pieces shared by the "My warband" and "Enemy" views: a tappable head (name, type, tags,
// stat line) and a body that shows the kit and skills as one line, or every rule when expanded.

import type { ReactNode } from 'react'
import type { NamedRule, Stats } from '../../../rules/types'
import type { RosterItem } from '../../../rules/types/roster'
import { StatLine } from '../../roster/shared/StatLine'
import { ItemLines, RuleList, Tag } from '../../roster/view/bits'
import { skillName, skillText } from '../../roster/view/lookups'
import type { CardTag } from './names'

export interface WarriorHeadProps {
  name: string
  typeName: string
  isLarge?: boolean
  tags: CardTag[]
  stats: Stats
  expanded: boolean
  onToggle: () => void
}

/** Tap anywhere on the head to expand the rules and weapon details underneath. */
export function WarriorHead({ name, typeName, isLarge, tags, stats, expanded, onToggle }: WarriorHeadProps) {
  return (
    <button type="button" onClick={onToggle} aria-expanded={expanded} className="flex w-full flex-col gap-2.5 px-4 pb-3 pt-3 text-left">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-headline text-lg font-semibold leading-tight text-ink">{name}</h3>
          <p className="text-sm text-ink-dim">
            {typeName}
            {isLarge ? ' · Large' : ''}
          </p>
        </div>
        {tags.length > 0 ? (
          <div className="flex shrink-0 flex-wrap justify-end gap-1">
            {tags.map((t) => (
              <Tag key={t.label} tone={t.tone}>
                {t.label}
              </Tag>
            ))}
          </div>
        ) : null}
      </div>
      <StatLine stats={stats} />
    </button>
  )
}

export interface WarriorBodyProps {
  equipment: RosterItem[]
  /** Heading over the kit, e.g. "Each carries" for a group. */
  kitLabel?: string
  kitNote?: string
  skillIds?: string[]
  rules: NamedRule[]
  expanded: boolean
  children?: ReactNode
}

export function WarriorBody({ equipment, kitLabel, kitNote, skillIds = [], rules, expanded, children }: WarriorBodyProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3">
      <div className="flex flex-col gap-1">
        {kitLabel ? <p className="text-[10px] uppercase tracking-wider text-ink-dim">{kitLabel}</p> : null}
        <ItemLines items={equipment} detailed={expanded} />
        {kitNote ? <p className="text-xs text-ink-dim">{kitNote}</p> : null}
      </div>
      {skillIds.length > 0 ? (
        <div className="flex flex-col gap-1">
          <p className="text-[10px] uppercase tracking-wider text-ink-dim">Skills</p>
          {expanded ? (
            <RuleList rules={skillIds.map((id) => ({ name: skillName(id), text: skillText(id) ?? 'No rule text on file.' }))} />
          ) : (
            <p className="text-sm text-ink">{skillIds.map(skillName).join(', ')}</p>
          )}
        </div>
      ) : null}
      {expanded ? (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          {rules.length > 0 ? (
            <>
              <p className="text-[10px] uppercase tracking-wider text-ink-dim">Special rules</p>
              <RuleList rules={rules} />
            </>
          ) : (
            <p className="text-xs text-ink-dim">No special rules.</p>
          )}
        </div>
      ) : null}
      {children}
    </div>
  )
}

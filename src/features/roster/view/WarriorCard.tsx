import { useState } from 'react'
import type { HeroRow } from '../../../domain'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterItem } from '../../../rules/types/roster'
import { StatLine } from '../shared/StatLine'
import { unitTypeName } from '../shared/names'
import { Card, ItemLines, RuleList, Tag, XpBar } from './bits'
import { findSpellOption, flagTags, hiredSwordName, skillName, skillTableName, skillText, spellName, statusLabel, warriorSpecialRules } from './lookups'

export interface WarriorCardProps {
  hero: HeroRow
  equipment: RosterItem[]
  template: WarbandTemplate | undefined
}

/** One hero or hired sword as read at the table. Tapping the head toggles rules and item detail. */
export function WarriorCard({ hero, equipment, template }: WarriorCardProps) {
  const [expanded, setExpanded] = useState(false)
  const status = statusLabel(hero.status)
  const inactive = hero.status !== 'active'
  const typeName = hero.is_hired_sword
    ? hiredSwordName(hero.hired_sword_rules_id ?? '')
    : unitTypeName(template?.id ?? '', hero.unit_type_rules_id ?? '')
  const tags = flagTags(hero.flags)
  const rules = warriorSpecialRules(template, hero.unit_type_rules_id, hero.hired_sword_rules_id)

  return (
    <Card className={inactive ? 'opacity-70' : ''}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full flex-col gap-3 px-4 pt-3 pb-3 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-headline text-lg font-semibold leading-tight text-ink">{hero.name}</h3>
            <p className="text-sm text-ink-dim">
              {typeName}
              {hero.is_large ? ' · Large' : ''}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-1">
            {status ? <Tag tone="danger">{status}</Tag> : null}
            {tags.map((t) => (
              <Tag key={t} tone="warn">
                {t}
              </Tag>
            ))}
          </div>
        </div>
        <StatLine stats={hero.stats} />
        <XpBar xp={hero.xp} levelUps={hero.level_ups} role="hero" />
      </button>

      <div className="flex flex-col gap-3 border-t border-border px-4 py-3">
        <ItemLines items={equipment} detailed={expanded} />

        {hero.skills.length > 0 ? (
          <div className="flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-wider text-ink-dim">Skills</p>
            {expanded ? (
              <RuleList rules={hero.skills.map((id) => ({ name: skillName(id), text: skillText(id) ?? 'No rule text on file.' }))} />
            ) : (
              <p className="text-sm text-ink">{hero.skills.map(skillName).join(', ')}</p>
            )}
          </div>
        ) : null}

        {hero.spells.length > 0 ? (
          <div className="flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-wider text-ink-dim">Spells</p>
            {expanded ? (
              <RuleList
                rules={hero.spells.map((id) => {
                  const spell = findSpellOption(id)
                  return { name: spell ? `${spell.name} (${spell.lore})` : id, text: spell?.text ?? 'No rule text on file.' }
                })}
              />
            ) : (
              <p className="text-sm text-ink">{hero.spells.map(spellName).join(', ')}</p>
            )}
          </div>
        ) : null}

        {hero.injuries.length > 0 ? (
          <div className="flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-wider text-ink-dim">Injuries</p>
            <ul className="flex flex-col gap-0.5 text-sm">
              {hero.injuries.map((inj, i) => (
                <li key={`${inj.injuryCode}-${i}`} className="text-ink">
                  {inj.name}
                  {inj.effect ? <span className="text-ink-dim"> — {inj.effect}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {hero.notes ? <p className="whitespace-pre-line text-sm text-ink-dim">{hero.notes}</p> : null}

        {expanded ? (
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            {hero.skill_tables.length > 0 ? (
              <p className="text-xs text-ink-dim">Skill tables: {hero.skill_tables.map(skillTableName).join(', ')}</p>
            ) : null}
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
      </div>
    </Card>
  )
}

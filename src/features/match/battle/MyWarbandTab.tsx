import { useState } from 'react'
import { eventContribution, type BattleEventRow, type BattleLiveState } from '../../../domain'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterHenchmanGroup, RosterWarband } from '../../../rules/types/roster'
import { Button, Stepper } from '../../../ui'
import { Card, Section, Tag } from '../../roster/view/bits'
import { WarriorBody, WarriorHead } from './cards'
import { ExperienceReminders } from './ExperienceReminders'
import { groupRules, groupTypeName, warriorRules, warriorTags, warriorTypeName, type CardTag } from './names'
import { addEnemyOut, fightingGroups, groupOut, isHeroOut, perModelKit, setGroupOut, setWoundsLost, splitWarriors, toggleHeroOut, woundsLost, type SheetWarrior } from './sheet'

export interface MyWarbandTabProps {
  roster: RosterWarband
  template: WarbandTemplate | undefined
  sheet: BattleLiveState
  edit: (fn: (sheet: BattleLiveState) => BattleLiveState) => void
  readOnly: boolean
  /** The shared combat log, to say which tallies came from it. */
  events?: BattleEventRow[]
}

export function MyWarbandTab({ roster, template, sheet, edit, readOnly, events = [] }: MyWarbandTabProps) {
  const warriors = splitWarriors(roster)
  const groups = fightingGroups(roster)

  return (
    <>
      <Section title="Heroes & hired swords" aside={`${warriors.fighting.length} fighting`}>
        {warriors.fighting.length === 0 ? <p className="text-sm text-ink-dim">Nobody is fit to fight.</p> : null}
        {warriors.fighting.map((entry) => (
          <MyWarriorCard key={entry.warrior.id} entry={entry} template={template} sheet={sheet} edit={edit} readOnly={readOnly} fromLog={eventContribution(events, roster.id, entry.warrior.id)} />
        ))}
      </Section>

      <Section title="Henchmen" aside={`${groups.reduce((n, g) => n + g.size, 0)} models`}>
        {groups.length === 0 ? <p className="text-sm text-ink-dim">No henchman groups.</p> : null}
        {groups.map((group) => (
          <MyGroupCard key={group.id} group={group} template={template} sheet={sheet} edit={edit} readOnly={readOnly} />
        ))}
      </Section>

      {warriors.notFighting.length > 0 ? (
        <Section title="Not fighting this game">
          <Card>
            <ul className="divide-y divide-border">
              {warriors.notFighting.map(({ entry, reason }) => (
                <li key={entry.warrior.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">{entry.warrior.name}</p>
                    <p className="truncate text-xs text-ink-dim">{warriorTypeName(entry, template)}</p>
                  </div>
                  <Tag tone="danger">{reason}</Tag>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      ) : null}

      <ExperienceReminders />
    </>
  )
}

interface MyWarriorCardProps {
  entry: SheetWarrior
  template: WarbandTemplate | undefined
  sheet: BattleLiveState
  edit: MyWarbandTabProps['edit']
  readOnly: boolean
  fromLog: { kills: number; woundsLost: number; outOfAction: number }
}

function MyWarriorCard({ entry, template, sheet, edit, readOnly, fromLog }: MyWarriorCardProps) {
  const [expanded, setExpanded] = useState(false)
  const { warrior } = entry
  const out = isHeroOut(sheet, warrior.id)
  const enemiesOut = sheet.tallies.find((t) => t.id === warrior.id)?.enemiesOutOfAction ?? 0
  const tags = warriorTags(warrior)
  if (out) tags.unshift({ label: 'Out of action', tone: 'danger' })

  return (
    <Card className={out ? 'opacity-70' : ''}>
      <WarriorHead
        name={warrior.name}
        typeName={warriorTypeName(entry, template)}
        isLarge={entry.role === 'hero' ? entry.warrior.isLarge : undefined}
        tags={tags}
        stats={warrior.stats}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
      />
      <WarriorBody equipment={warrior.equipment} skillIds={warrior.skillIds} rules={warriorRules(entry, template)} expanded={expanded}>
        {warrior.stats.W > 1 ? (
          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-ink-dim">Wounds lost</span>
              <span className="text-xs text-ink-dim">
                {warrior.stats.W - woundsLost(sheet, warrior.id)} of {warrior.stats.W} left
              </span>
            </div>
            <Stepper value={woundsLost(sheet, warrior.id)} onChange={(next) => edit((s) => setWoundsLost(s, warrior.id, 'hero', next, warrior.stats.W))} label={`wounds lost by ${warrior.name}`} max={warrior.stats.W} disabled={readOnly} />
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-ink-dim">Enemies out{fromLog.kills > 0 ? ` · ${fromLog.kills} from the log` : ''}</span>
            <Stepper value={enemiesOut} min={fromLog.kills} onChange={(next) => edit((s) => addEnemyOut(s, warrior.id, next - enemiesOut))} label={`enemies out by ${warrior.name}`} disabled={readOnly} />
          </div>
          <Button variant={out ? 'secondary' : 'danger'} disabled={readOnly} onClick={() => edit((s) => toggleHeroOut(s, warrior.id))} aria-pressed={out}>
            {out ? 'Back in' : 'Out of action'}
          </Button>
        </div>
      </WarriorBody>
    </Card>
  )
}

interface MyGroupCardProps {
  group: RosterHenchmanGroup
  template: WarbandTemplate | undefined
  sheet: BattleLiveState
  edit: MyWarbandTabProps['edit']
  readOnly: boolean
}

function MyGroupCard({ group, template, sheet, edit, readOnly }: MyGroupCardProps) {
  const [expanded, setExpanded] = useState(false)
  const out = groupOut(sheet, group.id)
  const kit = perModelKit(group.equipment, group.size)
  const tags: CardTag[] = [{ label: group.size === 1 ? '1 model' : `${group.size} models`, tone: 'neutral' }]
  if (out > 0) tags.push({ label: out >= group.size ? 'All out of action' : `${out} out of action`, tone: 'danger' })

  return (
    <Card className={out >= group.size ? 'opacity-70' : ''}>
      <WarriorHead
        name={group.name}
        typeName={groupTypeName(group, template)}
        isLarge={group.isLarge}
        tags={tags}
        stats={group.stats}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
      />
      <WarriorBody
        equipment={kit.items}
        kitLabel={kit.exact && group.size > 1 ? 'Each carries' : 'Equipment'}
        kitNote={kit.exact ? undefined : `Group totals shown: the kit does not divide evenly between ${group.size} models.`}
        rules={groupRules(group, template)}
        expanded={expanded}
      >
        {group.size === 1 && group.stats.W > 1 ? (
          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-ink-dim">Wounds lost</span>
              <span className="text-xs text-ink-dim">
                {group.stats.W - woundsLost(sheet, group.id)} of {group.stats.W} left
              </span>
            </div>
            <Stepper value={woundsLost(sheet, group.id)} onChange={(next) => edit((s) => setWoundsLost(s, group.id, 'group', next, group.stats.W))} label={`wounds lost by ${group.name}`} max={group.stats.W} disabled={readOnly} />
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-ink-dim">Out of action</span>
            <Stepper value={out} onChange={(next) => edit((s) => setGroupOut(s, group.id, next, group.size))} label={`${group.name} out of action`} max={group.size} disabled={readOnly} />
          </div>
          <span className="text-sm tabular-nums text-ink-dim">
            {out} / {group.size}
          </span>
        </div>
      </WarriorBody>
    </Card>
  )
}

import { RelicLeadershipControl } from './RelicLeadershipControl'
import { BugmansAleControl } from './BugmansAleControl'
import { useBattleTurns } from '../../../api/battleTurns'
import { HealingHerbsControl } from './HealingHerbsControl'
import type { ItemRow } from '../../../domain'
import { conditionsFor } from './sheet'
import { useState } from 'react'
import { eventContribution, type BattleEventRow, type BattleLiveState } from '../../../domain'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterHenchmanGroup, RosterWarband } from '../../../rules/types/roster'
import { Button, Stepper } from '../../../ui'
import { Card, Section, Tag } from '../../roster/view/bits'
import { WarriorBody, WarriorHead } from './cards'
import { ExperienceReminders } from './ExperienceReminders'
import { groupRules, groupTypeName, modelLabel, warriorRules, warriorTags, warriorTypeName, type CardTag } from './names'
import { addEnemyOut, animalsFighting, fightingGroups, groupOut, isHeroOut, perModelKit, setGroupOut, setTakenOutBy, setWoundsLost, splitWarriors, takenOutBy, toggleHeroOut, woundsLost, type SheetWarrior } from './sheet'
import { TakenOutBySheet } from './TakenOutBySheet'
import { useEnemyRosters } from '../fight/useEnemyRosters'
import type { MatchParticipantView } from '../../../api/matches'
import type { TakenOutBy } from '../../../domain'

export interface MyWarbandTabProps {
  items?: readonly ItemRow[]
  healingHerbsSingleUse?: boolean
  roster: RosterWarband
  template: WarbandTemplate | undefined
  sheet: BattleLiveState
  rawSheet?: BattleLiveState
  edit: (fn: (sheet: BattleLiveState) => BattleLiveState) => void
  readOnly: boolean
  /** The shared combat log, to say which tallies came from it. */
  events?: BattleEventRow[]
  /** The match and the other warbands, so a casualty can be attributed to an enemy model. */
  matchId?: string
  others?: MatchParticipantView[]
}

/** A casualty waiting for its "taken out by" answer. */
interface Asking {
  id: string
  name: string
  /** Which entry of the group's list this answer fills (heroes: 0). */
  index: number
}

export function MyWarbandTab({ roster, template, sheet, rawSheet = sheet, edit, readOnly, events = [], matchId, others = [], items = [], healingHerbsSingleUse = false }: MyWarbandTabProps) {
  const turns = useBattleTurns(matchId ?? '')
  const conditions = conditionsFor(events, roster.id, sheet.turn, turns.data?.recoveries)
  const warriors = splitWarriors(roster, sheet)
  const groups = fightingGroups(roster)
  const animals = animalsFighting(roster)
  const enemies = useEnemyRosters(matchId ?? '', matchId ? others : [])
  const [asking, setAsking] = useState<Asking | null>(null)

  function answer(by: TakenOutBy) {
    if (!asking) return
    const { id, index } = asking
    edit((s) => {
      const current = [...takenOutBy(s, id)]
      current[index] = by
      return setTakenOutBy(s, id, current.map((x) => x ?? { warbandId: null, modelId: null, name: 'unknown', turn: s.turn }))
    })
    setAsking(null)
  }

  return (
    <>
      <BugmansAleControl roster={roster} template={template} items={items} sheet={sheet} readOnly={readOnly} edit={edit} />
      <Section title="Heroes & hired swords" aside={`${warriors.fighting.length} fighting`}>
        {warriors.fighting.length === 0 ? <p className="text-sm text-ink-dim">Nobody is fit to fight.</p> : null}
        {warriors.fighting.map((entry) => (
          <div key={entry.warrior.id}><MyWarriorCard condition={conditions.get(entry.warrior.id)} entry={entry} template={template} sheet={sheet} edit={edit} readOnly={readOnly} fromLog={eventContribution(events, roster.id, entry.warrior.id)} onAsk={(name) => setAsking({ id: entry.warrior.id, name, index: 0 })} /><RelicLeadershipControl roster={roster} warriorId={entry.warrior.id} name={entry.warrior.name} sheet={sheet} readOnly={readOnly} edit={edit} />{entry.role === 'hero' ? <HealingHerbsControl warriorId={entry.warrior.id} roster={roster} items={items} sheet={sheet} rawSheet={rawSheet} events={events} edit={edit} readOnly={readOnly} singleUse={healingHerbsSingleUse} /> : null}</div>
        ))}
      </Section>

      <Section title="Henchmen" aside={`${groups.reduce((n, g) => n + g.size, 0)} models`}>
        {groups.length === 0 ? <p className="text-sm text-ink-dim">No henchman groups.</p> : null}
        {groups.map((group) => (
          <div key={group.id}><MyGroupCard condition={conditions.get(group.id)} group={group} template={template} sheet={sheet} edit={edit} readOnly={readOnly} onAsk={(index) => setAsking({ id: group.id, name: `one of the ${group.name}`, index })} /><RelicLeadershipControl roster={roster} warriorId={group.id} name={group.name} sheet={sheet} readOnly={readOnly} edit={edit} /></div>
        ))}
      </Section>

      <TakenOutBySheet open={asking !== null} subjectName={asking?.name ?? ''} enemies={enemies.warbands} enemiesPending={Boolean(matchId) && enemies.isPending} turn={sheet.turn} onPick={answer} onClose={() => setAsking(null)} />

      {animals.length > 0 ? (
        <Section title="Animals" aside={`${animals.length} on the table`}>
          <Card>
            <ul className="divide-y divide-border">
              {animals.map((animal) => {
                const out = isHeroOut(sheet, animal.id)
                return (
                  <li key={animal.id} className={`flex items-center justify-between gap-3 px-4 py-2.5 ${out ? 'opacity-70' : ''}`}>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink">{animal.name}</p>
                      <p className="truncate text-xs text-ink-dim">
                        {animal.holderName}'s · {animal.kind.countsForRout ? 'counts for rout tests' : 'does not count for rout tests'} · dead on 1-2 after the game
                      </p>
                    </div>
                    <Button variant={out ? 'secondary' : 'danger'} disabled={readOnly} onClick={() => edit((s) => toggleHeroOut(s, animal.id))} aria-pressed={out}>
                      {out ? 'Back in' : 'Out of action'}
                    </Button>
                  </li>
                )
              })}
            </ul>
          </Card>
        </Section>
      ) : null}

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
  condition?: string
  entry: SheetWarrior
  template: WarbandTemplate | undefined
  sheet: BattleLiveState
  edit: MyWarbandTabProps['edit']
  readOnly: boolean
  fromLog: { kills: number; woundsLost: number; outOfAction: number }
  /** Ask who took this warrior out (after marking them out). */
  onAsk: (name: string) => void
}

function MyWarriorCard({ condition, entry, template, sheet, edit, readOnly, fromLog, onAsk }: MyWarriorCardProps) {
  const [expanded, setExpanded] = useState(false)
  const { warrior } = entry
  const out = isHeroOut(sheet, warrior.id)
  const enemiesOut = sheet.tallies.find((t) => t.id === warrior.id)?.enemiesOutOfAction ?? 0
  const by = takenOutBy(sheet, warrior.id)[0]
  const tags = warriorTags(warrior)
  if (out) tags.unshift({ label: by ? `Out of action · by ${by.name}` : 'Out of action', tone: 'danger' })

  return (
    <Card className={out ? 'opacity-70' : ''}>
      {condition && !out ? <span className="px-4 pt-2 text-sm font-semibold text-accent-strong">{condition}</span> : null}
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
          <div className="flex flex-col items-end gap-1">
            <Button
              variant={out ? 'secondary' : 'danger'}
              disabled={readOnly}
              onClick={() => {
                edit((s) => toggleHeroOut(s, warrior.id))
                if (!out) onAsk(warrior.name)
              }}
              aria-pressed={out}
            >
              {out ? 'Back in' : 'Out of action'}
            </Button>
            {out && !readOnly ? (
              <button type="button" onClick={() => onAsk(warrior.name)} className="text-xs text-brass underline-offset-4 hover:underline">
                {by ? 'Change who did it' : 'Who did it?'}
              </button>
            ) : null}
          </div>
        </div>
      </WarriorBody>
    </Card>
  )
}

interface MyGroupCardProps {
  condition?: string
  group: RosterHenchmanGroup
  template: WarbandTemplate | undefined
  sheet: BattleLiveState
  edit: MyWarbandTabProps['edit']
  readOnly: boolean
  /** Ask who took the model at this index out. */
  onAsk: (index: number) => void
}

function MyGroupCard({ condition, group, template, sheet, edit, readOnly, onAsk }: MyGroupCardProps) {
  const [expanded, setExpanded] = useState(false)
  const out = groupOut(sheet, group.id)
  const by = takenOutBy(sheet, group.id)
  const kit = perModelKit(group.equipment, group.rosterSize ?? group.size)
  const tags: CardTag[] = [{ label: group.size === 1 ? '1 model' : `${group.size} models`, tone: 'neutral' }]
  if (out > 0) tags.push({ label: out >= group.size ? 'All out of action' : `${out} out of action`, tone: 'danger' })

  return (
    <Card className={out >= group.size ? 'opacity-70' : ''}>
      {condition && out < group.size ? <span className="px-4 pt-2 text-sm font-semibold text-accent-strong">{condition}</span> : null}
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
            <Stepper
              value={out}
              onChange={(next) => {
                edit((s) => setGroupOut(s, group.id, next, group.size))
                if (next > out) onAsk(next - 1)
              }}
              label={`${group.name} out of action`}
              max={group.size}
              disabled={readOnly}
            />
          </div>
          <span className="text-sm tabular-nums text-ink-dim">
            {out} / {group.size}
          </span>
        </div>
        {by.length > 0 ? (
          <ul className="flex flex-col gap-0.5 text-xs text-ink-dim">
            {by.map((b, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span>{modelLabel(group.modelNames, i)}: taken out by {b.name}</span>
                {!readOnly ? (
                  <button type="button" onClick={() => onAsk(i)} className="text-brass underline-offset-4 hover:underline">
                    Change
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </WarriorBody>
    </Card>
  )
}

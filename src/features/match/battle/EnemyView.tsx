import { useBattleTurns } from '../../../api/battleTurns'
import { useMemo, useState } from 'react'
import { useMatchRoster, type BattleSessionView, type MatchParticipantView } from '../../../api/matches'
import { battleTotals, type BattleEventRow } from '../../../domain'
import { findWarbandTemplate } from '../../../rules/data/warbandTemplates'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterHenchmanGroup, RosterWarband } from '../../../rules/types/roster'
import { Icon, Notice, Spinner, type IconName } from '../../../ui'
import { Card, Tag } from '../../roster/view/bits'
import { WarriorBody, WarriorHead } from './cards'
import { groupRules, groupTypeName, warriorRules, warriorTags, warriorTypeName, type CardTag } from './names'
import { conditionsFor, fightingGroups, groupOut, isHeroOut, perModelKit, splitWarriors, startingModels, type SheetWarrior } from './sheet'

export interface EnemyViewProps {
  matchId: string
  participants: MatchParticipantView[]
  sessions: BattleSessionView[]
  /** The shared log, read for who is currently knocked down or stunned. */
  events?: BattleEventRow[]
  /** The turn on the reader's own sheet: a model only stays down for the turn it went down in. */
  turn?: number
}

/** Every other warband at the table: their roster for reference and their live tallies. */
export function EnemyView({ matchId, participants, sessions, events = [], turn = 0 }: EnemyViewProps) {
  const turns = useBattleTurns(matchId)
  return (
    <>
      {participants.length === 0 ? <p className="text-sm text-ink-dim">No other warbands in this match.</p> : null}
      {participants.map((p) => (
        <EnemyWarband
          key={p.warband_id}
          matchId={matchId}
          participant={p}
          session={sessions.find((s) => s.warband_id === p.warband_id)}
          conditions={conditionsFor(events, p.warband_id, turn, turns.data?.recoveries)}
        />
      ))}
    </>
  )
}

/** The warband's identity as icons rather than a run-on line: who owns it, what it is, how it rates. */
function EnemyHeader({ participant }: { participant: MatchParticipantView }) {
  const rows: { icon: IconName; text: string }[] = [
    { icon: 'account', text: participant.owner_display_name },
    { icon: 'warbands', text: participant.type_name },
    { icon: 'rating', text: String(participant.rating) },
  ]
  return (
    <div className="flex items-start justify-between gap-3">
      <h2 className="min-w-0 font-headline text-lg leading-tight text-ink">{participant.warband_name}</h2>
      <ul className="flex shrink-0 flex-col items-end gap-0.5">
        {rows.map((row) => (
          <li key={row.icon} className="flex items-center gap-1.5 text-xs text-ink-dim">
            <span className="truncate text-right">{row.text}</span>
            <Icon name={row.icon} size={14} className="text-brass" />
          </li>
        ))}
      </ul>
    </div>
  )
}

function EnemyWarband({
  matchId,
  participant,
  session,
  conditions,
}: {
  matchId: string
  participant: MatchParticipantView
  session: BattleSessionView | undefined
  conditions: Map<string, string>
}) {
  const query = useMatchRoster(matchId, participant.warband_id)
  const roster = query.data?.roster
  const template = useMemo(() => (roster ? findWarbandTemplate(roster.warbandTemplateId) : undefined), [roster])

  const totals = session ? battleTotals(session.live_state) : null
  const models = roster ? startingModels(roster, session?.live_state) : null

  return (
    <section className="flex flex-col gap-3">
      <EnemyHeader participant={participant} />
      <Card className="flex flex-col gap-1 px-4 py-3">
        {session && totals ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm tabular-nums text-ink">
            <span>Turn {session.live_state.turn}</span>
            <span>
              {totals.ownOutOfAction}
              {models !== null ? ` / ${models}` : ''} out of action
            </span>
            <span>{totals.enemiesOutOfAction} enemies out</span>
            {session.live_state.wyrdstoneFound > 0 ? <span>{session.live_state.wyrdstoneFound} wyrdstone</span> : null}
            {session.live_state.routed ? <Tag tone="danger">Routed</Tag> : null}
          </div>
        ) : (
          <p className="text-sm text-ink-dim">They have not started a sheet yet. It will appear here as soon as they do.</p>
        )}
      </Card>

      {query.isPending ? (
        <div className="flex justify-center py-6">
          <Spinner label={`Loading ${participant.warband_name}`} />
        </div>
      ) : null}
      {query.isError ? (
        <Notice tone="error" title="Could not load this roster">
          {query.error.message}
        </Notice>
      ) : null}
      {roster ? <EnemyRoster roster={roster} template={template} session={session} conditions={conditions} /> : null}
    </section>
  )
}

function EnemyRoster({
  roster,
  template,
  session,
  conditions,
}: {
  roster: RosterWarband
  template: WarbandTemplate | undefined
  session: BattleSessionView | undefined
  conditions: Map<string, string>
}) {
  const warriors = splitWarriors(roster, session?.live_state)
  const groups = fightingGroups(roster)
  return (
    <>
      {warriors.fighting.map((entry) => (
        <EnemyWarriorCard
          key={entry.warrior.id}
          entry={entry}
          template={template}
          out={session ? isHeroOut(session.live_state, entry.warrior.id) : false}
          condition={conditions.get(entry.warrior.id)}
        />
      ))}
      {groups.map((group) => (
        <EnemyGroupCard key={group.id} group={group} template={template} out={session ? groupOut(session.live_state, group.id) : 0} condition={conditions.get(group.id)} />
      ))}
      {warriors.notFighting.length > 0 ? (
        <p className="text-xs text-ink-dim">
          Not fighting: {warriors.notFighting.map(({ entry, reason }) => `${entry.warrior.name} (${reason.toLowerCase()})`).join(', ')}.
        </p>
      ) : null}
    </>
  )
}

function EnemyWarriorCard({ entry, template, out, condition }: { entry: SheetWarrior; template: WarbandTemplate | undefined; out: boolean; condition?: string }) {
  const [expanded, setExpanded] = useState(false)
  const { warrior } = entry
  const tags = warriorTags(warrior)
  if (condition && !out) tags.unshift({ label: condition, tone: 'warn' })
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
      <WarriorBody equipment={warrior.equipment} skillIds={warrior.skillIds} rules={warriorRules(entry, template)} expanded={expanded} />
    </Card>
  )
}

function EnemyGroupCard({ group, template, out, condition }: { group: RosterHenchmanGroup; template: WarbandTemplate | undefined; out: number; condition?: string }) {
  const [expanded, setExpanded] = useState(false)
  const kit = perModelKit(group.equipment, group.size)
  const tags: CardTag[] = [{ label: group.size === 1 ? '1 model' : `${group.size} models`, tone: 'neutral' }]
  if (condition) tags.push({ label: condition, tone: 'warn' })
  if (out > 0) tags.push({ label: `${out} out of action`, tone: 'danger' })
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
      <WarriorBody equipment={kit.items} kitLabel={kit.exact && group.size > 1 ? 'Each carries' : 'Equipment'} rules={groupRules(group, template)} expanded={expanded} />
    </Card>
  )
}

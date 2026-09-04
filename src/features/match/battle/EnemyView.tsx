import { useMemo, useState } from 'react'
import { useMatchRoster, type BattleSessionView, type MatchParticipantView } from '../../../api/matches'
import { battleTotals } from '../../../domain'
import { findWarbandTemplate } from '../../../rules/data/warbandTemplates'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterHenchmanGroup, RosterWarband } from '../../../rules/types/roster'
import { Notice, Spinner } from '../../../ui'
import { Card, Section, Tag } from '../../roster/view/bits'
import { WarriorBody, WarriorHead } from './cards'
import { groupRules, groupTypeName, warriorRules, warriorTags, warriorTypeName, type CardTag } from './names'
import { fightingGroups, groupOut, isHeroOut, perModelKit, splitWarriors, startingModels, type SheetWarrior } from './sheet'

export interface EnemyViewProps {
  matchId: string
  participants: MatchParticipantView[]
  sessions: BattleSessionView[]
  /** Shown once above the list. */
  intro?: string
}

/** Every other warband at the table: their roster for reference and their live tallies. */
export function EnemyView({ matchId, participants, sessions, intro }: EnemyViewProps) {
  return (
    <>
      {intro ? <p className="text-sm text-ink-dim">{intro}</p> : null}
      {participants.length === 0 ? <p className="text-sm text-ink-dim">No other warbands in this match.</p> : null}
      {participants.map((p) => (
        <EnemyWarband key={p.warband_id} matchId={matchId} participant={p} session={sessions.find((s) => s.warband_id === p.warband_id)} />
      ))}
    </>
  )
}

function EnemyWarband({ matchId, participant, session }: { matchId: string; participant: MatchParticipantView; session: BattleSessionView | undefined }) {
  const query = useMatchRoster(matchId, participant.warband_id)
  const roster = query.data?.roster
  const template = useMemo(() => (roster ? findWarbandTemplate(roster.warbandTemplateId) : undefined), [roster])

  const totals = session ? battleTotals(session.live_state) : null
  const models = roster ? startingModels(roster) : null

  return (
    <Section title={participant.warband_name} aside={`${participant.type_name} · ${participant.owner_display_name} · rating ${participant.rating}`}>
      <Card className="flex flex-col gap-1 px-4 py-3">
        {session && totals ? (
          <>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-sm tabular-nums text-ink">
              <span>Turn {session.live_state.turn}</span>
              <span>
                {totals.ownOutOfAction}
                {models !== null ? ` / ${models}` : ''} out of action
              </span>
              <span>{totals.enemiesOutOfAction} enemies out</span>
              {session.live_state.wyrdstoneFound > 0 ? <span>{session.live_state.wyrdstoneFound} wyrdstone</span> : null}
              {session.live_state.routed ? <Tag tone="danger">Routed</Tag> : null}
            </div>
            <p className="text-xs text-ink-dim">Their sheet, live. Updates as they tap.</p>
          </>
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
      {roster ? <EnemyRoster roster={roster} template={template} session={session} /> : null}
    </Section>
  )
}

function EnemyRoster({ roster, template, session }: { roster: RosterWarband; template: WarbandTemplate | undefined; session: BattleSessionView | undefined }) {
  const warriors = splitWarriors(roster)
  const groups = fightingGroups(roster)
  return (
    <>
      {warriors.fighting.map((entry) => (
        <EnemyWarriorCard key={entry.warrior.id} entry={entry} template={template} out={session ? isHeroOut(session.live_state, entry.warrior.id) : false} />
      ))}
      {groups.map((group) => (
        <EnemyGroupCard key={group.id} group={group} template={template} out={session ? groupOut(session.live_state, group.id) : 0} />
      ))}
      {warriors.notFighting.length > 0 ? (
        <p className="text-xs text-ink-dim">
          Not fighting: {warriors.notFighting.map(({ entry, reason }) => `${entry.warrior.name} (${reason.toLowerCase()})`).join(', ')}.
        </p>
      ) : null}
    </>
  )
}

function EnemyWarriorCard({ entry, template, out }: { entry: SheetWarrior; template: WarbandTemplate | undefined; out: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const { warrior } = entry
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
      <WarriorBody equipment={warrior.equipment} skillIds={warrior.skillIds} rules={warriorRules(entry, template)} expanded={expanded} />
    </Card>
  )
}

function EnemyGroupCard({ group, template, out }: { group: RosterHenchmanGroup; template: WarbandTemplate | undefined; out: number }) {
  const [expanded, setExpanded] = useState(false)
  const kit = perModelKit(group.equipment, group.size)
  const tags: CardTag[] = [{ label: group.size === 1 ? '1 model' : `${group.size} models`, tone: 'neutral' }]
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
      <WarriorBody
        equipment={kit.items}
        kitLabel={kit.exact && group.size > 1 ? 'Each carries' : 'Equipment'}
        kitNote={kit.exact ? undefined : `Group totals shown: the kit does not divide evenly between ${group.size} models.`}
        rules={groupRules(group, template)}
        expanded={expanded}
      />
    </Card>
  )
}

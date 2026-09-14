import { ItemLeadershipControl } from './ItemLeadershipControl'
import { WarHornControl } from './WarHornControl'
import { NetterControl } from './NetterControl'
import {TabletopSlaaneshiHold} from './TabletopSlaaneshiHold'
import {useSlaaneshiHolds} from '../../../api/slaaneshiHolds'
import {isMisericordia} from '../../../rules/resolve/cavalcadeCapture'
import {fetchEngines} from '../../../api/engines'
import {canManCatcherCapture} from '../../../rules/resolve/engineOfChaos'
import {useManualCasualty,manualCasualtyToken} from '../../../api/manualCasualties'
import {attackEventPayloadSchema} from '../../../domain/battleEvent'
import {subjugatorCaptures,isManCatcherItem} from '../../../rules/resolve/forcedCapture'
import { TabletopChambers } from './TabletopChambers'
import { combatantsOf } from '../fight/combatants'
import type { ReactNode } from 'react'
import { RosterChambers } from './RosterChambers'
import { RelicLeadershipControl } from './RelicLeadershipControl'
import { ElvenWineControl } from './ElvenWineControl'
import { BugmansAleControl } from './BugmansAleControl'
import { useBattleTurns } from '../../../api/battleTurns'
import { HealingHerbsControl } from './HealingHerbsControl'
import type { ItemRow } from '../../../domain'
import { conditionsFor } from './sheet'
import { useState } from 'react'
import { warbandTurnKey, combatPhaseKey, eventContribution, type BattleEventRow, type BattleLiveState } from '../../../domain'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterHenchmanGroup, RosterWarband, DoubleBarrelSkillReload } from '../../../rules/types/roster'
import { Button, Stepper, Notice } from '../../../ui'
import { Card, Section, Tag } from '../../roster/view/bits'
import { WarriorBody, WarriorHead } from './cards'
import { ExperienceReminders } from './ExperienceReminders'
import { groupRules, groupTypeName, modelLabel, warriorRules, warriorTags, warriorTypeName, type CardTag } from './names'
import { addEnemyOut, animalsFighting, fightingGroups, groupOut, isHeroOut, perModelKit, setDisplayedGroupOut, setTakenOutBy, setWoundsLost, splitWarriors, takenOutBy, toggleHeroOut, woundsLost, type SheetWarrior } from './sheet'
import { TakenOutBySheet } from './TakenOutBySheet'
import { useEnemyRosters } from '../fight/useEnemyRosters'
import type { MatchParticipantView } from '../../../api/matches'
import type { TakenOutBy } from '../../../domain'

export interface MyWarbandTabProps {
  tabletopAmmunition?: boolean
  reloadRule?: DoubleBarrelSkillReload
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

export function MyWarbandTab({ roster, template, sheet, rawSheet = sheet, edit: editSheet, readOnly: externallyReadOnly, events = [], matchId, others = [], items = [], healingHerbsSingleUse = false, tabletopAmmunition = false, reloadRule = 'none' }: MyWarbandTabProps) {
  const casualty=useManualCasualty()
  const [busy,setBusy]=useState(false),[casualtyError,setCasualtyError]=useState('')
  const readOnly=externallyReadOnly||busy||casualty.isPending
  const edit:MyWarbandTabProps['edit']=(fn)=>{
    if(readOnly)return
    const next=fn(rawSheet)
    const remove=events.filter(e=>!e.reverted_at&&e.payload.metadata_only&&e.payload.target_warband_id===roster.id&&e.payload.casualty_token&&
      (e.payload.manual_casualty_index??0)>=(next.tallies.find(t=>t.id===e.payload.target_id)?.outOfAction??0)&&
      (rawSheet.tallies.find(t=>t.id===e.payload.target_id)?.outOfAction??0)>(next.tallies.find(t=>t.id===e.payload.target_id)?.outOfAction??0))
    if(!matchId||!remove.length){editSheet(fn);return}
    setBusy(true);setCasualtyError('')
    void (async()=>{
      try{for(const e of remove)await casualty.mutateAsync({matchId,warbandId:roster.id,token:e.payload.casualty_token!,reason:'Manual casualty removed from the battle sheet.'});editSheet(fn)}
      catch(e){setCasualtyError(e instanceof Error?e.message:'Could not remove the casualty.')}
      finally{setBusy(false)}
    })()
  }
  const turns = useBattleTurns(matchId ?? '')
  const holds = useSlaaneshiHolds(matchId)
  const ammunition = (id:string) => {
    if(!tabletopAmmunition)return null
    const warrior=combatantsOf(roster,template,roster.name,sheet).find(w=>w.id===id)
    return warrior?<TabletopChambers reloadRule={reloadRule} warrior={warrior} items={items} events={events} sheet={sheet} ownTurn={Number(warbandTurnKey(roster.id,sheet.turn,turns.data).split(':').at(-1))} readOnly={readOnly} edit={edit}/>:null
  }
  const conditions = conditionsFor(events, roster.id, sheet.turn, turns.data?.recoveries, holds.data)
  const warriors = splitWarriors(roster, sheet)
  const groups = fightingGroups(roster, sheet)
  const animals = animalsFighting(roster)
  const enemies = useEnemyRosters(matchId ?? '', matchId ? others : [])
  const [asking, setAsking] = useState<Asking | null>(null)

  async function answer(by: TakenOutBy) {
    if (!asking||readOnly) return
    const { id, index } = asking
    setBusy(true);setCasualtyError('')
    try{
      if(matchId){
        const token=manualCasualtyToken(matchId,roster.id,id,index)
        const enemy=enemies.warbands.find(w=>w.roster.id===by.warbandId)
        const heroAttacker=enemy?.roster.heroes.find(h=>h.id===by.modelId)
        const attacker=heroAttacker??enemy?.roster.hiredSwords.find(h=>h.id===by.modelId)??enemy?.roster.henchmenGroups.find(g=>g.id===by.modelId)
        const target=combatantsOf(roster,template,roster.name,sheet).find(w=>w.id===id)
        const subjugator=attacker&&target&&subjugatorCaptures({outOfAction:true,attackerIsHero:Boolean(heroAttacker),skills:heroAttacker?.skillIds??[],equipment:attacker.equipment.filter(e=>e.quantity>0).flatMap(e=>e.itemId?[e.itemId]:[]),targetLarge:target.traitIds.includes('large_target')})
        const engineRows=by.captureWeapon==='man_catcher'&&enemy?.roster.warbandTemplateId==='black_dwarfs'?await fetchEngines(enemy.roster.id):[]
        const manCatcher=attacker&&target&&canManCatcherCapture({outOfAction:true,usedManCatcher:by.captureWeapon==='man_catcher'&&attacker.equipment.some(e=>e.quantity>0&&isManCatcherItem(e.itemId)),engineAvailable:engineRows.some(e=>e.state==='present'),targetLarge:target.traitIds.includes('large_target'),targetAnimal:Boolean(target.isAnimal||target.kind==='animal')})
        const cavalcade=heroAttacker&&target?.kind==='henchman'&&enemy?.roster.warbandTemplateId==='the_cursed_cavalcade'&&isMisericordia(by.captureWeapon)&&by.cavalcadeCapture
        if(attacker&&target&&(subjugator||manCatcher||cavalcade)){
          const payload=attackEventPayloadSchema.parse({attacker_warband_id:enemy!.roster.id,attacker_id:attacker.id,attacker_kind:enemy!.roster.henchmenGroups.some(g=>g.id===attacker.id)?'group':'hero',attacker_name:attacker.name,target_warband_id:roster.id,target_id:id,target_kind:target.kind==='henchman'?'group':'hero',target_name:target.name,target_size:target.groupSize??1,target_unit_template_id:target.unitTemplateId,out_of_action:true,kill:false,wounds_lost:0,outcome:cavalcade&&!cavalcade.captured?'Out of action at the table':'Captured at the table',out_of_action_weapon_id:cavalcade?by.captureWeapon:manCatcher?'man_catcher':undefined,cavalcade_capture:cavalcade||undefined,rolls:cavalcade?[`Capture!: ${cavalcade.originalRoll===null?'tabletop result '+cavalcade.roll:'app rolled '+cavalcade.originalRoll+(cavalcade.originalRoll!==cavalcade.roll?'; player changed this to '+cavalcade.roll:'')}. ${cavalcade.captured?'Captured; resolve the Throne of Worms.':'Not captured; resolve normal henchman survival.'}`]:[],turn:sheet.turn,capture_reason:cavalcade?(cavalcade.captured?'cavalcade':undefined):subjugator?'subjugator':'man_catcher',capture_source:'table',metadata_only:true,manual_casualty_index:index,casualty_token:token})
          await casualty.mutateAsync({matchId,warbandId:roster.id,token,payload})
        }else if(events.some(e=>!e.reverted_at&&e.payload.casualty_token===token))await casualty.mutateAsync({matchId,warbandId:roster.id,token,reason:'Changed who caused this manual casualty.'})
      }
      editSheet((s) => {
        const current = [...takenOutBy(s, id)]
        current[index] = by
        return setTakenOutBy(s, id, current.map((x) => x ?? { warbandId: null, modelId: null, name: 'unknown', turn: s.turn }))
      })
      setAsking(null)
    }catch(e){setCasualtyError(e instanceof Error?e.message:'Could not record the capture.')}
    finally{setBusy(false)}
  }

  return (
    <>
      {casualtyError?<Notice tone="error" title="Could not update the casualty">{casualtyError}</Notice>:null}
      {matchId?<TabletopSlaaneshiHold matchId={matchId} roster={roster} enemies={enemies.warbands} turn={sheet.turn} readOnly={readOnly||enemies.isPending}/>:null}
      <WarHornControl roster={roster} items={items} sheet={sheet} phaseKey={combatPhaseKey(sheet.turn, turns.data)} readOnly={readOnly || turns.isPending || turns.isError} edit={edit} />
      <ElvenWineControl roster={roster} items={items} sheet={sheet} readOnly={readOnly} edit={edit} />
      <BugmansAleControl roster={roster} template={template} items={items} sheet={sheet} readOnly={readOnly} edit={edit} />
      <Section title="Heroes & hired swords" aside={`${warriors.fighting.length} fighting`}>
        {warriors.fighting.length === 0 ? <p className="text-sm text-ink-dim">Nobody is fit to fight.</p> : null}
        {warriors.fighting.map((entry) => (
          <div key={entry.warrior.id}><MyWarriorCard chambers={<RosterChambers warbandId={roster.id} warriorId={entry.warrior.id} items={items} events={events} sheet={sheet} matchId={matchId} />} condition={conditions.get(entry.warrior.id)} entry={entry} template={template} sheet={sheet} edit={edit} readOnly={readOnly} fromLog={eventContribution(events, roster.id, entry.warrior.id)} onAsk={(name) => setAsking({ id: entry.warrior.id, name, index: 0 })} />{ammunition(entry.warrior.id)}<ItemLeadershipControl phaseKey={combatPhaseKey(sheet.turn, turns.data)} roster={roster} warriorId={entry.warrior.id} sheet={sheet} readOnly={readOnly} edit={edit}/><RelicLeadershipControl roster={roster} warriorId={entry.warrior.id} name={entry.warrior.name} sheet={sheet} readOnly={readOnly} edit={edit} />{entry.role === 'hero' ? <NetterControl hero={entry.warrior} sheet={sheet} edit={edit} readOnly={readOnly} /> : null}{entry.role === 'hero' ? <HealingHerbsControl warriorId={entry.warrior.id} roster={roster} items={items} sheet={sheet} rawSheet={rawSheet} events={events} edit={edit} readOnly={readOnly} singleUse={healingHerbsSingleUse} /> : null}</div>
        ))}
      </Section>

      <Section title="Henchmen" aside={`${groups.reduce((n, g) => n + g.size, 0)} models`}>
        {groups.length === 0 ? <p className="text-sm text-ink-dim">No henchman groups.</p> : null}
        {groups.map((group) => (
          <div key={group.id}><MyGroupCard manualOut={groupOut(rawSheet,group.id)} fromLog={eventContribution(events,roster.id,group.id).outOfAction} chambers={<RosterChambers warbandId={roster.id} warriorId={group.id} items={items} events={events} sheet={sheet} matchId={matchId} groupSize={group.rosterSize ?? group.size} />} condition={conditions.get(group.id)} group={group} template={template} sheet={sheet} edit={edit} readOnly={readOnly} onAsk={(index) => setAsking({ id: group.id, name: `one of the ${group.name}`, index })} />{ammunition(group.id)}<ItemLeadershipControl phaseKey={combatPhaseKey(sheet.turn, turns.data)} roster={roster} warriorId={group.id} sheet={sheet} readOnly={readOnly} edit={edit}/><RelicLeadershipControl roster={roster} warriorId={group.id} name={group.name} sheet={sheet} readOnly={readOnly} edit={edit} /></div>
        ))}
      </Section>

      <TakenOutBySheet matchId={matchId} targetGroupId={asking&&roster.henchmenGroups.some(g=>g.id===asking.id)?asking.id:undefined} key={`${asking?.id}:${asking?.index}`} allowManCatcher={Boolean(asking&&combatantsOf(roster,template,roster.name,sheet).some(w=>w.id===asking.id&&!w.isAnimal&&w.kind!=='animal'&&!w.traitIds.includes('large_target')))} open={asking !== null} subjectName={asking?.name ?? ''} enemies={enemies.warbands} enemiesPending={Boolean(matchId) && enemies.isPending} turn={sheet.turn} pending={busy||casualty.isPending} error={casualtyError} onPick={answer} onClose={() => {if(!busy&&!casualty.isPending)setAsking(null)}} />

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
                    <Button variant={out ? 'secondary' : 'danger'} disabled={readOnly||eventContribution(events,roster.id,animal.id).outOfAction>0} onClick={() => {edit((s) => toggleHeroOut(s, animal.id));if(!out)setAsking({id:animal.id,name:animal.name,index:0})}} aria-pressed={out}>
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
  chambers?: ReactNode
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

function MyWarriorCard({ chambers, condition, entry, template, sheet, edit, readOnly, fromLog, onAsk }: MyWarriorCardProps) {
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
      {chambers}
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
              disabled={readOnly||fromLog.outOfAction>0}
              onClick={() => {
                edit((s) => toggleHeroOut(s, warrior.id))
                if (!out) onAsk(warrior.name)
              }}
              aria-pressed={out}
            >
              {out ? 'Back in' : 'Out of action'}
            </Button>
            {fromLog.outOfAction>0?<p className="max-w-52 text-right text-xs text-ink-dim">Recorded in the combat log. Reverse that entry to correct it.</p>:null}
            {out && !readOnly && !fromLog.outOfAction ? (
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
  manualOut: number
  fromLog: number
  chambers?: ReactNode
  condition?: string
  group: RosterHenchmanGroup
  template: WarbandTemplate | undefined
  sheet: BattleLiveState
  edit: MyWarbandTabProps['edit']
  readOnly: boolean
  /** Ask who took the model at this index out. */
  onAsk: (index: number) => void
}

function MyGroupCard({ manualOut, fromLog, chambers, condition, group, template, sheet, edit, readOnly, onAsk }: MyGroupCardProps) {
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
      {chambers}
      <WarriorBody
        skillIds={group.unitTemplateId === 'pirates_swabbie' ? group.campaignState?.inheritedSkillIds : undefined}
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
            <span className="text-[10px] uppercase tracking-wider text-ink-dim">Out of action{fromLog>0?` · ${fromLog} from the log`:null}</span>
            <Stepper
              value={out}
              onChange={(next) => {
                edit((s) => setDisplayedGroupOut(s, group.id, next, group.size, fromLog))
                if (next > out) onAsk(next - Math.min(group.size,fromLog) - 1)
              }}
              label={`${group.name} out of action`}
              min={Math.min(group.size,fromLog)}
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
                {!readOnly&&i<manualOut ? (
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

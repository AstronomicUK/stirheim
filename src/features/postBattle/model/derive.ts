import { garlicExpiry } from './garlicExpiry'
import {reportTradeWagon,applyTradeWagonToReport,afterTradeWagonCapture} from './tradeWagonReport'
import { brokenWeaponSettlement } from './brokenWeapons'
import { delayedLeaderUnit, leaderWaitingGameUpdates } from '../../../rules/resolve/leaderReplacement'
import {specialKillProblems, type SpecialKillXp} from './specialKillXp'
import {needsSurvivalXpTest, validSurvivalXpRoll} from './survivalXp'
import {advanceAuditText} from '../../advances/model'
import {describeInjuryAttempt} from './injuryRollHistory'
import {applyShrineBlessing} from './shrineBlessing'
import {woodsCasualtyDraft,woodsInjuryDraft,lycanthropeReport,applyLycanthropeReport} from './lycanthropeReport'
import {medicineChestUses} from './medicineChest'
import {rawhideReport} from './rawhideReport'
import {raidsRewards,type RaidSurvivors} from './raidsRewards'
import {absentGroupModels,afterAbsenceBattle} from '../../../rules/resolve/groupAbsences'
import { stopThiefRewards } from './stopThiefRewards'
import { rockRewards } from './rockRewards'
import { rockConscripts } from './rockConscripts'
import { encampmentRewards } from './encampmentRewards'
import { groupEquipmentLosses } from './groupEquipmentLosses'
import { mixedPirateCrew } from '../../../rules/resolve/mixedHireUpkeep'
import { caravanRewards } from './caravanRewards'
import { harpyRewards } from './harpyRewards'
import { ritualZombies } from './scenarioRecruits'
import { kidnappedRewards } from './kidnappedRewards'
import { conditionalHireDepartures, hiredSwordGainsExperience } from '../../../rules/resolve/hiredSwordRules'
import { pettyThief } from './pettyThief'
import { locationRecruits } from './locationRecruits'
import { scenarioRewardRule } from '../../../rules/data/campaign/scenarioRewardRules'
import { forbiddenSquareRewards } from './forbiddenSquareRewards'
import { brigandsRewards } from './brigandsRewards'
import { scenarioRewards } from './scenarioRewards'
import { towerTreasure } from './scenarioTreasure'
import type { ArtefactDiscovery } from '../../../api/artefacts'
import { slayerExploration } from './slayerExploration'
import { battleTreasureAwards } from '../../../rules/resolve/battleTreasure'
import { ONE_BATTLE_HIRES, requiresBattleGap } from '../../../rules/resolve/hiredSwordRules'
import { isDramatisPersona } from '../../../rules/data/campaign/hiredSwords'
import { resolvePersonaInjury } from './injuries'
// From the draft and the roster to the BattleReport the server applies. Everything here is pure
// and recomputed on every edit; `report` is null until every step is complete.
//
// Patches follow the resolvers: heroes get stats / injuries / flags / status from the injury
// step and xp from the experience step; groups get size and xp. Advances are never resolved here
// (Phase 8): each threshold crossed becomes a pending_advances request and level_ups is untouched.
//
// Judgements:
// - Items: when a hero's resolved equipment is empty but they carried something (Dead: "All the
//   weapons and equipment he carried are lost"; Robbed: "all his weapons, armour and equipment
//   are lost"), the item rows they held go in remove_item_ids. Dead heroes are not deleted (status
//   becomes dead), so nothing moves to the stash. Hired swords' kit is never touched.
// - Heroes who sat this game out because of missNextGames have the counter reduced by one in
//   their flags patch: the game they had to miss has now been played. Nothing else in the app
//   counts games down.
// - Wyrdstone and gold picked up during the battle itself (scenario objectives, loot) are added
//   to the treasury alongside the exploration finds; they appear in the notes for the record.

import type { BattleReport, HenchmanInjuryLine, HeroInjuryLine, ItemRow, OoaLine, ReportAdjustment, ReportApplied, XpLine } from '../../../domain'
import { REPORT_VERSION } from '../../../domain'
import { xpThresholds, type AdvanceRate } from '../../../rules/data/campaign/experience'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterHenchmanGroup, RosterHero, RosterHiredSword, RosterWarband } from '../../../rules/types/roster'
import { deriveExploration, type ExplorationDerived } from './exploration'
import { resolveGroupInjuries, resolveHeroInjuryFlow, resolveHiredSwordInjury, type GroupInjuryResolution, type HeroInjuryResolution, type HiredSwordInjuryResolution, type InjuryOutcome } from './injuries'
import { participantsOf, type Participants } from './participants'
import { advanceKey, isDie, STEP_IDS, type AdvanceMode, type ReportDraft, type StepId } from './state'
import { isConsumable } from '../../../rules/data/itemRules'
import { applyStatDelta, deriveKit, kitEffects, type KitDerived } from './kit'
import { animalFighters, type AnimalFighter } from '../../../rules/resolve/animals'
import { HENCHMAN_INJURY } from '../../../rules/data/campaign/injuries'
import { mapGrade } from '../../../rules/resolve/explorationAids'
import { unitGainsExperience, unitRules } from '../../../rules/data/campaignRules'
import { henchmanInjuryException } from '../../../rules/resolve/injuries'
import { groupXpLine, underdogBonusFor, warriorXpLine } from './xp'
import { scenarioAftermath } from '../../../rules/data/campaign/scenarioAftermath'
import { defaultPromotedName, effectiveStep, emptyDraft as emptyAdvanceDraft, findSubject, planGroup, planHero, subjectName, type AdvanceDraft, type AdvanceStep, type AdvanceSubject, type GroupPlan, type HeroPlan } from '../../advances/model'
import { skillTableName } from '../../roster/view/lookups'
import type { CampaignHouseRules } from '../../../rules/types/roster'
import type { MapPerks } from '../../../rules/resolve/mapAdvantages'
import { d3Of } from './state'

export interface ReportContext {
  rawGroups?: readonly import('../../../domain').HenchmanGroupRow[]
  opponentResults?: Record<string,'won'|'lost'|'draw'>
  battleEvents?: import('../../../domain').BattleEventRow[]
  specialKillXp?: Record<string, SpecialKillXp>
  specialKillXpLoading?: boolean
  specialKillXpError?: string
  rawhideCargo?: import('../../../api/rawhide').RawhideCargo
  rawhideEnded?: boolean
  raidSurvivors?: RaidSurvivors
  campaignId?: string
  opponents?: {id:string;name:string}[]
  artefacts?: ArtefactDiscovery[]
  artefactsError?: string
  reportId?: string
  scenarioId?: string | null
  roster: RosterWarband
  template: WarbandTemplate | undefined
  /** Item rows of the warband, to find the row ids behind a hero's equipment. */
  items: readonly ItemRow[]
  matchId: string
  /** This warband's rating going into the battle. */
  myRating: number
  /** Highest rating among the opponents, or null when there were none. */
  opponentRating: number | null
  /** The campaign's house rules (defaults when the warband is in no campaign). */
  houseRules?: CampaignHouseRules
  /** Outcomes recorded on the battle sheet before the game (tarot readings, list rules). */
  preBattle?: Record<string, string>
  /** Consumables marked as used on the battle sheet: warrior id -> item ids. */
  itemsUsed?: Record<string, string[]>
  healingHerbUses?: import('../../../domain/battle').BattleLiveState['healingHerbUses']
  /** Doses the habit already used up at battle start (addiction_supplies for this match): the report must not use a second one. */
  addictionSupplies?: readonly { hero_id: string; item_rules_id: string }[]
  /** Warriors of this warband a Nurgle's Rot carrier wounded on a 6 (from the shared combat log): they contract the Rot. */
  rotVictims?: string[]
  /** Map campaigns: the battle's district and the advantages this warband held going into it. */
  map?: MapReportContext | null
  /** From the battle sheet: who took each warrior out, one entry per model (names already resolved). */
  takenOutBy?: Record<string, string[]>
}

export interface MapReportContext {
  districtId: string
  districtName: string
  /** Abundance of Wyrdstone: the winner gains D3 extra shards. */
  abundance: boolean
  perks: MapPerks
}

export interface InjurySummary {
  dead: number
  captured: number
  retired: number
  injured: number
  recovered: number
  henchmenDead: number
  /** Rolls still to be made across every warrior. */
  pending: number
}

export interface InjuriesDerived {
  raidSurvivors?: RaidSurvivors
  raidOutcome?: ReturnType<typeof raidsRewards>
  heroes: { hero: RosterHero; resolution: HeroInjuryResolution }[]
  hiredSwords: { sword: RosterHiredSword; resolution: HiredSwordInjuryResolution }[]
  /** `dice` is the number rolled: models out of action unless the player overrode it. */
  groups: { group: RosterHenchmanGroup; outOfAction: number; dice: number; resolution: GroupInjuryResolution }[]
  /** Animals taken out of action: a D6 each, dead on 1-2 (the item is lost). */
  animals: { animal: AnimalFighter; roll: number | null; dead: boolean | null }[]
  summary: InjurySummary
  complete: boolean
}

export interface XpDerived {
  lines: XpLine[]
  /** The bonus the rating difference would give, whether or not the toggle is on. */
  underdogAvailable: number
  /** The bonus actually applied. */
  underdogApplied: number
}

/** Placeholder id for a promotion draft the step has not seeded yet; never reaches the server. */
export const UNSEEDED_HERO_ID = '00000000-0000-4000-8000-000000000000'

/** One advance earned this battle, as the Advances step sees it. */
export interface WizardAdvance {
  key: string
  request: ReportApplied['pending_advances'][number]
  /** Null when the warrior died or left in this very report. */
  subject: AdvanceSubject | null
  name: string
  draft: AdvanceDraft
  /** False until the step has stored a draft (with a real new-hero id) for it. */
  seeded: boolean
  mode: AdvanceMode
  plan: HeroPlan | GroupPlan | null
  step: AdvanceStep
  /** Nothing more is needed from the player for this advance. */
  complete: boolean
  /** One line for the review: what was rolled and chosen, or what was deferred. */
  summary: string
}

export interface AdvancesDerived {
  items: WizardAdvance[]
  /** The roster after the report and every advance resolved in the wizard. */
  rosterAfter: RosterWarband
  problems: string[]
}

export interface DerivedReport {
  brokenEquipment: ReturnType<typeof brokenWeaponSettlement>
  shrine: ReturnType<typeof applyShrineBlessing>
  lycanthrope: ReturnType<typeof lycanthropeReport>
  equipmentLosses: ReturnType<typeof groupEquipmentLosses>
  recruits: ReturnType<typeof locationRecruits>
  participants: Participants
  /** Kit after the battle: drugs' side effects, ruined clothes, maps and wishes. */
  kit: KitDerived
  advances: AdvancesDerived
  /** Heroes (not hired swords) who fought and were not out of action. */
  survivingHeroes: RosterHero[]
  injuries: InjuriesDerived
  xp: XpDerived
  exploration: ExplorationDerived
  veteranPool: number | null
  problems: Record<StepId, string[]>
  /** Index of the first step with a problem, or null when the report is complete. */
  firstIncompleteStep: number | null
  report: BattleReport | null
}

export function heroOoaIds(draft: ReportDraft): Set<string> {
  return new Set(draft.heroesOut)
}

/** A warrior whose injury roll was waived: a full recovery with no dice, the reason on the line. */
function skippedHero(hero: RosterHero, reason: string): HeroInjuryResolution {
  return {
    hero,
    steps: [],
    pending: { kind: 'done' },
    outcome: 'recovered',
    line: { subjectType: 'hero', subjectId: hero.id, subjectName: hero.name, rolls: [], injuryCode: null, injuryName: 'No roll', effect: `No injury roll: ${reason}`, outcome: 'recovered' },
  }
}

function skippedSword(sword: RosterHiredSword, reason: string): HiredSwordInjuryResolution {
  return {
    sword,
    outcome: 'recovered',
    line: { subjectType: 'hiredSword', subjectId: sword.id, subjectName: sword.name, rolls: [], injuryCode: null, injuryName: 'No roll', effect: `No injury roll: ${reason}`, outcome: 'recovered' },
  }
}

export function deriveInjuries(draft: ReportDraft, participants: Participants, matchId: string, roster?: RosterWarband, perks?: MapPerks | null, scenarioId?: string | null): InjuriesDerived {
  const burning = scenarioId === 'mordheim_s_burning'
  const plant = (id:string) => scenarioId === 'the_hunters_become_the_hunted' && !!draft.plantCasualties?.[id]
  const out = heroOoaIds(draft)
  const heroes = participants.heroes
    .filter((h) => out.has(h.id))
    .map((hero) => {
      const skip = draft.injurySkips[hero.id]
      if (plant(hero.id) && skip === undefined) {
        const die=draft.scenarioInjuryDice?.[hero.id]
        const res=resolveHeroInjuryFlow(hero,{rolls:isDie(die,6)?[{d66:die===1?11:41,subRoll:null}]:[],countRoll:null},matchId)
        if(res.line&&isDie(die,6))res.line={...res.line,rolls:[die],injuryName:die===1?'Eaten by a carnivorous plant':'Escaped the plant',effect:die===1?'Eaten: removed from the campaign with carried equipment.':'Survives the plant injury roll.'}
        return {hero,resolution:res}
      }
      if (burning && skip === undefined) {
        const die = draft.scenarioInjuryDice?.[hero.id]
        const res = resolveHeroInjuryFlow(hero, { rolls: isDie(die, 6) ? [{ d66: die === 6 ? 41 : 11, subRoll: null }] : [], countRoll: null }, matchId)
        if (res.line && isDie(die, 6)) res.line = { ...res.line, rolls: [die], injuryName: die === 6 ? 'Praise Be Sigmar!' : 'Death in the flames', effect: die === 6 ? 'Survived Mordheim’s Burning unharmed; +1 Experience.' : 'Mordheim’s Burning: dies on 1–5.' }
        if (die === 6) res.hero = { ...res.hero, xp: res.hero.xp + 1 }
        return { hero, resolution: res }
      }
      const resolution = skip !== undefined ? skippedHero(hero, skip) : resolveHeroInjuryFlow(hero, draft.heroInjuries[hero.id] ?? { rolls: [], countRoll: null }, matchId, perks)
      if (perks?.pitFightAutoWin && resolution.line?.injuryCode==='sold_to_the_pits' && resolution.hero.flags.pitFightOwed) {
        const {pitFightOwed: _owed,...flags}=resolution.hero.flags
        const effect=`${perks.pitFightAutoWin.districtName}: automatically won the pit fight; +50 gc, +2 Experience; kept equipment.`
        resolution.hero={...resolution.hero,xp:resolution.hero.xp+2,flags,injuries:resolution.hero.injuries.map((injury,index,all)=>index===all.findLastIndex(i=>i.injuryCode==='sold_to_the_pits')?{...injury,effect}:injury)}
        resolution.outcome='recovered'
        resolution.pitFightGold=50
        resolution.line={...resolution.line,effect,outcome:'recovered'}
        resolution.steps=resolution.steps.map(step=>step.code==='sold_to_the_pits'?{...step,effect}:step)
      }
      return {hero,resolution}
    })
  const hiredSwords = participants.hiredSwords
    .filter((s) => out.has(s.id))
    .map((sword) => {
      const skip = draft.injurySkips[sword.id]
      if (plant(sword.id) && skip === undefined) {
        const die=draft.swordInjuries[sword.id]??null
        const res=resolveHiredSwordInjury(sword,isDie(die,6)?die===1?1:6:null)
        if(res.line&&isDie(die,6))res.line={...res.line,rolls:[die],injuryName:die===1?'Eaten by a carnivorous plant':'Escaped the plant',effect:die===1?'Eaten: removed from the campaign with carried equipment.':'Survives the plant injury roll.'}
        return {sword,resolution:res}
      }
      if (burning && skip === undefined) {
        const die = draft.swordInjuries[sword.id] ?? null
        const res = resolveHiredSwordInjury(sword, isDie(die, 6) ? die === 6 ? 6 : 1 : null)
        if (res.line && isDie(die, 6)) res.line = { ...res.line, rolls: [die], injuryName: die === 6 ? 'Praise Be Sigmar!' : 'Death in the flames', effect: die === 6 ? 'Survived Mordheim’s Burning unharmed; +1 Experience.' : 'Mordheim’s Burning: dies on 1–5.' }
        if (die === 6) res.sword = { ...res.sword, xp: res.sword.xp + 1 }
        return { sword, resolution: res }
      }
      if (isDramatisPersona(sword.hiredSwordId) && skip === undefined) return { sword, resolution: resolvePersonaInjury(sword, draft.heroInjuries[sword.id] ?? { rolls: [], countRoll: null }, matchId, perks) }
      return { sword, resolution: skip !== undefined ? skippedSword(sword, skip) : resolveHiredSwordInjury(sword, draft.swordInjuries[sword.id] ?? null) }
    })
  const groups = participants.groups
    .filter((g) => (draft.groupsOut[g.id] ?? 0) > 0)
    .map((group) => {
      const outOfAction = Math.min(group.size, draft.groupsOut[group.id] ?? 0)
      const hasPlants=Array.from({length:outOfAction},(_,i)=>plant(`${group.id}:${i}`)).some(Boolean)
      const dice = draft.groupInjuryDice[group.id]?.count ?? (!burning && !hasPlants && henchmanInjuryException(group)?.deadOn.length === 0 ? 0 : outOfAction)
      if (hasPlants) {
        const rolls=(draft.groupInjuries[group.id]??[]).slice(0,dice)
        let current=group
        for(let i=0;i<dice;i++)if(isDie(rolls[i],6))current=plant(`${group.id}:${i}`)?{...current,size:Math.max(0,current.size-(rolls[i]===1?1:0))}:resolveGroupInjuries(current,1,[rolls[i]]).group
        const dead=group.size-current.size,complete=rolls.length===dice&&rolls.every(r=>isDie(r,6))
        return {group,outOfAction,dice,resolution:{group:current,dead,complete,line:complete?{subjectType:'group' as const,subjectId:group.id,subjectName:group.name,rolls:rolls as number[],dead}:null}}
      }
      if (burning) {
        const rolls = (draft.groupInjuries[group.id] ?? []).slice(0, dice).filter((r): r is number => isDie(r, 6))
        const dead = rolls.filter(r => r < 6).length
        const complete = rolls.length === dice
        return { group, outOfAction, dice, resolution: { group: { ...group, size: Math.max(0, group.size - dead), xp: group.xp + (rolls.includes(6) ? 1 : 0) }, dead, complete, line: complete ? { subjectType: 'group' as const, subjectId: group.id, subjectName: group.name, rolls, dead } : null } }
      }
      return { group, outOfAction, dice, resolution: resolveGroupInjuries(group, dice, draft.groupInjuries[group.id] ?? []) }
    })

  const raidSurvivors:RaidSurvivors|undefined=scenarioId==='raids'?{
    warriors:[...participants.heroes.map(h=>({original:h,current:heroes.find(r=>r.hero.id===h.id)?.resolution.hero??h})),...participants.hiredSwords.map(h=>({original:h,current:hiredSwords.find(r=>r.sword.id===h.id)?.resolution.sword??h}))].filter(h=>h.current.status==='active').map(h=>({id:h.current.id,name:h.current.name,canSurrender:!out.has(h.original.id)})),
    groups:participants.groups.map(g=>({group:groups.find(r=>r.group.id===g.id)?.resolution.group??g,canSurrender:Math.max(0,g.size-(draft.groupsOut[g.id]??0))}))
  }:undefined
  const raidOutcome=raidSurvivors?raidsRewards(draft.scenarioRewards?.raids??{},raidSurvivors):undefined
  for(const [id,ambush] of Object.entries(raidOutcome?.ambushGroups??{})){
    const existing=groups.find(g=>g.group.id===id),original=participants.groups.find(g=>g.id===id)!
    const dead=(existing?.resolution.dead??0)+ambush.dead
    const resolution={group:ambush.group,dead,complete:existing?.resolution.complete??true,line:{subjectType:'group' as const,subjectId:id,subjectName:original.name,rolls:[...(existing?.resolution.line?.rolls??[]),...ambush.rolls],dead}}
    if(existing)existing.resolution=resolution;else groups.push({group:original,outOfAction:0,dice:0,resolution})
  }

  const animalIds = new Set(draft.animalsOut)
  const animals = animalFighters(roster ?? { heroes: participants.heroes } as RosterWarband)
    .filter((a) => animalIds.has(a.id))
    .map((animal) => {
      const roll = draft.animalInjuries[animal.id] ?? null
      return { animal, roll, dead: isDie(roll, 6) ? burning ? roll < 6 : HENCHMAN_INJURY.deadOn.includes(roll as number) : null }
    })
  const summary: InjurySummary = { dead: 0, captured: 0, retired: 0, injured: 0, recovered: 0, henchmenDead: 0, pending: 0 }
  const count = (outcome: InjuryOutcome | null) => {
    if (outcome === null) summary.pending += 1
    else summary[outcome] += 1
  }
  for (const h of heroes) count(h.resolution.outcome)
  for (const s of hiredSwords) count(s.resolution.outcome)
  for (const g of groups) {
    summary.henchmenDead += g.resolution.dead
    if (!g.resolution.complete) summary.pending += 1
  }
  for (const a of animals) {
    if (a.dead === null) summary.pending += 1
    else if (a.dead) summary.henchmenDead += 1
  }
  return { heroes, hiredSwords, groups, animals, summary, complete: summary.pending === 0,raidSurvivors,raidOutcome }
}

function alive(outcome: InjuryOutcome | null): boolean {
  return outcome !== 'dead' && outcome !== 'retired'
}

export function scenarioRewardContext(ctx:ReportContext,injuries:InjuriesDerived):ReportContext {
  if(ctx.scenarioId==='raids')return {...ctx,raidSurvivors:injuries.raidSurvivors}
  if(ctx.scenarioId!=='assault_on_the_rock')return ctx
  return {...ctx,roster:{...ctx.roster,heroes:ctx.roster.heroes.map(h=>injuries.heroes.find(r=>r.hero.id===h.id)?.resolution.hero??h),hiredSwords:ctx.roster.hiredSwords.map(h=>injuries.hiredSwords.find(r=>r.sword.id===h.id)?.resolution.sword??h),henchmenGroups:ctx.roster.henchmenGroups.map(g=>{const resolved=injuries.groups.find(r=>r.group.id===g.id)?.resolution.group;return resolved?{...resolved,size:resolved.size+absentGroupModels(g)}:g})}}
}

export function deriveXp(draft: ReportDraft, participants: Participants, injuries: InjuriesDerived, ctx: ReportContext, locationAwards: import('./locationXp').LocationXpAward[] = []): XpDerived {
  const underdogAvailable = underdogBonusFor(ctx.myRating, ctx.opponentRating)
  const underdogApplied = draft.underdog ? underdogAvailable : 0
  const won = draft.result === 'won'
  const extras = { ...draft.xpExtras }
  for (const award of locationAwards) extras[award.id] = [...(extras[award.id] ?? []), {amount:award.amount,reason:award.reason}]
  const xpCtx = { specialKillXp: { ...ctx.specialKillXp, ...draft.specialKillXp }, survivalXpTests: draft.survivalXpTests, won, leaderId: participants.leaderId, underdogBonus: underdogApplied, enemiesOut: draft.enemiesOut, extras, scenarioAwards: scenarioAftermath(ctx.scenarioId, draft.scenarioMission, draft.scenarioUseBody).defaults, zombieKills: ctx.scenarioId === 'the_sword_of_the_herald' ? draft.scenarioZombieKills : undefined }
  if(ctx.scenarioId==='brigands_in_the_pasturelands') { const amount=draft.scenarioRewards?.brigands?.role==='defender'?2:1; xpCtx.scenarioAwards={survival:amount,leader:amount,kill:1} }
  const heroAfter = new Map(injuries.heroes.map((h) => [h.hero.id, h.resolution]))
  const swordAfter = new Map(injuries.hiredSwords.map((s) => [s.sword.id, s.resolution]))
  const groupAfter = new Map(injuries.groups.map((g) => [g.group.id, g.resolution]))

  const coldOnes=draft.scenarioRewards?.hunters?.alive
  if(ctx.scenarioId==='the_hunters_become_the_hunted'&&won&&coldOnes!=null&&Number.isInteger(coldOnes)&&coldOnes>=1&&coldOnes<=2) {
    const surviving=[...participants.heroes.filter(h=>!heroAfter.has(h.id)||alive(heroAfter.get(h.id)!.outcome)),...participants.hiredSwords.filter(h=>!swordAfter.has(h.id)||alive(swordAfter.get(h.id)!.outcome)),...participants.groups.filter(g=>(groupAfter.get(g.id)?.group.size??g.size)>0)]
    for(const h of surviving)extras[h.id]=[...(extras[h.id]??[]),{amount:coldOnes,reason:`Winning survivor: ${coldOnes} Cold One${coldOnes===1?'':'s'} alive`}]
  }
  const lines: XpLine[] = []
  for (const hero of participants.heroes) {
    const res = heroAfter.get(hero.id)
    // An unfinished injury flow counts as alive for the preview; the report itself waits for it.
    const line = warriorXpLine('hero', hero, res?.hero ?? hero, res ? alive(res.outcome) : true, xpCtx)
    if (line) lines.push(line)
  }
  for (const sword of participants.hiredSwords) {
    const res = swordAfter.get(sword.id)
    const line = warriorXpLine('hiredSword', sword, res?.sword ?? sword, res ? alive(res.outcome) : true, xpCtx)
    if (line) lines.push(line)
  }
  for (const group of participants.groups) {
    const res = groupAfter.get(group.id)
    const line = groupXpLine(group, res?.group ?? group, xpCtx)
    if (line) lines.push(line)
  }
  for (const award of locationAwards.filter(a=>!participants.heroes.some(h=>h.id===a.id))) {
    const hero = ctx.roster.heroes.find(h=>h.id===award.id)
    if (hero) lines.push({subjectType:'hero',subjectId:hero.id,subjectName:hero.name,amount:award.amount,reasons:[award.reason],xpBefore:hero.xp,xpAfter:hero.xp+award.amount,advancesEarned:thresholdsCrossed('hero',hero.xp,hero.xp+award.amount,unitRules(hero.unitTemplateId).advanceRate??'normal').length})
  }
  return { lines, underdogAvailable, underdogApplied }
}

/** Threshold boxes crossed between two totals, as pending advance requests. */
export function thresholdsCrossed(role: 'hero' | 'henchman', xpBefore: number, xpAfter: number, rate: AdvanceRate = 'normal'): number[] {
  return xpThresholds(role, rate).filter((t) => t > xpBefore && t <= xpAfter)
}

export function veteranPoolOf(draft: ReportDraft): number | null {
  const [a, b] = draft.veteranPool
  if (!isDie(a, 6) || !isDie(b, 6)) return null
  // A third die where a map district allows 3D6 (Quayside, Memorial Gardens).
  return a + b + (isDie(draft.veteranPoolExtra, 6) ? draft.veteranPoolExtra : 0)
}

/** Every place the player overrode what the wizard suggested, for the report. */
export function reportAdjustments(draft: ReportDraft, participants: Participants, injuries: InjuriesDerived, exploration: ExplorationDerived): ReportAdjustment[] {
  const out: ReportAdjustment[] = []
  const nameOf = (id: string) => participants.heroes.find((h) => h.id === id)?.name ?? participants.hiredSwords.find((s) => s.id === id)?.name ?? id
  for (const [id, flow] of Object.entries(draft.heroInjuries)) {
    if (!draft.heroesOut.includes(id)) continue
    const attempts=flow.previousAttempts??[]
    attempts.forEach((attempt,i)=>out.push({
      label: `${nameOf(id)}: injury roll replacement ${i+1}`,
      suggested: describeInjuryAttempt(attempt),
      used: describeInjuryAttempt(attempts[i+1]??flow) || (draft.injurySkips[id]!==undefined?'no roll (recovered)':'no replacement result'),
      reason: attempt.reason,
    }))
  }
  for (const [id, reason] of Object.entries(draft.injurySkips)) {
    if (!draft.heroesOut.includes(id)) continue
    out.push({ label: `${nameOf(id)}: injury roll`, suggested: 'roll', used: 'no roll (recovered)', reason: reason.trim() })
  }
  for (const g of injuries.groups) {
    const o = draft.groupInjuryDice[g.group.id]
    if (o && o.count !== g.outOfAction) out.push({ label: `${g.group.name}: injury dice`, suggested: String(g.outOfAction), used: String(o.count), reason: o.reason.trim() })
  }
  if (exploration.adjustment) out.push(exploration.adjustment)
  return out
}

function stepProblems(draft: ReportDraft, injuries: InjuriesDerived, exploration: ExplorationDerived, kit: KitDerived, ctx: ReportContext): Record<StepId, string[]> {
  const problems: Record<StepId, string[]> = { outcome: [], casualties: [], injuries: [], experience: [], advances: [], exploration: [], veterans: [], review: [] }
  for (const row of garlicExpiry(ctx, draft)) if (!row.valid) problems.review.push(`${row.name}: record how many cloves of garlic were carried by the members who fought (0–${row.quantity}).`)
  const herbCounts = new Map<string, number>()
  for (const use of ctx.healingHerbUses ?? []) if (use.singleUse && !use.correction) herbCounts.set(use.itemRowId, (herbCounts.get(use.itemRowId) ?? 0) + 1)
  for (const [id, count] of herbCounts) {
    const row = ctx.items.find(item => item.id === id && item.item_rules_id === 'healing_herbs')
    if (!row || row.quantity < count) problems.review.push('Healing Herbs stock changed after use. Restore the spent doses to their original inventory row or correct the battle-sheet use before filing.')
  }
  const scenario = scenarioAftermath(ctx.scenarioId, draft.scenarioMission, draft.scenarioUseBody)
  if (ctx.specialKillXpLoading) problems.experience.push('Checking the opposing units for special experience rules.')
  if (ctx.specialKillXpError) problems.experience.push(ctx.specialKillXpError)
  const xpParticipants = participantsOf(ctx.roster, ctx.template)
  for (const warrior of [...xpParticipants.heroes, ...xpParticipants.groups, ...xpParticipants.hiredSwords]) {
    const special = draft.specialKillXp?.[warrior.id] ?? ctx.specialKillXp?.[warrior.id]
    if (!special || ('unitTemplateId' in warrior ? !unitGainsExperience(warrior.unitTemplateId) : !hiredSwordGainsExperience(warrior.hiredSwordId))) continue
    const heroResult = injuries.heroes.find(h => h.hero.id === warrior.id)?.resolution
    const swordResult = injuries.hiredSwords.find(h => h.sword.id === warrior.id)?.resolution
    const groupResult = injuries.groups.find(g => g.group.id === warrior.id)?.resolution
    if ((heroResult && !alive(heroResult.outcome)) || (swordResult && !alive(swordResult.outcome)) || (groupResult && groupResult.group.size <= 0)) continue
    const total = xpParticipants.heroes.some(h => h.id === warrior.id) ? draft.enemiesOut[warrior.id] ?? 0 : undefined
    problems.experience.push(...specialKillProblems(special, total).map(p => `${warrior.name}: ${p}`))
  }
  for (const group of participantsOf(ctx.roster, ctx.template).groups) {
    const after = injuries.groups.find(g => g.group.id === group.id)?.resolution.group ?? group
    if (after.size > 0 && needsSurvivalXpTest(group.unitTemplateId) && !validSurvivalXpRoll(draft.survivalXpTests?.[group.id])) problems.experience.push(`${group.name}: complete the Leadership test for survival experience.`)
  }
  if (ctx.scenarioId === 'the_wizard_s_tower') {
    problems.veterans.push(...towerTreasure(draft.towerChests).problems)
  }
  const raidSpent=draft.exploration.raidCaptivesSpent??0
  if(!Number.isSafeInteger(raidSpent)||raidSpent<0||raidSpent>(ctx.roster.scenarioEffects?.raidCaptives??0))problems.exploration.push('Choose an available number of previously captured Raids resources.')
  if(raidSpent>0&&!exploration.record)problems.exploration.push('Complete exploration before spending Raids resources, or set their use back to zero.')
  problems.veterans.push(...scenarioRewards(draft, ctx.scenarioId, participantsOf(ctx.roster, ctx.template), scenarioRewardContext(ctx,injuries)).problems)
  if ((scenarioRewardRule(ctx.scenarioId) || ctx.scenarioId === 'the_wizard_s_tower') && (draft.battleGold || draft.battleWyrdstone || draft.scenarioItems?.length) && !draft.scenarioRewardOverrideReason?.trim()) problems.veterans.push('Explain the agreed adjustment outside this scenario’s normal rewards.')
  if (scenario.needsMission) problems.experience.push('Choose which scenario mission was played.')
  if (scenario.conflict && draft.scenarioUseBody === undefined) problems.experience.push('Choose the agreed interpretation of this scenario’s conflicting award values.')
  if (ctx.scenarioId === 'stake_out' && (!['income-only', 'also-explore'].includes(draft.scenarioRewards?.stakeOut?.mode ?? '') || !draft.scenarioRewards?.stakeOut?.reason?.trim())) problems.outcome.push('Record the agreed Stake-Out exploration interpretation and table ruling.')
  if (draft.result === null) problems.outcome.push('Record whether the warband won, lost or drew.')
  if (kit.pending > 0) problems.injuries.push(`${kit.pending} ${kit.pending === 1 ? 'roll' : 'rolls'} for kit after the battle still to make.`)
  if (!injuries.complete) {
    const n = injuries.summary.pending
    problems.injuries.push(`${n} ${n === 1 ? 'warrior still needs' : 'warriors still need'} their injury dice.`)
  }
  if (Object.entries(draft.injurySkips).some(([id, reason]) => draft.heroesOut.includes(id) && reason.trim() === '')) problems.injuries.push('Say why a warrior is not rolling for injury.')
  if (injuries.groups.some((g) => draft.groupInjuryDice[g.group.id] && draft.groupInjuryDice[g.group.id].count !== g.outOfAction && draft.groupInjuryDice[g.group.id].reason.trim() === '')) {
    problems.injuries.push('Say why a group rolls a different number of injury dice.')
  }
  problems.exploration.push(...exploration.problems)
  const [a, b] = draft.veteranPool
  if ((a === null) !== (b === null) || (a !== null && !isDie(a, 6)) || (b !== null && !isDie(b, 6))) problems.veterans.push('Enter both veteran-pool dice, or leave both blank.')
  if (draft.veteranPoolExtra !== null && !isDie(draft.veteranPoolExtra, 6)) problems.veterans.push('The third veteran-pool die must be 1-6.')
  if (abundanceShardsDue(draft, ctx) && draft.abundanceRoll === null) problems.exploration.push(`${ctx.map?.districtName} is an Abundance of Wyrdstone district: roll the D3 for the extra shards.`)
  return problems
}

/** Item rows held by a warrior. */
function heldItemIds(items: readonly ItemRow[], holderId: string): string[] {
  return items.filter((i) => i.holder_type === 'hero' && i.holder_id === holderId).map((i) => i.id)
}

/**
 * Kit changed by the battle: consumables marked as used are one fewer (a stack of one goes), and a
 * Mordheim Map whose re-rolls were used in exploration is noted as spent (a Master map lasts).
 */
export function itemPatchesFor(ctx: ReportContext, draft: ReportDraft): ReportApplied['item_patches'] {
  const patches: ReportApplied['item_patches'] = []
  const rows = ctx.items
  for (const [holderId, itemIds] of Object.entries(ctx.itemsUsed ?? {})) {
    for (const itemId of new Set(itemIds)) {
      if (!isConsumable(itemId)) continue
      // Herbs have explicit use records; a legacy checkbox must not consume reusable herbs.
      if (itemId === 'healing_herbs') continue
      if (itemId === 'garlic') continue // Expires whether used or not, handled below.
      // Exact-once: a dose start_match already used up for this hero (and recorded in the ledger for
      // this very match) is the dose he took; ticking it must not cost a second copy (#139/#140).
      if (ctx.addictionSupplies?.some((s) => s.hero_id === holderId && s.item_rules_id === itemId)) continue
      const row = rows.find((r) => r.holder_id === holderId && r.item_rules_id === itemId) ?? rows.find((r) => r.holder_type === 'stash' && r.item_rules_id === itemId)
      if (!row || patches.some((p) => p.id === row.id)) continue
      patches.push({ id: row.id, quantity: Math.max(0, row.quantity - 1) })
    }
  }
  const herbCounts = new Map<string, number>()
  for (const use of ctx.healingHerbUses ?? []) if (use.singleUse && !use.correction) herbCounts.set(use.itemRowId, (herbCounts.get(use.itemRowId) ?? 0) + 1)
  for (const [id, count] of herbCounts) {
    const row = rows.find(item => item.id === id && item.item_rules_id === 'healing_herbs')
    if (row && row.quantity >= count) patches.push({ id, quantity: row.quantity - count })
  }
  const mapsUsed = new Set(draft.exploration.aids.filter((u) => u.aidKey.startsWith('map:')).map((u) => u.aidKey.slice('map:'.length)))
  for (const row of garlicExpiry(ctx, draft)) if (row.valid && row.count! > 0) patches.push({ id: row.id, quantity: row.quantity - row.count! })
  for (const holder of mapsUsed) {
    const row = rows.find((r) => r.item_rules_id === 'mordheim_map' && (holder === 'stash' ? r.holder_type === 'stash' : r.holder_id === holder))
    if (!row || patches.some((p) => p.id === row.id)) continue
    const grade = mapGrade({ itemId: 'mordheim_map', quantity: row.quantity, notes: row.notes })
    if (grade === 'master') continue
    patches.push({ id: row.id, notes: `${row.notes.trim()}${row.notes.trim() ? ' · ' : ''}spent` })
  }
  return patches
}

function buildApplied(draft: ReportDraft, ctx: ReportContext, participants: Participants, injuries: InjuriesDerived, xp: XpDerived, exploration: ExplorationDerived, kit: KitDerived): ReportApplied {
  const treasure = scenarioRewards(draft, ctx.scenarioId, participants, scenarioRewardContext(ctx,injuries))
  if (ctx.scenarioId === 'the_sword_of_the_herald' && draft.scenarioNonCampaign) return {
    heroes: [], groups: [], pending_advances: [], remove_item_ids: [], item_patches: [], stash_items: [...(draft.scenarioItems ?? []), ...treasure.items],
    warband: { gold_delta: draft.battleGold + treasure.gold, wyrdstone_delta: draft.battleWyrdstone + treasure.shards, veteran_pool: null },
  }
  const xpBySubject = new Map(xp.lines.map((l) => [l.subjectId, l]))
  const heroes: ReportApplied['heroes'] = []
  const pending: ReportApplied['pending_advances'] = []
  const removeItemIds: string[] = []

  const heroRes = new Map(injuries.heroes.map((h) => [h.hero.id, h.resolution]))
  for (const hero of participants.heroes) {
    const res = heroRes.get(hero.id)
    const line = xpBySubject.get(hero.id)
    const patch: ReportApplied['heroes'][number]['patch'] = {}
    if (res) {
      const after = res.hero
      patch.stats = after.stats
      patch.injuries = after.injuries
      patch.flags = after.flags
      if (after.status === 'dead' && hero.status !== 'dead' && delayedLeaderUnit(ctx.roster.warbandTemplateId) === hero.unitTemplateId) patch.flags = {...after.flags,leaderLostInMatch:ctx.matchId,leaderReplacementReadyAfter:undefined}
      if (after.status !== hero.status) patch.status = after.status
      if (after.equipment.length === 0 && hero.equipment.length > 0) removeItemIds.push(...heldItemIds(ctx.items, hero.id))
    }
    if (line) {
      patch.xp = line.xpAfter
      for (const t of thresholdsCrossed('hero', line.xpBefore, line.xpAfter, unitRules(hero.unitTemplateId).advanceRate ?? 'normal')) pending.push({ subject_type: 'hero', subject_id: hero.id, threshold_xp: t })
    }
    if (Object.keys(patch).length > 0) heroes.push({ id: hero.id, patch })
  }

  const swordRes = new Map(injuries.hiredSwords.map((s) => [s.sword.id, s.resolution]))
  for (const sword of participants.hiredSwords) {
    const res = swordRes.get(sword.id)
    const line = xpBySubject.get(sword.id)
    const patch: ReportApplied['heroes'][number]['patch'] = {}
    if (res) {
      if (res.sword.status !== sword.status) patch.status = res.sword.status
      if (res.heroFlow || res.sword.flags.lycanthrope) {
        patch.stats = res.sword.stats
        patch.injuries = res.sword.injuries
        patch.flags = res.sword.flags
        if (res.sword.equipment.length === 0 && sword.equipment.length > 0) removeItemIds.push(...heldItemIds(ctx.items, sword.id))
      }
    }
    if ((res?.sword.status ?? sword.status) === 'active') {
      patch.flags = { ...(patch.flags ?? sword.flags), upkeepOwedAfter: ONE_BATTLE_HIRES.includes(sword.hiredSwordId) || (sword.flags.hireCompanion && (sword.hiredSwordId !== 'ulli_and_marquand' || participants.hiredSwords.some(other => other.flags.hireGroupId === sword.flags.hireGroupId && !other.flags.hireCompanion && (swordRes.get(other.id)?.sword.status ?? other.status) === 'active'))) ? undefined : ctx.matchId, mustMissNextBattle: requiresBattleGap(sword.hiredSwordId), contractCheckOwed: sword.hiredSwordId === 'old_prospector' || (sword.hiredSwordId === 'countess_marianna_chevaux_vampire_assassin' && !res) }
      if (ONE_BATTLE_HIRES.includes(sword.hiredSwordId)) patch.status = 'left'
    }
    if (line) {
      patch.xp = line.xpAfter
      for (const t of thresholdsCrossed('henchman', line.xpBefore, line.xpAfter)) pending.push({ subject_type: 'hero', subject_id: sword.id, threshold_xp: t })
    }
    if (Object.keys(patch).length > 0) heroes.push({ id: sword.id, patch })
  }

  // Kit after the battle: drugs' side effects, ruined clothes, wishes (features/postBattle/model/kit.ts).
  const effects = kitEffects(kit)
  for (const change of effects.heroPatches) {
    const hero = ctx.roster.heroes.find((h) => h.id === change.heroId && h.status === 'active')
    if (!hero) continue
    const existing = heroes.find((h) => h.id === hero.id)
    const patch: ReportApplied['heroes'][number]['patch'] = { ...(existing?.patch ?? {}) }
    if (change.statDelta) patch.stats = applyStatDelta({ ...hero, stats: patch.stats ?? hero.stats }, change.statDelta)
    if (change.flag) {
      const flags = { ...(patch.flags ?? hero.flags) }
      if (change.flag === 'stupidity') flags.stupidity = true
      if (change.flag === 'missNextGame') flags.missNextGames = Math.max(flags.missNextGames ?? 0, 1)
      if (change.flag === 'addicted') flags.addictedTo = [...new Set([...(flags.addictedTo ?? []), change.itemId])]
      // Eye of the Gods after a loss: the leader is gone (a Chaos Spawn); after a win he stays and takes a Mark by hand.
      if (change.flag === 'leaderSpawn' && draft.result === 'lost') patch.status = 'retired'
      patch.flags = flags
    }
    if (existing) existing.patch = patch
    else heroes.push({ id: hero.id, patch })
  }
  const kitRemovals: ReportApplied['item_patches'] = []
  // Animals killed: one fewer of the item on the hero who brought them.
  const deadByRow = new Map<string, number>()
  for (const a of injuries.animals) {
    if (!a.dead) continue
    const row = ctx.items.find((r) => r.holder_id === a.animal.holderId && r.item_rules_id === a.animal.itemId)
    if (row) deadByRow.set(row.id, (deadByRow.get(row.id) ?? 0) + 1)
  }
  for (const [rowId, dead] of deadByRow) {
    const row = ctx.items.find((r) => r.id === rowId)!
    kitRemovals.push({ id: rowId, quantity: Math.max(0, row.quantity - dead) })
  }
  for (const removal of effects.removeItems) {
    const row = ctx.items.find((r) => r.item_rules_id === removal.itemId && (removal.holderId === null ? r.holder_type === 'stash' : r.holder_id === removal.holderId))
    if (row && !kitRemovals.some((p) => p.id === row.id)) kitRemovals.push({ id: row.id, quantity: Math.max(0, row.quantity - 1) })
  }

  // Nurgle's Rot caught in the fight (the shared log) or passed on before the game (the sheet).
  for (const id of new Set([...(ctx.rotVictims ?? []), ...Object.keys(ctx.preBattle ?? {}).filter((k) => k.startsWith('rot_spread:')).map((k) => k.slice('rot_spread:'.length))])) {
    const hero = ctx.roster.heroes.find((h) => h.id === id && h.status === 'active')
    if (!hero || hero.flags.nurglesRot) continue
    const existing = heroes.find((h) => h.id === hero.id)
    const flags = { ...(existing?.patch.flags ?? hero.flags), nurglesRot: true }
    if (existing) existing.patch = { ...existing.patch, flags }
    else heroes.push({ id: hero.id, patch: { flags } })
  }

  // Nurgle's Rot: a failed Toughness test before the game costs a point of Toughness; at zero the warrior dies.
  for (const [key, outcome] of Object.entries(ctx.preBattle ?? {})) {
    if (!key.startsWith('rot:') || !/failed/.test(outcome)) continue
    const id = key.slice('rot:'.length)
    const hero = ctx.roster.heroes.find((h) => h.id === id && h.status === 'active')
    if (!hero) continue
    const existing = heroes.find((h) => h.id === hero.id)
    const stats = { ...(existing?.patch.stats ?? hero.stats) }
    stats.T = Math.max(0, stats.T - 1)
    const patch: ReportApplied['heroes'][number]['patch'] = { ...(existing?.patch ?? {}), stats }
    if (stats.T === 0) patch.status = 'dead'
    if (existing) existing.patch = patch
    else heroes.push({ id: hero.id, patch })
  }

  // A Tarot reading that turned to doom before the game: the hero refuses to fight the next one.
  for (const [key, outcome] of Object.entries(ctx.preBattle ?? {})) {
    if (!key.startsWith('tarot:') || outcome !== 'disaster') continue
    const hero = ctx.roster.heroes.find((h) => h.id === key.slice('tarot:'.length) && h.status === 'active')
    if (!hero) continue
    const existing = heroes.find((h) => h.id === hero.id)
    const flags = { ...(existing?.patch.flags ?? hero.flags) }
    flags.missNextGames = Math.max(flags.missNextGames ?? 0, 1)
    if (existing) existing.patch.flags = flags
    else heroes.push({ id: hero.id, patch: { flags } })
  }

  if (exploration.pitLostHeroId) {
    const id=exploration.pitLostHeroId, existing=heroes.find(h=>h.id===id)
    if(existing)existing.patch.status='dead';else heroes.push({id,patch:{status:'dead'}})
    removeItemIds.push(...ctx.items.filter(i=>i.holder_type==='hero'&&i.holder_id===id).map(i=>i.id))
  }

  // The Well: a Hero who fails the Toughness test misses the next game through sickness (03:671-675).
  if (exploration.missNextGameHeroId) {
    const hero = ctx.roster.heroes.find((h) => h.id === exploration.missNextGameHeroId && h.status === 'active')
    if (hero) {
      const existing = heroes.find((h) => h.id === hero.id)
      const flags = { ...(existing?.patch.flags ?? hero.flags) }
      flags.missNextGames = Math.max(flags.missNextGames ?? 0, 1)
      if (existing) existing.patch.flags = flags
      else heroes.push({ id: hero.id, patch: { flags } })
    }
  }

  // Heroes who missed this game: one fewer to miss.
  for (const sat of participants.satOut) {
    if (sat.missNextGames && sat.missNextGames > 0) {
      const hero = ctx.roster.heroes.find((h) => h.id === sat.id) ?? ctx.roster.hiredSwords.find(h=>h.id===sat.id)
      if (!hero) continue
      const flags = { ...hero.flags }
      if (sat.missNextGames - 1 > 0) flags.missNextGames = sat.missNextGames - 1
      else delete flags.missNextGames
      heroes.push({ id: hero.id, patch: { flags } })
    }
  }

  for (const line of xp.lines.filter(l=>l.subjectType==='hero'&&!participants.heroes.some(h=>h.id===l.subjectId))) {
    const existing=heroes.find(h=>h.id===line.subjectId)
    if(existing) existing.patch.xp=line.xpAfter
    else heroes.push({id:line.subjectId,patch:{xp:line.xpAfter}})
    const hero=ctx.roster.heroes.find(h=>h.id===line.subjectId)!
    for(const threshold of thresholdsCrossed('hero',line.xpBefore,line.xpAfter,unitRules(hero.unitTemplateId).advanceRate??'normal')) pending.push({subject_type:'hero',subject_id:line.subjectId,threshold_xp:threshold})
  }
  const groups: ReportApplied['groups'] = []
  const groupRes = new Map(injuries.groups.map((g) => [g.group.id, g.resolution]))
  for (const group of participants.groups) {
    const res = groupRes.get(group.id)
    const line = xpBySubject.get(group.id)
    const patch: ReportApplied['groups'][number]['patch'] = {}
    if (res && res.group.size !== group.size) patch.size = res.group.size + absentGroupModels(ctx.roster.henchmenGroups.find(g=>g.id===group.id)??group)
    if (effects.groupStupidity.includes(group.id)) patch.campaign_state = { ...group.campaignState, permanentStupidity: true }
    if (line) {
      patch.xp = line.xpAfter
      for (const t of thresholdsCrossed('henchman', line.xpBefore, line.xpAfter, unitRules(group.unitTemplateId).advanceRate ?? 'normal')) pending.push({ subject_type: 'group', subject_id: group.id, threshold_xp: t })
    }
    if (Object.keys(patch).length > 0) groups.push({ id: group.id, patch })
  }

  for(const group of ctx.roster.henchmenGroups)if(group.campaignState?.raidAbsences?.length){
    const existing=groups.find(g=>g.id===group.id)
    const campaign_state=afterAbsenceBattle({...group.campaignState,...existing?.patch.campaign_state})
    if(existing)existing.patch.campaign_state=campaign_state;else groups.push({id:group.id,patch:{campaign_state}})
  }

  // Dependent companions cannot remain after their charmer or Merchant is lost.
  for (const sword of ctx.roster.hiredSwords.filter(s => ['snake_charmer', 'arabian_merchant', 'cathayan_merchant'].includes(s.hiredSwordId) && !s.flags.hireCompanion)) {
    const status = heroes.find(h => h.id === sword.id)?.patch.status ?? sword.status
    if (status !== 'active') for (const companion of ctx.roster.hiredSwords.filter(s => s.flags.hireCompanion && s.flags.hireGroupId === sword.flags.hireGroupId)) {
      const patch = heroes.find(h => h.id === companion.id)
      if ((patch?.patch.status ?? companion.status) !== 'active') continue
      if (patch) patch.patch.status = 'left'
      else heroes.push({id: companion.id, patch: {status: 'left'}})
    }
  }

  const maglah = ctx.roster.hiredSwords.find(s=>s.hiredSwordId==='maglah_khan_s_horde' && s.status==='active')
  if(maglah && ['dead','left','retired'].includes(heroes.find(h=>h.id===maglah.id)?.patch.status ?? 'active')) {
    const scouts=ctx.roster.hiredSwords.filter(s=>s.hiredSwordId==='hobgoblin_scout' && (heroes.find(h=>h.id===s.id)?.patch.status ?? s.status)==='active')
    const retained=scouts.find(s=>s.id===(draft.retainedScoutId??maglah.flags.retainedScoutId))??scouts[0]
    for(const scout of scouts.filter(s=>s.id!==retained?.id)) {
      const patch=heroes.find(h=>h.id===scout.id)
      if(patch)patch.patch.status='left'
      else heroes.push({id:scout.id,patch:{status:'left'}})
    }
  }

  for (const waiting of leaderWaitingGameUpdates(ctx.roster,ctx.matchId)) {
    const existing=heroes.find(h=>h.id===waiting.id)
    if(existing)existing.patch.flags={...waiting.flags,...existing.patch.flags};else heroes.push({id:waiting.id,patch:{flags:waiting.flags}})
  }
  const record = exploration.record
  for (const sword of ctx.roster.hiredSwords) {
    if (sword.status === 'left' && sword.flags.mustMissNextBattle) heroes.push({ id: sword.id, patch: { flags: { ...sword.flags, mustMissNextBattle: false } } })
  }
  return {
    heroes,
    groups,
    warband: {
      wyrdstone_delta: draft.battleWyrdstone + treasure.shards + battleTreasureAwards(participants.heroes, heroOoaIds(draft), draft.enemiesOut).reduce((sum, award) => sum + award.shards, 0) + (record?.shards ?? 0) + effects.shardsDelta + (abundanceShards(draft, ctx) ?? 0),
      gold_delta: injuries.heroes.reduce((sum,h)=>sum+(h.resolution.pitFightGold??0),0) + draft.battleGold + treasure.gold + (ctx.scenarioId === 'the_wizard_s_tower' ? towerTreasure(draft.towerChests).gold : 0) + (record?.goldFound ?? 0) + effects.goldDelta,
      veteran_pool: veteranPoolOf(draft),
    },
    pending_advances: pending,
    remove_item_ids: [...new Set(removeItemIds)],
    ...(treasure.artefacts.length ? { scenario_artefacts: treasure.artefacts } : {}),
    stash_items: [...treasure.items, ...(record?.itemsFound ?? []), ...(draft.scenarioItems ?? [])],
    item_patches: [...itemPatchesFor(ctx, draft).filter((p) => !kitRemovals.some((k) => k.id === p.id)), ...kitRemovals],
  }
}

function ooaLines(draft: ReportDraft, participants: Participants, takenOutBy: Record<string, string[]> = {}): OoaLine[] {
  const out = heroOoaIds(draft)
  const lines: OoaLine[] = []
  const by = (id: string, n: number): { by?: string[] } => {
    const names = (takenOutBy[id] ?? []).slice(0, n)
    return names.length > 0 ? { by: names } : {}
  }
  for (const h of participants.heroes) if (out.has(h.id)) lines.push({ subjectType: 'hero', subjectId: h.id, subjectName: h.name, count: 1, ...by(h.id, 1) })
  for (const s of participants.hiredSwords) if (out.has(s.id)) lines.push({ subjectType: 'hiredSword', subjectId: s.id, subjectName: s.name, count: 1, ...by(s.id, 1) })
  for (const g of participants.groups) {
    const n = Math.min(g.size, draft.groupsOut[g.id] ?? 0)
    if (n > 0) lines.push({ subjectType: 'group', subjectId: g.id, subjectName: g.name, count: n, ...by(g.id, n) })
  }
  return lines
}

function battleNotes(draft: ReportDraft, kit?: KitDerived, ctx?: ReportContext): string {
  const parts: string[] = []
  if (ctx && !(ctx.scenarioId === 'the_sword_of_the_herald' && draft.scenarioNonCampaign)) {
    for (const award of battleTreasureAwards(participantsOf(ctx.roster,ctx.template).heroes, heroOoaIds(draft), draft.enemiesOut)) {
      parts.push(`${award.name}: +${award.shards} wyrdstone/treasure from ${award.rule}.`)
    }
  }
  if (ctx?.scenarioId === 'the_wizard_s_tower') {
    parts.push(...towerTreasure(draft.towerChests).notes)
  }
  if (ctx) for (const hero of ctx.roster.heroes) if (hero.flags.trapSupplyMatch === ctx.matchId) {
    const bought = hero.flags.trapSupplyBought ?? 0, remaining = hero.flags.trapSupplyRemaining ?? 0
    parts.push(`${hero.name}: 1 free Trap + ${bought} extra bought for ${bought * 5} gc at battle start; ${1 + bought - remaining} used, ${remaining} left at the end. Payment already recorded before the battle.`)
  }
  if (ctx) parts.push(...scenarioRewards(draft, ctx.scenarioId, participantsOf(ctx.roster, ctx.template), ctx).notes)
  if (draft.scenarioRewardOverrideReason?.trim()) parts.push(`Agreed scenario reward adjustment: ${draft.scenarioRewardOverrideReason.trim()}`)
  if (draft.scenarioMission) parts.push(`Scenario mission: ${draft.scenarioMission}.`)
  if (draft.scenarioGardenRerolled) parts.push('A Stroll in the Garden: re-rolled the entire exploration pool.')
  if (draft.scenarioNonCampaign) parts.push('Sword of the Herald: agreed non-campaign mode; no injuries, experience or exploration applied. Scenario rewards only.')
  if (draft.scenarioUseBody !== undefined) parts.push(`Conflicting scenario awards: the table chose ${draft.scenarioUseBody ? 'the explanatory text' : 'the heading value'}.`)
  for (const item of draft.scenarioItems ?? []) parts.push(`Scenario reward: ${item.quantity} × ${item.custom_name ?? item.item_rules_id}.`)
  if (draft.battleWyrdstone > 0) parts.push(`${draft.battleWyrdstone} ${draft.battleWyrdstone === 1 ? 'shard' : 'shards'} of wyrdstone picked up during the battle.`)
  const abundance = ctx ? abundanceShards(draft, ctx) : null
  if (abundance) parts.push(`${ctx!.map!.districtName} (Abundance of Wyrdstone): +${abundance} ${abundance === 1 ? 'shard' : 'shards'} for winning there (D6 ${draft.abundanceRoll}).`)
  if (ctx?.map && ctx.map.perks.districts.length > 0) parts.push(`Map advantages held: ${ctx.map.perks.districts.map((d) => d.districtName).join(', ')}.`)
  if (draft.battleGold > 0) parts.push(`${draft.battleGold} gc looted during the battle.`)
  if (kit) for (const line of kitEffects(kit).lines) parts.push(line)
  if (draft.notes.trim() !== '') parts.push(draft.notes.trim())
  return parts.join('\n')
}

/** The winner of a battle in an Abundance of Wyrdstone district owes a D3 for extra shards. */
export function abundanceShardsDue(draft: ReportDraft, ctx: ReportContext): boolean {
  if (ctx.scenarioId === 'the_sword_of_the_herald' && draft.scenarioNonCampaign) return false
  return Boolean(ctx.map?.abundance) && draft.result === 'won'
}

/** The D3 result as shards, or null while it is not rolled (or not due). */
export function abundanceShards(draft: ReportDraft, ctx: ReportContext): number | null {
  return abundanceShardsDue(draft, ctx) ? d3Of(draft.abundanceRoll) : null
}

/** The roster as it will stand once the report's patches are applied (advances not yet rolled). */
export function rosterAfterReport(roster: RosterWarband, applied: ReportApplied, originalItems?: readonly ItemRow[]): RosterWarband {
  const itemPatches = new Map(applied.item_patches.map(i => [i.id, i]))
  const removed = new Set(applied.remove_item_ids)
  const remainingItems = originalItems?.filter(i => !removed.has(i.id)).map(i => ({ ...i, ...itemPatches.get(i.id) })).filter(i => i.quantity > 0) ?? []
  const equipmentFor = (id: string, existing: RosterWarband['heroes'][number]['equipment']) => {
    const changed = originalItems?.some(i => i.holder_id === id && (removed.has(i.id) || itemPatches.has(i.id))) || applied.item_patches.some(i => i.holder_id === id)
    const kept = changed && originalItems ? remainingItems.filter(i => i.holder_id === id).map(i => ({ itemId: i.item_rules_id, customName: i.custom_name ?? undefined, quantity: i.quantity, notes: i.notes })) : existing
    return [...kept, ...(applied.awarded_items ?? []).filter(i => i.holder_id === id).map(i => ({ itemId: i.item_rules_id, customName: i.custom_name ?? undefined, quantity: i.quantity, notes: i.notes }))]
  }
  const heroPatches = new Map(applied.heroes.map((h) => [h.id, h.patch]))
  const groupPatches = new Map(applied.groups.map((g) => [g.id, g.patch]))
  return {
    ...roster,
    heroes: roster.heroes.map((h) => {
      const p = heroPatches.get(h.id)
      if (!p) return { ...h, equipment: equipmentFor(h.id, h.equipment) }
      return {
        ...h,
        equipment: equipmentFor(h.id, h.equipment),
        stats: p.stats ?? h.stats,
        skillIds: p.skills ?? h.skillIds,
        spellIds: p.spells ?? h.spellIds,
        notes: p.notes ?? h.notes,
        xp: p.xp ?? h.xp,
        levelUps: p.level_ups ?? h.levelUps,
        injuries: p.injuries ?? h.injuries,
        flags: p.flags ?? h.flags,
        status: p.status === undefined ? h.status : p.status === 'left' ? 'retired' : p.status,
      }
    }),
    hiredSwords: roster.hiredSwords.map((s) => {
      const p = heroPatches.get(s.id)
      if (!p) return s
      return {
        ...s,
        stats: p.stats ?? s.stats,
        xp: p.xp ?? s.xp,
        levelUps: p.level_ups ?? s.levelUps,
        injuries: p.injuries ?? s.injuries,
        flags: p.flags ?? s.flags,
        status: p.status ?? s.status,
      }
    }),
    henchmenGroups: [...roster.henchmenGroups.map((g) => {
      const p = groupPatches.get(g.id)
      if (!p) return g
      return { ...g, ...(p.campaign_state?{campaignState:p.campaign_state}:{}), stats: p.stats ?? g.stats, size: p.size ?? g.size, xp: p.xp ?? g.xp, levelUps: p.level_ups ?? g.levelUps }
    }), ...(applied.new_groups ?? []).map(g => ({id:g.id,name:g.name,unitTemplateId:g.unit_type_rules_id,size:g.size,stats:g.stats,xp:g.xp,levelUps:g.level_ups,statIncreases:{},equipment:[]}))],
  }
}

/**
 * The advances earned this battle, planned one after another against the post-report roster so a
 * second advance for the same warrior sees the first. Drafts the step has not seeded yet are
 * planned from an empty draft.
 */
export function deriveAdvances(draft: ReportDraft, ctx: ReportContext, applied: ReportApplied): AdvancesDerived {
  let roster = rosterAfterReport(ctx.roster, applied, ctx.items)
  const items: WizardAdvance[] = []
  const problems: string[] = []
  for (const request of applied.pending_advances) {
    const key = advanceKey(request.subject_id, request.threshold_xp)
    const subject = findSubject(roster, request.subject_type, request.subject_id)
    const stored = draft.advances[key]
    const mode = draft.advanceModes[key] === 'pickLater' ? 'pickLater' : 'now'
    if (!subject || (subject.kind !== 'group' && subject.kind !== 'hiredSword' && subject.hero.status !== 'active') || (subject.kind === 'hiredSword' && subject.sword.status !== 'active')) {
      const name = subject ? subjectName(subject) : 'A warrior no longer on the roster'
      items.push({ key, request, subject, name, draft: stored ?? emptyAdvanceDraft(UNSEEDED_HERO_ID), seeded: Boolean(stored), mode: 'later', plan: null, step: 'roll', complete: true, summary: `${name}: advance at ${request.threshold_xp} xp left pending (out of the fight).` })
      continue
    }
    const name = subjectName(subject)
    const advDraft = stored ?? emptyAdvanceDraft(UNSEEDED_HERO_ID, subject.kind === 'group' ? defaultPromotedName(subject.group, roster) : '')
    const actx = { roster, template: ctx.template, thresholdXp: request.threshold_xp, bans: ctx.houseRules?.bans, houseRules: ctx.houseRules ?? null }
    const plan = subject.kind === 'group' ? planGroup(advDraft, subject.group, actx, skillTableName) : planHero(advDraft, subject, actx)
    const step = effectiveStep(advDraft, plan)
    let complete: boolean
    let summary: string
    if (mode === 'pickLater') {
      complete = subject.kind !== 'group' && plan.need === 'skill' && plan.roll !== null
      summary = complete ? `${name}: rolled ${plan.total}, ${plan.roll?.text.toLowerCase() ?? 'new skill'}; skill to pick later.${advanceAuditText(stored ?? {})}` : `${name}: roll the advance first.`
    } else if (plan.total === null && !plan.result) {
      complete = false
      summary = `${name}: roll the advance earned at ${request.threshold_xp} xp before completing the report.`
    } else {
      complete = plan.result !== null
      summary = plan.result ? `${name}: ${plan.result.resolution.text}` : `${name}: rolled ${plan.total}, choice still to make.`
      if (plan.result) roster = plan.result.next
    }
    if (!complete) problems.push(`${name}: roll the advance and finish its result. Only a rolled skill or spell choice may be picked later.`)
    items.push({ key, request, subject, name, draft: advDraft, seeded: Boolean(stored), mode, plan, step, complete, summary })
  }
  return { items, rosterAfter: roster, problems }
}

export function deriveReport(draft: ReportDraft, ctx: ReportContext): DerivedReport {
  const nonCampaign = ctx.scenarioId === 'the_sword_of_the_herald' && draft.scenarioNonCampaign
  if (nonCampaign) draft = { ...draft, veteranPool: [null, null], veteranPoolExtra: null, injurySkips: {}, groupInjuryDice: {} }
  const wagonCapture=nonCampaign?{snapshot:undefined,problems:[] as string[],notes:[] as string[]}:reportTradeWagon(draft,ctx)
  const postCaptureContext=afterTradeWagonCapture(ctx,wagonCapture)
  const participants = participantsOf(ctx.roster, ctx.template)
  const initialInjuries = deriveInjuries(nonCampaign ? { ...draft, heroesOut: [], groupsOut: {}, animalsOut: [] } : woodsInjuryDraft(draft,ctx.scenarioId), participants, ctx.matchId, ctx.roster, ctx.map?.perks, ctx.scenarioId)
  const lycanthrope=lycanthropeReport(draft,postCaptureContext,nonCampaign?{...participants,heroes:[],hiredSwords:[],groups:[]}:participants,initialInjuries)
  const injuries=lycanthrope.injuries
  const casualtyDraft=woodsCasualtyDraft(draft,ctx.scenarioId)
  const kit = deriveKit(draft, { roster: ctx.roster, matchId: ctx.matchId, survivingGroupIds: new Set(ctx.roster.henchmenGroups.filter(g => (injuries.groups.find(r => r.group.id === g.id)?.resolution.group.size ?? (g.size-absentGroupModels(g))) + absentGroupModels(g) > 0).map(g => g.id)), itemsUsed: nonCampaign ? {} : ctx.itemsUsed ?? {}, heroesOut: nonCampaign ? new Set() : heroOoaIds(casualtyDraft), leaderId: participants.leaderId, result: draft.result, leaderKills: participants.leaderId ? draft.enemiesOut[participants.leaderId] ?? 0 : 0 })
  if (nonCampaign) { kit.prompts = []; kit.pending = 0 }
  const out = heroOoaIds(casualtyDraft)
  const survivingHeroes = participants.heroes.filter((h) => !out.has(h.id) && (injuries.heroes.find(r=>r.hero.id===h.id)?.resolution.hero.status??h.status)==='active')
  const slayer = ctx.roster.warbandTemplateId === 'dwarf_slayer_cult' ? slayerExploration(draft, participants) : null
  const harpy = ctx.scenarioId === 'happy_harpy_hunting_grounds' ? harpyRewards(draft) : null
  const raidRequested=draft.exploration.raidCaptivesSpent??0
  const raidSpent=Number.isSafeInteger(raidRequested)&&raidRequested>=0&&raidRequested<=(ctx.roster.scenarioEffects?.raidCaptives??0)?raidRequested:0
  const explorationRoster = harpy?.stragglerNow ? { ...ctx.roster, explorationDiscoveries: { catacombs: false, tunnels: false, ...ctx.roster.explorationDiscoveries, straggler: true } } : ctx.roster
  const exploration = deriveExploration(draft.exploration, explorationRoster, {
    scenarioId: ctx.scenarioId,
    disabledReason: nonCampaign ? 'Sword of the Herald: no exploration in the agreed non-campaign mode.' : ctx.scenarioId === 'stake_out' && draft.scenarioRewards?.stakeOut?.mode === 'income-only' ? 'Stake-Out: the table agreed to use the printed fixed income instead of exploration.' : undefined,
    won: draft.result === 'won',
    eligibleHeroes: slayer?.eligibleHeroes ?? survivingHeroes,
    leaderId: participants.leaderId,
    rewardHeroes: ctx.roster.heroes.map(h=>injuries.heroes.find(r=>r.hero.id===h.id)?.resolution.hero??h),
    artefacts: ctx.artefacts,
    artefactsError: ctx.artefactsError,
    reportId: ctx.reportId,
    allowWithoutSurvivors: !!slayer?.extraDice || raidSpent>0,
    noExplorationReason: slayer ? `${slayer.note}. No qualifying exploration dice this battle.` : undefined,
    enemiesOut: Object.values(draft.enemiesOut).reduce((n, v) => n + (v ?? 0), 0),
    extraDice: (ctx.map?.perks.explorationDice ?? 0) + (slayer?.extraDice ?? 0) + raidSpent,
    extraDiceNote: [ctx.map?.perks.explorationDiceSources.join(', '), slayer?.note,raidSpent?`Raids: spent ${raidSpent} previously captured resources for ${raidSpent} extra dice`:null].filter(Boolean).join('; '),
    maxFinds: ctx.map?.perks.explorationMaxFinds ?? null,
  })
  const kidnapped = ctx.scenarioId === 'kidnapped' ? kidnappedRewards(draft.scenarioRewards?.kidnapped, { ...ctx.roster, heroes: ctx.roster.heroes.map(h => injuries.heroes.find(r => r.hero.id === h.id)?.resolution.hero ?? h) }, ctx.items) : null
  const thief=ctx.scenarioId==='stop_thief'?stopThiefRewards(draft.scenarioRewards?.stopThief??{},draft.result==='won',ctx.roster.id,[{id:ctx.roster.id,name:ctx.roster.name},...(ctx.opponents??[]).map(o=>({id:o.id,name:o.name??'Opponent'}))]):null
  const thiefLeader=participants.heroes.find(h=>h.id===participants.leaderId)
  const rock = ctx.scenarioId==='assault_on_the_rock'?rockRewards(draft.scenarioRewards?.rock??{},draft.result==='won',scenarioRewardContext(ctx,injuries).roster):null
  const xp = nonCampaign ? { lines: [], underdogAvailable: 0, underdogApplied: 0 } : deriveXp(draft, participants, injuries, ctx, [...(exploration.record?.xpAwards ?? []), ...(kidnapped?.xpAwards ?? []), ...(rock?.xpAwards??[]),...(thief?.retrievedLeaderXp&&thiefLeader?[{id:thiefLeader.id,name:thiefLeader.name,amount:1,reason:"Stop Thief: recovered the stolen item"}]:[])])
  const applied = buildApplied(draft, ctx, participants, injuries, xp, exploration, kit)
  const medicine=medicineChestUses(draft,ctx.items,Object.fromEntries([...injuries.heroes.map(h=>[h.hero.id,h.resolution.steps] as const),...injuries.hiredSwords.filter(h=>h.resolution.heroFlow).map(h=>[h.sword.id,h.resolution.heroFlow!.steps] as const)]))
  if(medicine.uses.length){
    applied.medicine_chests=medicine.uses
    for(const use of medicine.uses){const existing=applied.item_patches.find(p=>p.id===use.item_id);if(existing)existing.quantity=(existing.quantity??use.expected_quantity)-use.quantity;else applied.item_patches.push({id:use.item_id,quantity:use.expected_quantity-use.quantity})}
  }
  const rawhide=ctx.scenarioId==='rawhide'?rawhideReport(draft.scenarioRewards?.rawhide??{},ctx.rawhideCargo,ctx.roster.id,!!ctx.rawhideEnded,ctx.reportId):null
  if(rawhide?.settlement&&!rawhide.problems.length)applied.rawhide_settlement=rawhide.settlement
  if(thief&&!thief.problems.length){applied.scenario_item_transfers=thief.transfers;const state=draft.scenarioRewards!.stopThief!;applied.stop_thief_outcome={defender_id:state.defenderId!,recovered:state.recovered,returned_allies:state.returnedAllies}}
  if (ctx.scenarioId === 'the_caravan' || ctx.scenarioId === 'the_caravan_archive_pestilen') applied.scenario_effects = caravanRewards(draft.scenarioRewards?.caravan ?? {}, ctx.scenarioId === 'the_caravan_archive_pestilen', draft.result, ctx.campaignId, ctx.roster.scenarioEffects).effects
  if(raidSpent>0&&exploration.record)applied.scenario_effects={...applied.scenario_effects,raidCaptives:{gained:0,spent:raidSpent}}
  if(injuries.raidOutcome&&!injuries.raidOutcome.problems.length){
    const raid=injuries.raidOutcome
    applied.scenario_effects={...applied.scenario_effects,raidCaptives:{gained:raid.captives,spent:applied.scenario_effects?.raidCaptives?.spent??0}}
    for(const id of raid.surrenderedWarriors){
      const original=ctx.roster.heroes.find(h=>h.id===id)??ctx.roster.hiredSwords.find(h=>h.id===id)!,existing=applied.heroes.find(h=>h.id===id)
      const flags={...original.flags,...existing?.patch.flags,missNextGames:Math.max(2,existing?.patch.flags?.missNextGames??original.flags.missNextGames??0)}
      if(existing)existing.patch.flags=flags;else applied.heroes.push({id,patch:{flags}})
    }
    for(const [id,count] of Object.entries(raid.surrenderedGroups)){
      const original=ctx.roster.henchmenGroups.find(g=>g.id===id)!,existing=applied.groups.find(g=>g.id===id)
      const campaign_state={...original.campaignState,...existing?.patch.campaign_state},raidAbsences=[...(campaign_state.raidAbsences??[]),{count,games:2}]
      if(existing)existing.patch.campaign_state={...campaign_state,raidAbsences};else applied.groups.push({id,patch:{campaign_state:{...campaign_state,raidAbsences}}})
    }
  }
  if(ctx.scenarioId==='assault_on_the_rock'&&draft.result==='won')applied.rock_tome_claim=true
  if(ctx.scenarioId==='encampment_raid') {
    const state=draft.scenarioRewards?.encampment??{}
    const reward=encampmentRewards(state,draft.result==='won',ctx.opponents??[])
    if(state.role==='attacker'&&state.captured&&!reward.problems.length) {
      applied.encampment_capture={defender_id:state.defenderId!,camp:state.camp!.trim(),treatment:state.treatment!,eligible:!!state.eligible}
      applied.scenario_item_transfers=reward.transfers
    }
  }
  if(ctx.scenarioId==='the_forbidden_square') {const score=draft.scenarioRewards?.forbiddenSquare;if(score?.placed!=null&&score.scored!=null&&score.role)applied.scenario_counter_score={placed:score.placed,scored:score.scored,role:score.role};const transfers=forbiddenSquareRewards(draft.scenarioRewards?.forbiddenSquare??{},[ctx.roster.id,...(ctx.opponents??[]).map(o=>o.id)],ctx.roster.id).transfers;if(transfers.length)applied.scenario_item_transfers=transfers}
  if(ctx.scenarioId==='gathering_of_the_horde'&&draft.scenarioRewards?.gathering?.ending) applied.gathering_control={...draft.scenarioRewards.gathering,ending:draft.scenarioRewards.gathering.ending}
  if(ctx.scenarioId==='brigands_in_the_pasturelands') {const hire=brigandsRewards(draft.scenarioRewards?.brigands??{},draft.result==='won',!!ctx.campaignId).freeHire; if(hire) applied.scenario_free_hire={choices:[hire]} }
  if (harpy?.stragglerNext || (harpy?.stragglerNow && !exploration.record)) applied.scenario_benefits = ['harpy_straggler']
  if (kidnapped) {
    for (const row of kidnapped.heroes) {
      const existing = applied.heroes.find(h => h.id === row.id)
      if (existing) existing.patch = { ...existing.patch, ...row.patch, flags: { ...existing.patch.flags, ...row.patch.flags } }
      else applied.heroes.push(row)
    }
    applied.awarded_items = kidnapped.awardedItems
    applied.remove_item_ids = [...new Set([...applied.remove_item_ids, ...kidnapped.removeIds])]
    for (const row of kidnapped.itemPatches) {
      const existing = applied.item_patches.find(i => i.id === row.id)
      if (existing) Object.assign(existing, row)
      else applied.item_patches.push(row)
    }
  }
  if(!nonCampaign)for(const group of ctx.roster.henchmenGroups){
    const existing=applied.groups.find(g=>g.id===group.id)
    if(unitRules(group.unitTemplateId).upkeep&&(existing?.patch.size??group.size)>0){
      const campaign_state={...group.campaignState,...existing?.patch.campaign_state,upkeepOwedAfter:ctx.matchId}
      if(existing)existing.patch.campaign_state=campaign_state
      else applied.groups.push({id:group.id,patch:{campaign_state}})
    }
  }
  const hireDepartures = conditionalHireDepartures(ctx.roster, rosterAfterReport(ctx.roster,applied))
  for (const departure of hireDepartures) {
    const existing = applied.heroes.find(h=>h.id===departure.id)
    if(existing) existing.patch.status='left'
    else applied.heroes.push({id:departure.id,patch:{status:'left'}})
    applied.pending_advances = applied.pending_advances.filter(a=>a.subject_id!==departure.id)
    const line=xp.lines.find(l=>l.subjectId===departure.id)
    if(line)line.advancesEarned=0
  }
  const equipmentLosses = groupEquipmentLosses(ctx, draft, injuries, applied, !nonCampaign)
  for (const row of equipmentLosses.patches) {
    const existing = applied.item_patches.find(p=>p.id===row.id)
    if(existing) Object.assign(existing,row)
    else applied.item_patches.push(row)
  }
  if (nonCampaign) applied.weapon_loss_non_campaign = true
  const brokenEquipment = brokenWeaponSettlement(ctx, draft, applied, !nonCampaign)
  if (brokenEquipment.entries.length) applied.broken_weapons = brokenEquipment.entries
  for (const patch of brokenEquipment.patches) {
    const existing = applied.item_patches.find(p => p.id === patch.id)
    if (existing) Object.assign(existing, patch)
    else applied.item_patches.push(patch)
  }
  const recruitItems = postCaptureContext.items.filter(i=>!applied.remove_item_ids.includes(i.id)).map(i=>({...i,...applied.item_patches.find(p=>p.id===i.id)})).filter(i=>i.quantity>0)
  const recruitContext = {...postCaptureContext, items:recruitItems, roster:rosterAfterReport(postCaptureContext.roster,applied)}
  const recruits = locationRecruits(draft, recruitContext, exploration, injuries, ctx.roster.gold + applied.warband.gold_delta + (applied.rawhide_settlement?.gold_delta??0))
  if (recruits.awardedItems.length) applied.awarded_items = [...(applied.awarded_items ?? []), ...recruits.awardedItems]
  const summoned = ritualZombies(draft, ctx, injuries, recruits)
  if (recruits.newGroups.length || summoned.newGroups.length) applied.new_groups = [...recruits.newGroups, ...summoned.newGroups]
  for (const row of recruits.groupPatches) {
    const existing = applied.groups.find(g => g.id === row.id)
    if (existing) Object.assign(existing.patch, row.patch)
    else applied.groups.push(row)
  }
  for (const row of recruits.itemPatches) {
    const existing = applied.item_patches.find(i => i.id === row.id)
    const original = recruitItems.find(i => i.id === row.id)
    if (existing && original) existing.quantity = (existing.quantity ?? original.quantity) + (row.quantity! - original.quantity)
    else applied.item_patches.push(row)
  }
  const conscripts = rockConscripts(ctx.scenarioId==='assault_on_the_rock'?draft.scenarioRewards?.rock?.conscripts??[]:[],rosterAfterReport(ctx.roster,applied),ctx.template)
  if(conscripts.newGroups.length)applied.new_groups=[...(applied.new_groups??[]),...conscripts.newGroups]
  if(conscripts.awardedItems.length)applied.awarded_items=[...(applied.awarded_items??[]),...conscripts.awardedItems]
  applied.warband.gold_delta -= recruits.goldCost
  if (recruits.goldCost > 0 && ctx.roster.gold + applied.warband.gold_delta + (applied.rawhide_settlement?.gold_delta??0) < 0) recruits.problems.push('The treasury cannot afford identical equipment for the free recruit.')
  if (exploration.record) exploration.record.notes.push(...recruits.notes)
  const theft = pettyThief(draft, ctx, participants)
  if (theft.transfer) applied.petty_thief = theft.transfer
  const lycanthropeEquipmentProblems=applyLycanthropeReport(lycanthrope,applied,ctx)
  const shrine=applyShrineBlessing(draft.exploration,exploration.location?.id,postCaptureContext.roster,postCaptureContext.items,applied)
  exploration.problems.push(...shrine.problems)
  if(exploration.record)exploration.record.notes.push(...shrine.notes)
  const departingIds=new Set([...applied.heroes.filter(h=>['left', 'retired', 'dead'].includes(h.patch.status ?? '')).map(h=>h.id),...applied.groups.filter(g=>g.patch.size===0).map(g=>g.id)])
  applied.pending_advances=applied.pending_advances.filter(a=>!departingIds.has(a.subject_id))
  for(const line of xp.lines)if(departingIds.has(line.subjectId))line.advancesEarned=0
  if (!nonCampaign && mixedPirateCrew(rosterAfterReport(ctx.roster, applied))) applied.pirate_mixed_upkeep_due = true
  const advances = deriveAdvances(draft, ctx, applied)
  applyTradeWagonToReport(wagonCapture,applied,ctx.rawGroups??[])
  const problems = stepProblems(draft, injuries, exploration, kit, ctx)
  problems.outcome.push(...wagonCapture.problems)
  problems.injuries.push(...brokenEquipment.problems,...equipmentLosses.problems,...medicine.problems,...lycanthrope.problems,...lycanthropeEquipmentProblems)
  if(ctx.scenarioId==='brigands_in_the_pasturelands'&&!['attacker','defender'].includes(draft.scenarioRewards?.brigands?.role??''))problems.outcome.push('Choose your Brigands role for experience.')
  if(ctx.scenarioId==='the_hunters_become_the_hunted'&&draft.result==='won'&&(!Number.isInteger(draft.scenarioRewards?.hunters?.alive)||draft.scenarioRewards!.hunters!.alive!<0||draft.scenarioRewards!.hunters!.alive!>2))problems.outcome.push('Record the number of Cold Ones alive (0–2) for survivor experience.')
  problems.experience.push(...(kidnapped?.problems ?? []))
  problems.outcome.push(...(harpy?.problems ?? []))
  problems.veterans.push(...summoned.problems, ...conscripts.problems, ...(rock?.problems??[]))
  problems.exploration.push(...recruits.problems, ...theft.problems)
  const maglahLoss=injuries.hiredSwords.find(s=>s.sword.hiredSwordId==='maglah_khan_s_horde'&&['dead','left','retired'].includes(s.resolution.sword.status))
  let retainedScoutNote=''
  if(maglahLoss){
    const scouts=ctx.roster.hiredSwords.filter(s=>s.hiredSwordId==='hobgoblin_scout'&&(injuries.hiredSwords.find(r=>r.sword.id===s.id)?.resolution.sword.status??s.status)==='active')
    const kept=scouts.find(s=>s.id===(draft.retainedScoutId??maglahLoss.sword.flags.retainedScoutId))??(scouts.length===1?scouts[0]:undefined)
    if(kept)retainedScoutNote=`Maglah’s retinue: ${kept.name} remains; the other surviving Scouts leave.`
    if(scouts.length>1&&!scouts.some(s=>s.id===(draft.retainedScoutId??maglahLoss.sword.flags.retainedScoutId)))problems.injuries.push('Choose which Hobgoblin Scout stays after Maglah’s departure.')
  }
  problems.advances.push(...advances.problems)
  const firstIncomplete = STEP_IDS.findIndex((id) => problems[id].length > 0)
  const firstIncompleteStep = firstIncomplete === -1 ? null : firstIncomplete

  let report: BattleReport | null = null
  if (firstIncompleteStep === null && draft.result !== null) {
    const injuryLines: (HeroInjuryLine | HenchmanInjuryLine)[] = []
    for (const h of injuries.heroes) if (h.resolution.line) injuryLines.push(h.resolution.line)
    for (const s of injuries.hiredSwords) if (s.resolution.line) injuryLines.push(s.resolution.line)
    for (const g of injuries.groups) if (g.resolution.line) injuryLines.push(g.resolution.line)
    report = {
      version: REPORT_VERSION,
      won: draft.result === 'won',
      result: draft.result,
      routed: draft.routed,
      xp_log: xp.lines,
      ooa: ooaLines(casualtyDraft, participants, ctx.takenOutBy),
      injuries: injuryLines,
      exploration: exploration.record,
      veteran_pool_roll: veteranPoolOf(draft),
      notes: [...garlicExpiry(ctx,draft).filter(row=>row.valid&&row.count!>0).map(row=>`${row.name}: ${row.count} ${row.count===1?'clove':'cloves'} of garlic expired after this battle, whether used or not.`),...wagonCapture.notes,...advances.items.filter(i=>i.complete && i.draft.rollHistory?.length).map(i=>`Advancement recorded in this report — ${i.summary}`),...lycanthrope.notes,battleNotes(draft, kit, scenarioRewardContext(ctx,injuries)),raidSpent>0?`Raids: spent ${raidSpent} previously captured resources for ${raidSpent} extra exploration dice.`:"", ...equipmentLosses.notes, ...brokenEquipment.notes, ...(ctx.scenarioId==='the_hunters_become_the_hunted'?participants.groups.flatMap(g=>Array.from({length:draft.groupsOut[g.id]??0},(_,i)=>draft.plantCasualties?.[`${g.id}:${i}`]?`${g.name}, model ${i+1}: plant casualty D6 ${draft.groupInjuries[g.id]?.[i]??'not rolled'}; eaten on 1.`:'').filter(Boolean)):[]), applied.pirate_mixed_upkeep_due ? "Pirate mixed Elf/Dwarf crew: an additional 20 gc upkeep is due once for the warband if both races are retained, separate from their individual fees." : "", ...theft.notes, ...summoned.notes, ...conscripts.notes, ...(kidnapped?.notes ?? []), retainedScoutNote, ...hireDepartures.map(d=>`${d.name} leaves. ${d.reason}`)].filter(Boolean).join('\n'),
      adjustments: reportAdjustments(draft, participants, injuries, exploration),
      applied,
    }
  }

  return { brokenEquipment, shrine, lycanthrope, participants, kit, advances, survivingHeroes, injuries, xp, exploration, recruits, equipmentLosses, veteranPool: veteranPoolOf(draft), problems, firstIncompleteStep, report }
}

/** The finished report, or an error naming what is still missing. */
export function buildReport(draft: ReportDraft, ctx: ReportContext): BattleReport {
  const derived = deriveReport(draft, ctx)
  if (!derived.report) {
    const missing = STEP_IDS.flatMap((id) => derived.problems[id])
    throw new Error(missing[0] ?? 'The report is not complete yet.')
  }
  return derived.report
}

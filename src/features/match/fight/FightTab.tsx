import { blessedWaterWeapon } from '../../../rules/engine/blessedWater'
import { blessedWaterRemaining, declareBlessedWater, correctBlessedWater } from '../battle/blessedWaterUses'
import { reloadTurnsFor } from './reloadRules'
import { BlackpowderLosses } from './BlackpowderLosses'
import { physicalWeaponChoices, withBrokenWeapons } from './weaponLoss'
import type { ItemRow, BrokenWeapon } from '../../../domain'
import { pendingVolatileBackfires } from '../../../domain/volatileBackfire'
import { pendingFireHits, warriorIsBurning } from '../../../domain/burning'
import { nextOwnTurnKey, smokeBlocksWarrior } from '../../../domain/firepotSmoke'
import { MortarControls } from './MortarControls'
import { GrapeShotControls } from './GrapeShotControls'
import { BlackpowderControls } from './BlackpowderControls'
import { ladyBlessingActive, ladyBlessingReason } from '../../../rules/resolve/ladyBlessing'
import { PigeonLaunchControls } from './PigeonLaunchControls'
import { LineShotControls } from './LineShotControls'
import { useBattleTurns } from '../../../api/battleTurns'
// The attack calculator: pick one of your warriors and one enemy model, see the exact odds for
// this phase of attacks, then (optionally) walk real dice through it step by step. An out of
// action result can be logged straight to the attacker's "Enemies out" tally.

import { useEffect, useMemo, useRef, useState } from 'react'
import type { BattleSessionView, MatchParticipantView } from '../../../api/matches'
import type { AttackEventPayload, BattleEventRow, BattleLiveState } from '../../../domain'
import { unresolvedMortarTargets, startGrapeShotSpread, unresolvedGrapeShotTargets, correctBlackpowderShot, blackpowderBlock, physicalGunKey, recordBlackpowderShot, recordMisfireDie, unresolvedPigeonVictims, unresolvedLineTargets, recordBolasThrow, correctBolasThrow, warbandTurnKey, failedStupidityThisTurn, recordStupidityResult, withRollAttempt, activateSerpentStaff, consumeSerpentStaff, serpentStaffUse, combatPhaseKey, correctSerpentStaff, type RollAttempt } from '../../../domain'
import { useAskBattlePrompt, useBattlePrompts, useWithdrawBattlePrompt } from '../../../api/matches'
import { parryRerollFromItems } from '../../../rules/domain/opponentScenario'
import { findTrait } from '../../../rules/data/traits'
import { findSkill } from '../../../rules/data/skills'
import { findItem } from '../../../rules/data/items'
import { findWarbandSkill } from '../../../rules/data/campaign/warbandSkills'
import type { CombatContext, WarbandTemplate, Weapon } from '../../../rules/types'
import type { CampaignHouseRules, RosterWarband } from '../../../rules/types/roster'
import { Button, DicePicker, HoverCard, Notice, RollResult, SelectField, Sheet, Spinner, Stepper, TextField } from '../../../ui'
import { Card, ItemLines, Section, Tag } from '../../roster/view/bits'
import { FightBox } from '../battle/cards'
import { combatantLabel, combatantsOf, withGuidingDream, withBolasEntanglement, emptyLoadout, defaultOffHand, defaultPrimary, kitWithSelectedWeapons, loadoutFor, offHandCandidates, type Combatant, type Loadout, type BattleBoosts } from './combatants'
import { toCharacter, combatContextFor, computeOdds, preBattleWithRolls, preBattleRollsOwed, percent, relevantToggles, thresholdText, type FightOdds, type WeaponOdds } from './odds'
import { conditionsFor, itemsUsedBy, itemRollsBy, setItemRoll, setItemUsed } from '../battle/sheet'
import type { PreBattleEffect } from '../../../rules/data/itemRules'
import { applyRoll, declineRoll, OUTCOME_LABEL, startPhase, type AttackPlan, type Outcome, type PendingRoll, type RollKind, type RollState } from './rollThrough'
import { CritWheel } from './CritWheel'
import { RollDiceIcon } from '../../../ui/RollDiceIcon'
import { critTableName } from '../../../rules/engine/crit'
import { useEnemyRosters } from './useEnemyRosters'

export interface FightTabProps {
  items?: ItemRow[]
  matchId: string
  roster: RosterWarband
  template: WarbandTemplate | undefined
  others: MatchParticipantView[]
  sessions: BattleSessionView[]
  houseRules: CampaignHouseRules
  /** The player's sheet with the shared log laid over it (read only here). */
  sheet: BattleLiveState
  /** The shared combat log: read for whether the current defender is already knocked down or stunned. */
  events: BattleEventRow[]
  readOnly: boolean
  /** Map campaigns: what the map adds to each warband this battle, by warband id. */
  boosts?: Record<string, BattleBoosts>
  /** Append a result to the shared combat log; both sheets pick it up. */
  onLogEvent: (payload: AttackEventPayload) => Promise<void>
  /** Edit the player's own sheet (marking consumables used); absent when read only. */
  edit?: (fn: (state: BattleLiveState) => BattleLiveState) => void
  /** Which quick action opened this tab: the weapon picker still offers both, this only sets the default. */
  startWith?: 'melee' | 'ranged'
}

interface WeaponChoice {
  attackerId: string
  primary: number
  /** Index into the melee list, or -1 for none. */
  offHand: number
}

/** What earlier fights this battle established about a target, on this phone (the other player's sheet is read-only). */
interface TargetMemory {
  /** Wounds lost, beyond what their sheet says. */
  woundsLost: number
  /** Turn in which their parry was used. */
  parryUsedTurn: number | null
  /** Worst thing that happened to them this turn, and when. */
  worst: { turn: number; label: string } | null
  /** Their Lucky Charm has been rolled for this battle. */
  charmUsed?: boolean
}

export function FightTab({ items = [], matchId, roster, template, others, sessions, houseRules, sheet, events, readOnly, onLogEvent, edit, boosts, startWith = 'melee' }: FightTabProps) {
  const enemies = useEnemyRosters(matchId, others)
  const [lineSelection, setLineSelection] = useState<{ shotId: string; targetKey: string } | null>(null)
  const lineShot = sheet.lineShots.find(shot => !shot.cancelled && shot.id === lineSelection?.shotId)
  const lineTarget = lineShot?.targets.find(target => target.key === lineSelection?.targetKey)
  const lineTargetDone = Boolean(lineShot && lineTarget && !unresolvedLineTargets(lineShot, events).some(t => t.key === lineTarget.key))

  const [volatileKey, setVolatileKey] = useState<string | null>(null)
  const volatileHits = pendingVolatileBackfires(events, roster.id)
  const volatileHit = volatileHits.find(h => h.key === volatileKey)
  const [fireHitId, setFireHitId] = useState<string | null>(null)
  const fireHits = pendingFireHits(sheet, events)
  const fireHit = fireHits.find(t => t.id === fireHitId)
  const [selfShotId, setSelfShotId] = useState<string | null>(null)
  const pendingExplosions = sheet.blackpowderShots.filter(s => s.misfireDie === 1 && !s.correction && !events.some(e => !e.reverted_at && e.payload.blackpowderSelfShotId === s.id && e.payload.target_id === s.warriorId && e.payload.attacker_id === s.warriorId))
  const selfShot = sheet.blackpowderShots.find(s => s.id === selfShotId && s.misfireDie === 1 && !s.correction)
  const [swivelSlot, setSwivelSlot] = useState(0)
  const [pigeonSelection, setPigeonSelection] = useState<{ launchId: string; targetKey: string } | null>(null)
  const pigeonLaunch = sheet.pigeonLaunches.find(l => l.id === pigeonSelection?.launchId)
  const pigeonTarget = pigeonLaunch?.targets?.find(t => t.key === pigeonSelection?.targetKey)
  const pigeonDone = Boolean(pigeonLaunch && pigeonTarget && !unresolvedPigeonVictims(pigeonLaunch, events).some(t => t.key === pigeonTarget.key))
  const [grapeSelection, setGrapeSelection] = useState<{ shotId: string; targetKey: string } | null>(null)
  const [grapePrimarySlot, setGrapePrimarySlot] = useState(0)
  const grapeSpread = sheet.grapeShotSpreads.find(s => s.shotId === grapeSelection?.shotId && sheet.blackpowderShots.some(shot => shot.id === s.shotId && !shot.correction))
  const grapeTarget = grapeSpread?.targets?.find(t => t.key === grapeSelection?.targetKey)
  const grapeDone = Boolean(grapeSpread && grapeTarget && !unresolvedGrapeShotTargets(grapeSpread, events).some(t => t.key === grapeTarget.key))
  const grapeCriticalUsed = sheet.blackpowderShots.some(s => s.id === grapeSpread?.shotId && s.criticalUsed)
  const grapeStrength = sheet.blackpowderShots.find(s => s.id === grapeSpread?.shotId)?.misfireDie === 6 ? 4 : 3
  const [mortarSelection, setMortarSelection] = useState<{ shotId: string; targetKey: string } | null>(null)
  const mortarShot = sheet.mortarShots.find(s => s.id === mortarSelection?.shotId && !s.correction)
  const mortarCriticalUsed = sheet.blackpowderShots.some(s => s.id === mortarShot?.id && s.criticalUsed)
  const mortarTarget = mortarShot?.targets?.find(t => t.key === mortarSelection?.targetKey)
  const mortarDone = Boolean(mortarShot && mortarTarget && !unresolvedMortarTargets(mortarShot, events).some(t => t.key === mortarTarget.key))
  const areaId = mortarShot ? `mortar:${mortarShot.id}` : grapeSpread ? `grape:${grapeSpread.shotId}` : pigeonLaunch ? `pigeon:${pigeonLaunch.id}` : lineShot ? `line:${lineShot.id}` : null
  const selfDamage = Boolean(selfShot || fireHit || volatileHit)
  const areaTarget = volatileHit ? { key: volatileHit.key, warriorId: volatileHit.warriorId, warbandId: roster.id, name: volatileHit.name } : fireHit ? { key: `fire:${fireHit.id}`, warriorId: fireHit.warriorId, warbandId: roster.id, name: 'the burning warrior' } : selfShot ? { key: `self:${selfShot.id}`, warriorId: selfShot.warriorId, warbandId: roster.id, name: 'the firer' } : mortarTarget ?? grapeTarget ?? pigeonTarget ?? lineTarget

  const mine = useMemo(() => withBrokenWeapons(withBolasEntanglement(combatantsOf(roster, template, roster.name, sheet, boosts?.[roster.id]), events, roster.id, sheet.bolasRecoveredEventIds), items, events), [roster, template, sheet, boosts, events, items])
  const targets = useMemo(
    () =>
      enemies.warbands.flatMap((w) => {
        const session = sessions.find((s) => s.warband_id === w.participant.warband_id)
        return withBrokenWeapons(withBolasEntanglement(combatantsOf(w.roster, w.template, w.participant.warband_name, session?.live_state, boosts?.[w.participant.warband_id]), events, w.participant.warband_id, session?.live_state.bolasRecoveredEventIds), w.items, events)
      }),
    [enemies.warbands, sessions, boosts, events],
  )

  const [attackerId, setAttackerId] = useState<string | null>(null)
  const [defenderId, setDefenderId] = useState<string | null>(null)
  // Ranged Attack should open on a warrior who can actually shoot, not just the first one fit to
  // fight — otherwise it silently falls back to a melee weapon default, defeating the point of
  // having tapped Ranged specifically.
  const rangedDefault = startWith === 'ranged' ? mine.find((c) => !c.out && loadoutFor(c).ranged.length > 0) : undefined
  const selectedAttacker = mine.find((c) => c.id === attackerId) ?? rangedDefault ?? mine.find((c) => !c.out) ?? mine[0]
  const selectedDefender = areaTarget ? [...mine, ...targets].find(c => c.id === areaTarget.warriorId && c.warbandId === areaTarget.warbandId) : targets.find((c) => c.id === defenderId) ?? targets.find((c) => !c.out) ?? targets[0]
  const attacker = selectedAttacker ? withGuidingDream(selectedAttacker, selectedDefender, sheet) : selectedAttacker
  const defender = selectedDefender ? withGuidingDream(selectedDefender, selectedAttacker, (selectedDefender.warbandId === roster.id ? sheet : sessions.find(s => s.warband_id === selectedDefender.warbandId)?.live_state)) : selectedDefender
  // Pin the defaults once chosen (state adjusted during render, the React way), so a logged kill that marks
  // the target out of action does not swap the fight under the player.
  if (attackerId === null && attacker) setAttackerId(attacker.id)
  if (defenderId === null && defender) setDefenderId(defender.id)

  const attackerKit = useMemo(() => (attacker ? loadoutFor(attacker) : null), [attacker])
  const defenderCarriedKit = useMemo(() => (defender ? loadoutFor(defender) : null), [defender])
  const [defenderChoice, setDefenderChoice] = useState<{ id: string; primary: number; offHand: number } | null>(null)
  const defenderWeapons = defenderCarriedKit?.melee.length ? defenderCarriedKit.melee : [defaultPrimary([])]
  const validDefenderChoice = defender && defenderChoice && defenderChoice.id === defender.id && defenderWeapons[defenderChoice.primary] ? defenderChoice : null
  const defenderPrimary = validDefenderChoice ? defenderWeapons[validDefenderChoice.primary] : defaultPrimary(defenderWeapons)
  const defenderOffOptions = offHandCandidates(defenderWeapons, defenderPrimary)
  const preferredDefenderOff = validDefenderChoice ? defenderWeapons[validDefenderChoice.offHand] : defaultOffHand(defenderWeapons, defenderPrimary)
  const defenderOff = preferredDefenderOff && defenderOffOptions.includes(preferredDefenderOff) ? preferredDefenderOff : null

  // Weapon choice follows the attacker: a new attacker gets sensible defaults.
  const [physicalSelection, setPhysicalSelection] = useState<Record<string, string>>({})
  const [choice, setChoice] = useState<WeaponChoice | null>(null)
  const waterRows = attacker && !selfDamage && !attacker.traitIds.some(trait => trait === 'undead' || trait === 'possessed') ? items.filter(item => item.warband_id === roster.id && item.holder_id === attacker.id && item.item_rules_id === 'blessed_water' && item.quantity > 0) : []
  const waterWeapon = waterRows.length && attacker && attackerKit ? blessedWaterWeapon(toCharacter(attacker, attackerKit)) : null
  const weapons: Weapon[] = attackerKit ? [...(attackerKit.melee.length > 0 ? attackerKit.melee : [defaultPrimary([])]), ...attackerKit.ranged, ...(waterWeapon ? [waterWeapon] : [])] : []
  const melee = attackerKit && attackerKit.melee.length > 0 ? attackerKit.melee : weapons.slice(0, 1)
  const current: WeaponChoice | null = attacker
    ? choice && choice.attackerId === attacker.id && choice.primary < weapons.length
      ? choice
      : (() => {
          const ranged = startWith === 'ranged' ? weapons.filter(weapon => weapon.type === 'ranged') : []
          if (ranged.length > 0) return { attackerId: attacker.id, primary: weapons.indexOf(ranged[0]), offHand: -1 }
          const primary = defaultPrimary(melee)
          const primaryIndex = Math.max(0, weapons.indexOf(primary))
          const off = defaultOffHand(melee, primary)
          return { attackerId: attacker.id, primary: primaryIndex, offHand: off ? melee.indexOf(off) : -1 }
        })()
    : null
  const primary = current ? weapons[current.primary] : null
  const isBlessedWater = primary?.id === 'blessed_water'
  const [waterRowId, setWaterRowId] = useState('')
  const waterRow = waterRows.find(row => row.id === waterRowId) ?? waterRows.find(row => blessedWaterRemaining(sheet, row) > 0) ?? waterRows[0]
  const waterUnavailable = Boolean(isBlessedWater && (!waterRow || blessedWaterRemaining(sheet, waterRow) < 1))
  const [waterCorrection, setWaterCorrection] = useState('')
  const [waterError, setWaterError] = useState<string | null>(null)
  // First generic core cadence path: handguns. Pistols need brace/per-copy attack allocation separately.
  const [handgunCorrection, setHandgunCorrection] = useState('')
  const isCoreHandgun = !selfDamage && primary?.id === 'handgun'
  const handgunCopies = isCoreHandgun && attacker ? physicalWeaponChoices(items, events, roster.id, attacker.id, 'handgun') : []
  const handgunHeld = handgunCopies.find(c => c.key === physicalSelection[`${attacker?.id}:handgun`]) ?? handgunCopies[0]
  const handgunKey = physicalGunKey(handgunHeld?.snapshot, `${attacker?.id}:handgun`)
  const isSwivel = !selfDamage && Boolean(primary?.id.startsWith('swivel_gun_'))
  const swivelSlots = attacker?.kind === 'henchman' ? Math.max(1, attacker.groupSize ?? 1) : 1
  const swivelModel = Math.min(swivelSlot, swivelSlots - 1)
  const swivelLegacyKey = `swivel:${swivelModel}`
  const swivelCopies=isSwivel&&attacker&&primary?physicalWeaponChoices(items,events,roster.id,attacker.id,primary.id):[]
  const swivelHeld=swivelCopies.find(c=>c.key===physicalSelection[`${attacker?.id}:0`])??swivelCopies[swivelModel]??swivelCopies[0]
  const swivelKey = physicalGunKey(swivelHeld?.snapshot,swivelLegacyKey)
  const isMortar = !selfDamage && primary?.id === 'hand_held_mortar'
  const mortarReady = Boolean(selfDamage || (mortarShot && mortarTarget && !mortarDone && mortarShot.warriorId === attacker?.id))
  const isPigeon = !selfDamage && primary?.id === 'hersten_wenkler_pigeon_bombs'
  const pigeonReady = Boolean(pigeonLaunch && pigeonTarget && !pigeonDone && pigeonLaunch.warriorId === attacker?.id && isPigeon)
  const isLineWeapon = !selfDamage && (primary?.id === 'blunderbuss' || primary?.id === 'chaos_dwarf_blunderbuss')
  const lineReady = Boolean(lineShot && areaTarget && !lineTargetDone && lineShot.warriorId === attacker?.id && lineShot.weaponId === primary?.id)
  const offHandOptions = primary && primary.type === 'melee' ? offHandCandidates(melee, primary) : []
  const offHand = current && current.offHand >= 0 && primary?.type === 'melee' ? melee[current.offHand] ?? null : null
  const offHandValid = offHand ? offHandOptions.includes(offHand) : true

  const [staffCorrection, setStaffCorrection] = useState('')
  const [bolasCorrection, setBolasCorrection] = useState('')
  const [toggles, setToggles] = useState<Record<string, boolean>>({})
  // The roll-through lives in a sheet the dice button opens, rather than a slab down the page.
  const [rolling, setRolling] = useState(false)
  const [rollSetup, setRollSetup] = useState<FightOdds | null>(null)

  // Carry-over between fights: the target's remaining Wounds (their sheet, or what we saw happen here),
  // whether their one parry this turn is spent, and how many of the attacker's attacks go at them.
  const [memory, setMemory] = useState<Record<string, TargetMemory>>({})
  const [woundsOverride, setWoundsOverride] = useState<{ id: string; value: number } | null>(null)
  const [parryOverride, setParryOverride] = useState<{ id: string; turn: number; used: boolean } | null>(null)
  const [attackLimitChoice, setAttackLimitChoice] = useState<{ key: string; value: number } | null>(null)
  const targetMemory = defender ? memory[defender.id] : undefined
  const woundsAlreadyLost = defender
    ? woundsOverride?.id === defender.id
      ? woundsOverride.value
      : Math.min(defender.stats.W, Math.max(defender.woundsLost, targetMemory?.woundsLost ?? 0))
    : 0
  const turns = useBattleTurns(matchId)
  const phaseKey = combatPhaseKey(sheet.turn, turns.data)
  const ownTurnKey = warbandTurnKey(roster.id, sheet.turn, turns.data)
  const individualStupidity = Boolean(attacker && (attacker.kind !== 'henchman' || (attacker.groupSize ?? 1) <= 1))
  const [groupStupidity, setGroupStupidity] = useState<{ id: string; turnKey: string; failed: boolean } | null>(null)
  const burningBlocked = Boolean(attacker && !areaTarget && warriorIsBurning(sheet, events, roster.id, attacker.id))
  const psychologyLoading = Boolean(attacker?.traitIds.includes('stupidity') && (turns.isPending || turns.isError))
  const [seenPhase, setSeenPhase] = useState(phaseKey)
  if (seenPhase !== phaseKey) { setSeenPhase(phaseKey); setRolling(false); setRollSetup(null); setStaffCorrection('') }
  const staffUse = attacker ? serpentStaffUse(sheet, attacker.id, phaseKey) : undefined
  const individualBolas = primary?.id === 'bolas' && attacker && (attacker.kind !== 'henchman' || (attacker.groupSize ?? 1) <= 1)
  const bolasUsed = Boolean(individualBolas && sheet.bolasThrows.some(use => use.warriorId === attacker.id))
  const defenderSession = defender ? sessions.find((s) => s.warband_id === defender.warbandId) : undefined
  const defenderStaffUse = defender && defenderSession ? serpentStaffUse(defenderSession.live_state, defender.id, phaseKey) : undefined
  const staffDefenderWeapon = defenderStaffUse ? defenderCarriedKit?.melee.find(w => w.id === 'serpent_staff') : undefined
  const defenderKit = defenderCarriedKit ? kitWithSelectedWeapons(defenderCarriedKit, staffDefenderWeapon ?? defenderPrimary, staffDefenderWeapon ? null : defenderOff, primary?.type) : null
  const parryUsed = Boolean(defenderStaffUse) || (defender
    ? parryOverride?.id === defender.id && parryOverride.turn === sheet.turn
      ? parryOverride.used
      : targetMemory?.parryUsedTurn === sheet.turn
    : false)
  const toggleList = attacker && primary ? relevantToggles(attacker, primary.type, primary, defenderKit ?? undefined, offHandValid ? offHand : null, defender ?? undefined).filter(t => t.field !== 'serpentStaffPower' && !(t.field === 'charging' && smokeBlocksWarrior(sheet,events,attacker.id,ownTurnKey))) : []
  const active: Partial<CombatContext> = {}
  for (const t of toggleList) (active as Record<string, boolean>)[t.field] = toggles[t.field] ?? Boolean(t.defaultOn)
  // Already knocked down or stunned (from an earlier, already-logged phase this turn): hits it
  // automatically in hand-to-hand, and a stunned target goes straight out of action (01:947-959).
  // Read from the shared log, not a toggle — this is exactly the "the battle sheet doesn't do
  // either of these" report, so it needs to just happen rather than rely on a checkbox.
  active.firepotSmoke = Boolean(attacker && smokeBlocksWarrior(sheet,events,attacker.id,ownTurnKey))
  if (active.firepotSmoke) active.charging = false
  active.serpentStaffPower = Boolean(staffUse)
  if (attacker?.entangled) active.charging = false
  if (attacker) active.failedStupidity = attacker.traitIds.includes('stupidity') && !attacker.traitIds.includes('deathwish') && (individualStupidity ? failedStupidityThisTurn(sheet, attacker.id, ownTurnKey) : groupStupidity?.id === attacker.id && groupStupidity.turnKey === ownTurnKey && groupStupidity.failed)
  const defenderCondition = defender ? conditionsFor(events, defender.warbandId, sheet.turn, turns.data?.recoveries).get(defender.id) : undefined
  if (defenderCondition === 'Knocked down') active.targetKnockedDown = true
  if (defenderCondition === 'Stunned') active.targetStunned = true
  const context = combatContextFor(houseRules, active)

  // Consumables the attacker has marked on the sheet (poisons, drugs, special ammunition) shape the odds and are used up by the report.
  const usedIds = attacker ? itemsUsedBy(sheet, attacker.id) : []
  const attackerPreBattle: PreBattleEffect[] = attackerKit ? preBattleWithRolls(attackerKit.consumables, usedIds, attacker ? itemRollsBy(sheet, attacker.id) : {}) : []
  const defenderUsed = defender && defenderSession ? itemsUsedBy(defenderSession.live_state, defender.id) : []
  const defenderPreBattle: PreBattleEffect[] = defenderKit ? preBattleWithRolls(defenderKit.consumables, defenderUsed, defender && defenderSession ? itemRollsBy(defenderSession.live_state, defender.id) : {}) : []

  const handgunBlocked = isCoreHandgun && attacker ? blackpowderBlock(sheet, attacker.id, handgunKey, Number(ownTurnKey.split(':').at(-1))) : null
  const swivelBlocked = isSwivel && attacker ? blackpowderBlock(sheet, attacker.id, swivelKey, Number(ownTurnKey.split(':').at(-1)),swivelLegacyKey) : null
  const blessedWarbands = enemies.warbands.filter(w => ladyBlessingActive(w.roster.warbandTemplateId, sessions.find(s => s.warband_id === w.roster.id)?.live_state.preBattle ?? {})).map(w => w.roster.id)
  const ladyTest = primary ? ladyBlessingReason(primary, roster.id, defender?.warbandId ?? '', defender?.unitTemplateId, blessedWarbands) ?? (offHandValid && offHand ? ladyBlessingReason(offHand, roster.id, defender?.warbandId ?? '', defender?.unitTemplateId, blessedWarbands) : undefined) : undefined
  // The engine's exact phase resolution is a few hundred multiplications; cheap enough to run on every render.
  const attackKey = attacker && defender && current ? `${attacker.id}:${defender.id}:${current.primary}:${current.offHand}:${volatileKey ?? fireHitId ?? selfShotId ?? mortarSelection?.targetKey ?? grapeSelection?.targetKey ?? pigeonSelection?.targetKey ?? lineSelection?.targetKey ?? ''}` : ''
  const attackLimit = attackLimitChoice?.key === attackKey ? attackLimitChoice.value : undefined
  const odds: FightOdds | null =
    attacker && defender && attackerKit && defenderKit && primary
      ? computeOdds({ ladyBlessing: !areaTarget && Boolean(ladyTest), attacker: selfDamage ? { ...attacker, skillIds: [], traitIds: [] } : attacker, attackerKit: selfDamage ? emptyLoadout() : attackerKit, defender, defenderKit, primary: selfDamage ? { id: 'blackpowder_self_hit', name: volatileHit ? `${volatileHit.weaponName} backfire` : fireHit ? 'Recovery fire hit' : 'Exploding weapon', type: 'ranged', strength: volatileHit ? volatileHit.strength : 4, critCategory: 'missile', concussion: false, special: [volatileHit ? 'volatileSelfHit' : fireHit ? 'fireRecoveryHit' : 'blackpowderSelfHit'], rangedProfile: { shortRange: null, maxRange: null, shotsPerTurn: 1 } } : mortarTarget ? { id: 'mortar_blast_hit', name: 'Mortar blast', type: 'ranged', strength: mortarShot!.strength, critCategory: 'missile', concussion: false, saveModifier: 2, special: ['mortarBlastHit', ...(mortarCriticalUsed ? ['noFurtherCritical'] : [])], rangedProfile: { shortRange: null, maxRange: null, shotsPerTurn: 1 } } : grapeTarget ? { id: 'grape_shot_hit', name: 'Grape Shot additional hit', type: 'ranged', strength: grapeStrength, critCategory: 'missile', concussion: false, special: ['grapeShotHit', 'noArmourSaveModifier', ...(grapeCriticalUsed ? ['noFurtherCritical'] : [])], rangedProfile: { shortRange: null, maxRange: null, shotsPerTurn: 1 } } : primary, offHand: !selfDamage && offHandValid ? offHand : null, context: { ...(selfDamage ? combatContextFor(houseRules) : context), sharedCriticalUsed: Boolean(areaId && sheet.areaCriticals[areaId]), pigeonBlastHit: Boolean(pigeonTarget) }, houseRules, woundsAlreadyLost, parryUsed, defenderStaffPower: Boolean(defenderStaffUse), attackLimit: areaTarget ? 1 : staffUse?.used ? 0 : attackLimit, attackerPreBattle: selfDamage ? [] : attackerPreBattle, defenderPreBattle })
      : null
  const [interception, setInterception] = useState<{key:string; note:string} | null>(null)
  const [interceptionReason, setInterceptionReason] = useState('')
  const interceptKey = `${attackKey}:${sheet.turn}:${Boolean(context.charging)}`
  const guardians = defender ? targets.filter(c => c.protectsMerchantId === defender.id && c.warbandId === defender.warbandId && !c.out) : []
  const interceptionChecked = interception?.key === interceptKey
  const needsInterception = !areaTarget && guardians.length > 0 && !interceptionChecked
  const interceptionNote = interceptionChecked ? interception.note : undefined
  const charmAvailable = Boolean(defender && defenderKit && defenderKit.firstHitDiscard !== null && !targetMemory?.charmUsed)

  function rememberFight(state: RollState) {
    if (!defender) return
    const turn = sheet.turn
    const harmful: Outcome[] = ['wounded', 'knockedDown', 'stunned', 'outOfAction']
    setMemory((m) => {
      const prev = m[defender.id]
      const worstLabel = state.worst && harmful.includes(state.worst) ? OUTCOME_LABEL[state.worst] : null
      return {
        ...m,
        [defender.id]: {
          woundsLost: Math.max(prev?.woundsLost ?? 0, state.woundsLost),
          parryUsedTurn: state.parriesLeft < (odds?.parryAttempts ?? 0) ? turn : (prev?.parryUsedTurn ?? null),
          worst: worstLabel ? { turn, label: worstLabel } : prev?.worst?.turn === turn ? prev.worst : null,
          charmUsed: Boolean(prev?.charmUsed) || (state.charmUsed && state.plans.some((p) => p.luckyCharm !== undefined)),
        },
      }
    })
    setWoundsOverride(null)
    setParryOverride(null)
  }

  if (mine.length === 0) return <Notice tone="info" title="Nobody to attack with">None of your warriors are fit to fight this game.</Notice>
  if (startWith === 'ranged' && !selfDamage && pendingExplosions.length === 0 && !mine.some((c) => !c.out && (loadoutFor(c).ranged.length > 0 || (!c.traitIds.some(trait => trait === 'undead' || trait === 'possessed') && items.some(item => item.holder_id === c.id && item.item_rules_id === 'blessed_water' && item.quantity > 0))))) {
    return <Notice tone="info" title="No eligible units in your warband">Nobody fit to fight is carrying a ranged weapon.</Notice>
  }

  const swordBreaker = Boolean(!areaTarget && defenderKit?.melee.some(w => w.id === 'sword_breaker'))
  const usedCopies = new Set<string>()
  const physicalBindings = (odds?.weapons ?? []).map((entry, index) => {
    const choices = attacker ? physicalWeaponChoices(items, events, roster.id, attacker.id, entry.weapon.id) : []
    const key = `${attacker?.id}:${index}`
    const chosen = choices.find(c => c.key === physicalSelection[key]) ?? (isSwivel ? choices[swivelModel] : undefined) ?? choices.find(c => !usedCopies.has(c.key))
    const duplicate = Boolean(chosen && usedCopies.has(chosen.key))
    if (chosen) usedCopies.add(chosen.key)
    return { choices, chosen, key, duplicate }
  })
  const duplicateWeapon = swordBreaker && physicalBindings.some(binding => binding.duplicate)

  // #24 Option A (Tom's pick): the roll popup carries its own Setup section — weapon, other hand,
  // attack count and only the situation toggles that apply — open before the first roll and folded
  // to a one-line summary once dice are in play. Changing it mid-sequence means starting the attack
  // again; the incomplete attempt has already been recorded, so nothing is lost from the record.
  const shownOdds = rollSetup ?? odds
  const setupSummary = attacker && current && primary && shownOdds
    ? [
        `${weaponLabel(weapons, current.primary)}${offHandValid && offHand ? ` + ${offHand.name}` : ''}`,
        shownOdds.attacks === 1 ? '1 attack' : `${shownOdds.attacks} attacks`,
        shownOdds.weapons[0]?.input.hitThreshold ? `hits on ${shownOdds.weapons[0].input.hitThreshold}+` : null,
      ].filter(Boolean).join(' · ')
    : null
  const setupControls = (locked: boolean) => attacker && current && primary ? (
    <>
      <SelectField
        label="Weapon"
        disabled={locked}
        value={String(current.primary)}
        onChange={(e) => {
          setLineSelection(null); setPigeonSelection(null); setSelfShotId(null)
          const index = Number(e.target.value)
          const next = weapons[index]
          const off = next.type === 'melee' ? defaultOffHand(melee, next) : null
          setChoice({ attackerId: attacker.id, primary: index, offHand: off ? melee.indexOf(off) : -1 })
        }}
      >
        {weapons.map((_, i) => (
          <option key={i} value={String(i)}>
            {weaponLabel(weapons, i)}
          </option>
        ))}
      </SelectField>
      {primary.type === 'melee' && offHandOptions.length > 0 ? (
        <SelectField label="Other hand" disabled={locked} value={offHandValid && offHand ? String(melee.indexOf(offHand)) : '-1'} onChange={(e) => setChoice({ ...current, offHand: Number(e.target.value) })}>
          <option value="-1">Nothing</option>
          {offHandOptions.map((w) => (
            <option key={melee.indexOf(w)} value={String(melee.indexOf(w))}>
              {w.name}
            </option>
          ))}
        </SelectField>
      ) : null}
      {odds && odds.fullAttacks > 1 && !areaTarget ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-ink-dim">Attacks at {defender?.name ?? 'the target'} (of {odds.fullAttacks} max)</span>
          <Stepper value={odds.attacks} disabled={locked} onChange={(v) => setAttackLimitChoice({ key: attackKey, value: v })} label={`attacks at ${defender?.name ?? 'the target'}`} min={1} max={odds.fullAttacks} />
        </div>
      ) : null}
      {toggleList.length > 0 ? (
        <fieldset className="flex min-w-0 flex-col gap-0.5">
          <legend className="mb-0.5 text-[10px] uppercase tracking-wider text-ink-dim">Situation</legend>
          {toggleList.map((t) => (
            <label key={t.field} className="flex min-h-9 items-start gap-2 py-0.5 text-xs text-ink" title={t.hint}>
              <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-brass" disabled={locked || (t.field === 'failedStupidity' && (readOnly || (individualStupidity && (!edit || psychologyLoading))))} checked={t.field === 'failedStupidity' ? Boolean(active.failedStupidity) : toggles[t.field] ?? Boolean(t.defaultOn)} onChange={(e) => {
                const checked = e.target.checked
                if (t.field === 'failedStupidity' && attacker && !readOnly) {
                  if (individualStupidity && edit) edit(s => recordStupidityResult(s, attacker.id, ownTurnKey, attacker.name, checked, sheet.turn))
                  else setGroupStupidity({ id: attacker.id, turnKey: ownTurnKey, failed: checked })
                }
                else setToggles(s => ({ ...s, [t.field]: checked }))
              }} />
              <span>{t.label}{(t.field === 'longRange' || t.field === 'failedStupidity') && t.hint ? <span className="mt-0.5 block text-xs text-ink-dim">{t.field === 'failedStupidity' && !individualStupidity ? "This group has several models. Apply this only to the model currently attacking; record each model’s test at the table. This choice is not saved for the whole group." : t.hint}</span> : null}</span>
            </label>
          ))}
        </fieldset>
      ) : null}
    </>
  ) : null

  return (
    <>
      {isBlessedWater && attacker ? <Notice>
        <p>Blessed Water: throw up to {2 * (odds?.weapons[0]?.strength ?? attacker.stats.S)}″. One vial per throw, including misses. No range or movement penalty. A hit automatically wounds Undead, Daemons or Possessed; no armour save.</p>
        {waterRows.length > 1 ? <SelectField label="Vial stack" value={waterRow?.id ?? ''} onChange={event => setWaterRowId(event.target.value)}>{waterRows.map((row, index) => <option key={row.id} value={row.id}>Stack {index + 1}: {blessedWaterRemaining(sheet, row)} available</option>)}</SelectField> : <p>{waterRow ? blessedWaterRemaining(sheet, waterRow) : 0} vials available.</p>}
        {sheet.blessedWaterUses.some(use => use.warriorId === attacker.id && !use.correction) && edit && !readOnly ? <>
          <TextField label="Reason to correct the latest throw" value={waterCorrection} onChange={event => setWaterCorrection(event.target.value)} />
          <Button variant="secondary" disabled={!waterCorrection.trim()} onClick={() => {
            const use = [...sheet.blessedWaterUses].reverse().find(use => use.warriorId === attacker.id && !use.correction)
            if (!use) return
            try { correctBlessedWater(sheet, use.id, waterCorrection, events); edit(state => correctBlessedWater(state, use.id, waterCorrection, events)); setWaterCorrection(''); setWaterError(null) }
            catch (error) { setWaterError(error instanceof Error ? error.message : 'Could not correct the throw.') }
          }}>Correct latest throw</Button>
        </> : null}
        {waterError ? <p>{waterError}</p> : null}
      </Notice> : null}
      <BlackpowderLosses sheet={sheet} events={events} readOnly={readOnly} onLog={onLogEvent} names={Object.fromEntries(mine.map(w=>[w.id,w.name]))}/>
      {psychologyLoading && turns.isError ? <Notice tone="warn">Refresh the battle to load turn details before recording Stupidity or starting attacks.</Notice> : null}
      {events.some(e => !e.reverted_at && e.payload.brokenWeapons?.some(loss => loss.warbandId === roster.id)) ? <Notice tone="warn" title="Broken equipment">Broken copies are excluded from available weapons. Groups with some intact copies can still select the weapon: use those only for the members who carry them. Revert the break in the battle Log to correct it.</Notice> : null}
      {swordBreaker ? <Notice tone="warn" title="Sword Breaker opponent"><div className="flex flex-col gap-2"><p>A successful parry allows a 4+ Trap Blade roll. Select the carried copy at risk; breaking it does not erase hits already rolled.</p>{physicalBindings.map((binding, index) => binding.choices.length > 1 ? <SelectField key={binding.key} label={`Weapon copy for ${index === 0 ? 'main hand' : 'off hand'}`} value={binding.chosen?.key ?? ''} onChange={e => setPhysicalSelection(current => ({ ...current, [binding.key]: e.target.value }))}>{binding.choices.map(choice => <option key={choice.key} value={choice.key}>{choice.label}</option>)}</SelectField> : null)}{duplicateWeapon ? <p>Select different physical copies for the two hands.</p> : null}</div></Notice> : null}
      {isCoreHandgun ? <Notice title="Handgun reload">
        <p>{handgunBlocked ?? (attacker?.skillIds.includes('hunter') ? 'Hunter allows this handgun to fire every own turn.' : 'After firing, this handgun needs a complete own turn to reload.')}</p>
        {handgunBlocked && edit && !readOnly ? <div className="flex flex-col gap-2"><TextField label="Reason to correct this firing restriction" value={handgunCorrection} onChange={e => setHandgunCorrection(e.target.value)} /><Button variant="secondary" disabled={!handgunCorrection.trim()} onClick={() => {
          const shot = sheet.blackpowderShots.filter(s => s.warriorId === attacker?.id && s.weaponKey === handgunKey && !s.correction).at(-1)
          if (shot) edit(state => correctBlackpowderShot(state, shot.id, handgunCorrection))
          setHandgunCorrection('')
        }}>Record correction</Button></div> : null}
        {handgunCopies.length > 1 ? <SelectField label="Handgun copy" value={handgunHeld?.key ?? ''} onChange={e => setPhysicalSelection(current => ({ ...current, [`${attacker?.id}:handgun`]: e.target.value }))}>{handgunCopies.map(copy => <option key={copy.key} value={copy.key}>{copy.label}</option>)}</SelectField> : null}
      </Notice> : null}
      {isSwivel ? <Notice tone="info" title="Gun at risk"><p>A BOOM result destroys the carried copy selected here. Save the attack result to include its removal in the post-battle report.</p>{physicalBindings.map(binding => binding.choices.length > 1 ? <SelectField key={binding.key} label="Carried gun copy" value={binding.chosen?.key ?? ''} onChange={e => setPhysicalSelection(current => ({ ...current, [binding.key]: e.target.value }))}>{binding.choices.map(copy => <option key={copy.key} value={copy.key}>{copy.label}</option>)}</SelectField> : null)}</Notice> : null}
      {!isSwivel && !isMortar && pendingExplosions.length > 0 ? <Notice tone="warn" title="Unresolved explosion"><div className="flex flex-col gap-2">{pendingExplosions.map(shot => <Button key={shot.id} variant="secondary" disabled={readOnly} onClick={() => { setAttackerId(shot.warriorId); setSelfShotId(shot.id); setFireHitId(null); setVolatileKey(null); setLineSelection(null); setPigeonSelection(null); setGrapeSelection(null); setMortarSelection(null); setRollSetup(null); setRolling(true) }}>Resolve explosion self-hit: {mine.find(w => w.id === shot.warriorId)?.name ?? shot.weaponName}</Button>)}</div></Notice> : null}
      {burningBlocked ? <Notice tone="warn" title="On fire">This warrior may only move until the flames are extinguished. Use Fire recovery above.</Notice> : null}
      {volatileHits.length > 0 ? <Notice tone="warn" title="Weapon backfire"><div className="flex flex-col gap-2">{volatileHits.map(hit => <Button key={hit.key} variant="secondary" disabled={readOnly} onClick={() => {
        setAttackerId(hit.warriorId); setSelfShotId(null); setFireHitId(null); setLineSelection(null); setPigeonSelection(null); setGrapeSelection(null); setMortarSelection(null); setVolatileKey(hit.key); setRollSetup(null); setRolling(true)
        const model = mine.find(w => w.id === hit.warriorId)
        if (model?.kind === 'henchman') setWoundsOverride({ id: model.id, value: 0 })
      }}>Resolve {hit.weaponName} backfire: {hit.name}</Button>)}</div></Notice> : null}
      {fireHits.length > 0 ? <Notice tone="warn" title="Fire damage to resolve"><div className="flex flex-col gap-2">{fireHits.map(test => <Button key={test.id} variant="secondary" disabled={readOnly} onClick={() => {
        setAttackerId(test.warriorId); setSelfShotId(null); setLineSelection(null); setPigeonSelection(null); setGrapeSelection(null); setMortarSelection(null); setFireHitId(test.id); setVolatileKey(null); setRollSetup(null); setRolling(true)
      }}>Resolve fire hit: {mine.find(w => w.id === test.warriorId)?.name ?? test.actorName}</Button>)}</div></Notice> : null}
      {active.firepotSmoke ? <Notice tone="warn" title="Blinded by Firepot smoke">This warrior cannot charge or shoot until the start of its next own turn. Other movement, melee attacks and spells are unaffected.</Notice> : null}
      {/* Attacker and defender face each other, with the dice between them. */}
      <div className="relative grid grid-cols-2 items-stretch gap-3 lg:gap-8">
        <FightBox icon="battle" title="Attacker" tone="brass">
          <SelectField label="Your warrior" hideLabel value={attacker?.id ?? ''} onChange={(e) => { setAttackerId(e.target.value); setLineSelection(null); setPigeonSelection(null); setSelfShotId(null); setFireHitId(null); setVolatileKey(null); setGrapeSelection(null); setMortarSelection(null) }}>
            {mine.map((c) => (
              <option key={c.id} value={c.id}>
                {combatantLabel(c)}
                {c.out ? ' (out of action)' : ''}
              </option>
            ))}
          </SelectField>
          {attacker && attackerKit ? <CombatantLine c={attacker} kit={attackerKit} compact /> : null}

          {attacker && current && primary ? (
            <>
              <SelectField
                label="Weapon"
                value={String(current.primary)}
                onChange={(e) => {
                  setLineSelection(null); setPigeonSelection(null); setSelfShotId(null)
                  const index = Number(e.target.value)
                  const next = weapons[index]
                  const off = next.type === 'melee' ? defaultOffHand(melee, next) : null
                  setChoice({ attackerId: attacker.id, primary: index, offHand: off ? melee.indexOf(off) : -1 })
                }}
              >
                {weapons.map((_, i) => (
                  <option key={i} value={String(i)}>
                    {weaponLabel(weapons, i)}
                  </option>
                ))}
              </SelectField>
              {isSwivel ? <BlackpowderControls sheet={sheet} warriorId={attacker.id} weaponKey={swivelKey} legacyWeaponKey={swivelLegacyKey} slots={swivelSlots} slot={swivelModel} setSlot={setSwivelSlot} blocked={swivelBlocked} readOnly={readOnly} edit={edit} events={events} onSelfHit={id => {
                setLineSelection(null); setPigeonSelection(null); setSelfShotId(id); setFireHitId(null); setVolatileKey(null); setRollSetup(null); setRolling(true)
                if (attacker.kind === 'henchman') setWoundsOverride({ id: attacker.id, value: 0 })
              }} /> : null}
              {isMortar ? <MortarControls items={items} key={attacker.id} attacker={attacker} defender={defender} models={[...mine, ...targets]} sheet={sheet} events={events} ownTurn={Number(ownTurnKey.split(':').at(-1))} hitThreshold={odds?.weapons[0]?.input.hitThreshold ?? null} requiresPermission={Boolean(ladyTest)} mayFire={!burningBlocked && !attacker.out && !psychologyLoading && !active.failedStupidity && (!context.movedThisTurn || [...attacker.skillIds, ...(attackerKit?.skillIds ?? [])].includes('nimble')) && (!turns.data || (!turns.data.finished && turns.data.turn_order[turns.data.active_index] === roster.id))} readOnly={readOnly} edit={edit} onSelfHit={id => {
                setGrapeSelection(null); setMortarSelection(null); setLineSelection(null); setPigeonSelection(null); setSelfShotId(id); setFireHitId(null); setVolatileKey(null); setRollSetup(null); setRolling(true)
                if (attacker.kind === 'henchman') setWoundsOverride({ id: attacker.id, value: 0 })
              }} onResolve={(shot, target) => {
                setSelfShotId(null); setFireHitId(null); setVolatileKey(null); setGrapeSelection(null); setLineSelection(null); setPigeonSelection(null); setMortarSelection({ shotId: shot.id, targetKey: target.key }); setRollSetup(null); setRolling(true)
                const model = [...mine, ...targets].find(c => c.id === target.warriorId && c.warbandId === target.warbandId)
                setWoundsOverride(model?.kind === 'henchman' ? { id: model.id, value: 0 } : null)
              }} /> : null}
              {primary.id === 'swivel_gun_grape_shot' ? <>
                {!areaTarget && defender?.kind === 'henchman' && (defender.groupSize ?? 1) > 1 ? <SelectField label="Grape Shot primary target model" value={String(Math.min(grapePrimarySlot, (defender.groupSize ?? 1) - 1))} onChange={e => setGrapePrimarySlot(Number(e.target.value))}>{Array.from({ length: defender.groupSize ?? 1 }, (_, n) => <option key={n} value={n}>Model {n + 1}</option>)}</SelectField> : null}
                <GrapeShotControls attacker={attacker} models={[...mine, ...targets]} sheet={sheet} events={events} readOnly={readOnly} edit={edit} onResolve={(spread, target) => {
                  setSelfShotId(null); setFireHitId(null); setVolatileKey(null); setLineSelection(null); setPigeonSelection(null); setGrapeSelection({ shotId: spread.shotId, targetKey: target.key }); setRollSetup(null); setRolling(true)
                  const model = [...mine, ...targets].find(c => c.id === target.warriorId && c.warbandId === target.warbandId)
                  setWoundsOverride(model?.kind === 'henchman' ? { id: model.id, value: 0 } : null)
                }} />
              </> : null}
              {isPigeon ? <PigeonLaunchControls key={`${attacker.id}:${primary.id}`} attacker={attacker} models={[...mine, ...targets]} sheet={sheet} events={events} ownTurn={Number(ownTurnKey.split(':').at(-1))} requiresPermission={Boolean(ladyTest)} mayLaunch={!burningBlocked && !attacker.out && !psychologyLoading && !active.failedStupidity && (!context.movedThisTurn || [...attacker.skillIds, ...(attackerKit?.skillIds ?? [])].includes('nimble')) && (!turns.data || (!turns.data.finished && turns.data.turn_order[turns.data.active_index] === roster.id))} readOnly={readOnly} edit={edit} onResolve={(launch, target) => {
                setLineSelection(null); setPigeonSelection({ launchId: launch.id, targetKey: target.key }); setRollSetup(null); setRolling(true)
                const model = [...mine, ...targets].find(c => c.id === target.warriorId && c.warbandId === target.warbandId)
                if (model?.kind === 'henchman') setWoundsOverride({ id: model.id, value: 0 })
              }} /> : null}
              {ladyTest && isLineWeapon ? <p className="text-xs">{ladyTest} One firing test covers the whole line.</p> : null}
              {isLineWeapon ? <LineShotControls requiresPermission={Boolean(ladyTest)} key={`${attacker.id}:${primary.id}`} attacker={attacker} weaponId={primary.id as 'blunderbuss' | 'chaos_dwarf_blunderbuss'} models={[...mine, ...targets]} sheet={sheet} events={events} ownTurn={Number(ownTurnKey.split(':').at(-1))} mayFire={!burningBlocked && !psychologyLoading && !active.failedStupidity && (!turns.data || (!turns.data.finished && turns.data.turn_order[turns.data.active_index] === roster.id))} readOnly={readOnly} edit={edit} onResolve={(shot, target) => {
                setPigeonSelection(null); setLineSelection({ shotId: shot.id, targetKey: target.key }); setRollSetup(null); setRolling(true)
                const model = [...mine, ...targets].find(c => c.id === target.warriorId && c.warbandId === target.warbandId)
                setWoundsOverride(model?.kind === 'henchman' && (model.groupSize ?? 1) > 1 ? { id: model.id, value: 0 } : null)
              }} /> : null}
              {primary.id === 'bolas' ? <div className="flex flex-col gap-2 rounded border border-brass p-3 text-xs">
                <p>{!individualBolas ? 'Each model may throw Bolas once per battle. Track each group member at the table.' : bolasUsed ? 'Bolas already thrown in this battle.' : 'Beginning this throw marks the Bolas used for this battle, even if it misses.'}</p>
                {individualBolas && !bolasUsed ? <Button variant="secondary" disabled={readOnly || !edit} onClick={() => edit?.(s => recordBolasThrow(s, attacker.id, attacker.name, sheet.turn, true))}>Record tabletop throw</Button> : null}
                {bolasUsed ? <>
                  <TextField label="Bolas correction reason" value={bolasCorrection} onChange={e => setBolasCorrection(e.target.value)} hint="Explain an accidental declaration or an agreed table exception; dice history is retained." />
                  <Button variant="secondary" disabled={readOnly || !edit || !bolasCorrection.trim()} onClick={() => { edit?.(s => correctBolasThrow(s, attacker.id, attacker.name, bolasCorrection, sheet.turn)); setBolasCorrection('') }}>Correct Bolas use</Button>
                </> : null}
              </div> : null}
              {primary.id === 'serpent_staff' || staffUse ? <div className="flex flex-col gap-2 rounded border border-brass p-3 text-xs">
                <p className="font-semibold">Serpent Staff power</p>
                {staffUse ? <>
                  <p>{staffUse.used ? 'The staff attack has been used.' : 'One WS4 / S4 attack is ready.'} All normal attacks and parries are forfeited for this combat phase.</p>
                  {primary.id !== 'serpent_staff' ? <p>Select the Serpent Staff to use its attack.</p> : null}
                  <TextField label="Correction reason" value={staffCorrection} onChange={e => setStaffCorrection(e.target.value)} hint="For an accidental command or an agreed exception. The correction is recorded in Dice history." />
                  <Button variant="secondary" disabled={readOnly || !edit || !staffCorrection.trim()} onClick={() => {
                    edit?.(s => correctSerpentStaff(s, attacker.id, phaseKey, attacker.name, staffCorrection.trim(), sheet.turn))
                    setStaffCorrection('')
                  }}>Undo staff command</Button>
                </> : <>
                  <p>Replace all normal attacks and parries this combat phase with one WS4 / S4 attack that strikes first. Confirm this warrior has not already attacked or parried.</p>
                  <Button variant="secondary" disabled={readOnly || !edit || turns.isPending || turns.isError} onClick={() => edit?.(s => activateSerpentStaff(s, attacker.id, phaseKey, attacker.name, sheet.turn))}>Confirm and awaken staff</Button>
                </>}
              </div> : null}
              {/* #24 Option A: the other hand, attack count and situation toggles live in the roll popup's
                  Setup section now, alongside the dice; the weapon stays here too because the special
                  weapon controls above hang off it and the odds below read it. */}
              {setupSummary ? <p className="text-xs text-ink-dim">{setupSummary} · set up in the roll popup</p> : null}
            </>
          ) : null}

          {attacker && attackerKit && attackerKit.consumables.length > 0 ? (
            <fieldset className="flex min-w-0 flex-col gap-0.5">
              <legend className="mb-0.5 text-[10px] uppercase tracking-wider text-ink-dim">Taken this battle</legend>
              {attackerKit.consumables.map((c) => {
                const on = usedIds.includes(c.itemId)
                return (
                  <label key={c.itemId} className="flex min-h-9 items-start gap-2 py-0.5 text-xs text-ink" title={c.effect.note ?? c.name}>
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0 accent-brass"
                      checked={on}
                      disabled={readOnly || !edit}
                      onChange={(e) => edit?.((s) => setItemUsed(s, attacker.id, c.itemId, e.target.checked))}
                    />
                    <span>{c.effect.label}{on && sheet.preBattle[`itemRoll:${attacker.id}:${c.itemId}`] ? <span className="block text-ink-dim">Initiative bonus: {sheet.preBattle[`itemRoll:${attacker.id}:${c.itemId}`]}</span> : null}</span>
                  </label>
                )
              })}
              {preBattleRollsOwed(attackerKit.consumables, usedIds, itemRollsBy(sheet, attacker.id)).map(owed => <div key={`${attacker.id}:${owed.itemId}`} className="py-2">
                <p className="text-sm">{owed.name}: roll the Initiative bonus for this battle.</p>
                <DicePicker count={1} sides={owed.sides} disabled={readOnly || !edit} label={`${owed.name}: Initiative bonus`} resetKey={`${attacker.id}:${owed.itemId}`} onComplete={(values, manual) => edit?.(state => setItemRoll(state, attacker.id, owed.itemId, values[0], manual))} />
              </div>)}
            </fieldset>
          ) : null}
        </FightBox>


        <FightBox icon="shield" title="Defender" tone="accent">
          {enemies.isPending && targets.length === 0 ? (
            <div className="flex justify-center py-3">
              <Spinner label="Loading the enemy rosters" />
            </div>
          ) : null}
          {enemies.error ? <Notice tone="error">{enemies.error}</Notice> : null}
          {!enemies.isPending && targets.length === 0 ? <p className="text-xs text-ink-dim">No enemy models to pick from.</p> : null}
          {targets.length > 0 ? (
            <SelectField label="Enemy model" disabled={Boolean(areaTarget)} hideLabel value={defender?.id ?? ''} onChange={(e) => setDefenderId(e.target.value)}>
              {areaTarget && defender?.warbandId === roster.id ? <option value={defender.id}>{areaTarget.name}</option> : null}
              {enemies.warbands.map((w) => (
                <optgroup key={w.participant.warband_id} label={w.participant.warband_name}>
                  {targets
                    .filter((c) => c.warbandId === w.roster.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {combatantLabel(c)}
                        {c.out ? ' (out of action)' : ''}
                      </option>
                    ))}
                </optgroup>
              ))}
            </SelectField>
          ) : null}
          {defender && defenderKit ? <CombatantLine c={defender} kit={defenderKit} defending compact /> : null}
          {defender && defenderCarriedKit ? <>
            <SelectField label="Weapon held" disabled={Boolean(staffDefenderWeapon)} value={String(defenderWeapons.indexOf(staffDefenderWeapon ?? defenderPrimary))} onChange={e => {
              const index = Number(e.target.value)
              const off = defaultOffHand(defenderWeapons, defenderWeapons[index])
              setDefenderChoice({ id: defender.id, primary: index, offHand: off ? defenderWeapons.indexOf(off) : -1 })
            }}>
              {defenderWeapons.map((w, i) => <option key={i} value={i}>{w.name}</option>)}
            </SelectField>
            {!staffDefenderWeapon && defenderOffOptions.length > 0 ? <SelectField label="Other hand" value={defenderOff ? String(defenderWeapons.indexOf(defenderOff)) : '-1'} onChange={e => setDefenderChoice({ id: defender.id, primary: defenderWeapons.indexOf(defenderPrimary), offHand: Number(e.target.value) })}>
              <option value="-1">Nothing</option>
              {defenderOffOptions.map(w => <option key={defenderWeapons.indexOf(w)} value={defenderWeapons.indexOf(w)}>{w.name}</option>)}
            </SelectField> : null}
          </> : null}
          {defender && defender.stats.W > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-ink-dim">
                Wounds lost
                <span className="block text-[10px]">
                  {defender.stats.W - woundsAlreadyLost} of {defender.stats.W} left
                </span>
              </span>
              <Stepper value={woundsAlreadyLost} onChange={(v) => setWoundsOverride({ id: defender.id, value: v })} label={`wounds already lost by ${defender.name}`} max={defender.stats.W} />
            </div>
          ) : null}
          {defenderStaffUse ? <p className="text-xs text-ink-dim">Serpent Staff power: this warrior has forfeited all parries this combat phase.</p> : null}
          {defender && !defenderStaffUse && (odds?.parryAttempts || parryUsed) ? (
            <label className="flex min-h-9 items-start gap-2 py-0.5 text-xs text-ink" title="One parry per turn, whoever attacks. Resets when the turn counter moves.">
              <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-brass" checked={parryUsed} onChange={(e) => setParryOverride({ id: defender.id, turn: sheet.turn, used: e.target.checked })} />
              <span>Parry used this turn</span>
            </label>
          ) : null}
          {defender && targetMemory?.worst && targetMemory.worst.turn === sheet.turn ? (
            <p className="text-[10px] leading-snug text-ink-dim">Earlier this turn: {targetMemory.worst.label.toLowerCase()}. A worse result stands.</p>
          ) : null}
        </FightBox>

        {/* Floats in the gap between the two, so the pair keeps the full width of the screen. */}
        <button
          type="button"
          disabled={duplicateWeapon || burningBlocked || (Boolean(swivelBlocked) && !selfDamage && !grapeTarget) || grapeDone || psychologyLoading || !odds || !attacker || !defender || odds.attacks < 1 || ((isLineWeapon && !lineReady) || (isPigeon && !pigeonReady) || (isMortar && !mortarReady))}
          onClick={() => { setRollSetup(null); setInterception(null); setInterceptionReason(''); setRolling(true) }}
          aria-label="Roll it through"
          data-rolling={rolling || undefined}
          className="stirheim-dice-button absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
        >
          <RollDiceIcon />
        </button>
      </div>

      {odds && attacker && defender ? (
        <>
          <Sheet
            open={rolling}
            onClose={() => { setRolling(false); setLineSelection(null); setPigeonSelection(null); setSelfShotId(null); setFireHitId(null); setVolatileKey(null); setGrapeSelection(null); setMortarSelection(null) }}
            title={`${attacker.name} attacks ${defender.name}`}
            description={`${(rollSetup ?? odds).attacks === 1 ? '1 attack' : `${(rollSetup ?? odds).attacks} attacks`} this phase. Roll your dice one step at a time, or tap Roll.`}
            footer={
              <Button variant="secondary" block onClick={() => { setRolling(false); setLineSelection(null); setPigeonSelection(null); setSelfShotId(null); setFireHitId(null); setVolatileKey(null); setGrapeSelection(null); setMortarSelection(null) }}>
                Close
              </Button>
            }
          >
          {!areaTarget && setupControls ? (
            <details key={rollSetup ? 'locked' : 'open'} open={!rollSetup} className="stirheim-setup my-3 rounded-md border border-border bg-surface px-3 py-2">
              <summary className="flex cursor-pointer select-none items-center justify-between gap-3 text-sm font-semibold text-ink">
                <span className="min-w-0 truncate">{setupSummary ?? 'Setup'}</span>
                <span className="shrink-0 text-xs font-normal text-ink-dim">{rollSetup ? 'Locked while rolling' : 'Setup'}</span>
              </summary>
              <div className="flex flex-col gap-3 pt-3">
                {setupControls(Boolean(rollSetup))}
                {rollSetup ? (
                  <Button variant="ghost" onClick={() => setRollSetup(null)}>
                    Change setup — starts this attack again
                  </Button>
                ) : null}
              </div>
            </details>
          ) : null}
          {!rollSetup ? <div className="flex flex-col gap-4 py-3">
            {areaTarget ? <p className="text-sm">One automatic Strength {volatileHit ? volatileHit.strength : selfDamage || pigeonTarget ? 4 : mortarTarget ? mortarShot!.strength : grapeTarget ? grapeStrength : 3} hit on {areaTarget.name}. For a group model, confirm any wounds already lost at the table before beginning.</p> : null}
            {areaTarget && defender.kind === 'henchman' && defender.stats.W > 1 ? <Stepper label="Wounds already lost by this model" value={woundsAlreadyLost} onChange={value => setWoundsOverride({ id: defender.id, value })} max={defender.stats.W} /> : null}
            {needsInterception ? <div className="flex flex-col gap-3 rounded border border-brass p-3">
              <p className="font-medium">Merchant’s Guardian</p>
              <p className="text-sm">An unengaged bodyguard intercepts shooting and charges against {defender.name}. Confirm the situation on the tabletop before rolling.</p>
              {guardians.map(g => <Button key={g.id} variant="secondary" onClick={() => {
                const key = `${attacker.id}:${g.id}:${current?.primary}:${current?.offHand}:${sheet.turn}:${Boolean(context.charging)}`
                setInterception({key, note:`Guardian: ${g.name} intercepted the attack against ${defender.name}.`})
                setDefenderId(g.id)
              }}>Direct the attack at {g.name}</Button>)}
              <TextField label="Why the Guardian cannot intercept" value={interceptionReason} onChange={e=>setInterceptionReason(e.target.value)} hint="For example: already engaged in combat; this is an ongoing melee, not a charge. Record an agreed exception if needed."/>
              <Button variant="secondary" disabled={!interceptionReason.trim()} onClick={()=>setInterception({key:interceptKey,note:`Guardian did not intercept the attack against ${defender.name}: ${interceptionReason.trim()}`})}>Keep the Merchant as target</Button>
            </div> : null}
            {interceptionNote ? <p className="text-sm text-ink-dim">{interceptionNote}</p> : null}
            <Button block disabled={waterUnavailable || Boolean(handgunBlocked) || duplicateWeapon || burningBlocked || (Boolean(swivelBlocked) && !selfDamage && !grapeTarget) || grapeDone || psychologyLoading || needsInterception || readOnly || (!areaTarget && Boolean(active.failedStupidity)) || (!areaTarget && Boolean(staffUse?.used)) || (!areaTarget && bolasUsed) || ((isLineWeapon && !lineReady) || (isPigeon && !pigeonReady) || (isMortar && !mortarReady))} onClick={() => { if (waterUnavailable || handgunBlocked || duplicateWeapon || burningBlocked || (!areaTarget && bolasUsed) || ((isLineWeapon && !lineReady) || (isPigeon && !pigeonReady) || (isMortar && !mortarReady))) return; setRollSetup(odds); if (!areaTarget && individualBolas) edit?.(s => recordBolasThrow(s, attacker.id, attacker.name, sheet.turn)); if (!areaTarget && staffUse) edit?.(s => consumeSerpentStaff(s, attacker.id, phaseKey)) }}>Begin attacks</Button>
          </div> : <RollSection
            key={attackKey}
            odds={rollSetup}
            restartBlocked={waterUnavailable}
            beforeStart={isBlessedWater ? id => {
              if (!edit || !waterRow) return false
              try {
                declareBlessedWater(sheet, attacker, waterRow, id)
                edit(state => declareBlessedWater(state, attacker, waterRow, id))
                return true
              } catch (error) { setWaterError(error instanceof Error ? error.message : 'No vial available.'); return false }
            } : undefined}
            onRestart={isSwivel && !areaTarget && edit ? id => edit(s => correctBlackpowderShot(s, id, 'Player restarted the attack roller; earlier dice are preserved.')) : undefined}
            onProgress={edit ? (previous, next, attemptId, rolled) => {
              if (next.critUsed && areaId) edit(s => ({ ...s, areaCriticals: { ...s.areaCriticals, [areaId]: true } }))
              const blastShotId = grapeSpread?.shotId ?? mortarShot?.id
              if (next.critUsed && blastShotId) edit(s => ({ ...s, blackpowderShots: s.blackpowderShots.map(shot => shot.id === blastShotId ? { ...shot, criticalUsed: true } : shot) }))
              if (isCoreHandgun && !areaTarget && primary) {
                const startsHandgun = (!previous && next.pending?.kind === 'hit') || (previous?.pending?.kind === 'firePermission' && next.pending?.kind === 'hit')
                if (startsHandgun) edit(s => recordBlackpowderShot(s, { id: attemptId, warriorId: attacker.id, weaponKey: handgunKey, weaponName: primary.name, heldWeapon: handgunHeld?.snapshot, ownTurn: Number(ownTurnKey.split(':').at(-1)), reloadTurns: reloadTurnsFor(primary, attacker.skillIds) ?? 1, experimental: false, at: new Date().toISOString() }, attacker.name))
              }
              if (!isSwivel || areaTarget) return
              if (next.critUsed) edit(s => ({ ...s, blackpowderShots: s.blackpowderShots.map(shot => shot.id === attemptId ? { ...shot, criticalUsed: true } : shot) }))
              const startsShot = (!previous && next.pending?.kind === 'hit') || (previous?.pending?.kind === 'firePermission' && next.pending?.kind === 'hit')
              if (startsShot) edit(s => recordBlackpowderShot(s, { id: attemptId, warriorId: attacker.id, weaponKey: swivelKey, legacyWeaponKey:swivelLegacyKey, weaponName: 'Swivel Gun', heldWeapon: physicalBindings[0]?.chosen?.snapshot, ownTurn: Number(ownTurnKey.split(':').at(-1)), reloadTurns: 1, experimental: false, at: new Date().toISOString() }, attacker.name))
              if (previous?.pending?.kind === 'hit' && next.pending?.kind === 'misfire') edit(s => ({ ...s, blackpowderShots: s.blackpowderShots.map(shot => shot.id === attemptId ? { ...shot, misfirePending: true } : shot) }))
              if (previous?.pending?.kind === 'misfire' && rolled) edit(s => recordMisfireDie(s, attemptId, rolled.value, rolled.manual ? undefined : rolled.value))
              const hit = previous && rolled && ((['hit', 'hitReroll'].includes(previous.pending?.kind ?? '') && next.cur.hitRoll !== null && next.pending?.kind !== 'misfire') || (previous.pending?.kind === 'misfire' && rolled.value === 6))
              if (primary?.id === 'swivel_gun_grape_shot' && hit) edit(s => startGrapeShotSpread(s, { shotId: attemptId, warriorId: attacker.id, warbandId: roster.id, shooterName: attacker.name, at: new Date().toISOString(), primary: { key: `${defender.warbandId}:${defender.id}:${Math.min(grapePrimarySlot, Math.max(0, (defender.groupSize ?? 1) - 1))}`, warriorId: defender.id, warbandId: defender.warbandId, name: defender.name }, primaryInCover: Boolean(context.cover || defenderKit?.armour.pavise) }))
            } : undefined}
            heldWeapons={physicalBindings.map(binding => binding.chosen?.snapshot)}
            swordBreaker={swordBreaker}
            forceLog={isBlessedWater || Boolean(areaTarget)}
            turn={sheet.turn}
            onAttempt={attempt => edit?.(s => withRollAttempt(s, {...attempt, rolls: [...(staffUse ? ['Serpent Staff power: one WS4 / S4 attack; all normal attacks and parries forfeited this combat phase.'] : []), ...(interceptionNote ? [interceptionNote] : []), ...attempt.rolls]}))}
            attacker={attacker}
            defender={defender}
            defenderKit={defenderKit!}
            charmAvailable={charmAvailable}
            readOnly={readOnly}
            handOff={
              // Only worth offering when the defender belongs to somebody else at the table.
              defender.warbandId !== roster.id
                ? {
                    matchId,
                    attackerWarbandId: roster.id,
                    attackerName: attacker.name,
                    targetWarbandId: defender.warbandId,
                    targetId: defender.id,
                    targetName: defender.name,
                    turn: sheet.turn,
                  }
                : undefined
            }
            onLog={(state, attemptId) =>
              onLogEvent({
                blessedWaterUseId: isBlessedWater ? attemptId : undefined,
                attacker_warband_id: attacker.warbandId,
                attacker_id: attacker.id,
                attacker_kind: attacker.kind === 'henchman' || attacker.kind === 'animal' ? 'group' : 'hero',
                attacker_name: attacker.name,
                target_warband_id: defender.warbandId,
                target_id: defender.id,
                target_unit_template_id: defender.unitTemplateId,
                target_kind: defender.kind === 'henchman' ? 'group' : 'hero',
                // An animal is a single model: its tally is a hero-style out toggle under its animal id.
                target_name: defender.name,
                target_size: defender.groupSize ?? 1,
                wounds_lost: Math.max(0, state.woundsLost - rollSetup.woundsAlreadyLost),
                out_of_action: state.worst === 'outOfAction',
                lineShotId: lineShot?.id,
                lineShotTargetKey: lineTarget?.key,
                volatileBackfireKey: volatileHit?.key,
                fireRecoveryId: fireHit?.id,
                blackpowderSelfShotId: selfShot?.id,
                mortarShotId: mortarShot?.id,
                mortarTargetKey: mortarTarget?.key,
                grapeShotId: grapeSpread?.shotId,
                grapeTargetKey: grapeTarget?.key,
                pigeonLaunchId: pigeonLaunch?.id,
                pigeonTargetKey: pigeonTarget?.key,
                kill: defender.warbandId !== attacker.warbandId && state.worst === 'outOfAction' && (attacker.kind === 'hero' || attacker.kind === 'hiredSword'),
                entangled: state.outcomes.includes('entangled'),
                brokenWeapons: state.brokenWeapons,
                bolasBackfires: state.bolasBackfires || undefined,
                volatileBackfires: state.volatileBackfires || undefined,
                targetOnFire: state.targetOnFire || undefined,
                smokeDueTurnKey: state.smokeHit ? nextOwnTurnKey(warbandTurnKey(defender.warbandId,sheet.turn,turns.data)) : undefined,
                outcome: state.worst ? OUTCOME_LABEL[state.worst] : 'No effect',
                turn: sheet.turn,
                nurgles_rot: state.rotPassed,
                rolls: [...(staffUse ? ['Serpent Staff power: one WS4 / S4 attack; all normal attacks and parries forfeited this combat phase.'] : []), ...(interceptionNote ? [interceptionNote] : []), ...state.log.map((line) => line.text)],
              })
            }
            onFinished={state => { if (!areaTarget || defender.kind !== 'henchman') rememberFight(state) }}
          />}
          </Sheet>
          <OddsSection odds={odds} attacker={attacker} defender={defender} />
        </>
      ) : null}
    </>
  )
}

function weaponLabel(weapons: Weapon[], index: number): string {
  const w = weapons[index]
  const same = weapons.filter((x) => x.id === w.id)
  if (same.length === 1) return w.name
  const n = weapons.slice(0, index + 1).filter((x) => x.id === w.id).length
  return `${w.name} (${n})`
}

function armourText(kit: Loadout): string {
  const parts: string[] = []
  if (kit.armour.type !== 'none') parts.push(`${kit.armour.type} armour`)
  if (kit.armour.shield) parts.push('shield')
  if (kit.armour.kiteShield) parts.push('kite shield')
  if (kit.armour.pavise) parts.push('pavise')
  if (kit.armour.buckler) parts.push('buckler')
  if (kit.helmet) parts.push('helmet')
  return parts.length > 0 ? parts.join(', ') : 'no armour'
}

function CombatantLine({ c, kit, defending = false, compact = false }: { c: Combatant; kit: Loadout; defending?: boolean; compact?: boolean }) {
  const s = c.stats
  const line = defending ? `WS ${s.WS} · T ${s.T} · W ${s.W}` : `WS ${s.WS} · BS ${s.BS} · S ${s.S} · A ${s.A}`
  return (
    <Card className={`flex min-w-0 flex-col gap-1 ${compact ? 'px-2 py-2' : 'px-4 py-3'}`}>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className={`min-w-0 ${compact ? 'text-xs' : 'text-sm'} text-ink`}>{c.typeName}</span>
        <span className={`${compact ? 'text-xs' : 'text-sm'} tabular-nums text-ink`}>{line}</span>
      </div>
      {/* In a narrow column the kit is a list of names; the roster tabs carry the full lines. */}
      {compact ? (
        <p className="text-xs leading-snug text-ink-dim">{kitNames(c) || 'No equipment'}</p>
      ) : (
        <ItemLines items={c.equipment} emptyText="No equipment" />
      )}
      <p className="text-xs text-ink-dim">{armourText(kit)}</p>
      {c.traitIds.length > 0 || c.skillIds.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {c.traitIds.map((id) => {
            const trait = findTrait(id)
            return (
              <HoverCard
                key={id}
                title={trait?.name ?? tidyId(id)}
                label={
                  <Tag tone="neutral">{trait?.name ?? tidyId(id)}</Tag>
                }
              >
                {trait?.description ?? 'No rules text for this trait.'}
              </HoverCard>
            )
          })}
          {c.skillIds.map((id) => {
            const skill = findSkill(id) ?? findWarbandSkill(id)?.skill
            const text = skill && 'description' in skill ? skill.description : skill && 'text' in skill ? skill.text : undefined
            return (
              <HoverCard
                key={id}
                title={skill?.name ?? tidyId(id)}
                label={
                  <Tag tone="brass">{skill?.name ?? tidyId(id)}</Tag>
                }
              >
                {text ?? 'No rules text for this skill.'}
              </HoverCard>
            )
          })}
        </div>
      ) : null}
    </Card>
  )
}

// ---------------------------------------------------------------------------------------------
// Odds
// ---------------------------------------------------------------------------------------------

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-md bg-surface-low px-2 py-2 text-center">
      <span className="text-[10px] uppercase tracking-wider text-ink-dim">{label}</span>
      <span className="text-lg tabular-nums text-ink">{value}</span>
      {sub ? <span className="text-xs tabular-nums text-ink-dim">{sub}</span> : null}
    </div>
  )
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-36 shrink-0 text-ink-dim">{label}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-low" aria-hidden>
        <div className="h-full rounded-full bg-brass" style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }} />
      </div>
      <span className="w-12 shrink-0 text-right tabular-nums text-ink">{percent(value)}</span>
    </div>
  )
}

function WeaponRow({ w, phase }: { w: WeaponOdds; phase: FightOdds['phase'] }) {
  const save = w.input.armourThreshold
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink">
        <span className="font-medium">{w.weapon.name}</span>
        <span className="text-ink-dim">
          {' '}
          · {w.attacks === 1 ? '1 attack' : `${w.attacks} attacks`} · {phase === 'melee' ? `WS ${w.ws}, ` : ''}S {w.strength}
        </span>
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        <Tile label="To hit" value={w.pHit === 1 ? 'Automatic' : thresholdText(w.input.hitThreshold, '—')} sub={percent(w.pHit)} />
        <Tile label="To wound" value={thresholdText(w.input.woundThreshold, '—')} sub={w.input.woundThreshold === null ? 'cannot' : percent(w.pWound / Math.max(w.pHit, 1e-9))} />
        <Tile label="Their save" value={thresholdText(save, 'none')} sub={save === null ? '' : `${percent(1 - w.pThroughSaves)} saved`} />
      </div>
    </div>
  )
}

function OddsSection({ odds, attacker, defender }: { odds: FightOdds; attacker: Combatant; defender: Combatant }) {
  const injury = odds.weapons[0]?.injury
  return (
    <Section title="Odds" aside={`${odds.attacks === 1 ? '1 attack' : `${odds.attacks} attacks`} this phase`}>
      <Card className="flex flex-col gap-4 px-4 py-4">
        {odds.weapons.map((w, i) => (
          <WeaponRow key={`${w.weapon.id}-${i}`} w={w} phase={odds.phase} />
        ))}
        {injury ? (
          <div className="flex flex-col gap-1.5 border-t border-border pt-3">
            <p className="text-[10px] uppercase tracking-wider text-ink-dim">A wound that gets through</p>
            <div className="grid grid-cols-3 gap-1.5">
              <Tile label="Knocked down" value={percent(injury.knockedDown / Math.max(1e-9, 1 - injury.none))} />
              <Tile label="Stunned" value={percent(injury.stunned / Math.max(1e-9, 1 - injury.none))} />
              <Tile label="Out of action" value={percent(injury.outOfAction / Math.max(1e-9, 1 - injury.none))} />
            </div>
          </div>
        ) : null}
        {odds.phase === 'melee' ? (
          <div className="flex flex-col gap-1 border-t border-border pt-3">
            <p className="text-[10px] uppercase tracking-wider text-ink-dim">Who strikes first</p>
            <p className="text-sm text-ink">{odds.strikeOrder}</p>
          </div>
        ) : null}
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <p className="text-[10px] uppercase tracking-wider text-ink-dim">
            {attacker.name} against {defender.name}, whole phase
          </p>
          <Bar label="At least one hit" value={odds.chain.anyHit} />
          <Bar label="A wound gets through" value={odds.chain.anyWound} />
          <Bar label="Knocked down or worse" value={odds.chain.knockedDownOrWorse} />
          <Bar label="Stunned or worse" value={odds.chain.stunnedOrWorse} />
          <Bar label="Out of action" value={odds.chain.outOfAction} />
        </div>
        <ul className="flex flex-col gap-1 border-t border-border pt-3 text-xs text-ink-dim">
          {odds.chain.anyCrit > 0 ? (
            <li>
              Critical hit {percent(odds.chain.anyCrit)} ({odds.weapons[0]?.input.critTable} table); out of action given a critical {percent(odds.chain.ooaGivenCrit)}.
            </li>
          ) : (
            <li>No critical hits are possible against this target.</li>
          )}
          {odds.parryAttempts > 0 ? <li>{defender.name} may parry {odds.parryAttempts === 1 ? 'one hit' : `${odds.parryAttempts} hits`} this phase; that is already in the numbers.</li> : null}
          {odds.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------------------------
// Roll it through
// ---------------------------------------------------------------------------------------------

interface RollSectionProps {
  heldWeapons?: (BrokenWeapon | undefined)[]
  swordBreaker?: boolean
  onRestart?: (attemptId: string) => void
  onProgress?: (previous: RollState | null, next: RollState, attemptId: string, rolled?: { value: number; manual?: boolean }) => void

  forceLog?: boolean
  turn: number
  onAttempt: (attempt: RollAttempt) => void
  odds: FightOdds
  attacker: Combatant
  defender: Combatant
  defenderKit: Loadout
  readOnly: boolean
  /** Write the finished fight to the shared combat log. */
  beforeStart?: (attemptId: string) => boolean
  restartBlocked?: boolean
  onLog: (state: RollState, attemptId: string) => Promise<void>
  /** Called once when the last roll lands, so the tab can carry Wounds and the parry into the next fight. */
  onFinished: (state: RollState) => void
  /** The target's Lucky Charm has not been rolled for yet this battle. */
  charmAvailable: boolean
  /** Who to ask when a step belongs to the defender; absent when the defender is this player. */
  handOff?: HandOffTarget
}

/** Everything needed to put a defender-owned step on the other player's screen. */
export interface HandOffTarget {
  matchId: string
  attackerWarbandId: string
  attackerName: string
  targetWarbandId: string
  targetId: string
  targetName: string
  turn: number
}

function RollSection({ beforeStart, restartBlocked = false, heldWeapons = [], swordBreaker = false, onRestart, onProgress, forceLog, odds, attacker, defender, defenderKit, readOnly, onLog, onFinished, charmAvailable, handOff, turn, onAttempt }: RollSectionProps) {
  const [state, setState] = useState<RollState | null>(null)
  const hand = useHandOff(handOff, (roll, manual) => advance((s) => applyRoll(s, roll, manual), { value: roll, label: 'Their roll', manual }), () => advance(declineRoll))
  // The die just thrown, held so the result can be shown as dice rather than only as a log line.
  const [shown, setShown] = useState<{ value: number; label: string; text: string; tone: 'good' | 'bad' | 'neutral'; manual?: boolean } | null>(null)
  const stateRef = useRef<RollState | null>(null)
  const initialized = useRef(false)
  const [logged, setLogged] = useState<'no' | 'saving' | 'yes' | 'failed'>('no')
  const [logError, setLogError] = useState<string | null>(null)
  // Every attempt "Start again" threw away without logging (#20) — kept visible, not restricted:
  // Tom's own call was that restarting should stay unrestricted friction-wise, but a discarded
  // attempt vanishing with zero trace is exactly the "reroll before anyone sees it" risk raised.
  const [pastAttempts, setPastAttempts] = useState<RollState['log'][]>([])
  const attempt = useRef({ id: crypto.randomUUID(), at: new Date().toISOString() })
  function record(next: RollState, status: RollAttempt['status'] = next.done ? 'complete' : 'incomplete') {
    if (readOnly || next.log.length === 0) return
    onAttempt({ ...attempt.current, kind: 'attack', turn, label: `${attacker.name} attacks ${defender.name}`, status, rolls: next.log.map(line => line.text) })
  }

  function start() {
    const nextAttempt = { id: crypto.randomUUID(), at: new Date().toISOString() }
    if (beforeStart && !beforeStart(nextAttempt.id)) { setLogError('No vial is available. Close this roller and check the Blessed Water stock.'); return }
    attempt.current = nextAttempt
    const plans: AttackPlan[] = odds.weapons.flatMap((w, weaponIndex) =>
      Array.from({ length: w.attacks }, () => ({
        heldWeapon: heldWeapons[weaponIndex],
        swordBreakerParry: swordBreaker,
        weaponName: w.weapon.name,
        input: w.input,
        parry: { beatsOrMatches: defender.skillIds.includes('master_of_blades'), reroll: defenderKitReroll(defenderKit), fixedThreshold: fixedParryThreshold(defenderKit) },
        luckyCharm: defenderKit.firstHitDiscard ?? undefined,
        rot: w.weapon.type === 'melee' && carriesRot(attacker) && !['undead', 'possessed', 'daemon'].some((t) => defender.traitIds.includes(t)),
      })),
    )
    setLogged('no')
    setLogError(null)
    setShown(null)
    const started = startPhase(plans, defender.stats.W, odds.parryAttempts, odds.woundsAlreadyLost, charmAvailable)
    started.log.unshift(...odds.notes.filter(note => note.startsWith('Barbed Whip Enrage:')).map(text => ({text,tone:'neutral' as const})))
    stateRef.current = started
    setState(started)
    record(started)
    if (!readOnly) onProgress?.(null, started, attempt.current.id)
  }

  async function log() {
    if (!state) return
    setLogged('saving')
    setLogError(null)
    try {
      await onLog(state, attempt.current.id)
      setLogged('yes')
    } catch (e) {
      setLogged('failed')
      setLogError(e instanceof Error ? e.message : 'Could not write to the log.')
    }
  }

  // Stepping happens outside setState: an updater must be pure, and a phase must only finish once.
  // The sheet is opened in order to roll, so the first step is already waiting when it appears.
  useEffect(() => {
    if (!initialized.current && odds.attacks > 0) { initialized.current = true; start() }
    // Mounted fresh for each fight (the caller keys it), so this runs once per attack.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function advance(step: (s: RollState) => RollState, rolled?: { value: number; label: string; manual?: boolean }) {
    const current = stateRef.current
    if (!current) return
    const next = step(current)
    stateRef.current = next
    setState(next)
    record(next)
    if (!readOnly) onProgress?.(current, next, attempt.current.id, rolled)
    const line = next.log.at(-1)
    if (rolled && line) setShown({ value: rolled.value, label: rolled.label, text: line.text, tone: line.tone, manual: rolled.manual })
    else if (!rolled) setShown(null)
    if (next.done && !current.done) onFinished(next)
  }

  return (
    <div className="flex flex-col gap-3 py-1" aria-label={state ? `${state.outcomes.length} of ${state.plans.length} rolled` : undefined}>
      {!state ? (
        <p className="text-sm text-ink-dim">Nothing to roll: this warrior has no attacks against that target.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {shown ? <RollResult dice={[shown.value]} headline={shown.label} detail={shown.text} tone={shown.tone} manual={shown.manual} /> : null}
          {state.pending ? (
            <div className={`flex flex-col gap-2 rounded-md border px-3 py-3 ${state.pending.who === 'defender' ? 'border-accent/60 bg-accent/5' : 'border-brass/50 bg-surface-low'}`}>
              {state.pending.who === 'defender' ? (
                <p className="text-[11px] font-bold uppercase tracking-wider text-accent">Over to {defender.name}</p>
              ) : null}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-headline text-[2rem] leading-none text-ink lg:text-4xl">{ROLL_KIND_HEADING[state.pending.kind]}</p>
                  <p className="text-sm text-ink-dim">{state.pending.label}</p>
                  <p className="mt-1 text-base font-semibold text-ink">{state.pending.detail}</p>
                </div>
                <span className="shrink-0">
                  <Tag tone={state.pending.who === 'attacker' ? 'brass' : 'danger'}>{state.pending.who === 'attacker' ? attacker.name : defender.name}</Tag>
                </span>
              </div>
              {hand && state.pending.who === 'defender' && !hand.waiting ? (
                <div>
                  <Button variant="secondary" pending={hand.asking} onClick={() => void hand.ask(state.pending!)}>
                    Ask {defender.name}&apos;s player to roll it
                  </Button>
                </div>
              ) : null}
              {hand?.waiting ? (
                <div className="flex flex-col gap-2 rounded-md border border-brass/50 bg-surface-low px-3 py-2.5">
                  <p className="text-sm text-ink">Waiting for {defender.name}&apos;s player to roll…</p>
                  <p className="text-xs leading-relaxed text-ink-dim">It will land here as soon as they do. Take it back to roll it yourself.</p>
                  <div>
                    <Button variant="ghost" onClick={() => void hand.withdraw()}>
                      Take it back
                    </Button>
                  </div>
                </div>
              ) : state.pending.kind === 'critTable' ? (
                <CritWheel
                  key={state.log.length}
                  table={state.plans[state.index].input.critTable}
                  rollModifier={state.plans[state.index].input.critTableRollModifier}
                  tableName={critTableName(state.plans[state.index].input.critTable)}
                  onSettled={(face, manual) => advance((s) => applyRoll(s, face, manual))}
                />
              ) : (
                <DicePicker
                  key={state.log.length}
                  count={1}
                  sides={state.pending.kind === 'multiWound' ? 3 : 6}
                  label={state.pending.label}
                  resetKey={state.log.length}
                  onComplete={(values, manual) => advance((s) => applyRoll(s, values[0], manual), { value: values[0], label: state.pending!.label, manual })}
                />
              )}
              {state.pending.optional ? (
                <div>
                  <Button variant="ghost" onClick={() => advance(declineRoll)}>
                    {state.pending.kind === 'luckyCharm' ? 'Keep the charm' : 'No parry'}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {state.log.length > 0 ? (
            <ol className="flex flex-col gap-1 text-sm" aria-label="Dice log">
              {state.log.map((line, i) => (
                <li key={i} className={line.tone === 'good' ? 'text-ink' : line.tone === 'bad' ? 'text-ink-dim' : 'text-ink-dim'}>
                  {line.text}
                </li>
              ))}
            </ol>
          ) : null}

          {state.done ? (
            <div key={state.log.length} className={`flex flex-col gap-2 border-t border-border pt-3 ${state.worst ? (RESULT_ANIMATION_CLASS[state.worst] ?? '') : ''}`}>
              <p role="status" className="text-base text-ink">
                <span className="font-headline text-2xl font-semibold">Result: {state.worst ? OUTCOME_LABEL[state.worst] : 'Nothing happened'}.</span>{' '}
                <span className="text-ink-dim">
                  {state.worst === 'outOfAction'
                    ? `${defender.name} is out of action.`
                    : state.worst === 'stunned' || state.worst === 'knockedDown'
                      ? `${defender.name} is ${OUTCOME_LABEL[state.worst].toLowerCase()}.`
                      : state.woundsLost > odds.woundsAlreadyLost
                        ? `${defender.name} is down to ${Math.max(0, defender.stats.W - state.woundsLost)} of ${defender.stats.W} Wounds but still standing.`
                        : state.worst === 'entangled' ? `${defender.name} cannot move and has −2 melee Weapon Skill until freed in Recovery.` : state.targetOnFire ? `${defender.name} is on fire; resolve Recovery before its next actions.` : state.smokeHit ? `${defender.name} must test against Firepot smoke at the start of its next own turn.` : `${defender.name} is unharmed.`}
                </span>
              </p>
              {state.bolasBackfires ? <p className="text-sm text-ink">Log this result to resolve a separate Strength 3 hit on {attacker.name}.</p> : null}
              {state.volatileBackfires ? <p className="text-sm text-ink">Log this result to resolve {state.volatileBackfires} separate Strength 6 hit{state.volatileBackfires === 1 ? '' : 's'} on {attacker.name}.</p> : null}
              {(forceLog || state.brokenWeapons?.length || state.bolasBackfires || state.volatileBackfires || state.targetOnFire || state.smokeHit || state.woundsLost > odds.woundsAlreadyLost || state.worst && ['entangled', 'wounded', 'knockedDown', 'stunned', 'outOfAction'].includes(state.worst)) && !readOnly ? (
                <Button variant="primary" block disabled={logged === 'yes'} pending={logged === 'saving'} onClick={() => void log()}>
                  {logged === 'yes' ? 'Logged to both sheets' : 'Log to both sheets'}
                </Button>
              ) : null}
              {logError ? <Notice tone="error">{logError}</Notice> : null}
              {state.worst === 'outOfAction' && (attacker.kind === 'henchman' || attacker.kind === 'animal') ? <p className="text-xs text-ink-dim">{attacker.kind === 'animal' ? 'Animals' : 'Henchmen'} earn no experience for kills; the log still marks the casualty for the other side.</p> : null}
              {(forceLog || state.brokenWeapons?.length || state.bolasBackfires || state.volatileBackfires || state.targetOnFire || state.smokeHit || state.woundsLost > odds.woundsAlreadyLost || state.worst && ['entangled', 'wounded', 'knockedDown', 'stunned', 'outOfAction'].includes(state.worst)) ? (
                <p className="text-xs text-ink-dim">Logging puts the {state.worst === 'outOfAction' ? (attacker.warbandId === defender.warbandId ? 'casualty' : 'kill and the casualty') : state.worst === 'entangled' ? 'entanglement' : state.bolasBackfires ? 'Bolas backfire' : state.volatileBackfires ? 'Cathayan backfire' : state.targetOnFire ? 'fire condition' : state.smokeHit ? 'Firepot hit and smoke test' : 'Wounds lost'} on both sheets at once, and can be reverted from the Log tab.</p>
              ) : null}
            </div>
          ) : null}

          <Button
            variant="ghost"
            block
            disabled={restartBlocked}
            onClick={() => {
              if (restartBlocked) return
              if (stateRef.current && stateRef.current.log.length > 0) {
                record(stateRef.current, 'restarted')
                setPastAttempts((p) => [...p, stateRef.current!.log])
              }
              stateRef.current = null
              setShown(null)
              onRestart?.(attempt.current.id)
              start()
            }}
          >
            Start again
          </Button>
          {onRestart ? <p className="text-xs text-ink-dim">Restarting corrects this firing record and preserves earlier dice. Any shared damage already logged must be reverted separately.</p> : null}

          {pastAttempts.length > 0 ? (
            <details className="text-xs text-ink-dim">
              <summary className="cursor-pointer select-none">
                {pastAttempts.length} earlier {pastAttempts.length === 1 ? 'attempt was' : 'attempts were'} restarted — dice history retained
              </summary>
              <ol className="mt-2 flex flex-col gap-2">
                {pastAttempts.map((log, i) => (
                  <li key={i} className="rounded-md border border-border bg-surface-low p-2">
                    <p className="mb-1 font-semibold text-ink-dim">Attempt {i + 1}</p>
                    {log.map((line, j) => (
                      <p key={j}>{line.text}</p>
                    ))}
                  </li>
                ))}
              </ol>
            </details>
          ) : null}
        </div>
      )}
    </div>
  )
}

/** Just the names of what a warrior carries, for the narrow fight boxes. */
function kitNames(c: Combatant): string {
  return c.equipment
    .map((e) => (e.itemId ? (findItem(e.itemId)?.name ?? e.itemId) : (e.customName ?? '')))
    .filter(Boolean)
    .join(', ')
}

/** One side of the fight: a headed box so the two read as facing each other on a phone. */
/** The big heading for a roll step, read from across a table: the phase, not the weapon or the reroll count. */
const ROLL_KIND_HEADING: Record<RollKind, string> = {
  trapBlade: 'Trap Blade',
  ignition: 'Set on Fire',
  fishHookFall: 'Fish-hook Strength Test',
  chainKnockdown: 'Chain Shot knock-down',
  misfire: 'Blackpowder Misfire',
  pigeonLaunch: 'Pigeon Launch',
  firePermission: 'Blessing of the Lady',
  hit: 'To Hit',
  hitReroll: 'To Hit',
  luckyCharm: 'Lucky Charm',
  parry: 'Parry',
  parryReroll: 'Parry',
  dodge: 'Dodge',
  wound: 'To Wound',
  woundReroll: 'To Wound',
  woundSecond: 'To Wound',
  critTable: 'Critical Hit',
  multiWound: 'Wounds Caused',
  save: 'Armour Save',
  stepAside: 'Step Aside',
  afterSave: 'Peg Leg',
  ward: 'Ward Save',
  injuryIgnore: 'Undead Construct',
  injury: 'Injury',
  stunSave: 'Helmet',
}

/** How the result lands: knocked down staggers, stunned wobbles, out of action is the hardest hit. */
const RESULT_ANIMATION_CLASS: Partial<Record<Outcome, string>> = {
  knockedDown: 'stirheim-knockdown',
  stunned: 'stirheim-stunned',
  outOfAction: 'stirheim-outofaction',
}

/** A last resort when the catalogue has no entry: "fear_5plus" -> "Fear 5+". */
function tidyId(id: string): string {
  const words = id.replace(/_/g, ' ').replace('5plus', '5+')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** Mirrors the engine's parry reroll rule (buckler + sword, Dwarf axes, fighting claws, iron fists). */
/** The warrior carries Nurgle's Rot (a Tainted One's Blessing, or the Rot caught earlier). */
function carriesRot(c: Combatant): boolean {
  return c.equipment.some((e) => e.itemId === 'nurgles_rot') || c.traitIds.includes('nurgles_rot')
}

/** A Starblade parries on a fixed 4+ when it is the target's only parry item. */
function fixedParryThreshold(kit: Loadout): number | undefined {
  const fixed = kit.melee.filter((w) => w.parry && w.parryThreshold !== undefined)
  const all = kit.melee.filter((w) => w.parry).length + (kit.armour.buckler ? 1 : 0)
  return fixed.length > 0 && fixed.length === all ? Math.min(...fixed.map((w) => w.parryThreshold as number)) : undefined
}

function defenderKitReroll(kit: Loadout): boolean {
  return parryRerollFromItems(kit.melee, kit.armour)
}


/**
 * The attacker's side of a handed-over roll. Puts the pending step to the defending player, watches
 * for their answer, and feeds the face they threw back into the phase. Withdrawing takes the
 * question off their screen and leaves the step to be rolled here.
 */
function useHandOff(target: HandOffTarget | undefined, onRoll: (roll: number, manual?: boolean) => void, onDeclined: () => void) {
  const prompts = useBattlePrompts(target?.matchId)
  const ask = useAskBattlePrompt(target?.matchId)
  const withdraw = useWithdrawBattlePrompt(target?.matchId)
  const [askedId, setAskedId] = useState<string | null>(null)
  // The answer is applied once: a re-render must not replay it into the phase.
  const applied = useRef<string | null>(null)

  const asked = askedId ? (prompts.data ?? []).find((p) => p.id === askedId) : undefined

  useEffect(() => {
    if (!asked || asked.state !== 'answered' || applied.current === asked.id) return
    applied.current = asked.id
    setAskedId(null)
    const answer = asked.answers[0]
    if (!answer) return
    if ('declined' in answer) onDeclined()
    else onRoll(answer.roll, answer.manual)
  }, [asked, onRoll, onDeclined])

  if (!target) return null
  return {
    waiting: Boolean(asked && asked.state === 'waiting'),
    asking: ask.isPending,
    ask: async (step: PendingRoll) => {
      const id = await ask.mutateAsync({
        matchId: target.matchId,
        attackerWarbandId: target.attackerWarbandId,
        attackerName: target.attackerName,
        targetWarbandId: target.targetWarbandId,
        targetId: target.targetId,
        targetName: target.targetName,
        turn: target.turn,
        asks: [{ kind: step.kind, label: step.label, detail: step.detail, optional: Boolean(step.optional) }],
      })
      applied.current = null
      setAskedId(id)
    },
    withdraw: async () => {
      if (!askedId) return
      await withdraw.mutateAsync(askedId)
      setAskedId(null)
    },
  }
}

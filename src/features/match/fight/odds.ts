// From two combatants and a situation to the numbers on the screen: the engine's exact
// probabilities for one phase of attacks, plus the flat thresholds a player rolls against.

import { buildAttackInput, computeAttackCount, computeMaxParries, effectiveOffensiveStats, totalAttackCount, weaponsForPhase } from '../../../rules/engine/buildAttackInput'
import { phaseChain, type PhaseChain } from '../../../rules/engine/chain'
import { IMPOSSIBLE, probabilityAtLeast, type Threshold } from '../../../rules/engine/dice'
import { resolveSingleAttack, type AttackInput, type Severity4Distribution } from '../../../rules/engine/resolveAttack'
import { findSkill } from '../../../rules/data/skills'
import { countParryItems, parryRerollFromItems } from '../../../rules/domain/opponentScenario'
import type { Character, CombatContext, DefenderProfile, Weapon, WeaponKind } from '../../../rules/types'
import { defaultCombatContext } from '../../../rules/types'
import type { CampaignHouseRules } from '../../../rules/types/roster'
import type { Combatant, Loadout } from './combatants'

export interface FightSetup {
  attacker: Combatant
  attackerKit: Loadout
  defender: Combatant
  defenderKit: Loadout
  /** The weapon in the main hand (or the missile weapon being fired). */
  primary: Weapon
  /** Second hand weapon, melee only. */
  offHand: Weapon | null
  context: CombatContext
  houseRules: CampaignHouseRules
  /** Wounds the target has already lost (sheet plus fights earlier this turn). */
  woundsAlreadyLost?: number
  /** The target's one parry this turn has already been used by an earlier attacker. */
  parryUsed?: boolean
  /** Only this many attacks go at this target (splitting between enemies). */
  attackLimit?: number
}

export function toCharacter(c: Combatant, kit: Loadout): Character {
  return {
    id: c.id,
    name: c.name,
    warband: c.warbandName,
    role: c.kind === 'henchman' ? 'henchman' : 'hero',
    stats: c.stats,
    equippedWeapons: [...kit.melee, ...kit.ranged].map((w) => w.id),
    armour: kit.armour,
    helmet: kit.helmet,
    skills: c.skillIds,
    traits: c.traitIds,
    wardSaveThreshold: kit.wardSaveThreshold,
    notes: '',
  }
}

export function toDefender(c: Combatant, kit: Loadout): DefenderProfile {
  return {
    WS: c.stats.WS,
    T: c.stats.T,
    S: c.stats.S,
    W: Math.max(1, c.stats.W),
    armour: kit.armour,
    helmet: kit.helmet,
    activeSkillIds: c.skillIds,
    activeTraitIds: c.traitIds,
    parryWeaponCount: countParryItems(kit.melee, kit.armour),
    parryReroll: parryRerollFromItems(kit.melee, kit.armour),
    wardSaveThreshold: kit.wardSaveThreshold,
  }
}

/** The campaign's switches in the engine's terms. */
export function combatContextFor(houseRules: CampaignHouseRules, overrides: Partial<CombatContext> = {}): CombatContext {
  return { ...defaultCombatContext(), critMode: houseRules.optionalCriticalTables ? 'optional' : 'standard', ...overrides }
}

export interface WeaponOdds {
  weapon: Weapon
  attacks: number
  input: AttackInput
  /** Effective Weapon Skill and Strength the attack is made with (skills and the weapon's bonus applied). */
  ws: number
  strength: number
  /** Chance one attack with this weapon hits, wounds and gets through the saves (fresh target). */
  pHit: number
  pWound: number
  /** Chance one wound gets through the armour save (and Step Aside / Ward), given it landed. */
  pThroughSaves: number
  /** Injury outcome of one ordinary (non-critical) wound against a single-Wound target. */
  injury: Severity4Distribution
}

export interface FightOdds {
  phase: WeaponKind
  /** Attacks going at this target (after any split). */
  attacks: number
  /** Attacks the attacker has in total this phase, before splitting. */
  fullAttacks: number
  /** Wounds the target had already lost when these odds were computed. */
  woundsAlreadyLost: number
  weapons: WeaponOdds[]
  chain: PhaseChain
  /** Parry attempts the defender gets this phase against these attacks (0 when not applicable). */
  parryAttempts: number
  /** Plain-English caveats: rules in play the engine approximates or ignores. */
  notes: string[]
}

export function computeOdds(setup: FightSetup): FightOdds {
  const attacker = toCharacter(setup.attacker, setup.attackerKit)
  const defender = toDefender(setup.defender, setup.defenderKit)
  const phase: WeaponKind = setup.primary.type
  const weapons = setup.offHand && phase === 'melee' ? [setup.primary, setup.offHand] : [setup.primary]
  const houseRules = { strengthArmourPiercing: setup.houseRules.strengthArmourPiercing }

  let remaining = setup.attackLimit ?? Number.POSITIVE_INFINITY
  const perWeapon: WeaponOdds[] = weaponsForPhase(weapons, phase).map((weapon, index) => {
    const full = computeAttackCount(attacker, weapon, index === 0, setup.context)
    const attacks = Math.min(full, Math.max(0, remaining))
    remaining -= attacks
    const input = buildAttackInput({ attacker, weapon, defender, context: setup.context, houseRules })
    const single = resolveSingleAttack(input)
    const { ws, strength } = effectiveOffensiveStats(attacker, weapon, setup.context)
    const pSave = probabilityAtLeast(input.armourThreshold)
    const pStep = input.stepAsideThreshold !== undefined ? probabilityAtLeast(input.stepAsideThreshold) : 0
    const pWard = input.wardSaveThreshold !== undefined ? probabilityAtLeast(input.wardSaveThreshold) : 0
    return {
      weapon,
      attacks,
      input,
      ws,
      strength,
      pHit: single.pHit,
      pWound: single.pWound,
      pThroughSaves: (1 - pSave) * (1 - pStep) * (1 - pWard),
      injury: single.normalOutcome,
    }
  })

  const parryAttempts = phase === 'melee' && !setup.parryUsed && perWeapon.some((w) => w.input.parryEligible) ? computeMaxParries(defender) : 0
  const woundsAlreadyLost = Math.max(0, Math.min(defender.W, setup.woundsAlreadyLost ?? 0))
  const chain = phaseChain(attacker, weapons, defender, setup.context, [], houseRules, phase, {
    maxAttacks: setup.attackLimit,
    woundsAlreadyTaken: woundsAlreadyLost,
    maxParries: setup.parryUsed ? 0 : undefined,
  })

  return { phase, attacks: perWeapon.reduce((n, w) => n + w.attacks, 0), fullAttacks: totalAttackCount(attacker, weapons, setup.context, [], phase), weapons: perWeapon, chain, parryAttempts, woundsAlreadyLost, notes: oddsNotes(setup, perWeapon) }
}

function oddsNotes(setup: FightSetup, weapons: WeaponOdds[]): string[] {
  const notes: string[] = []
  const primary = weapons[0]
  if (primary && primary.attacks === 0) {
    notes.push(setup.primary.moveOrFire ? `${setup.primary.name} cannot fire in a turn the shooter moved.` : `${setup.primary.name} makes no attacks in this situation.`)
  }
  if (primary && primary.input.rerollToHit) notes.push('Missed to-hit rolls may be rerolled once.')
  if (primary && primary.input.autoWoundOnNaturalSixToHit) notes.push('A natural 6 to hit wounds automatically; roll to wound anyway to check for a critical.')
  for (const w of weapons) {
    if (w.input.woundThreshold === IMPOSSIBLE) notes.push(`${w.weapon.name}: Strength ${w.strength} cannot wound Toughness ${setup.defender.stats.T}.`)
  }
  if (setup.defender.stats.W > 1) {
    const left = setup.defender.stats.W - Math.max(0, Math.min(setup.defender.stats.W, setup.woundsAlreadyLost ?? 0))
    notes.push(left <= 0 ? `${setup.defender.name} is already at zero Wounds: every wound through rolls for injury.` : `${setup.defender.name} has ${left} of ${setup.defender.stats.W} Wounds left: injury is only rolled once the last is lost.`)
  }
  if (setup.parryUsed) notes.push(`${setup.defender.name} has already parried this turn.`)
  notes.push(`Initiative: ${setup.attacker.name} ${setup.attacker.stats.I}, ${setup.defender.name} ${setup.defender.stats.I}. Chargers strike first; otherwise the higher Initiative does.`)
  const order = [setup.primary, ...(setup.offHand ? [setup.offHand] : [])]
  for (const w of order) {
    if (w.special.includes('strikesFirstFirstTurn')) notes.push(`${w.name} strikes first in the first turn of a combat, even against a charge.`)
    if (w.special.includes('strikesLast')) notes.push(`${w.name} always strikes last.`)
    if (w.special.includes('strikesFirstWhenCharged')) notes.push(`${w.name} strikes first when its wielder is charged.`)
  }
  if (setup.defenderKit.wardSaveThreshold !== null) notes.push(`Ward save ${setup.defenderKit.wardSaveThreshold}+ against every wound.`)
  if (setup.defenderKit.armour.pavise) notes.push(setup.primary.type === 'ranged' ? 'Pavise: the target counts as in cover (-1 to hit).' : 'Pavise: counts as a shield only while it faces the attacker.')
  const unknownSkills = [...setup.attacker.skillIds, ...setup.defender.skillIds].filter((id) => {
    const skill = findSkill(id)
    return skill !== undefined && !skill.modeled
  })
  if (unknownSkills.length > 0) notes.push('Some skills in play have no effect on these numbers; apply them at the table.')
  for (const a of [...setup.attackerKit.assumptions, ...setup.defenderKit.assumptions]) notes.push(a)
  const ignored = [...setup.attackerKit.ignored, ...setup.defenderKit.ignored]
  if (ignored.length > 0) notes.push(`Not modelled: ${ignored.join(', ')}.`)
  return notes
}

// ---------------------------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------------------------

/** "4+", "6+" (only a natural six), "2+" (anything but a one), or "none" when the roll can never succeed. */
export function thresholdText(t: Threshold, none = 'none'): string {
  if (t === IMPOSSIBLE) return none
  if (t <= 1) return '2+'
  if (t >= 7) return '6+'
  return `${t}+`
}

export function percent(p: number): string {
  const v = Math.round(p * 100)
  if (v === 0 && p > 0) return '<1%'
  if (v === 100 && p < 1) return '>99%'
  return `${v}%`
}

/** The situation toggles that matter for this attacker, weapon and defender. */
export interface ContextToggle {
  field: keyof CombatContext & string
  label: string
  hint?: string
  /** Ticked unless the player unticks it (the engine's default for this field is true). */
  defaultOn?: boolean
}

export function relevantToggles(attacker: Combatant, phase: WeaponKind, primary: Weapon, defenderKit?: Loadout): ContextToggle[] {
  const toggles: ContextToggle[] = []
  const skills = attacker.skillIds.map((id) => findSkill(id)).filter((s) => s !== undefined)
  if (phase === 'melee') {
    toggles.push({ field: 'charging', label: 'Charging' })
    if (primary.strengthBonusFirstTurnOnly && primary.id !== 'lance') toggles.push({ field: 'firstTurnOfCombat', label: 'First turn of this combat', hint: `${primary.name} only gets its Strength bonus in the first turn.` })
    if (skills.some((s) => s.conditionField === 'fightingMultiple')) toggles.push({ field: 'fightingMultiple', label: 'Fighting two or more enemies' })
    if (skills.some((s) => s.conditionField === 'insideBuildings') || attacker.traitIds.includes('pit_fighter')) toggles.push({ field: 'insideBuildings', label: 'Inside a building or ruin' })
    if (attacker.traitIds.includes('hatred')) toggles.push({ field: 'vsHatedEnemy', label: 'Hated enemy, first turn', hint: 'Hatred: reroll misses in the first turn against a hated enemy.' })
    if (defenderKit?.armour.pavise) toggles.push({ field: 'paviseFront', label: 'Their pavise faces you', hint: 'A pavise counts as a shield only against a charge to the front.', defaultOn: true })
  } else {
    toggles.push({ field: 'movedThisTurn', label: 'Moved this turn' })
    toggles.push({ field: 'longRange', label: 'Long range' })
    toggles.push({ field: 'cover', label: 'Target in cover' })
    toggles.push({ field: 'largeTarget', label: 'Large target' })
  }
  return toggles
}

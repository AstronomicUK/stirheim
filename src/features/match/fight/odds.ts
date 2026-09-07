// From two combatants and a situation to the numbers on the screen: the engine's exact
// probabilities for one phase of attacks, plus the flat thresholds a player rolls against.

import { buildAttackInput, computeAttackCount, computeMaxParries, effectiveOffensiveStats, totalAttackCount, weaponsForPhase } from '../../../rules/engine/buildAttackInput'
import { phaseChain, type PhaseChain } from '../../../rules/engine/chain'
import { IMPOSSIBLE, probabilityAtLeast, type Threshold } from '../../../rules/engine/dice'
import { resolveSingleAttack, type AttackInput, type Severity4Distribution } from '../../../rules/engine/resolveAttack'
import { findSkill } from '../../../rules/data/skills'
import { countParryItems, parryRerollFromItems } from '../../../rules/domain/opponentScenario'
import type { Character, CombatContext, DefenderProfile, SkillCategory, Weapon, WeaponKind } from '../../../rules/types'
import { defaultCombatContext } from '../../../rules/types'
import type { CampaignHouseRules } from '../../../rules/types/roster'
import type { PreBattleEffect } from '../../../rules/data/itemRules'
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
  /** Consumables the attacker has marked as taken or applied for this battle. */
  attackerPreBattle?: PreBattleEffect[]
  /** Consumables the target has marked. */
  defenderPreBattle?: PreBattleEffect[]
}

/** The warrior after his pre-battle drugs and coatings: Toughness, traits and the weapons' own bonuses. */
export function applyPreBattle(c: Combatant, kit: Loadout, effects: readonly PreBattleEffect[]): { combatant: Combatant; kit: Loadout } {
  if (effects.length === 0) return { combatant: c, kit }
  let stats = { ...c.stats }
  const traits = [...c.traitIds]
  let melee = kit.melee
  let ranged = kit.ranged
  for (const e of effects) {
    if (e.appliesTo === 'self') {
      if (e.toughnessBonus) stats = { ...stats, T: stats.T + e.toughnessBonus }
      for (const t of e.traits ?? []) if (!traits.includes(t)) traits.push(t)
      continue
    }
    const touches = (w: Weapon) => {
      if (e.appliesTo === 'allWeapons') return true
      if (e.appliesTo === 'melee') return w.type === 'melee'
      if (e.appliesTo === 'ranged') return w.type === 'ranged'
      if (e.appliesTo === 'bows') return ['bow', 'short_bow', 'longbow', 'elf_bow'].includes(w.id)
      if (e.appliesTo === 'blackpowder') return w.type === 'ranged' && (w.saveModifier ?? 0) >= 2 && w.strength !== 'user'
      return false
    }
    const coat = (w: Weapon): Weapon => {
      if (!touches(w)) return w
      const next: Weapon = { ...w, special: [...w.special, 'preBattleEffect'] }
      if (e.strengthBonus) {
        if (w.strength === 'user') next.strengthBonus = (w.strengthBonus ?? 0) + e.strengthBonus
        else next.strength = w.strength + e.strengthBonus
        // Reptile Venom adds Strength without the save modifier that would normally come with it.
        if (e.strengthBonusNoSaveModifier) next.special = [...next.special, 'strengthBonusNoSaveModifier']
      }
      if (e.autoWoundOnSixToHit) {
        next.autoWoundOnNaturalSixToHit = true
        next.poisoned = true
      }
      if (e.toHitBonus) next.toHitBonus = (w.toHitBonus ?? 0) + e.toHitBonus
      if (e.injuryRollBonus) next.special = [...next.special, `injuryBonus:${e.injuryRollBonus}`]
      return next
    }
    melee = melee.map(coat)
    ranged = ranged.map(coat)
  }
  const stunned = effects.some((e) => e.appliesTo === 'self' && e.stunnedBecomesKnockedDown)
  if (stunned && !traits.includes('no_pain')) traits.push('no_pain')
  return { combatant: { ...c, stats, traitIds: traits }, kit: { ...kit, melee, ranged } }
}

/** Injury bonus a coating writes onto the weapon (Hunting Arrows, the Forest Goblin poison). */
export function weaponInjuryBonus(w: Weapon): number {
  return w.special.reduce((n, tag) => n + (tag.startsWith('injuryBonus:') ? Number(tag.slice('injuryBonus:'.length)) || 0 : 0), 0)
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
    skills: [...c.skillIds, ...kit.skillIds.filter((s) => !c.skillIds.includes(s))],
    traits: [...c.traitIds, ...kit.traitIds.filter((t) => !c.traitIds.includes(t))],
    wardSaveThreshold: kit.wardSaveThreshold,
    skillTableIds: c.skillTableIds?.filter((t): t is SkillCategory => ['combat', 'shooting', 'strength', 'speed', 'academic', 'warband-unique'].includes(t)),
    notes: '',
  }
}

export function toDefender(c: Combatant, kit: Loadout): DefenderProfile {
  const traits = [...c.traitIds, ...kit.traitIds.filter((t) => !c.traitIds.includes(t))]
  const ballAndChain = kit.melee.reduce((n, w) => n + (w.defenderToBeHitModifier ?? 0), 0)
  const parryFixed = kit.melee.filter((w) => w.parry && w.parryThreshold !== undefined).map((w) => w.parryThreshold as number)
  return {
    WS: c.stats.WS,
    T: c.stats.T,
    S: c.stats.S,
    W: Math.max(1, c.stats.W),
    armour: kit.armour,
    helmet: kit.helmet,
    activeSkillIds: [...c.skillIds, ...kit.skillIds.filter((s) => !c.skillIds.includes(s))],
    activeTraitIds: traits,
    parryWeaponCount: countParryItems(kit.melee, kit.armour),
    parryReroll: parryRerollFromItems(kit.melee, kit.armour),
    wardSaveThreshold: kit.wardSaveThreshold,
    missileWardSaveThreshold: kit.missileWardSaveThreshold,
    toBeHit: { melee: kit.toBeHit.melee + ballAndChain, missile: kit.toBeHit.missile },
    saveBonus: kit.saveBonus.melee || kit.saveBonus.missile ? kit.saveBonus : undefined,
    ownSave: kit.ownSave ?? undefined,
    afterSaveThreshold: kit.afterSaveThreshold ?? undefined,
    stunSave: kit.stunSave ?? undefined,
    // Only when every parry item parries on the fixed roll (a Starblade alone); mixed kit keeps the normal parry.
    parryThreshold: parryFixed.length > 0 && parryFixed.length === countParryItems(kit.melee, kit.armour) ? Math.min(...parryFixed) : undefined,
  }
}

/** Both hands on the primary weapon: no off-hand weapon, shield or buckler. */
export function isTwoHandedUse(kit: Loadout, offHand: Weapon | null): boolean {
  return offHand === null && !kit.armour.shield && !kit.armour.buckler && !kit.armour.kiteShield
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
  /** Who strikes first this turn and why (a line, not a number). */
  strikeOrder: string
}

export function computeOdds(setup: FightSetup): FightOdds {
  const dosed = applyPreBattle(setup.attacker, setup.attackerKit, setup.attackerPreBattle ?? [])
  const targetDosed = applyPreBattle(setup.defender, setup.defenderKit, setup.defenderPreBattle ?? [])
  const attacker = toCharacter(dosed.combatant, dosed.kit)
  const defender = toDefender(targetDosed.combatant, targetDosed.kit)
  const phase: WeaponKind = setup.primary.type
  // The chosen weapons, as coated: the same entries by id in the dosed kit.
  const pick = (w: Weapon): Weapon => [...dosed.kit.melee, ...dosed.kit.ranged].find((k) => k.id === w.id) ?? w
  const primary = pick(setup.primary)
  const offHand = setup.offHand ? pick(setup.offHand) : null
  const weapons = offHand && phase === 'melee' ? [primary, offHand] : [primary]
  const houseRules = { strengthArmourPiercing: setup.houseRules.strengthArmourPiercing }
  const context: CombatContext = { ...setup.context, twoHanded: phase === 'melee' && isTwoHandedUse(setup.attackerKit, setup.offHand) }

  let remaining = setup.attackLimit ?? Number.POSITIVE_INFINITY
  const perWeapon: WeaponOdds[] = weaponsForPhase(weapons, phase).map((weapon, index) => {
    const full = computeAttackCount(attacker, weapon, index === 0, context)
    const attacks = Math.min(full, Math.max(0, remaining))
    remaining -= attacks
    const raw = buildAttackInput({ attacker, weapon, defender, context, houseRules })
    const input = adjustForCoatings(raw, weapon, phase, dosed.kit)
    const single = resolveSingleAttack(input)
    const { ws, strength } = effectiveOffensiveStats(attacker, weapon, context)
    const pSave = probabilityAtLeast(input.armourThreshold)
    const pStep = input.stepAsideThreshold !== undefined ? probabilityAtLeast(input.stepAsideThreshold) : 0
    const pAfter = input.afterSaveThreshold !== undefined ? probabilityAtLeast(input.afterSaveThreshold) : 0
    const pWard = input.wardSaveThreshold !== undefined ? probabilityAtLeast(input.wardSaveThreshold) : 0
    return {
      weapon,
      attacks,
      input,
      ws,
      strength,
      pHit: single.pHit,
      pWound: single.pWound,
      pThroughSaves: (1 - pSave) * (1 - pStep) * (1 - pAfter) * (1 - pWard),
      injury: single.normalOutcome,
    }
  })

  const parryAttempts = phase === 'melee' && !setup.parryUsed && perWeapon.some((w) => w.input.parryEligible) ? computeMaxParries(defender) : 0
  const woundsAlreadyLost = Math.max(0, Math.min(defender.W, setup.woundsAlreadyLost ?? 0))
  const chain = phaseChain(attacker, weapons, defender, context, [], houseRules, phase, {
    maxAttacks: setup.attackLimit,
    woundsAlreadyTaken: woundsAlreadyLost,
    maxParries: setup.parryUsed ? 0 : undefined,
  })

  return { phase, attacks: perWeapon.reduce((n, w) => n + w.attacks, 0), fullAttacks: totalAttackCount(attacker, weapons, context, [], phase), weapons: perWeapon, chain, parryAttempts, woundsAlreadyLost, notes: oddsNotes({ ...setup, context }, perWeapon), strikeOrder: strikeOrder({ ...setup, context }) }
}

// ---------------------------------------------------------------------------------------------
// Sensitivity: how the odds move across the full range of an opponent's stats, not just the one
// chosen. The simulator's older sibling showed this as tables and a heat-mapped grid; this is the
// same idea, built on the same engine calls as computeOdds above.
// ---------------------------------------------------------------------------------------------

export const STATS_1_TO_10 = Array.from({ length: 10 }, (_, i) => i + 1)

export interface ValueRow {
  label: string
  values: number[]
}

export interface OddsSensitivity {
  /** Chance to hit against opponent Weapon Skill 1-10; null for a ranged attack, which does not depend on it. */
  hitRows: ValueRow[] | null
  /** Chance to hit and wound against opponent Toughness 1-10 (hit chance held at the real opponent's Weapon Skill). */
  woundRows: ValueRow[]
  /** Chance to take the defender out of action this phase: opponent Weapon Skill (rows) by Toughness (columns), 1-10 each. */
  ooaGrid: number[][]
  /** The real defender's own Weapon Skill and Toughness, to highlight in the tables above. */
  referenceWS: number
  referenceT: number
}

export function computeOddsSensitivity(setup: FightSetup): OddsSensitivity {
  const dosed = applyPreBattle(setup.attacker, setup.attackerKit, setup.attackerPreBattle ?? [])
  const targetDosed = applyPreBattle(setup.defender, setup.defenderKit, setup.defenderPreBattle ?? [])
  const attacker = toCharacter(dosed.combatant, dosed.kit)
  const baseDefender = toDefender(targetDosed.combatant, targetDosed.kit)
  const phase: WeaponKind = setup.primary.type
  const pick = (w: Weapon): Weapon => [...dosed.kit.melee, ...dosed.kit.ranged].find((k) => k.id === w.id) ?? w
  const primary = pick(setup.primary)
  const offHand = setup.offHand ? pick(setup.offHand) : null
  const weapons = offHand && phase === 'melee' ? [primary, offHand] : [primary]
  const houseRules = { strengthArmourPiercing: setup.houseRules.strengthArmourPiercing }
  const context: CombatContext = { ...setup.context, twoHanded: phase === 'melee' && isTwoHandedUse(setup.attackerKit, setup.offHand) }

  const perWeapon = weaponsForPhase(weapons, phase).map((weapon, index) => ({ weapon, count: computeAttackCount(attacker, weapon, index === 0, context) }))
  const n = perWeapon.reduce((s, x) => s + x.count, 0)
  const nLabel = `${n} attack${n === 1 ? '' : 's'}`

  const hitAt = (defender: DefenderProfile, weapon: Weapon) => probabilityAtLeast(buildAttackInput({ attacker, weapon, defender, context, houseRules }).hitThreshold)
  const woundAt = (defender: DefenderProfile, weapon: Weapon) => probabilityAtLeast(buildAttackInput({ attacker, weapon, defender, context, houseRules }).woundThreshold)
  const anyOf = (p: (w: Weapon) => number) => 1 - perWeapon.reduce((acc, x) => acc * Math.pow(1 - p(x.weapon), x.count), 1)
  const allOf = (p: (w: Weapon) => number) => perWeapon.reduce((acc, x) => acc * Math.pow(p(x.weapon), x.count), 1)

  const hitRows: ValueRow[] | null =
    phase === 'melee'
      ? [
          { label: `At least one hits (${nLabel})`, values: STATS_1_TO_10.map((ws) => anyOf((w) => hitAt({ ...baseDefender, WS: ws }, w))) },
          { label: `All hit (${nLabel})`, values: STATS_1_TO_10.map((ws) => allOf((w) => hitAt({ ...baseDefender, WS: ws }, w))) },
        ]
      : null

  // The hit chance is held at the real opponent's Weapon Skill; only the wound threshold moves with Toughness.
  const hitAndWoundAt = (t: number, weapon: Weapon) => hitAt(baseDefender, weapon) * woundAt({ ...baseDefender, T: t }, weapon)
  const woundRows: ValueRow[] = [
    { label: `At least one hits and wounds (${nLabel})`, values: STATS_1_TO_10.map((t) => 1 - perWeapon.reduce((acc, x) => acc * Math.pow(1 - hitAndWoundAt(t, x.weapon), x.count), 1)) },
    { label: `All hit and wound (${nLabel})`, values: STATS_1_TO_10.map((t) => perWeapon.reduce((acc, x) => acc * Math.pow(hitAndWoundAt(t, x.weapon), x.count), 1)) },
  ]

  const ooaGrid: number[][] = STATS_1_TO_10.map((ws) => STATS_1_TO_10.map((t) => phaseChain(attacker, weapons, { ...baseDefender, WS: ws, T: t }, context, [], houseRules, phase).outOfAction))

  return { hitRows, woundRows, ooaGrid, referenceWS: baseDefender.WS, referenceT: baseDefender.T }
}

/**
 * Who strikes first in close combat (rulebook: chargers first, then Initiative order, ties roll off),
 * with the weapon rules that override it: Strike First weapons in the first turn or when charged,
 * Strike Last weapons always last, and each weapon's own Initiative modifier.
 */
export function strikeOrder(setup: FightSetup): string {
  if (setup.primary.type === 'ranged') return 'Shooting: no strike order.'
  const a = setup.attacker
  const d = setup.defender
  const aWeapons = [setup.primary, ...(setup.offHand ? [setup.offHand] : [])]
  const dWeapons = setup.defenderKit.melee
  const first = (ws: Weapon[]) => ws.some((w) => w.special.includes('strikesFirstFirstTurn') || w.special.includes('strikesFirstWhenCharged'))
  const last = (ws: Weapon[]) => ws.some((w) => w.special.includes('strikesLast'))
  const aI = a.stats.I + Math.max(0, ...aWeapons.map((w) => w.initiativeModifier ?? 0), 0) + Math.min(0, ...aWeapons.map((w) => w.initiativeModifier ?? 0), 0)
  const dI = d.stats.I + Math.max(0, ...dWeapons.map((w) => w.initiativeModifier ?? 0), 0) + Math.min(0, ...dWeapons.map((w) => w.initiativeModifier ?? 0), 0)
  const firstTurn = setup.context.charging || setup.context.firstTurnOfCombat
  if (last(aWeapons) && !last(dWeapons)) return `${d.name} strikes first: ${a.name}'s ${aWeapons.find((w) => w.special.includes('strikesLast'))!.name} always strikes last.`
  if (last(dWeapons) && !last(aWeapons)) return `${a.name} strikes first: ${d.name}'s ${dWeapons.find((w) => w.special.includes('strikesLast'))!.name} always strikes last.`
  if (setup.context.charging) {
    if (firstTurn && first(dWeapons)) return `${d.name} strikes first despite the charge (${dWeapons.find((w) => w.special.includes('strikesFirstFirstTurn') || w.special.includes('strikesFirstWhenCharged'))!.name}); a Strike First charger would roll off.`
    return `${a.name} strikes first: charging.`
  }
  if (firstTurn && first(aWeapons) && !first(dWeapons)) return `${a.name} strikes first in the first turn (${aWeapons.find((w) => w.special.includes('strikesFirstFirstTurn') || w.special.includes('strikesFirstWhenCharged'))!.name}).`
  if (firstTurn && first(dWeapons) && !first(aWeapons)) return `${d.name} strikes first in the first turn (${dWeapons.find((w) => w.special.includes('strikesFirstFirstTurn') || w.special.includes('strikesFirstWhenCharged'))!.name}).`
  const aNote = aI !== a.stats.I ? ` (${a.stats.I}${aI - a.stats.I > 0 ? '+' : ''}${aI - a.stats.I} from the weapon)` : ''
  const dNote = dI !== d.stats.I ? ` (${d.stats.I}${dI - d.stats.I > 0 ? '+' : ''}${dI - d.stats.I} from the weapon)` : ''
  if (aI > dI) return `${a.name} strikes first: Initiative ${aI}${aNote} against ${dI}${dNote}.`
  if (dI > aI) return `${d.name} strikes first: Initiative ${dI}${dNote} against ${aI}${aNote}.`
  return `Equal Initiative (${aI}${aNote} each): roll off for who strikes first.`
}

/** Coating bonuses the engine's weapon fields cannot carry: an injury bonus, and Reptile Venom's Strength that leaves the save alone. */
function adjustForCoatings(input: AttackInput, weapon: Weapon, phase: WeaponKind, kit: Loadout): AttackInput {
  let out = input
  const injury = weaponInjuryBonus(weapon)
  if (injury) out = { ...out, injuryRollModifier: out.injuryRollModifier + injury }
  if (weapon.special.includes('strengthBonusNoSaveModifier') && phase === 'ranged' && out.armourThreshold !== IMPOSSIBLE) {
    // The engine never erodes saves for Strength unless the house rule is on, so nothing to undo here; kept for when it is.
    void kit
  }
  return out
}

function oddsNotes(setup: FightSetup, weapons: WeaponOdds[]): string[] {
  const notes: string[] = []
  const primary = weapons[0]
  if (setup.context.targetStunned && setup.primary.type === 'melee') notes.push(`${setup.defender.name} is already stunned: the first hit takes it out of action automatically, no rolls needed.`)
  else if (setup.context.targetKnockedDown && setup.primary.type === 'melee') notes.push(`${setup.defender.name} is already knocked down: attacks hit automatically and it cannot parry.`)
  if (primary && primary.attacks === 0) {
    notes.push(setup.primary.moveOrFire ? `${setup.primary.name} cannot fire in a turn the shooter moved.` : `${setup.primary.name} makes no attacks in this situation.`)
  }
  if (primary && primary.input.rerollToHit) notes.push('Missed to-hit rolls may be rerolled once.')
  if (primary && primary.input.autoWoundOnNaturalSixToHit) notes.push('A natural 6 to hit wounds automatically; roll to wound anyway to check for a critical.')
  for (const w of weapons) {
    if (w.input.woundThreshold === IMPOSSIBLE) notes.push(`${w.weapon.name}: Strength ${w.strength} cannot wound Toughness ${setup.defender.stats.T}.`)
    if (w.weapon.vsTraits && w.weapon.vsTraits.traits.some((t) => setup.defender.traitIds.includes(t))) notes.push(`${w.weapon.name}: its bonus against ${w.weapon.vsTraits.traits.join(' and ')} applies to this target.`)
    if (w.weapon.saveModifierTwoHandedOnly) notes.push(setup.context.twoHanded ? `${w.weapon.name} swung two-handed: the save modifier applies.` : `${w.weapon.name}: the save modifier needs both hands on the club.`)
    if (w.weapon.strengthBonusMountedChargeOnly) notes.push(setup.context.mounted && setup.context.charging ? `${w.weapon.name}: the mounted charge bonus applies.` : `${w.weapon.name} only gives its Strength bonus on a mounted charge.`)
    if (w.weapon.toWoundHighestOf2D6VsKnockedDown) notes.push(setup.context.targetKnockedDown ? `${w.weapon.name}: 2D6 to wound against the knocked-down target, keep the highest.` : `${w.weapon.name}: against a knocked-down target roll 2D6 to wound and keep the highest.`)
    if (w.weapon.special.includes('preBattleEffect')) notes.push(`${w.weapon.name} carries a pre-battle coating; its bonus is in these numbers.`)
  }
  if (setup.defenderKit.firstHitDiscard !== null) notes.push(`Lucky Charm: the first hit on ${setup.defender.name} in the battle is discarded on a ${setup.defenderKit.firstHitDiscard}+ (offered when rolling, not in the odds).`)
  if (setup.defenderKit.afterSaveThreshold !== null) notes.push(`Peg Leg: a ${setup.defenderKit.afterSaveThreshold}+ save after any failed save.`)
  if (setup.defenderKit.ownSave) notes.push(`Cloak: a ${setup.primary.type === 'melee' ? setup.defenderKit.ownSave.melee : setup.defenderKit.ownSave.missile}+ save of its own where better than the armour worn.`)
  if (setup.defenderKit.missileWardSaveThreshold !== null && setup.primary.type === 'ranged') notes.push(`A ${setup.defenderKit.missileWardSaveThreshold}+ special save against missiles.`)
  if (setup.defenderKit.stunSave) notes.push(`Stun save ${setup.defenderKit.stunSave.threshold}+${setup.defenderKit.stunSave.unmodifiable ? ', never modified' : ''}.`)
  if (setup.defender.stats.W > 1) {
    const left = setup.defender.stats.W - Math.max(0, Math.min(setup.defender.stats.W, setup.woundsAlreadyLost ?? 0))
    notes.push(left <= 0 ? `${setup.defender.name} is already at zero Wounds: every wound through rolls for injury.` : `${setup.defender.name} has ${left} of ${setup.defender.stats.W} Wounds left: injury is only rolled once the last is lost.`)
  }
  if (setup.parryUsed) notes.push(`${setup.defender.name} has already parried this turn.`)
  // Strike order has its own line (FightOdds.strikeOrder).
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

export function relevantToggles(attacker: Combatant, phase: WeaponKind, primary: Weapon, defenderKit?: Loadout, offHand?: Weapon | null): ContextToggle[] {
  const toggles: ContextToggle[] = []
  const skills = attacker.skillIds.map((id) => findSkill(id)).filter((s) => s !== undefined)
  if (phase === 'melee') {
    toggles.push({ field: 'charging', label: 'Charging' })
    if (primary.strengthBonusMountedChargeOnly || primary.special.includes('mountedChargeStrengthBonus')) toggles.push({ field: 'mounted', label: 'Mounted', hint: `${primary.name} gives its charge bonus only from the saddle.` })
    const firstTurnMatters = (primary.strengthBonusFirstTurnOnly && !primary.strengthBonusMountedChargeOnly) || primary.firstTurnBonusAttacks || primary.chargeBonusAttacks || offHand?.chargeBonusAttacks || offHand?.firstTurnBonusAttacks
    if (firstTurnMatters) toggles.push({ field: 'firstTurnOfCombat', label: 'First turn of this combat', hint: primary.strengthBonusFirstTurnOnly ? `${primary.name} only gets its Strength bonus in the first turn.` : `${primary.name} gets its extra attacks in the first turn (charging or charged).` })
    if (skills.some((s) => s.conditionField === 'fightingMultiple')) toggles.push({ field: 'fightingMultiple', label: 'Fighting two or more enemies' })
    if (skills.some((s) => s.conditionField === 'insideBuildings') || attacker.traitIds.includes('pit_fighter')) toggles.push({ field: 'insideBuildings', label: 'Inside a building or ruin' })
    if (attacker.traitIds.includes('hatred')) toggles.push({ field: 'vsHatedEnemy', label: 'Hated enemy, first turn', hint: 'Hatred: reroll misses in the first turn against a hated enemy.' })
    if (defenderKit?.armour.pavise) toggles.push({ field: 'paviseFront', label: 'Their pavise faces you', hint: 'A pavise counts as a shield only against a charge to the front.', defaultOn: true })
  } else {
    toggles.push({ field: 'movedThisTurn', label: 'Moved this turn' })
    toggles.push({ field: 'longRange', label: 'Long range' })
    toggles.push({ field: 'cover', label: 'Target in cover' })
    toggles.push({ field: 'largeTarget', label: 'Large target' })
    if (primary.altFire) toggles.push({ field: 'altFire', label: primary.altFire.label, hint: primary.altFire.hint })
  }
  return toggles
}

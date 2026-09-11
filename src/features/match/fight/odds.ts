import { ignoresFear, causesFearAgainst } from '../../../rules/engine/psychology'
// From two combatants and a situation to the numbers on the screen: the engine's exact
// probabilities for one phase of attacks, plus the flat thresholds a player rolls against.

import { missilePenaltyRules } from '../../../rules/engine/missileRules'
import { buildAttackInput, weaponAttackCounts, computeMaxParries, effectiveOffensiveStats, totalAttackCount, weaponsForPhase } from '../../../rules/engine/buildAttackInput'
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
  ladyBlessing?: boolean
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
  /** The target has activated its staff in this combat phase and forfeited all parries. */
  defenderStaffPower?: boolean
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
      if (e.appliesTo === 'crossbows') return w.id === 'crossbow'
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
    isAnimal: c.isAnimal,
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
  if (kit.melee.some(w=>w.special.includes('veskitTwoParries'))) traits.push('veskit_two_parries')
  const metallicBody = traits.includes('veskit_metallic_body')
  const ballAndChain = kit.melee.reduce((n, w) => n + (w.defenderToBeHitModifier ?? 0), 0)
  const parryFixed = kit.melee.filter((w) => w.parry && w.parryThreshold !== undefined).map((w) => w.parryThreshold as number)
  return {
    causesFearInAnimals: kit.melee.some(w => w.special.includes('causesFearInAnimals')),
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
    ownSave: metallicBody ? {melee:Math.min(3,kit.ownSave?.melee??3),missile:Math.min(3,kit.ownSave?.missile??3)} : kit.ownSave ?? undefined,
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
  if (setup.defenderStaffPower) { defender.parryWeaponCount = 0; defender.parryReroll = false }
  const phase: WeaponKind = setup.primary.type
  // The chosen weapons, as coated: the same entries by id in the dosed kit.
  const pick = (w: Weapon): Weapon => [...dosed.kit.melee, ...dosed.kit.ranged].find((k) => k.id === w.id) ?? w
  const primary = pick(setup.primary)
  const offHand = setup.offHand ? pick(setup.offHand) : null
  const weapons = offHand && phase === 'melee' ? [primary, offHand] : [primary]
  const houseRules = { strengthArmourPiercing: setup.houseRules.strengthArmourPiercing, opposedParryWS: setup.houseRules.opposedParryWS }
  const context: CombatContext = { ...setup.context, firePermissionThreshold: setup.ladyBlessing ? 4 : undefined, twoHanded: phase === 'melee' && isTwoHandedUse(setup.attackerKit, setup.offHand) }

  let remaining = setup.attackLimit ?? Number.POSITIVE_INFINITY
  const perWeapon: WeaponOdds[] = weaponAttackCounts(attacker, weaponsForPhase(weapons, phase), context).map(({ weapon, count: full }) => {
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
  const houseRules = { strengthArmourPiercing: setup.houseRules.strengthArmourPiercing, opposedParryWS: setup.houseRules.opposedParryWS }
  const context: CombatContext = { ...setup.context, firePermissionThreshold: setup.ladyBlessing ? 4 : undefined, twoHanded: phase === 'melee' && isTwoHandedUse(setup.attackerKit, setup.offHand) }

  const perWeapon = weaponAttackCounts(attacker, weaponsForPhase(weapons, phase), context)
  const n = perWeapon.reduce((s, x) => s + x.count, 0)
  const nLabel = `${n} attack${n === 1 ? '' : 's'}`

  const hitAt = (defender: DefenderProfile, weapon: Weapon) => resolveSingleAttack(buildAttackInput({ attacker, weapon, defender, context, houseRules })).pHit
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
  const normal = normalStrikeOrder(setup)
  if (setup.primary.type !== 'melee') return normal
  const defenderWhip = !setup.defenderStaffPower && setup.defenderKit.melee.find(w => w.special.includes('whipcrackBonusAttack'))
  if (setup.context.charging && defenderWhip) {
    const [aI, dI] = strikeInitiatives(setup)
    const whirlwind = defenderWhip.special.includes('whirlwindStrikeFirstWhenCharged')
    const bonus = whirlwind ? 'two bonus attacks' : 'bonus attack'
    const chargerLast = [setup.primary, ...(setup.offHand ? [setup.offHand] : [])].some(w => w.special.includes('strikesLast') && !(w.special.includes('twoHanded') && [...setup.attacker.skillIds, ...setup.attackerKit.skillIds].includes('strongman')))
    const priority = chargerLast
      ? `${setup.defender.name}'s ${bonus} ${whirlwind ? 'go' : 'goes'} before the charger’s Strike Last attacks.`
      : dI > aI
      ? `${setup.defender.name}'s ${bonus} ${whirlwind ? 'go' : 'goes'} before ${setup.attacker.name}'s charge (Initiative ${dI} against ${aI}).`
      : aI > dI
        ? `${setup.attacker.name}'s charge goes before the ${bonus} (Initiative ${aI} against ${dI}).`
        : `The ${bonus} and the charge have equal Initiative (${aI}): roll off for their order.`
    const rule = whirlwind
      ? `Whirlwind of Death: ${setup.defender.name}'s Dance of Doom attack and off-hand bonus attack gain Strike First. The Dance of Doom attack must target a charger; several chargers do not grant extra attacks.`
      : `Separate Whipcrack attack: ${setup.defender.name} gains one Strike First attack with ${defenderWhip.name}, against the charger only. This is one bonus in total, even with two whips or several chargers.`
    return `Normal attacks: ${normal} ${rule} ${priority}`
  }
  const attackerWhip = [setup.primary, ...(setup.offHand ? [setup.offHand] : [])].find(w => w.special.includes('whipcrackBonusAttack'))
  if (!setup.context.serpentStaffPower && !setup.context.charging && setup.context.firstTurnOfCombat && attackerWhip) {
    if (attackerWhip.special.includes('whirlwindStrikeFirstWhenCharged')) return `Normal attacks: ${normal} If ${setup.attacker.name} was charged, Whirlwind of Death grants Strike First to their Dance of Doom attack and off-hand bonus attack. Compare Initiative with the charge and roll off if equal; all other attacks keep their normal order.`
    return `Normal attacks: ${normal} If ${setup.attacker.name} was charged, only their one Whipcrack bonus attack gains Strike First against that charger; compare its Initiative with the charge and roll off if equal. Two whips or several chargers still grant only one bonus attack.`
  }
  return normal
}

function strikeInitiatives(setup: FightSetup): [number, number] {
  const firstTurn = setup.context.charging || setup.context.firstTurnOfCombat
  const initiative = (w: Weapon) => (w.initiativeModifier ?? 0) + (firstTurn ? w.initiativeFirstTurnBonus ?? 0 : 0)
  const value = (base: number, weapons: Weapon[]) => base + Math.max(0, ...weapons.map(initiative)) + Math.min(0, ...weapons.map(initiative))
  return [value(setup.attacker.stats.I, [setup.primary, ...(setup.offHand ? [setup.offHand] : [])]), value(setup.defender.stats.I, setup.defenderKit.melee)]
}

function normalStrikeOrder(setup: FightSetup): string {
  if (setup.primary.type === 'ranged') return 'Shooting: no strike order.'
  const a = setup.attacker
  const d = setup.defender
  const staffPower = setup.context.serpentStaffPower && setup.primary.id === 'serpent_staff'
  if (staffPower && setup.defenderStaffPower) return 'Both Serpent Staff powers strike first: resolve their tie by Initiative, rolling off if equal.'
  if (staffPower) return `${a.name}'s Serpent Staff attacks first using its power; all normal attacks and parries are forfeited this round.`
  if (setup.defenderStaffPower) return `${d.name}'s Serpent Staff attacks first using its power; all normal attacks and parries are forfeited this round.`
  const aWeapons = [setup.primary, ...(setup.offHand ? [setup.offHand] : [])]
  const dWeapons = setup.defenderKit.melee
  const last = (ws: Weapon[], c: Combatant, kit: Loadout) => ws.filter(w => w.special.includes('strikesLast') && !(w.special.includes('twoHanded') && [...c.skillIds,...kit.skillIds].includes('strongman')))
  const aLast = last(aWeapons,a,setup.attackerKit)
  const dLast = last(dWeapons,d,setup.defenderKit)
  const firstTurn = setup.context.charging || setup.context.firstTurnOfCombat
  const [aI, dI] = strikeInitiatives(setup)
  if (aLast.length && !dLast.length) return `${d.name} strikes first: ${a.name}'s ${aLast[0].name} always strikes last.`
  if (dLast.length && !aLast.length) return `${a.name} strikes first: ${d.name}'s ${dLast[0].name} always strikes last.`
  // The Tilean Pike explicitly beats a charging spear in the opening round
  // (02:550-554), overriding the usual charge/Strike First Initiative tie.
  if (setup.context.charging && !dLast.length && dWeapons.some(w => w.id === 'pike_tileans') && aWeapons.some(w => w.id === 'spear')) {
    return `${d.name} strikes first: the Tilean Pike takes priority over a charging Spear.`
  }
  const aFirstWeapon = firstTurn ? aWeapons.find(w => w.special.includes('strikesFirstFirstTurn')) : undefined
  const dFirstWeapon = firstTurn ? dWeapons.find(w => w.special.includes('strikesFirstFirstTurn') || (setup.context.charging && w.special.includes('strikesFirstWhenCharged'))) : undefined
  const aFirst = !aLast.length && (setup.context.charging || Boolean(aFirstWeapon))
  const dFirst = !dLast.length && Boolean(dFirstWeapon)
  if (aFirst && !dFirst) return setup.context.charging
    ? `${a.name} strikes first: charging.`
    : `${a.name} strikes first in the first turn (${aFirstWeapon!.name}).`
  if (dFirst && !aFirst) return `${d.name} strikes first in the first turn (${dFirstWeapon!.name}).`
  // Chargers and Strike First weapons have the same priority; Initiative breaks their tie.
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
  if (setup.attacker.entangled) notes.push(`${setup.attacker.name} is entangled: cannot move or charge; melee Weapon Skill is reduced by 2. Shooting is unaffected. Resolve a 4+ escape roll in Recovery.`)
  if (setup.defender.entangled) notes.push(`${setup.defender.name} is entangled: melee Weapon Skill is reduced by 2 until freed in Recovery.`)
  if (setup.context.targetStunned && setup.primary.type === 'melee') notes.push(`${setup.defender.name} is already stunned: the first hit takes it out of action automatically, no rolls needed.`)
  else if (setup.context.targetKnockedDown && setup.primary.type === 'melee') notes.push(`${setup.defender.name} is already knocked down: attacks hit automatically and it cannot parry.`)
  if (primary && primary.attacks === 0) {
    notes.push(setup.context.failedStupidity && setup.attacker.traitIds.includes('stupidity') ? 'Failed Stupidity test: this warrior cannot attack until its next turn.' : setup.primary.moveOrFire ? `${setup.primary.name} cannot fire in a turn the shooter moved.` : `${setup.primary.name} makes no attacks in this situation.`)
  }
  if (setup.context.failedFearWhenCharged && !setup.context.charging && setup.primary.type === 'melee' && causesFearAgainst(setup.defender.traitIds, setup.defenderKit.melee.some(w => w.special.includes('causesFearInAnimals')), setup.attacker.isAnimal) && !ignoresFear(setup.attacker.traitIds, setup.context)) notes.push(setup.attacker.traitIds.includes('invincible_swordsman') ? 'Invincible Swordsman retains its explicit always-hit-on-2+ rule.' : 'Failed Fear when charged: this warrior needs 6s to hit this round.')
  if (primary && primary.input.rerollToHit) notes.push('Missed to-hit rolls may be rerolled once.')
  if (primary?.input.automaticHitReason === 'zeroWeaponSkill') notes.push(`${setup.defender.name} has Weapon Skill 0: melee attacks hit automatically, then wound, save and resolve injuries normally.`)
  if (primary && primary.input.autoWoundOnNaturalSixToHit && !primary.input.automaticHits && !primary.input.autoHitKnockedDown) notes.push('A natural 6 to hit wounds automatically; roll to wound anyway to check for a critical.')
  for (const w of weapons) {
    if (w.input.firePermissionThreshold) notes.push('Blessing of the Lady: this shot needs 4+ before rolling to hit. That permission roll is included in these odds.')
    if (w.weapon.special.includes('torchFire')) notes.push('Torch: treated as a club at −1 to hit. Its wounds cannot be regenerated; apply that restriction at the table. It lasts one game and adds 4 inches when spotting hidden enemies. Building fires and torch consumption are not automated here.')
    if (w.weapon.id === 'tufenk') notes.push(`Tufenk: after a hit, roll a D6 separately; ${setup.context.dryTarget ? '2+' : '4+'} sets the target on fire. Ongoing fire and the every-other-turn reload are not included in these odds. In each Recovery phase, a burning model extinguishes the fire on 4+; otherwise it takes a Strength 4 hit and may only move. A friendly model in base contact can help extinguish it on 4+.`)
    if (w.input.automaticHitReason === 'blunderbussLine') notes.push(`${w.weapon.name}: check the straight 16-inch by 1-inch line at the table. These odds resolve one automatic Strength 3 hit on the selected model. Every model in the line, including friends, must be resolved separately. ${w.weapon.special.includes('fireOncePerBattle') ? 'The Battle Sheet records a single firing declaration and resolves every model selected in its line.' : 'The Battle Sheet records the firing declaration and requires a complete own turn between shots.'}`)
    if (w.input.barrageOnFailedWound) notes.push(`${w.weapon.name}: a hit that fails to wound grants another attack at −1 to hit, capped at 6+. The continuing attacks are included in the odds; a miss or successful wound ends the sequence.`)
    if (w.weapon.special.includes('reach3Inches')) notes.push(`${w.weapon.name}: may attack within 3 inches; check reach at the table.`)
    if (w.weapon.special.includes('manSizedWielderOnly')) notes.push(`${w.weapon.name}: only a man-sized or larger warrior may wield it; this does not restrict which enemies it can attack.`)
    if (w.input.entangleInsteadOfWound) notes.push('Bolas: a hit entangles instead of wounding. Apply no movement and −2 Weapon Skill in hand-to-hand combat at the table; shooting is unaffected. In Recovery, 4+ on a D6 frees the model. A natural 1 to hit inflicts a separate Strength 3 hit on the wielder. Backfire damage remains table-managed. The Battle Sheet records one throw and logged entanglement/Recovery for individually identified warriors; track group members separately. These wound and OOA odds refer only to the target.')
    if (!w.input.entangleInsteadOfWound && w.input.woundThreshold === IMPOSSIBLE) notes.push(`${w.weapon.name}: Strength ${w.strength} cannot wound Toughness ${setup.defender.stats.T}.`)
    if (w.weapon.vsTraits && w.weapon.vsTraits.traits.some((t) => setup.defender.traitIds.includes(t))) notes.push(w.weapon.id==='maximilian_holy_weapon' ? `${w.weapon.name}: +1 to wound against this Undead, Possessed, Carnival of Chaos or Beastmen target.` : `${w.weapon.name}: its bonus against ${w.weapon.vsTraits.traits.join(' and ')} applies to this target.`)
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
  if(setup.defender.traitIds.includes('veskit_metallic_body')) notes.push('Metallic Body: Veskit has a 3+ armour save; normal save modifiers apply.')
  if(setup.defender.traitIds.includes('veskit_no_pain')) notes.push('Veskit’s No Pain: ignore knocked-down and stunned injury results; wounds are still lost and out-of-action results still apply.')
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

export function relevantToggles(attacker: Combatant, phase: WeaponKind, primary: Weapon, defenderKit?: Loadout, offHand?: Weapon | null, defender?: Combatant): ContextToggle[] {
  const toggles: ContextToggle[] = []
  if (attacker.traitIds.includes('stupidity')) toggles.push({ field: 'failedStupidity', label: 'Failed Stupidity test', hint: 'No attacks or spells until the start of this warrior’s next own turn, when a new test is due. In the Battle Sheet this result is saved; untick to record a correction.' })
  const skills = attacker.skillIds.map((id) => findSkill(id)).filter((s) => s !== undefined)
  if (phase === 'melee') {
    if (primary.id === 'serpent_staff') toggles.push({ field: 'serpentStaffPower', label: 'Serpent Staff power', hint: 'One WS4 / S4 attack, striking first, instead of all normal attacks and parries this combat phase.' })
    if (defender && causesFearAgainst(defender.traitIds, defenderKit?.melee.some(w => w.special.includes('causesFearInAnimals')), attacker.isAnimal) && !ignoresFear(attacker.traitIds, { frenzyEnded: true })) toggles.push({ field: 'failedFearWhenCharged', label: 'Failed Fear when charged', hint: 'This warrior was charged by the fear-causing opponent and failed its Fear test: needs 6s to hit this round. A failed test to charge instead prevents the charge; it is not this setting.' })
    if (!attacker.entangled) toggles.push({ field: 'charging', label: 'Charging' })
    if(attacker.traitIds.includes('frenzy')) toggles.push({field:'frenzyEnded',label:'Frenzy has ended',hint:'Select if this warrior was knocked down or stunned earlier in this battle. Their Attacks are no longer doubled.'})
    if (primary.strengthBonusMountedChargeOnly || primary.special.includes('mountedChargeStrengthBonus')) toggles.push({ field: 'mounted', label: 'Mounted', hint: `${primary.name} gives its charge bonus only from the saddle.` })
    const firstTurnMatters = (primary.strengthBonusFirstTurnOnly && !primary.strengthBonusMountedChargeOnly) || primary.firstTurnBonusAttacks || primary.chargeBonusAttacks || offHand?.chargeBonusAttacks || offHand?.firstTurnBonusAttacks || [primary, ...(offHand ? [offHand] : []), ...(defenderKit?.melee ?? [])].some(w => w.initiativeFirstTurnBonus || w.special.includes('strikesFirstFirstTurn'))
    if (firstTurnMatters) toggles.push({ field: 'firstTurnOfCombat', label: 'First turn of this combat', hint: primary.strengthBonusFirstTurnOnly ? `${primary.name} only gets its Strength bonus in the first turn.` : 'First-round weapon bonuses and Strike First apply only in this round (charging or charged).' })
    if (skills.some((s) => s.conditionField === 'fightingMultiple')) toggles.push({ field: 'fightingMultiple', label: 'Fighting two or more enemies' })
    if (skills.some((s) => s.conditionField === 'insideBuildings') || attacker.traitIds.includes('pit_fighter')) toggles.push({ field: 'insideBuildings', label: 'Inside a building or ruin' })
    if (attacker.traitIds.includes('hatred')) toggles.push({ field: 'vsHatedEnemy', label: 'Hated enemy, first turn', hint: 'Hatred: reroll misses in the first turn against a hated enemy.' })
    if (defenderKit?.armour.pavise) toggles.push({ field: 'paviseFront', label: 'Their pavise faces you', hint: 'A pavise counts as a shield only against a charge to the front.', defaultOn: true })
  } else {
    if (primary.special.includes('autoHitLine16inLongBy1inWide')) return toggles
    const penalties = missilePenaltyRules(primary)
    const extraRange = skills.reduce((sum, skill) => sum + (skill.effect.type === 'rangeExtension' ? skill.effect.value ?? 0 : 0), 0)
    const maxRange = primary.rangedProfile?.maxRange != null ? primary.rangedProfile.maxRange + extraRange : null
    if (!penalties.ignoresMovement) toggles.push({ field: 'movedThisTurn', label: 'Moved this turn' })
    if (!penalties.ignoresLongRange) toggles.push({ field: 'longRange', label: 'Long range', hint: maxRange ? `More than ${maxRange / 2} inches away (maximum ${maxRange} inches${extraRange ? `, including +${extraRange} from skills` : ''}). Long-range shots still take −1 to hit.` : undefined })
    toggles.push({ field: 'cover', label: 'Target in cover' })
    toggles.push({ field: 'largeTarget', label: 'Large target' })
    if (primary.special.includes('strength3VsDryTargetsLikeMummies')) toggles.push({ field: 'dryTarget', label: 'Dry target (e.g. Mummy)', hint: 'Tufenk hits at Strength 3 instead of 2. The separate roll to catch fire succeeds on 2+ instead of 4+.' })
    if (primary.altFire) toggles.push({ field: 'altFire', label: primary.altFire.label, hint: primary.altFire.hint })
  }
  return toggles
}

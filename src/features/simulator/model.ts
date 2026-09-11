// The simulator (Phase 18): the combat-odds engine turned loose on any two warriors, with the two
// analysers from the original simulator project. A side is a warrior from one of the user's
// warbands, a warrior from another roster in a campaign, or any published unit type with kit
// picked from its list. Everything here is pure; the page wires it to queries.

import { findUnitTemplate, findWarbandTemplate } from '../../rules/data/warbandTemplates'
import { resolveEquipmentName } from '../../rules/data/items'
import { attackGain, computeStatGainBreakdown, defendGain, statRelevance, type StatGainBreakdown } from '../../rules/engine/statSensitivity'
import { categoryFor, computeSkillSensitivity, type SkillSensitivityResult } from '../../rules/engine/skillSensitivity'
import { characterToOpponentScenario } from '../../rules/domain/opponentScenario'
import type { ChainMetric } from '../../rules/engine/chain'
import { equipmentOptionsFor, unitStartingStats, type EquipmentOption } from '../../rules/resolve/builder'
import { unitRules } from '../../rules/data/campaignRules'
import type { CombatContext, Stats, UnitTemplate, WarbandTemplate, Weapon, WeaponKind } from '../../rules/types'
import type { CampaignHouseRules, RosterItem } from '../../rules/types/roster'
import { kindTraits, traitsFromRules, traitsFromSkills, type Combatant, type Loadout } from '../match/fight/combatants'
import { toCharacter, toDefender } from '../match/fight/odds'

/** Where a side comes from. */
export type SideSource = 'mine' | 'campaign' | 'template'

export interface TemplateSide {
  templateId: string
  unitId: string
  /** Catalogue item ids ticked from the unit's list. */
  itemIds: string[]
  /** Skill ids added by hand. */
  skillIds: string[]
}

export function defaultTemplateSide(templateId: string): TemplateSide {
  const template = findWarbandTemplate(templateId)
  const unit = template?.heroTemplates[0] ?? template?.henchmanTemplates[0]
  return { templateId, unitId: unit?.id ?? '', itemIds: unit ? defaultKitFor(template!, unit) : [], skillIds: [] }
}

/** A sensible starting kit: the list's dagger and its first hand weapon. */
export function defaultKitFor(template: WarbandTemplate, unit: UnitTemplate): string[] {
  const options = equipmentOptionsFor(template, unit.id)
  const ids: string[] = []
  const dagger = options.find((o) => o.item?.id === 'dagger')
  if (dagger?.item) ids.push(dagger.item.id)
  const weapon = options.find((o) => o.section === 'melee' && o.item && o.item.id !== 'dagger')
  if (weapon?.item) ids.push(weapon.item.id)
  return ids
}

export function unitsOf(template: WarbandTemplate): { unit: UnitTemplate; role: 'hero' | 'henchman' }[] {
  return [...template.heroTemplates.map((unit) => ({ unit, role: 'hero' as const })), ...template.henchmanTemplates.map((unit) => ({ unit, role: 'henchman' as const }))]
}

export function kitOptionsFor(side: TemplateSide): EquipmentOption[] {
  const template = findWarbandTemplate(side.templateId)
  if (!template || !side.unitId) return []
  try {
    return equipmentOptionsFor(template, side.unitId).filter((o) => o.item !== undefined)
  } catch {
    return []
  }
}

/** A published unit type as a combatant, with the kit and skills picked for it. */
export function combatantFromTemplate(side: TemplateSide, name?: string): Combatant | null {
  const template = findWarbandTemplate(side.templateId)
  const unit = template ? findUnitTemplate(template, side.unitId) : undefined
  if (!template || !unit) return null
  const stats: Stats = unitStartingStats(unit)
  const equipment: RosterItem[] = side.itemIds.map((itemId) => ({ itemId, quantity: 1 }))
  const race = unitRules(unit.id).excludeRaceTraits ? [] : template.raceTraits
  const traits = [...new Set([...race, ...traitsFromSkills(side.skillIds), ...(unitRules(unit.id).naturalWeapons ? ['natural_weapons'] : []), ...(unit.traitIds ?? []), ...traitsFromRules(unit.specialRules), ...kindTraits(template.id, unit.id, unit.specialRules, unit.role === 'hero')])]
  return {
    id: `template:${template.id}:${unit.id}`,
    unitTemplateId: unit.id,
    isAnimal: unitRules(unit.id).isAnimal,
    kind: unit.role === 'hero' ? 'hero' : 'henchman',
    name: name ?? unit.name.replace(/s$/, ''),
    typeName: `${unit.name} (${template.name})`,
    warbandId: 'template',
    warbandName: template.name,
    stats,
    equipment,
    unarmedProfile: unitRules(unit.id).unarmedProfile,
    skillIds: side.skillIds,
    skillTableIds: unit.skillTableIds,
    traitIds: traits,
    out: false,
    woundsLost: 0,
    ...(unit.role === 'henchman' ? { groupSize: 1 } : {}),
  }
}

/** Resolve an equipment-list name to an item id for the kit picker. */
export function itemIdOf(option: EquipmentOption): string | null {
  return option.item?.id ?? resolveEquipmentName(option.name)?.id ?? null
}

// ---- Analysers ----

export interface AnalyserInput {
  attacker: Combatant
  attackerKit: Loadout
  defender: Combatant
  defenderKit: Loadout
  phase: WeaponKind
  /** The weapons the attacker uses this phase, in order. */
  weapons: Weapon[]
  context: CombatContext
  houseRules: CampaignHouseRules
}

/** The opponent's representative weapon when they hit back. */
export function opponentWeapon(kit: Loadout, phase: WeaponKind, fallback: Weapon): Weapon {
  const list = phase === 'melee' ? kit.melee : kit.ranged
  // A dagger is a last resort; a warrior with anything better hits back with that.
  return list.find((w) => w.id !== 'dagger') ?? list[0] ?? fallback
}

export interface StatGainRowView {
  stat: keyof Stats
  modeled: boolean
  relevant: { offensive: boolean; defensive: boolean }
  attackGain: number
  defendGain: number
  /** The whole chain with this characteristic raised, so a table can show every metric at once. */
  attack: StatGainBreakdown["rows"][number]["attack"]
  defend: StatGainBreakdown["rows"][number]["defend"]
}

export function statGains(input: AnalyserInput, metric: ChainMetric, fallbackWeapon: Weapon): { breakdown: StatGainBreakdown; rows: StatGainRowView[] } {
  const character = toCharacter(input.attacker, input.attackerKit)
  const defender = toDefender(input.defender, input.defenderKit)
  const breakdown = computeStatGainBreakdown({
    character,
    weapons: input.weapons,
    defender,
    opponentWeapon: opponentWeapon(input.defenderKit, input.phase, fallbackWeapon),
    opponentS: input.defender.stats.S,
    opponentBS: input.defender.stats.BS,
    opponentA: input.defender.stats.A,
    context: input.context,
    houseRules: { strengthArmourPiercing: input.houseRules.strengthArmourPiercing, opposedParryWS: input.houseRules.opposedParryWS },
    phase: input.phase,
  })
  const rows: StatGainRowView[] = breakdown.rows.map((r) => ({
    stat: r.stat,
    modeled: r.modeled,
    relevant: statRelevance(r.stat, input.phase, input.weapons),
    attackGain: attackGain(breakdown.baselineAttack, r.attack, metric),
    defendGain: defendGain(breakdown.baselineDefend, r.defend, metric),
    attack: r.attack,
    defend: r.defend,
  }))
  return { breakdown, rows }
}

export function skillGains(input: AnalyserInput, role: 'offensive' | 'defensive', fallbackWeapon: Weapon, respectTables: boolean): SkillSensitivityResult {
  const character = toCharacter(input.attacker, input.attackerKit)
  const opponentCharacter = toCharacter(input.defender, input.defenderKit)
  const oppWeapons = [...input.defenderKit.melee, ...input.defenderKit.ranged]
  return computeSkillSensitivity({
    character,
    weapons: input.weapons,
    opponentWS: input.defender.stats.WS,
    opponentT: input.defender.stats.T,
    opponentScenario: characterToOpponentScenario(opponentCharacter, oppWeapons),
    opponentWeapon: opponentWeapon(input.defenderKit, input.phase, fallbackWeapon),
    category: categoryFor(role, input.phase),
    context: input.context,
    houseRules: { strengthArmourPiercing: input.houseRules.strengthArmourPiercing, opposedParryWS: input.houseRules.opposedParryWS },
    respectSkillTables: respectTables,
  })
}

/** Percentage points, signed, one decimal. */
export function pts(x: number): string {
  const v = x * 100
  if (Math.abs(v) < 0.05) return '0.0'
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}`
}

// Who can attack whom: every model on the table as the calculator sees it, and the pure mapping
// from a roster warrior's kit to the probability engine's weapons, armour and traits. No React,
// no network; unit-tested in node.

import { findItem } from '../../../rules/data/items'
import { findHiredSword } from '../../../rules/data/campaign/hiredSwords'
import { findUnitTemplate } from '../../../rules/data/warbandTemplates'
import { findWeapon } from '../../../rules/data/weapons'
import type { BattleLiveState } from '../../../domain'
import type { Armour, NamedRule, Stats, WarbandTemplate, Weapon } from '../../../rules/types'
import type { RosterHero, RosterHiredSword, RosterItem, RosterWarband } from '../../../rules/types/roster'
import { unitTypeName } from '../../roster/shared/names'
import { hiredSwordName } from '../../roster/view/lookups'
import { fightingGroups, groupOut, isHeroOut, perModelKit, splitWarriors } from '../battle/sheet'

export type CombatantKind = 'hero' | 'hiredSword' | 'henchman'

/** One model that can be picked as attacker or target. A henchman group is one model of the group. */
export interface Combatant {
  /** heroes.id or henchman_groups.id: what the battle sheet tallies against. */
  id: string
  kind: CombatantKind
  name: string
  typeName: string
  warbandId: string
  warbandName: string
  stats: Stats
  /** Per-model kit (a group's totals divided by its size where that divides evenly). */
  equipment: RosterItem[]
  skillIds: string[]
  traitIds: string[]
  /** Already out of action according to the live sheet. */
  out: boolean
  /** Group size, for the label; undefined for single warriors. */
  groupSize?: number
}

// ---------------------------------------------------------------------------------------------
// Traits: race and unit traits already in the data, plus special rules whose name says it all
// ---------------------------------------------------------------------------------------------

/** Special-rule headings that map to a modelled trait. Matched on the rule name only, never the text. */
const TRAIT_BY_RULE_NAME: [RegExp, string][] = [
  [/frenzy/i, 'frenzy'],
  [/\bhatred\b|^hates?\b/i, 'hatred'],
  [/^large( target)?$/i, 'large_target'],
  [/no pain/i, 'no_pain'],
  [/hard to kill/i, 'hard_to_kill'],
  [/hard head/i, 'hard_head'],
  [/immune to poison/i, 'immune_to_poison'],
  [/undead construct/i, 'undead_construct'],
  [/^pit fighter$/i, 'pit_fighter'],
  [/wight blades?/i, 'wight_blades_5plus'],
]

export function traitsFromRules(rules: readonly NamedRule[]): string[] {
  const out: string[] = []
  for (const rule of rules) {
    for (const [re, id] of TRAIT_BY_RULE_NAME) if (re.test(rule.name.trim()) && !out.includes(id)) out.push(id)
  }
  return out
}

function unique(ids: string[]): string[] {
  return ids.filter((id, i) => ids.indexOf(id) === i)
}

function warriorTraits(warrior: RosterHero | RosterHiredSword, rules: readonly NamedRule[], base: string[], isLarge: boolean | undefined): string[] {
  const ids = [...base, ...traitsFromRules(rules)]
  if (warrior.flags.frenzy) ids.push('frenzy')
  if (warrior.flags.hates) ids.push('hatred')
  if (isLarge) ids.push('large_target')
  return unique(ids)
}

// ---------------------------------------------------------------------------------------------
// Combatants of one warband
// ---------------------------------------------------------------------------------------------

export function combatantsOf(roster: RosterWarband, template: WarbandTemplate | undefined, warbandName: string, sheet: BattleLiveState | undefined): Combatant[] {
  const race = template?.raceTraits ?? []
  const out: Combatant[] = []
  const warriors = splitWarriors(roster)
  for (const entry of warriors.fighting) {
    if (entry.role === 'hero') {
      const { warrior } = entry
      const unit = template ? findUnitTemplate(template, warrior.unitTemplateId) : undefined
      out.push({
        id: warrior.id,
        kind: 'hero',
        name: warrior.name,
        typeName: unitTypeName(template?.id ?? roster.warbandTemplateId, warrior.unitTemplateId),
        warbandId: roster.id,
        warbandName,
        stats: warrior.stats,
        equipment: warrior.equipment,
        skillIds: warrior.skillIds,
        traitIds: warriorTraits(warrior, unit?.specialRules ?? [], [...race, ...(unit?.traitIds ?? [])], entry.warrior.isLarge),
        out: sheet ? isHeroOut(sheet, warrior.id) : false,
      })
    } else {
      const { warrior } = entry
      const detail = findHiredSword(warrior.hiredSwordId)?.detail
      out.push({
        id: warrior.id,
        kind: 'hiredSword',
        name: warrior.name,
        typeName: hiredSwordName(warrior.hiredSwordId),
        warbandId: roster.id,
        warbandName,
        stats: warrior.stats,
        equipment: warrior.equipment,
        skillIds: warrior.skillIds,
        // Hired swords are not members of the warband, so its racial rules do not apply to them.
        traitIds: warriorTraits(warrior, detail?.specialRules ?? [], [], undefined),
        out: sheet ? isHeroOut(sheet, warrior.id) : false,
      })
    }
  }
  for (const group of fightingGroups(roster)) {
    const unit = template ? findUnitTemplate(template, group.unitTemplateId) : undefined
    const kit = perModelKit(group.equipment, group.size)
    const traits = [...race, ...(unit?.traitIds ?? []), ...traitsFromRules(unit?.specialRules ?? [])]
    if (group.isLarge) traits.push('large_target')
    out.push({
      id: group.id,
      kind: 'henchman',
      name: group.name,
      typeName: unitTypeName(template?.id ?? roster.warbandTemplateId, group.unitTemplateId),
      warbandId: roster.id,
      warbandName,
      stats: group.stats,
      equipment: kit.items,
      skillIds: [],
      traitIds: unique(traits),
      out: sheet ? groupOut(sheet, group.id) >= group.size : false,
      groupSize: group.size,
    })
  }
  return out
}

/** "Watchmen (one of 3)" for a group, the warrior's name otherwise. */
export function combatantLabel(c: Combatant): string {
  if (c.kind === 'henchman') return `${c.name} (one of ${c.groupSize ?? 1})`
  return c.name
}

// ---------------------------------------------------------------------------------------------
// Kit -> engine weapons and armour
// ---------------------------------------------------------------------------------------------

export interface Loadout {
  /** Every melee weapon carried, one entry per weapon (a pair sold as one item is one entry). */
  melee: Weapon[]
  ranged: Weapon[]
  armour: Armour
  helmet: boolean
  wardSaveThreshold: number | null
  /** Carried items the engine cannot model, by display name. */
  ignored: string[]
  /** Judgement calls made while mapping, in plain words. */
  assumptions: string[]
}

const LIGHT_ARMOUR = ['light_armour', 'toughened_leathers']
const HEAVY_ARMOUR = ['heavy_armour', 'ithilmar_armour']
const GROMRIL_ARMOUR = ['gromril_armour', 'chaos_armour', 'lamellar_armour', 'masterwork_heavy_armour']
const HELMETS = ['helmet', 'cooking_pot_helmet']
const ARMOUR_RANK: Record<Armour['type'], number> = { none: 0, light: 1, heavy: 2, gromril: 3 }

/** Base weapons a "Gromril weapon" / "Ithilmar weapon" item can be, in the order the note is searched. */
const MATERIAL_BASES = ['double_handed_sword', 'morning_star', 'dagger', 'sword', 'axe', 'mace', 'club', 'hammer', 'spear', 'halberd', 'flail']

function materialWeapon(prefix: 'gromril' | 'ithilmar', item: RosterItem, assumptions: string[]): Weapon | undefined {
  const note = (item.notes ?? '').toLowerCase().replace(/[^a-z]/g, '_')
  const base = MATERIAL_BASES.find((id) => note.includes(id.replace('double_handed_sword', 'double_handed'))) ?? 'sword'
  const weapon = findWeapon(`${prefix}_${base}`)
  if (weapon && !item.notes) assumptions.push(`${weapon.name} assumed for the ${prefix} weapon: note the base weapon on the item to change it.`)
  return weapon
}

export const FIST: Weapon = findWeapon('unarmed') ?? { id: 'unarmed', name: 'Fist', type: 'melee', strength: 'user', strengthBonus: -1, critCategory: 'unarmed', concussion: false, saveModifier: -1, maxAttacks: 1, special: [], rangedProfile: null }

export function loadoutOf(equipment: readonly RosterItem[]): Loadout {
  const out: Loadout = { melee: [], ranged: [], armour: { type: 'none', shield: false, buckler: false }, helmet: false, wardSaveThreshold: null, ignored: [], assumptions: [] }
  for (const entry of equipment) {
    if (!entry.itemId) {
      out.ignored.push(entry.customName ?? 'Unnamed item')
      continue
    }
    const item = findItem(entry.itemId)
    if (!item) {
      out.ignored.push(entry.itemId)
      continue
    }
    let weapon = item.weaponId ? findWeapon(item.weaponId) : undefined
    if (!weapon && item.id === 'gromril_weapon') weapon = materialWeapon('gromril', entry, out.assumptions)
    if (!weapon && item.id === 'ithilmar_weapon') weapon = materialWeapon('ithilmar', entry, out.assumptions)
    if (weapon) {
      // Two of the same hand weapon is a real loadout (two swords); more than two never fight at once.
      const copies = weapon.type === 'melee' && !weapon.paired ? Math.min(2, Math.max(1, entry.quantity)) : 1
      for (let i = 0; i < copies; i++) (weapon.type === 'melee' ? out.melee : out.ranged).push(weapon)
      continue
    }
    if (item.category === 'armour' || item.id === 'enchanted_skins') {
      applyArmourItem(item.id, item.armourSave, item.name, out)
      continue
    }
    if (item.category === 'melee' || item.category === 'missile' || item.category === 'blackpowder') out.ignored.push(item.name)
    // Miscellaneous gear and animals have no place in a single attack roll; they are left out quietly.
  }
  return out
}

function applyArmourItem(id: string, save: number | undefined, name: string, out: Loadout): void {
  if (id === 'shield') {
    out.armour.shield = true
    return
  }
  if (id === 'kite_shield') {
    out.armour.kiteShield = true
    out.assumptions.push('Kite shield: 5+ alone or +2 to armour on foot; the mounted 6+ is not modelled.')
    return
  }
  if (id === 'pavise') {
    out.armour.pavise = true
    return
  }
  if (id === 'buckler') {
    out.armour.buckler = true
    return
  }
  if (HELMETS.includes(id)) {
    out.helmet = true
    if (id !== 'helmet') out.assumptions.push(`${name} counted as a helmet (4+ to shrug off a stun).`)
    return
  }
  if (id === 'enchanted_skins') {
    out.wardSaveThreshold = 6
    return
  }
  let type: Armour['type'] | null = null
  if (LIGHT_ARMOUR.includes(id)) type = 'light'
  else if (HEAVY_ARMOUR.includes(id)) type = 'heavy'
  else if (GROMRIL_ARMOUR.includes(id)) type = 'gromril'
  else if (save === 6) type = 'light'
  else if (save === 5) type = 'heavy'
  else if (save === 4) type = 'gromril'
  if (type === null) {
    out.ignored.push(name)
    return
  }
  if (ARMOUR_RANK[type] > ARMOUR_RANK[out.armour.type]) out.armour.type = type
  if (!['light_armour', 'heavy_armour', 'gromril_armour'].includes(id)) out.assumptions.push(`${name} counted as ${type} armour (${type === 'light' ? '6' : type === 'heavy' ? '5' : '4'}+ save).`)
}

// ---------------------------------------------------------------------------------------------
// Which weapons can be used together
// ---------------------------------------------------------------------------------------------

/** Needs both hands, or is sold as a pair: nothing goes in the other hand. */
export function isTwoHanded(weapon: Weapon): boolean {
  return weapon.special.includes('twoHanded') || weapon.special.includes('cumbersomeNoOtherWeapons') || Boolean(weapon.paired)
}

/** Can this weapon be the off-hand weapon (the "one extra attack" of fighting with two weapons)? */
export function canBeOffHand(weapon: Weapon): boolean {
  if (isTwoHanded(weapon)) return false
  if (weapon.special.includes('difficultToUseOffHand') || weapon.special.includes('unwieldyOffHandOnly')) return false
  return true
}

/** A spear ("unwieldy") only shares hands with a shield or buckler; the same list keeps two-handers alone. */
export function takesOffHand(primary: Weapon): boolean {
  return !isTwoHanded(primary) && !primary.special.includes('unwieldyOffHandOnly') && primary.id !== 'unarmed'
}

/** Weapons carried that could fill the other hand next to `primary` (the primary's own entry excluded once). */
export function offHandCandidates(melee: readonly Weapon[], primary: Weapon): Weapon[] {
  if (!takesOffHand(primary)) return []
  let skipped = false
  return melee.filter((w) => {
    if (!skipped && w === primary) {
      skipped = true
      return false
    }
    return canBeOffHand(w)
  })
}

/** The primary a player would reach for: the biggest Strength bonus, then anything but a dagger, then a sword. */
export function defaultPrimary(melee: readonly Weapon[]): Weapon {
  if (melee.length === 0) return FIST
  const score = (w: Weapon) => (w.strengthBonus ?? 0) * 10 + (w.id === 'dagger' ? -5 : 0) + (w.parry ? 1 : 0)
  return [...melee].sort((a, b) => score(b) - score(a))[0]
}

/** Default off-hand: the first candidate (a dagger for most warriors). */
export function defaultOffHand(melee: readonly Weapon[], primary: Weapon): Weapon | null {
  return offHandCandidates(melee, primary)[0] ?? null
}

// Who can attack whom: every model on the table as the calculator sees it, and the pure mapping
// from a roster warrior's kit to the probability engine's weapons, armour and traits. No React,
// no network; unit-tested in node.

import { unitRules } from '../../../rules/data/campaignRules'
import { findItem } from '../../../rules/data/items'
import { findHiredSword } from '../../../rules/data/campaign/hiredSwords'
import { findUnitTemplate } from '../../../rules/data/warbandTemplates'
import { WEAPONS, findWeapon } from '../../../rules/data/weapons'
import { armourClass } from '../../../rules/data/items/classify'
import { itemEffect, type ItemEffect, type PreBattleEffect, warbandInAny } from '../../../rules/data/itemRules'
import type { Item } from '../../../rules/types/items'
import type { BattleLiveState } from '../../../domain'
import type { Armour, NamedRule, Stats, WarbandTemplate, Weapon } from '../../../rules/types'
import type { RosterHero, RosterHiredSword, RosterItem, RosterWarband } from '../../../rules/types/roster'
import { unitTypeName } from '../../roster/shared/names'
import { hiredSwordName } from '../../roster/view/lookups'
import { animalsFighting, fightingGroups, groupOut, isHeroOut, perModelKit, splitWarriors, woundsLost } from '../battle/sheet'

export type CombatantKind = 'hero' | 'hiredSword' | 'henchman' | 'animal'

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
  /** Wounds lost so far according to the live sheet (multi-Wound models). */
  woundsLost: number
  /** Group size, for the label; undefined for single warriors. */
  groupSize?: number
  /** Animals fight with fixed engine weapons rather than roster kit. */
  weaponIds?: string[]
  /** The hero an animal belongs to. */
  holderName?: string
  /** Skill lists the warrior may pick advances from (heroes and template units), for the skill analyser. */
  skillTableIds?: string[]
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
  if (warrior.flags.nurglesRot) ids.push('nurgles_rot')
  if (isLarge) ids.push('large_target')
  return unique(ids)
}

/**
 * Creature-kind traits that weapons and items key off (Sigmarite Warhammer, Silver-tip Stake, Blessed
 * Water): read from the warband and the unit type. Living members of an Undead list (Dregs) are not
 * undead; the campaign rules overlay marks those units as excluding race traits.
 */
export function kindTraits(warbandTemplateId: string, unitTemplateId: string, unitRulesText: readonly NamedRule[]): string[] {
  const out: string[] = []
  const rulesSay = (re: RegExp) => unitRulesText.some((r) => re.test(r.name) || re.test(r.text.slice(0, 160)))
  if (/vampire|necrarch|strigoi/i.test(unitTemplateId) || rulesSay(/^vampire/i)) out.push('vampire', 'undead')
  if (warbandInAny(warbandTemplateId, ['undead']) && (rulesSay(/no pain|undead|may not run/i) || /zombie|ghoul|skeleton|wight|wolf|bat|liche|tomb|grave_guard|mummy/i.test(unitTemplateId))) out.push('undead')
  if (warbandInAny(warbandTemplateId, ['possessed']) && /possessed|mutant|daemon|nurgling|plague_bearer|tainted|brute|plague_cart/i.test(unitTemplateId)) out.push('possessed')
  return unique(out)
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
      const raceFor = unitRules(warrior.unitTemplateId).excludeRaceTraits ? [] : race
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
        skillTableIds: warrior.skillTableIds,
        traitIds: warriorTraits(warrior, unit?.specialRules ?? [], [...raceFor, ...(unit?.traitIds ?? []), ...kindTraits(roster.warbandTemplateId, warrior.unitTemplateId, unit?.specialRules ?? [])], entry.warrior.isLarge),
        out: sheet ? isHeroOut(sheet, warrior.id) : false,
        woundsLost: sheet ? woundsLost(sheet, warrior.id) : 0,
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
        woundsLost: sheet ? woundsLost(sheet, warrior.id) : 0,
      })
    }
  }
  for (const group of fightingGroups(roster)) {
    const unit = template ? findUnitTemplate(template, group.unitTemplateId) : undefined
    const kit = perModelKit(group.equipment, group.size)
    const traits = [...race, ...(unit?.traitIds ?? []), ...traitsFromRules(unit?.specialRules ?? []), ...kindTraits(roster.warbandTemplateId, group.unitTemplateId, unit?.specialRules ?? [])]
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
      woundsLost: sheet && group.size === 1 ? woundsLost(sheet, group.id) : 0,
      groupSize: group.size,
    })
  }
  for (const animal of animalsFighting(roster)) {
    out.push({
      id: animal.id,
      kind: 'animal',
      name: animal.name,
      typeName: `${animal.kind.name} (${animal.holderName}'s)`,
      warbandId: roster.id,
      warbandName,
      stats: animal.kind.stats,
      equipment: [],
      weaponIds: animal.kind.weaponIds,
      holderName: animal.holderName,
      skillIds: [],
      traitIds: [],
      out: sheet ? isHeroOut(sheet, animal.id) : false,
      woundsLost: 0,
    })
  }
  return out
}

/** "Watchmen (one of 3)" for a group, "Wardog (Ulrich's)" for an animal, the warrior's name otherwise. */
export function combatantLabel(c: Combatant): string {
  if (c.kind === 'henchman') return `${c.name} (one of ${c.groupSize ?? 1})`
  if (c.kind === 'animal') return `${c.name} (${c.holderName ?? 'animal'}'s)`
  return c.name
}

/** The kit the calculator uses for a combatant: an animal's fixed weapons, or a warrior's roster kit. */
export function loadoutFor(c: Combatant): Loadout {
  if (c.weaponIds) return loadoutOfWeapons(c.weaponIds)
  return loadoutOf(c.equipment)
}

/** A loadout from engine weapon ids alone (animals). */
export function loadoutOfWeapons(ids: readonly string[]): Loadout {
  const out = emptyLoadout()
  for (const id of ids) {
    const weapon = findWeapon(id)
    if (!weapon) continue
    ;(weapon.type === 'melee' ? out.melee : out.ranged).push(weapon)
  }
  return out
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
  /** Special save against missiles only (Amulet of the Moon, Shield of Sigmar). */
  missileWardSaveThreshold: number | null
  /** Modifier to enemy to-hit rolls by phase (cloaks, amulets; a Ball and Chain). */
  toBeHit: { melee: number; missile: number }
  /** Bonus to the armour save by phase (Wolfcloak, Silk Armour). */
  saveBonus: { melee: number; missile: number; savesFromNothing: boolean }
  /** A save of the kit's own, by phase (Sea Dragon Cloak). */
  ownSave: { melee: number; missile: number } | null
  /** Unmodified save after any failed save (Peg Leg). */
  afterSaveThreshold: number | null
  /** A stun save replacing the helmet's (Cooking Pot Helmet). */
  stunSave: { threshold: number; unmodifiable: boolean } | null
  /** Discard the first hit of the battle on this roll (Lucky Charm). */
  firstHitDiscard: number | null
  /** Traits granted by kit (Frenzy from a necklace, Hatred from the Hammer of Witches, Immune to Poison from a ring). */
  traitIds: string[]
  /** Skills granted by kit (Dodge from a Lookout-Gnoblar). */
  skillIds: string[]
  /** Consumables carried that may be marked as used before or during the battle. */
  consumables: { itemId: string; name: string; effect: PreBattleEffect }[]
  /** Carried items the engine cannot model, by display name. */
  ignored: string[]
  /** Judgement calls made while mapping, in plain words. */
  assumptions: string[]
}

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

/** The base weapon an upgrade item (Dark Elf Blade, Darksteel Blade, Hashut obsidian) is applied to, from the item's note. */
export function upgradeBaseFromNote(notes: string | undefined, bases: string[] | 'anyMelee'): string | null {
  const note = (notes ?? '').toLowerCase()
  if (!note) return null
  const candidates = bases === 'anyMelee' ? WEAPONS.filter((w) => w.type === 'melee').map((w) => w.id) : bases
  const match = /base:\s*([a-z_ ]+)/.exec(note)?.[1]?.trim().replace(/\s+/g, '_')
  if (match && candidates.includes(match)) return match
  // Any melee weapon name mentioned in the note.
  const hit = [...candidates].sort((a, b) => b.length - a.length).find((id) => note.replace(/[^a-z]/g, '_').includes(id) || note.includes(findWeapon(id)?.name.toLowerCase() ?? '\u0000'))
  return hit ?? null
}

function upgradedWeapon(item: RosterItem, catalogueName: string, upgrade: NonNullable<ItemEffect['upgrade']>, assumptions: string[]): Weapon | undefined {
  const baseId = upgradeBaseFromNote(item.notes, upgrade.bases) ?? (upgrade.bases === 'anyMelee' ? 'sword' : upgrade.bases[0])
  const base = findWeapon(baseId)
  if (!base) return undefined
  if (!upgradeBaseFromNote(item.notes, upgrade.bases)) assumptions.push(`${catalogueName}: ${base.name} assumed as the base weapon; note the base on the item to change it.`)
  return { ...base, ...upgrade.apply, id: `${item.itemId}:${base.id}`, name: `${upgrade.namePrefix} ${base.name}`, special: [...base.special, 'upgraded'] }
}

export const FIST: Weapon = findWeapon('unarmed') ?? { id: 'unarmed', name: 'Fist', type: 'melee', strength: 'user', strengthBonus: -1, critCategory: 'unarmed', concussion: false, saveModifier: -1, maxAttacks: 1, special: [], rangedProfile: null }

const SWIVEL_GUN_AMMUNITION = ['swivel_gun_ball_shot', 'swivel_gun_chain_shot', 'swivel_gun_grape_shot']

export function emptyLoadout(): Loadout {
  return {
    melee: [],
    ranged: [],
    armour: { type: 'none', shield: false, buckler: false },
    helmet: false,
    wardSaveThreshold: null,
    missileWardSaveThreshold: null,
    toBeHit: { melee: 0, missile: 0 },
    saveBonus: { melee: 0, missile: 0, savesFromNothing: false },
    ownSave: null,
    afterSaveThreshold: null,
    stunSave: null,
    firstHitDiscard: null,
    traitIds: [],
    skillIds: [],
    consumables: [],
    ignored: [],
    assumptions: [],
  }
}

export function loadoutOf(equipment: readonly RosterItem[]): Loadout {
  const out = emptyLoadout()
  let toughenedLeathers = false
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
    const effect = itemEffect(item.id)
    if (item.id === 'toughened_leathers') toughenedLeathers = true

    // ---- Weapons ----
    let weapon = item.weaponId ? findWeapon(item.weaponId) : undefined
    if (effect?.upgrade) weapon = upgradedWeapon(entry, item.name, effect.upgrade, out.assumptions)
    if (!weapon && item.id === 'gromril_weapon') weapon = materialWeapon('gromril', entry, out.assumptions)
    if (!weapon && item.id === 'ithilmar_weapon') weapon = materialWeapon('ithilmar', entry, out.assumptions)
    if (item.id === 'swivel_gun') {
      for (const id of SWIVEL_GUN_AMMUNITION) {
        const shot = findWeapon(id)
        if (shot) out.ranged.push(shot)
      }
      out.assumptions.push('Swivel Gun: pick the shot type from the weapon list; each type is a one-battle supply.')
      continue
    }
    if (weapon) {
      // Two of the same hand weapon is a real loadout (two swords); more than two never fight at once.
      const copies = weapon.type === 'melee' && !weapon.paired ? Math.min(2, Math.max(1, entry.quantity)) : 1
      for (let i = 0; i < copies; i++) (weapon.type === 'melee' ? out.melee : out.ranged).push(weapon)
      continue
    }

    // ---- Armour ----
    if (item.category === 'armour' || item.id === 'enchanted_skins') {
      applyArmourItem(item, out)
      if (effect) applyEffect(item, effect, out)
      continue
    }

    // ---- Everything else the rules overlay knows about ----
    if (effect) {
      applyEffect(item, effect, out)
      continue
    }
    if (item.category === 'melee' || item.category === 'missile' || item.category === 'blackpowder') out.ignored.push(item.name)
    // Remaining miscellaneous gear and animals have no place in a single attack roll; they are left out quietly.
  }
  if (toughenedLeathers && (out.armour.shield || out.armour.kiteShield)) {
    out.armour.shield = false
    out.armour.kiteShield = false
    out.assumptions.push('Toughened Leathers cannot be combined with a shield: the shield is left out of the save.')
  }
  return out
}

function applyEffect(item: Item, effect: ItemEffect, out: Loadout): void {
  for (const t of effect.traits ?? []) if (!out.traitIds.includes(t)) out.traitIds.push(t)
  for (const s of effect.skills ?? []) if (!out.skillIds.includes(s)) out.skillIds.push(s)
  if (effect.wardSave !== undefined) out.wardSaveThreshold = out.wardSaveThreshold === null ? effect.wardSave : Math.min(out.wardSaveThreshold, effect.wardSave)
  if (effect.missileWardSave !== undefined) out.missileWardSaveThreshold = out.missileWardSaveThreshold === null ? effect.missileWardSave : Math.min(out.missileWardSaveThreshold, effect.missileWardSave)
  if (effect.toBeHit) {
    out.toBeHit.melee += effect.toBeHit.melee ?? 0
    out.toBeHit.missile += effect.toBeHit.missile ?? 0
  }
  if (effect.saveBonus) {
    out.saveBonus.melee += effect.saveBonus.melee ?? 0
    out.saveBonus.missile += effect.saveBonus.missile ?? 0
    if (effect.saveBonus.savesFromNothing) out.saveBonus.savesFromNothing = true
    if (effect.saveBonus.note) out.assumptions.push(`${item.name}: ${effect.saveBonus.note}; counted as if the condition holds.`)
  }
  if (effect.ownSave) out.ownSave = out.ownSave ? { melee: Math.min(out.ownSave.melee, effect.ownSave.melee), missile: Math.min(out.ownSave.missile, effect.ownSave.missile) } : { ...effect.ownSave }
  if (effect.afterSave !== undefined) out.afterSaveThreshold = out.afterSaveThreshold === null ? effect.afterSave : Math.min(out.afterSaveThreshold, effect.afterSave)
  if (effect.firstHitDiscard !== undefined) out.firstHitDiscard = out.firstHitDiscard === null ? effect.firstHitDiscard : Math.min(out.firstHitDiscard, effect.firstHitDiscard)
  if (effect.extraWeaponId) {
    const extra = findWeapon(effect.extraWeaponId)
    if (extra) (extra.type === 'melee' ? out.melee : out.ranged).push(extra)
  }
  if (effect.preBattle) out.consumables.push({ itemId: item.id, name: item.name, effect: effect.preBattle })
  if (effect.note && !effect.preBattle && !effect.upgrade) out.assumptions.push(effect.note)
}

function applyArmourItem(item: Item, out: Loadout): void {
  const cls = armourClass(item)
  switch (cls) {
    case 'shield':
      out.armour.shield = true
      return
    case 'kiteShield':
      out.armour.kiteShield = true
      out.assumptions.push('Kite shield: 5+ alone or +2 to armour on foot; the mounted 6+ is not modelled.')
      return
    case 'pavise':
      out.armour.pavise = true
      return
    case 'buckler':
      out.armour.buckler = true
      return
    case 'helmet':
      if (item.id === 'cooking_pot_helmet') {
        out.stunSave = { threshold: 5, unmodifiable: true }
        out.assumptions.push('Cooking Pot Helmet: a 5+ save against being stunned that is never modified.')
      } else {
        out.helmet = true
        if (item.id !== 'helmet') out.assumptions.push(`${item.name} counted as a helmet (4+ to shrug off a stun).`)
      }
      return
    case 'ward':
      out.wardSaveThreshold = out.wardSaveThreshold === null ? 6 : Math.min(out.wardSaveThreshold, 6)
      return
    case 'none':
      out.ignored.push(item.name)
      return
    default: {
      if (ARMOUR_RANK[cls] > ARMOUR_RANK[out.armour.type]) out.armour.type = cls
      if (!['light_armour', 'heavy_armour', 'gromril_armour'].includes(item.id)) out.assumptions.push(`${item.name} counted as ${cls} armour (${cls === 'light' ? '6' : cls === 'heavy' ? '5' : '4'}+ save).`)
    }
  }
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

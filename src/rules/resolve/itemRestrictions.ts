import { equipmentListWarning } from "./equipmentLists";
// Who may buy or carry an item (audit A1), how many, when, and whether it may be moved or sold
// (A13). Everything here is a warning: the shop shows it and lets the player override with a
// reason, the roster lists it as a problem, and nothing is silently blocked. Data in
// data/itemRules/restrictions.ts; the two-hand-weapons and two-missile-weapons caps are the
// rulebook's own (Trading: "a warrior may carry two hand weapons and two missile weapons; a brace
// of pistols counts as one").

import { countsAsHandWeapon, countsAsMissileWeapon } from "../data/items/classify";
import { findItem } from "../data/items";
import { describeWarbandRefs, itemRestriction, warbandInAny } from "../data/itemRules";
import type { Item } from "../types/items";
import type { CampaignBans, RosterItem, RosterWarband, WarriorFlags } from "../types/roster";
import { POSSESSED_ALLOWED_ITEM_IDS } from "../data/campaign/rewards";
import { isBanned } from "./houseRules";
import { equipmentBanReason } from "./roster";

export type HolderKind = "hero" | "henchmanGroup" | "hiredSword" | "stash";

/** The warrior (or stash) an item is going to or already on. */
export interface ItemHolder {
  kind: HolderKind;
  id?: string;
  name?: string;
  unitTemplateId?: string;
  /** A henchman group's equipment is the group's total; its size turns that into one model's kit. */
  size?: number;
  equipment: readonly RosterItem[];
  /** A hero's or hired sword's persistent conditions (Severe Arm Wound, Possessed, ...). */
  flags?: WarriorFlags;
}

/** One model's share of a group's kit (a hero's kit is already one model's). */
function perModelKit(holder: ItemHolder): RosterItem[] {
  const models = holder.kind === "henchmanGroup" ? Math.max(1, holder.size ?? 1) : 1;
  if (models === 1) return [...holder.equipment];
  return holder.equipment.map((e) => ({ ...e, quantity: Math.ceil(e.quantity / models) }));
}

export interface RestrictionOptions {
  /** The warband is being created (creation-only items are allowed; Middenheim Wolfcloaks need no hunt). */
  atCreation?: boolean;
  /** How many are being added (for the caps and one-per rules). Default 1. */
  quantity?: number;
  /** The campaign's bans, when known. */
  bans?: CampaignBans;
  /** The item is already on the holder (checking a roster) rather than about to be added (checking a purchase). */
  alreadyHeld?: boolean;
}

const OUTLAW_WARBANDS = new Set(["outlaws_of_stirwood_forest", "outlaws_of_stirwood_forest_redux"]);
const OUTLAW_CLERICS = new Set(["outlaws_cleric", "cleric"]);
const BOW_IDS = new Set(["short_bow", "bow", "longbow", "elf_bow"]);

/** Required kit is checked separately so empty inventories are also covered. */
export function requiredEquipmentWarnings(warband: RosterWarband, holder: ItemHolder): string[] {
  if (!OUTLAW_WARBANDS.has(warband.warbandTemplateId) || !["hero", "henchmanGroup"].includes(holder.kind) || OUTLAW_CLERICS.has(holder.unitTemplateId ?? "")) return [];
  const models = holder.kind === "henchmanGroup" ? Math.max(1, holder.size ?? 1) : 1;
  const bows = holder.equipment.reduce((n, entry) => n + (entry.itemId && BOW_IDS.has(entry.itemId) ? entry.quantity : 0), 0);
  return bows >= models ? [] : [`${holder.name ?? "This warrior"} must carry ${models > 1 ? "a bow for each model" : "a bow"} under the Outlaws equipment rule; crossbows do not qualify. Only the Cleric may choose to go without a bow.`];
}

export const MAX_HAND_WEAPONS = 2;
export const MAX_MISSILE_WEAPONS = 2;

function countOnWarband(warband: RosterWarband, itemId: string): number {
  const count = (items: readonly RosterItem[]) => items.filter((i) => i.itemId === itemId).reduce((n, i) => n + i.quantity, 0);
  return count(warband.stash) + warband.heroes.filter((h) => h.status === "active").reduce((n, h) => n + count(h.equipment), 0) + warband.henchmenGroups.reduce((n, g) => n + count(g.equipment), 0) + warband.hiredSwords.filter((s) => s.status === "active").reduce((n, s) => n + count(s.equipment), 0);
}

/** Braces of pistols count as one missile weapon: two of a pistol are one. */
export function missileWeaponCount(equipment: readonly RosterItem[]): number {
  const totals = new Map<string, number>();
  for (const entry of equipment) {
    if (!entry.itemId || !countsAsMissileWeapon(entry.itemId)) continue;
    totals.set(entry.itemId, (totals.get(entry.itemId) ?? 0) + entry.quantity);
  }
  let count = 0;
  for (const [itemId, quantity] of totals) count += /pistol/.test(itemId) ? Math.ceil(quantity / 2) : quantity;
  return count;
}

export function handWeaponCount(equipment: readonly RosterItem[]): number {
  return equipment.filter((e) => e.itemId && countsAsHandWeapon(e.itemId)).reduce((n, e) => n + e.quantity, 0);
}

/**
 * Why `item` should not go to (or stay on) `holder`, as plain-English warnings; empty when the rules
 * have nothing to say. A henchman group's equipment is per model, so the caps read it as one model's kit.
 */
export function itemRestrictionWarnings(warband: RosterWarband, item: Item, holder: ItemHolder, opts: RestrictionOptions = {}): string[] {
  const out: string[] = [];
  const rule = itemRestriction(item.id);
  const quantity = opts.quantity ?? 1;
  const warbandId = warband.warbandTemplateId;
  const outlaw = OUTLAW_WARBANDS.has(warbandId) && ["hero", "henchmanGroup"].includes(holder.kind);

  if (outlaw && !OUTLAW_CLERICS.has(holder.unitTemplateId ?? "") && countsAsMissileWeapon(item.id) && !BOW_IDS.has(item.id)) {
    out.push(`${item.name}: Outlaws must use a bow as their only missile weapon, even with Weapons Expert.`);
  }

  if (opts.bans && isBanned(opts.bans, "items", item.id)) out.push(`${item.name} is banned in this campaign.`);

  if (holder.kind === "hero" || holder.kind === "henchmanGroup") {
    const banReason = equipmentBanReason(warbandId, holder.unitTemplateId ?? "", { itemId: item.id, quantity });
    if (banReason) out.push(`${banReason}.`);

  }

  // Powder's Expensive! is a henchman restriction, not a permanent unit/race ban:
  // promoted Bandit Heroes are explicitly allowed to acquire black powder weapons.
  if (warbandId === "hochland_bandits" && holder.kind === "henchmanGroup" && item.category === "blackpowder") {
    out.push(`${item.name}: Hochland Bandit henchmen cannot buy black powder weapons (Powder's Expensive!); only their Heroes may do so.`);
  }

  if (holder.kind === "henchmanGroup" && rule.heroesOnly) out.push(`${item.name}: miscellaneous equipment is for Heroes only; henchmen may not carry it.`);
  if (holder.kind === "hiredSword" && rule.heroesOnly) out.push(`${item.name}: hired swords keep the kit they came with and buy nothing.`);

  if (rule.onlyWarbands && !warbandInAny(warbandId, rule.onlyWarbands)) out.push(`${item.name} is for ${describeWarbandRefs(rule.onlyWarbands)} only.`);
  if (rule.notWarbands && warbandInAny(warbandId, rule.notWarbands)) out.push(`${item.name} may not be used by ${describeWarbandRefs(rule.notWarbands)}.`);
  if (rule.onlyUnits && holder.unitTemplateId && !rule.onlyUnits.includes(holder.unitTemplateId)) {
    const names = rule.onlyUnits.map((id) => id.split("_").slice(-1)[0]).join(", ");
    out.push(`${item.name} is restricted to ${rule.onlyUnits.length === 1 ? "one unit type" : "a few unit types"} (${names}) in the rules.`);
  }

  const models = holder.kind === "henchmanGroup" ? Math.max(1, holder.size ?? 1) : 1;
  const already = opts.alreadyHeld ? 0 : quantity;
  const addedPerModel = Math.ceil(already / models);
  const kit = perModelKit(holder);
  if (rule.onePerWarband && countOnWarband(warband, item.id) + already > 1) out.push(`${item.name}: a warband may have only one.`);
  if (rule.oncePerCampaign && countOnWarband(warband, item.id) + already > 1) out.push(`${item.name}: once per campaign; the warband already has one.`);
  if (rule.onePerModel && holder.kind !== "stash") {
    const held = kit.filter((e) => e.itemId === item.id).reduce((n, e) => n + e.quantity, 0);
    if (held + addedPerModel > 1) out.push(`${item.name}: one per model.`);
  }
  if (rule.creationOnly && !opts.atCreation && !opts.alreadyHeld) out.push(`${item.name} may only be bought when the warband is created.`);

  if (rule.requiresAnyOf && holder.kind !== "stash") {
    const has = holder.equipment.some((e) => e.itemId && rule.requiresAnyOf!.itemIds.includes(e.itemId));
    if (!has) out.push(`${item.name} needs ${rule.requiresAnyOf.label} to be of any use; ${holder.name ?? "this warrior"} has none.`);
  }
  if (rule.noShield && holder.kind !== "stash" && holder.equipment.some((e) => e.itemId === "shield" || e.itemId === "kite_shield")) out.push(`${item.name} cannot be combined with a shield.`);
  if ((item.id === "shield" || item.id === "kite_shield") && holder.kind !== "stash" && holder.equipment.some((e) => e.itemId === "toughened_leathers")) out.push(`A shield cannot be combined with Toughened Leathers.`);

  if (holder.flags?.singleHandedWeaponsOnly && (item.id === "shield" || item.id === "kite_shield" || item.id === "buckler")) {
    out.push(`${holder.name ?? "This warrior"}'s severe arm wound allows only a single one-handed weapon: no shield or buckler alongside it.`);
  }

  // The rulebook caps, per model.
  if (holder.kind === "hero" || holder.kind === "henchmanGroup") {
    const each = holder.kind === "henchmanGroup" ? "each of" : "";
    if (countsAsHandWeapon(item.id)) {
      const after = handWeaponCount(kit) + addedPerModel;
      const cap = holder.flags?.singleHandedWeaponsOnly ? 1 : MAX_HAND_WEAPONS;
      if (after > cap && cap === 1) out.push(`${holder.name ?? "This warrior"}'s severe arm wound allows only a single one-handed weapon: no second weapon alongside it.`);
      else if (after > cap) out.push(`${each ? `${each} ` : ""}${holder.name ?? "This warrior"} would carry ${after} hand weapons besides a dagger; the rules allow ${cap}.`);
    }
    if (countsAsMissileWeapon(item.id) && rule.countsAsMissile !== false) {
      const after = missileWeaponCount(opts.alreadyHeld ? kit : [...kit, { itemId: item.id, quantity: addedPerModel }]);
      if (outlaw && after > 1) out.push(`${holder.name ?? "This warrior"} would carry ${after} missile weapons per model; Outlaws may carry only one.`);
      else if (!outlaw && after > MAX_MISSILE_WEAPONS) out.push(`${each ? `${each} ` : ""}${holder.name ?? "This warrior"} would carry ${after} missile weapons; the rulebook allows up to two different missile weapons per warrior, a brace of pistols counting as one (Weapons and Armour, Equipment).`);
    }
  }
  const listWarning = equipmentListWarning(warband, item, holder, { atCreation: opts.atCreation });
  if (listWarning && !equipmentBanReason(warbandId, holder.unitTemplateId ?? "", { itemId: item.id, quantity })) out.push(listWarning);
  return out;
}

/** Why an item may not leave the warrior it is on (fused kit), or null. */
export function moveBlockReason(itemId: string | null, from: HolderKind): string | null {
  if (!itemId || from === "stash") return null;
  const rule = itemRestriction(itemId);
  if (!rule.fused) return null;
  const name = findItem(itemId)?.name ?? itemId;
  return `${name} stays with the warrior who has it: ${rule.note ?? "it cannot be moved or given away"}`;
}

/** Why an item cannot be sold, or null. */
export function sellBlockReason(itemId: string | null): string | null {
  if (!itemId) return null;
  const rule = itemRestriction(itemId);
  if (!rule.unsellable) return null;
  const name = findItem(itemId)?.name ?? itemId;
  return `${name} cannot be sold back${rule.note ? `: ${rule.note}` : ""}`;
}

/** Every warning across a whole roster, for the validator and the builder. */
export function rosterItemWarnings(warband: RosterWarband, opts: Pick<RestrictionOptions, "atCreation" | "bans"> = {}): { subjectId: string; message: string }[] {
  const out: { subjectId: string; message: string }[] = [];
  const check = (holder: ItemHolder & { id: string }) => {
    for (const message of requiredEquipmentWarnings(warband, holder)) out.push({ subjectId: holder.id, message });
    const seen = new Set<string>();
    for (const entry of holder.equipment) {
      if (!entry.itemId || seen.has(entry.itemId)) continue;
      seen.add(entry.itemId);
      const item = findItem(entry.itemId);
      if (!item) continue;
      for (const message of itemRestrictionWarnings(warband, item, holder, { ...opts, alreadyHeld: true, quantity: entry.quantity })) {
        // The caps are reported once per holder, not once per weapon.
        if (/would carry/.test(message) && out.some((o) => o.subjectId === holder.id && o.message === message)) continue;
        out.push({ subjectId: holder.id, message });
      }
    }
  };
  for (const hero of warband.heroes) {
    if (hero.status !== "active") continue;
    check({ kind: "hero", id: hero.id, name: hero.name, unitTemplateId: hero.unitTemplateId, equipment: hero.equipment, flags: hero.flags });
    if (hero.flags.daemonPossessed) {
      const banned = hero.equipment.filter((e) => !e.itemId || !(POSSESSED_ALLOWED_ITEM_IDS as readonly string[]).includes(e.itemId));
      if (banned.length > 0) out.push({ subjectId: hero.id, message: `${hero.name} is Possessed by a Daemon and may use no weapons or armour except Chaos Armour and Daemon weapons: ${banned.map((e) => (e.itemId ? (findItem(e.itemId)?.name ?? e.itemId) : (e.customName ?? "item"))).join(", ")} should go to the stash.` });
    }
  }
  for (const group of warband.henchmenGroups) if (group.size > 0) check({ kind: "henchmanGroup", id: group.id, name: group.name, unitTemplateId: group.unitTemplateId, size: group.size, equipment: group.equipment });
  if (opts.bans) {
    for (const entry of warband.stash) {
      if (entry.itemId && isBanned(opts.bans, "items", entry.itemId)) out.push({ subjectId: "stash", message: `${findItem(entry.itemId)?.name ?? entry.itemId} in the stash is banned in this campaign.` });
    }
  }
  return out;
}

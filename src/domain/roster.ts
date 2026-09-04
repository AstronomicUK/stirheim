// Pure mappers between persisted rows and the resolver-side roster model (src/rules/types/roster).
//
// toRosterWarband assembles one RosterWarband from the rows of a single warband; the *PatchFromRoster
// functions go the other way and return only the columns a resolver is allowed to change, ready
// for supabase.from(table).update(patch).eq("id", ...).

import type {
  RosterHenchmanGroup,
  RosterHero,
  RosterHiredSword,
  RosterItem,
  RosterWarband,
} from "../rules/types/roster";
import type { HenchmanGroupRow, HeroRow, ItemRow, WarbandRow, WarriorStatus } from "./rows";

// ---------------------------------------------------------------------------------------------
// Rows -> roster
// ---------------------------------------------------------------------------------------------

/** Empty text columns become an absent optional field on the roster side. */
function optionalText(value: string): string | undefined {
  return value === "" ? undefined : value;
}

function bySortOrder<T extends { sort_order: number; created_at: string; id: string }>(a: T, b: T): number {
  return a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id);
}

function byCreation(a: ItemRow, b: ItemRow): number {
  return a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id);
}

export function toRosterItem(item: ItemRow): RosterItem {
  const result: RosterItem = {
    itemId: item.item_rules_id,
    quantity: item.quantity,
  };
  if (item.custom_name != null) result.customName = item.custom_name;
  const notes = optionalText(item.notes);
  if (notes !== undefined) result.notes = notes;
  return result;
}

/**
 * Hero statuses on the roster side have no "left" (that is a hired-sword outcome); a hero who
 * walked out is kept for history the same way a retired one is.
 */
export function toRosterHeroStatus(status: WarriorStatus): RosterHero["status"] {
  return status === "left" ? "retired" : status;
}

/**
 * Hired swords either fight, die, or are gone. A captured or retired hired sword is no longer on
 * the payroll, so both become "left".
 */
export function toRosterHiredSwordStatus(status: WarriorStatus): RosterHiredSword["status"] {
  switch (status) {
    case "active":
    case "dead":
    case "left":
      return status;
    case "captured":
    case "retired":
      return "left";
  }
}

export function toRosterHero(hero: HeroRow, equipment: RosterItem[]): RosterHero {
  const result: RosterHero = {
    id: hero.id,
    name: hero.name,
    // Guaranteed non-null for a non-hired-sword row by heroes_rules_id_matches_kind (checked by heroRowSchema too).
    unitTemplateId: hero.unit_type_rules_id ?? "",
    stats: hero.stats,
    xp: hero.xp,
    levelUps: hero.level_ups,
    skillTableIds: hero.skill_tables,
    skillIds: hero.skills,
    spellIds: hero.spells,
    injuries: hero.injuries,
    flags: hero.flags,
    equipment,
    isLarge: hero.is_large,
    status: toRosterHeroStatus(hero.status),
  };
  const notes = optionalText(hero.notes);
  if (notes !== undefined) result.notes = notes;
  return result;
}

export function toRosterHiredSword(hero: HeroRow, equipment: RosterItem[]): RosterHiredSword {
  return {
    id: hero.id,
    // Guaranteed non-null for a hired-sword row by heroes_rules_id_matches_kind (checked by heroRowSchema too).
    hiredSwordId: hero.hired_sword_rules_id ?? "",
    name: hero.name,
    stats: hero.stats,
    xp: hero.xp,
    levelUps: hero.level_ups,
    skillIds: hero.skills,
    injuries: hero.injuries,
    flags: hero.flags,
    equipment,
    status: toRosterHiredSwordStatus(hero.status),
  };
}

export function toRosterHenchmanGroup(group: HenchmanGroupRow, equipment: RosterItem[]): RosterHenchmanGroup {
  const result: RosterHenchmanGroup = {
    id: group.id,
    name: group.name,
    unitTemplateId: group.unit_type_rules_id,
    size: group.size,
    stats: group.stats,
    xp: group.xp,
    levelUps: group.level_ups,
    statIncreases: group.stat_increases,
    equipment,
    isLarge: group.is_large,
  };
  const notes = optionalText(group.notes);
  if (notes !== undefined) result.notes = notes;
  return result;
}

/**
 * Assemble the resolver model for one warband from its rows. Heroes and groups are ordered by
 * sort_order; items by creation. Items held by a hero or group that is not among the supplied
 * rows are left out rather than moved to the stash, so a caller who only loaded part of the
 * warband cannot accidentally sell someone else's sword.
 */
export function toRosterWarband(
  warband: WarbandRow,
  heroes: readonly HeroRow[],
  groups: readonly HenchmanGroupRow[],
  items: readonly ItemRow[],
): RosterWarband {
  const stash: RosterItem[] = [];
  const held = new Map<string, RosterItem[]>();
  for (const item of [...items].sort(byCreation)) {
    if (item.holder_type === "stash" || item.holder_id == null) {
      stash.push(toRosterItem(item));
      continue;
    }
    const list = held.get(item.holder_id);
    if (list) list.push(toRosterItem(item));
    else held.set(item.holder_id, [toRosterItem(item)]);
  }
  const equipmentOf = (holderId: string): RosterItem[] => held.get(holderId) ?? [];

  const rosterHeroes: RosterHero[] = [];
  const hiredSwords: RosterHiredSword[] = [];
  for (const hero of [...heroes].sort(bySortOrder)) {
    if (hero.is_hired_sword) hiredSwords.push(toRosterHiredSword(hero, equipmentOf(hero.id)));
    else rosterHeroes.push(toRosterHero(hero, equipmentOf(hero.id)));
  }

  const henchmenGroups = [...groups].sort(bySortOrder).map((g) => toRosterHenchmanGroup(g, equipmentOf(g.id)));

  const result: RosterWarband = {
    id: warband.id,
    name: warband.name,
    warbandTemplateId: warband.type_rules_id,
    gold: warband.gold,
    wyrdstone: warband.wyrdstone,
    veteranPool: warband.veteran_pool,
    heroes: rosterHeroes,
    henchmenGroups,
    hiredSwords,
    stash,
  };
  const notes = optionalText(warband.notes);
  if (notes !== undefined) result.notes = notes;
  return result;
}

// ---------------------------------------------------------------------------------------------
// Roster -> row patches (only the columns a resolver may change)
// ---------------------------------------------------------------------------------------------

export type HeroPatch = Pick<
  HeroRow,
  "stats" | "xp" | "level_ups" | "skill_tables" | "skills" | "spells" | "injuries" | "flags" | "status" | "notes"
>;

export type HiredSwordPatch = Pick<HeroRow, "stats" | "xp" | "level_ups" | "skills" | "injuries" | "flags" | "status">;

export type HenchmanGroupPatch = Pick<
  HenchmanGroupRow,
  "stats" | "xp" | "level_ups" | "size" | "stat_increases" | "notes"
>;

export function heroPatchFromRoster(hero: RosterHero): HeroPatch {
  return {
    stats: hero.stats,
    xp: hero.xp,
    level_ups: hero.levelUps,
    skill_tables: hero.skillTableIds,
    skills: hero.skillIds,
    spells: hero.spellIds,
    injuries: hero.injuries,
    flags: hero.flags,
    status: hero.status,
    notes: hero.notes ?? "",
  };
}

export function hiredSwordPatchFromRoster(hiredSword: RosterHiredSword): HiredSwordPatch {
  return {
    stats: hiredSword.stats,
    xp: hiredSword.xp,
    level_ups: hiredSword.levelUps,
    skills: hiredSword.skillIds,
    injuries: hiredSword.injuries,
    flags: hiredSword.flags,
    status: hiredSword.status,
  };
}

export function groupPatchFromRoster(group: RosterHenchmanGroup): HenchmanGroupPatch {
  return {
    stats: group.stats,
    xp: group.xp,
    level_ups: group.levelUps,
    size: group.size,
    stat_increases: group.statIncreases,
    notes: group.notes ?? "",
  };
}

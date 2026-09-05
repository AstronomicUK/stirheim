// Roster composition — parsing UnitTemplate.rosterLimit strings and validating a RosterWarband
// against its WarbandTemplate ("Choice of Warriors").
//
// Rule judgements:
//   - Model count = active heroes + every henchman. Hired swords "do not count towards the maximum
//     number of warriors or Heroes a warband may have on its roster" (Hired Swords rules), so they
//     are left out of both the model and hero counts.
//   - Leader: the rulebook has no data flag for "this is the leader", so the leader template is the
//     first hero template whose limit has a minimum of 1 (e.g. "1" Mercenary Captain). Every core
//     and expansion warband lists its leader first. The roster must hold exactly one active hero of
//     that template — if the leader died, the player promotes a replacement by retemplating.
//   - Hero limits count active heroes of the template; henchman limits count models (sum of group
//     sizes), since "0-5 Swordsmen" is a model count.
//   - minModels is only enforced at creation (opts.atCreation) — a warband may shrink below three
//     through casualties during a campaign.
//   - Limits with prose ("may not exceed the number of Orc Boyz…") parse as unbounded and the prose
//     is returned as `note` for the player to check by hand.

import type { UnitTemplate, WarbandTemplate } from "../types";
import type { RosterItem, RosterWarband } from "../types/roster";
import { equipmentBansFor, unitRules } from "../data/campaignRules";
import { findItem } from "../data/items";
import { heroCapacity } from "../data/warbandTemplates";

export interface ParsedRosterLimit {
  min: number;
  /** Null = unlimited. */
  max: number | null;
  /** Any prose the limit carried, e.g. "taken instead of a Champion or Petty Thief". */
  note?: string;
}

const LIMIT_RE = /^(\d+)\s*(?:[-–]\s*(\d+)|(\+))?\s*(.*)$/s;

/**
 * Parse a rosterLimit string as written in the data:
 * "1" -> {1,1}; "0-2" -> {0,2}; "any" -> {0,null}; "1+" -> {1,null};
 * "0-1 (taken instead of …)" -> {0,1, note}; "0-3, may never exceed …" -> {0,3, note};
 * anything else -> {0,null, note: original}.
 */
export function parseRosterLimit(limit: string): ParsedRosterLimit {
  const text = limit.trim();
  if (/^any$/i.test(text)) return { min: 0, max: null };
  const m = LIMIT_RE.exec(text);
  if (!m) return { min: 0, max: null, note: text };
  const [, lowStr, highStr, plus, rest] = m;
  const low = Number(lowStr);
  let max: number | null;
  if (highStr !== undefined) max = Number(highStr);
  else if (plus) max = null;
  else max = low;
  const note = cleanNote(rest);
  return note ? { min: low, max, note } : { min: low, max };
}

function cleanNote(rest: string): string | undefined {
  let note = rest.trim().replace(/^[,;:]\s*/, "");
  const wrapped = /^\((.*)\)$/s.exec(note);
  if (wrapped) note = wrapped[1].trim();
  return note.length > 0 ? note : undefined;
}

/** Active heroes plus every henchman. Hired swords are not counted. */
export function warbandModelCount(warband: RosterWarband): number {
  return warbandHeroCount(warband) + warband.henchmenGroups.reduce((sum, g) => sum + g.size, 0);
}

/** Heroes with status "active". Hired swords are not heroes for roster purposes. */
export function warbandHeroCount(warband: RosterWarband): number {
  return warband.heroes.filter((h) => h.status === "active").length;
}

/** How many models of a unit type the roster holds: active heroes for hero templates, total henchmen for henchman templates. */
export function unitCount(warband: RosterWarband, unit: UnitTemplate): number {
  if (unit.role === "hero") {
    return warband.heroes.filter((h) => h.status === "active" && h.unitTemplateId === unit.id).length;
  }
  return warband.henchmenGroups.filter((g) => g.unitTemplateId === unit.id).reduce((sum, g) => sum + g.size, 0);
}

/** The hero template treated as the warband's leader: the first with a minimum of 1 (see file header). */
export function leaderTemplate(template: WarbandTemplate): UnitTemplate | undefined {
  return template.heroTemplates.find((h) => parseRosterLimit(h.rosterLimit).min >= 1);
}

export interface RosterProblem {
  code: string;
  message: string;
  subjectId?: string;
}

export interface ValidateRosterOptions {
  /** Enforce the template's minimum model count (only meaningful when the warband is first formed). */
  atCreation?: boolean;
}

export interface RosterValidation {
  ok: boolean;
  problems: RosterProblem[];
}

/** Check a roster against its template's composition rules. Never throws; every issue is a problem row. */
export function validateRoster(
  warband: RosterWarband,
  template: WarbandTemplate,
  opts: ValidateRosterOptions = {},
): RosterValidation {
  const problems: RosterProblem[] = [];
  const units = [...template.heroTemplates, ...template.henchmanTemplates];
  const unitById = new Map(units.map((u) => [u.id, u]));

  // Unknown unit types.
  for (const hero of warband.heroes) {
    if (hero.status !== "active") continue;
    if (!unitById.has(hero.unitTemplateId)) {
      problems.push({
        code: "roster.unknownUnit",
        message: `${hero.name}: unit type "${hero.unitTemplateId}" is not in the ${template.name} list`,
        subjectId: hero.id,
      });
    }
  }
  for (const group of warband.henchmenGroups) {
    if (!unitById.has(group.unitTemplateId)) {
      problems.push({
        code: "roster.unknownUnit",
        message: `${group.name}: unit type "${group.unitTemplateId}" is not in the ${template.name} list`,
        subjectId: group.id,
      });
    }
  }

  // Leader.
  const leader = leaderTemplate(template);
  if (leader) {
    const leaders = warband.heroes.filter((h) => h.status === "active" && h.unitTemplateId === leader.id);
    if (leaders.length === 0) {
      problems.push({ code: "roster.noLeader", message: `The warband has no ${leader.name} (it must have exactly one)` });
    } else if (leaders.length > 1) {
      problems.push({
        code: "roster.multipleLeaders",
        message: `The warband has ${leaders.length} ${pluralName(leader)} but may only have one`,
        subjectId: leaders[1].id,
      });
    }
  }

  // Per-unit limits (the leader is covered above).
  for (const unit of units) {
    if (unit.id === leader?.id) continue;
    const limit = parseRosterLimit(unit.rosterLimit);
    const count = unitCount(warband, unit);
    if (limit.max !== null && count > limit.max) {
      problems.push({
        code: "roster.unitLimit",
        message: `${count} ${pluralName(unit)} but the limit is ${unit.rosterLimit}`,
      });
    }
    if (count < limit.min) {
      problems.push({
        code: "roster.unitMinimum",
        message: `${count} ${pluralName(unit)} but at least ${limit.min} required (${unit.rosterLimit})`,
      });
    }
  }

  // Warband size (units the list keeps outside the maximum are not counted).
  const outside = warband.henchmenGroups.filter((g) => unitRules(g.unitTemplateId).relation?.outsideMaxModels).reduce((n, g) => n + g.size, 0);
  const models = warbandModelCount(warband) - outside;
  const maxModels = template.composition?.maxModels ?? null;
  if (maxModels !== null && models > maxModels) {
    problems.push({
      code: "roster.tooManyModels",
      message: `${models} warriors but ${template.name} may have at most ${maxModels}`,
    });
  }
  const minModels = template.composition?.minModels ?? null;
  if (opts.atCreation && minModels !== null && models < minModels) {
    problems.push({
      code: "roster.tooFewModels",
      message: `${models} warriors but a new ${template.name} warband needs at least ${minModels}`,
    });
  }

  // Heroes.
  const capacity = heroCapacity(template);
  const heroes = warbandHeroCount(warband);
  if (capacity !== null && heroes > capacity) {
    problems.push({
      code: "roster.tooManyHeroes",
      message: `${heroes} heroes but ${template.name} may have at most ${capacity}`,
    });
  }

  // Treasury.
  if (warband.gold < 0) {
    problems.push({ code: "roster.negativeGold", message: `Treasury is ${warband.gold} gc; it cannot go below zero` });
  }

  // Henchman groups.
  for (const group of warband.henchmenGroups) {
    if (!Number.isInteger(group.size) || group.size < 1) {
      problems.push({
        code: "roster.emptyGroup",
        message: `Henchman group ${group.name} has ${group.size} members; groups need at least one`,
        subjectId: group.id,
      });
    }
  }

  // Equipment.
  const holders: { subjectId?: string; label: string; items: RosterItem[] }[] = [
    ...warband.heroes.map((h) => ({ subjectId: h.id, label: h.name, items: h.equipment })),
    ...warband.henchmenGroups.map((g) => ({ subjectId: g.id, label: g.name, items: g.equipment })),
    ...warband.hiredSwords.map((s) => ({ subjectId: s.id, label: s.name, items: s.equipment })),
    { label: "the stash", items: warband.stash },
  ];
  for (const holder of holders) {
    for (const item of holder.items) {
      if (item.itemId !== null && !findItem(item.itemId)) {
        problems.push({
          code: "roster.unknownItem",
          message: `${holder.label}: item "${item.itemId}" is not in the item catalogue`,
          subjectId: holder.subjectId,
        });
      } else if (item.itemId === null && !item.customName?.trim()) {
        problems.push({
          code: "roster.unnamedItem",
          message: `${holder.label}: a custom item needs a name`,
          subjectId: holder.subjectId,
        });
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        problems.push({
          code: "roster.invalidQuantity",
          message: `${holder.label}: ${item.customName ?? item.itemId} has quantity ${item.quantity}`,
          subjectId: holder.subjectId,
        });
      }
    }
  }

  // Relations between unit types ("never more Goblins than two per Orc", "only with a Beastmaster").
  for (const unit of units) {
    const relation = unitRules(unit.id).relation;
    if (!relation) continue;
    const count = unitCount(warband, unit);
    if (count === 0) continue;
    const countOf = (ids: string[]) => ids.reduce((n, id) => n + (unitById.has(id) ? unitCount(warband, unitById.get(id)!) : 0), 0);
    if (relation.noMoreThan) {
      const cap = countOf(relation.noMoreThan.unitIds) * (relation.noMoreThan.ratio ?? 1);
      if (count > cap) {
        problems.push({ code: "roster.relation", message: `${count} ${pluralName(unit)} but the list allows no more than ${relation.noMoreThan.label} (${cap})` });
      }
    }
    if (relation.onlyWith && countOf(relation.onlyWith.unitIds) === 0) {
      problems.push({ code: "roster.relation", message: `${pluralName(unit)} may only be taken with ${relation.onlyWith.label}` });
    }
    if (relation.exclusiveWith && countOf(relation.exclusiveWith.unitIds) > 0) {
      problems.push({ code: "roster.relation", message: `${pluralName(unit)} may not be taken alongside ${relation.exclusiveWith.label}` });
    }
  }

  // Equipment the list forbids (shown as problems; the trading post sells anything, the table decides).
  for (const hero of warband.heroes) {
    if (hero.status !== "active") continue;
    for (const item of hero.equipment) {
      const why = equipmentBanReason(warband.warbandTemplateId, hero.unitTemplateId, item);
      if (why) problems.push({ code: "roster.equipmentBan", message: `${hero.name}: ${why}`, subjectId: hero.id });
    }
  }
  for (const group of warband.henchmenGroups) {
    if (group.size <= 0) continue;
    for (const item of group.equipment) {
      const why = equipmentBanReason(warband.warbandTemplateId, group.unitTemplateId, item);
      if (why) problems.push({ code: "roster.equipmentBan", message: `${group.name}: ${why}`, subjectId: group.id });
    }
  }

  return { ok: problems.length === 0, problems };
}

const POISON_RE = /poison|venom|lotus|blowpipe/i;
const THROWN_RE = /throw|dart/i;

/** Why this warrior may not carry this item under the list's rules, or null when it may. */
export function equipmentBanReason(warbandTemplateId: string, unitTemplateId: string, item: RosterItem): string | null {
  const bans = equipmentBansFor(warbandTemplateId, unitTemplateId);
  if (bans.length === 0 || item.itemId === null) return null;
  const catalogue = findItem(item.itemId);
  if (!catalogue) return null;
  const name = catalogue.name;
  const isHelmet = /helmet|helm\b/i.test(catalogue.id);
  for (const ban of bans) {
    switch (ban) {
      case "allEquipment":
        return `${name} cannot be carried (the list gives this warrior no equipment)`;
      case "armour":
        if (catalogue.category === "armour" && !isHelmet) return `${name} is armour, which this warrior may not wear`;
        break;
      case "heavyArmour":
        if (/heavy_armour|gromril_armour|ithilmar_armour|chaos_armour/.test(catalogue.id)) return `${name} is heavy armour, which this warrior may not wear`;
        break;
      case "helmets":
        if (isHelmet) return `${name}: this warrior may not wear a helmet`;
        break;
      case "missile":
        if (catalogue.category === "missile" || catalogue.category === "blackpowder") return `${name} is a missile weapon, which this warrior may not use`;
        break;
      case "missileExceptThrown":
        if ((catalogue.category === "missile" || catalogue.category === "blackpowder") && !THROWN_RE.test(catalogue.id)) return `${name}: this warrior uses no missile weapons but thrown ones`;
        break;
      case "blackPowder":
        if (catalogue.category === "blackpowder") return `${name} is a black powder weapon, which this warband does not use`;
        break;
      case "poison":
        if (POISON_RE.test(catalogue.id)) return `${name}: this warband does not use poison`;
        break;
      case "onlyBlackPowderMissiles":
        if (catalogue.category === "missile" && !THROWN_RE.test(catalogue.id)) return `${name}: this warband's ranged weapons are black powder only`;
        break;
    }
  }
  return null;
}

function pluralName(unit: UnitTemplate): string {
  // Template names are mostly already plural ("Champions", "Warriors"); singular ones get an "s".
  return /s$/i.test(unit.name) ? unit.name : `${unit.name}s`;
}

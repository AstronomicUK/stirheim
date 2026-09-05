// Recruitment resolvers — hiring heroes and henchmen from the warband template, hiring and paying
// hired swords, and dismissing warriors. Rulebook "Recruiting new warriors" / "Veterans" (data in
// data/campaign/trading) and the Hired Swords rules (data/campaign/hiredSwords).
//
// Rule judgements:
//   - Recruits arrive with no equipment. "You must pay for all their weapons and armour" is a
//     separate purchase step (resolve/trading), so these resolvers only charge the hire cost.
//   - Veterans: adding to a group whose xp > 0 needs the 2D6 veteran pool rolled in the post-battle
//     sequence (`warband.veteranPool`). Each recruit consumes the group's xp from the pool and
//     costs VETERAN_XP_COST_GC (2 gc) per xp on top of the hire fee. `opts.poolUsed` carries the xp
//     already spent this post-battle sequence in; `poolRemaining` comes back out. A group with 0 xp
//     never touches the pool.
//   - Dismissing a hero marks him "retired" (kept for history) and moves his kit to the stash.
//     Dismissing one henchman shrinks the group by one and moves one copy of the group's kit to the
//     stash (RosterHenchmanGroup.equipment is one member's kit, identical for all); an emptied group
//     is removed. A dismissed hired sword "leaves" and takes his own equipment with him, since a
//     player "cannot sell the Hired Sword's weapons or equipment".
//   - Hired swords: one of each type ("you can only have one of each type of Hired Sword"), checked
//     against active ones only — a Troll Slayer who left may be replaced. Stats come from the entry's
//     first profile; the Weapons/Armour text is kept as one custom item per line because the source
//     often offers a choice ("Two Axes or a Double-Handed Axe").
//   - Upkeep: unaffordable upkeep means "he leaves the warband" (status "left"). Conditional fees
//     (Troll Slayer with Elves: 20 gc) are handled by `opts.amountOverride`.

import type { UnitTemplate, WarbandTemplate } from "../types";
import type { HiredSwordDetail } from "../types/campaignContent";
import type {
  Resolution,
  ResolutionEvent,
  RosterHenchmanGroup,
  RosterHero,
  RosterHiredSword,
  RosterItem,
  RosterWarband,
} from "../types/roster";
import { HIRED_SWORDS } from "../data/campaign/hiredSwords";
import { VETERAN_XP_COST_GC } from "../data/campaign/trading";
import { findUnitTemplate, heroCapacity } from "../data/warbandTemplates";
import { RulesError } from "./errors";
import { freeDaggerLine } from "./freeDagger";
import { parseRosterLimit, unitCount, warbandHeroCount, warbandModelCount } from "./roster";

/** RulesError code when a second hired sword of the same type is hired. */
export const DUPLICATE_HIRED_SWORD = "DUPLICATE_HIRED_SWORD";

export interface CanRecruitResult {
  ok: boolean;
  reason?: string;
}

function requireUnit(template: WarbandTemplate, unitTemplateId: string): UnitTemplate {
  const unit = findUnitTemplate(template, unitTemplateId);
  if (!unit) {
    throw new RulesError("recruitment.unknownUnit", `"${unitTemplateId}" is not a unit type in ${template.name}`);
  }
  return unit;
}

/** Everything that stops a hire except the treasury: unit limit, warband size, hero capacity, not-for-hire. */
function recruitmentBlock(
  warband: RosterWarband,
  template: WarbandTemplate,
  unit: UnitTemplate,
  count: number,
): string | undefined {
  if (unit.cost === null) return `${unit.name} cannot be hired for gold`;
  const limit = parseRosterLimit(unit.rosterLimit);
  const current = unitCount(warband, unit);
  if (limit.max !== null && current + count > limit.max) {
    return `The warband already has ${current} ${unit.name}; the limit is ${unit.rosterLimit}`;
  }
  const maxModels = template.composition?.maxModels ?? null;
  const models = warbandModelCount(warband);
  if (maxModels !== null && models + count > maxModels) {
    return `The warband has ${models} warriors; ${template.name} may have at most ${maxModels}`;
  }
  if (unit.role === "hero") {
    const capacity = heroCapacity(template);
    const heroes = warbandHeroCount(warband);
    if (capacity !== null && heroes + count > capacity) {
      return `The warband has ${heroes} heroes; ${template.name} may have at most ${capacity}`;
    }
  }
  return undefined;
}

function assertGold(warband: RosterWarband, cost: number, what: string): void {
  if (warband.gold < cost) {
    throw new RulesError("recruitment.notEnoughGold", `${what} costs ${cost} gc but the treasury holds ${warband.gold} gc`);
  }
}

/** Can the warband hire `count` (default 1) of this unit type right now? */
export function canRecruit(
  warband: RosterWarband,
  template: WarbandTemplate,
  unitTemplateId: string,
  count = 1,
): CanRecruitResult {
  const unit = findUnitTemplate(template, unitTemplateId);
  if (!unit) return { ok: false, reason: `"${unitTemplateId}" is not a unit type in ${template.name}` };
  const block = recruitmentBlock(warband, template, unit, count);
  if (block) return { ok: false, reason: block };
  const cost = (unit.cost ?? 0) * count;
  if (warband.gold < cost) {
    return { ok: false, reason: `${count > 1 ? `${count} ` : ""}${unit.name} costs ${cost} gc but the treasury holds ${warband.gold} gc` };
  }
  return { ok: true };
}

/** Hire a new hero of the given unit type: template stats, starting experience, no equipment. */
export interface RecruitHeroOptions {
  /** Pay this instead of the listed hire cost (the UI records why). */
  costOverride?: number;
}

export function recruitHero(
  warband: RosterWarband,
  template: WarbandTemplate,
  unitTemplateId: string,
  name: string,
  id: string,
  opts: RecruitHeroOptions = {},
): Resolution<RosterWarband> {
  const unit = requireUnit(template, unitTemplateId);
  if (unit.role !== "hero") throw new RulesError("recruitment.notAHero", `${unit.name} are henchmen; use recruitHenchmen`);
  if (warband.heroes.some((h) => h.id === id)) {
    throw new RulesError("recruitment.duplicateId", `A hero with id "${id}" already exists`);
  }
  const block = recruitmentBlock(warband, template, unit, 1);
  if (block) throw new RulesError("recruitment.notAllowed", block);
  const cost = opts.costOverride ?? unit.cost ?? 0;
  assertGold(warband, cost, `A ${unit.name}`);
  const freeDagger = freeDaggerLine(template, unit);

  const hero: RosterHero = {
    id,
    name,
    unitTemplateId: unit.id,
    stats: { ...unit.stats },
    xp: unit.startingExperience,
    levelUps: 0,
    skillTableIds: [...unit.skillTableIds],
    skillIds: [],
    spellIds: [],
    injuries: [],
    flags: {},
    equipment: freeDagger ? [{ itemId: freeDagger.itemId, ...(freeDagger.itemId ? {} : { customName: freeDagger.name }), quantity: 1 }] : [],
    status: "active",
  };

  return {
    value: { ...warband, gold: warband.gold - cost, heroes: [...warband.heroes, hero] },
    events: [
      {
        kind: "hero.recruited",
        subjectId: id,
        message: `Hired ${name} (${unit.name}) for ${cost} gc with ${unit.startingExperience} starting experience${freeDagger ? " and the free dagger" : ""}; treasury now ${warband.gold - cost} gc`,
        data: { unitTemplateId: unit.id, cost, startingExperience: unit.startingExperience },
      },
    ],
  };
}

export interface RecruitHenchmenOptions {
  /** Add the recruits to this existing group (same unit type) instead of forming a new one. */
  intoGroupId?: string;
  /** Veteran experience already hired from this post-battle pool. Defaults to 0. */
  poolUsed?: number;
  /** Pay this for the recruits instead of the listed hire cost (veteran experience is still charged on top). */
  costOverride?: number;
}

export interface RecruitHenchmenResult {
  warband: RosterWarband;
  /** Veteran experience still available from the 2D6 pool after this hire; null if no pool has been rolled. */
  poolRemaining: number | null;
}

/**
 * Hire `size` henchmen as a new group, or add them to an existing group of the same type. Joining
 * an experienced group applies the veteran rule (see file header).
 */
export function recruitHenchmen(
  warband: RosterWarband,
  template: WarbandTemplate,
  unitTemplateId: string,
  groupName: string,
  size: number,
  id: string,
  opts: RecruitHenchmenOptions = {},
): Resolution<RecruitHenchmenResult> {
  if (!Number.isInteger(size) || size < 1) {
    throw new RulesError("recruitment.invalidSize", `You must hire at least one henchman (got ${size})`);
  }
  const unit = requireUnit(template, unitTemplateId);
  if (unit.role !== "henchman") throw new RulesError("recruitment.notAHenchman", `${unit.name} is a hero; use recruitHero`);

  const existing = opts.intoGroupId ? warband.henchmenGroups.find((g) => g.id === opts.intoGroupId) : undefined;
  if (opts.intoGroupId && !existing) {
    throw new RulesError("recruitment.unknownGroup", `No henchman group with id "${opts.intoGroupId}"`);
  }
  if (existing && existing.unitTemplateId !== unit.id) {
    throw new RulesError(
      "recruitment.groupTypeMismatch",
      `${existing.name} are ${existing.unitTemplateId}, not ${unit.name}; recruits must join a group of their own type`,
    );
  }
  if (!existing && warband.henchmenGroups.some((g) => g.id === id)) {
    throw new RulesError("recruitment.duplicateId", `A henchman group with id "${id}" already exists`);
  }

  const block = recruitmentBlock(warband, template, unit, size);
  if (block) throw new RulesError("recruitment.notAllowed", block);

  // Veterans.
  const poolUsed = Math.max(0, opts.poolUsed ?? 0);
  const pool = warband.veteranPool;
  let veteranXp = 0;
  let veteranCost = 0;
  if (existing && existing.xp > 0) {
    if (pool === null) {
      throw new RulesError(
        "recruitment.noVeteranPool",
        `${existing.name} have ${existing.xp} experience: roll 2D6 for available veterans before adding recruits`,
      );
    }
    const available = pool - poolUsed;
    veteranXp = existing.xp * size;
    if (veteranXp > available) {
      throw new RulesError(
        "recruitment.veteranPoolExceeded",
        `${size} recruit${size > 1 ? "s" : ""} for ${existing.name} need ${veteranXp} experience of veterans but only ${available} ${available === 1 ? "is" : "are"} available this time`,
      );
    }
    veteranCost = VETERAN_XP_COST_GC * veteranXp;
  }
  const poolRemaining = pool === null ? null : pool - poolUsed - veteranXp;

  const hireCost = opts.costOverride ?? (unit.cost ?? 0) * size;
  const totalCost = hireCost + veteranCost;
  assertGold(warband, totalCost, `${size} ${unit.name}${veteranCost ? " with veteran experience" : ""}`);

  const events: ResolutionEvent[] = [];
  let henchmenGroups: RosterHenchmanGroup[];
  if (existing) {
    henchmenGroups = warband.henchmenGroups.map((g) => (g.id === existing.id ? { ...g, size: g.size + size } : g));
    events.push({
      kind: "henchmen.recruited",
      subjectId: existing.id,
      message: `Added ${size} ${unit.name} to ${existing.name} for ${hireCost} gc (group now ${existing.size + size} strong)`,
      data: { unitTemplateId: unit.id, size, hireCost, groupId: existing.id },
    });
    if (veteranCost > 0) {
      events.push({
        kind: "veterans.hired",
        subjectId: existing.id,
        message: `Paid ${veteranCost} gc extra for ${veteranXp} experience of veterans (${VETERAN_XP_COST_GC} gc per point); ${poolRemaining} of ${pool} remaining in the pool`,
        data: { veteranXp, veteranCost, poolRemaining },
      });
    }
    events.push({
      kind: "note",
      subjectId: existing.id,
      message: `New members of ${existing.name} must be armed and equipped the same way as the rest of the group`,
    });
  } else {
    const groupDagger = freeDaggerLine(template, unit);
    const group: RosterHenchmanGroup = {
      id,
      name: groupName,
      unitTemplateId: unit.id,
      size,
      stats: { ...unit.stats },
      xp: unit.startingExperience,
      levelUps: 0,
      statIncreases: {},
      equipment: groupDagger ? [{ itemId: groupDagger.itemId, ...(groupDagger.itemId ? {} : { customName: groupDagger.name }), quantity: size }] : [],
    };
    henchmenGroups = [...warband.henchmenGroups, group];
    events.push({
      kind: "henchmen.recruited",
      subjectId: id,
      message: `Hired ${size} ${unit.name} as a new group, ${groupName}, for ${hireCost} gc`,
      data: { unitTemplateId: unit.id, size, hireCost, groupId: id },
    });
  }
  events.push({
    kind: "gold.spent",
    message: `Treasury ${warband.gold} gc -> ${warband.gold - totalCost} gc`,
    data: { spent: totalCost },
  });

  return {
    value: {
      warband: { ...warband, gold: warband.gold - totalCost, henchmenGroups },
      poolRemaining,
    },
    events,
  };
}

/** Dismiss a hero (retired, kit to stash), one henchman from a group (kit to stash), or a hired sword (leaves). */
export function dismissWarrior(warband: RosterWarband, subjectId: string): Resolution<RosterWarband> {
  const hero = warband.heroes.find((h) => h.id === subjectId);
  if (hero) {
    if (hero.status !== "active") {
      throw new RulesError("recruitment.notActive", `${hero.name} is already ${hero.status}`);
    }
    return {
      value: {
        ...warband,
        heroes: warband.heroes.map((h) => (h.id === hero.id ? { ...h, status: "retired", equipment: [] } : h)),
        stash: [...warband.stash, ...copyItems(hero.equipment)],
      },
      events: [
        {
          kind: "hero.dismissed",
          subjectId: hero.id,
          message: `${hero.name} leaves the warband${hero.equipment.length ? "; their equipment goes to the stash" : ""}`,
          data: { itemsToStash: hero.equipment.length },
        },
      ],
    };
  }

  const group = warband.henchmenGroups.find((g) => g.id === subjectId);
  if (group) {
    const remaining = group.size - 1;
    const henchmenGroups =
      remaining < 1
        ? warband.henchmenGroups.filter((g) => g.id !== group.id)
        : warband.henchmenGroups.map((g) => (g.id === group.id ? { ...g, size: remaining } : g));
    return {
      value: { ...warband, henchmenGroups, stash: [...warband.stash, ...copyItems(group.equipment)] },
      events: [
        {
          kind: "henchman.dismissed",
          subjectId: group.id,
          message:
            remaining < 1
              ? `The last of ${group.name} leaves the warband; the group is disbanded${group.equipment.length ? " and their equipment goes to the stash" : ""}`
              : `One of ${group.name} leaves the warband (${remaining} remain)${group.equipment.length ? "; one set of the group's equipment goes to the stash" : ""}`,
          data: { remaining, itemsToStash: group.equipment.length },
        },
      ],
    };
  }

  const hs = warband.hiredSwords.find((s) => s.id === subjectId);
  if (hs) {
    if (hs.status !== "active") {
      throw new RulesError("recruitment.notActive", `${hs.name} has already ${hs.status === "dead" ? "died" : "left"}`);
    }
    return {
      value: {
        ...warband,
        hiredSwords: warband.hiredSwords.map((s) => (s.id === hs.id ? { ...s, status: "left" } : s)),
      },
      events: [
        {
          kind: "hiredSword.dismissed",
          subjectId: hs.id,
          message: `${hs.name} is released from service and takes their own equipment with them`,
        },
      ],
    };
  }

  throw new RulesError("recruitment.unknownWarrior", `No warrior or group with id "${subjectId}"`);
}

function copyItems(items: RosterItem[]): RosterItem[] {
  return items.map((i) => ({ ...i }));
}

export interface HireHiredSwordOptions {
  /** Display name; defaults to the entry name ("Dwarf Troll Slayer"). */
  name?: string;
  /** Pay this instead of the listed hire fee (conditional fees; the UI records why). */
  feeOverride?: number;
}

/** One custom item per line of the entry's Weapons/Armour (or Equipment) text. */
export function hiredSwordEquipment(detail: HiredSwordDetail | undefined): RosterItem[] {
  const text = detail?.weaponsArmour?.trim() || detail?.equipment?.trim() || "";
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => ({ itemId: null, customName: line, quantity: 1 }));
}

/** Hire a hired sword from HIRED_SWORDS: pays the hire fee, one of each type only. */
export function hireHiredSword(
  warband: RosterWarband,
  hiredSwordId: string,
  id: string,
  opts: HireHiredSwordOptions = {},
): Resolution<RosterWarband> {
  const entry = HIRED_SWORDS.find((h) => h.id === hiredSwordId);
  if (!entry) throw new RulesError("recruitment.unknownHiredSword", `No hired sword with id "${hiredSwordId}"`);
  if (warband.hiredSwords.some((s) => s.id === id)) {
    throw new RulesError("recruitment.duplicateId", `A hired sword with id "${id}" already exists`);
  }
  if (warband.hiredSwords.some((s) => s.hiredSwordId === hiredSwordId && s.status === "active")) {
    throw new RulesError(DUPLICATE_HIRED_SWORD, `The warband already has a ${entry.name}; you can only have one of each type of Hired Sword`);
  }
  const cost = opts.feeOverride ?? entry.hireCost.base;
  if (cost === null) {
    throw new RulesError(
      "recruitment.hiredSwordNotForGold",
      `${entry.name} cannot be hired for a plain fee (${entry.hireCost.text})`,
    );
  }
  const profile = entry.detail?.profiles[0];
  if (!profile) {
    throw new RulesError("recruitment.hiredSwordNoProfile", `${entry.name} has no stat profile in the data`);
  }
  assertGold(warband, cost, entry.name);

  const hiredSword: RosterHiredSword = {
    id,
    hiredSwordId,
    name: opts.name ?? entry.name,
    stats: { ...profile.stats },
    xp: 0,
    levelUps: 0,
    skillIds: [],
    injuries: [],
    flags: {},
    equipment: hiredSwordEquipment(entry.detail),
    status: "active",
  };

  const upkeep = entry.upkeep?.text ?? "no upkeep listed";
  return {
    value: { ...warband, gold: warband.gold - cost, hiredSwords: [...warband.hiredSwords, hiredSword] },
    events: [
      {
        kind: "hiredSword.hired",
        subjectId: id,
        message: `Hired ${hiredSword.name} for ${cost} gc (upkeep ${upkeep} after each battle); treasury now ${warband.gold - cost} gc`,
        data: { hiredSwordId, cost, upkeep: entry.upkeep?.base ?? null },
      },
    ],
  };
}

export interface PayUpkeepOptions {
  /** Pay this instead of the listed upkeep (e.g. a Troll Slayer in a warband with Elves: 20 gc). */
  amountOverride?: number;
}

export interface PayUpkeepResult {
  warband: RosterWarband;
  /** False when the warband could not afford the fee and the hired sword left. */
  paid: boolean;
}

/** Pay a hired sword's post-battle upkeep, or lose him if the treasury cannot cover it. */
export function payUpkeep(
  warband: RosterWarband,
  hiredSwordRosterId: string,
  opts: PayUpkeepOptions = {},
): Resolution<PayUpkeepResult> {
  const hs = warband.hiredSwords.find((s) => s.id === hiredSwordRosterId);
  if (!hs) throw new RulesError("recruitment.unknownWarrior", `No hired sword with id "${hiredSwordRosterId}"`);
  if (hs.status !== "active") {
    throw new RulesError("recruitment.notActive", `${hs.name} has already ${hs.status === "dead" ? "died" : "left"}; no upkeep is due`);
  }
  const entry = HIRED_SWORDS.find((h) => h.id === hs.hiredSwordId);
  const upkeep = opts.amountOverride ?? entry?.upkeep?.base ?? null;

  if (upkeep === null || upkeep <= 0) {
    return {
      value: { warband, paid: true },
      events: [
        {
          kind: "hiredSword.upkeep",
          subjectId: hs.id,
          message: `${hs.name}: no upkeep due (${entry?.upkeep?.text ?? "none listed"})`,
          data: { upkeep: 0 },
        },
      ],
    };
  }

  if (warband.gold >= upkeep) {
    return {
      value: { warband: { ...warband, gold: warband.gold - upkeep }, paid: true },
      events: [
        {
          kind: "hiredSword.upkeep",
          subjectId: hs.id,
          message: `Paid ${hs.name} ${upkeep} gc upkeep; treasury now ${warband.gold - upkeep} gc`,
          data: { upkeep },
        },
      ],
    };
  }

  return {
    value: {
      warband: {
        ...warband,
        hiredSwords: warband.hiredSwords.map((s) => (s.id === hs.id ? { ...s, status: "left" } : s)),
      },
      paid: false,
    },
    events: [
      {
        kind: "hiredSword.left",
        subjectId: hs.id,
        message: `${hs.name} leaves the warband: ${upkeep} gc upkeep was due but the treasury holds only ${warband.gold} gc. Any experience he gained is lost.`,
        data: { upkeep, gold: warband.gold },
      },
    ],
  };
}

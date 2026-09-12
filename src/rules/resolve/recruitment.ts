import { isBanned } from "./houseRules";
import { dreamerRecruitmentBlock } from './dreamerCertification'
import { leaderReplacementPurchaseBlock } from './leaderReplacement';
import { availableFreeHires } from './explorationDiscoveries'
import { DWARF_HIRES, ELF_HIRES } from './mixedHireUpkeep'
import { isDramatisPersona } from '../data/campaign/hiredSwords'
import { findWarbandTemplate } from "../data/warbandTemplates";
import { parseDice, rollDice } from './dice';
import { HIRED_EQUIPMENT_CHOICES } from "./hiredEquipmentChoices";
import { conditionalHireDepartures, hiredSwordStartingSkills } from './hiredSwordRules';
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

import { collapsedWarbandReason, delayedLeaderRecruitmentBlock } from './leaderReplacement';
import type { UnitTemplate, WarbandTemplate } from "../types";
import type { HiredSwordDetail } from "../types/campaignContent";
import type {
  CampaignBans,
  Resolution,
  ResolutionEvent,
  RosterHenchmanGroup,
  RosterHero,
  RosterHiredSword,
  RosterItem,
  RosterWarband,
} from "../types/roster";
import { resolveEquipmentName } from "../data/items/aliases";
import { findHiredSword } from "../data/campaign/hiredSwords";
import { findLore, SPELL_LORES, startingMagicFor, startingMagicOptions } from "../data/campaign/magic";
import { VETERAN_XP_COST_GC } from "../data/campaign/trading";
import { findUnitTemplate, heroCapacity } from "../data/warbandTemplates";
import { RulesError } from "./errors";
import { freeDaggerLine } from "./freeDagger";
import { rollDie } from "./dice";
import { spellForRoll } from "./grimoires";
import { unitRules } from "../data/campaignRules";
import { startingLevelUps, unitStartingStats } from "./builder";
import { leaderTemplate, parseRosterLimit, unitCount, warbandHeroCount, warbandModelCount } from "./roster";

/**
 * Published starting allocations. Khar-mel rolls D3 for the count; named full sets are below.
 * Priest of Morr and Wolf Priest are ordinary Hero alternatives in the warband catalogue.
 */
const HIRED_SWORD_STARTING_SPELLS: Record<string, { loreId: string; count: number }> = {
  warrior_priest_of_sigmar: { loreId: 'prayers_of_sigmar', count: 1 },
  dark_mage: { loreId: 'dark_mage_magic', count: 1 },
  khar_mel_the_djinn: { loreId: 'arabian_elemental_magic', count: 0 },
  warlock: { loreId: "lesser_magic", count: 2 },
  witch: { loreId: "charms_and_hexes", count: 2 },
  elf_mage: { loreId: "spells_of_the_djedhi", count: 3 },
  the_fallen_sister: { loreId: "lesser_magic", count: 1 },
  norse_shaman: { loreId: "norse_runes", count: 2 },
  dark_emissary: { loreId: "lore_of_darkness", count: 4 },
  truthsayer: { loreId: "lore_of_light", count: 3 },
};

/** Roll starting spells with the source-permitted duplicate reroll; learning improvements use advances. */
function rollHiredSwordSpells(hiredSwordId: string, rng: () => number): string[] {
  const full: Record<string, string[]> = {
    bertha_bestraufrung_high_matriarch_of_the_sisterhood: ['prayers_of_sigmar'],
    nicodemus_the_cursed_pilgrim: ['lesser_magic'],
    abdul_alhazred_the_mad_sorcerer: ['arabian_elemental_magic', 'necromancy'],
    crow_master_the: ['necromancy', 'crow_master_magic'],
  };
  if (full[hiredSwordId]) return [...new Set(full[hiredSwordId].flatMap(id => findLore(id)!.spells.map(s => s.id)))];
  const spec = HIRED_SWORD_STARTING_SPELLS[hiredSwordId];
  const lore = spec ? findLore(spec.loreId) : undefined;
  if (!spec || !lore) return [];
  const count = hiredSwordId === 'khar_mel_the_djinn' ? rollDie(3, rng) : spec.count;
  const spellIds: string[] = [];
  for (let guard = 0; spellIds.length < count && guard < 50; guard++) {
    const spell = spellForRoll(lore, rollDie(6, rng));
    if (spell && !spellIds.includes(spell.id)) spellIds.push(spell.id);
  }
  // A pathological RNG must not silently under-allocate spells.
  if (spellIds.length < count) for (const spell of lore.spells) { if (!spellIds.includes(spell.id)) spellIds.push(spell.id); if (spellIds.length === count) break; }
  return spellIds;
}

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
export function recruitmentBlock(
  warband: RosterWarband,
  template: WarbandTemplate,
  unit: UnitTemplate,
  count: number,
): string | undefined {
  if (template.id === 'order_of_the_mare' && unit.id !== 'dame_of_the_mare' && warband.heroes.some(h => h.unitTemplateId === 'dame_of_the_mare') && !warband.heroes.some(h => h.unitTemplateId === 'dame_of_the_mare' && ['active','captured'].includes(h.status))) return 'Recruit a new Dame of the Mare before any other warriors.';
  if (unit.id === 'dreamwalkers_dreamer') { const block=dreamerRecruitmentBlock(warband); if(block)return block; }
  const collapse = collapsedWarbandReason(warband);
  if(collapse)return `${collapse} Retire this warband rather than recruiting replacements.`;
  const waitBlock = delayedLeaderRecruitmentBlock(warband, unit.id);
  if (waitBlock) return waitBlock;
  const leader = leaderTemplate(template);
  if (unit.id === leader?.id && warband.heroes.some(h => h.unitTemplateId === unit.id && h.status === 'dead') && !['the_undead','lizardmen','battle_monks_of_cathay','ogre_hunting_party'].includes(template.id)) return 'A slain leader cannot be bought again. Appoint an eligible surviving Hero instead.';
  if (warband.heroes.some(h => h.status === 'active' && h.flags.leaderRoleId === unit.id)) return 'This leadership position is already held by the appointed successor.';
  if (template.id === 'necrarchs_the_soul_stealers' && warband.heroes.some(h => h.unitTemplateId === 'necrarchs_necrarch_vampire' && h.status === 'dead') && ['necrarchs_necrarch_vampire','necrarchs_thrall'].includes(unit.id)) return 'Death of the Leader: the Thrall succeeds the Necrarch; create a replacement Thrall from an existing Acolyte.';
  if (template.id === 'lustrian_reavers' && unit.role === 'hero' && warband.heroes.some(h => h.unitTemplateId === unit.id)) return 'Rare Heroes: this Hero type has already been hired. Promote a Prospect into the lost position instead.';
  if (unit.cost === null) return `${unit.name} cannot be hired for gold`;
  if (unit.replacementFor) {
    const replaced = findUnitTemplate(template, unit.replacementFor)!;
    const cap = parseRosterLimit(replaced.rosterLimit).max;
    if (cap !== null && unitCount(warband, replaced) >= cap) return `No ${replaced.name} slot is free for this priest.`;
  }
  const limit = parseRosterLimit(unit.rosterLimit);
  const current = unitCount(warband, unit);
  if (limit.max !== null && current + count > limit.max) {
    return `The warband already has ${current} ${unit.name}; the limit is ${unit.rosterLimit}`;
  }
  const maxModels = template.composition?.maxModels ?? null;
  const models = warbandModelCount(warband);
  if (maxModels !== null && models + count > maxModels) {
    return `The warband has ${models} ${models === 1 ? "warrior" : "warriors"}; ${template.name} may have at most ${maxModels}`;
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
  const replacementBlock = leaderReplacementPurchaseBlock(warband, cost, unit.id);
  if (replacementBlock) return { ok: false, reason: replacementBlock };
  if (warband.gold < cost) {
    return { ok: false, reason: `${count > 1 ? `${count} ` : ""}${unit.name} costs ${cost} gc but the treasury holds ${warband.gold} gc` };
  }
  return { ok: true };
}

/** Hire a new hero of the given unit type: template stats, starting experience, no equipment. */
export const INITIAL_OUTLAW_ARROWS_COST = 30;

export interface RecruitHeroOptions {
  initialHuntingArrows?: boolean;
  bans?: CampaignBans;
  rng?: () => number;
  magicChoiceId?: string;
  spellIds?: string[];
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
  if (opts.initialHuntingArrows && (template.id !== "outlaws_of_stirwood_forest" || isBanned(opts.bans, "items", "hunting_arrows"))) throw new RulesError("recruitment.huntingArrows", "The initial Hunting Arrows exception is unavailable for this recruit or campaign.");
  const hireCost = opts.costOverride ?? ((unit.cost ?? 0) + (startingMagicFor(unit.id, template, opts.magicChoiceId)?.extraCost ?? 0));
  const arrowsCost = opts.initialHuntingArrows ? INITIAL_OUTLAW_ARROWS_COST : 0;
  const cost = hireCost + arrowsCost;
  const replacementBlock = leaderReplacementPurchaseBlock(warband, cost, unit.id);
  if (replacementBlock) throw new RulesError("recruitment.replaceLeader", replacementBlock);
  assertGold(warband, cost, `A ${unit.name}`);
  const freeDagger = freeDaggerLine(template, unit);

  const hero: RosterHero = {
    id,
    name,
    unitTemplateId: unit.id,
    stats: unitStartingStats(unit),
    xp: unit.startingExperience,
    levelUps: startingLevelUps(unit, "hero"),
    skillTableIds: [...unit.skillTableIds, ...(opts.magicChoiceId === 'arkhar' ? ['strength'] : [])],
    skillIds: [...(unitRules(unit.id).startingSkillIds ?? [])],
    spellIds: opts.spellIds?.filter(Boolean) ?? [],
    injuries: [],
    flags: { ...(unit.id === 'cursed_cavalcade_twisted_scholar' && opts.magicChoiceId === 'chronicler' ? { chronicler: true } : {}), ...(startingMagicFor(unit.id, template, opts.magicChoiceId)?.loreId ? { magicLoreId: startingMagicFor(unit.id, template, opts.magicChoiceId)!.loreId! } : {}), ...(unit.id === 'marauders_seer' ? { chaosMark: opts.magicChoiceId } : {}) },
    equipment: freeDagger ? [{ itemId: freeDagger.itemId, ...(freeDagger.itemId ? {} : { customName: freeDagger.name }), quantity: 1 }] : [],
    status: "active",
  };

  if (opts.initialHuntingArrows) hero.equipment.push({ itemId: "hunting_arrows", quantity: 1 });
  const magic = startingMagicFor(unit.id, template, opts.magicChoiceId);
  if (unit.alternateHero === 'wolf_priest_of_ulric') hero.equipment.push({ itemId: 'wolfcloak', quantity: 1 });
  if (startingMagicOptions(unit.id, template).length && !magic) throw new RulesError('recruitment.magicChoice', 'Choose the recruit’s starting lore or Mark.');
  if (magic?.loreId && !opts.spellIds) {
    const pool = [...findLore(magic.loreId)!.spells];
    while (hero.spellIds.length < magic.count && pool.length) hero.spellIds.push(pool.splice(rollDie(pool.length, opts.rng ?? Math.random) - 1, 1)[0].id);
  }
  if (magic && new Set(hero.spellIds).size !== magic.count) throw new RulesError('recruitment.startingSpells', `Record ${magic.count} distinct starting spells.`);
  if (magic?.loreId && hero.spellIds.some(id => !findLore(magic.loreId!)!.spells.some(s => s.id === id))) throw new RulesError('recruitment.startingSpells', 'A starting spell does not belong to the chosen lore.');
  const replacesTemporaryLeader = unit.id === leaderTemplate(template)?.id;
  const existingHeroes = replacesTemporaryLeader ? warband.heroes.map(h => h.flags.temporaryLeader ? { ...h, flags: { ...h.flags, temporaryLeader: false } } : h) : warband.heroes;
  const recruited = { ...warband, gold: warband.gold - cost, heroes: [...existingHeroes, hero] };
  const departures = conditionalHireDepartures(warband, recruited);
  for (const departure of departures) recruited.hiredSwords = departingHiredSword(recruited, departure.id);
  return {
    value: recruited,
    events: [
      {
        kind: "hero.recruited",
        subjectId: id,
        message: `Hired ${name} (${unit.name}) for ${cost} gc with ${unit.startingExperience} starting experience${magic?.extraCost ? `; ${magic.label}` : ''}${freeDagger ? " and the free dagger" : ""}${arrowsCost ? `; includes Hunting Arrows for ${arrowsCost} gc at initial recruitment, with no rarity roll required` : ""}; treasury now ${warband.gold - cost} gc`,
        data: { unitTemplateId: unit.id, cost, ...(arrowsCost ? { hireCost, initialHuntingArrowsCost: arrowsCost } : {}), startingExperience: unit.startingExperience },
      },
      ...departures.map(d => ({kind: "hiredSword.left" as const,subjectId:d.id,message:`${d.name} leaves. ${d.reason}`})),
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
  const replacementBlock = leaderReplacementPurchaseBlock(warband, totalCost, unit.id);
  if (replacementBlock) throw new RulesError("recruitment.replaceLeader", replacementBlock);
  assertGold(warband, totalCost, `${size} ${unit.name}${veteranCost ? " with veteran experience" : ""}`);

  const events: ResolutionEvent[] = [];
  let henchmenGroups: RosterHenchmanGroup[];
  if (existing) {
    // Each recruit brings the list's free dagger when the group carries daggers (the group must be armed alike).
    const groupDagger = freeDaggerLine(template, unit);
    const daggerStack = groupDagger ? existing.equipment.find((i) => (groupDagger.itemId ? i.itemId === groupDagger.itemId : i.itemId === null && i.customName === groupDagger.name)) : undefined;
    const equipment = daggerStack ? existing.equipment.map((i) => (i === daggerStack ? { ...i, quantity: i.quantity + size } : i)) : existing.equipment;
    henchmenGroups = warband.henchmenGroups.map((g) => (g.id === existing.id ? { ...g, size: g.size + size, equipment } : g));
    events.push({
      kind: "henchmen.recruited",
      subjectId: existing.id,
      message: `Added ${size} ${unit.name} to ${existing.name} for ${hireCost} gc (group now ${existing.size + size} strong)${daggerStack ? `, each with the free dagger` : ""}`,
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
      stats: unitStartingStats(unit),
      xp: unit.startingExperience,
      levelUps: startingLevelUps(unit, "henchman"),
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
    const retainForProspect = warband.warbandTemplateId === 'lustrian_reavers';
    return {
      value: {
        ...warband,
        heroes: warband.heroes.map((h) => (h.id === hero.id ? { ...h, status: "retired", equipment: retainForProspect ? h.equipment : [] } : h)),
        stash: retainForProspect ? warband.stash : [...warband.stash, ...copyItems(hero.equipment)],
      },
      events: [
        {
          kind: "hero.dismissed",
          subjectId: hero.id,
          message: `${hero.name} leaves the warband${retainForProspect ? "; their equipment is retained for a replacement Prospect" : hero.equipment.length ? "; their equipment goes to the stash" : ""}`,
          data: { itemsToStash: retainForProspect ? 0 : hero.equipment.length },
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
        hiredSwords: departingHiredSword(warband, hs.id),
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

export const OPTIONAL_HIRED_MOUNTS: Record<string, { itemId: string; label: string; fromStash?: boolean }> = {
  freelancer: { itemId: 'warhorse', label: 'Warhorse — optional mounted rules' },
  highwayman: { itemId: 'riding_draft_horse', label: 'Horse — optional mounted rules' },
  roadwarden: { itemId: 'riding_draft_horse', label: 'Horse — optional mounted rules' },
  knight_of_the_white_wolf: { itemId: 'warhorse', label: 'Warhorse from your stash', fromStash: true },
};

export interface HireHiredSwordOptions {
  mounted?: boolean;
  returningFavourReportId?: string;
  /** Display name; defaults to the entry name ("Dwarf Troll Slayer"). */
  name?: string;
  scouts?: number;
  equipmentChoice?: string;
  luthorRole?: 'crimson' | 'wizard' | 'archer';
  /** Pay this instead of the listed hire fee (conditional fees; the UI records why). */
  feeOverride?: number;
  /** Injectable for tests; defaults to Math.random. */
  rng?: () => number;
}

/** Prose the entries open with before they list anything: "A Warlock carries", "He wears". */
const KIT_PREAMBLE = /^(?:(?:in addition[ ,]+)?(?:(?:the|a|an)\s+)?[\w’' -]+?\s+)?(?:carries|carry|wears|wear|wields|is armed with|is equipped with|are equipped with|starts with|has|have)\s+/i;

/** Parse equipment statements, retaining unexplained or unique gear as named custom items. */
export function hiredSwordEquipment(detail: HiredSwordDetail | undefined): RosterItem[] {
  const text = (detail?.weaponsArmour?.trim() || detail?.equipment?.trim() || '').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1');
  const firstParagraph = text.split(/\n+/)[0] ?? '';
  const sentences = firstParagraph.split(/(?<=[.!])\s+/);
  const out: RosterItem[] = [];
  for (const [index,sentence] of sentences.entries()) {
    const candidate=sentence.replace(/^While in man-form,\s*/i,'').replace(/\s+but wears no armour[.!]?$/i, '');
    if (/^Head or no head,/i.test(candidate)) continue;
    if (/\b(?:never carry|cannot use|may not use|may only be armed|made from raw magic|no need for weapons|no weapons or armour|never wear)\b/i.test(candidate)) continue;
    if (index > 0 && !KIT_PREAMBLE.test(candidate)) {
      if(out.length)out[out.length-1]={...out[out.length-1],notes:[out[out.length-1].notes,sentence].filter(Boolean).join(' ')};
      continue;
    }
    const listed=candidate.replace(KIT_PREAMBLE,'').replace(/[.!]$/,'').trim();
    if(!listed || /\b(?:never carry|cannot use|may not use|may only be armed|made from raw magic)\b/i.test(listed)) continue;
    if(/\b(?:either|or)\b/i.test(listed)) {out.push({itemId:null,customName:candidate.replace(KIT_PREAMBLE, ''),quantity:1});continue;}
    for(const piece of splitKit(listed)) {
      if (/^(?:no armour|that is all)$/i.test(piece)) continue;
      const match=piece.match(/^(?:(\d+)|((?:one|two|three|four|five))|(?:a )?(?:pair|brace) of)\s+(.+)$/i);
      const quantity=match?Number(match[1]??(({one:1,two:2,three:3,four:4,five:5} as Record<string,number>)[match[2]?.toLowerCase()??'']??2)):1;
      const name=(match?.[3]??piece).replace(/^(?:wears|carries|wields|has)\s+/i,'').replace(/^(?:a|an|the)\s+/i,'').replace(/\s+as well$/i,'');
      const item=resolveEquipmentName(name)??resolveEquipmentName(name.replace(/\s*\([^)]*\)\s*$/,'').trim());
      out.push(item?{itemId:item.id,quantity}:{itemId:null,customName:name,quantity});
    }
  }
  return out;
}

/** Split list separators only outside parentheses; Rope & Hook is one catalogue item. */
function splitKit(listed: string): string[] {
  const text=listed.replace(/Needle and Thread/gi, 'Needle \uE002 Thread').replace(/\bRope\s*(?:&|and)\s*(?:Hook|Grapple)\b/gi,'Rope \uE002 Hook');
  let depth=0,part=''; const parts:string[]=[];
  for(let i=0;i<text.length;i++) {
    const char=text[i];
    if(char==='(')depth++;
    if(char===')')depth=Math.max(0,depth-1);
    const word=depth===0?text.slice(i).match(/^\s+and\s+/i):null;
    if(depth===0&&(char===','||char==='&'||word)) {parts.push(part);part='';if(word)i+=word[0].length-1;}
    else part+=char;
  }
  parts.push(part);
  return parts.map(p=>p.replace(/\uE002/g,'&').trim().replace(/^(?:and\s+)?(?:(?:a|an|the)\s+)?/i,'').trim()).filter(p=>p&&!p.startsWith('('));
}

/** Hire a hired sword from HIRED_SWORDS: pays the hire fee, one of each type only. */
export function hireHiredSword(
  warband: RosterWarband,
  hiredSwordId: string,
  id: string,
  opts: HireHiredSwordOptions = {},
): Resolution<RosterWarband> {
  const entry = findHiredSword(hiredSwordId);
  if (!entry) throw new RulesError("recruitment.unknownHiredSword", `No hired sword with id "${hiredSwordId}"`);
  if (warband.hiredSwords.some((s) => s.id === id)) {
    throw new RulesError("recruitment.duplicateId", `A hired sword with id "${id}" already exists`);
  }
  const activeScouts = warband.hiredSwords.filter(s => s.hiredSwordId === 'hobgoblin_scout' && s.status === 'active').length;
  const hasMaglah = warband.hiredSwords.some(s => s.hiredSwordId === 'maglah_khan_s_horde' && s.status === 'active');
  if (warband.hiredSwords.some((s) => s.hiredSwordId === hiredSwordId && s.status === "active") && !(hiredSwordId === 'hobgoblin_scout' && hasMaglah && activeScouts < 5)) {
    throw new RulesError(DUPLICATE_HIRED_SWORD, `The warband already has a ${entry.name}; you can only have one of each type of Hired Sword`);
  }
  if (warband.hiredSwords.some(s => s.hiredSwordId === hiredSwordId && s.flags.mustMissNextBattle)) throw new RulesError('recruitment.contractGap', `${entry.name} cannot return until this warband has fought a battle without them.`);
  const favour = opts.returningFavourReportId;
  if (favour && (isDramatisPersona(hiredSwordId) || !availableFreeHires(warband, hiredSwordId).some(r=>r.id===favour) || warband.hiredSwords.some(h => h.flags.returningFavourReportId === favour))) throw new RulesError('recruitment.favourUnavailable', 'This free recruitment reward is not available for this hire.');
  const specialFree = ['bertha_bestraufrung_high_matriarch_of_the_sisterhood', 'dark_emissary', 'truthsayer'].includes(hiredSwordId);
  const shardCost = favour ? 0 : hiredSwordId === 'nicodemus_the_cursed_pilgrim' ? 1 : Number(entry.hireCost.text.match(/^(\d+)\s+(?:wyrdstone|treasures?)/i)?.[1] ?? 0);
  const shardFee = shardCost > 0;
  const feeRoll = entry.hireCost.dice && !favour && opts.feeOverride === undefined ? rollDice(parseDice(entry.hireCost.dice), opts.rng ?? Math.random) : null;
  const cost = favour ? 0 : opts.feeOverride ?? (entry.hireCost.base === null ? (specialFree || shardFee ? 0 : null) : entry.hireCost.base + (feeRoll?.total ?? 0));
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
  if (warband.wyrdstone < shardCost) throw new RulesError('recruitment.shardFee', `${entry.name} requires ${shardCost} wyrdstone/treasure to join.`);
  const scoutTotal = opts.scouts ?? 2;
  if (hiredSwordId === 'maglah_khan_s_horde' && (!Number.isInteger(scoutTotal) || scoutTotal < Math.max(2, activeScouts) || scoutTotal > 5)) throw new RulesError('recruitment.scouts', 'Maglah requires two to five Hobgoblin Scouts.');
  const scoutCost = hiredSwordId === 'maglah_khan_s_horde' ? Math.max(0, scoutTotal - activeScouts) * (findHiredSword('hobgoblin_scout')!.hireCost.base!) : 0;
  assertGold(warband, cost + scoutCost, entry.name);
  const spellIds = rollHiredSwordSpells(hiredSwordId, opts.rng ?? Math.random);

  const hiredSword: RosterHiredSword = {
    id,
    hiredSwordId,
    name: opts.name ?? entry.name,
    stats: { ...profile.stats },
    xp: 0,
    levelUps: 0,
    skillIds: [...new Set([...hiredSwordStartingSkills(hiredSwordId), ...(hiredSwordId === 'nicodemus_the_cursed_pilgrim' ? ['sorcery', 'fearsome'] : hiredSwordId === 'the_fallen_sister' ? ['warrior_wizard'] : [])])],
    spellIds,
    injuries: [],
    flags: hiredSwordId === 'luthor_wolfenbaum' ? {luthorRole:opts.luthorRole,...(opts.luthorRole === 'wizard' ? {immuneToFear:true} : {})} : {},
    equipment: hiredSwordStartingEquipment(entry.id, entry.detail, opts.luthorRole, opts.equipmentChoice, opts.mounted),
    status: "active",
  };

  let stash = warband.stash;
  if (opts.mounted) {
    const mount = OPTIONAL_HIRED_MOUNTS[hiredSwordId];
    if (!mount) throw new RulesError('recruitment.mount', 'This hire has no optional starting mount.');
    if (mount.fromStash) {
      const index = stash.findIndex(i => i.itemId === mount.itemId && i.quantity > 0);
      if (index < 0) throw new RulesError('recruitment.mount', 'The Knight requires an existing Warhorse in your stash.');
      stash = stash.flatMap((i, n) => n !== index ? [i] : i.quantity > 1 ? [{ ...i, quantity: i.quantity - 1 }] : []);
    }
    const skill = mount.itemId === 'warhorse' ? 'cavalry_ride_warhorse' : 'cavalry_ride_horse';
    if (hiredSwordId === 'freelancer') hiredSword.skillIds = [...new Set([...hiredSword.skillIds, skill])];
  }
  const companions: RosterHiredSword[] = [];
  if (hiredSwordId === 'ulli_and_marquand') {
    hiredSword.name = opts.name ? `${opts.name}: Marquand` : 'Marquand Volker';
    hiredSword.flags = { hireGroupId: id };
    hiredSword.skillIds = ['step_aside', 'knife_fighter', 'lightning_reflexes'];
    const second = entry.detail!.profiles[1];
    companions.push({ ...hiredSword, id: crypto.randomUUID(), name: 'Ulli Leitpold', stats: { ...second.stats }, flags: { hireGroupId: id, hireCompanion: true }, skillIds: ['strongman', 'unstoppable_charge', 'combat_master'], equipment: [{ itemId: 'double_handed_weapon', quantity: 1 }, { itemId: 'light_armour', quantity: 1 }] });
  }
  if (hiredSwordId === 'snake_charmer') {
    hiredSword.flags = { hireGroupId: id };
    const snake = entry.detail!.profiles.find(p => p.name === 'Snake')!;
    for (let i = 1; i <= 3; i++) companions.push({ ...hiredSword, id: crypto.randomUUID(), name: `Snake ${i}`, stats: { ...snake.stats }, flags: { hireGroupId: id, hireCompanion: true }, skillIds: [], spellIds: [], equipment: [] });
  }
  if (hiredSwordId === 'maglah_khan_s_horde') {
    let withScouts = { ...warband, gold: warband.gold - cost, hiredSwords: [...warband.hiredSwords, hiredSword] };
    for (let i = activeScouts; i < scoutTotal; i++) {
      const recruited = hireHiredSword(withScouts, 'hobgoblin_scout', crypto.randomUUID(), { rng: opts.rng });
      companions.push(recruited.value.hiredSwords[recruited.value.hiredSwords.length - 1]);
      withScouts = recruited.value;
    }
  }
  const upkeep = entry.upkeep?.text ?? "no upkeep listed";
  const spellNote = spellIds.length > 0 ? `; spells rolled: ${spellIds.map((sid) => SPELL_LORES.flatMap(l => l.spells).find(sp => sp.id === sid)?.name ?? sid).join(", ")}${hiredSwordId === 'khar_mel_the_djinn' ? ` (D3 starting count: ${spellIds.length})` : ''}` : "";
  if (favour) hiredSword.flags = { ...hiredSword.flags, returningFavourReportId: favour };
  return {
    value: { ...warband, stash, gold: warband.gold - cost - scoutCost, wyrdstone: warband.wyrdstone - shardCost, hiredSwords: [...warband.hiredSwords, hiredSword, ...companions] },
    events: [
      {
        kind: "hiredSword.hired",
        subjectId: id,
        message: `Hired ${hiredSword.name} for ${cost + scoutCost} gc${shardCost ? ` and ${shardCost} wyrdstone/treasure` : ""}${scoutCost ? ` including ${scoutTotal - activeScouts} Hobgoblin Scouts` : ""} (upkeep ${upkeep} after each battle); treasury now ${warband.gold - cost - scoutCost} gc${spellNote}`,
        data: { hiredSwordId, cost, feeRoll, scoutCost, upkeep: entry.upkeep?.base ?? null },
      },
    ],
  };
}

export interface PayUpkeepOptions {
  trollPayment?: "gold" | "sacrifice" | "cheap";
  sacrificeGroups?: Record<string,number>;
  contractRoll?: number;
  mariannaHelpedAndSurvived?: boolean;
  /** Pay this instead of the listed upkeep (e.g. a Troll Slayer in a warband with Elves: 20 gc). */
  amountOverride?: number;
}

export interface PayUpkeepResult {
  warband: RosterWarband;
  /** False when the warband could not afford the fee and the hired sword left. */
  paid: boolean;
}

/** Pay a hired sword's post-battle upkeep, or lose him if the treasury cannot cover it. */
function resolveUpkeepPayment(
  warband: RosterWarband,
  hiredSwordRosterId: string,
  opts: PayUpkeepOptions = {},
): Resolution<PayUpkeepResult> {
  const hs = warband.hiredSwords.find((s) => s.id === hiredSwordRosterId);
  if (!hs) throw new RulesError("recruitment.unknownWarrior", `No hired sword with id "${hiredSwordRosterId}"`);
  if (hs.status !== "active") {
    throw new RulesError("recruitment.notActive", `${hs.name} has already ${hs.status === "dead" ? "died" : "left"}; no upkeep is due`);
  }
  const entry = findHiredSword(hs.hiredSwordId);
  if (hs.flags.contractCheckOwed) {
    const roll = opts.contractRoll;
    if (!roll || !Number.isInteger(roll) || roll < 1 || roll > 6) throw new RulesError('recruitment.contractRoll', 'Roll the end-of-battle contract check first.');
    const marianna = hs.hiredSwordId === 'countess_marianna_chevaux_vampire_assassin';
    const leaves = marianna ? roll <= 3 || (roll === 6 && opts.mariannaHelpedAndSurvived === false) : roll === 1;
    if (marianna && roll === 6 && opts.mariannaHelpedAndSurvived === undefined) throw new RulesError('recruitment.marianna', 'Finish the encounter with Serutat’s minions, then record whether the warband took a minion out of action and Marianna survived.');
    if (leaves) return { value: { paid: true, warband: {...warband,hiredSwords:departingHiredSword(warband,hs.id)} }, events: [{kind:'hiredSword.left',subjectId:hs.id,message:`${hs.name} leaves after the contract check (D6 ${roll}); no further upkeep paid.`}] };
    if (marianna && roll === 6) return {value:{paid:true,warband},events:[{kind:'hiredSword.upkeep',subjectId:hs.id,message:`${hs.name} survived with the warband’s help and fights the next battle for free (contract D6 6).`}]};
  }

  const upkeepShards = ['nicodemus_the_cursed_pilgrim', 'clan_skryre_rat_ogre'].includes(hs.hiredSwordId) ? 1 : Number(entry?.upkeep?.text.match(/^(\d+)\s+(?:wyrdstone|treasures?)/i)?.[1] ?? 0);
  if (upkeepShards > 0 && opts.amountOverride === undefined) {
    const paid = warband.wyrdstone >= upkeepShards;
    return { value: { paid, warband: { ...warband, wyrdstone: warband.wyrdstone - (paid ? upkeepShards : 0), hiredSwords: warband.hiredSwords.map(s => s.id === hs.id && !paid ? { ...s, status: 'left' } : s) } }, events: [{ kind: 'hiredSword.upkeep', subjectId: hs.id, message: paid ? `${hs.name} is paid ${upkeepShards} wyrdstone/treasure.` : `${hs.name} leaves: no wyrdstone shard to pay him.` }] };
  }
  const withElves = /elf|elves/i.test(findWarbandTemplate(warband.warbandTemplateId)?.race ?? '') || warband.hiredSwords.some(s => s.status === 'active' && ELF_HIRES.includes(s.hiredSwordId));
  const withDwarfs = /dwarf|dwarves/i.test(findWarbandTemplate(warband.warbandTemplateId)?.race ?? '') || warband.hiredSwords.some(s => s.status === 'active' && DWARF_HIRES.includes(s.hiredSwordId));
  const upkeep = opts.amountOverride ?? (['dwarf_troll_slayer', 'dwarf_slayer_pirate'].includes(hs.hiredSwordId) && withElves ? 20 : hs.hiredSwordId === 'elf_ranger' && withDwarfs ? 40 : hs.hiredSwordId === 'snake_charmer' ? 10 + 5 * warband.hiredSwords.filter(s => s.flags.hireGroupId === hs.flags.hireGroupId && s.flags.hireCompanion && s.status === 'active').length : entry?.upkeep?.base ?? null);

  if (upkeep === null && entry?.upkeep) throw new RulesError('recruitment.specialUpkeep', `${hs.name}: ${entry.upkeep.text}. Record the agreed payment through Hired Swords.`);
  if (upkeep !== null && (!Number.isInteger(upkeep) || upkeep < 0)) throw new RulesError('recruitment.invalidUpkeep', 'Enter a non-negative whole number for upkeep.');
  if (upkeep === null || upkeep === 0) {
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
        hiredSwords: departingHiredSword(warband, hs.id),
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

// ---- Henchman upkeep (Trolls and the like) ----

export interface HenchmanUpkeepLine {
  groupId: string;
  name: string;
  gold: number;
  note: string;
}

/** Groups whose list charges upkeep after every battle. */
export function henchmanUpkeepDue(warband: RosterWarband): HenchmanUpkeepLine[] {
  const out: HenchmanUpkeepLine[] = [];
  for (const g of warband.henchmenGroups) {
    if (g.size <= 0 || !g.campaignState?.upkeepOwedAfter) continue;
    const rule = unitRules(g.unitTemplateId).upkeep;
    if (rule) out.push({ groupId: g.id, name: g.name, gold: rule.gold * g.size, note: rule.note });
  }
  return out;
}

/** Pay a henchman group's upkeep, or let the group go when the treasury cannot cover it. */
function resolveHenchmanPayment(warband: RosterWarband, groupId: string, opts: PayUpkeepOptions = {}): Resolution<PayUpkeepResult> {
  const group = warband.henchmenGroups.find((g) => g.id === groupId);
  if (!group) throw new RulesError("recruitment.unknownGroup", `No henchman group with id "${groupId}"`);
  const rule = unitRules(group.unitTemplateId).upkeep;
  const due = opts.amountOverride ?? (rule ? rule.gold * group.size : 0);
  if(opts.trollPayment && opts.trollPayment!=='gold'){
    if(!rule||warband.gold>=rule.gold*group.size)throw new RulesError('upkeep.alternative','The printed alternative is available only when you cannot afford normal Troll upkeep.');
    if(opts.trollPayment==='cheap'){
      if(group.unitTemplateId!=='black_orcs_troll')throw new RulesError('upkeep.alternative','Only Black Orc Trolls have the reduced-cost option.');
      const cost=5*group.size;assertGold(warband,cost,'Reduced Troll upkeep');
      return {value:{paid:true,warband:{...warband,gold:warband.gold-cost,henchmenGroups:warband.henchmenGroups.map(g=>g.id===groupId?{...g,campaignState:{...g.campaignState,cheapTrollFeed:true}}:g)}},events:[{kind:'henchmen.upkeep',subjectId:groupId,message:`Paid ${cost} gc for ${group.name}; each Troll now counts as two members for income and the warband limit.`}]};
    }
    const food=trollFoodGroups(warband,groupId)
    const chosen=Object.entries(opts.sacrificeGroups??{}).filter(([,n])=>n!==0)
    if(!food.length||chosen.some(([id,n])=>!Number.isInteger(n)||n<0||n>(food.find(g=>g.id===id)?.size??0))||chosen.reduce((sum,[,n])=>sum+n,0)!==2*group.size)throw new RulesError('upkeep.sacrifice','Choose exactly two eligible Goblins or Cave Squigs for each Troll.');
    const groups=warband.henchmenGroups.map(g=>{const count=opts.sacrificeGroups?.[g.id]??0;return count?{...g,size:g.size-count,equipment:g.equipment.map(i=>({...i,quantity:Math.floor(i.quantity*(g.size-count)/g.size)})).filter(i=>i.quantity>0)}:g});
    return {value:{paid:true,warband:{...warband,henchmenGroups:groups}},events:[{kind:'henchmen.upkeep',subjectId:groupId,message:`Fed ${group.name} ${chosen.map(([id,n])=>`${n} from ${food.find(g=>g.id===id)!.name}`).join(' and ')} instead of paying ${due} gc. Sacrificed models and their equipment are removed.`}]};
  }
  if (due <= 0) {
    return { value: { warband, paid: true }, events: [{ kind: "henchmen.upkeep", subjectId: group.id, message: `${group.name}: no upkeep due`, data: { upkeep: 0 } }] };
  }
  if (warband.gold >= due) {
    return {
      value: { warband: { ...warband, gold: warband.gold - due }, paid: true },
      events: [{ kind: "henchmen.upkeep", subjectId: group.id, message: `Paid ${group.name} ${due} gc upkeep (${rule?.note ?? "upkeep"}); treasury now ${warband.gold - due} gc`, data: { upkeep: due } }],
    };
  }
  return {
    value: { warband: { ...warband, henchmenGroups: warband.henchmenGroups.map((g) => (g.id === groupId ? { ...g, size: 0 } : g)) }, paid: false },
    events: [{ kind: "henchmen.left", subjectId: group.id, message: `${group.name} could not be paid ${due} gc upkeep and leave the warband`, data: { upkeep: due } }],
  };
}

/** A retinue leaves with its employer; Maglah's rules allow one Scout to remain. */
export function departingHiredSword(warband: RosterWarband, id: string): RosterHiredSword[] {
  const hire = warband.hiredSwords.find(s => s.id === id);
  if (!hire) return warband.hiredSwords;
  const scouts = warband.hiredSwords.filter(s => s.hiredSwordId === 'hobgoblin_scout' && s.status === 'active');
  const remainingScout = scouts.find(s=>s.id===hire.flags.retainedScoutId) ?? scouts[0];
  return warband.hiredSwords.map(s => {
    const grouped = hire.flags.hireGroupId && (!hire.flags.hireCompanion || hire.hiredSwordId === 'ulli_and_marquand') && s.flags.hireGroupId === hire.flags.hireGroupId;
    const retinue = hire.hiredSwordId === 'maglah_khan_s_horde' && s.hiredSwordId === 'hobgoblin_scout' && s.id !== remainingScout?.id;
    return s.status === 'active' && (s.id === id || grouped || retinue) ? { ...s, status: 'left' } : s;
  });
}

export function hiredSwordStartingEquipment(id: string, detail: HiredSwordDetail | undefined, role?: HireHiredSwordOptions['luthorRole'], equipmentChoice?: string, mounted = false): RosterItem[] {
  const choices = HIRED_EQUIPMENT_CHOICES[id];
  if (choices) {
    const chosen = equipmentChoice === undefined ? choices[0] : choices.find(choice => choice.id === equipmentChoice);
    if (!chosen) throw new RulesError('recruitment.equipmentChoice', 'Choose one of the listed equipment options.');
    return chosen.equipment.map(item => ({ ...item }));
  }
  const kit = (ids: string[]): RosterItem[] => ids.map(itemId => ({itemId,quantity:1}));
  const mount = mounted && OPTIONAL_HIRED_MOUNTS[id] ? kit([OPTIONAL_HIRED_MOUNTS[id].itemId]) : [];
  if(id==='bertha_bestraufrung_high_matriarch_of_the_sisterhood') return [{itemId:'sigmarite_warhammer',quantity:2},...kit(['gromril_armour','blessed_water','holy_unholy_relic'])];
  if(id==='countess_marianna_chevaux_vampire_assassin') return kit(['rapier','dagger','throwing_knives_stars','crossbow_pistol']).map(i=>['rapier','crossbow_pistol'].includes(i.itemId!)?{...i,notes:'Coated in essence of garlic: acts as Black Lotus only against Vampires.'}:i);
  if(id==='dijin_katal_the_renegade_assassin') return [{itemId:'sword',quantity:2,notes:'Both swords are coated with Dark Venom.'},...kit(['repeater_crossbow']),{itemId:null,customName:"Druchii Assassin’s Cloak",quantity:1}];
  if(id==='the_dark_jester_in_mordheim') return [{itemId:'club_mace_or_hammer',quantity:1,notes:'Skeleton hobby horse: counts as a club.'},{itemId:'morning_star',quantity:1,notes:'Sack of spikes: counts as a morning star.'}];
  if(id==='aenur_the_sword_of_twilight') return kit(['ithilmar_armour','elven_cloak','ienh_khain']);
  if(id==='ninja_gnoblar') return kit(['toughened_leathers','ninja_gnoblar_shurikens','ninja_gnoblar_bo']);
  if(id==='drenok_johansen_wielder_of_the_great_axe') return kit(['icefang_axe','sabertooth_tiger_hide']);
  if(id==='abdul_alhazred_the_mad_sorcerer') return kit(['nomad_robes','dagger','abdul_eye_pendant']);
  if(id==='maximilian_the_mad') return kit(['maximilian_holy_weapon']);
  if(id==='busty_gwen') return [{itemId:null,customName:'Knives',quantity:1},...kit(['gwen_rolling_pin'])];
  if(id==='veskit_high_executioner_of_clan_eshin') return kit(['veskit_eshin_claws','veskit_warplock_pistols']);
  if(id==='freelancer') return [...kit(['heavy_armour', 'shield', 'lance', 'sword']), ...mount];
  if(id==='highwayman') return [...kit(['dagger', 'rapier', 'buckler']), { itemId: 'pistol', quantity: 2 }, ...mount];
  if(id==='roadwarden') return [...kit(['crossbow', 'horsemans_hammer', 'dagger', 'heavy_armour']), { itemId: 'torch', quantity: 3 }, ...mount];
  if(id==='cursed_hillman') return kit(['axe', 'dagger', 'longbow', 'hillman_fur_cloak']);
  if(id==='duellist') return kit(['duelling_pistol', 'sword', 'dagger', 'buckler']);
  if(id==='knight_of_the_white_wolf') return [...kit(['heavy_armour', 'wolfcloak', 'horsemans_hammer']), ...mount];
  if(id==='johann_the_knife') return [{itemId:'throwing_knives_stars',quantity:1},{itemId:'sword',quantity:2,notes:'His long daggers count as two swords in close combat.'}];
  if(id==='ulli_and_marquand') return kit(['sword', 'light_armour', 'throwing_knives_stars']);
  if(id==='snake_charmer') return kit(['dagger', 'sword']);
  if(id==='chameleon_skink') return kit(['dagger','blowpipe','buckler']);
  if(id==='dark_emissary') return [
    {itemId:'dark_emissary_staff',quantity:1},
    {itemId:'dark_emissary_spiral',quantity:1},
  ];
  if(id==='truthsayer') return [
    {itemId:'staff_of_light',quantity:1},
    {itemId:'truthsayer_triskele',quantity:1},
  ];
  if(id==='luthor_wolfenbaum') {
    if(!role) throw new RulesError('recruitment.luthorRole','Choose Luthor’s role before hiring him.');
    if(role==='crimson') return [{itemId:'sword',quantity:1,notes:'Custom sword: may instead be wielded two-handed for +1 Strength.'},...kit(['dagger','heavy_armour','helmet'])];
    if(role==='archer') return [...kit(['longbow','dagger','hunting_arrows','heavy_armour','dark_venom'])];
    return [{itemId:null,customName:'Fish-slapping staff',quantity:1,notes:'A natural 6 to hit strikes at double Strength (8).'},...kit(['heavy_armour','lucky_charm','garlic']),{itemId:null,customName:'Bugman’s Beer',quantity:1,notes:'Luthor is immune to Fear.'},{itemId:null,customName:'Clay orbs of Tilean Fire',quantity:1,notes:'8-inch range; no long-range penalty; S2 hits. May throw in melee. A hit target must roll under Initiative next turn or cannot charge or shoot that turn.'}];
  }
  return hiredSwordEquipment(detail);
}

export function sharedUpkeepOwner(warband: RosterWarband, hire: RosterHiredSword): RosterHiredSword | undefined {
  return hire.flags.hireCompanion && hire.flags.hireGroupId ? warband.hiredSwords.find(s => s.flags.hireGroupId === hire.flags.hireGroupId && !s.flags.hireCompanion && s.status === 'active') : undefined;
}

export function payUpkeep(warband: RosterWarband, id: string, opts: PayUpkeepOptions = {}): Resolution<PayUpkeepResult> {
  const hire = warband.hiredSwords.find(h => h.id === id);
  if (hire?.flags.hireCompanion && (hire.hiredSwordId !== 'ulli_and_marquand' || sharedUpkeepOwner(warband, hire))) throw new RulesError('upkeep.sharedContract', 'This companion has no separate upkeep payment; settle the main character’s contract.');
  const result = resolveUpkeepPayment(warband,id,opts);
  if (!result.value.paid) return result;
  const next = result.value.warband;
  return {...result,value:{...result.value,warband:{...next,hiredSwords:next.hiredSwords.map(s=>{
    if(s.id!==id) return s;
    const {upkeepOwedAfter:_owed,contractCheckOwed:_check,...flags}=s.flags;
    return {...s,flags};
  })}},events:opts.contractRoll ? [...result.events,{kind:'hiredSword.contract',subjectId:id,message:`End-of-battle contract check: D6 ${opts.contractRoll}.`}] : result.events};
}


export function trollFoodGroups(warband:RosterWarband,groupId:string) {
 const troll=warband.henchmenGroups.find(g=>g.id===groupId)
 const ids=troll?.unitTemplateId==='orc_mob_troll'?['orc_mob_goblin_warriors','orc_mob_cave_squigs']:troll?.unitTemplateId==='night_goblins_troll'?['night_goblins_warriors','night_goblins_cave_squigs']:troll?.unitTemplateId==='night_goblins_web_troll'?['night_goblins_web_warriors','night_goblins_web_cave_squigs']:[]
 return warband.henchmenGroups.filter(g=>g.size>0&&ids.includes(g.unitTemplateId))
}

export function payHenchmanUpkeep(warband:RosterWarband,groupId:string,opts:PayUpkeepOptions={}):Resolution<PayUpkeepResult>{
 const original=warband.henchmenGroups.find(g=>g.id===groupId)
 if(original?.campaignState?.upkeepPaidAfter&&!original.campaignState.upkeepOwedAfter)throw new RulesError('upkeep.alreadyPaid','This group’s upkeep is already settled for the last battle.')
 const result=resolveHenchmanPayment(warband,groupId,opts)
 return {...result,value:{...result.value,warband:{...result.value.warband,henchmenGroups:result.value.warband.henchmenGroups.map(g=>{
  if(g.id!==groupId)return g
  const {upkeepOwedAfter,...state}=g.campaignState??{}
  return {...g,campaignState:{...state,upkeepPaidAfter:upkeepOwedAfter??'manual',cheapTrollFeed:opts.trollPayment==='cheap'}}
 })}}}
}

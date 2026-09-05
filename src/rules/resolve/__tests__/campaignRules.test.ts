// The campaign-rule overlay (data/campaignRules) as read by the resolvers.

import { describe, expect, it } from "vitest";
import { UNIT_RULES, WARBAND_RULES, unitGainsExperience, unitRules } from "../../data/campaignRules";
import { advancesEarned, findRacialMaximum, nextThreshold, xpThresholds } from "../../data/campaign/experience";
import { findUnitTemplate, findWarbandTemplate, heroCapacity, WARBAND_TEMPLATES } from "../../data/warbandTemplates";
import { HIRED_SWORDS } from "../../data/campaign/hiredSwords";
import type { RosterHenchmanGroup, RosterHero, RosterWarband } from "../../types/roster";
import { newWarbandDraft, unitIsLarge, unitStartingStats } from "../builder";
import { explorationBonuses, explorationDiceAllowed } from "../exploration";
import { incomeSize, wyrdstoneQuote } from "../income";
import { applyHenchmanInjury, henchmanInjuryException } from "../injuries";
import { warbandRating } from "../rating";
import { henchmanUpkeepDue, payHenchmanUpkeep, recruitHenchmen, recruitHero } from "../recruitment";
import { resolveRacialProfile } from "../advances";

const stats = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 };
const hero = (id: string, unit: string, over: Partial<RosterHero> = {}): RosterHero => ({
  id, name: id, unitTemplateId: unit, stats, xp: 0, levelUps: 0, skillTableIds: [], skillIds: [], spellIds: [], injuries: [], flags: {}, equipment: [], status: "active", ...over,
});
const group = (id: string, unit: string, size: number, over: Partial<RosterHenchmanGroup> = {}): RosterHenchmanGroup => ({
  id, name: id, unitTemplateId: unit, size, stats, xp: 0, levelUps: 0, statIncreases: {}, equipment: [], ...over,
});
const warband = (templateId: string, heroes: RosterHero[], groups: RosterHenchmanGroup[], over: Partial<RosterWarband> = {}): RosterWarband => ({
  id: "w", name: "Test", warbandTemplateId: templateId, gold: 100, wyrdstone: 3, veteranPool: null, heroes, henchmenGroups: groups, hiredSwords: [], stash: [], ...over,
});

describe("campaign rules data", () => {
  it("only names units and warbands that exist in the templates", () => {
    const unitIds = new Set(WARBAND_TEMPLATES.flatMap((t) => [...t.heroTemplates, ...t.henchmanTemplates].map((u) => u.id)));
    const missingUnits = Object.keys(UNIT_RULES).filter((id) => !unitIds.has(id));
    expect(missingUnits).toEqual([]);
    const missingWarbands = Object.keys(WARBAND_RULES).filter((id) => !findWarbandTemplate(id));
    expect(missingWarbands).toEqual([]);
  });

  it("points relations, hired swords and racial rows at things that exist", () => {
    const unitIds = new Set(WARBAND_TEMPLATES.flatMap((t) => [...t.heroTemplates, ...t.henchmanTemplates].map((u) => u.id)));
    const swordIds = new Set(HIRED_SWORDS.map((h) => h.id));
    for (const [id, rule] of Object.entries(UNIT_RULES)) {
      for (const ref of [...(rule.relation?.noMoreThan?.unitIds ?? []), ...(rule.relation?.onlyWith?.unitIds ?? []), ...(rule.relation?.exclusiveWith?.unitIds ?? [])]) {
        expect(unitIds.has(ref), `${id} -> ${ref}`).toBe(true);
      }
      if (rule.racialProfile) expect(findRacialMaximum(rule.racialProfile), `${id} -> ${rule.racialProfile}`).toBeDefined();
    }
    for (const [id, rule] of Object.entries(WARBAND_RULES)) {
      const listed = [...(Array.isArray(rule.hiredSwords?.allow) ? rule.hiredSwords.allow : []), ...(rule.hiredSwords?.deny ?? [])];
      for (const ref of listed) expect(swordIds.has(ref), `${id} -> ${ref}`).toBe(true);
      for (const ref of [rule.exploration?.rollTwoKeepOneWith, rule.income?.bandShiftWith]) if (ref) expect(unitIds.has(ref), `${id} -> ${ref}`).toBe(true);
    }
  });
});

describe("experience", () => {
  it("animals and the undead gain none; ogres advance at half rate", () => {
    expect(unitGainsExperience("skaven_giant_rats")).toBe(false);
    expect(unitGainsExperience("undead_zombies")).toBe(false);
    expect(unitGainsExperience("mercenaries_reikland_warriors")).toBe(true);
    expect(xpThresholds("hero", "half").slice(0, 4)).toEqual([4, 8, 12, 16]);
    expect(advancesEarned(0, 8, "hero", "half")).toBe(2);
    expect(nextThreshold(9, "hero", "half")).toBe(12);
    expect(unitRules("ostlander_ogre").advanceRate).toBe("half");
  });
});

describe("recruitment and the builder", () => {
  const REIKLAND = findWarbandTemplate("mercenaries_reikland")!;
  it("gives Reikland Marksmen their +1 BS and Marienburgers 600 gc", () => {
    const marksmen = findUnitTemplate(REIKLAND, "mercenaries_reikland_marksmen")!;
    expect(unitStartingStats(marksmen).BS).toBe(marksmen.stats.BS + 1);
    const r = recruitHenchmen(warband(REIKLAND.id, [], [], { gold: 500 }), REIKLAND, "mercenaries_reikland_marksmen", "Eyes", 2, "eyes");
    expect(r.value.warband.henchmenGroups[0].stats.BS).toBe(marksmen.stats.BS + 1);
    expect(newWarbandDraft(findWarbandTemplate("mercenaries_marienburg")!, "Rich").startingGold).toBe(600);
    expect(newWarbandDraft(REIKLAND, "Plain").startingGold).toBe(500);
  });
  it("adds a unit's starting skills on hire", () => {
    const carnival = findWarbandTemplate("carnival_of_chaos")!;
    const r = recruitHero(warband(carnival.id, [], [], { gold: 500 }), carnival, "carnival_of_chaos_brutes", "Bruno", "b1");
    expect(r.value.heroes[0].skillIds).toEqual(["strongman"]);
  });
  it("rates Maneater ogres as large creatures", () => {
    const maneaters = findWarbandTemplate("maneaters")!;
    expect(unitIsLarge(findUnitTemplate(maneaters, "maneaters_captain"))).toBe(true);
    expect(unitIsLarge(findUnitTemplate(maneaters, "maneaters_half_growns"))).toBe(false);
    expect(heroCapacity(findWarbandTemplate("outlaws_of_stirwood_forest")!)).toBe(5);
  });
});

describe("injuries", () => {
  it("a Troll never rolls, a Hobgoblin leaves on 1-3, everyone else dies on 1-2", () => {
    expect(henchmanInjuryException(group("t", "orc_mob_troll", 1))?.deadOn).toEqual([]);
    const hobs = group("h", "sons_of_hashut_hobgoblins", 4);
    expect(applyHenchmanInjury(hobs, 3).value?.size).toBe(3);
    expect(applyHenchmanInjury(hobs, 4).value?.size).toBe(4);
    expect(applyHenchmanInjury(hobs, 3).events[0].message).toContain("leaves");
    const lads = group("l", "mercenaries_reikland_warriors", 3);
    expect(applyHenchmanInjury(lads, 3).value?.size).toBe(3);
    expect(applyHenchmanInjury(lads, 2).value?.size).toBe(2);
  });
});

describe("exploration", () => {
  it("Dwarfs find an extra shard and Grave Robbers loot the fallen", () => {
    const dwarfs = warband("dwarf_treasure_hunters", [hero("n", "dwarf_treasure_hunters_noble")], []);
    expect(explorationBonuses(dwarfs, 2).shards).toBe(1);
    expect(explorationBonuses(dwarfs, 0).shards).toBe(0);
    const robbers = warband("grave_robbers", [hero("g", "grave_robbers_graver")], []);
    expect(explorationBonuses(robbers, 1, 3).gold).toBe(3);
  });
  it("the Ogre Hunter gives no die and Tomb Guardians get one more", () => {
    const ohp = warband("ogre_hunting_party", [hero("o", "ogre_hunting_party_ogre_hunter"), hero("t", "ogre_hunting_party_trappers")], []);
    expect(explorationDiceAllowed(ohp, { won: false, heroesOutOfAction: [] }).count).toBe(1);
    const tomb = warband("tomb_guardians", [hero("l", "tomb_guardians_tomb_lord")], []);
    const allowed = explorationDiceAllowed(tomb, { won: true, heroesOutOfAction: [] });
    expect(allowed.count).toBe(3);
    expect(allowed.reason).toContain("Home Ground");
  });
  it("Snotlings scavenge even with no hero standing", () => {
    const snots = warband("snotlings", [hero("b", "bullied_goblin")], []);
    expect(explorationDiceAllowed(snots, { won: false, heroesOutOfAction: ["b"] }).count).toBe(1);
  });
});

describe("income and rating", () => {
  it("an Ogre eats for two, Snotlings count as half, Hochlanders sell as a bigger band", () => {
    const ost = warband("ostlander_mercenaries", [hero("e", "ostlander_elder")], [group("o", "ostlander_ogre", 1), group("k", "ostlander_kin", 2)]);
    expect(incomeSize(ost)).toMatchObject({ size: 5, headCount: 4 });
    const snots = warband("snotlings", [hero("b", "bullied_goblin")], [group("m", "snotling_mobs", 9)]);
    expect(incomeSize(snots).size).toBe(5);
    expect(warbandRating(snots).notes.join(" ")).toContain("0.5x");
    const hochland = warband("hochland_bandits", [hero("p", "hochland_bandits_bandit_prince")], [group("t", "hochland_bandits_thug", 2)]);
    expect(incomeSize(hochland).bandShift).toBe(1);
    // 3 warriors sell 1 shard for 45 gc; a band larger it is 40.
    expect(wyrdstoneQuote(hochland, 1)).toBe(40);
    expect(wyrdstoneQuote(hochland, 1, { sizeOverride: 3 })).toBe(45);
  });
  it("Snotling mobs count as one model each", () => {
    const ng = warband("night_goblins", [hero("b", "night_goblins_big_boss")], [group("m", "night_goblins_snotling_mob", 5)]);
    expect(incomeSize(ng).size).toBe(2);
  });
});

describe("upkeep", () => {
  it("a Troll wants feeding after every battle and leaves when unpaid", () => {
    const orcs = warband("orc_mob", [hero("b", "orc_mob_boss")], [group("t", "orc_mob_troll", 1)], { gold: 10 });
    expect(henchmanUpkeepDue(orcs)).toEqual([expect.objectContaining({ groupId: "t", gold: 15 })]);
    const unpaid = payHenchmanUpkeep(orcs, "t");
    expect(unpaid.value.paid).toBe(false);
    expect(unpaid.value.warband.henchmenGroups[0].size).toBe(0);
    const paid = payHenchmanUpkeep({ ...orcs, gold: 20 }, "t");
    expect(paid.value).toMatchObject({ paid: true, warband: expect.objectContaining({ gold: 5 }) });
  });
});

describe("racial maxima", () => {
  it("caps a Necrarch with its own row and a Gnoblar Trapper as a Goblin", () => {
    expect(resolveRacialProfile(hero("v", "necrarchs_necrarch_vampire"), "necrarchs_the_soul_stealers").value.profile).toBe("Necrarch Vampire");
    expect(resolveRacialProfile(hero("t", "ogre_hunting_party_trappers"), "ogre_hunting_party").value.profile).toBe("Goblin");
    expect(resolveRacialProfile(hero("o", "ogre_hunting_party_ogre_hunter"), "ogre_hunting_party").value.profile).toBe("Ogre");
  });
});

import { describe, expect, it } from "vitest";
import { findWarbandTemplate } from "../../data/warbandTemplates";
import {
  addDraftEquipment,
  addDraftGroup,
  addDraftHero,
  draftCosts,
  draftToCreatePayload,
  draftToRosterWarband,
  equipmentOptionsFor,
  newWarbandDraft,
  removeDraftEquipment,
  removeDraftGroup,
  withFreeDagger,
  removeDraftHero,
  renameDraftGroup,
  renameDraftHero,
  setDraftEquipmentCost,
  setDraftGroupSize,
  unitIsLarge,
  validateDraft,
  type EquipmentOption,
  type WarbandDraft,
} from "../builder";
import { parseEquipmentCost } from "../equipmentCost";
import { RulesError } from "../errors";
import { warbandRating } from "../rating";

const REIKLAND = findWarbandTemplate("mercenaries_reikland")!;
const CAPTAIN = "mercenaries_reikland_captain";
const CHAMPIONS = "mercenaries_reikland_champions";
const YOUNGBLOODS = "mercenaries_reikland_youngbloods";
const WARRIORS = "mercenaries_reikland_warriors";
const MARKSMEN = "mercenaries_reikland_marksmen";

const MERC_OPTIONS = equipmentOptionsFor(REIKLAND, CAPTAIN);
const MARKSMAN_OPTIONS = equipmentOptionsFor(REIKLAND, MARKSMEN);

function option(options: EquipmentOption[], name: string): EquipmentOption {
  const found = options.find((o) => o.name === name);
  if (!found) throw new Error(`no option ${name}`);
  return found;
}

const DAGGER = option(MERC_OPTIONS, "Dagger");
const SWORD = option(MERC_OPTIONS, "Sword");
const MACE = option(MERC_OPTIONS, "Mace");
const SPEAR = option(MERC_OPTIONS, "Spear");
const PISTOL = option(MERC_OPTIONS, "Pistol");
const LIGHT_ARMOUR = option(MERC_OPTIONS, "Light armour");
const BOW = option(MARKSMAN_OPTIONS, "Bow");
const MARKSMAN_DAGGER = option(MARKSMAN_OPTIONS, "Dagger");

const hero = (id: string) => ({ kind: "hero", id }) as const;
const group = (id: string) => ({ kind: "group", id }) as const;

/**
 * The reference build: captain + 2 champions + 2 youngbloods + 3 warriors + 2 marksmen (10 models).
 * Hires: 60 + 70 + 30 + 75 + 50 = 285. Equipment: captain dagger (free) + sword 10; champions a sword
 * each 20; youngbloods dagger (free) + mace 3 each 6; warriors dagger (free) + spear 10 x3 = 30;
 * marksmen dagger (free) + bow 10 x2 = 20. Total 285 + 86 = 371, leaving 129 of 500.
 */
function reiklandBuild(): WarbandDraft {
  let d = newWarbandDraft(REIKLAND, "The Reikland Rovers", "captain");
  d = renameDraftHero(d, "captain", "Kurt");
  d = addDraftHero(d, REIKLAND, CHAMPIONS, "champ1", "Hans");
  d = addDraftHero(d, REIKLAND, CHAMPIONS, "champ2", "Otto");
  d = addDraftHero(d, REIKLAND, YOUNGBLOODS, "yb1", "Pip");
  d = addDraftHero(d, REIKLAND, YOUNGBLOODS, "yb2", "Wil");
  d = addDraftGroup(d, REIKLAND, WARRIORS, "warriors", 3, "The Lads");
  d = addDraftGroup(d, REIKLAND, MARKSMEN, "marksmen", 2, "The Eyes");

  d = addDraftEquipment(d, hero("captain"), DAGGER);
  d = addDraftEquipment(d, hero("captain"), SWORD);
  d = addDraftEquipment(d, hero("champ1"), SWORD);
  d = addDraftEquipment(d, hero("champ2"), SWORD);
  for (const yb of ["yb1", "yb2"]) {
    d = addDraftEquipment(d, hero(yb), DAGGER);
    d = addDraftEquipment(d, hero(yb), MACE);
  }
  d = addDraftEquipment(d, group("warriors"), DAGGER);
  d = addDraftEquipment(d, group("warriors"), SPEAR);
  d = addDraftEquipment(d, group("marksmen"), MARKSMAN_DAGGER);
  d = addDraftEquipment(d, group("marksmen"), BOW);
  return d;
}

describe("newWarbandDraft", () => {
  it("starts with the template's gold and the mandatory leader", () => {
    const d = newWarbandDraft(REIKLAND, "Test");
    expect(d.name).toBe("Test");
    expect(d.warbandTemplateId).toBe("mercenaries_reikland");
    expect(d.startingGold).toBe(500);
    expect(d.heroes).toHaveLength(1);
    expect(d.heroes[0]).toEqual({ id: "leader", name: "Mercenary Captain", unitTemplateId: CAPTAIN, equipment: [] });
    expect(d.groups).toEqual([]);
    expect(d.notes).toBe("");
  });

  it("uses a template's own starting gold when it differs from 500", () => {
    const richer = findWarbandTemplate("mercenaries_reikland")!;
    const custom = { ...richer, composition: { minModels: 3, maxModels: 15, startingGold: 600, text: "" } };
    expect(newWarbandDraft(custom, "Rich").startingGold).toBe(600);
    const unstated = { ...richer, composition: undefined };
    expect(newWarbandDraft(unstated, "Default").startingGold).toBe(500);
  });
});

describe("heroes and groups", () => {
  it("adds, renames and removes heroes without mutating the input", () => {
    const base = newWarbandDraft(REIKLAND, "Test");
    const withChamp = addDraftHero(base, REIKLAND, CHAMPIONS, "c1");
    expect(base.heroes).toHaveLength(1);
    expect(withChamp.heroes).toHaveLength(2);
    expect(withChamp.heroes[1].name).toBe("Champions");
    const renamed = renameDraftHero(withChamp, "c1", "Hans");
    expect(renamed.heroes[1].name).toBe("Hans");
    expect(withChamp.heroes[1].name).toBe("Champions");
    expect(removeDraftHero(renamed, "c1").heroes.map((h) => h.id)).toEqual(["leader"]);
  });

  it("adds, resizes, renames and removes groups", () => {
    const base = newWarbandDraft(REIKLAND, "Test");
    const g = addDraftGroup(base, REIKLAND, WARRIORS, "w", 3);
    expect(g.groups[0]).toEqual({ id: "w", name: "Warriors", unitTemplateId: WARRIORS, size: 3, equipment: [] });
    expect(setDraftGroupSize(g, "w", 5).groups[0].size).toBe(5);
    expect(renameDraftGroup(g, "w", "Lads").groups[0].name).toBe("Lads");
    expect(removeDraftGroup(g, "w").groups).toEqual([]);
    expect(base.groups).toEqual([]);
  });

  it("rejects wrong roles, unknown units, duplicate ids and bad sizes", () => {
    const base = newWarbandDraft(REIKLAND, "Test");
    expect(() => addDraftHero(base, REIKLAND, WARRIORS, "x")).toThrow(RulesError);
    expect(() => addDraftGroup(base, REIKLAND, CHAMPIONS, "x", 1)).toThrow(RulesError);
    expect(() => addDraftHero(base, REIKLAND, "nope", "x")).toThrow(RulesError);
    expect(() => addDraftHero(base, REIKLAND, CHAMPIONS, "leader")).toThrow(RulesError);
    expect(() => addDraftGroup(base, REIKLAND, WARRIORS, "w", 0)).toThrow(RulesError);
    expect(() => setDraftGroupSize(addDraftGroup(base, REIKLAND, WARRIORS, "w", 2), "w", 1.5)).toThrow(RulesError);
    expect(() => renameDraftHero(base, "missing", "x")).toThrow(RulesError);
  });
});

describe("equipmentOptionsFor", () => {
  it("lists the unit's equipment list with parsed costs and resolved items", () => {
    expect(MERC_OPTIONS.map((o) => o.name)).toEqual([
      "Dagger", "Mace", "Hammer", "Axe", "Sword", "Morning star", "Double-handed weapon", "Spear", "Halberd",
      "Crossbow", "Pistol", "Duelling Pistol", "Bow",
      "Light armour", "Heavy armour", "Shield", "Buckler", "Helmet",
    ]);
    expect(DAGGER.cost).toMatchObject({ kind: "firstFree", amount: 2 });
    expect(DAGGER.item?.id).toBe("dagger");
    expect(DAGGER.section).toBe("melee");
    expect(SWORD.cost).toMatchObject({ kind: "fixed", amount: 10 });
    expect(PISTOL.cost).toMatchObject({ kind: "fixed", amount: 15, braceAmount: 30 });
    expect(PISTOL.section).toBe("missile");
    expect(LIGHT_ARMOUR.section).toBe("armour");
    expect(LIGHT_ARMOUR.item?.id).toBe("light_armour");
  });

  it("marksmen get their own list", () => {
    expect(MARKSMAN_OPTIONS.map((o) => o.name)).toContain("Long bow");
    expect(option(MARKSMAN_OPTIONS, "Long bow").item?.id).toBe("longbow");
    expect(MARKSMAN_OPTIONS.map((o) => o.name)).not.toContain("Halberd");
  });

  it("throws for an unknown unit", () => {
    expect(() => equipmentOptionsFor(REIKLAND, "nope")).toThrow(RulesError);
  });
});

describe("equipment", () => {
  it("merges same-item stacks and removes down to zero", () => {
    let d = newWarbandDraft(REIKLAND, "Test");
    d = addDraftEquipment(d, hero("leader"), SWORD);
    d = addDraftEquipment(d, hero("leader"), SWORD);
    expect(d.heroes[0].equipment).toEqual([{ itemId: "sword", customName: undefined, quantity: 2, unitCost: 10, costText: "10 gc" }]);
    d = removeDraftEquipment(d, hero("leader"), SWORD);
    expect(d.heroes[0].equipment[0].quantity).toBe(1);
    d = removeDraftEquipment(d, hero("leader"), SWORD);
    expect(d.heroes[0].equipment).toEqual([]);
    expect(() => removeDraftEquipment(d, hero("leader"), SWORD)).toThrow(RulesError);
  });

  it("keeps unresolved names as custom items with the list price", () => {
    const custom: EquipmentOption = { name: "Pry Bar", cost: parseEquipmentCost("10 gc"), item: undefined, section: "melee" };
    const d = addDraftEquipment(newWarbandDraft(REIKLAND, "Test"), hero("leader"), custom, 2);
    expect(d.heroes[0].equipment).toEqual([{ itemId: null, customName: "Pry Bar", quantity: 2, unitCost: 10, costText: "10 gc" }]);
    expect(draftCosts(d, REIKLAND).equipment).toBe(20);
  });

  it("rejects bad quantities and unknown subjects", () => {
    const d = newWarbandDraft(REIKLAND, "Test");
    expect(() => addDraftEquipment(d, hero("leader"), SWORD, 0)).toThrow(RulesError);
    expect(() => addDraftEquipment(d, hero("nobody"), SWORD)).toThrow(RulesError);
    expect(() => addDraftEquipment(d, group("nobody"), SWORD)).toThrow(RulesError);
  });
});

describe("draftCosts", () => {
  it("adds up the reference Reikland build", () => {
    const costs = draftCosts(reiklandBuild(), REIKLAND);
    expect(costs.hires).toBe(285);
    expect(costs.equipment).toBe(86);
    expect(costs.total).toBe(371);
    expect(costs.remaining).toBe(129);
    expect(costs.unknownLines).toBe(0);
    const amount = (label: string) => costs.lines.find((l) => l.label === label)?.amount;
    expect(amount("Kurt (Mercenary Captain)")).toBe(60);
    expect(amount("Hans (Champions)")).toBe(35);
    expect(amount("Pip (Youngbloods)")).toBe(15);
    expect(amount("The Lads (3 x Warriors)")).toBe(75);
    expect(amount("The Eyes (2 x Marksmen)")).toBe(50);
    expect(amount("Kurt: dagger x1")).toBe(0);
    expect(amount("Kurt: sword x1")).toBe(10);
    expect(amount("The Lads: dagger x1 x 3")).toBe(0);
    expect(amount("The Lads: spear x1 x 3")).toBe(30);
    expect(amount("The Eyes: bow x1 x 2")).toBe(20);
  });

  it("charges a second dagger per warrior and a brace of pistols as a pair", () => {
    let d = newWarbandDraft(REIKLAND, "Test");
    d = addDraftEquipment(d, hero("leader"), DAGGER, 2);
    d = addDraftEquipment(d, hero("leader"), PISTOL, 2);
    d = addDraftGroup(d, REIKLAND, WARRIORS, "w", 4);
    d = addDraftEquipment(d, group("w"), DAGGER, 2);
    const costs = draftCosts(d, REIKLAND);
    // Captain: 2 daggers = 0 + 2; brace = 30. Warriors: 4 x (0 + 2) = 8.
    expect(costs.equipment).toBe(2 + 30 + 8);
    expect(costs.hires).toBe(60 + 100);
  });

  it("reports unknown prices and accepts a player-entered one", () => {
    const gromril: EquipmentOption = {
      name: "Gromril weapon",
      cost: parseEquipmentCost("3 times the cost"),
      item: undefined,
      section: "melee",
    };
    let d = addDraftEquipment(newWarbandDraft(REIKLAND, "Test"), hero("leader"), gromril);
    let costs = draftCosts(d, REIKLAND);
    expect(costs.unknownLines).toBe(1);
    expect(costs.equipment).toBe(0);
    expect(costs.lines.find((l) => l.label.includes("Gromril"))?.amount).toBeNull();
    expect(validateDraft(d, REIKLAND).map((p) => p.code)).toContain("builder.unknownCost");

    d = setDraftEquipmentCost(d, hero("leader"), gromril, 30);
    costs = draftCosts(d, REIKLAND);
    expect(costs.unknownLines).toBe(0);
    expect(costs.equipment).toBe(30);
    expect(validateDraft(d, REIKLAND).map((p) => p.code)).not.toContain("builder.unknownCost");
  });
});

describe("draftToRosterWarband", () => {
  it("builds a roster with template stats, xp, skill tables and totals", () => {
    const roster = draftToRosterWarband(reiklandBuild(), REIKLAND, { warbandId: "wb-1" });
    expect(roster.id).toBe("wb-1");
    expect(roster.name).toBe("The Reikland Rovers");
    expect(roster.gold).toBe(129);
    expect(roster.wyrdstone).toBe(0);
    expect(roster.veteranPool).toBeNull();
    expect(roster.hiredSwords).toEqual([]);
    expect(roster.stash).toEqual([]);

    const captain = roster.heroes[0];
    expect(captain).toMatchObject({
      id: "captain",
      name: "Kurt",
      unitTemplateId: CAPTAIN,
      stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
      xp: 20,
      levelUps: 8,
      skillTableIds: ["combat", "shooting", "academic", "strength", "speed"],
      skillIds: [],
      spellIds: [],
      injuries: [],
      flags: {},
      isLarge: false,
      status: "active",
    });
    expect(captain.equipment).toEqual([
      { itemId: "dagger", quantity: 1 },
      { itemId: "sword", quantity: 1 },
    ]);
    expect(roster.heroes.find((h) => h.id === "champ1")?.xp).toBe(8);
    expect(roster.heroes.find((h) => h.id === "yb1")?.xp).toBe(0);

    const warriors = roster.henchmenGroups[0];
    expect(warriors).toMatchObject({ id: "warriors", name: "The Lads", size: 3, xp: 0, levelUps: 0, statIncreases: {}, isLarge: false });
    expect(warriors.equipment).toEqual([
      { itemId: "dagger", quantity: 3 },
      { itemId: "spear", quantity: 3 },
    ]);
    expect(warbandRating(roster).total).toBe(10 * 5 + 20 + 8 + 8);
  });

  it("flags large creatures from the unit's special rules", () => {
    const skaven = findWarbandTemplate("skaven_of_clan_moulder")!;
    const ratOgre = skaven.henchmanTemplates.find((u) => u.id === "rat_ogres")!;
    expect(unitIsLarge(ratOgre)).toBe(true);
    expect(unitIsLarge(REIKLAND.heroTemplates[0])).toBe(false);
    expect(unitIsLarge(undefined)).toBe(false);
    const d = addDraftGroup(newWarbandDraft(skaven, "Moulder"), skaven, "rat_ogres", "ro", 1);
    expect(draftToRosterWarband(d, skaven).henchmenGroups[0].isLarge).toBe(true);
  });
});

describe("validateDraft", () => {
  it("is clean for the reference build", () => {
    expect(validateDraft(reiklandBuild(), REIKLAND)).toEqual([]);
  });

  it("rejects two captains", () => {
    const d = addDraftHero(reiklandBuild(), REIKLAND, CAPTAIN, "captain2", "Second");
    const codes = validateDraft(d, REIKLAND).map((p) => p.code);
    expect(codes).toContain("roster.multipleLeaders");
  });

  it("rejects overspending", () => {
    let d = reiklandBuild();
    d = addDraftEquipment(d, hero("captain"), option(MERC_OPTIONS, "Heavy armour"), 3); // 150 > 129 left
    const problems = validateDraft(d, REIKLAND);
    const codes = problems.map((p) => p.code);
    expect(codes).toContain("builder.overspent");
    expect(codes).toContain("roster.negativeGold");
    expect(problems.find((p) => p.code === "builder.overspent")?.message).toContain("21 gc over budget");
  });

  it("rejects too few models at creation", () => {
    const d = newWarbandDraft(REIKLAND, "Lonely");
    expect(validateDraft(d, REIKLAND).map((p) => p.code)).toContain("roster.tooFewModels");
  });

  it("rejects too many of a unit type", () => {
    let d = reiklandBuild();
    d = addDraftHero(d, REIKLAND, CHAMPIONS, "champ3", "Third");
    const codes = validateDraft(d, REIKLAND).map((p) => p.code);
    expect(codes).toContain("roster.unitLimit");
    expect(codes).toContain("roster.tooManyHeroes");
  });

  it("requires names", () => {
    let d = reiklandBuild();
    d = { ...d, name: "  " };
    d = renameDraftHero(d, "champ1", "");
    d = renameDraftGroup(d, "warriors", " ");
    const problems = validateDraft(d, REIKLAND);
    expect(problems.map((p) => p.code)).toContain("builder.emptyName");
    const unnamed = problems.filter((p) => p.code === "builder.unnamedWarrior");
    expect(unnamed.map((p) => p.subjectId).sort()).toEqual(["champ1", "warriors"]);
  });

  it("reports unknown costs with the subject", () => {
    const gromril: EquipmentOption = { name: "Gromril weapon", cost: parseEquipmentCost("3 times the cost"), item: undefined, section: "melee" };
    const d = addDraftEquipment(reiklandBuild(), hero("champ2"), gromril);
    const problem = validateDraft(d, REIKLAND).find((p) => p.code === "builder.unknownCost");
    expect(problem?.subjectId).toBe("champ2");
    expect(problem?.message).toContain("3 times the cost");
  });
});

describe("draftToCreatePayload", () => {
  it("produces the snake_case create payload with group totals", () => {
    const payload = draftToCreatePayload(reiklandBuild(), REIKLAND);
    expect(payload.name).toBe("The Reikland Rovers");
    expect(payload.type_rules_id).toBe("mercenaries_reikland");
    expect(payload.gold).toBe(129);
    expect(payload.notes).toBe("");
    expect(payload.stash).toEqual([]);

    expect(payload.heroes).toHaveLength(5);
    expect(payload.heroes[0]).toEqual({
      name: "Kurt",
      unit_type_rules_id: CAPTAIN,
      stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
      xp: 20,
      level_ups: 8,
      skill_tables: ["combat", "shooting", "academic", "strength", "speed"],
      is_large: false,
      sort_order: 0,
      equipment: [
        { item_rules_id: "dagger", custom_name: null, quantity: 1 },
        { item_rules_id: "sword", custom_name: null, quantity: 1 },
      ],
    });
    expect(payload.heroes.map((h) => h.sort_order)).toEqual([0, 1, 2, 3, 4]);

    expect(payload.henchman_groups).toHaveLength(2);
    expect(payload.henchman_groups[1]).toEqual({
      name: "The Eyes",
      unit_type_rules_id: MARKSMEN,
      size: 2,
      // Reikland Marksmen have +1 BS (warband rule, applied at hire).
      stats: { M: 4, WS: 3, BS: 4, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
      xp: 0,
      level_ups: 0,
      is_large: false,
      sort_order: 1,
      equipment: [
        { item_rules_id: "dagger", custom_name: null, quantity: 2 },
        { item_rules_id: "bow", custom_name: null, quantity: 2 },
      ],
    });
  });

  it("carries custom names for unresolved items", () => {
    const custom: EquipmentOption = { name: "Pry Bar", cost: parseEquipmentCost("10 gc"), item: undefined, section: "melee" };
    const d = addDraftEquipment(newWarbandDraft(REIKLAND, "Test"), hero("leader"), custom);
    expect(draftToCreatePayload(d, REIKLAND).heroes[0].equipment).toEqual([
      { item_rules_id: null, custom_name: "Pry Bar", quantity: 1 },
    ]);
  });
});

describe("startingLevelUps", () => {
  it("treats starting experience as already-taken advances", () => {
    const template = findWarbandTemplate("mercenaries_reikland")!;
    const draft = newWarbandDraft(template, "Levels");
    const roster = draftToRosterWarband(draft, template);
    const captain = roster.heroes[0]!;
    expect(captain.xp).toBe(20);
    expect(captain.levelUps).toBe(8); // thresholds 2,4,6,8,11,14,17,20
    const payload = draftToCreatePayload(draft, template);
    expect(payload.heroes[0]!.level_ups).toBe(8);
  });
});

describe("withFreeDagger", () => {
  it("hands a new hero and a new group the free dagger from their list, once", () => {
    let d = newWarbandDraft(REIKLAND, "Daggers", "captain");
    d = addDraftHero(d, REIKLAND, CHAMPIONS, "champ1");
    d = addDraftGroup(d, REIKLAND, WARRIORS, "lads", 3);
    d = withFreeDagger(d, REIKLAND, hero("champ1"));
    d = withFreeDagger(d, REIKLAND, { kind: "group", id: "lads" });
    expect(d.heroes.find((h) => h.id === "champ1")?.equipment).toEqual([expect.objectContaining({ itemId: "dagger", quantity: 1 })]);
    expect(d.groups[0].equipment).toEqual([expect.objectContaining({ itemId: "dagger", quantity: 1 })]);
    // The free dagger costs nothing; a second call adds nothing.
    const again = withFreeDagger(d, REIKLAND, hero("champ1"));
    expect(again).toBe(d);
    expect(draftCosts(d, REIKLAND).equipment).toBe(0);
  });

  it("leaves a unit alone when it already carries something", () => {
    let d = newWarbandDraft(REIKLAND, "Daggers", "captain");
    d = addDraftEquipment(d, hero("captain"), SWORD);
    expect(withFreeDagger(d, REIKLAND, hero("captain"))).toBe(d);
  });
});

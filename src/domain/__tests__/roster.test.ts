import { describe, expect, it } from "vitest";
import type { RosterHenchmanGroup, RosterHero, RosterHiredSword } from "../../rules/types/roster";
import type { HeroRow } from "../rows";
import {
  groupPatchFromRoster,
  heroPatchFromRoster,
  hiredSwordPatchFromRoster,
  toRosterHeroStatus,
  toRosterHiredSwordStatus,
  toRosterWarband,
} from "../roster";
import {
  CAPTAIN_ID,
  KLAUS_ID,
  MARKSMEN_ID,
  MARTA_ID,
  PIETER_ID,
  REIKLAND_ID,
  T0,
  WATCHMEN_ID,
  captain,
  reiklandGroups,
  reiklandHeroes,
  reiklandItems,
  reiklandWatch,
} from "./fixtures";

const OGRE_ID = "bbbbbbbb-0000-4000-8000-000000000099";

const ogre: HeroRow = {
  id: OGRE_ID,
  warband_id: REIKLAND_ID,
  name: "Grom",
  is_hired_sword: true,
  unit_type_rules_id: null,
  hired_sword_rules_id: "ogre_bodyguard",
  stats: { M: 6, WS: 3, BS: 2, S: 4, T: 4, W: 3, I: 3, A: 2, Ld: 7 },
  xp: 0,
  level_ups: 0,
  skill_tables: [],
  skills: [],
  spells: [],
  injuries: [],
  flags: {},
  equipment_locked: true,
  is_large: true,
  status: "active",
  notes: "",
  sort_order: 10,
  created_at: T0,
  updated_at: T0,
};

describe("toRosterWarband on the seed's Reikland Watch", () => {
  const roster = toRosterWarband(reiklandWatch, reiklandHeroes, reiklandGroups, reiklandItems);

  it("maps the warband columns", () => {
    expect(roster.id).toBe(REIKLAND_ID);
    expect(roster.name).toBe("Reikland Watch");
    expect(roster.warbandTemplateId).toBe("mercenaries_reikland");
    expect(roster.gold).toBe(35);
    expect(roster.wyrdstone).toBe(0);
    expect(roster.veteranPool).toBeNull();
    expect(roster.notes).toBe("Seed warband. Fresh from Altdorf.");
  });

  it("has 4 heroes in sort order and no hired swords", () => {
    expect(roster.heroes.map((h) => h.id)).toEqual([CAPTAIN_ID, MARTA_ID, KLAUS_ID, PIETER_ID]);
    expect(roster.hiredSwords).toEqual([]);
    const cap = roster.heroes[0]!;
    expect(cap).toMatchObject({
      name: "Captain Ulrich Brandt",
      unitTemplateId: "mercenaries_reikland_captain",
      stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
      xp: 20,
      levelUps: 0,
      skillTableIds: ["combat", "shooting", "academic", "strength", "speed"],
      skillIds: [],
      spellIds: [],
      injuries: [],
      flags: {},
      isLarge: false,
      status: "active",
    });
    expect(cap.notes).toBeUndefined();
  });

  it("respects sort_order regardless of input order", () => {
    const shuffled = [...reiklandHeroes].reverse();
    const out = toRosterWarband(reiklandWatch, shuffled, [...reiklandGroups].reverse(), reiklandItems);
    expect(out.heroes.map((h) => h.id)).toEqual([CAPTAIN_ID, MARTA_ID, KLAUS_ID, PIETER_ID]);
    expect(out.henchmenGroups.map((g) => g.id)).toEqual([WATCHMEN_ID, MARKSMEN_ID]);
  });

  it("has 2 henchman groups with their equipment", () => {
    expect(roster.henchmenGroups).toHaveLength(2);
    const [watchmen, marksmen] = roster.henchmenGroups;
    expect(watchmen).toMatchObject({
      name: "Watchmen",
      unitTemplateId: "mercenaries_reikland_warriors",
      size: 3,
      statIncreases: {},
      equipment: [{ itemId: "dagger", quantity: 3 }],
    });
    expect(marksmen).toMatchObject({
      name: "Marksmen",
      size: 2,
      equipment: [
        { itemId: "bow", quantity: 2 },
        { itemId: "dagger", quantity: 2 },
      ],
    });
  });

  it("distributes items to their holders", () => {
    const byId = new Map(roster.heroes.map((h) => [h.id, h]));
    expect(byId.get(CAPTAIN_ID)!.equipment).toEqual([
      { itemId: "sword", quantity: 1 },
      { itemId: "dagger", quantity: 1 },
      { itemId: "light_armour", quantity: 1 },
    ]);
    expect(byId.get(MARTA_ID)!.equipment).toEqual([
      { itemId: "sword", quantity: 1 },
      { itemId: "dagger", quantity: 1 },
    ]);
    expect(byId.get(KLAUS_ID)!.equipment).toEqual([{ itemId: "dagger", quantity: 1 }]);
    expect(byId.get(PIETER_ID)!.equipment).toEqual([{ itemId: "dagger", quantity: 1 }]);
    const total =
      roster.heroes.reduce((n, h) => n + h.equipment.length, 0) +
      roster.henchmenGroups.reduce((n, g) => n + g.equipment.length, 0) +
      roster.stash.length;
    expect(total).toBe(reiklandItems.length);
  });

  it("the stash holds exactly one dagger", () => {
    expect(roster.stash).toEqual([{ itemId: "dagger", quantity: 1 }]);
  });

  it("carries custom names and notes on items only when set", () => {
    const relic = {
      ...reiklandItems[reiklandItems.length - 1]!,
      id: "eeeeeeee-0000-4000-8000-000000000999",
      item_rules_id: null,
      custom_name: "Sigmarite relic",
      notes: "Found in the chapel",
    };
    const out = toRosterWarband(reiklandWatch, reiklandHeroes, reiklandGroups, [...reiklandItems, relic]);
    expect(out.stash).toEqual([
      { itemId: "dagger", quantity: 1 },
      {
        itemId: null,
        customName: "Sigmarite relic",
        quantity: 1,
        notes: "Found in the chapel",
      },
    ]);
  });

  it("leaves out items whose holder was not supplied", () => {
    const out = toRosterWarband(reiklandWatch, reiklandHeroes.slice(1), reiklandGroups, reiklandItems);
    expect(out.heroes).toHaveLength(3);
    expect(out.stash).toEqual([{ itemId: "dagger", quantity: 1 }]);
  });
});

describe("hired swords", () => {
  it("is_hired_sword rows become hiredSwords with their equipment", () => {
    const club = {
      ...reiklandItems[0]!,
      id: "eeeeeeee-0000-4000-8000-000000000998",
      holder_type: "hero" as const,
      holder_id: OGRE_ID,
      item_rules_id: "club",
    };
    const out = toRosterWarband(reiklandWatch, [...reiklandHeroes, ogre], reiklandGroups, [...reiklandItems, club]);
    expect(out.heroes).toHaveLength(4);
    expect(out.hiredSwords).toEqual([
      {
        id: OGRE_ID,
        hiredSwordId: "ogre_bodyguard",
        name: "Grom",
        stats: ogre.stats,
        xp: 0,
        levelUps: 0,
        skillIds: [],
        injuries: [],
        flags: {},
        equipment: [{ itemId: "club", quantity: 1 }],
        status: "active",
      },
    ]);
  });

  it("maps captured and retired to left; active, dead and left pass through", () => {
    expect(toRosterHiredSwordStatus("active")).toBe("active");
    expect(toRosterHiredSwordStatus("dead")).toBe("dead");
    expect(toRosterHiredSwordStatus("left")).toBe("left");
    expect(toRosterHiredSwordStatus("captured")).toBe("left");
    expect(toRosterHiredSwordStatus("retired")).toBe("left");

    const out = toRosterWarband(reiklandWatch, [{ ...ogre, status: "captured" }], [], []);
    expect(out.hiredSwords[0]!.status).toBe("left");
  });

  it("a hero who left is kept as retired", () => {
    expect(toRosterHeroStatus("left")).toBe("retired");
    expect(toRosterHeroStatus("captured")).toBe("captured");
    expect(toRosterHeroStatus("dead")).toBe("dead");
    const out = toRosterWarband(reiklandWatch, [{ ...captain, status: "left" }], [], []);
    expect(out.heroes[0]!.status).toBe("retired");
  });
});

describe("patches from the roster model", () => {
  it("heroPatchFromRoster returns only the mutable columns", () => {
    const hero: RosterHero = {
      id: CAPTAIN_ID,
      name: "Captain Ulrich Brandt",
      unitTemplateId: "mercenaries_reikland_captain",
      stats: { M: 4, WS: 5, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
      xp: 22,
      levelUps: 1,
      skillTableIds: ["combat", "shooting", "academic", "strength", "speed"],
      skillIds: ["strike_to_injure"],
      spellIds: [],
      injuries: [
        {
          injuryCode: "leg_wound",
          name: "Leg Wound",
          rolled: { d66: 11 },
          effect: "-1 Movement",
        },
      ],
      flags: { missNextGames: 1 },
      equipment: [{ itemId: "sword", quantity: 1 }],
      status: "active",
    };
    expect(heroPatchFromRoster(hero)).toEqual({
      stats: hero.stats,
      xp: 22,
      level_ups: 1,
      skill_tables: hero.skillTableIds,
      skills: ["strike_to_injure"],
      spells: [],
      injuries: hero.injuries,
      flags: { missNextGames: 1 },
      status: "active",
      notes: "",
    });
    expect(heroPatchFromRoster({ ...hero, notes: "Limping", status: "dead" })).toMatchObject({
      notes: "Limping",
      status: "dead",
    });
  });

  it("hiredSwordPatchFromRoster keeps left as left", () => {
    const hs: RosterHiredSword = {
      id: OGRE_ID,
      hiredSwordId: "ogre_bodyguard",
      name: "Grom",
      stats: ogre.stats,
      xp: 3,
      levelUps: 0,
      skillIds: [],
      injuries: [],
      flags: {},
      equipment: [],
      status: "left",
    };
    expect(hiredSwordPatchFromRoster(hs)).toEqual({
      stats: ogre.stats,
      xp: 3,
      level_ups: 0,
      skills: [],
      injuries: [],
      flags: {},
      status: "left",
    });
  });

  it("groupPatchFromRoster returns only the mutable columns", () => {
    const group: RosterHenchmanGroup = {
      id: WATCHMEN_ID,
      name: "Watchmen",
      unitTemplateId: "mercenaries_reikland_warriors",
      size: 2,
      stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
      xp: 2,
      levelUps: 1,
      statIncreases: { WS: 1 },
      equipment: [{ itemId: "dagger", quantity: 3 }],
      notes: "One fell in the Stir",
      modelNames: ["Kurt", "Otto"],
    };
    expect(groupPatchFromRoster(group)).toEqual({
      stats: group.stats,
      xp: 2,
      level_ups: 1,
      size: 2,
      stat_increases: { WS: 1 },
      notes: "One fell in the Stir",
      model_names: ["Kurt", "Otto"],
    });
  });

  it("round-trips a hero through the roster model unchanged", () => {
    const roster = toRosterWarband(reiklandWatch, reiklandHeroes, reiklandGroups, reiklandItems);
    const patch = heroPatchFromRoster(roster.heroes[0]!);
    expect({ ...captain, ...patch }).toEqual(captain);
  });
});

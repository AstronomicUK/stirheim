import { describe, expect, it } from "vitest";
import type { RosterHenchmanGroup, RosterHero, RosterHiredSword, RosterWarband } from "../../rules/types/roster";
import { toRosterWarband } from "../roster";
import type { RosterChange } from "../rosterChange";
import { diffRoster, isUuid, stableJson, type RosterRows } from "../rosterDiff";
import type { HeroRow } from "../rows";
import {
  CAPTAIN_ID,
  KLAUS_ID,
  MARKSMEN_ID,
  PIETER_ID,
  REIKLAND_ID,
  T0,
  WATCHMEN_ID,
  reiklandGroups,
  reiklandHeroes,
  reiklandItems,
  reiklandWatch,
} from "./fixtures";

const NEW_HERO_ID = "ffffffff-0000-4000-8000-000000000001";
const NEW_HIRED_ID = "ffffffff-0000-4000-8000-000000000002";
const NEW_GROUP_ID = "ffffffff-0000-4000-8000-000000000003";
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
  status: "captured",
  notes: "",
  sort_order: 10,
  created_at: T0,
  updated_at: T0,
};

function rows(): RosterRows {
  return { warband: reiklandWatch, heroes: reiklandHeroes, groups: reiklandGroups, items: reiklandItems };
}

function roster(r: RosterRows = rows()): RosterWarband {
  return toRosterWarband(r.warband, r.heroes, r.groups, r.items);
}

function hero(w: RosterWarband, id: string): RosterHero {
  const h = w.heroes.find((x) => x.id === id);
  if (!h) throw new Error(`no hero ${id}`);
  return h;
}

function group(w: RosterWarband, id: string): RosterHenchmanGroup {
  const g = w.henchmenGroups.find((x) => x.id === id);
  if (!g) throw new Error(`no group ${id}`);
  return g;
}

function withHero(w: RosterWarband, id: string, patch: Partial<RosterHero>): RosterWarband {
  return { ...w, heroes: w.heroes.map((h) => (h.id === id ? { ...h, ...patch } : h)) };
}

function withGroup(w: RosterWarband, id: string, patch: Partial<RosterHenchmanGroup>): RosterWarband {
  return { ...w, henchmenGroups: w.henchmenGroups.map((g) => (g.id === id ? { ...g, ...patch } : g)) };
}

function ofTable(changes: RosterChange[], table: RosterChange["table"]): RosterChange[] {
  return changes.filter((c) => c.table === table);
}

function itemRow(id: string) {
  const row = reiklandItems.find((i) => i.id === id);
  if (!row) throw new Error(`no item ${id}`);
  return row;
}

describe("diffRoster", () => {
  it("is empty when the roster round-trips unchanged", () => {
    expect(diffRoster(rows(), roster())).toEqual([]);
  });

  it("is empty for a hired sword whose row status maps onto the same roster status", () => {
    const r: RosterRows = { ...rows(), heroes: [...reiklandHeroes, ogre] };
    // "captured" in the row reads as "left" on the roster; nothing to send.
    expect(diffRoster(r, roster(r))).toEqual([]);
  });

  it("sends only the treasury columns that changed", () => {
    const next = { ...roster(), gold: 12, notes: "Sold the spare dagger" };
    expect(diffRoster(rows(), next)).toEqual([
      { table: "warbands", op: "update", id: REIKLAND_ID, data: { gold: 12, notes: "Sold the spare dagger" } },
    ]);
  });

  it("patches a hero's stats and level_ups (an advance) with nothing else", () => {
    const w = roster();
    const captain = hero(w, CAPTAIN_ID);
    const next = withHero(w, CAPTAIN_ID, {
      stats: { ...captain.stats, WS: captain.stats.WS + 1 },
      levelUps: captain.levelUps + 1,
    });
    expect(diffRoster(rows(), next)).toEqual([
      {
        table: "heroes",
        op: "update",
        id: CAPTAIN_ID,
        data: { stats: { M: 4, WS: 5, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 }, level_ups: 1 },
      },
    ]);
  });

  it("patches skills, status and notes; ignores key order in jsonb shapes", () => {
    const w = roster();
    const next = withHero(w, KLAUS_ID, {
      skillIds: ["strike_to_injure"],
      status: "dead",
      notes: "Fell at the bridge.",
      flags: { causesFear: undefined },
    });
    expect(diffRoster(rows(), next)).toEqual([
      {
        table: "heroes",
        op: "update",
        id: KLAUS_ID,
        data: { skills: ["strike_to_injure"], status: "dead", notes: "Fell at the bridge." },
      },
    ]);
  });

  it("inserts a new hero with his items in one batch, carrying the client id", () => {
    const w = roster();
    const recruit: RosterHero = {
      id: NEW_HERO_ID,
      name: "Otto",
      unitTemplateId: "mercenaries_reikland_youngbloods",
      stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 6 },
      xp: 0,
      levelUps: 0,
      skillTableIds: ["combat", "speed"],
      skillIds: [],
      spellIds: [],
      injuries: [],
      flags: {},
      equipment: [{ itemId: "dagger", quantity: 1 }, { itemId: "sword", quantity: 1 }],
      status: "active",
    };
    const next = { ...w, gold: w.gold - 15, heroes: [...w.heroes, recruit] };
    const changes = diffRoster(rows(), next);
    expect(changes).toEqual([
      { table: "warbands", op: "update", id: REIKLAND_ID, data: { gold: 20 } },
      {
        table: "heroes",
        op: "insert",
        id: NEW_HERO_ID,
        data: {
          name: "Otto",
          is_hired_sword: false,
          unit_type_rules_id: "mercenaries_reikland_youngbloods",
          hired_sword_rules_id: null,
          stats: recruit.stats,
          xp: 0,
          level_ups: 0,
          skill_tables: ["combat", "speed"],
          skills: [],
          spells: [],
          injuries: [],
          flags: {},
          equipment_locked: false,
          is_large: false,
          status: "active",
          notes: "",
          sort_order: 4,
        },
      },
      {
        table: "items",
        op: "insert",
        data: { holder_type: "hero", holder_id: NEW_HERO_ID, item_rules_id: "dagger", custom_name: null, quantity: 1, notes: "" },
      },
      {
        table: "items",
        op: "insert",
        data: { holder_type: "hero", holder_id: NEW_HERO_ID, item_rules_id: "sword", custom_name: null, quantity: 1, notes: "" },
      },
    ]);
    // The hero comes before his items so the database can check the holder exists.
    expect(changes.findIndex((c) => c.table === "heroes")).toBeLessThan(changes.findIndex((c) => c.table === "items"));
  });

  it("refuses a new warrior whose id is not a uuid", () => {
    const w = roster();
    const bad: RosterHero = { ...hero(w, PIETER_ID), id: "new-hero-1", name: "Nobody" };
    expect(() => diffRoster(rows(), { ...w, heroes: [...w.heroes, bad] })).toThrow(/randomUUID/);
    expect(isUuid(NEW_HERO_ID)).toBe(true);
    expect(isUuid("new-hero-1")).toBe(false);
  });

  it("inserts a hired sword (is_hired_sword, locked kit) with custom items, numbered after the heroes", () => {
    const w = roster();
    const hired: RosterHiredSword = {
      id: NEW_HIRED_ID,
      hiredSwordId: "ogre_bodyguard",
      name: "Ogre Bodyguard",
      stats: { M: 6, WS: 3, BS: 2, S: 4, T: 4, W: 3, I: 3, A: 2, Ld: 7 },
      xp: 0,
      levelUps: 0,
      skillIds: [],
      injuries: [],
      flags: {},
      equipment: [{ itemId: null, customName: "Ogre-sized club", quantity: 1 }, { itemId: null, customName: "Light armour", quantity: 1 }],
      status: "active",
    };
    const changes = diffRoster(rows(), { ...w, gold: 0, hiredSwords: [hired] });
    expect(ofTable(changes, "heroes")).toEqual([
      {
        table: "heroes",
        op: "insert",
        id: NEW_HIRED_ID,
        data: {
          name: "Ogre Bodyguard",
          is_hired_sword: true,
          unit_type_rules_id: null,
          hired_sword_rules_id: "ogre_bodyguard",
          stats: hired.stats,
          xp: 0,
          level_ups: 0,
          skill_tables: [],
          skills: [],
          spells: [],
          injuries: [],
          flags: {},
          equipment_locked: true,
          is_large: false,
          status: "active",
          notes: "",
          sort_order: 4,
        },
      },
    ]);
    expect(ofTable(changes, "items")).toEqual([
      {
        table: "items",
        op: "insert",
        data: { holder_type: "hero", holder_id: NEW_HIRED_ID, item_rules_id: null, custom_name: "Ogre-sized club", quantity: 1, notes: "" },
      },
      {
        table: "items",
        op: "insert",
        data: { holder_type: "hero", holder_id: NEW_HIRED_ID, item_rules_id: null, custom_name: "Light armour", quantity: 1, notes: "" },
      },
    ]);
  });

  it("numbers a new hero and a new hired sword in the same batch consecutively", () => {
    const w = roster();
    const recruit: RosterHero = { ...hero(w, PIETER_ID), id: NEW_HERO_ID, name: "Otto", equipment: [] };
    const hired: RosterHiredSword = {
      id: NEW_HIRED_ID,
      hiredSwordId: "pit_fighter",
      name: "Pit Fighter",
      stats: { M: 4, WS: 4, BS: 4, S: 4, T: 4, W: 1, I: 4, A: 1, Ld: 7 },
      xp: 0,
      levelUps: 0,
      skillIds: [],
      injuries: [],
      flags: {},
      equipment: [],
      status: "active",
    };
    const changes = ofTable(diffRoster(rows(), { ...w, heroes: [...w.heroes, recruit], hiredSwords: [hired] }), "heroes");
    expect(changes.map((c) => c.data?.sort_order)).toEqual([4, 5]);
  });

  it("patches a hired sword's status and xp with the hired-sword column set", () => {
    const r: RosterRows = { ...rows(), heroes: [...reiklandHeroes, { ...ogre, status: "active" }] };
    const w = roster(r);
    const next = { ...w, hiredSwords: w.hiredSwords.map((s) => ({ ...s, status: "left" as const, xp: 3 })) };
    expect(diffRoster(r, next)).toEqual([{ table: "heroes", op: "update", id: OGRE_ID, data: { xp: 3, status: "left" } }]);
  });

  it("patches a henchman group's size and stat increases", () => {
    const w = roster();
    const watchmen = group(w, WATCHMEN_ID);
    const next = withGroup(w, WATCHMEN_ID, {
      size: watchmen.size + 1,
      statIncreases: { WS: 1 },
      stats: { ...watchmen.stats, WS: 4 },
      levelUps: 1,
    });
    expect(diffRoster(rows(), next)).toEqual([
      {
        table: "henchman_groups",
        op: "update",
        id: WATCHMEN_ID,
        data: { stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }, level_ups: 1, size: 4, stat_increases: { WS: 1 } },
      },
    ]);
  });

  it("treats an absent stat increase and a zero one as the same", () => {
    const next = withGroup(roster(), WATCHMEN_ID, { statIncreases: { WS: 0 } });
    expect(diffRoster(rows(), next)).toEqual([]);
  });

  it("inserts a new henchman group with its kit", () => {
    const w = roster();
    const swordsmen: RosterHenchmanGroup = {
      id: NEW_GROUP_ID,
      name: "Swordsmen",
      unitTemplateId: "mercenaries_reikland_swordsmen",
      size: 2,
      stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
      xp: 0,
      levelUps: 0,
      statIncreases: {},
      equipment: [{ itemId: "sword", quantity: 2 }],
    };
    const changes = diffRoster(rows(), { ...w, henchmenGroups: [...w.henchmenGroups, swordsmen] });
    expect(changes).toEqual([
      {
        table: "henchman_groups",
        op: "insert",
        id: NEW_GROUP_ID,
        data: {
          name: "Swordsmen",
          unit_type_rules_id: "mercenaries_reikland_swordsmen",
          size: 2,
          stats: swordsmen.stats,
          xp: 0,
          level_ups: 0,
          stat_increases: {},
          is_large: false,
          notes: "",
          sort_order: 2,
        },
      },
      {
        table: "items",
        op: "insert",
        data: { holder_type: "group", holder_id: NEW_GROUP_ID, item_rules_id: "sword", custom_name: null, quantity: 2, notes: "" },
      },
    ]);
  });

  it("an item bought into the stash is an insert; a second copy of a stashed item is a quantity update", () => {
    const w = roster();
    const bought = { ...w, gold: w.gold - 10, stash: [...w.stash, { itemId: "sword", quantity: 1 }] };
    expect(diffRoster(rows(), bought)).toEqual([
      { table: "warbands", op: "update", id: REIKLAND_ID, data: { gold: 25 } },
      { table: "items", op: "insert", data: { holder_type: "stash", holder_id: null, item_rules_id: "sword", custom_name: null, quantity: 1, notes: "" } },
    ]);

    const stashDagger = reiklandItems.find((i) => i.holder_type === "stash")!;
    const another = { ...w, stash: w.stash.map((s) => (s.itemId === "dagger" ? { ...s, quantity: 2 } : s)) };
    expect(diffRoster(rows(), another)).toEqual([{ table: "items", op: "update", id: stashDagger.id, data: { quantity: 2 } }]);
  });

  it("an item moved from a hero to the stash keeps its row (holder update, no delete)", () => {
    const w = roster();
    const captain = hero(w, CAPTAIN_ID);
    const armourRow = reiklandItems.find((i) => i.holder_id === CAPTAIN_ID && i.item_rules_id === "light_armour")!;
    const next = {
      ...withHero(w, CAPTAIN_ID, { equipment: captain.equipment.filter((e) => e.itemId !== "light_armour") }),
      stash: [...w.stash, { itemId: "light_armour", quantity: 1 }],
    };
    expect(diffRoster(rows(), next)).toEqual([
      { table: "items", op: "update", id: armourRow.id, data: { holder_type: "stash", holder_id: null } },
    ]);
  });

  it("an item moved between two heroes is a holder update to the receiving hero", () => {
    const w = roster();
    const swordRow = reiklandItems.find((i) => i.holder_id === CAPTAIN_ID && i.item_rules_id === "sword")!;
    let next = withHero(w, CAPTAIN_ID, { equipment: hero(w, CAPTAIN_ID).equipment.filter((e) => e.itemId !== "sword") });
    next = withHero(next, PIETER_ID, { equipment: [...hero(next, PIETER_ID).equipment, { itemId: "sword", quantity: 1 }] });
    expect(diffRoster(rows(), next)).toEqual([
      { table: "items", op: "update", id: swordRow.id, data: { holder_type: "hero", holder_id: PIETER_ID } },
    ]);
  });

  it("an item sold from a hero is a delete; a reduced stack is a quantity update", () => {
    const w = roster();
    const swordRow = reiklandItems.find((i) => i.holder_id === CAPTAIN_ID && i.item_rules_id === "sword")!;
    const sold = withHero(w, CAPTAIN_ID, { equipment: hero(w, CAPTAIN_ID).equipment.filter((e) => e.itemId !== "sword") });
    expect(diffRoster(rows(), { ...sold, gold: 40 })).toEqual([
      { table: "warbands", op: "update", id: REIKLAND_ID, data: { gold: 40 } },
      { table: "items", op: "delete", id: swordRow.id },
    ]);

    const bowRow = reiklandItems.find((i) => i.holder_id === MARKSMEN_ID && i.item_rules_id === "bow")!;
    const fewer = withGroup(w, MARKSMEN_ID, {
      equipment: group(w, MARKSMEN_ID).equipment.map((e) => (e.itemId === "bow" ? { ...e, quantity: 1 } : e)),
    });
    expect(diffRoster(rows(), fewer)).toEqual([{ table: "items", op: "update", id: bowRow.id, data: { quantity: 1 } }]);
  });

  it("deletes a hero after his items are dealt with, leaving orphaned kit to the database trigger", () => {
    const w = roster();
    const next = { ...w, heroes: w.heroes.filter((h) => h.id !== PIETER_ID) };
    // Pieter's dagger is not deleted here: the heroes_release_items trigger returns it to the stash.
    expect(diffRoster(rows(), next)).toEqual([{ table: "heroes", op: "delete", id: PIETER_ID }]);
  });

  it("pairs a deleted warrior's kit with the stack the resolver moved (a promotion)", () => {
    // Marksmen (2 bows, 2 daggers) shrink to nothing: one member becomes a hero taking one of each,
    // as promoteHenchman does; the group row is deleted.
    const w = roster();
    const bowRow = reiklandItems.find((i) => i.holder_id === MARKSMEN_ID && i.item_rules_id === "bow")!;
    const daggerRow = reiklandItems.find((i) => i.holder_id === MARKSMEN_ID && i.item_rules_id === "dagger")!;
    const promoted: RosterHero = {
      ...hero(w, PIETER_ID),
      id: NEW_HERO_ID,
      name: "Hans",
      unitTemplateId: "mercenaries_reikland_marksmen",
      equipment: [{ itemId: "bow", quantity: 1 }, { itemId: "dagger", quantity: 1 }],
    };
    const next = {
      ...w,
      heroes: [...w.heroes, promoted],
      henchmenGroups: w.henchmenGroups.filter((g) => g.id !== MARKSMEN_ID),
    };
    const changes = diffRoster(rows(), next);
    expect(ofTable(changes, "items")).toEqual([
      { table: "items", op: "update", id: bowRow.id, data: { holder_type: "hero", holder_id: NEW_HERO_ID, quantity: 1 } },
      { table: "items", op: "update", id: daggerRow.id, data: { holder_type: "hero", holder_id: NEW_HERO_ID, quantity: 1 } },
    ]);
    expect(changes.at(-1)).toEqual({ table: "henchman_groups", op: "delete", id: MARKSMEN_ID });
    expect(changes.findIndex((c) => c.table === "heroes")).toBeLessThan(changes.findIndex((c) => c.table === "items"));
  });

  it("orders changes: warband, warriors, item upserts, item deletes, warrior deletes", () => {
    const w = roster();
    const swordRow = itemRow(reiklandItems.find((i) => i.holder_id === CAPTAIN_ID && i.item_rules_id === "sword")!.id);
    let next = { ...w, gold: 1 };
    next = withHero(next, CAPTAIN_ID, { equipment: hero(next, CAPTAIN_ID).equipment.filter((e) => e.itemId !== "sword") });
    next = { ...next, heroes: next.heroes.filter((h) => h.id !== KLAUS_ID) };
    expect(diffRoster(rows(), next).map((c) => `${c.table}:${c.op}`)).toEqual(["warbands:update", "items:delete", "heroes:delete"]);
    expect(diffRoster(rows(), next)[1]?.id).toBe(swordRow.id);
  });
});

describe("stableJson", () => {
  it("sorts keys at every level and drops undefined values", () => {
    expect(stableJson({ b: 1, a: { d: undefined, c: [3, { z: 1, y: 2 }] } })).toBe('{"a":{"c":[3,{"y":2,"z":1}]},"b":1}');
    expect(stableJson({ a: 1 })).toBe(stableJson({ a: 1, b: undefined }));
  });
});

// Phase 17: Wardogs and Gnoblar Fighters fight as warriors.

import { describe, expect, it } from "vitest";
import { emptyBattleLiveState } from "../../../domain";
import { combatantsOf, loadoutFor } from "../../../features/match/fight/combatants";
import { animalsFighting, routStatus, sheetTotals, startingModels, toggleHeroOut } from "../../../features/match/battle/sheet";
import { findWarbandTemplate } from "../../data/warbandTemplates";
import type { RosterHero, RosterWarband } from "../../types/roster";
import { animalCount, animalFighters, parseAnimalId } from "../animals";
import { warbandModelCount } from "../roster";
import { warbandRating } from "../rating";

const stats = { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 8 };
const hero = (id: string, unit: string, equipment: RosterHero["equipment"] = [], over: Partial<RosterHero> = {}): RosterHero => ({
  id, name: id, unitTemplateId: unit, stats, xp: 0, levelUps: 0, skillTableIds: [], skillIds: [], spellIds: [], injuries: [], flags: {}, equipment, status: "active", ...over,
});
const OHP = findWarbandTemplate("ogre_hunting_party")!;
const roster: RosterWarband = {
  id: "w", name: "W", warbandTemplateId: OHP.id, gold: 0, wyrdstone: 0, veteranPool: null, stash: [], henchmenGroups: [], hiredSwords: [],
  heroes: [
    hero("ogre", "ogre_hunting_party_ogre_hunter", [{ itemId: "wardogs", quantity: 2 }, { itemId: "sword", quantity: 1 }]),
    hero("trapper", "ogre_hunting_party_trappers", [{ itemId: "gnoblar_fighter", quantity: 1 }]),
    hero("benched", "ogre_hunting_party_trappers", [{ itemId: "wardogs", quantity: 1 }], { flags: { missNextGames: 1 } }),
  ],
};

describe("animals fighting as warriors", () => {
  it("lists one fighter per animal on active heroes, with ids that read back", () => {
    const all = animalFighters(roster);
    expect(all.map((a) => a.id)).toEqual(["animal:ogre:wardogs:1", "animal:ogre:wardogs:2", "animal:trapper:gnoblar_fighter:1", "animal:benched:wardogs:1"]);
    expect(all[0].name).toBe("Wardog 1");
    expect(all[2].name).toBe("Gnoblar Fighter");
    expect(parseAnimalId("animal:ogre:wardogs:2")).toEqual({ holderId: "ogre", itemId: "wardogs", index: 2 });
    expect(animalCount(roster)).toBe(4);
    expect(warbandModelCount(roster)).toBe(3 + 4);
  });

  it("only a fighting hero's animals take the field; Gnoblars never count for rout tests", () => {
    expect(animalsFighting(roster).map((a) => a.id)).toEqual(["animal:ogre:wardogs:1", "animal:ogre:wardogs:2", "animal:trapper:gnoblar_fighter:1"]);
    // Two heroes fighting + two wardogs = 4 starting models; the gnoblar is not one of them.
    expect(startingModels(roster)).toBe(4);
    let sheet = toggleHeroOut(emptyBattleLiveState(), "animal:trapper:gnoblar_fighter:1");
    expect(sheetTotals(sheet, roster).ownOutOfAction).toBe(0);
    expect(routStatus(sheet, 4)).toBe("none");
    sheet = toggleHeroOut(sheet, "animal:ogre:wardogs:1");
    expect(sheetTotals(sheet, roster).ownOutOfAction).toBe(1);
    expect(routStatus(sheet, 4)).toBe("test");
  });

  it("animals are combatants with their own weapons and count five points of rating each", () => {
    const combatants = combatantsOf(roster, OHP, "W", undefined);
    const dog = combatants.find((c) => c.id === "animal:ogre:wardogs:1")!;
    expect(dog.kind).toBe("animal");
    expect(dog.stats.S).toBe(4);
    expect(loadoutFor(dog).melee.map((w) => w.id)).toEqual(["wardog_bite"]);
    expect(dog.isAnimal).toBe(true);
    const gnoblar = combatants.find((c) => c.id === "animal:trapper:gnoblar_fighter:1")!;
    expect(loadoutFor(gnoblar).ranged.map((w) => w.id)).toEqual(["gnoblar_sharp_stuff"]);
    const rating = warbandRating(roster, OHP);
    expect(gnoblar.isAnimal).toBe(false);
    expect(rating.breakdown.filter((b) => b.subjectId.startsWith("animal:")).map((b) => b.points)).toEqual([5, 5, 5, 5]);
  });
});

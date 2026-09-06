import { describe, expect, it } from "vitest";
import { findHiredSword } from "../../data/campaign/hiredSwords";
import { findItem } from "../../data/items";
import { DISTRICT_EFFECTS } from "../../data/map/advantages";
import { MAP_DISTRICTS } from "../../data/map/districts";
import { deriveMapState, type MapEvent } from "../mapCampaign";
import { describeMapPerks, halfPriceHireSource, halfPriceItemSource, halved, injuryRewriteFor, isAbundanceDistrict, mapPerksFor } from "../mapAdvantages";

const A = "a";
const B = "b";
const won = (at: string, districtId: string, winner: string, loser: string): MapEvent => ({ kind: "battle", at, matchId: at, districtId, participants: [{ warbandId: winner, result: "won" }, { warbandId: loser, result: "lost" }] });

describe("district effects data", () => {
  it("names every district and only real ids", () => {
    for (const d of MAP_DISTRICTS) expect(DISTRICT_EFFECTS[d.id], d.id).toBeDefined();
    for (const [id, e] of Object.entries(DISTRICT_EFFECTS)) {
      expect(MAP_DISTRICTS.some((d) => d.id === id)).toBe(true);
      for (const h of e.halfPriceHires ?? []) if (h !== "luthor_wolfenbaum") expect(findHiredSword(h), `${id}: ${h}`).toBeDefined();
      for (const i of e.halfPriceItems ?? []) if (!i.startsWith("prefix:")) expect(findItem(i), `${id}: ${i}`).toBeDefined();
    }
  });
});

describe("map perks", () => {
  const state = deriveMapState([
    won("2026-01-01", "west-gate", A, B),
    won("2026-01-02", "executioners-square", A, B),
    won("2026-01-03", "poor-quarter", A, B),
    won("2026-01-04", "dwarven-district", A, B),
    won("2026-01-05", "market-square", A, B),
    won("2026-01-06", "temple-of-morr", A, B),
    won("2026-01-07", "the-rock", A, B),
    // Rich Quarter is Hard Fought and contested: no advantage for either.
    won("2026-01-08", "rich-quarter", A, B),
    { kind: "adjust", at: "2026-01-09", districtId: "rich-quarter", warbandId: B, field: "foothold", value: true, reason: "" },
  ]);

  it("adds up exploration dice, rare bonus, half prices, rewrites and the sale bonus", () => {
    const perks = mapPerksFor(state, A);
    expect(perks.explorationDice).toBe(2);
    expect(perks.explorationDiceSources).toEqual(["Executioner's Square", "Poor Quarter"]);
    expect(perks.explorationMaxFinds).toBeNull();
    expect(perks.rareRollBonus).toBe(2);
    expect(halfPriceHireSource(perks, "dwarf_troll_slayer")?.districtName).toBe("Dwarven District");
    expect(halfPriceHireSource(perks, "luthor_wolfenbaum")?.districtName).toBe("West Gate");
    expect(halfPriceItemSource(perks, "gromril_sword")?.districtName).toBe("Dwarven District");
    expect(halfPriceItemSource(perks, "sword")).toBeNull();
    expect(injuryRewriteFor(perks, 13)).toMatchObject({ test: 5, to: "full_recovery" });
    expect(injuryRewriteFor(perks, 24)).toBeNull();
    expect(perks.wyrdstoneSaleBonus).toBe(0.2);
    expect(halved(25)).toBe(12);
    expect(describeMapPerks(perks).length).toBeGreaterThan(5);
  });

  it("gives the loser nothing and reads the abundance flag", () => {
    const perks = mapPerksFor(state, B);
    expect(perks.districts).toEqual([]);
    expect(perks.explorationDice).toBe(0);
    expect(isAbundanceDistrict("rich-quarter")).toBe(true);
    expect(isAbundanceDistrict("west-gate")).toBe(false);
    expect(isAbundanceDistrict(null)).toBe(false);
  });
});

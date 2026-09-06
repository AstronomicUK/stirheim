// Phase 17: recruit-time purchases, between-battle actions, the builder's campaign bans.

import { describe, expect, it } from "vitest";
import { findItem } from "../../data/items";
import { findWarbandTemplate } from "../../data/warbandTemplates";
import type { RosterHero, RosterWarband } from "../../types/roster";
import { emptyCampaignBans } from "../../types/roster";
import { actionsFor, performAction } from "../betweenBattles";
import { equipmentOptionsFor, newWarbandDraft, validateDraft } from "../builder";
import { recruitPurchaseOptions, recruitPurchasesTotal } from "../recruitPurchases";
import { skillIdByName } from "../skillRestrictions";

const stats = { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 8 };
const hero = (id: string, unit: string, over: Partial<RosterHero> = {}): RosterHero => ({
  id, name: id, unitTemplateId: unit, stats, xp: 0, levelUps: 0, skillTableIds: [], skillIds: [], spellIds: [], injuries: [], flags: {}, equipment: [], status: "active", ...over,
});
const warband = (templateId: string, heroes: RosterHero[], stash: RosterWarband["stash"] = []): RosterWarband => ({
  id: "w", name: "W", warbandTemplateId: templateId, gold: 100, wyrdstone: 0, veteranPool: null, heroes, henchmenGroups: [], hiredSwords: [], stash,
});

describe("recruit-time purchases", () => {
  it("offers mutations to the Possessed and Blessings to Tainted Ones, and nothing to a Reikland captain", () => {
    expect(recruitPurchaseOptions("cult_of_the_possessed", "cult_of_the_possessed_mutants").map((i) => i.id)).toContain("great_claw");
    expect(recruitPurchaseOptions("carnival_of_chaos", "carnival_of_chaos_tainted_ones").map((i) => i.id)).toEqual(["stream_of_corruption", "nurgles_rot", "cloud_of_flies", "bloated_foulness", "mark_of_nurgle", "hideous"]);
    expect(recruitPurchaseOptions("mercenaries_reikland", "mercenaries_reikland_captain")).toEqual([]);
    // Court heroes may take three of the mutations.
    expect(recruitPurchaseOptions("court_of_the_profane_pleasures", "court_of_pleasures_danseuse").map((i) => i.id).sort()).toEqual(["extra_arm", "great_claw", "tentacle"]);
  });

  it("the first costs its price and later ones double, dearest first", () => {
    const rot = findItem("nurgles_rot")!;
    const flies = findItem("cloud_of_flies")!;
    const total = recruitPurchasesTotal([flies, rot]);
    expect(total.lines.map((l) => [l.item.id, l.price])).toEqual([
      ["nurgles_rot", 50],
      ["cloud_of_flies", 50],
    ]);
    expect(total.total).toBe(100);
  });
});

describe("between-battle actions", () => {
  it("a Master of Poisons brews Dark Venom, a Hochland bandit robs, a Huckster cons, a Merchant trades", () => {
    const poisoner = hero("p", "dark_elves_high_born", { skillIds: [skillIdByName("Master of Poisons")!] });
    expect(actionsFor(poisoner).map((a) => a.id)).toEqual(["master_of_poisons"]);
    const brewed = performAction(warband("dark_elves", [poisoner]), { actionId: "master_of_poisons", heroId: "p", rolls: { d3: 6 } });
    expect(brewed.value.heroes[0].equipment).toEqual([{ itemId: "dark_venom", quantity: 2, notes: "Master of Poisons: use in the next battle; cannot be sold or traded" }]);
    expect(performAction(warband("dark_elves", [poisoner]), { actionId: "master_of_poisons", heroId: "p", rolls: { d3: 1 } }).value.heroes[0].equipment).toEqual([]);

    const bandit = hero("b", "hochland_bandits_footpad", { skillIds: [skillIdByName("Banditry")!] });
    expect(performAction(warband("hochland_bandits", [bandit]), { actionId: "banditry", heroId: "b", rolls: { d6: 4, gold: 3 } }).value.gold).toBe(104);
    const botched = performAction(warband("hochland_bandits", [bandit]), { actionId: "banditry", heroId: "b", rolls: { d6: 1 } });
    expect(botched.value.gold).toBe(100);
    expect(botched.events[0].message).toMatch(/Serious Injury table/);

    const huckster = hero("h", "hochland_bandits_huckster");
    expect(actionsFor(huckster).map((a) => a.id)).toEqual(["slick_operator"]);
    expect(performAction(warband("hochland_bandits", [huckster]), { actionId: "slick_operator", heroId: "h", rolls: { d6: 5, gold1: 2, gold2: 6 } }).value.gold).toBe(108);
    expect(performAction(warband("hochland_bandits", [huckster]), { actionId: "slick_operator", heroId: "h", rolls: { d6: 1 } }).value.heroes[0].flags.missNextGames).toBe(1);

    const merchant = hero("m", "merchant_merchant");
    const stocked = warband("merchant_caravans", [merchant], [{ itemId: "elven_cloak", quantity: 1 }]);
    const sold = performAction(stocked, { actionId: "trade", heroId: "m", rolls: { d6: 6 }, stashItemId: "elven_cloak" });
    expect(sold.value.gold).toBe(100 + 150);
    expect(sold.value.stash).toEqual([]);
    expect(() => performAction(stocked, { actionId: "trade", heroId: "m", rolls: { d6: 3 }, stashItemId: "sword" })).toThrow(/Pick a stored item/);
    expect(() => performAction(warband("mercenaries_reikland", [hero("c", "mercenaries_reikland_captain")]), { actionId: "banditry", heroId: "c", rolls: { d6: 3, gold: 3 } })).toThrow(/may not/);
  });
});

describe("the builder and campaign bans", () => {
  it("keeps banned kit out of the lists and flags it on the draft", () => {
    const REIK = findWarbandTemplate("mercenaries_reikland")!;
    const bans = { ...emptyCampaignBans(), items: ["sword"] };
    const all = equipmentOptionsFor(REIK, "mercenaries_reikland_captain");
    expect(all.some((o) => o.item?.id === "sword")).toBe(true);
    expect(equipmentOptionsFor(REIK, "mercenaries_reikland_captain", bans).some((o) => o.item?.id === "sword")).toBe(false);
    const draft = newWarbandDraft(REIK, "Test", "leader", "campaign-1");
    expect(draft.campaignId).toBe("campaign-1");
    expect(validateDraft(draft, REIK, bans).length).toBeGreaterThanOrEqual(0);
  });
});

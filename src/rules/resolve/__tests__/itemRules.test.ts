// Phase 16: who may buy or carry what, conditional prices, unsellable and fused kit, campaign bans.

import { describe, expect, it } from "vitest";
import { findItem } from "../../data/items";
import { emptyCampaignBans, type RosterHero, type RosterItem, type RosterWarband } from "../../types/roster";
import { effectivePricing, warbandRareRollBonus } from "../itemPricing";
import { itemRestrictionWarnings, missileWeaponCount, moveBlockReason, rosterItemWarnings, sellBlockReason, type ItemHolder } from "../itemRestrictions";
import { moveItem, sellItem } from "../trading";
import { findWarbandTemplate } from "../../data/warbandTemplates";
import { validateRoster } from "../roster";

const stats = { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 };
const item = (itemId: string, quantity = 1): RosterItem => ({ itemId, quantity });
const hero = (id: string, unit: string, equipment: RosterItem[] = [], over: Partial<RosterHero> = {}): RosterHero => ({
  id, name: id, unitTemplateId: unit, stats, xp: 0, levelUps: 0, skillTableIds: [], skillIds: [], spellIds: [], injuries: [], flags: {}, equipment, status: "active", ...over,
});
const warband = (templateId: string, heroes: RosterHero[], stash: RosterItem[] = []): RosterWarband => ({
  id: "w", name: "W", warbandTemplateId: templateId, gold: 500, wyrdstone: 0, veteranPool: null, heroes, henchmenGroups: [], hiredSwords: [], stash,
});
const I = (id: string) => {
  const found = findItem(id);
  if (!found) throw new Error(`no item ${id}`);
  return found;
};

describe("item restrictions", () => {
  const reikland = warband("mercenaries_reikland", [hero("cap", "mercenaries_reikland_captain", [item("sword"), item("dagger")])]);
  const captain: ItemHolder = { kind: "hero", id: "cap", name: "cap", unitTemplateId: "mercenaries_reikland_captain", equipment: reikland.heroes[0].equipment };
  const group: ItemHolder = { kind: "henchmanGroup", id: "g", name: "Warriors", unitTemplateId: "mercenaries_reikland_warriors", equipment: [item("dagger")] };

  it("miscellaneous equipment is Heroes only, with the rulebook's exceptions", () => {
    expect(itemRestrictionWarnings(reikland, I("lucky_charm"), group)).toEqual(["Lucky Charm: miscellaneous equipment is for Heroes only; henchmen may not carry it."]);
    expect(itemRestrictionWarnings(reikland, I("rain_coat"), group)).toEqual([]);
    expect(itemRestrictionWarnings(reikland, I("lucky_charm"), captain)).toEqual([]);
  });

  it("race and creed clauses read the warband", () => {
    expect(itemRestrictionWarnings(reikland, I("sea_dragon_cloak"), captain)[0]).toMatch(/for Dark Elves only/);
    const undead = warband("the_undead", [hero("v", "undead_vampire")]);
    const vampire: ItemHolder = { kind: "hero", id: "v", unitTemplateId: "undead_vampire", equipment: [] };
    expect(itemRestrictionWarnings(undead, I("garlic"), vampire)[0]).toMatch(/may not be used by Undead/);
    expect(itemRestrictionWarnings(undead, I("blessed_water"), vampire)[0]).toMatch(/Undead or Possessed/);
    const elves = warband("shadow_warriors", [hero("s", "shadow_warriors_shadow_master")]);
    expect(itemRestrictionWarnings(elves, I("bugmans_ale"), { kind: "stash", equipment: [] })[0]).toMatch(/Elves/);
  });

  it("a warband's category equipment ban (#67) now reaches the shop, not just the roster page", () => {
    const slayers = warband("dwarf_slayer_cult", [hero("d", "dwarf_slayer_cult_doomseeker_hero")]);
    const slayer: ItemHolder = { kind: "hero", id: "d", unitTemplateId: "dwarf_slayer_cult_doomseeker_hero", equipment: [] };
    expect(itemRestrictionWarnings(slayers, I("heavy_armour"), slayer)[0]).toMatch(/armour, which this warrior may not wear/);
    expect(itemRestrictionWarnings(slayers, I("dagger"), slayer)).toEqual([]);
  });

  it("a gromril or ithilmar weapon carries the same race-and-creed restriction as its base weapon", () => {
    expect(itemRestrictionWarnings(reikland, I("gromril_sons_of_hashut_obsidian_weapon"), captain)[0]).toMatch(/for Chaos Dwarfs only/);
    expect(itemRestrictionWarnings(reikland, I("ithilmar_sons_of_hashut_obsidian_weapon"), captain)[0]).toMatch(/for Chaos Dwarfs only/);
    const hashut = warband("the_sons_of_hashut", [hero("k", "sons_of_hashut_apprentice_sorcerer")]);
    expect(itemRestrictionWarnings(hashut, I("gromril_sons_of_hashut_obsidian_weapon"), { kind: "hero", id: "k", unitTemplateId: "sons_of_hashut_apprentice_sorcerer", equipment: [] })).toEqual([]);
    // The display text carries the same "(X only)" note the base item has.
    expect(I("gromril_sons_of_hashut_obsidian_weapon").availability.text).toBe("Rare 11 (Chaos Dwarfs only)");
    // A plain gromril/ithilmar weapon with no race restriction on its base stays unrestricted.
    expect(itemRestrictionWarnings(reikland, I("gromril_sword"), captain)).toEqual([]);
  });

  it("arrows need a bow, and a second helmet of a kind is one per model", () => {
    expect(itemRestrictionWarnings(reikland, I("hunting_arrows"), captain)[0]).toMatch(/needs a bow/);
    const archer: ItemHolder = { ...captain, equipment: [item("bow")] };
    expect(itemRestrictionWarnings(reikland, I("hunting_arrows"), archer)).toEqual([]);
    const pirates = warband("pirates", [hero("c", "pirates_captain", [item("peg_leg")])]);
    expect(itemRestrictionWarnings(pirates, I("peg_leg"), { kind: "hero", id: "c", unitTemplateId: "pirates_captain", equipment: pirates.heroes[0].equipment })[0]).toMatch(/one per model/);
  });

  it("one per warband, once per campaign, creation only", () => {
    const pirates = warband("pirates", [hero("g", "pirates_captain")], [item("swivel_gun")]);
    expect(itemRestrictionWarnings(pirates, I("swivel_gun"), { kind: "henchmanGroup", id: "gun", unitTemplateId: "pirates_gunner", equipment: [] })[0]).toMatch(/only one/);
    const shadows = warband("shadow_warriors", [hero("s", "shadow_warriors_shadow_master")]);
    expect(itemRestrictionWarnings(shadows, I("standard_of_nagarythe"), { kind: "hero", id: "s", unitTemplateId: "shadow_warriors_shadow_master", equipment: [] })[0]).toMatch(/when the warband is created/);
    expect(itemRestrictionWarnings(shadows, I("standard_of_nagarythe"), { kind: "hero", id: "s", unitTemplateId: "shadow_warriors_shadow_master", equipment: [] }, { atCreation: true })).toEqual([]);
  });

  it("the two hand weapons and two missile weapons caps, a brace counting as one", () => {
    const armed: ItemHolder = { ...captain, equipment: [item("sword"), item("axe"), item("dagger")] };
    expect(itemRestrictionWarnings(reikland, I("mace"), armed)[0]).toMatch(/3 hand weapons/);
    expect(itemRestrictionWarnings(reikland, I("dagger"), armed)).toEqual([]);
    const shooter: ItemHolder = { ...captain, equipment: [item("bow"), item("pistol", 1)] };
    expect(missileWeaponCount([item("bow"), item("pistol", 2)])).toBe(2);
    expect(missileWeaponCount([item("bow"), item("pistol", 3)])).toBe(3);
    expect(itemRestrictionWarnings(reikland, I("crossbow"), shooter)[0]).toMatch(/3 missile weapons/);
    // The second pistol completes a brace, which counts as one weapon.
    expect(itemRestrictionWarnings(reikland, I("pistol"), shooter)).toEqual([]);
    // A henchman group's kit is a total: three Warriors with three swords carry one each.
    const trio: ItemHolder = { kind: "henchmanGroup", id: "g", name: "Warriors", unitTemplateId: "mercenaries_reikland_warriors", size: 3, equipment: [item("sword", 3), item("axe", 3), item("dagger", 3)] };
    expect(itemRestrictionWarnings(reikland, I("sword"), trio, { alreadyHeld: true, quantity: 3 })).toEqual([]);
    expect(itemRestrictionWarnings(reikland, I("mace"), trio, { quantity: 3 })[0]).toMatch(/each of Warriors would carry 3 hand weapons/);
  });

  it("a Severe Arm Wound allows only a single one-handed weapon, no shield or buckler", () => {
    const oneHanded: ItemHolder = { ...captain, equipment: [item("sword")], flags: { singleHandedWeaponsOnly: true } };
    expect(itemRestrictionWarnings(reikland, I("axe"), oneHanded)[0]).toMatch(/severe arm wound allows only a single one-handed weapon/);
    expect(itemRestrictionWarnings(reikland, I("dagger"), oneHanded)).toEqual([]);
    expect(itemRestrictionWarnings(reikland, I("shield"), oneHanded)[0]).toMatch(/no shield or buckler/);
    expect(itemRestrictionWarnings(reikland, I("buckler"), oneHanded)[0]).toMatch(/no shield or buckler/);
    const fine: ItemHolder = { ...captain, equipment: [item("sword")] };
    expect(itemRestrictionWarnings(reikland, I("axe"), fine)).toEqual([]);
    const armed = warband("mercenaries_reikland", [hero("cap", "mercenaries_reikland_captain", [item("sword"), item("shield")], { flags: { singleHandedWeaponsOnly: true } })]);
    expect(rosterItemWarnings(armed).map((w) => w.message).some((m) => /no shield or buckler/.test(m))).toBe(true);
  });

  it("Toughened Leathers and a shield do not mix", () => {
    const leathered: ItemHolder = { ...captain, equipment: [item("toughened_leathers")] };
    expect(itemRestrictionWarnings(reikland, I("shield"), leathered)[0]).toMatch(/Toughened Leathers/);
  });

  it("bans are warned about everywhere", () => {
    const bans = { ...emptyCampaignBans(), items: ["lucky_charm"] };
    expect(itemRestrictionWarnings(reikland, I("lucky_charm"), captain, { bans })[0]).toMatch(/banned in this campaign/);
    const holding = warband("mercenaries_reikland", [hero("cap", "mercenaries_reikland_captain", [item("lucky_charm")])], [item("lucky_charm")]);
    const warnings = rosterItemWarnings(holding, { bans });
    expect(warnings.map((w) => w.subjectId)).toEqual(["cap", "stash"]);
    const template = findWarbandTemplate("mercenaries_reikland")!;
    expect(validateRoster(holding, template, { bans }).problems.filter((p) => p.code === "roster.itemRestriction")).toHaveLength(2);
    expect(validateRoster(holding, template).problems.filter((p) => p.code === "roster.itemRestriction")).toHaveLength(0);
  });

  it("fused kit stays put and unsellable kit stays", () => {
    expect(moveBlockReason("chaos_armour", "hero")).toMatch(/fuses to the body/);
    expect(moveBlockReason("chaos_armour", "stash")).toBeNull();
    expect(moveBlockReason("sword", "hero")).toBeNull();
    expect(sellBlockReason("toughened_leathers")).toMatch(/cannot be sold back/);
    const w = warband("mercenaries_reikland", [hero("cap", "mercenaries_reikland_captain", [item("chaos_armour"), item("toughened_leathers")])]);
    expect(() => moveItem(w, { kind: "hero", id: "cap" }, { kind: "stash" }, "chaos_armour")).toThrow(/fuses/);
    expect(() => sellItem(w, { kind: "hero", id: "cap" }, "toughened_leathers", 1, 5)).toThrow(/cannot be sold/);
  });
});

describe("conditional pricing", () => {
  it("Skink heroes get Black Lotus common and cheap; Skaven see it at Rare 7", () => {
    const lizards = warband("lizardmen", [hero("p", "lizardmen_skink_priest")]);
    const skink = effectivePricing(I("black_lotus"), lizards, { unitTemplateId: "lizardmen_skink_priest", role: "hero" });
    expect(skink.item.price.base).toBe(10);
    expect(skink.item.availability.kind).toBe("common");
    expect(skink.notes[0]).toMatch(/Skink Heroes/);
    const skaven = effectivePricing(I("black_lotus"), warband("skaven_of_clan_eshin", []), {});
    expect(skaven.item.availability).toMatchObject({ kind: "rare", rarity: 7 });
    expect(effectivePricing(I("black_lotus"), warband("mercenaries_reikland", []), {}).item).toBe(I("black_lotus"));
  });

  it("Chaos armour gets cheaper with experience; a Familiar is paid for on failure; a Wolfcloak is a hunt", () => {
    const cultists = warband("cult_of_the_possessed", [hero("m", "cult_of_the_possessed_magister", [], { xp: 20 })]);
    const armour = effectivePricing(I("chaos_armour"), cultists, { hero: cultists.heroes[0] });
    expect(armour.item.price.base).toBe((I("chaos_armour").price.base ?? 0) - 20);
    expect(effectivePricing(I("familiar"), cultists, {}).paidOnFailure).toBe(true);
    const midden = warband("mercenaries_middenheim", [hero("c", "mercenaries_middenheim_captain")]);
    expect(effectivePricing(I("wolfcloak"), midden, {}).strengthHunt).toEqual({ free: false });
    expect(effectivePricing(I("wolfcloak"), midden, {}, { atCreation: true }).strengthHunt).toEqual({ free: true });
    expect(effectivePricing(I("wolfcloak"), warband("norse_explorers", []), {}, { atCreation: true }).strengthHunt).toEqual({ free: false });
  });

  it("an Opulent Coach adds +3 to every rare roll; a Trade Wagon's reputation grows with rare stock", () => {
    expect(warbandRareRollBonus(warband("mercenaries_reikland", [], [item("opulent_coach")])).bonus).toBe(3);
    const stock = ["black_lotus", "dark_venom", "elven_cloak", "lucky_charm", "tarot_cards"].map((id) => item(id));
    const merchant = warband("merchant_caravans", [], [item("trade_wagon"), ...stock]);
    expect(warbandRareRollBonus(merchant)).toMatchObject({ bonus: 1 });
    expect(warbandRareRollBonus(warband("merchant_caravans", [], [item("trade_wagon"), ...stock.slice(0, 4)])).bonus).toBe(0);
  });
});

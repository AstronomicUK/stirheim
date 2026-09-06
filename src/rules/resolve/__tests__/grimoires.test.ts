import { describe, expect, it } from "vitest";
import type { RosterHero, RosterWarband } from "../../types/roster";
import { emptyGrimoireChoices, grimoireUses, planGrimoire, spellForRoll } from "../grimoires";
import { findLore } from "../../data/campaign/magic";

const stats = { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 8 };

function hero(over: Partial<RosterHero> = {}): RosterHero {
  return {
    id: "mag",
    name: "Vhorsk",
    unitTemplateId: "cult_of_the_possessed_magister",
    stats,
    xp: 6,
    levelUps: 2,
    skillTableIds: ["academic"],
    skillIds: [],
    spellIds: ["vision_of_torment"],
    injuries: [],
    flags: {},
    equipment: [],
    status: "active",
    ...over,
  };
}

function roster(heroes: RosterHero[], stash: RosterWarband["stash"] = []): RosterWarband {
  return { id: "w", name: "The Hollow Choir", warbandTemplateId: "cult_of_the_possessed", gold: 0, wyrdstone: 0, veteranPool: null, heroes, henchmenGroups: [], hiredSwords: [], stash };
}

const uses = (r: RosterWarband, over: Partial<Parameters<typeof grimoireUses>[0]> = {}) =>
  grimoireUses({ roster: r, warbandName: "Cult of the Possessed", unitNameFor: () => "Magister", ...over });

describe("Tome of Magic", () => {
  it("offers a wizard his own lore or Lesser Magic, and nobody else anything", () => {
    const reader = hero({ equipment: [{ itemId: "tome_of_magic", quantity: 1 }] });
    const [use] = uses(roster([reader]));
    expect(use).toMatchObject({ itemId: "tome_of_magic", heroName: "Vhorsk", consumed: false, blocks: [] });
    expect(use.sources.map((s) => s.loreId)).toEqual(["chaos_rituals", "lesser_magic"]);
    // No wizard, no Arcane Lore, nothing to read.
    const mundane = hero({ id: "b", name: "Bram", unitTemplateId: "reikland_watch_swordsman", spellIds: [], equipment: [{ itemId: "tome_of_magic", quantity: 1 }] });
    expect(uses(roster([mundane]), { warbandName: "Reikland Watch", unitNameFor: () => "Swordsman" })).toEqual([]);
    // With Arcane Lore he can learn Lesser Magic from it.
    const scholar = { ...mundane, skillIds: ["arcane_lore"] };
    const [learned] = uses(roster([scholar]), { warbandName: "Reikland Watch", unitNameFor: () => "Swordsman" });
    expect(learned).toMatchObject({ becomesCaster: true });
    expect(learned.sources.map((s) => s.loreId)).toEqual(["lesser_magic"]);
  });

  it("is bound to its reader: a second tome does nothing for the same model", () => {
    const read = hero({ flags: { readTomeOfMagic: true }, equipment: [{ itemId: "tome_of_magic", quantity: 1 }] });
    expect(uses(roster([read]))[0].blocks[0]).toMatch(/already read a Tome of Magic/);
  });

  it("teaches the spell the die lands on and leaves the book on the roster", () => {
    const reader = hero({ equipment: [{ itemId: "tome_of_magic", quantity: 1 }] });
    const r = roster([reader]);
    const [use] = uses(r);
    expect(planGrimoire(r, use, emptyGrimoireChoices()).need).toBe("lore");
    const rolled = planGrimoire(r, use, { loreId: "chaos_rituals", roll: 3, duplicate: null });
    const wanted = spellForRoll(findLore("chaos_rituals")!, 3)!;
    expect(rolled.result?.hero.spellIds).toEqual(["vision_of_torment", wanted.id]);
    expect(rolled.result?.hero.flags.readTomeOfMagic).toBe(true);
    expect(rolled.result?.hero.equipment).toEqual(reader.equipment);
    expect(rolled.result?.events[0]).toMatchObject({ kind: "spellGained", data: { spellId: wanted.id, loreId: "chaos_rituals" } });
  });

  it("a spell he already knows is either re-rolled or taken at one lower Difficulty", () => {
    const reader = hero({ equipment: [{ itemId: "tome_of_magic", quantity: 1 }] });
    const r = roster([reader]);
    const [use] = uses(r);
    const dup = planGrimoire(r, use, { loreId: "chaos_rituals", roll: 1, duplicate: null });
    expect(dup).toMatchObject({ duplicate: true, need: "duplicate" });
    expect(planGrimoire(r, use, { loreId: "chaos_rituals", roll: 1, duplicate: "rollAgain" }).need).toBe("roll");
    const lowered = planGrimoire(r, use, { loreId: "chaos_rituals", roll: 1, duplicate: "lowerDifficulty" });
    expect(lowered.result?.hero.spellIds).toEqual(["vision_of_torment"]);
    expect(lowered.result?.hero.notes).toMatch(/Difficulty is lowered by 1/);
  });
});

describe("Book of the Dead", () => {
  const necro = (over: Partial<RosterHero> = {}) =>
    hero({ id: "n", name: "Grausam", unitTemplateId: "the_restless_dead_necromancer", spellIds: [], equipment: [{ itemId: "book_of_the_dead", quantity: 1 }], ...over });
  const at = (h: RosterHero, unit: string) => uses(roster([h]), { warbandName: "The Restless Dead", unitNameFor: () => unit });

  it("gives a Necromancer a new spell, and needs Arcane Lore from a Vampire", () => {
    const [forNecro] = at(necro(), "Necromancer");
    expect(forNecro.sources.map((s) => s.loreId)).toEqual(["necromancy"]);
    expect(forNecro.blocks).toEqual([]);
    const vamp = necro({ id: "v", name: "Lahmia", unitTemplateId: "the_restless_dead_vampire" });
    expect(at(vamp, "Vampire")[0].blocks[0]).toMatch(/needs the Arcane Lore skill/);
    expect(at({ ...vamp, skillIds: ["arcane_lore"] }, "Vampire")[0].blocks).toEqual([]);
  });

  it("is not for anyone else", () => {
    expect(uses(roster([hero({ equipment: [{ itemId: "book_of_the_dead", quantity: 1 }] })]))).toEqual([]);
  });
});

describe("Liber Bubonicus", () => {
  const sorcerer = (over: Partial<RosterHero> = {}) =>
    hero({ id: "s", name: "Skrikk", unitTemplateId: "skaven_pestilens_sorcerer", spellIds: [], equipment: [{ itemId: "liber_bubonicus", quantity: 1 }], ...over });
  const at = (h: RosterHero, unit: string, spent: string[] = []) =>
    uses(roster([h]), { warbandName: "Skaven of Clan Pestilens", unitNameFor: () => unit, spentInCampaign: spent });

  it("opens the Horned Rat list once, and only once in a campaign", () => {
    const [use] = at(sorcerer(), "Sorcerer");
    expect(use).toMatchObject({ consumed: true, blocks: [] });
    expect(use.sources.map((s) => s.loreId)).toEqual(["magic_of_the_horned_rat"]);
    expect(at(sorcerer(), "Sorcerer", ["liber_bubonicus"])[0].blocks[0]).toMatch(/once only/);
  });

  it("makes a Plague Priest with Magical Aptitude into a spellcaster", () => {
    const priest = sorcerer({ id: "p", name: "Nurglitch", unitTemplateId: "skaven_plague_priest" });
    expect(at(priest, "Plague Priest")[0].blocks[0]).toMatch(/Magical Aptitude/);
    const able = { ...priest, skillIds: ["sorcerous_society_additional_academic_skills_magical_aptitude"] };
    const [use] = at(able, "Plague Priest");
    expect(use).toMatchObject({ becomesCaster: true, blocks: [] });
  });

  it("is spent when it is read", () => {
    const s = sorcerer();
    const r = roster([s]);
    const [use] = at(s, "Sorcerer");
    const done = planGrimoire(r, use, { loreId: "magic_of_the_horned_rat", roll: 2, duplicate: null });
    expect(done.result?.hero.equipment).toEqual([]);
    expect(done.result?.events.some((e) => e.kind === "itemLost")).toBe(true);
    expect(done.result?.hero.spellIds).toHaveLength(1);
  });
});

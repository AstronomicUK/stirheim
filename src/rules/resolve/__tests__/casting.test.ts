import { describe, expect, it } from "vitest";
import type { RosterHero } from "../../types/roster";
import { applyCastRoll, armourBlockingCasting, availableRerolls, casterProfile, declineCastStep, describeCast, startCast, spendReroll } from "../casting";

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
    equipment: [{ itemId: "sword", quantity: 1 }],
    status: "active",
    ...over,
  };
}

const profileOf = (h: RosterHero) => casterProfile({ hero: h, warbandName: "Cult of the Possessed", unitName: "Magister" })!;

describe("who can cast", () => {
  it("finds the lore from a spell the hero knows, and from the Wizard table when he knows none", () => {
    expect(profileOf(hero()).lore.id).toBe("chaos_rituals");
    expect(profileOf(hero({ spellIds: [] })).lore.id).toBe("chaos_rituals");
    expect(casterProfile({ hero: hero({ spellIds: [], unitTemplateId: "reikland_watch_captain" }), warbandName: "Reikland", unitName: "Captain" })).toBeNull();
  });

  it("stops a wizard casting in armour, a shield or a buckler, but not in a helmet or Chaos Armour", () => {
    expect(armourBlockingCasting(hero({ equipment: [{ itemId: "helmet", quantity: 1 }, { itemId: "chaos_armour", quantity: 1 }] }))).toEqual([]);
    expect(armourBlockingCasting(hero({ equipment: [{ itemId: "light_armour", quantity: 1 }, { itemId: "buckler", quantity: 1 }] }))).toEqual(["Light Armour", "Buckler"]);
    expect(profileOf(hero({ equipment: [{ itemId: "shield", quantity: 1 }] })).blocks[0]).toMatch(/may not use magic wearing armour/);
    expect(profileOf(hero()).blocks).toEqual([]);
  });

  it("gathers the modifiers and re-rolls the kit and skills give", () => {
    const kitted = profileOf(hero({ skillIds: ["sorcery"], equipment: [{ itemId: "familiar", quantity: 1 }, { itemId: "magic_gubbinz", quantity: 1 }] }));
    expect(kitted.modifiers.map((m) => m.id)).toEqual(["sorcery"]);
    expect(kitted.rerolls.map((r) => r.id)).toEqual(["familiar", "magic_gubbinz"]);
    // A Holy Tome and a Rosary are prayer kit; Sorcery is not for priests.
    const priest = casterProfile({ hero: hero({ spellIds: ["hearts_of_steel"], skillIds: ["sorcery"], equipment: [{ itemId: "holy_tome", quantity: 1 }, { itemId: "rosary", quantity: 1 }, { itemId: "heavy_armour", quantity: 1 }] }), unitName: "Warrior Priest" })!;
    expect(priest.kind).toBe("prayer");
    expect(priest.modifiers.map((m) => m.id)).toEqual(["holy_tome"]);
    expect(priest.rerolls.map((r) => r.id)).toEqual(["rosary"]);
    // Sisters and priests may wear armour and still pray.
    expect(priest.blocks).toEqual([]);
  });
});

describe("rolling a cast", () => {
  const spellOf = (p: ReturnType<typeof profileOf>, name: string) => p.lore.spells.find((s) => s.name === name)!;

  it("casts on 2D6 equal to or over the Difficulty, then offers the enemy a dispel", () => {
    const p = profileOf(hero());
    const spell = spellOf(p, "Vision of Torment");
    const start = startCast(p, spell);
    expect(start.pending?.kind).toBe("cast");
    expect(start.pending?.dice).toBe(2);
    const cast = applyCastRoll(start, [5, 5]);
    expect(cast.outcome).toBe("cast");
    expect(cast.pending?.kind).toBe("dispel");
    expect(describeCast(cast)).toBe("Vhorsk casts Vision of Torment.");
    // Declining the dispel ends the attempt.
    const done = declineCastStep(cast);
    expect(done.done).toBe(true);
    expect(done.outcome).toBe("cast");
  });

  it("a successful dispel takes the spell away", () => {
    const p = profileOf(hero());
    const spell = spellOf(p, "Vision of Torment");
    const cast = applyCastRoll(startCast(p, spell), [6, 6]);
    const dispelled = applyCastRoll(cast, [6, 6]);
    expect(dispelled.outcome).toBe("dispelled");
    expect(describeCast(dispelled)).toMatch(/is dispelled/);
  });

  it("adds Sorcery to the total, and a Scroll only when the player spends it", () => {
    const p = profileOf(hero({ skillIds: ["sorcery", "sorcerous_society_additional_academic_skills_scribe"] }));
    const spell = spellOf(p, "Vision of Torment");
    expect(startCast(p, spell).bonus).toBe(1);
    expect(startCast(p, spell, { modifiers: [{ id: "scribe_scroll" }] }).bonus).toBe(3);
    // A rolled modifier carries the value the player entered.
    const ritual = profileOf(hero({ skillIds: ["the_restless_dead_variant_undead_special_skills_dark_ritual"] }));
    expect(startCast(ritual, spell, { modifiers: [{ id: "dark_ritual", amount: 3 }] }).bonus).toBe(3);
  });

  it("offers a re-roll on a failure, and fails outright once they are spent or declined", () => {
    const p = profileOf(hero({ equipment: [{ itemId: "familiar", quantity: 1 }] }));
    const spell = spellOf(p, "Vision of Torment");
    const missed = applyCastRoll(startCast(p, spell), [1, 2]);
    expect(missed.pending?.kind).toBe("chooseReroll");
    expect(availableRerolls(missed).map((r) => r.id)).toEqual(["familiar"]);
    const spending = spendReroll(missed, "familiar");
    expect(spending.pending?.kind).toBe("reroll");
    expect(spending.used).toContain("familiar");
    const second = applyCastRoll(spending, [1, 1]);
    expect(second.outcome).toBe("failed");
    expect(second.done).toBe(true);
    // Declining instead ends it there.
    expect(declineCastStep(missed).outcome).toBe("failed");
  });

  it("Magic Gubbinz has to pass its own D6 before the re-roll is granted", () => {
    const p = profileOf(hero({ equipment: [{ itemId: "magic_gubbinz", quantity: 1 }] }));
    const spell = spellOf(p, "Vision of Torment");
    const missed = applyCastRoll(startCast(p, spell), [1, 2]);
    const gate = spendReroll(missed, "magic_gubbinz");
    expect(gate.pending).toMatchObject({ kind: "gate", dice: 1 });
    expect(applyCastRoll(gate, [5]).pending?.kind).toBe("reroll");
    const failedGate = applyCastRoll(gate, [2]);
    expect(failedGate.outcome).toBe("failed");
  });

  it("Mind Focus re-rolls one die of the two", () => {
    const p = profileOf(hero({ skillIds: ["sorcerous_society_additional_academic_skills_mind_focus"] }));
    const spell = spellOf(p, "Vision of Torment");
    const missed = applyCastRoll(startCast(p, spell), [1, 2]);
    const focus = spendReroll(missed, "mind_focus");
    expect(focus.pending?.kind).toBe("rerollOneDie");
    const fixed = applyCastRoll(focus, [1, 6]);
    expect(fixed.dice).toEqual([6, 2]);
  });

  it("a spell the source marks Auto needs no roll", () => {
    const p = profileOf(hero({ spellIds: [] }));
    const auto = { id: "x", name: "Spell of Awakening", roll: { min: 1, max: 1 }, difficulty: null, text: "" };
    const state = startCast(p, auto);
    expect(state.outcome).toBe("automatic");
    expect(state.done).toBe(true);
  });

  it("Magical Aptitude offers a second spell on a Toughness test, and hurts him when it fails", () => {
    const p = profileOf(hero({ skillIds: ["sorcerous_society_additional_academic_skills_magical_aptitude"] }));
    expect(p.secondSpell).toBe(true);
    const cast = declineCastStep(applyCastRoll(startCast(p, p.lore.spells[0]), [6, 6]));
    expect(cast.pending?.kind).toBe("toughness");
    expect(applyCastRoll(cast, [2]).done).toBe(true);
    const wracked = applyCastRoll(cast, [5]);
    expect(wracked.pending?.kind).toBe("aptitudeInjury");
    const hurt = applyCastRoll(wracked, [6, 6]);
    expect(hurt.log.at(-1)?.text).toMatch(/Out of action counts as Stunned/);
    expect(hurt.done).toBe(true);
  });
});

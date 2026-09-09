import { describe, expect, it } from "vitest";
import type { RosterHero } from "../../types/roster";
import { applyCastRoll, armourBlockingCasting, availableRerolls, casterProfile, declineCastStep, describeCast, startCast, spendReroll, type CastState } from "../casting";

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

  it("casts on 2D6 equal to or over the Difficulty, and resolves immediately when nobody can dispel", () => {
    const p = profileOf(hero());
    const spell = spellOf(p, "Vision of Torment");
    const start = startCast(p, spell);
    expect(start.pending?.kind).toBe("cast");
    expect(start.pending?.dice).toBe(2);
    // No enemyDispel supplied: most tables have nobody with Elven Runestones or the like.
    const cast = applyCastRoll(start, [5, 5]);
    expect(cast.outcome).toBe("cast");
    expect(cast.pending).toBeNull();
    expect(cast.done).toBe(true);
    expect(describeCast(cast)).toBe("Vhorsk casts Vision of Torment.");
  });

  it("offers a dispel roll only when the enemy actually has a source, using that source's own mechanic", () => {
    const p = profileOf(hero());
    const spell = spellOf(p, "Vision of Torment");
    // Elven Runestones roll 2D6 against the spell's own Difficulty.
    const runestones = applyCastRoll(startCast(p, spell, { enemyDispel: [{ id: "elven_runestones", name: "Elven Runestones", detail: "x", against: "difficulty" }] }), [5, 5]);
    expect(runestones.pending).toEqual(expect.objectContaining({ kind: "dispel", dice: 2, dispelAgainst: "difficulty" }));
    const declined = declineCastStep(runestones);
    expect(declined.done).toBe(true);
    expect(declined.outcome).toBe("cast");

    // Blessed by Morr and the like are a flat D6 threshold, not 2D6 against the Difficulty.
    const morr = applyCastRoll(startCast(p, spell, { enemyDispel: [{ id: "blessed_by_morr", name: "Blessed by Morr", detail: "x", against: { threshold: 4 } }] }), [5, 5]);
    expect(morr.pending).toEqual(expect.objectContaining({ kind: "dispel", dice: 1, dispelAgainst: { threshold: 4 } }));
  });

  it("a successful dispel takes the spell away", () => {
    const p = profileOf(hero());
    const spell = spellOf(p, "Vision of Torment");
    const source = { id: "elven_runestones", name: "Elven Runestones", detail: "x", against: "difficulty" as const };
    const cast = applyCastRoll(startCast(p, spell, { enemyDispel: [source] }), [6, 6]);
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
    // No enemyDispel supplied, so nothing to decline first — straight to the Toughness offer.
    const cast = applyCastRoll(startCast(p, p.lore.spells[0]), [6, 6]);
    expect(cast.pending?.kind).toBe("toughness");
    expect(applyCastRoll(cast, [2]).done).toBe(true);
    const wracked = applyCastRoll(cast, [5]);
    expect(wracked.pending?.kind).toBe("aptitudeInjury");
    const hurt = applyCastRoll(wracked, [6, 6]);
    expect(hurt.log.at(-1)?.text).toMatch(/Out of action counts as Stunned/);
    expect(hurt.done).toBe(true);
  });
});

describe("the persisted log and diceManual say app-rolled vs entered by hand (#2)", () => {
  const spellOf = (p: ReturnType<typeof profileOf>, name: string) => p.lore.spells.find((s) => s.name === name)!;

  const has = (state: CastState, pattern: RegExp) => state.log.some((l) => pattern.test(l.text));

  it("tags the cast roll and records diceManual for the live display", () => {
    const p = profileOf(hero());
    const spell = spellOf(p, "Vision of Torment");
    const byHand = applyCastRoll(startCast(p, spell), [5, 5], true);
    expect(byHand.diceManual).toBe(true);
    expect(has(byHand, /Rolled 5 \+ 5 \(entered by hand\)/)).toBe(true);

    const byApp = applyCastRoll(startCast(p, spell), [5, 5], false);
    expect(byApp.diceManual).toBe(false);
    expect(has(byApp, /Rolled 5 \+ 5 \(rolled by the app\)/)).toBe(true);
  });

  it("omitting manual leaves diceManual undefined and the log untagged, same as before this existed", () => {
    const p = profileOf(hero());
    const spell = spellOf(p, "Vision of Torment");
    const cast = applyCastRoll(startCast(p, spell), [5, 5]);
    expect(cast.diceManual).toBeUndefined();
    expect(cast.log[0]?.text).toBe("Rolled 5 + 5 = 10 against 10+.");
  });

  it("tags a re-roll, Mind Focus, a reroll gate, a dispel, the Toughness test and the injury roll", () => {
    const p = profileOf(hero({ equipment: [{ itemId: "familiar", quantity: 1 }] }));
    const spell = spellOf(p, "Vision of Torment");
    const missed = applyCastRoll(startCast(p, spell), [1, 2], true);
    expect(has(missed, /\(entered by hand\)/)).toBe(true);
    const spending = spendReroll(missed, "familiar");
    const reroll = applyCastRoll(spending, [1, 1], false);
    expect(has(reroll, /Re-rolled 1 \+ 1 \(rolled by the app\)/)).toBe(true);

    const gubbinzP = profileOf(hero({ equipment: [{ itemId: "magic_gubbinz", quantity: 1 }] }));
    const gubbinzSpell = spellOf(gubbinzP, "Vision of Torment");
    const gubbinzMissed = applyCastRoll(startCast(gubbinzP, gubbinzSpell), [1, 2]);
    const gate = spendReroll(gubbinzMissed, "magic_gubbinz");
    expect(has(applyCastRoll(gate, [5], true), /rolled 5 \(entered by hand\)/)).toBe(true);

    const focusP = profileOf(hero({ skillIds: ["sorcerous_society_additional_academic_skills_mind_focus"] }));
    const focusSpell = spellOf(focusP, "Vision of Torment");
    const focusMissed = applyCastRoll(startCast(focusP, focusSpell), [1, 2]);
    const focus = spendReroll(focusMissed, "mind_focus");
    expect(has(applyCastRoll(focus, [1, 6], true), /to 6 \(entered by hand\)/)).toBe(true);

    const source = { id: "elven_runestones", name: "Elven Runestones", detail: "x", against: "difficulty" as const };
    const cast = applyCastRoll(startCast(p, spell, { enemyDispel: [source] }), [6, 6]);
    expect(has(applyCastRoll(cast, [6, 6], true), /Dispel attempt: rolled 6 \+ 6 \(entered by hand\)/)).toBe(true);

    const aptP = profileOf(hero({ skillIds: ["sorcerous_society_additional_academic_skills_magical_aptitude"] }));
    const aptCast = applyCastRoll(startCast(aptP, aptP.lore.spells[0]), [6, 6])
    const wracked = applyCastRoll(aptCast, [5], true)
    expect(has(wracked, /Toughness test: rolled 5 \(entered by hand\)/)).toBe(true)
    const hurt = applyCastRoll(wracked, [6, 6], false)
    expect(has(hurt, /Injury roll 6 \+ 6 \(rolled by the app\)/)).toBe(true)
  });
});

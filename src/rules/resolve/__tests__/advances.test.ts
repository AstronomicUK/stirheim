import { describe, expect, it } from "vitest";
import type { RosterHenchmanGroup, RosterHero, RosterWarband } from "../../types/roster";
import { HERO_XP_THRESHOLDS, RACIAL_MAXIMUMS, findRacialMaximum } from "../../data/campaign/experience";
import { WARBAND_TEMPLATES } from "../../data/warbandTemplates/index";
import { RulesError } from "../errors";
import {
  PROFILE_KEYWORD_RULES,
  WARBAND_PROFILE_OVERRIDES,
  allowedSkillTablesFor,
  applyHenchmanStatIncrease,
  applyStatIncrease,
  availableSkills,
  eligibleHenchmanStats,
  eligibleStatChoices,
  learnSkill,
  learnSpell,
  pendingAdvances,
  promoteHenchman,
  racialMaximumFor,
  recordAdvanceTaken,
  resolveHenchmanAdvanceRoll,
  resolveHeroAdvanceRoll,
  resolveHeroAdvanceSubRoll,
  resolveRacialProfile,
  xpToNextLevel,
} from "../advances";

function makeHero(over: Partial<RosterHero> = {}): RosterHero {
  return {
    id: "hero-1",
    name: "Test Captain",
    unitTemplateId: "mercenaries_reikland_mercenary_captain",
    stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
    xp: 20,
    levelUps: 0,
    skillTableIds: ["combat", "shooting", "academic", "strength", "speed"],
    skillIds: [],
    spellIds: [],
    injuries: [],
    flags: {},
    equipment: [{ itemId: "sword", quantity: 1 }],
    status: "active",
    ...over,
  };
}

function makeGroup(over: Partial<RosterHenchmanGroup> = {}): RosterHenchmanGroup {
  return {
    id: "group-1",
    name: "Warriors",
    unitTemplateId: "mercenaries_reikland_warriors",
    size: 3,
    stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
    xp: 5,
    levelUps: 1,
    statIncreases: { WS: 1 },
    equipment: [
      { itemId: "sword", quantity: 3 },
      { itemId: "shield", quantity: 1 },
    ],
    ...over,
  };
}

function makeWarband(over: Partial<RosterWarband> = {}): RosterWarband {
  return {
    id: "wb-1",
    name: "The Reikland Rovers",
    warbandTemplateId: "mercenaries_reikland",
    gold: 100,
    wyrdstone: 0,
    veteranPool: null,
    heroes: [makeHero()],
    henchmenGroups: [makeGroup()],
    hiredSwords: [],
    stash: [],
    ...over,
  };
}

const HUMAN = findRacialMaximum("Human")!.stats;
const clone = <T,>(x: T): T => structuredClone(x);

describe("experience thresholds", () => {
  it("counts advances crossed and points to the next box", () => {
    expect(pendingAdvances("hero", 20, 25)).toBe(1); // 24
    expect(pendingAdvances("hero", 0, 8)).toBe(4); // 2, 4, 6, 8
    expect(pendingAdvances("henchman", 0, 2)).toBe(1);
    expect(xpToNextLevel("hero", 20)).toBe(4);
    expect(xpToNextLevel("henchman", 9)).toBe(5);
    expect(xpToNextLevel("hero", HERO_XP_THRESHOLDS[HERO_XP_THRESHOLDS.length - 1])).toBeNull();
  });
});

describe("advance rolls", () => {
  it("hero 7 -> choose WS or BS", () => {
    expect(resolveHeroAdvanceRoll(7)).toMatchObject({ kind: "statChoice", options: ["WS", "BS"] });
  });

  it("hero 6 with D6 2 -> Strength, 5 -> Attacks", () => {
    expect(resolveHeroAdvanceRoll(6).kind).toBe("statSubRoll");
    expect(resolveHeroAdvanceSubRoll(6, 2)).toBe("S");
    expect(resolveHeroAdvanceSubRoll(6, 5)).toBe("A");
    expect(resolveHeroAdvanceSubRoll(9, 1)).toBe("W");
    expect(() => resolveHeroAdvanceSubRoll(7, 1)).toThrow(RulesError);
  });

  it("hero 12 (and 2-5) -> new skill", () => {
    expect(resolveHeroAdvanceRoll(12).kind).toBe("newSkill");
    expect(resolveHeroAdvanceRoll(3).kind).toBe("newSkill");
    expect(() => resolveHeroAdvanceRoll(13)).toThrow(RangeError);
  });

  it("henchman 10 -> the lad's got talent; 5 -> +1 S; 6 -> BS/WS choice", () => {
    expect(resolveHenchmanAdvanceRoll(10).kind).toBe("ladsGotTalent");
    expect(resolveHenchmanAdvanceRoll(5)).toMatchObject({ kind: "statIncrease", stat: "S" });
    expect(resolveHenchmanAdvanceRoll(6)).toMatchObject({ kind: "statChoice", options: ["BS", "WS"] });
  });
});

describe("racial maximums", () => {
  it("every keyword rule and override names a real RACIAL_MAXIMUMS profile", () => {
    for (const r of PROFILE_KEYWORD_RULES) expect(findRacialMaximum(r.profile), r.profile).toBeDefined();
    for (const [wb, o] of Object.entries(WARBAND_PROFILE_OVERRIDES)) {
      expect(WARBAND_TEMPLATES.some((t) => t.id === wb), `override for unknown warband ${wb}`).toBe(true);
      if (o.default) expect(findRacialMaximum(o.default), o.default).toBeDefined();
      for (const p of Object.values(o.units ?? {})) expect(findRacialMaximum(p), p).toBeDefined();
    }
  });

  it("maps well-known heroes", () => {
    const cases: [string, string, string][] = [
      ["mercenaries_reikland", "mercenaries_reikland_mercenary_captain", "Human"],
      ["cult_of_the_possessed", "cult_of_the_possessed_the_possessed", "Possessed"],
      ["cult_of_the_possessed", "cult_of_the_possessed_magister", "Human"],
    ];
    for (const [wb, unit, profile] of cases) {
      const res = resolveRacialProfile(makeHero({ unitTemplateId: unit }), wb);
      expect(res.value.profile, `${wb}/${unit}`).toBe(profile);
      expect(res.events).toEqual([]);
    }
  });

  it("resolves every hero template of every warband without warnings", () => {
    const warnings: string[] = [];
    for (const wb of WARBAND_TEMPLATES) {
      for (const h of wb.heroTemplates) {
        const res = resolveRacialProfile(makeHero({ unitTemplateId: h.id, name: h.name }), wb.id);
        if (res.events.length) warnings.push(`${wb.id}/${h.name}: ${res.events[0].message}`);
        expect(RACIAL_MAXIMUMS.some((r) => r.profile === res.value.profile)).toBe(true);
      }
    }
    expect(warnings).toEqual([]);
  });

  it("checks specific tricky names", () => {
    const pick = (wb: string, unitName: string) => {
      const t = WARBAND_TEMPLATES.find((w) => w.id === wb)!;
      const u = t.heroTemplates.find((h) => h.name === unitName)!;
      return resolveRacialProfile(makeHero({ unitTemplateId: u.id }), wb).value.profile;
    };
    expect(pick("the_undead", "Vampire")).toBe("Vampire");
    expect(pick("the_undead", "Necromancer")).toBe("Human");
    expect(pick("vampire_hunters_of_sylvania", "Vampire Hunter")).toBe("Human");
    expect(pick("beastmen_raiders", "Centigors")).toBe("Centigor");
    expect(pick("beastmen_raiders", "Beastmen Shaman")).toBe("Other Beastmen");
    expect(pick("orc_mob", "Orc Shaman")).toBe("Orc");
    expect(pick("black_orcs", "Young'un")).toBe("Black Orc");
    expect(pick("skaven_of_clan_pestilens", "Plague Priest")).toBe("Skaven (Clan Pestilens)");
    expect(pick("the_sons_of_hashut", "Bull Centaur")).toBe("Bull Centaur (The Sons of Hashut)");
    expect(pick("black_dwarfs", "Bull Centaur")).toBe("Bull Centaur (Black Dwarfs)");
    expect(pick("tomb_guardians", "Acolyte")).toBe("Liche Priest & Acolyte (Tomb Guardians)");
    expect(pick("marauders_of_chaos", "Seer")).toBe("Marauder Of Chaos");
    expect(pick("norse_explorers", "Wulfen")).toBe("Werecreature (Norse) Wulfen/Ulfwerenar");
    expect(pick("lustrian_reavers", "Saurus Slayer")).toBe("Human");
  });

  it("falls back to Human with a warning for an unknown warband and unit", () => {
    const res = resolveRacialProfile(makeHero({ unitTemplateId: "nope", name: "Zog" }), "no_such_warband");
    expect(res.value.profile).toBe("Human");
    expect(res.events[0].kind).toBe("warning");
    expect(racialMaximumFor(makeHero(), "mercenaries_reikland")).toEqual(HUMAN);
  });
});

describe("stat increases", () => {
  it("raises a hero stat and counts the advance", () => {
    const hero = makeHero();
    const res = applyStatIncrease(hero, "WS", HUMAN);
    expect(res.value.stats.WS).toBe(5);
    expect(res.value.levelUps).toBe(1);
    expect(res.events[0].message).toContain("Weapon Skill 4 -> 5");
  });

  it("refuses at the racial maximum (Human WS 6)", () => {
    const hero = makeHero({ stats: { ...makeHero().stats, WS: 6 } });
    expect(() => applyStatIncrease(hero, "WS", HUMAN)).toThrow(RulesError);
    try {
      applyStatIncrease(hero, "WS", HUMAN);
    } catch (e) {
      expect((e as RulesError).code).toBe("AT_RACIAL_MAX");
    }
  });

  it("eligibleStatChoices filters maxed options and falls back to any other stat", () => {
    const hero = makeHero({ stats: { ...makeHero().stats, WS: 6 } });
    expect(eligibleStatChoices(hero, ["WS", "BS"], HUMAN)).toEqual({ options: ["BS"], fallbackToAny: false });
    const maxed = makeHero({ stats: { ...makeHero().stats, WS: 6, BS: 6 } });
    const res = eligibleStatChoices(maxed, ["WS", "BS"], HUMAN);
    expect(res.fallbackToAny).toBe(true);
    expect(res.options).toEqual(["S", "T", "W", "I", "A", "Ld"]);
    expect(res.options).not.toContain("M"); // M 4 = Human max
  });

  it("henchman: second increase on the same stat is refused, others allowed", () => {
    const group = makeGroup({ statIncreases: { WS: 1 } });
    expect(() => applyHenchmanStatIncrease(group, "WS")).toThrow(RulesError);
    const res = applyHenchmanStatIncrease(group, "S");
    expect(res.value.stats.S).toBe(4);
    expect(res.value.statIncreases).toEqual({ WS: 1, S: 1 });
    expect(res.value.levelUps).toBe(2);
    expect(eligibleHenchmanStats(group, ["BS", "WS"])).toEqual(["BS"]);
    expect(eligibleHenchmanStats(group, ["WS"])).toEqual([]);
  });

  it("recordAdvanceTaken increments levelUps", () => {
    expect(recordAdvanceTaken(makeGroup({ levelUps: 3 })).levelUps).toBe(4);
  });
});

describe("skills and spells", () => {
  it("accepts a Combat skill for a hero with the combat table", () => {
    const res = learnSkill(makeHero({ skillTableIds: ["combat"] }), "strike_to_injure");
    expect(res.value.skillIds).toEqual(["strike_to_injure"]);
    expect(res.value.levelUps).toBe(1);
    expect(res.events.some((e) => e.kind === "skillLearned" && e.message.includes("Strike to Injure"))).toBe(true);
  });

  it("rejects unknown, duplicate and wrong-table skills", () => {
    const hero = makeHero({ skillTableIds: ["combat"], skillIds: ["strike_to_injure"] });
    const code = (fn: () => unknown) => {
      try {
        fn();
      } catch (e) {
        return (e as RulesError).code;
      }
      return undefined;
    };
    expect(code(() => learnSkill(hero, "not_a_skill"))).toBe("UNKNOWN_SKILL");
    expect(code(() => learnSkill(hero, "strike_to_injure"))).toBe("SKILL_KNOWN");
    expect(code(() => learnSkill(hero, "quick_shot"))).toBe("SKILL_TABLE_NOT_AVAILABLE");
  });

  it("handles warband skills via explicit table id or warband-unique", () => {
    const skill = "sisters_of_sigmar_skills_sign_of_sigmar";
    expect(learnSkill(makeHero({ skillTableIds: ["sisters_of_sigmar_skills"] }), skill).value.skillIds).toContain(skill);
    expect(learnSkill(makeHero({ skillTableIds: ["combat", "warband-unique"] }), skill).value.skillIds).toContain(skill);
    expect(() =>
      learnSkill(makeHero({ skillTableIds: ["combat", "warband-unique"] }), skill, undefined, { warbandTemplateId: "skaven_of_clan_eshin" }),
    ).toThrow(RulesError);
    expect(() => learnSkill(makeHero({ skillTableIds: ["combat"] }), skill)).toThrow(RulesError);
  });

  it("accepts a custom skill from the caller's universe with a warning", () => {
    const res = learnSkill(makeHero(), "house_skill", new Set(["house_skill"]));
    expect(res.value.skillIds).toEqual(["house_skill"]);
    expect(res.events[0].kind).toBe("warning");
  });

  it("lists available skills grouped by table, minus known ones", () => {
    const hero = makeHero({ skillTableIds: ["combat", "warband-unique"], skillIds: ["strike_to_injure"] });
    const tables = availableSkills(hero, "sisters_of_sigmar");
    expect(tables.map((t) => t.tableId)).toEqual(["combat", "sisters_of_sigmar_skills"]);
    expect(tables[0].skills.map((s) => s.id)).not.toContain("strike_to_injure");
    expect(tables[0].skills.map((s) => s.id)).toContain("combat_master");
    expect(tables[1].skills.find((s) => s.id === "sisters_of_sigmar_skills_utter_determination")?.restriction).toBeDefined();
    expect(tables[1].skills[0].description.length).toBeGreaterThan(0);
  });

  it("learns spells with lore validation", () => {
    const hero = makeHero();
    expect(() => learnSpell(hero, "no_lore", "no_spell")).toThrow(RulesError);
    const custom = learnSpell(hero, null, "house_spell");
    expect(custom.value.spellIds).toEqual(["house_spell"]);
    expect(custom.value.levelUps).toBe(1);
    expect(() => learnSpell(custom.value, null, "house_spell")).toThrow(RulesError);
  });
});

describe("promoteHenchman", () => {
  it("creates the hero, shrinks the group and copies experience", () => {
    const warband = makeWarband();
    const res = promoteHenchman(warband, "group-1", "Hans", ["combat", "speed"], "hero-2");
    const hero = res.value.heroes.find((h) => h.id === "hero-2")!;
    expect(hero).toMatchObject({
      name: "Hans",
      unitTemplateId: "mercenaries_reikland_warriors",
      xp: 5,
      levelUps: 1,
      skillTableIds: ["combat", "speed"],
      status: "active",
    });
    expect(hero.stats).toEqual(warband.henchmenGroups[0].stats);
    expect(hero.equipment).toEqual([
      { itemId: "sword", quantity: 1 },
      { itemId: "shield", quantity: 1 },
    ]);
    const group = res.value.henchmenGroups[0];
    expect(group.size).toBe(2);
    // Per-model stack (3 swords for 3 men) shrinks; the shared single shield is left alone.
    expect(group.equipment).toEqual([
      { itemId: "sword", quantity: 2 },
      { itemId: "shield", quantity: 1 },
    ]);
    expect(res.events.some((e) => e.kind === "heroPromoted")).toBe(true);
  });

  it("removes a one-man group entirely", () => {
    const res = promoteHenchman(makeWarband({ henchmenGroups: [makeGroup({ size: 1, equipment: [{ itemId: "axe", quantity: 1 }] })] }), "group-1", "Solo", ["combat", "strength"], "hero-2");
    expect(res.value.henchmenGroups).toEqual([]);
    expect(res.value.heroes[1].equipment).toEqual([{ itemId: "axe", quantity: 1 }]);
  });

  it("requires exactly two distinct valid tables", () => {
    const wb = makeWarband();
    expect(() => promoteHenchman(wb, "group-1", "X", ["combat"], "h")).toThrow(RulesError);
    expect(() => promoteHenchman(wb, "group-1", "X", ["combat", "combat"], "h")).toThrow(RulesError);
    expect(() => promoteHenchman(wb, "group-1", "X", ["combat", "speed", "strength"], "h")).toThrow(RulesError);
    expect(() => promoteHenchman(wb, "group-1", "X", ["combat", "sisters_of_sigmar_skills"], "h")).toThrow(RulesError);
    expect(() => promoteHenchman(wb, "nope", "X", ["combat", "speed"], "h")).toThrow(RulesError);
    expect(allowedSkillTablesFor("sisters_of_sigmar")).toEqual(expect.arrayContaining(["combat", "sisters_of_sigmar_skills", "warband-unique"]));
    const sisters = makeWarband({ warbandTemplateId: "sisters_of_sigmar" });
    expect(promoteHenchman(sisters, "group-1", "X", ["combat", "sisters_of_sigmar_skills"], "h").value.heroes).toHaveLength(2);
  });

  it("enforces a hero cap when given one", () => {
    try {
      promoteHenchman(makeWarband(), "group-1", "X", ["combat", "speed"], "h", { heroCapacity: 1 });
      expect.unreachable();
    } catch (e) {
      expect((e as RulesError).code).toBe("HERO_CAP");
    }
    expect(promoteHenchman(makeWarband(), "group-1", "X", ["combat", "speed"], "h", { heroCapacity: 6 }).value.heroes).toHaveLength(2);
  });

  it("never mutates its inputs", () => {
    const warband = makeWarband();
    const before = clone(warband);
    promoteHenchman(warband, "group-1", "Hans", ["combat", "speed"], "hero-2");
    const hero = makeHero();
    const heroBefore = clone(hero);
    applyStatIncrease(hero, "WS", HUMAN);
    learnSkill(hero, "strike_to_injure");
    learnSpell(hero, null, "x");
    eligibleStatChoices(hero, ["WS", "BS"], HUMAN);
    const group = makeGroup();
    const groupBefore = clone(group);
    applyHenchmanStatIncrease(group, "S");
    expect(warband).toEqual(before);
    expect(hero).toEqual(heroBefore);
    expect(group).toEqual(groupBefore);
  });
});

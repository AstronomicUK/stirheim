import { describe, expect, it } from "vitest";
import { computeSkillSensitivity, skillAvailableTo } from "../skillSensitivity";
import { attackGain, computeStatGainBreakdown, defendGain, statRelevance } from "../statSensitivity";
import { findWeapon } from "../../data/weapons";
import { findSkill } from "../../data/skills";
import { defaultOpponentScenario, opponentScenarioToDefenderProfile } from "../../domain/opponentScenario";
import type { Character, Weapon } from "../../types";
import { defaultCombatContext, defaultHouseRules } from "../../types";

const W = (id: string): Weapon => findWeapon(id)!;

function dwarf(overrides: Partial<Character> = {}): Character {
  return {
    id: "d",
    name: "Test Dwarf",
    warband: "Dwarf Treasure Hunters",
    role: "hero",
    stats: { M: 3, WS: 4, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 9 },
    equippedWeapons: ["sword"],
    armour: { type: "heavy", shield: true, buckler: false },
    helmet: false,
    skills: [],
    traits: ["hard_to_kill", "hard_head"],
    wardSaveThreshold: null,
    skillTableIds: ["combat", "strength", "warband-unique"],
    notes: "",
    ...overrides,
  };
}

describe("Skill Gain Analyser", () => {
  it("respects the character's skill lists", () => {
    const d = dwarf();
    expect(skillAvailableTo(findSkill("strike_to_injure")!, d)).toBe(true);
    expect(skillAvailableTo(findSkill("quick_shot")!, d)).toBe(false);
    expect(skillAvailableTo(findSkill("true_grit")!, d)).toBe(true);
    expect(skillAvailableTo(findSkill("quick_shot")!, { ...d, skillTableIds: [] })).toBe(true);
  });

  it("defensive melee: Thick Skull leaves OOA unchanged for a Hard to Kill Dwarf but lowers 'stunned or worse'", () => {
    const result = computeSkillSensitivity({
      character: dwarf(),
      weapons: [W("sword")],
      opponentWS: 4,
      opponentT: 3,
      opponentScenario: defaultOpponentScenario(),
      opponentWeapon: W("sword"),
      category: "defMelee",
      context: defaultCombatContext(),
    });
    const thickSkull = result.rows.find((r) => r.skill.id === "thick_skull")!;
    expect(thickSkull.chain.outOfAction).toBeCloseTo(result.baseline.outOfAction, 10);
    expect(thickSkull.chain.stunnedOrWorse).toBeLessThan(result.baseline.stunnedOrWorse);
    expect(thickSkull.chain.knockedDownOrWorse).toBeCloseTo(result.baseline.knockedDownOrWorse, 10);
    // Dwarf-only lists: no Speed skills (Dodge) offered in the melee defensive category either way.
    expect(result.rows.some((r) => r.skill.id === "dodge")).toBe(false);
  });

  it("defensive ranged uses the opponent's missile weapon, so Dodge has an effect from the first column", () => {
    const result = computeSkillSensitivity({
      character: dwarf({ skillTableIds: ["speed"] }),
      weapons: [W("sword")],
      opponentWS: 4,
      opponentT: 3,
      opponentScenario: defaultOpponentScenario(),
      opponentWeapon: W("bow"),
      category: "defRanged",
      context: defaultCombatContext(),
    });
    const dodge = result.rows.find((r) => r.skill.id === "dodge")!;
    expect(dodge.chain.outOfAction).toBeLessThan(result.baseline.outOfAction);
    expect(dodge.chain.anyWound).toBeLessThan(result.baseline.anyWound);
  });

  it("offensive melee: the chain is cumulative and Combat Master lifts every column once its trigger is on", () => {
    const off = computeSkillSensitivity({
      character: dwarf(),
      weapons: [W("sword")],
      opponentWS: 4,
      opponentT: 3,
      opponentScenario: defaultOpponentScenario(),
      opponentWeapon: W("sword"),
      category: "offMelee",
      context: defaultCombatContext(),
    });
    const b = off.baseline;
    expect(b.anyHit).toBeGreaterThanOrEqual(b.anyWound);
    expect(b.anyWound).toBeCloseTo(b.knockedDownOrWorse, 10);
    expect(b.knockedDownOrWorse).toBeGreaterThanOrEqual(b.stunnedOrWorse);
    expect(b.stunnedOrWorse).toBeGreaterThanOrEqual(b.outOfAction);
    const sti = off.rows.find((r) => r.skill.id === "strike_to_injure")!;
    expect(sti.chain.anyHit).toBeCloseTo(b.anyHit, 10);
    expect(sti.chain.outOfAction).toBeGreaterThan(b.outOfAction);
    const cmOff = off.rows.find((r) => r.skill.id === "combat_master")!;
    expect(cmOff.chain.outOfAction).toBeCloseTo(b.outOfAction, 10);
    const on = computeSkillSensitivity({
      character: dwarf(),
      weapons: [W("sword")],
      opponentWS: 4,
      opponentT: 3,
      opponentScenario: defaultOpponentScenario(),
      opponentWeapon: W("sword"),
      category: "offMelee",
      context: { ...defaultCombatContext(), fightingMultiple: true },
    });
    const cmOn = on.rows.find((r) => r.skill.id === "combat_master")!;
    expect(cmOn.chain.attacks).toBe(on.baseline.attacks + 1);
    expect(cmOn.chain.anyHit).toBeGreaterThan(on.baseline.anyHit);
    expect(cmOn.chain.outOfAction).toBeGreaterThan(on.baseline.outOfAction);
  });
});

describe("Stat relevance", () => {
  it("+1 Strength is irrelevant with a fixed-Strength missile weapon but relevant with a thrown one", () => {
    expect(statRelevance("S", "ranged", [W("bow")]).offensive).toBe(false);
    expect(statRelevance("S", "ranged", [W("throwing_knife")]).offensive).toBe(true);
    expect(statRelevance("S", "melee", [W("sword")]).offensive).toBe(true);
    expect(statRelevance("A", "ranged", [W("bow")]).offensive).toBe(false);
  });
});

describe("Stat Gain Analyser", () => {
  const run = (character: Character, opponentWS: number) =>
    computeStatGainBreakdown({
      character,
      weapons: [W("sword")],
      defender: opponentScenarioToDefenderProfile(defaultOpponentScenario(), opponentWS, 4),
      opponentWeapon: W("sword"),
      opponentS: 3,
      context: defaultCombatContext(),
      customSkills: [],
      houseRules: defaultHouseRules(),
      phase: "melee",
    });

  it("+1 Wounds is a defensive gain only, and a big one", () => {
    const b = run(dwarf(), 4);
    const w = b.rows.find((r) => r.stat === "W")!;
    expect(w.modeled).toBe(true);
    expect(attackGain(b.baselineAttack, w.attack, "outOfAction")).toBeCloseTo(0, 10);
    expect(defendGain(b.baselineDefend, w.defend, "outOfAction")).toBeGreaterThan(0);
    expect(w.defend.anyWound).toBeCloseTo(b.baselineDefend.anyWound, 10);
  });

  it("+1 Toughness has a defensive gain and no offensive one; +1 Attacks the reverse, lifting every attacking column", () => {
    const b = run(dwarf(), 4);
    const t = b.rows.find((r) => r.stat === "T")!;
    expect(attackGain(b.baselineAttack, t.attack, "outOfAction")).toBeCloseTo(0, 10);
    expect(defendGain(b.baselineDefend, t.defend, "outOfAction")).toBeGreaterThan(0);
    const a = b.rows.find((r) => r.stat === "A")!;
    expect(a.attack.attacks).toBe(b.baselineAttack.attacks + 1);
    expect(a.attack.anyHit).toBeGreaterThan(b.baselineAttack.anyHit);
    expect(attackGain(b.baselineAttack, a.attack, "outOfAction")).toBeGreaterThan(0);
    expect(defendGain(b.baselineDefend, a.defend, "outOfAction")).toBeCloseTo(0, 10);
  });

  it("+1 WS pays off offensively when it crosses the opponent's WS, and defensively when it stops the opponent out-skilling you", () => {
    const ws3 = dwarf({ stats: { M: 3, WS: 3, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 9 } });
    // Attacking a WS3 opponent: WS3 needs 4+, WS4 needs 3+.
    const vs3 = run(ws3, 3);
    expect(attackGain(vs3.baselineAttack, vs3.rows.find((r) => r.stat === "WS")!.attack, "outOfAction")).toBeGreaterThan(0);
    // Defending against a WS4 opponent: they hit WS3 on 3+, WS4 on 4+.
    const vs4 = run(ws3, 4);
    expect(defendGain(vs4.baselineDefend, vs4.rows.find((r) => r.stat === "WS")!.defend, "outOfAction")).toBeGreaterThan(0);
  });
});

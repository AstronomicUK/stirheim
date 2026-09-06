// Phase 16: weapon rules the engine used to carry only as tags, kit that changes saves and to-hit
// rolls, and the data fixes from the weapons and armour audit.

import { describe, expect, it } from "vitest";
import { findWeapon } from "../../data/weapons";
import type { Character, CombatContext, DefenderProfile, Weapon } from "../../types";
import { defaultCombatContext } from "../../types";
import { buildAttackInput, computeAttackCount, effectiveOffensiveStats } from "../buildAttackInput";
import { IMPOSSIBLE } from "../dice";
import { resolveSingleAttack } from "../resolveAttack";

function W(id: string): Weapon {
  const weapon = findWeapon(id);
  if (!weapon) throw new Error(`test: no weapon ${id}`);
  return weapon;
}

function ctx(overrides: Partial<CombatContext> = {}): CombatContext {
  return { ...defaultCombatContext(), ...overrides };
}

function attacker(overrides: Partial<Character> = {}): Character {
  return {
    id: "a",
    name: "Attacker",
    warband: "W",
    role: "hero",
    stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
    equippedWeapons: [],
    armour: { type: "none", shield: false, buckler: false },
    helmet: false,
    skills: [],
    traits: [],
    wardSaveThreshold: null,
    notes: "",
    ...overrides,
  };
}

function defender(overrides: Partial<DefenderProfile> = {}): DefenderProfile {
  return {
    WS: 3,
    T: 3,
    S: 3,
    W: 1,
    armour: { type: "none", shield: false, buckler: false },
    helmet: false,
    activeSkillIds: [],
    activeTraitIds: [],
    parryWeaponCount: 0,
    parryReroll: false,
    wardSaveThreshold: null,
    ...overrides,
  };
}

describe("audit data fixes", () => {
  it("the Ostlander double-barrelled weapons carry the -2 save of the guns they copy", () => {
    expect(W("ostlander_double_barrelled_hunting_rifle").saveModifier).toBe(2);
    expect(W("ostlander_double_barrelled_pistol").saveModifier).toBe(2);
  });

  it("a Lance only gets its Strength bonus on a mounted charge", () => {
    const lance = W("lance");
    expect(effectiveOffensiveStats(attacker(), lance, ctx({ charging: true })).strength).toBe(3);
    expect(effectiveOffensiveStats(attacker(), lance, ctx({ charging: true, mounted: true })).strength).toBe(5);
    expect(effectiveOffensiveStats(attacker(), lance, ctx({ mounted: true })).strength).toBe(3);
  });

  it("the Ogre Club's save modifier needs both hands", () => {
    const club = W("ogre_club");
    const armoured = defender({ armour: { type: "heavy", shield: false, buckler: false } });
    expect(buildAttackInput({ attacker: attacker(), weapon: club, defender: armoured, context: ctx() }).armourThreshold).toBe(5);
    expect(buildAttackInput({ attacker: attacker(), weapon: club, defender: armoured, context: ctx({ twoHanded: true }) }).armourThreshold).toBe(6);
  });

  it("a Cooking Pot Helmet is a 5+ stun save that never improves with Thick Skull", () => {
    const pot = defender({ stunSave: { threshold: 5, unmodifiable: true }, activeSkillIds: ["thick_skull"] });
    expect(buildAttackInput({ attacker: attacker(), weapon: W("club"), defender: pot, context: ctx() }).stunAvoidanceThreshold).toBe(5);
    const helmet = defender({ helmet: true });
    expect(buildAttackInput({ attacker: attacker(), weapon: W("club"), defender: helmet, context: ctx() }).stunAvoidanceThreshold).toBe(4);
  });

  it("a Ladle lets only a shield save", () => {
    const ladle = W("ladle");
    const plate = defender({ armour: { type: "gromril", shield: false, buckler: false }, helmet: true });
    expect(buildAttackInput({ attacker: attacker(), weapon: ladle, defender: plate, context: ctx() }).armourThreshold).toBe(IMPOSSIBLE);
    const shielded = defender({ armour: { type: "gromril", shield: true, buckler: false } });
    expect(buildAttackInput({ attacker: attacker(), weapon: ladle, defender: shielded, context: ctx() }).armourThreshold).toBe(6);
  });
});

describe("weapon rules the engine now reads", () => {
  it("Cathayan Longsword: +1 Weapon Skill while fighting with it", () => {
    expect(effectiveOffensiveStats(attacker(), W("cathayan_longsword"), ctx()).ws).toBe(5);
  });

  it("Chain Sticks: +2 Attacks in the first turn only", () => {
    expect(computeAttackCount(attacker(), W("chain_sticks"), true, ctx())).toBe(1);
    expect(computeAttackCount(attacker(), W("chain_sticks"), true, ctx({ firstTurnOfCombat: true }))).toBe(3);
    expect(computeAttackCount(attacker(), W("chain_sticks"), true, ctx({ charging: true }))).toBe(3);
  });

  it("Whipcrack also fires when the wielder is charged", () => {
    expect(computeAttackCount(attacker(), W("steel_whip"), true, ctx({ firstTurnOfCombat: true }))).toBe(2);
  });

  it("Quarter Staff: the free hand adds an attack when the staff is used alone", () => {
    expect(computeAttackCount(attacker(), W("quarter_staff"), true, ctx())).toBe(1);
    expect(computeAttackCount(attacker(), W("quarter_staff"), true, ctx({ twoHanded: true }))).toBe(2);
  });

  it("Sigmarite Warhammer wounds Undead and Possessed more easily", () => {
    const hammer = W("sigmarite_warhammer");
    const living = buildAttackInput({ attacker: attacker(), weapon: hammer, defender: defender(), context: ctx() });
    const undead = buildAttackInput({ attacker: attacker(), weapon: hammer, defender: defender({ activeTraitIds: ["undead"] }), context: ctx() });
    expect(living.woundThreshold).toBe(3); // S4 v T3
    expect(undead.woundThreshold).toBe(2);
  });

  it("Silver-tip Stake: +1 to injury against Vampires only", () => {
    const stake = W("silver_tip_stake");
    expect(buildAttackInput({ attacker: attacker(), weapon: stake, defender: defender(), context: ctx() }).injuryRollModifier).toBe(0);
    expect(buildAttackInput({ attacker: attacker(), weapon: stake, defender: defender({ activeTraitIds: ["vampire"] }), context: ctx() }).injuryRollModifier).toBe(1);
  });

  it("Dark Elf Blade adds one to the critical table roll", () => {
    expect(buildAttackInput({ attacker: attacker(), weapon: W("dark_elf_blade"), defender: defender(), context: ctx() }).critTableRollModifier).toBe(1);
  });

  it("Starblade parries on a fixed 4+", () => {
    const input = buildAttackInput({ attacker: attacker(), weapon: W("sword"), defender: defender({ parryWeaponCount: 1, parryThreshold: 4 }), context: ctx() });
    expect(input.parryEligible).toBe(true);
    expect(input.parrySuccessProbGivenAttempt).toBeCloseTo(0.5);
  });

  it("Misericordia rolls 2D6 to wound against a knocked-down target", () => {
    const input = buildAttackInput({ attacker: attacker(), weapon: W("misericordia"), defender: defender(), context: ctx({ targetKnockedDown: true }) });
    expect(input.rerollToWound).toBe(true);
    const plain = buildAttackInput({ attacker: attacker(), weapon: W("misericordia"), defender: defender(), context: ctx() });
    expect(plain.rerollToWound).toBeUndefined();
  });

  it("a Ball and Chain makes its wielder harder to hit", () => {
    const input = buildAttackInput({ attacker: attacker(), weapon: W("sword"), defender: defender({ toBeHit: { melee: -1 } }), context: ctx() });
    expect(input.hitThreshold).toBe(4); // WS4 v WS3 is 3+, one harder
  });

  it("repeaters may fire a single unpenalised shot; a sling may fire twice at -1", () => {
    const rc = W("repeater_crossbow");
    expect(computeAttackCount(attacker(), rc, true, ctx())).toBe(2);
    expect(computeAttackCount(attacker(), rc, true, ctx({ altFire: true }))).toBe(1);
    expect(buildAttackInput({ attacker: attacker(), weapon: rc, defender: defender(), context: ctx() }).hitThreshold).toBe(4);
    expect(buildAttackInput({ attacker: attacker(), weapon: rc, defender: defender(), context: ctx({ altFire: true }) }).hitThreshold).toBe(3);
    const sling = W("sling");
    expect(computeAttackCount(attacker(), sling, true, ctx({ altFire: true }))).toBe(2);
    expect(buildAttackInput({ attacker: attacker(), weapon: sling, defender: defender(), context: ctx({ altFire: true }) }).hitThreshold).toBe(4);
  });
});

describe("kit that changes the defender's odds", () => {
  it("Amulet of the Moon: -1 to be hit by missiles and a 5+ save against them", () => {
    const amulet = defender({ toBeHit: { missile: -1 }, missileWardSaveThreshold: 5 });
    const shot = buildAttackInput({ attacker: attacker(), weapon: W("bow"), defender: amulet, context: ctx() });
    expect(shot.hitThreshold).toBe(4); // BS4 is 3+, one harder
    expect(shot.wardSaveThreshold).toBe(5);
    const blow = buildAttackInput({ attacker: attacker(), weapon: W("sword"), defender: amulet, context: ctx() });
    expect(blow.wardSaveThreshold).toBeUndefined();
  });

  it("a Wolfcloak adds one to the save against shooting, even from nothing", () => {
    const cloak = defender({ saveBonus: { missile: 1, savesFromNothing: true } });
    expect(buildAttackInput({ attacker: attacker(), weapon: W("bow"), defender: cloak, context: ctx() }).armourThreshold).toBe(6);
    expect(buildAttackInput({ attacker: attacker(), weapon: W("sword"), defender: cloak, context: ctx() }).armourThreshold).toBe(IMPOSSIBLE);
    const armoured = defender({ armour: { type: "light", shield: false, buckler: false }, saveBonus: { missile: 1, savesFromNothing: true } });
    expect(buildAttackInput({ attacker: attacker(), weapon: W("bow"), defender: armoured, context: ctx() }).armourThreshold).toBe(5);
  });

  it("a Sea Dragon Cloak is a save of its own when better than the armour", () => {
    const cloak = defender({ ownSave: { melee: 5, missile: 4 }, armour: { type: "light", shield: false, buckler: false } });
    expect(buildAttackInput({ attacker: attacker(), weapon: W("sword"), defender: cloak, context: ctx() }).armourThreshold).toBe(5);
    expect(buildAttackInput({ attacker: attacker(), weapon: W("bow"), defender: cloak, context: ctx() }).armourThreshold).toBe(4);
  });

  it("a Peg Leg is a further save after every failed one", () => {
    const peg = defender({ afterSaveThreshold: 6 });
    const input = buildAttackInput({ attacker: attacker(), weapon: W("sword"), defender: peg, context: ctx() });
    expect(input.afterSaveThreshold).toBe(6);
    const breakdown = resolveSingleAttack(input);
    // Hit 3+ (2/3), wound 4+ (1/2), no armour, peg leg saves 1/6.
    expect(breakdown.pWound).toBeCloseTo((2 / 3) * (1 / 2));
    const through = breakdown.normalEvents.filter((e) => e.wounds > 0).reduce((n, e) => n + e.probability, 0);
    expect(through).toBeCloseTo(5 / 6);
  });
});

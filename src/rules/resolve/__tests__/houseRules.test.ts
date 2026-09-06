import { describe, expect, it } from "vitest";
import { applyHouseRuleDefaults, defaultCampaignHouseRules, describeHouseRules } from "../houseRules";

describe("applyHouseRuleDefaults", () => {
  it("returns the group defaults for nothing", () => {
    const noBans = { items: [], spells: [], hiredSwords: [], characters: [], skills: [] };
    const expected = { strengthArmourPiercing: false, optionalCriticalTables: true, halfPriceArmour: true, halfPriceShields: false, halfPriceHelmets: false, rabbitsFootBattleOnly: true, rewardsOfTheShadowlord: false, bans: noBans };
    expect(applyHouseRuleDefaults()).toEqual(expected);
    expect(applyHouseRuleDefaults(null)).toEqual(expected);
    expect(applyHouseRuleDefaults({})).toEqual(expected);
    expect(defaultCampaignHouseRules()).toEqual(expected);
  });

  it("overrides only the switches given, ignoring undefined", () => {
    const partial = { halfPriceArmour: false, strengthArmourPiercing: undefined };
    expect(applyHouseRuleDefaults(partial)).toEqual({
      strengthArmourPiercing: false,
      optionalCriticalTables: true,
      halfPriceArmour: false,
    halfPriceShields: false,
    halfPriceHelmets: false,
    rabbitsFootBattleOnly: true,
    rewardsOfTheShadowlord: false,
      bans: { items: [], spells: [], hiredSwords: [], characters: [], skills: [] },
    });
    expect(applyHouseRuleDefaults({ strengthArmourPiercing: true, optionalCriticalTables: false })).toEqual({
      strengthArmourPiercing: true,
      optionalCriticalTables: false,
      halfPriceArmour: true,
    halfPriceShields: false,
    halfPriceHelmets: false,
    rabbitsFootBattleOnly: true,
    rewardsOfTheShadowlord: false,
      bans: { items: [], spells: [], hiredSwords: [], characters: [], skills: [] },
    });
    expect(applyHouseRuleDefaults({ bans: { items: ["nurgles_rot"], spells: [], hiredSwords: [], characters: [], skills: [] } }).bans.items).toEqual(["nurgles_rot"]);
    expect(partial).toEqual({ halfPriceArmour: false, strengthArmourPiercing: undefined });
  });

  it("returns a fresh object each call", () => {
    expect(applyHouseRuleDefaults()).not.toBe(applyHouseRuleDefaults());
  });
});

describe("describeHouseRules", () => {
  it("gives one line per switch reflecting the setting", () => {
    const on = describeHouseRules(defaultCampaignHouseRules());
    expect(on).toHaveLength(6);
    expect(on[5]).toMatch(/Nothing is banned/);
    expect(on[4]).toMatch(/Rewards of the Shadowlord not in use/);
    expect(on[0]).toMatch(/does not modify armour saves/);
    expect(on[1]).toMatch(/expanded/);
    expect(on[2]).toMatch(/half its listed price/);
    expect(on[2]).toMatch(/shields, bucklers and helmets/);

    const off = describeHouseRules({ strengthArmourPiercing: true, optionalCriticalTables: false, halfPriceArmour: false, halfPriceShields: false, halfPriceHelmets: false, rabbitsFootBattleOnly: true, rewardsOfTheShadowlord: false, bans: { items: ["nurgles_rot"], spells: [], hiredSwords: [], characters: [], skills: ["sprint"] } });
    expect(off[5]).toMatch(/2 entries \(1 item, 1 skill\)/);
    const shields = describeHouseRules({ ...defaultCampaignHouseRules(), halfPriceShields: true });
    expect(shields[2]).toMatch(/shields included, helmets full price/);
    expect(off[0]).toMatch(/Strength modifies armour saves/);
    expect(off[1]).toMatch(/core rulebook chart/);
    expect(off[2]).toBe("Armour costs its listed price.");
  });
});

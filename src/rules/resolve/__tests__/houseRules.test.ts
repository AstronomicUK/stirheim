import { describe, expect, it } from "vitest";
import { applyHouseRuleDefaults, defaultCampaignHouseRules, describeHouseRules } from "../houseRules";

describe("applyHouseRuleDefaults", () => {
  it("returns the group defaults for nothing", () => {
    const expected = { strengthArmourPiercing: false, optionalCriticalTables: true, halfPriceArmour: true, rabbitsFootBattleOnly: true };
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
    rabbitsFootBattleOnly: true,
    });
    expect(applyHouseRuleDefaults({ strengthArmourPiercing: true, optionalCriticalTables: false })).toEqual({
      strengthArmourPiercing: true,
      optionalCriticalTables: false,
      halfPriceArmour: true,
    rabbitsFootBattleOnly: true,
    });
    expect(partial).toEqual({ halfPriceArmour: false, strengthArmourPiercing: undefined });
  });

  it("returns a fresh object each call", () => {
    expect(applyHouseRuleDefaults()).not.toBe(applyHouseRuleDefaults());
  });
});

describe("describeHouseRules", () => {
  it("gives one line per switch reflecting the setting", () => {
    const on = describeHouseRules(defaultCampaignHouseRules());
    expect(on).toHaveLength(4);
    expect(on[0]).toMatch(/does not modify armour saves/);
    expect(on[1]).toMatch(/expanded/);
    expect(on[2]).toMatch(/half its listed price/);
    expect(on[2]).toMatch(/shields, bucklers and helmets/);

    const off = describeHouseRules({ strengthArmourPiercing: true, optionalCriticalTables: false, halfPriceArmour: false, rabbitsFootBattleOnly: true });
    expect(off[0]).toMatch(/Strength modifies armour saves/);
    expect(off[1]).toMatch(/core rulebook chart/);
    expect(off[2]).toBe("Armour costs its listed price.");
  });
});

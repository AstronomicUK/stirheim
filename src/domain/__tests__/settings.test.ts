import { describe, expect, it } from "vitest";
import { campaignHouseRulesSchema, campaignSettingsSchema, defaultCampaignSettings } from "../settings";

describe("campaign settings", () => {
  it('preserves each reload policy and leaves older campaigns unchanged', () => {
    expect(campaignSettingsSchema.parse({}).houseRules.doubleBarrelSkillReload).toBe('none');
    for (const policy of ['none', 'extra_chamber', 'full_reload'] as const) {
      const saved = campaignSettingsSchema.parse({ houseRules: { doubleBarrelSkillReload: policy } });
      expect(campaignSettingsSchema.parse(JSON.parse(JSON.stringify(saved))).houseRules.doubleBarrelSkillReload).toBe(policy);
    }
    expect(campaignSettingsSchema.safeParse({ houseRules: { doubleBarrelSkillReload: 'invented' } }).success).toBe(false);
  });
  it("keeps Healing Herbs reusable for old campaigns and preserves an explicit single-use choice", () => {
    expect(campaignSettingsSchema.parse({ houseRules: { halfPriceArmour: false } }).houseRules.healingHerbsSingleUse).toBe(false);
    const saved = campaignSettingsSchema.parse({ houseRules: { healingHerbsSingleUse: true } });
    expect(campaignSettingsSchema.parse(JSON.parse(JSON.stringify(saved))).houseRules.healingHerbsSingleUse).toBe(true);
  });
  it("an empty object parses to the defaults", () => {
    expect(campaignSettingsSchema.parse({})).toEqual(defaultCampaignSettings());
    expect(defaultCampaignSettings()).toEqual({
      startingGold: 500,
      maxRosters: null,
      houseRules: {
        strengthArmourPiercing: false,
        optionalCriticalTables: true,
        halfPriceArmour: true,
      halfPriceShields: false,
      halfPriceHelmets: false,
      rabbitsFootBattleOnly: true,
      rewardsOfTheShadowlord: false,
      firstSpellRule: "random",
        doubleBarrelSkillReload: 'none' as const, healingHerbsSingleUse: false, dismissHeroForTalent: false,
        opposedParryWS: false,
        bans: { items: [], spells: [], hiredSwords: [], characters: [], skills: [] },
      },
      dicePolicy: "players_roll",
      combatMode: "app",
      lockCombatMode: false,
      reportApproval: false,
      mapCampaign: false,
    });
  });

  it("matches the SQL column default", () => {
    // jsonb default from supabase/migrations/20260906000020_phase16.sql
    const fromSql = {
      startingGold: 500,
      maxRosters: null,
      houseRules: {
        strengthArmourPiercing: false,
        optionalCriticalTables: true,
        halfPriceArmour: true,
      halfPriceShields: false,
      halfPriceHelmets: false,
      rabbitsFootBattleOnly: true,
      rewardsOfTheShadowlord: false,
        bans: { items: [], spells: [], hiredSwords: [], characters: [], skills: [] },
      },
      dicePolicy: "players_roll",
      combatMode: "app",
      lockCombatMode: false,
      reportApproval: false,
      mapCampaign: false,
    };
    expect(campaignSettingsSchema.parse(fromSql)).toEqual(defaultCampaignSettings());
  });

  it("fills in whatever a partial object left out", () => {
    expect(
      campaignSettingsSchema.parse({
        maxRosters: 6,
        houseRules: { halfPriceArmour: false, rabbitsFootBattleOnly: true },
      }),
    ).toEqual({
      startingGold: 500,
      maxRosters: 6,
      houseRules: {
        strengthArmourPiercing: false,
        optionalCriticalTables: true,
        halfPriceArmour: false,
      halfPriceShields: false,
      halfPriceHelmets: false,
      rabbitsFootBattleOnly: true,
      rewardsOfTheShadowlord: false,
      firstSpellRule: "random",
        doubleBarrelSkillReload: 'none' as const, healingHerbsSingleUse: false, dismissHeroForTalent: false,
        opposedParryWS: false,
        bans: { items: [], spells: [], hiredSwords: [], characters: [], skills: [] },
      },
      dicePolicy: "players_roll",
      combatMode: "app",
      lockCombatMode: false,
      reportApproval: false,
      mapCampaign: false,
    });
    expect(campaignSettingsSchema.parse({ dicePolicy: "app_rolls" }).dicePolicy).toBe("app_rolls");
    expect(campaignSettingsSchema.parse({ combatMode: "players", lockCombatMode: true })).toMatchObject({ combatMode: "players", lockCombatMode: true });
    expect(campaignSettingsSchema.safeParse({ combatMode: "dice" }).success).toBe(false);
    expect(campaignHouseRulesSchema.parse({})).toEqual({
      strengthArmourPiercing: false,
      optionalCriticalTables: true,
      halfPriceArmour: true,
    halfPriceShields: false,
    halfPriceHelmets: false,
    rabbitsFootBattleOnly: true,
    rewardsOfTheShadowlord: false,
    firstSpellRule: "random",
      doubleBarrelSkillReload: 'none' as const, healingHerbsSingleUse: false, dismissHeroForTalent: false,
        opposedParryWS: false,
      bans: { items: [], spells: [], hiredSwords: [], characters: [], skills: [] },
    });
    expect(campaignHouseRulesSchema.parse({ bans: { items: ["nurgles_rot"] } }).bans).toEqual({ items: ["nurgles_rot"], spells: [], hiredSwords: [], characters: [], skills: [] });
  });

  it("rejects values that are present but wrong", () => {
    expect(campaignSettingsSchema.safeParse({ startingGold: -5 }).success).toBe(false);
    expect(campaignSettingsSchema.safeParse({ startingGold: 500.5 }).success).toBe(false);
    expect(campaignSettingsSchema.safeParse({ maxRosters: 0 }).success).toBe(false);
    expect(campaignSettingsSchema.safeParse({ dicePolicy: "gm_rolls" }).success).toBe(false);
    expect(
      campaignSettingsSchema.safeParse({
        houseRules: { halfPriceArmour: "yes" },
      }).success,
    ).toBe(false);
  });

  it("defaultCampaignSettings returns a fresh object each call", () => {
    const a = defaultCampaignSettings();
    const b = defaultCampaignSettings();
    expect(a).not.toBe(b);
    expect(a.houseRules).not.toBe(b.houseRules);
  });
});

import { describe, expect, it } from "vitest";
import { campaignHouseRulesSchema, campaignSettingsSchema, defaultCampaignSettings } from "../settings";

describe("campaign settings", () => {
  it("an empty object parses to the defaults", () => {
    expect(campaignSettingsSchema.parse({})).toEqual(defaultCampaignSettings());
    expect(defaultCampaignSettings()).toEqual({
      startingGold: 500,
      maxRosters: null,
      houseRules: {
        strengthArmourPiercing: false,
        optionalCriticalTables: true,
        halfPriceArmour: true,
      },
      dicePolicy: "players_roll",
    });
  });

  it("matches the SQL column default", () => {
    // jsonb default from supabase/migrations/20260904000001_schema.sql
    const fromSql = {
      startingGold: 500,
      maxRosters: null,
      houseRules: {
        strengthArmourPiercing: false,
        optionalCriticalTables: true,
        halfPriceArmour: true,
      },
      dicePolicy: "players_roll",
    };
    expect(campaignSettingsSchema.parse(fromSql)).toEqual(defaultCampaignSettings());
  });

  it("fills in whatever a partial object left out", () => {
    expect(
      campaignSettingsSchema.parse({
        maxRosters: 6,
        houseRules: { halfPriceArmour: false },
      }),
    ).toEqual({
      startingGold: 500,
      maxRosters: 6,
      houseRules: {
        strengthArmourPiercing: false,
        optionalCriticalTables: true,
        halfPriceArmour: false,
      },
      dicePolicy: "players_roll",
    });
    expect(campaignSettingsSchema.parse({ dicePolicy: "app_rolls" }).dicePolicy).toBe("app_rolls");
    expect(campaignHouseRulesSchema.parse({})).toEqual({
      strengthArmourPiercing: false,
      optionalCriticalTables: true,
      halfPriceArmour: true,
    });
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

// campaigns.settings. Every field has a default so a settings object written by an older client,
// or a half-filled form, still parses to a complete CampaignSettings. The SQL column default in
// supabase/migrations/20260904000001_schema.sql must stay in step with defaultCampaignSettings().

import { z } from "zod";
import type { CampaignHouseRules } from "../rules/types/roster";
import { defaultCampaignHouseRules } from "../rules/types/roster";

export const DICE_POLICIES = ["players_roll", "app_rolls"] as const;
export const dicePolicySchema = z.enum(DICE_POLICIES);
export type DicePolicy = z.infer<typeof dicePolicySchema>;

export const campaignHouseRulesSchema = z.object({
  strengthArmourPiercing: z.boolean().default(false),
  optionalCriticalTables: z.boolean().default(true),
  halfPriceArmour: z.boolean().default(true),
}) satisfies z.ZodType<CampaignHouseRules, unknown>;

export const campaignSettingsSchema = z.object({
  /** Gold crowns a new warband in this campaign is built with. */
  startingGold: z.number().int().min(0).default(500),
  /** Cap on enrolled warbands; null = unlimited. Enforced by join_campaign(). */
  maxRosters: z.number().int().min(1).nullable().default(null),
  houseRules: campaignHouseRulesSchema.default(defaultCampaignHouseRules),
  /** Who rolls the dice for post-battle sequences: the players at the table, or the app. */
  dicePolicy: dicePolicySchema.default("players_roll"),
});

/** A complete settings object, as stored and as read. */
export type CampaignSettings = z.output<typeof campaignSettingsSchema>;
/** What a form or an older client may hand in: every field optional. */
export type CampaignSettingsInput = z.input<typeof campaignSettingsSchema>;

export function defaultCampaignSettings(): CampaignSettings {
  return {
    startingGold: 500,
    maxRosters: null,
    houseRules: defaultCampaignHouseRules(),
    dicePolicy: "players_roll",
  };
}

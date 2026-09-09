// campaigns.settings. Every field has a default so a settings object written by an older client,
// or a half-filled form, still parses to a complete CampaignSettings. The SQL column default in
// supabase/migrations/20260904000001_schema.sql must stay in step with defaultCampaignSettings().

import { z } from "zod";
import type { CampaignBans, CampaignHouseRules, FirstSpellRule } from "../rules/types/roster";
import { defaultCampaignHouseRules, emptyCampaignBans } from "../rules/types/roster";

export const FIRST_SPELL_RULES = ["random", "chooseFreely", "rollTwicePickOne"] as const satisfies readonly FirstSpellRule[];
export const firstSpellRuleSchema = z.enum(FIRST_SPELL_RULES);

export const DICE_POLICIES = ["players_roll", "app_rolls"] as const;
export const dicePolicySchema = z.enum(DICE_POLICIES);
export type DicePolicy = z.infer<typeof dicePolicySchema>;

/** How a game is scored: the app's calculator and shared log, or plain tally sheets. */
export const COMBAT_MODES = ["app", "players"] as const;
export const combatModeSchema = z.enum(COMBAT_MODES);
export type CombatMode = z.infer<typeof combatModeSchema>;

const idList = z.array(z.string().min(1)).default([]);
export const campaignBansSchema = z.object({
  items: idList,
  spells: idList,
  hiredSwords: idList,
  characters: idList,
  skills: idList,
}) satisfies z.ZodType<CampaignBans, unknown>;

export const campaignHouseRulesSchema = z.object({
  strengthArmourPiercing: z.boolean().default(false),
  optionalCriticalTables: z.boolean().default(true),
  halfPriceArmour: z.boolean().default(true),
  halfPriceShields: z.boolean().default(false),
  halfPriceHelmets: z.boolean().default(false),
  rabbitsFootBattleOnly: z.boolean().default(true),
  rewardsOfTheShadowlord: z.boolean().default(false),
  firstSpellRule: firstSpellRuleSchema.default("random"),
  opposedParryWS: z.boolean().default(false),
  bans: campaignBansSchema.default(emptyCampaignBans),
}) satisfies z.ZodType<CampaignHouseRules, unknown>;

export const campaignSettingsSchema = z.object({
  /** Gold crowns a new warband in this campaign is built with. */
  startingGold: z.number().int().min(0).default(500),
  /** Cap on enrolled warbands; null = unlimited. Enforced by join_campaign(). */
  maxRosters: z.number().int().min(1).nullable().default(null),
  houseRules: campaignHouseRulesSchema.default(defaultCampaignHouseRules),
  /** Who rolls the dice for post-battle sequences: the players at the table, or the app. */
  dicePolicy: dicePolicySchema.default("players_roll"),
  /** Default combat mode for new games in this campaign. */
  combatMode: combatModeSchema.default("app"),
  /** When true, only the GM may start a game with a different combat mode. */
  lockCombatMode: z.boolean().default(false),
  /** When true, a player's post-battle report waits, applying nothing, until the GM approves it. */
  reportApproval: z.boolean().default(false),
  /** The campaign is played on the Mordheim Campaign Map: battles are fought in districts, footholds and advantages tracked. */
  mapCampaign: z.boolean().default(false),
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
    combatMode: "app",
    lockCombatMode: false,
    reportApproval: false,
    mapCampaign: false,
  };
}

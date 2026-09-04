// Schemas for the jsonb columns. These hold the same shapes as src/rules/types/roster.ts (camelCase
// keys) so a row maps onto the resolver model with no translation. Each schema is checked against
// the rules type with `satisfies` so the two can never drift apart silently.

import { z } from "zod";
import type { Stats } from "../rules/types/index";
import type { StatKey } from "../rules/types/common";
import type { AppliedInjury, WarriorFlags } from "../rules/types/roster";

/** The nine characteristics, in rulebook order. Mirrors public.is_stats_profile(). */
export const STAT_KEYS = ["M", "WS", "BS", "S", "T", "W", "I", "A", "Ld"] as const satisfies readonly StatKey[];

export const statKeySchema = z.enum(STAT_KEYS);

const stat = z.number().int();

/** heroes.stats / henchman_groups.stats */
export const statsSchema = z.object({
  M: stat,
  WS: stat,
  BS: stat,
  S: stat,
  T: stat,
  W: stat,
  I: stat,
  A: stat,
  Ld: stat,
}) satisfies z.ZodType<Stats>;

/** One element of heroes.injuries. */
export const appliedInjurySchema = z.object({
  injuryCode: z.string().min(1),
  name: z.string(),
  rolled: z.object({
    d66: z.number().int(),
    subRoll: z.number().int().optional(),
  }),
  effect: z.string(),
  matchId: z.string().optional(),
}) satisfies z.ZodType<AppliedInjury>;

export const appliedInjuriesSchema = z.array(appliedInjurySchema);

/** heroes.flags */
export const warriorFlagsSchema = z.object({
  missNextGames: z.number().int().min(0).optional(),
  oldBattleWound: z.boolean().optional(),
  singleHandedWeaponsOnly: z.boolean().optional(),
  noRunning: z.boolean().optional(),
  blindedInOneEye: z.boolean().optional(),
  stupidity: z.boolean().optional(),
  frenzy: z.boolean().optional(),
  immuneToFear: z.boolean().optional(),
  causesFear: z.boolean().optional(),
  captured: z.boolean().optional(),
  hates: z.string().optional(),
}) satisfies z.ZodType<WarriorFlags>;

/** henchman_groups.stat_increases: increases already taken per characteristic. */
export const statIncreasesSchema = z.partialRecord(statKeySchema, z.number().int().min(0)) satisfies z.ZodType<
  Partial<Record<StatKey, number>>
>;

// Shapes that are not designed yet. Replace with real schemas when the phase lands.
// TODO Phase 6: battle_sessions.live_state (XP log, out-of-action list, loot, notes as tapped).
export const liveStateSchema = z.record(z.string(), z.unknown());
// TODO Phase 7: match_reports.xp_log / ooa / injuries entries.
export const reportLogSchema = z.array(z.unknown());
// TODO Phase 7: match_reports.loot / exploration.
export const reportObjectSchema = z.record(z.string(), z.unknown());
// TODO Phase 8: pending_advances.resolution (the advance taken: stat, skill or spell).
export const advanceResolutionSchema = z.record(z.string(), z.unknown());

export type StatsJson = z.infer<typeof statsSchema>;
export type AppliedInjuryJson = z.infer<typeof appliedInjurySchema>;
export type WarriorFlagsJson = z.infer<typeof warriorFlagsSchema>;
export type StatIncreasesJson = z.infer<typeof statIncreasesSchema>;

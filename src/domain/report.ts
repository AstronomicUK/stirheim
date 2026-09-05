// The post-battle report one warband files for a match (match_reports row), and the patches the
// submit function applies to the roster in the same transaction.
//
// The client resolves the rules (src/rules/resolve) with the dice the player rolled, then sends
// BOTH the narrative (what was rolled and why) and the resulting patches. The server stores the
// narrative for the record, applies the patches, creates pending advances, and completes the
// match once every participant has reported. See supabase/migrations/20260904000007_reports.sql.

import { z } from "zod";
import { appliedInjurySchema, statsSchema, warriorFlagsSchema } from "./json";

export const REPORT_VERSION = 1;

export const reportSubjectSchema = z.enum(["hero", "group", "hiredSword"]);
export type ReportSubject = z.infer<typeof reportSubjectSchema>;

/** One line of experience awarded: "+1 survived", "+2 enemies out of action" ... */
export const xpLineSchema = z.object({
  subjectType: reportSubjectSchema,
  subjectId: z.string(),
  subjectName: z.string(),
  amount: z.number().int(),
  reasons: z.array(z.string()),
  xpBefore: z.number().int().min(0),
  xpAfter: z.number().int().min(0),
  /** Threshold boxes crossed by this award (each becomes a pending advance). */
  advancesEarned: z.number().int().min(0).default(0),
});
export type XpLine = z.infer<typeof xpLineSchema>;

export const ooaLineSchema = z.object({
  subjectType: reportSubjectSchema,
  subjectId: z.string(),
  subjectName: z.string(),
  /** Heroes: 1. Groups: models taken out of action. */
  count: z.number().int().min(1),
});
export type OoaLine = z.infer<typeof ooaLineSchema>;

/** A hero or hired sword injury roll and its outcome, as the player will read it later. */
export const heroInjuryLineSchema = z.object({
  subjectType: z.enum(["hero", "hiredSword"]),
  subjectId: z.string(),
  subjectName: z.string(),
  /** Heroes roll D66; hired swords roll D6 (house reading, see PLANNING). */
  rolls: z.array(z.number().int()),
  injuryCode: z.string().nullable(),
  injuryName: z.string(),
  effect: z.string(),
  outcome: z.enum(["recovered", "injured", "dead", "captured", "retired"]),
});
export type HeroInjuryLine = z.infer<typeof heroInjuryLineSchema>;

export const henchmanInjuryLineSchema = z.object({
  subjectType: z.literal("group"),
  subjectId: z.string(),
  subjectName: z.string(),
  /** One D6 per model out of action; 1-2 dead. */
  rolls: z.array(z.number().int().min(1).max(6)),
  dead: z.number().int().min(0),
});
export type HenchmanInjuryLine = z.infer<typeof henchmanInjuryLineSchema>;

export const explorationRecordSchema = z.object({
  diceAllowed: z.number().int().min(0),
  diceReason: z.string(),
  rolls: z.array(z.number().int().min(1).max(6)),
  total: z.number().int().min(0),
  shards: z.number().int().min(0),
  locationId: z.string().nullable(),
  locationName: z.string().nullable(),
  locationText: z.string().nullable(),
  subRoll: z.number().int().nullable(),
  goldFound: z.number().int().min(0),
  itemsFound: z.array(z.object({ item_rules_id: z.string().nullable(), custom_name: z.string().nullable(), quantity: z.number().int().min(1) })),
  notes: z.array(z.string()),
});
export type ExplorationRecord = z.infer<typeof explorationRecordSchema>;

/** Roster patches the server applies verbatim (columns whitelisted in SQL). */
export const heroReportPatchSchema = z.object({
  id: z.string(),
  patch: z.object({
    stats: statsSchema.optional(),
    xp: z.number().int().min(0).optional(),
    level_ups: z.number().int().min(0).optional(),
    injuries: z.array(appliedInjurySchema).optional(),
    flags: warriorFlagsSchema.optional(),
    status: z.enum(["active", "dead", "retired", "captured", "left"]).optional(),
  }),
});
export const groupReportPatchSchema = z.object({
  id: z.string(),
  patch: z.object({
    size: z.number().int().min(0).optional(),
    xp: z.number().int().min(0).optional(),
    level_ups: z.number().int().min(0).optional(),
  }),
});
export const pendingAdvanceRequestSchema = z.object({
  subject_type: z.enum(["hero", "group"]),
  subject_id: z.string(),
  threshold_xp: z.number().int().min(1),
});
export const reportAppliedSchema = z.object({
  heroes: z.array(heroReportPatchSchema),
  groups: z.array(groupReportPatchSchema),
  warband: z.object({
    wyrdstone_delta: z.number().int().default(0),
    gold_delta: z.number().int().default(0),
    veteran_pool: z.number().int().min(2).max(12).nullable(),
  }),
  pending_advances: z.array(pendingAdvanceRequestSchema),
  /** Items dropped: equipment of dead warriors goes to the stash by trigger; items lost to injuries are removed here. */
  remove_item_ids: z.array(z.string()).default([]),
  /** Found items go to the stash. */
  stash_items: z.array(z.object({ item_rules_id: z.string().nullable(), custom_name: z.string().nullable(), quantity: z.number().int().min(1) })).default([]),
});
export type ReportApplied = z.infer<typeof reportAppliedSchema>;

/** A place where the player overrode what the app suggested, on the record. */
export const reportAdjustmentSchema = z.object({
  /** What was adjusted, e.g. "exploration dice". */
  label: z.string(),
  suggested: z.string(),
  used: z.string(),
  reason: z.string(),
});
export type ReportAdjustment = z.infer<typeof reportAdjustmentSchema>;

export const battleReportSchema = z.object({
  version: z.literal(REPORT_VERSION).default(REPORT_VERSION),
  won: z.boolean(),
  /** "won" | "lost" | "draw" as the player recorded it; `won` drives the rules. */
  result: z.enum(["won", "lost", "draw"]),
  routed: z.boolean().default(false),
  xp_log: z.array(xpLineSchema),
  ooa: z.array(ooaLineSchema),
  injuries: z.array(z.union([heroInjuryLineSchema, henchmanInjuryLineSchema])),
  exploration: explorationRecordSchema.nullable(),
  veteran_pool_roll: z.number().int().min(2).max(12).nullable(),
  notes: z.string().default(""),
  adjustments: z.array(reportAdjustmentSchema).default([]),
  applied: reportAppliedSchema,
});
export type BattleReport = z.infer<typeof battleReportSchema>;

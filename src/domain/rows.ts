// Row schemas: one per table in supabase/migrations/20260904000001_schema.sql (plus audit_log from
// migration 3 and the campaign_preview RPC from migration 2), exactly as supabase-js returns them:
// snake_case columns, ISO timestamp strings, enums as string unions, jsonb as the nested shapes
// in ./json.ts and ./settings.ts.
//
// Insert schemas exist for the tables the client creates directly (Phases 4-5). They drop the
// timestamps and make every defaulted column optional so a form can validate before sending and
// the database still fills in what was left out.

import { z } from "zod";
import { combatModeSchema } from "./settings";
import {
  advanceResolutionSchema,
  appliedInjuriesSchema,
  liveStateSchema,
  reportLogSchema,
  reportObjectSchema,
  statIncreasesSchema,
  statsSchema,
  warriorFlagsSchema,
} from "./json";
import { campaignSettingsSchema } from "./settings";

// ---------------------------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------------------------

export const uuidSchema = z.uuid();
/** timestamptz as PostgREST serialises it, e.g. "2026-09-04T09:12:34.567891+00:00". */
export const timestampSchema = z.iso.datetime({ offset: true });

const timestamps = {
  created_at: timestampSchema,
  updated_at: timestampSchema,
};

const nonNegativeInt = z.number().int().min(0);

// ---------------------------------------------------------------------------------------------
// Enums (match the SQL enums by name)
// ---------------------------------------------------------------------------------------------

export const warriorStatusSchema = z.enum(["active", "dead", "retired", "captured", "left"]);
export const itemHolderSchema = z.enum(["stash", "hero", "group"]);
export const matchStateSchema = z.enum(["scheduled", "in_progress", "awaiting_reports", "completed", "cancelled"]);
/** 'import' (migration 9): a historical match written by the Battle Records importer. */
export const matchOriginSchema = z.enum(["gm", "challenge", "import"]);
export const advanceSubjectSchema = z.enum(["hero", "group"]);
export const auditActionSchema = z.enum(["insert", "update", "delete"]);

export type WarriorStatus = z.infer<typeof warriorStatusSchema>;
export type ItemHolder = z.infer<typeof itemHolderSchema>;
export type MatchState = z.infer<typeof matchStateSchema>;
export type MatchOrigin = z.infer<typeof matchOriginSchema>;
export type AdvanceSubject = z.infer<typeof advanceSubjectSchema>;
export type AuditAction = z.infer<typeof auditActionSchema>;

// ---------------------------------------------------------------------------------------------
// profiles
// ---------------------------------------------------------------------------------------------

export const profileRowSchema = z.object({
  user_id: uuidSchema,
  display_name: z.string().min(1).max(40),
  ...timestamps,
});
export type ProfileRow = z.infer<typeof profileRowSchema>;

// ---------------------------------------------------------------------------------------------
// warbands
// ---------------------------------------------------------------------------------------------

export const warbandRowSchema = z.object({
  id: uuidSchema,
  owner_id: uuidSchema,
  name: z.string().min(1).max(60),
  /** WARBAND_TEMPLATES[].id, e.g. mercenaries_reikland */
  type_rules_id: z.string().min(1),
  gold: nonNegativeInt,
  wyrdstone: nonNegativeInt,
  /** 2D6 rolled at the last post-battle submission; caps experience of new henchmen. */
  veteran_pool: z.number().int().min(2).max(12).nullable(),
  notes: z.string(),
  archived: z.boolean(),
  ...timestamps,
});
export type WarbandRow = z.infer<typeof warbandRowSchema>;

export const warbandInsertSchema = warbandRowSchema.omit({ created_at: true, updated_at: true }).partial({
  id: true,
  owner_id: true, // defaults to auth.uid() in the database
  gold: true,
  wyrdstone: true,
  veteran_pool: true,
  notes: true,
  archived: true,
});
export type WarbandInsert = z.input<typeof warbandInsertSchema>;

// ---------------------------------------------------------------------------------------------
// heroes (heroes and hired swords)
// ---------------------------------------------------------------------------------------------

/** Mirrors constraint heroes_rules_id_matches_kind. */
function heroKindMatchesRulesId(hero: {
  is_hired_sword?: boolean | undefined;
  unit_type_rules_id?: string | null | undefined;
  hired_sword_rules_id?: string | null | undefined;
}): boolean {
  return hero.is_hired_sword ? hero.hired_sword_rules_id != null : hero.unit_type_rules_id != null;
}

const heroKindMessage = "a hired sword needs hired_sword_rules_id; a hero needs unit_type_rules_id";

const heroRowBase = z.object({
  id: uuidSchema,
  warband_id: uuidSchema,
  name: z.string().min(1).max(60),
  is_hired_sword: z.boolean(),
  /** UnitTemplate.id for heroes; null for hired swords. */
  unit_type_rules_id: z.string().min(1).nullable(),
  /** HIRED_SWORDS[].id for hired swords; null for heroes. */
  hired_sword_rules_id: z.string().min(1).nullable(),
  stats: statsSchema,
  xp: nonNegativeInt,
  level_ups: nonNegativeInt,
  skill_tables: z.array(z.string()),
  skills: z.array(z.string()),
  spells: z.array(z.string()),
  injuries: appliedInjuriesSchema,
  flags: warriorFlagsSchema,
  /** Hired swords: equipment fixed by their entry, cannot be bought or sold. */
  equipment_locked: z.boolean(),
  is_large: z.boolean(),
  status: warriorStatusSchema,
  notes: z.string(),
  sort_order: z.number().int(),
  ...timestamps,
});

export const heroRowSchema = heroRowBase.refine(heroKindMatchesRulesId, {
  message: heroKindMessage,
  path: ["unit_type_rules_id"],
});
export type HeroRow = z.infer<typeof heroRowSchema>;

export const heroInsertSchema = heroRowBase
  .omit({ created_at: true, updated_at: true })
  .partial({
    id: true,
    is_hired_sword: true,
    unit_type_rules_id: true,
    hired_sword_rules_id: true,
    xp: true,
    level_ups: true,
    skill_tables: true,
    skills: true,
    spells: true,
    injuries: true,
    flags: true,
    equipment_locked: true,
    is_large: true,
    status: true,
    notes: true,
    sort_order: true,
  })
  .refine(heroKindMatchesRulesId, {
    message: heroKindMessage,
    path: ["unit_type_rules_id"],
  });
export type HeroInsert = z.input<typeof heroInsertSchema>;

// ---------------------------------------------------------------------------------------------
// henchman_groups
// ---------------------------------------------------------------------------------------------

export const henchmanGroupRowSchema = z.object({
  id: uuidSchema,
  warband_id: uuidSchema,
  name: z.string().min(1).max(60),
  unit_type_rules_id: z.string().min(1),
  /** 0 keeps a wiped-out group for history. */
  size: nonNegativeInt,
  stats: statsSchema,
  xp: nonNegativeInt,
  level_ups: nonNegativeInt,
  stat_increases: statIncreasesSchema,
  is_large: z.boolean(),
  notes: z.string(),
  sort_order: z.number().int(),
  ...timestamps,
});
export type HenchmanGroupRow = z.infer<typeof henchmanGroupRowSchema>;

export const henchmanGroupInsertSchema = henchmanGroupRowSchema.omit({ created_at: true, updated_at: true }).partial({
  id: true,
  size: true,
  xp: true,
  level_ups: true,
  stat_increases: true,
  is_large: true,
  notes: true,
  sort_order: true,
});
export type HenchmanGroupInsert = z.input<typeof henchmanGroupInsertSchema>;

// ---------------------------------------------------------------------------------------------
// items (one row per stack)
// ---------------------------------------------------------------------------------------------

function checkItemRow(
  item: {
    holder_type?: ItemHolder | undefined;
    holder_id?: string | null | undefined;
    item_rules_id?: string | null | undefined;
    custom_name?: string | null | undefined;
  },
  ctx: z.RefinementCtx,
): void {
  // items_holder_id_matches_type: stash <=> no holder. holder_type defaults to 'stash' on insert.
  const inStash = (item.holder_type ?? "stash") === "stash";
  if (inStash !== (item.holder_id == null)) {
    ctx.addIssue({
      code: "custom",
      message: inStash ? "a stash item has no holder_id" : "a held item needs holder_id",
      path: ["holder_id"],
    });
  }
  // items_named: something must name the stack.
  if (item.item_rules_id == null && item.custom_name == null) {
    ctx.addIssue({
      code: "custom",
      message: "an item needs item_rules_id or custom_name",
      path: ["item_rules_id"],
    });
  }
}

const itemRowBase = z.object({
  id: uuidSchema,
  warband_id: uuidSchema,
  holder_type: itemHolderSchema,
  /** A hero or henchman group of the same warband; null when in the stash. */
  holder_id: uuidSchema.nullable(),
  /** ITEMS[].id; null for free-text treasure or house items. */
  item_rules_id: z.string().min(1).nullable(),
  custom_name: z.string().min(1).max(80).nullable(),
  quantity: z.number().int().min(1),
  notes: z.string(),
  ...timestamps,
});

export const itemRowSchema = itemRowBase.superRefine(checkItemRow);
export type ItemRow = z.infer<typeof itemRowSchema>;

export const itemInsertSchema = itemRowBase
  .omit({ created_at: true, updated_at: true })
  .partial({
    id: true,
    holder_type: true,
    holder_id: true,
    item_rules_id: true,
    custom_name: true,
    quantity: true,
    notes: true,
  })
  .superRefine(checkItemRow);
export type ItemInsert = z.input<typeof itemInsertSchema>;

// ---------------------------------------------------------------------------------------------
// campaigns and campaign_members
// ---------------------------------------------------------------------------------------------

export const campaignRowSchema = z.object({
  id: uuidSchema,
  gm_id: uuidSchema,
  name: z.string().min(1).max(80),
  /** e.g. "kx7m-p2qr" (case-insensitive, dashes optional when joining). */
  invite_code: z.string().min(1),
  settings: campaignSettingsSchema,
  rules_markdown: z.string(),
  archived: z.boolean(),
  ...timestamps,
});
export type CampaignRow = z.infer<typeof campaignRowSchema>;

export const campaignInsertSchema = campaignRowSchema.omit({ created_at: true, updated_at: true }).partial({
  id: true,
  gm_id: true, // defaults to auth.uid() in the database
  invite_code: true,
  settings: true,
  rules_markdown: true,
  archived: true,
});
export type CampaignInsert = z.input<typeof campaignInsertSchema>;

export const campaignMemberRowSchema = z.object({
  campaign_id: uuidSchema,
  warband_id: uuidSchema,
  /** Always the warband owner (set by trigger). */
  user_id: uuidSchema,
  joined_at: timestampSchema,
  left_at: timestampSchema.nullable(),
});
export type CampaignMemberRow = z.infer<typeof campaignMemberRowSchema>;

/** Return shape of the campaign_preview(p_invite_code) RPC: what a prospective member sees. */
export const campaignPreviewSchema = z.object({
  campaign_id: uuidSchema,
  name: z.string(),
  gm_display_name: z.string(),
  /** bigint in SQL; PostgREST may serialise it as a number or a string. */
  member_count: z.coerce.number().int().min(0),
  archived: z.boolean(),
});
export type CampaignPreview = z.infer<typeof campaignPreviewSchema>;

// ---------------------------------------------------------------------------------------------
// scenarios (custom; built-ins ship with the client)
// ---------------------------------------------------------------------------------------------

export const scenarioRowSchema = z.object({
  id: uuidSchema,
  owner_id: uuidSchema,
  campaign_id: uuidSchema.nullable(),
  name: z.string().min(1).max(80),
  setting: z.string(),
  summary: z.string(),
  rules_markdown: z.string(),
  ...timestamps,
});
export type ScenarioRow = z.infer<typeof scenarioRowSchema>;

export const scenarioInsertSchema = scenarioRowSchema.omit({ created_at: true, updated_at: true }).partial({
  id: true,
  owner_id: true, // defaults to auth.uid() in the database
  campaign_id: true,
  setting: true,
  summary: true,
  rules_markdown: true,
});
export type ScenarioInsert = z.input<typeof scenarioInsertSchema>;

// ---------------------------------------------------------------------------------------------
// matches and their satellites
// ---------------------------------------------------------------------------------------------

export const matchRowSchema = z
  .object({
    combat_mode: combatModeSchema,
    id: uuidSchema,
    campaign_id: uuidSchema,
    scenario_rules_id: z.string().min(1).nullable(),
    custom_scenario_id: uuidSchema.nullable(),
    state: matchStateSchema,
    created_by: uuidSchema,
    created_via: matchOriginSchema,
    scheduled_for: timestampSchema.nullable(),
    started_at: timestampSchema.nullable(),
    completed_at: timestampSchema.nullable(),
    notes: z.string(),
    ...timestamps,
  })
  .refine((m) => m.scenario_rules_id == null || m.custom_scenario_id == null, {
    message: "a match has at most one scenario",
    path: ["custom_scenario_id"],
  });
export type MatchRow = z.infer<typeof matchRowSchema>;

export const matchParticipantRowSchema = z.object({
  match_id: uuidSchema,
  warband_id: uuidSchema,
  invited_at: timestampSchema,
  /** Challenges: null until the challenged player accepts. GM-scheduled matches are pre-accepted. */
  accepted_at: timestampSchema.nullable(),
});
export type MatchParticipantRow = z.infer<typeof matchParticipantRowSchema>;

export const battleSessionRowSchema = z.object({
  match_id: uuidSchema,
  warband_id: uuidSchema,
  live_state: liveStateSchema,
  ...timestamps,
});
export type BattleSessionRow = z.infer<typeof battleSessionRowSchema>;

export const matchReportRowSchema = z.object({
  id: uuidSchema,
  match_id: uuidSchema,
  warband_id: uuidSchema,
  submitted_by: uuidSchema,
  won: z.boolean(),
  /** Phase 7 (migration 7): how the player recorded it; `won` drives the rules. */
  result: z.enum(["won", "lost", "draw"]).default("lost"),
  routed: z.boolean().default(false),
  xp_log: reportLogSchema,
  ooa: reportLogSchema,
  injuries: reportLogSchema,
  loot: reportObjectSchema,
  exploration: reportObjectSchema,
  /** ReportApplied (src/domain/report.ts): the roster patches applied when filed. */
  applied: reportObjectSchema.default({}),
  veteran_pool_roll: z.number().int().min(2).max(12).nullable(),
  notes: z.string(),
  submitted_at: timestampSchema,
  /** Phase 11 (migration 13): awaiting GM approval, applied to the roster, or returned with a note. */
  status: z.enum(["pending", "applied", "returned"]).default("applied"),
  review_note: z.string().nullable().default(null),
  revision: z.number().int().min(1).default(1),
  amended_at: timestampSchema.nullable().default(null),
  amended_by: uuidSchema.nullable().default(null),
  amendment_note: z.string().nullable().default(null),
  adjustments: reportLogSchema.default([]),
});
export type MatchReportRow = z.infer<typeof matchReportRowSchema>;
export type ReportStatus = MatchReportRow["status"];

export const pendingAdvanceRowSchema = z
  .object({
    id: uuidSchema,
    warband_id: uuidSchema,
    subject_type: advanceSubjectSchema,
    subject_id: uuidSchema,
    threshold_xp: z.number().int().min(1),
    created_at: timestampSchema,
    resolved_at: timestampSchema.nullable(),
    resolution: advanceResolutionSchema.nullable(),
    /** Dice already rolled when the skill or spell pick was deferred ("Pick later"); null otherwise. */
    rolled: advanceResolutionSchema.nullable().default(null),
  })
  .refine((a) => (a.resolved_at == null) === (a.resolution == null), {
    message: "resolved_at and resolution are set together",
    path: ["resolution"],
  });
export type PendingAdvanceRow = z.infer<typeof pendingAdvanceRowSchema>;

export const tradePhaseStateRowSchema = z.object({
  warband_id: uuidSchema,
  match_id: uuidSchema,
  wyrdstone_sold: z.boolean(),
  /** Heroes who have already made their one rare-item search this post-battle. */
  heroes_searched: z.array(uuidSchema),
  ...timestamps,
});
export type TradePhaseStateRow = z.infer<typeof tradePhaseStateRowSchema>;

// ---------------------------------------------------------------------------------------------
// audit_log (append-only, read-only for clients)
// ---------------------------------------------------------------------------------------------

export const auditLogRowSchema = z.object({
  /** bigint identity; PostgREST serialises int8 as a JSON number. */
  id: z.coerce.number().int(),
  at: timestampSchema,
  actor_id: uuidSchema.nullable(),
  table_name: z.string(),
  row_id: uuidSchema.nullable(),
  warband_id: uuidSchema.nullable(),
  campaign_id: uuidSchema.nullable(),
  action: auditActionSchema,
  /** The app's reason for the transaction, e.g. "manual_edit"; null when none was set. */
  reason: z.string().nullable(),
  before: z.record(z.string(), z.unknown()).nullable(),
  after: z.record(z.string(), z.unknown()).nullable(),
});
export type AuditLogRow = z.infer<typeof auditLogRowSchema>;

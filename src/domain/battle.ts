// The live battle sheet one warband keeps during a match (battle_sessions.live_state). It is a
// tally, not a report: the post-battle wizard (Phase 7) reads it to pre-fill the report, and
// the other players see it update in real time.

import { z } from "zod";

export const BATTLE_LIVE_STATE_VERSION = 1;

/** One tally entry for a warrior (hero or hired sword) or a henchman group. */
export const battleWarriorTallySchema = z.object({
  /** heroes.id or henchman_groups.id */
  id: z.string(),
  kind: z.enum(["hero", "group"]),
  /** Enemies this warrior put out of action (heroes and hired swords only: +1 xp each). */
  enemiesOutOfAction: z.number().int().min(0).default(0),
  /** For a hero: 1 when they are out of action. For a group: models currently out of action. */
  outOfAction: z.number().int().min(0).default(0),
  /** Wounds lost so far this battle (multi-Wound heroes, hired swords and one-model groups); they carry over between turns. */
  woundsLost: z.number().int().min(0).default(0),
  /** Free text: "stunned turn 3", "holding the shard", ... */
  note: z.string().default(""),
});
export type BattleWarriorTally = z.infer<typeof battleWarriorTallySchema>;

/** One "taken out by" record: an enemy model, or a fall / terrain / spell with no model. */
export const takenOutBySchema = z.object({
  /** Enemy warband, when a model did it. */
  warbandId: z.string().nullable(),
  /** Enemy warrior or group id, when a model did it. */
  modelId: z.string().nullable(),
  /** What to print: the model's name, or "a fall", "unknown". */
  name: z.string(),
  turn: z.number().int().min(0).default(0),
});
export type TakenOutBy = z.infer<typeof takenOutBySchema>;

/** One attempt to cast a spell or recite a prayer, kept so the sheet remembers what has been spent. */
export const castRecordSchema = z.object({
  heroId: z.string(),
  heroName: z.string(),
  spellId: z.string(),
  spellName: z.string(),
  turn: z.number().int().min(0).default(0),
  outcome: z.enum(["automatic", "cast", "failed", "dispelled"]),
  /** The 2D6 total with modifiers, and what it had to beat; null for a spell that needs no roll. */
  total: z.number().int().nullable().default(null),
  difficulty: z.number().int().nullable().default(null),
  /** Re-roll ids spent on this attempt (a Rat Familiar is once a game, a Familiar once a turn). */
  used: z.array(z.string()).default([]),
  /** Who the spell was aimed at, when the caster named one: a spell may need a friendly target rather than an enemy. */
  targetName: z.string().nullable().default(null),
});
export type CastRecord = z.infer<typeof castRecordSchema>;

export const rollAttemptSchema = z.object({
  id: z.string(),
  at: z.string(),
  turn: z.number(),
  label: z.string(),
  kind: z.enum(['attack', 'spell']),
  status: z.enum(['incomplete', 'complete', 'restarted']),
  rolls: z.array(z.string()),
});
export type RollAttempt = z.infer<typeof rollAttemptSchema>;

const serpentStaffUseSchema = z.object({
  warriorId: z.string(),
  /** One hand-to-hand phase: shared round + active warband, not just game round. */
  turnKey: z.string(),
  at: z.string(),
  used: z.boolean().default(false),
});

export const battleLiveStateSchema = z.object({
  version: z.literal(BATTLE_LIVE_STATE_VERSION).default(BATTLE_LIVE_STATE_VERSION),
  /** A game starts at turn 1; the min stays 0 so a GM can still correct it back down. */
  turn: z.number().int().min(0).default(1),
  /** Whether this warband has voluntarily routed / failed a rout test. */
  routed: z.boolean().default(false),
  /** Wyrdstone shards picked up during the battle (scenario objectives). */
  wyrdstoneFound: z.number().int().min(0).default(0),
  /** Other loot or objectives, free text lines. */
  loot: z.array(z.string()).default([]),
  tallies: z.array(battleWarriorTallySchema).default([]),
  /** "Leader used Leadership for rout test", scenario notes, etc. */
  notes: z.string().default(""),
  /** Pre-battle prompts answered on the sheet: "tarot:<heroId>" -> "passed" | "failed" | "disaster", list rules by key. */
  preBattle: z.record(z.string(), z.string()).default({}),
  /** Consumables marked as taken or applied this battle: warrior id -> catalogue item ids. The report uses them up. */
  itemsUsed: z.record(z.string(), z.array(z.string())).default({}),
  /**
   * Who took each of this warband's warriors out of action: warrior or group id -> one entry per
   * model out (the enemy model by id and name, or a fall / other with no id). Fills the report's
   * key events; the calculator's logged kills are laid over it from the shared log.
   */
  takenOutBy: z.record(z.string(), z.array(takenOutBySchema)).default({}),
  /** Spells and prayers attempted this battle, in order. */
  casts: z.array(castRecordSchema).default([]),
  /** Dice history only: never contributes wounds, kills or resource spending. */
  rollAttempts: z.array(rollAttemptSchema).default([]),
  /** Staff command forfeits the bearer's normal attacks and parries for this combat phase. */
  serpentStaffUses: z.array(serpentStaffUseSchema).default([]),
  /** ISO time of the last local edit; the server's updated_at is authoritative for ordering. */
  editedAt: z.string().optional(),
});
export type BattleLiveState = z.infer<typeof battleLiveStateSchema>;

export function emptyBattleLiveState(): BattleLiveState {
  return battleLiveStateSchema.parse({});
}

/** Keep each attempt through restarts, without duplicating it after every die. */
export function withRollAttempt(state: BattleLiveState, attempt: RollAttempt): BattleLiveState {
  const exists = state.rollAttempts.some(a => a.id === attempt.id);
  return { ...state, rollAttempts: exists ? state.rollAttempts.map(a => a.id === attempt.id ? attempt : a) : [...state.rollAttempts, attempt], editedAt: new Date().toISOString() };
}

export function serpentStaffUse(state: BattleLiveState, warriorId: string, turnKey: string) {
  return state.serpentStaffUses.find(use => use.warriorId === warriorId && use.turnKey === turnKey);
}

/** Activation is durable before rolling; repeat activation cannot restore a spent attack. */
export function activateSerpentStaff(state: BattleLiveState, warriorId: string, turnKey: string): BattleLiveState {
  if (serpentStaffUse(state, warriorId, turnKey)) return state;
  const at = new Date().toISOString();
  return { ...state, serpentStaffUses: [...state.serpentStaffUses, { warriorId, turnKey, at, used: false }], editedAt: at };
}

export function consumeSerpentStaff(state: BattleLiveState, warriorId: string, turnKey: string): BattleLiveState {
  const activated = activateSerpentStaff(state, warriorId, turnKey);
  return { ...activated, serpentStaffUses: activated.serpentStaffUses.map(use => use.warriorId === warriorId && use.turnKey === turnKey ? { ...use, used: true } : use), editedAt: new Date().toISOString() };
}

/** Parse whatever is stored; anything malformed falls back to an empty sheet rather than crashing the table. */
export function parseBattleLiveState(value: unknown): BattleLiveState {
  const result = battleLiveStateSchema.safeParse(value ?? {});
  return result.success ? result.data : emptyBattleLiveState();
}

export function tallyFor(state: BattleLiveState, id: string): BattleWarriorTally | undefined {
  return state.tallies.find((t) => t.id === id);
}

/** Replace or insert one tally, returning a new state. Zeroed tallies with no note are dropped. */
export function withTally(state: BattleLiveState, tally: BattleWarriorTally): BattleLiveState {
  const rest = state.tallies.filter((t) => t.id !== tally.id);
  const keep = tally.enemiesOutOfAction > 0 || tally.outOfAction > 0 || tally.woundsLost > 0 || tally.note.trim() !== "";
  return { ...state, tallies: keep ? [...rest, tally] : rest, editedAt: new Date().toISOString() };
}

/** Add one cast to the sheet. */
export function withCast(state: BattleLiveState, cast: CastRecord): BattleLiveState {
  return { ...state, casts: [...state.casts, cast], editedAt: new Date().toISOString() };
}

/** Casts this hero has already made in the given turn: the one-spell-per-turn rule. */
export function castsThisTurn(state: BattleLiveState, heroId: string, turn: number): CastRecord[] {
  return state.casts.filter((c) => c.heroId === heroId && c.turn === turn);
}

/** Re-rolls this hero has spent, by scope: everything from this battle, and everything from this turn. */
export function rerollsSpent(state: BattleLiveState, heroId: string, turn: number): { game: string[]; turn: string[] } {
  const mine = state.casts.filter((c) => c.heroId === heroId);
  return { game: mine.flatMap((c) => c.used), turn: mine.filter((c) => c.turn === turn).flatMap((c) => c.used) };
}

export interface BattleTotals {
  enemiesOutOfAction: number;
  /** Models of this warband currently out of action. */
  ownOutOfAction: number;
}

export function battleTotals(state: BattleLiveState): BattleTotals {
  return state.tallies.reduce(
    (acc, t) => ({ enemiesOutOfAction: acc.enemiesOutOfAction + t.enemiesOutOfAction, ownOutOfAction: acc.ownOutOfAction + t.outOfAction }),
    { enemiesOutOfAction: 0, ownOutOfAction: 0 },
  );
}

/**
 * Rout test threshold (rulebook): a warband must test at the start of its turn once a quarter
 * (rounded up) of its starting models are out of action. Returns the number of models that
 * triggers the test.
 */
export function routThreshold(startingModels: number): number {
  return Math.ceil(startingModels / 4);
}

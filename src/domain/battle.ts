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
  /** Free text: "stunned turn 3", "holding the shard", ... */
  note: z.string().default(""),
});
export type BattleWarriorTally = z.infer<typeof battleWarriorTallySchema>;

export const battleLiveStateSchema = z.object({
  version: z.literal(BATTLE_LIVE_STATE_VERSION).default(BATTLE_LIVE_STATE_VERSION),
  turn: z.number().int().min(0).default(0),
  /** Whether this warband has voluntarily routed / failed a rout test. */
  routed: z.boolean().default(false),
  /** Wyrdstone shards picked up during the battle (scenario objectives). */
  wyrdstoneFound: z.number().int().min(0).default(0),
  /** Other loot or objectives, free text lines. */
  loot: z.array(z.string()).default([]),
  tallies: z.array(battleWarriorTallySchema).default([]),
  /** "Leader used Leadership for rout test", scenario notes, etc. */
  notes: z.string().default(""),
  /** ISO time of the last local edit; the server's updated_at is authoritative for ordering. */
  editedAt: z.string().optional(),
});
export type BattleLiveState = z.infer<typeof battleLiveStateSchema>;

export function emptyBattleLiveState(): BattleLiveState {
  return battleLiveStateSchema.parse({});
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
  const keep = tally.enemiesOutOfAction > 0 || tally.outOfAction > 0 || tally.note.trim() !== "";
  return { ...state, tallies: keep ? [...rest, tally] : rest, editedAt: new Date().toISOString() };
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

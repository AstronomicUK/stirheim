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
  guidingDreamTargets: z.record(z.string(), z.object({ id: z.string(), warbandId: z.string(), name: z.string() })).default({}),
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
  blackpowderShots: z.array(z.object({
    id: z.string(), warriorId: z.string(), weaponKey: z.string(), weaponName: z.string(), ownTurn: z.number().int().min(0),
    reloadTurns: z.number().int().min(0), at: z.string(), misfireDie: z.number().int().min(1).max(6).optional(),
    misfirePending: z.boolean().optional(), misfireOriginal: z.number().int().min(1).max(6).optional(), experimental: z.boolean().default(false), correction: z.string().optional(),
  })).default([]),
  grapeShotSpreads: z.array(z.object({
    shotId: z.string(), warriorId: z.string(), warbandId: z.string(), shooterName: z.string(), at: z.string(),
    primary: z.object({ key: z.string(), warbandId: z.string(), warriorId: z.string(), name: z.string() }),
    primaryInCover: z.boolean(), original: z.number().int().min(1).max(6).optional(),
    die: z.number().int().min(1).max(6).optional(),
    targets: z.array(z.object({ key: z.string(), warbandId: z.string(), warriorId: z.string(), name: z.string() })).optional(),
  })).default([]),
  pigeonLaunches: z.array(z.object({
    id: z.string(), warriorId: z.string(), warbandId: z.string(), shooterName: z.string(), permissionRequired: z.boolean().optional(), permissionOriginal: z.number().int().min(1).max(6).optional(), permissionDie: z.number().int().min(1).max(6).optional(), permissionNote: z.string().optional(), ownTurn: z.number().int().min(0), at: z.string(), reason: z.string().default(''),
    original: z.number().int().min(1).max(6).optional(), die: z.number().int().min(1).max(6).optional(),
    intendedTarget: z.object({ key: z.string(), warbandId: z.string(), warriorId: z.string(), name: z.string() }),
    targets: z.array(z.object({ key: z.string(), warbandId: z.string(), warriorId: z.string(), name: z.string() })).optional(),
  })).default([]),
  linePermissionTests: z.array(z.object({ id: z.string(), warriorId: z.string(), weaponId: z.enum(["blunderbuss", "chaos_dwarf_blunderbuss"]), shooterSlot: z.number().int().min(0), ownTurn: z.number().int().min(0), original: z.number().int().min(1).max(6).optional(), die: z.number().int().min(1).max(6).optional(), reason: z.string().default(''), at: z.string(), targets: z.array(z.object({ key: z.string(), warbandId: z.string(), warriorId: z.string(), name: z.string() })) })).default([]),
  lineShots: z.array(z.object({ id: z.string(), warriorId: z.string(), weaponId: z.enum(["blunderbuss", "chaos_dwarf_blunderbuss"]), shooterSlot: z.number().int().min(0).default(0), ownTurn: z.number().int().min(0), at: z.string(), cancelled: z.boolean().default(false), targets: z.array(z.object({ key: z.string(), warbandId: z.string(), warriorId: z.string(), name: z.string() })) })).default([]),
  bolasRecoveryTests: z.array(z.object({ warriorId: z.string(), turnKey: z.string(), attemptId: z.string() })).default([]),
  bolasRecoveredEventIds: z.array(z.string()).default([]),
  bolasThrows: z.array(z.object({ warriorId: z.string(), at: z.string() })).default([]),
  /** Recorded Stupidity outcomes last through opponents’ turns until this warband’s next turn. */
  stupidityResults: z.array(z.object({ warriorId: z.string(), turnKey: z.string(), failed: z.boolean() })).default([]),
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
export function activateSerpentStaff(state: BattleLiveState, warriorId: string, turnKey: string, name?: string, turn = state.turn): BattleLiveState {
  if (serpentStaffUse(state, warriorId, turnKey)) return state;
  const at = new Date().toISOString();
  const next = { ...state, serpentStaffUses: [...state.serpentStaffUses, { warriorId, turnKey, at, used: false }], editedAt: at };
  return name ? withRollAttempt(next, { id: crypto.randomUUID(), at, turn, kind: 'attack', status: 'complete', label: `${name} awakens the Serpent Staff`, rolls: ['Confirmed no attacks or parries already taken. Forfeits all normal attacks and parries this combat phase for one WS4 / S4 staff attack.'] }) : next;
}

export function consumeSerpentStaff(state: BattleLiveState, warriorId: string, turnKey: string): BattleLiveState {
  const activated = activateSerpentStaff(state, warriorId, turnKey);
  return { ...activated, serpentStaffUses: activated.serpentStaffUses.map(use => use.warriorId === warriorId && use.turnKey === turnKey ? { ...use, used: true } : use), editedAt: new Date().toISOString() };
}

export function combatPhaseKey(legacyTurn: number, turns?: { round: number; active_index: number; turn_order: string[] } | null): string {
  return turns && turns.turn_order[turns.active_index] ? `${turns.round}:${turns.turn_order[turns.active_index]}` : `legacy:${legacyTurn}`;
}

/** Explicit, logged correction preserves Tom's approved ability to handle table exceptions. */
export function correctSerpentStaff(state: BattleLiveState, warriorId: string, turnKey: string, name: string, reason: string, turn = state.turn): BattleLiveState {
  const use = serpentStaffUse(state, warriorId, turnKey);
  if (!use || !reason.trim()) return state;
  return withRollAttempt({ ...state, serpentStaffUses: state.serpentStaffUses.filter(u => u !== use) }, {
    id: crypto.randomUUID(), at: new Date().toISOString(), turn, kind: 'attack', status: 'complete',
    label: `${name}: Serpent Staff command corrected`,
    rolls: [`Removed the staff command${use.used ? ' after its attack was marked used' : ' before its attack was used'}. Normal attacks and parries restored by player correction: ${reason.trim()}`],
  });
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


/** The most recent own turn, including opponents' intervening turns across a round boundary. */
export function warbandTurnKey(warbandId: string, legacyTurn: number, turns?: { round: number; active_index: number; turn_order: string[] } | null): string {
  const index = turns?.turn_order.indexOf(warbandId) ?? -1;
  if (!turns || index < 0) return `legacy:${legacyTurn}`;
  return `${warbandId}:${turns.round - (turns.active_index < index ? 1 : 0)}`;
}

export function failedStupidityThisTurn(state: BattleLiveState, warriorId: string, turnKey: string): boolean {
  return state.stupidityResults.some(result => result.warriorId === warriorId && result.turnKey === turnKey && result.failed);
}

/** A player's declaration/correction, not a claim that the app rolled a Leadership test. */
export function recordStupidityResult(state: BattleLiveState, warriorId: string, turnKey: string, name: string, failed: boolean, turn = state.turn): BattleLiveState {
  if (failedStupidityThisTurn(state, warriorId, turnKey) === failed) return state;
  const results = state.stupidityResults.filter(result => result.warriorId !== warriorId || result.turnKey !== turnKey);
  return withRollAttempt({ ...state, stupidityResults: [...results, { warriorId, turnKey, failed }] }, {
    id: crypto.randomUUID(), at: new Date().toISOString(), turn, kind: 'attack', status: 'complete',
    label: `${name}: ${failed ? 'failed Stupidity test recorded' : 'failed Stupidity effect cleared'}`,
    rolls: [failed ? 'Recorded by the player. Cannot attack or cast until the start of their next own turn; resolve the Stupidity movement roll at the table.' : 'Cleared by the player as a correction or agreed table decision. No new dice roll is implied.'],
  });
}

export interface StupidityTestRoll {
  dice: number[];
  /** Original app-generated dice, retained if the player edits either face. */
  originalDice?: number[];
  leadership: number;
  baseLeadership: number;
  leadershipReason?: string;
  inCombat: boolean;
  movementDie?: number;
  originalMovementDie?: number;
  correctionReason?: string;
  attemptId?: string;
}

/** Resolve an actual start-of-turn test, preserving both app rolls and player changes. */
export function recordStupidityTest(state: BattleLiveState, warriorId: string, turnKey: string, name: string, roll: StupidityTestRoll, turn = state.turn): BattleLiveState {
  const d6 = (value: number) => Number.isInteger(value) && value >= 1 && value <= 6;
  if (roll.dice.length !== 2 || !roll.dice.every(d6) || (roll.originalDice && (roll.originalDice.length !== 2 || !roll.originalDice.every(d6)))) throw new Error('Enter two D6 results from 1 to 6.');
  if (!Number.isInteger(roll.leadership) || roll.leadership < 0 || roll.leadership > 20) throw new Error('Enter a valid Leadership for this test.');
  if (roll.leadership !== roll.baseLeadership && !roll.leadershipReason?.trim()) throw new Error('Explain the Leadership used, for example a nearby leader.');
  if (state.stupidityResults.some(result => result.warriorId === warriorId && result.turnKey === turnKey) && !roll.correctionReason?.trim()) throw new Error('Explain why this turn’s recorded test is being replaced.');
  if (roll.originalMovementDie !== undefined && !d6(roll.originalMovementDie)) throw new Error('The original movement roll must be a D6 result.');
  const total = roll.dice[0] + roll.dice[1];
  const failed = total > roll.leadership;
  if (failed && !roll.inCombat && !d6(roll.movementDie ?? 0)) throw new Error('Roll a D6 for the failed test’s movement.');
  const changed = roll.originalDice && roll.dice.some((die, index) => die !== roll.originalDice![index]);
  const diceText = roll.originalDice
    ? `App rolled ${roll.originalDice.join(' + ')}${changed ? `; player changed the dice to ${roll.dice.join(' + ')}` : ''}.`
    : `Player entered ${roll.dice.join(' + ')}.`;
  const resultText = `${total} against Leadership ${roll.leadership}: ${failed ? 'failed' : 'passed'}.`;
  const movementText = !failed ? 'Acts normally until the next own turn’s test.' : roll.inCombat
    ? 'In hand-to-hand combat: cannot attack or cast until the next own turn. Opponents still roll to hit normally.'
    : `${roll.originalMovementDie !== undefined ? `App rolled movement D6: ${roll.originalMovementDie}${roll.originalMovementDie !== roll.movementDie ? `; player changed it to ${roll.movementDie}` : ''}` : `Player entered movement D6: ${roll.movementDie}`}. ${roll.movementDie! <= 3 ? 'Move straight forward at half speed; no charge, stop 1 inch from enemies and at obstacles. Falls still apply.' : 'Stand inactive; no other actions.'} No attacks or spells until the next own turn.`;
  const results = state.stupidityResults.filter(result => result.warriorId !== warriorId || result.turnKey !== turnKey);
  return withRollAttempt({ ...state, stupidityResults: [...results, { warriorId, turnKey, failed }] }, {
    id: roll.attemptId ?? crypto.randomUUID(), at: new Date().toISOString(), turn, kind: 'attack', status: 'complete',
    label: `${name}: Stupidity test ${failed ? 'failed' : 'passed'}`,
    rolls: [diceText, resultText, ...(roll.originalMovementDie !== undefined && (!failed || roll.inCombat) ? [`App movement roll ${roll.originalMovementDie} was not used for the final situation.`] : []), ...(roll.correctionReason?.trim() ? [`Recorded test replaced: ${roll.correctionReason.trim()}.`] : []), ...(roll.leadership !== roll.baseLeadership ? [`Leadership ${roll.leadership} instead of ${roll.baseLeadership}: ${roll.leadershipReason!.trim()}.`] : []), movementText],
  });
}


/** One declared Bolas throw per individual warrior per battle; no round-based expiry. */
export function recordBolasThrow(state: BattleLiveState, warriorId: string, name: string, turn = state.turn, tabletop = false): BattleLiveState {
  if (state.bolasThrows.some(use => use.warriorId === warriorId)) return state;
  const at = new Date().toISOString();
  return withRollAttempt({ ...state, bolasThrows: [...state.bolasThrows, { warriorId, at }] }, {
    id: crypto.randomUUID(), at, turn, kind: 'attack', status: 'complete', label: `${name}: Bolas throw declared`,
    rolls: [tabletop ? 'Player recorded a tabletop Bolas throw; no app dice roll is implied. Used for this battle and recovered afterwards.' : 'Bolas marked used for this battle before resolving the throw. A miss still uses them. They are recovered after the battle.'],
  });
}

export function correctBolasThrow(state: BattleLiveState, warriorId: string, name: string, reason: string, turn = state.turn): BattleLiveState {
  if (!reason.trim() || !state.bolasThrows.some(use => use.warriorId === warriorId)) return state;
  return withRollAttempt({ ...state, bolasThrows: state.bolasThrows.filter(use => use.warriorId !== warriorId) }, {
    id: crypto.randomUUID(), at: new Date().toISOString(), turn, kind: 'attack', status: 'complete', label: `${name}: Bolas use corrected`,
    rolls: [`Restored the Bolas throw by player correction: ${reason.trim()}. Existing dice history is retained.`],
  });
}

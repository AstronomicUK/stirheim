// The shared combat log (battle_events). An attack event records what one calculator walk-through
// did to a target; every phone lays the match's unreverted events over its own sheet, so the
// attacker's kill and the target's Wounds lost / out of action appear on both sides without either
// player writing to the other's row. Reverting an event puts everything back.

import { z } from "zod";
import { withRollAttempt, type TakenOutBy, type BattleLiveState, type BattleWarriorTally } from "./battle";
import { uuidSchema, timestampSchema } from "./rows";

export const attackEventPayloadSchema = z.object({
  attacker_warband_id: uuidSchema,
  attacker_id: z.string(),
  attacker_kind: z.enum(["hero", "group"]),
  attacker_name: z.string(),
  target_warband_id: uuidSchema,
  target_id: z.string(),
  target_kind: z.enum(["hero", "group"]),
  target_name: z.string(),
  /** Group size at the time, to cap out-of-action counts. */
  target_size: z.number().int().min(1).default(1),
  /** Wounds the target lost in this fight. */
  wounds_lost: z.number().int().min(0).default(0),
  out_of_action: z.boolean().default(false),
  /** The attacker earns a kill (heroes and hired swords only; henchmen earn no experience). */
  kill: z.boolean().default(false),
  /** "Knocked down", "Out of action" ... */
  outcome: z.string().default(""),
  turn: z.number().int().min(0).default(0),
  /** A Nurgle's Rot carrier wounded a living target on a natural 6: the target contracts the Rot (their report marks it). */
  nurgles_rot: z.boolean().default(false),
  /** Bolas condition, separate from wounds and injury results. */
  entangled: z.boolean().optional(),
  blackpowderSelfShotId: z.string().optional(),
  pigeonLaunchId: z.string().optional(),
  pigeonTargetKey: z.string().optional(),
  lineShotId: z.string().optional(),
  lineShotTargetKey: z.string().optional(),
  /** Every roll of the walk-through, in order: "rolled 5 to hit. Hit.", "Armour save: rolled 2. Failed." ... */
  rolls: z.array(z.string()).default([]),
});
export type AttackEventPayload = z.infer<typeof attackEventPayloadSchema>;

export const battleEventRowSchema = z.object({
  id: uuidSchema,
  match_id: uuidSchema,
  actor_id: uuidSchema,
  actor_warband_id: uuidSchema.nullable(),
  at: timestampSchema,
  kind: z.literal("attack"),
  payload: attackEventPayloadSchema,
  summary: z.string(),
  reverted_at: timestampSchema.nullable(),
  reverted_by: uuidSchema.nullable(),
  revert_note: z.string().nullable(),
});
export type BattleEventRow = z.infer<typeof battleEventRowSchema>;

/** One line for the log and the enemy view: "Turn 2: Captain took Skritch out of action." */
export function attackSummary(p: AttackEventPayload): string {
  const what = p.out_of_action ? `took ${p.target_name} out of action` : p.wounds_lost > 0 ? `wounded ${p.target_name} (${p.outcome.toLowerCase()})` : p.entangled ? `entangled ${p.target_name} with Bolas` : `${p.outcome.toLowerCase()} ${p.target_name}`;
  return `Turn ${p.turn}: ${p.attacker_name} ${what}.${p.nurgles_rot ? ` ${p.target_name} contracts Nurgle's Rot.` : ""}`;
}

/** Every roll behind the summary, condensed onto one line: "rolled 5 to hit. Hit. To wound: rolled 4. Wounded. ..." */
export function attackRollsLine(p: AttackEventPayload): string {
  return p.rolls.join(" ");
}

function withTallyChange(tallies: BattleWarriorTally[], id: string, kind: BattleWarriorTally["kind"], change: (t: BattleWarriorTally) => BattleWarriorTally): BattleWarriorTally[] {
  const existing = tallies.find((t) => t.id === id);
  const base: BattleWarriorTally = existing ?? { id, kind, enemiesOutOfAction: 0, outOfAction: 0, woundsLost: 0, note: "" };
  const next = change(base);
  return existing ? tallies.map((t) => (t.id === id ? next : t)) : [...tallies, next];
}

/**
 * The sheet of `warbandId` with the match's unreverted events laid over it: kills for its attackers,
 * Wounds lost and out-of-action for its targets. Pure; the stored sheet is not changed.
 */
export function applyBattleEvents(sheet: BattleLiveState, events: readonly BattleEventRow[], warbandId: string): BattleLiveState {
  let tallies = sheet.tallies;
  let takenOutBy = sheet.takenOutBy;
  for (const e of events) {
    if (e.reverted_at !== null || e.kind !== "attack") continue;
    const p = e.payload;
    if (p.attacker_warband_id === warbandId && p.kill && p.attacker_kind === "hero") {
      tallies = withTallyChange(tallies, p.attacker_id, "hero", (t) => ({ ...t, enemiesOutOfAction: t.enemiesOutOfAction + 1 }));
    }
    if (p.target_warband_id === warbandId) {
      tallies = withTallyChange(tallies, p.target_id, p.target_kind, (t) => {
        const woundsLost = t.woundsLost + p.wounds_lost;
        if (!p.out_of_action) return { ...t, woundsLost };
        const outOfAction = p.target_kind === "hero" ? 1 : Math.min(p.target_size, t.outOfAction + 1);
        return { ...t, woundsLost, outOfAction };
      });
      if (p.out_of_action) {
        // The log names the attacker; it takes the place of a manual "taken out by" for that model.
        const existing = takenOutBy[p.target_id] ?? [];
        const already = existing.some((x) => x.modelId === p.attacker_id && x.turn === p.turn);
        if (!already) {
          const entry: TakenOutBy = { warbandId: p.attacker_warband_id, modelId: p.attacker_id, name: p.attacker_name, turn: p.turn };
          const manual = existing.filter((x) => x.modelId === null || x.warbandId !== null);
          takenOutBy = { ...takenOutBy, [p.target_id]: p.target_kind === "hero" ? [entry] : [...manual, entry] };
        }
      }
    }
  }
  return tallies === sheet.tallies && takenOutBy === sheet.takenOutBy ? sheet : { ...sheet, tallies, takenOutBy };
}

/** How much of a warrior's tally comes from the log (so the sheet can say "1 from the log"). */
export function eventContribution(events: readonly BattleEventRow[], warbandId: string, id: string): { kills: number; woundsLost: number; outOfAction: number } {
  let kills = 0;
  let woundsLost = 0;
  let outOfAction = 0;
  for (const e of events) {
    if (e.reverted_at !== null) continue;
    const p = e.payload;
    if (p.attacker_warband_id === warbandId && p.attacker_id === id && p.kill && p.attacker_kind === "hero") kills += 1;
    if (p.target_warband_id === warbandId && p.target_id === id) {
      woundsLost += p.wounds_lost;
      if (p.out_of_action) outOfAction += 1;
    }
  }
  return { kills, woundsLost, outOfAction };
}


/** Derive ongoing Bolas effects from unreverted shared events; never write another player's sheet. */
export function activeBolasEntanglements(events: readonly BattleEventRow[], warbandId: string, recoveredEventIds: readonly string[] = []): BattleEventRow[] {
  return events.filter(event => !event.reverted_at && event.payload.target_warband_id === warbandId
    && event.payload.entangled && event.payload.target_size === 1 && !recoveredEventIds.includes(event.id));
}

/** A Recovery roll frees this warrior from the currently active throws only, never future throws. */
export function resolveBolasRecovery(state: BattleLiveState, active: readonly BattleEventRow[], warriorId: string, name: string, die: number, originalDie?: number, turn = state.turn, meta?: { turnKey: string; attemptId: string; reason?: string }): BattleLiveState {
  const valid = (n: number) => Number.isInteger(n) && n >= 1 && n <= 6;
  if (!valid(die) || (originalDie !== undefined && !valid(originalDie))) throw new Error('Enter a D6 result from 1 to 6.');
  const ids = active.filter(e => e.payload.target_id === warriorId && e.payload.entangled && !e.reverted_at && e.payload.target_size === 1).map(e => e.id);
  if (!ids.length) return state;
  const previous = meta && state.bolasRecoveryTests.find(test => test.warriorId === warriorId && test.turnKey === meta.turnKey);
  if (previous && previous.attemptId !== meta?.attemptId && !meta?.reason?.trim()) throw new Error('Explain why another Recovery test is needed this turn.');
  const freed = die >= 4;
  return withRollAttempt({ ...state, bolasRecoveryTests: meta ? [...state.bolasRecoveryTests.filter(test => test.warriorId !== warriorId || test.turnKey !== meta.turnKey), { warriorId, turnKey: meta.turnKey, attemptId: meta.attemptId }] : state.bolasRecoveryTests, bolasRecoveredEventIds: freed ? [...new Set([...state.bolasRecoveredEventIds, ...ids])] : state.bolasRecoveredEventIds }, {
    id: meta?.attemptId ?? crypto.randomUUID(), at: new Date().toISOString(), turn, kind: 'attack', status: 'complete',
    label: `${name}: Bolas Recovery ${freed ? 'succeeded' : 'failed'}`,
    rolls: [...(meta?.reason?.trim() ? [`Additional Recovery test: ${meta.reason.trim()}.`] : []), originalDie === undefined ? `Player entered ${die}.` : `App rolled ${originalDie}${originalDie !== die ? `; player changed it to ${die}` : ''}.`, freed ? 'Freed from the Bolas; movement and Weapon Skill return to normal.' : 'Still entangled: cannot move and has −2 Weapon Skill in hand-to-hand combat. Shooting is unaffected.'],
  });
}

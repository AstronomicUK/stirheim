// The shared combat log (battle_events). An attack event records what one calculator walk-through
// did to a target; every phone lays the match's unreverted events over its own sheet, so the
// attacker's kill and the target's Wounds lost / out of action appear on both sides without either
// player writing to the other's row. Reverting an event puts everything back.

import { z } from "zod";
import type { BattleLiveState, BattleWarriorTally } from "./battle";
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
  const what = p.out_of_action ? `took ${p.target_name} out of action` : p.wounds_lost > 0 ? `wounded ${p.target_name} (${p.outcome.toLowerCase()})` : `${p.outcome.toLowerCase()} ${p.target_name}`;
  return `Turn ${p.turn}: ${p.attacker_name} ${what}.`;
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
    }
  }
  return tallies === sheet.tallies ? sheet : { ...sheet, tallies };
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

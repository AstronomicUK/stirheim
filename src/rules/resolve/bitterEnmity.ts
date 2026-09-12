// Bitter Enmity (Heroes' Serious Injuries 56, 03-campaigns-magic-optional-rules.md:187): "From now on
// the warrior hates the following (roll a D6): 1-3 the individual who caused the injury (if it was a
// Henchman, he hates the enemy leader instead); 4 the leader of the warband that caused the injury;
// 5 the entire warband of the warrior responsible; 6 all warbands of that type."
//
// The injury resolver records the scope from the D6 (#96). This module turns that into a target the
// app can act on, using only what is actually known: the battle sheet's own out-of-action record
// (who took the hero out), the enemy roster (its leader and type), or the player's explicit choice.
// Nothing is ever guessed: with none of those the target stays `unresolved` and only the printed
// text is shown.

import type { BitterEnmityScope, BitterEnmityTarget, WarriorFlags } from "../types/roster";

export function bitterEnmityScope(roll: number): BitterEnmityScope {
  if (roll <= 3) return "individual";
  if (roll === 4) return "leader";
  if (roll === 5) return "warband";
  return "warbandType";
}

/** What the report knows about an enemy warband at the table. */
export interface EnemyWarbandInfo {
  id: string;
  name: string;
  typeId: string;
  typeName: string;
  leaderId?: string;
  leaderName?: string;
  models: { id: string; name: string; kind: "hero" | "hiredSword" | "group" }[];
}

/** Who took the warrior out, from the battle sheet (`takenOutBy`): an enemy model, or something with no model. */
export interface Attribution {
  warbandId: string | null;
  modelId: string | null;
  name: string;
}

/** The player's own answer to "who caused the injury?" when the record cannot say. */
export interface EnmityChoice {
  warbandId: string;
  /** Null when the player names the warband but not the model (or the culprit was a henchman). */
  modelId: string | null;
}

/**
 * Fix the target of a freshly rolled Bitter Enmity. The battle record wins when it names an enemy;
 * otherwise the player's choice; otherwise it stays unresolved with the printed text intact.
 */
export function resolveBitterEnmityTarget(base: BitterEnmityTarget, attribution: Attribution | undefined, enemies: readonly EnemyWarbandInfo[], choice?: EnmityChoice | null): BitterEnmityTarget {
  const fromRecord = attribution?.warbandId ? { warbandId: attribution.warbandId, modelId: attribution.modelId, source: "attribution" as const } : null;
  const fromChoice = choice ? { warbandId: choice.warbandId, modelId: choice.modelId, source: "chosen" as const } : null;
  const pick = fromRecord ?? fromChoice;
  if (!pick) return { ...base, source: "unresolved", warriorId: undefined, warriorName: undefined, warbandId: undefined, warbandName: undefined, warbandTypeId: undefined, warbandTypeName: undefined };
  const enemy = enemies.find((e) => e.id === pick.warbandId);
  const out: BitterEnmityTarget = { ...base, source: pick.source, warbandId: pick.warbandId, warbandName: enemy?.name, warriorId: undefined, warriorName: undefined, warbandTypeId: undefined, warbandTypeName: undefined };
  switch (base.scope) {
    case "individual": {
      const model = enemy?.models.find((m) => m.id === pick.modelId);
      // "If it was a Henchman, he hates the enemy leader instead."
      if (model && model.kind !== "group") return { ...out, warriorId: model.id, warriorName: model.name };
      if (model?.kind === "group" || pick.modelId === null) {
        if (enemy?.leaderId) return { ...out, warriorId: enemy.leaderId, warriorName: enemy.leaderName };
        return { ...out, source: "unresolved" };
      }
      // The record names a model the enemy roster no longer shows (dead, left): keep the name from the record.
      return pick.source === "attribution" && attribution ? { ...out, warriorId: pick.modelId ?? undefined, warriorName: attribution.name } : { ...out, source: "unresolved" };
    }
    case "leader":
      return enemy?.leaderId ? { ...out, warriorId: enemy.leaderId, warriorName: enemy.leaderName } : { ...out, source: "unresolved" };
    case "warband":
      return enemy ? out : { ...out, source: "unresolved" };
    case "warbandType":
      return enemy ? { ...out, warbandTypeId: enemy.typeId, warbandTypeName: enemy.typeName } : { ...out, source: "unresolved" };
  }
}

/** One line for a card or tag: the target when known, otherwise the printed wording. */
export function describeBitterEnmity(t: BitterEnmityTarget): string {
  if (t.source === "unresolved") return t.text;
  switch (t.scope) {
    case "individual":
      return `${t.warriorName ?? "an enemy"}${t.warbandName ? ` (${t.warbandName})` : ""}`;
    case "leader":
      return `${t.warriorName ?? "the leader"}, leader of ${t.warbandName ?? "the enemy warband"}`;
    case "warband":
      return `${t.warbandName ?? "the enemy warband"} (the whole warband)`;
    case "warbandType":
      return `all ${t.warbandTypeName ?? "that type of"} warbands`;
  }
}

/** An opponent about to be fought, in the fight tab's terms. */
export interface EnmityOpponent {
  warriorId: string;
  warbandId: string;
  warbandTypeId?: string;
  isLeader: boolean;
}

/**
 * Does this warrior's Bitter Enmity apply against that opponent? `null` when the warrior has no
 * structured target, or it is unresolved — then only the printed text can be shown, and the table decides.
 */
export function bitterEnmityApplies(flags: Pick<WarriorFlags, "bitterEnmity" | "hates">, opponent: EnmityOpponent): { applies: boolean; reason: string } | null {
  const t = flags.bitterEnmity;
  if (!t || t.source === "unresolved") return null;
  switch (t.scope) {
    case "individual":
      return { applies: t.warriorId === opponent.warriorId, reason: `Bitter Enmity: hates ${describeBitterEnmity(t)}.` };
    case "leader":
      // The hatred is of the person who led the warband at the time; it does not pass to a successor.
      // (`opponent.isLeader` is kept in the shape for display, not for matching.)
      return { applies: t.warriorId !== undefined && t.warriorId === opponent.warriorId, reason: `Bitter Enmity: hates ${describeBitterEnmity(t)}.` };
    case "warband":
      return { applies: t.warbandId === opponent.warbandId, reason: `Bitter Enmity: hates ${describeBitterEnmity(t)}.` };
    case "warbandType":
      return { applies: t.warbandTypeId !== undefined && t.warbandTypeId === opponent.warbandTypeId, reason: `Bitter Enmity: hates ${describeBitterEnmity(t)}.` };
  }
}

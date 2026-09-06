// Rewards of the Shadowlord applied to a roster: what each 2D6 result needs from the player and
// what it does. Pure; the advance flow feeds the dice and choices in and shows what is still owed.

import { findItem } from "../data/items";
import { lookupReward, POSSESSED_ALLOWED_ITEM_IDS, POSSESSED_MUTATION_IDS, type RewardRow } from "../data/campaign/rewards";
import { STAT_NAMES } from "./injuries";
import type { StatKey } from "../types/common";
import type { ResolutionEvent, RosterHero, RosterItem, RosterWarband } from "../types/roster";

export interface RewardChoices {
  /** The two D6 of the 2D6 roll. */
  dice: [number | null, number | null];
  /** Mutation: the D6 (1 = lose a characteristic point; 2+ = choose a mutation). */
  mutationD6: number | null;
  /** Mutation on a 1: which characteristic loses a point. */
  lostStat: StatKey | null;
  /** Mutation on 2+: the mutation chosen (item id). */
  mutationId: string | null;
  /** Daemon Weapon: the form the player gives it ("sword", "axe"). */
  weaponForm: string;
  /** Possessed!: the D6 read as a D3 (1-2 = 1, 3-4 = 2, 5-6 = 3) for skills lost. */
  skillsD6: number | null;
  /** Possessed!: the skills given up. */
  lostSkillIds: string[];
}

export function emptyRewardChoices(): RewardChoices {
  return { dice: [null, null], mutationD6: null, lostStat: null, mutationId: null, weaponForm: "", skillsD6: null, lostSkillIds: [] };
}

export type RewardNeed = "dice" | "mutationD6" | "lostStat" | "mutation" | "weaponForm" | "skillsD6" | "lostSkills";

export interface RewardOutcome {
  roster: RosterWarband;
  hero: RosterHero;
  events: ResolutionEvent[];
  /** One line for the record. */
  summary: string;
  /** Items moved to the stash for a Possessed! warrior, by name. */
  stashed: string[];
}

export interface RewardPlan {
  total: number | null;
  row: RewardRow | null;
  need: RewardNeed | null;
  /** How many skills a Possessed! warrior gives up (min of the D3 and the skills he has). */
  skillsToLose: number | null;
  result: RewardOutcome | null;
}

function d3Of(d6: number): number {
  return Math.ceil(d6 / 2);
}

function isDie(v: number | null): v is number {
  return v !== null && Number.isInteger(v) && v >= 1 && v <= 6;
}

function replaceHero(roster: RosterWarband, hero: RosterHero): RosterWarband {
  return { ...roster, heroes: roster.heroes.map((h) => (h.id === hero.id ? hero : h)) };
}

function itemName(item: RosterItem): string {
  return item.itemId ? (findItem(item.itemId)?.name ?? item.itemId) : (item.customName ?? "item");
}

/** Work out what a roll on the Rewards table does to `hero`, or what is still needed. */
export function planReward(roster: RosterWarband, hero: RosterHero, choices: RewardChoices): RewardPlan {
  const [a, b] = choices.dice;
  const plan: RewardPlan = { total: null, row: null, need: null, skillsToLose: null, result: null };
  if (!isDie(a) || !isDie(b)) return { ...plan, need: "dice" };
  const total = a + b;
  const row = lookupReward(total);
  plan.total = total;
  plan.row = row;
  const rolled = `Rewards of the Shadowlord, rolled ${total}: ${row.title}.`;
  const done = (next: RosterHero, events: ResolutionEvent[], summary: string, extra: Partial<RewardOutcome> = {}): RewardPlan => ({
    ...plan,
    result: { roster: extra.roster ?? replaceHero(roster, next), hero: next, events, summary: `${rolled} ${summary}`, stashed: extra.stashed ?? [] },
  });

  switch (row.kind) {
    case "wrath": {
      // The warrior and everything he carried are gone.
      const next: RosterHero = { ...hero, status: "retired", equipment: [], notes: [hero.notes, "Wrath of the Shadowlord: mutated beyond recognition and vanished into the ruins."].filter(Boolean).join("\n") };
      const lost = hero.equipment.map(itemName);
      return done(next, [{ kind: "statusChange", subjectId: hero.id, message: `${hero.name} is mutated beyond recognition and vanishes into the ruins${lost.length ? `, taking ${lost.join(", ")} with him` : ""}.`, data: { status: "retired" } }], `${hero.name} vanishes with his kit.`);
    }
    case "nothing":
      return done(hero, [{ kind: "note", subjectId: hero.id, message: `${hero.name}'s pleas go unanswered; the advance is spent.` }], "The advance is spent.");
    case "mutation": {
      if (!isDie(choices.mutationD6)) return { ...plan, need: "mutationD6" };
      if (choices.mutationD6 === 1) {
        if (!choices.lostStat) return { ...plan, need: "lostStat" };
        const stat = choices.lostStat;
        const before = hero.stats[stat];
        const after = Math.max(1, before - 1);
        const next: RosterHero = { ...hero, stats: { ...hero.stats, [stat]: after } };
        return done(next, [{ kind: "statChange", subjectId: hero.id, message: `${hero.name}: ${STAT_NAMES[stat]} ${before} -> ${after} (atrophy).`, data: { stat, before, after } }], `D6 1: ${STAT_NAMES[stat]} ${before} -> ${after}.`);
      }
      if (!choices.mutationId || !(POSSESSED_MUTATION_IDS as readonly string[]).includes(choices.mutationId)) return { ...plan, need: "mutation" };
      const mutation = findItem(choices.mutationId);
      const next: RosterHero = { ...hero, equipment: [...hero.equipment, { itemId: choices.mutationId, quantity: 1, notes: "Reward of the Shadowlord" }] };
      return done(next, [{ kind: "itemGained", subjectId: hero.id, message: `${hero.name} is rewarded with ${mutation?.name ?? choices.mutationId}.`, data: { itemId: choices.mutationId } }], `D6 ${choices.mutationD6}: ${mutation?.name ?? choices.mutationId}, at no cost.`);
    }
    case "chaosArmour": {
      const next: RosterHero = { ...hero, equipment: [...hero.equipment, { itemId: "chaos_armour", quantity: 1, notes: "Reward of the Shadowlord" }] };
      return done(next, [{ kind: "itemGained", subjectId: hero.id, message: `${hero.name}'s body becomes encrusted with Chaos Armour (4+ save).`, data: { itemId: "chaos_armour" } }], "Chaos Armour, 4+ save.");
    }
    case "daemonWeapon": {
      const form = choices.weaponForm.trim();
      if (!form) return { ...plan, need: "weaponForm" };
      const next: RosterHero = { ...hero, equipment: [...hero.equipment, { itemId: "daemon_weapon", quantity: 1, notes: `form: ${form}` }] };
      return done(next, [{ kind: "itemGained", subjectId: hero.id, message: `${hero.name} receives a Daemon Weapon in the form of a ${form} (+1 Strength, +1 to hit).`, data: { itemId: "daemon_weapon" } }], `A Daemon Weapon (${form}).`);
    }
    case "possessed": {
      if (!isDie(choices.skillsD6)) return { ...plan, need: "skillsD6" };
      const toLose = Math.min(d3Of(choices.skillsD6), hero.skillIds.length);
      const chosen = choices.lostSkillIds.filter((id) => hero.skillIds.includes(id));
      if (chosen.length < toLose) return { ...plan, need: "lostSkills", skillsToLose: toLose };
      const keep = hero.equipment.filter((i) => i.itemId && (POSSESSED_ALLOWED_ITEM_IDS as readonly string[]).includes(i.itemId));
      const moved = hero.equipment.filter((i) => !keep.includes(i));
      const next: RosterHero = {
        ...hero,
        stats: { ...hero.stats, WS: hero.stats.WS + 1, S: hero.stats.S + 1, A: hero.stats.A + 1, W: hero.stats.W + 1 },
        skillIds: hero.skillIds.filter((id) => !chosen.slice(0, toLose).includes(id)),
        equipment: keep,
        flags: { ...hero.flags, daemonPossessed: true },
      };
      const stash = [...roster.stash];
      for (const item of moved) {
        const idx = stash.findIndex((s) => s.itemId === item.itemId && (s.customName ?? "") === (item.customName ?? "") && (s.notes ?? "") === (item.notes ?? ""));
        if (idx === -1) stash.push({ ...item });
        else stash[idx] = { ...stash[idx], quantity: stash[idx].quantity + item.quantity };
      }
      const nextRoster: RosterWarband = { ...replaceHero(roster, next), stash };
      const stashed = moved.map((i) => (i.quantity > 1 ? `${itemName(i)} ×${i.quantity}` : itemName(i)));
      const events: ResolutionEvent[] = [
        { kind: "statChange", subjectId: hero.id, message: `${hero.name} is Possessed: +1 WS, +1 S, +1 A, +1 W (beyond the racial maximums).` },
        ...(toLose > 0 ? [{ kind: "skillLost", subjectId: hero.id, message: `${hero.name} loses ${toLose} ${toLose === 1 ? "skill" : "skills"} (D3 ${d3Of(choices.skillsD6)}).`, data: { skillIds: chosen.slice(0, toLose) } }] : []),
        ...(stashed.length > 0 ? [{ kind: "itemsToStash", subjectId: hero.id, message: `${hero.name} may no longer use weapons or armour: ${stashed.join(", ")} moved to the stash.`, data: { items: stashed } }] : []),
      ];
      return done(next, events, `Possessed: +1 WS, S, A and W; ${toLose} ${toLose === 1 ? "skill" : "skills"} lost${stashed.length ? `; ${stashed.join(", ")} to the stash` : ""}.`, { roster: nextRoster, stashed });
    }
  }
}

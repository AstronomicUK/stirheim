// Things that let a warband re-roll or nudge its exploration dice: a Mordheim Map (by the D6 rolled
// when it was bought), a Wyrdstone Pendulum (Leadership test after the battle), a Rabbit's Foot
// (unless the campaign's house rule keeps it to the battle), Tarot Cards (a Leadership test before
// the battle, recorded on the sheet), and a list rule that lets one hero roll two dice and keep one.
// The app suggests; the player chooses which die and may leave an aid unused.

import type { CampaignHouseRules, RosterHero, RosterItem, RosterWarband } from "../types/roster";
import { warbandRules } from "../data/campaignRules";
import { RulesError } from "./errors";

export type AidKind = "reroll" | "modify" | "rerollKeepEither";

export interface ExplorationAid {
  /** Stable within a report: `${source}:${holderId}`. */
  key: string;
  label: string;
  kind: AidKind;
  /** How many dice this aid may touch in one exploration. */
  uses: number;
  holderId: string | null;
  holderName: string;
  /** The rule, quoted or paraphrased. */
  note: string;
  /** A Leadership test the holder must pass first (Wyrdstone Pendulum). */
  requiresTest?: { stat: "Ld"; value: number };
}

export interface AidUse {
  aidKey: string;
  /** For the report: "Mordheim Map (Vague)". */
  label: string;
  dieIndex: number;
  from: number;
  to: number;
  /** The Leadership test, when the aid needed one. */
  test?: { rolls: [number, number]; passed: boolean };
}

export interface AidOptions {
  houseRules: Pick<CampaignHouseRules, "rabbitsFootBattleOnly">;
  /** Heroes who went out of action this battle: their items give nothing. */
  heroesOutOfAction: readonly string[];
  /** Outcomes recorded on the battle sheet before the game ("tarot:<heroId>" -> "passed"). */
  preBattle: Record<string, string>;
}

/** The map's purchase result is kept in the item's notes, e.g. "Map D6 5: Accurate". */
export function mapGrade(item: RosterItem): "fake" | "vague" | "catacomb" | "accurate" | "master" | null {
  const note = (item.notes ?? "").toLowerCase();
  if (note.includes("master")) return "master";
  if (note.includes("accurate")) return "accurate";
  if (note.includes("catacomb")) return "catacomb";
  if (note.includes("vague")) return "vague";
  if (note.includes("fake")) return "fake";
  return null;
}

/** The Mordheim Map table (item text): what a D6 rolled at purchase means, and the note to keep on the item. */
export function mordheimMapResult(d6: number): { grade: string; note: string; text: string } {
  switch (d6) {
    case 1:
      return { grade: "Fake", note: `Map D6 1: Fake`, text: "Fake. Worthless; your opponent may choose the next scenario you play." };
    case 2:
    case 3:
      return { grade: "Vague", note: `Map D6 ${d6}: Vague`, text: "Vague. Re-roll any one die during the next exploration phase; accept the second roll." };
    case 4:
      return { grade: "Catacomb", note: `Map D6 4: Catacomb map`, text: "Catacomb map. You may choose the scenario next time you fight." };
    case 5:
      return { grade: "Accurate", note: `Map D6 5: Accurate`, text: "Accurate. Re-roll up to three dice during the next exploration phase; accept the second rolls." };
    case 6:
      return { grade: "Master", note: `Map D6 6: Master map`, text: "Master map. From now on re-roll one exploration die whenever the map's owner was not taken out of action." };
    default:
      throw new RulesError("map.invalidDie", `Not a valid D6 result: ${d6}`);
  }
}

function holderOf(warband: RosterWarband, item: RosterItem): { id: string | null; name: string; hero: RosterHero | null } {
  for (const h of warband.heroes) if (h.equipment.includes(item)) return { id: h.id, name: h.name, hero: h };
  return { id: null, name: "the stash", hero: null };
}

/** Every aid the roster offers for this exploration, in roster order. */
export function explorationAids(warband: RosterWarband, opts: AidOptions): ExplorationAid[] {
  const out: ExplorationAid[] = [];
  const down = new Set(opts.heroesOutOfAction);
  const items: RosterItem[] = [...warband.heroes.filter((h) => h.status === "active").flatMap((h) => h.equipment), ...warband.stash];
  for (const item of items) {
    if (!item.itemId) continue;
    const holder = holderOf(warband, item);
    const standing = holder.id === null || !down.has(holder.id);
    if (item.itemId === "mordheim_map") {
      const grade = mapGrade(item);
      if (grade === "vague") out.push({ key: `map:${holder.id ?? "stash"}`, label: "Mordheim Map (Vague)", kind: "reroll", uses: 1, holderId: holder.id, holderName: holder.name, note: "Re-roll any one die; accept the second roll. The map is spent afterwards." });
      else if (grade === "accurate") out.push({ key: `map:${holder.id ?? "stash"}`, label: "Mordheim Map (Accurate)", kind: "reroll", uses: 3, holderId: holder.id, holderName: holder.name, note: "Re-roll up to three dice; accept the second rolls. The map is spent afterwards." });
      else if (grade === "master" && standing) out.push({ key: `map:${holder.id ?? "stash"}`, label: "Mordheim Map (Master)", kind: "reroll", uses: 1, holderId: holder.id, holderName: holder.name, note: "Re-roll one die every exploration while the owner was not taken out of action." });
      else if (grade === null) out.push({ key: `map:${holder.id ?? "stash"}`, label: "Mordheim Map (ungraded)", kind: "reroll", uses: 1, holderId: holder.id, holderName: holder.name, note: "No purchase D6 recorded on this map; treated as Vague (one re-roll). Note the real grade on the item." });
    } else if (item.itemId === "wyrdstone_pendulum" && holder.hero && standing) {
      out.push({ key: `pendulum:${holder.id}`, label: "Wyrdstone Pendulum", kind: "reroll", uses: 1, holderId: holder.id, holderName: holder.name, note: `${holder.name} makes a Leadership test; if passed, re-roll any one die (not again).`, requiresTest: { stat: "Ld", value: holder.hero.stats.Ld } });
    } else if (item.itemId === "rabbits_foot" && holder.hero && standing && !opts.houseRules.rabbitsFootBattleOnly) {
      out.push({ key: `rabbit:${holder.id}`, label: "Rabbit's Foot", kind: "reroll", uses: 1, holderId: holder.id, holderName: holder.name, note: "If the re-roll was not used in the battle, re-roll one exploration die." });
    } else if (item.itemId === "tarot_cards" && holder.hero && opts.preBattle[`tarot:${holder.id}`] === "passed") {
      out.push({ key: `tarot:${holder.id}`, label: "Tarot Cards", kind: "modify", uses: 1, holderId: holder.id, holderName: holder.name, note: `${holder.name} read the cards before the battle and passed: modify one die by +1 or -1.` });
    }
  }
  const rule = warbandRules(warband.warbandTemplateId).exploration;
  if (rule?.rollTwoKeepOneWith) {
    const seer = warband.heroes.find((h) => h.status === "active" && h.unitTemplateId === rule.rollTwoKeepOneWith && !down.has(h.id));
    if (seer) out.push({ key: `keepone:${seer.id}`, label: seer.name, kind: "rerollKeepEither", uses: 1, holderId: seer.id, holderName: seer.name, note: rule.note });
  }
  return out;
}

/** Uses left on each aid after the ones already spent. */
export function aidUsesLeft(aid: ExplorationAid, spent: readonly AidUse[]): number {
  return Math.max(0, aid.uses - spent.filter((u) => u.aidKey === aid.key).length);
}

/** Check one use against its aid before the draft records it. */
export function validateAidUse(aid: ExplorationAid, use: AidUse): void {
  if (!Number.isInteger(use.to) || use.to < 1 || use.to > 6) throw new RulesError("aid.invalidDie", `Not a valid D6 result: ${use.to}`);
  if (aid.kind === "modify" && Math.abs(use.to - use.from) !== 1) throw new RulesError("aid.modifyByOne", "Tarot Cards move a die by exactly one");
  if (aid.requiresTest && !use.test?.passed) throw new RulesError("aid.testFailed", `${aid.label} needs a passed ${aid.requiresTest.stat} test first`);
}

/** 2D6 equal to or under the Leadership passes. */
export function leadershipTest(rolls: [number, number], ld: number): boolean {
  return rolls[0] + rolls[1] <= ld;
}

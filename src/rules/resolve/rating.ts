// Warband rating (rulebook "Warband Rating", data/campaign/trading 03:46-53).
//
//   rating = 5 per warrior (20 per large creature) + every warrior's accumulated experience
//
// Rule judgements:
//   - Only heroes with status "active" count. Dead and retired heroes have left the warband;
//     captured heroes are held by another warband and are not "in it" until ransomed.
//   - Every henchman in a group counts individually: size x 5 (or 20) plus size x the group's xp,
//     since each member holds the group's experience.
//   - Hired swords use their own entry's "Rating:" text ("increases the warband's rating by 12
//     points plus 1 point for each Experience point he has") rather than the flat 5 + xp. When the
//     text cannot be parsed the rulebook default of 5 + xp is used and a note says so. Hired swords
//     with status "dead" or "left" are excluded.

import type { WarbandTemplate } from "../types";
import type { RosterWarband } from "../types/roster";
import { warbandRules } from "../data/campaignRules";
import { findHiredSword } from "../data/campaign/hiredSwords";
import { RATING_POINTS_PER_LARGE_CREATURE, RATING_POINTS_PER_WARRIOR } from "../data/campaign/trading";

export interface RatingLine {
  subjectId: string;
  name: string;
  points: number;
  reason: string;
}

export interface WarbandRatingResult {
  total: number;
  breakdown: RatingLine[];
  /** Anything the player should double-check, e.g. a hired sword whose rating text could not be read. */
  notes: string[];
}

export interface HiredSwordRating {
  /** Flat points the hired sword adds. */
  base: number;
  /** Whether the entry adds 1 point per Experience point on top. */
  perXp: boolean;
  /** False when the text could not be read and the rulebook default (5 + xp) was substituted. */
  parsed: boolean;
}

/** Default when a hired sword entry has no usable "Rating:" text: treated as an ordinary warrior. */
export const HIRED_SWORD_DEFAULT_RATING: HiredSwordRating = { base: RATING_POINTS_PER_WARRIOR, perXp: true, parsed: false };

const BASE_RE = /(?:by|rating)\s*\+?\s*(\d+)\s*points?/i;
const PER_XP_RE = /(?:plus|\+)\s*(?:1|one)\s*point\b[^.]*?experience/i;

/**
 * Read a hired sword's "Rating:" sentence. Handles every phrasing in the data:
 * "by 12 points plus 1 point for each Experience point", "by +25 points, plus 1 point for each
 * point of Experience", "rating + 25 points", "by +45 points." (no per-xp clause).
 */
export function parseHiredSwordRating(text: string | undefined): HiredSwordRating {
  if (!text) return HIRED_SWORD_DEFAULT_RATING;
  const base = BASE_RE.exec(text);
  if (!base) return HIRED_SWORD_DEFAULT_RATING;
  return { base: Number(base[1]), perXp: PER_XP_RE.test(text), parsed: true };
}

/** Points one ordinary warrior or large creature contributes before experience. */
export function warriorBasePoints(isLarge: boolean | undefined): number {
  return isLarge ? RATING_POINTS_PER_LARGE_CREATURE : RATING_POINTS_PER_WARRIOR;
}

/** The warband's current rating with a per-warrior breakdown. `template` is only used for nicer names. */
export function warbandRating(warband: RosterWarband, template?: WarbandTemplate): WarbandRatingResult {
  const breakdown: RatingLine[] = [];
  const notes: string[] = [];

  for (const hero of warband.heroes) {
    if (hero.status !== "active") continue;
    const base = warriorBasePoints(hero.isLarge);
    breakdown.push({
      subjectId: hero.id,
      name: hero.name,
      points: base + hero.xp,
      reason: `${base} ${hero.isLarge ? "(large creature)" : "(warrior)"} + ${hero.xp} xp`,
    });
  }

  for (const group of warband.henchmenGroups) {
    if (group.size < 1) continue;
    const base = warriorBasePoints(group.isLarge);
    const perMember = base + group.xp;
    breakdown.push({
      subjectId: group.id,
      name: group.name || unitName(template, group.unitTemplateId) || group.unitTemplateId,
      points: perMember * group.size,
      reason: `${group.size} x (${base} ${group.isLarge ? "(large creature)" : "(warrior)"} + ${group.xp} xp)`,
    });
  }

  for (const hs of warband.hiredSwords) {
    if (hs.status !== "active") continue;
    const entry = findHiredSword(hs.hiredSwordId);
    const rating = parseHiredSwordRating(entry?.detail?.rating);
    if (!rating.parsed) {
      notes.push(
        `${hs.name}: could not read the rating from the ${entry?.name ?? hs.hiredSwordId} entry; counted as ${RATING_POINTS_PER_WARRIOR} + xp`,
      );
    }
    const points = rating.base + (rating.perXp ? hs.xp : 0);
    breakdown.push({
      subjectId: hs.id,
      name: hs.name,
      points,
      reason: rating.perXp ? `${rating.base} (hired sword) + ${hs.xp} xp` : `${rating.base} (hired sword, experience not counted)`,
    });
  }

  const raw = breakdown.reduce((sum, line) => sum + line.points, 0);
  const factor = warbandRules(warband.warbandTemplateId).ratingFactor ?? 1;
  const total = factor === 1 ? raw : Math.round(raw * factor);
  if (factor !== 1) notes.push(`Rating counts at ${factor}x for this warband (${raw} -> ${total}).`);
  return { total, breakdown, notes };
}

function unitName(template: WarbandTemplate | undefined, unitTemplateId: string): string | undefined {
  if (!template) return undefined;
  return [...template.heroTemplates, ...template.henchmanTemplates].find((u) => u.id === unitTemplateId)?.name;
}

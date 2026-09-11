// Leader succession: when the warband's leader is dead (or gone), who takes over and what the list
// says about it. The app suggests the candidates the rule names, in the order it names them; the
// player picks. Permanent successors are re-templated; supported temporary successors keep their
// original unit type. Both keep stats, experience, skills, injuries and kit.

import { warbandRules } from "../data/campaignRules";
import { unitRules } from "../data/campaignRules";
import { findUnitTemplate } from "../data/warbandTemplates";
import type { WarbandTemplate } from "../types";
import type { Resolution, RosterHero, RosterWarband } from "../types/roster";
import { RulesError } from "./errors";
import { currentLeader, leaderTemplate } from "./roster";

export interface SuccessionCandidate {
  hero: RosterHero;
  /** Why this hero is offered first, when the list says so. */
  reason: string | null;
  /** Ranked by the list's rule (0 = the rule's first choice). */
  rank: number;
}

export interface SuccessionView {
  /** The leader unit the warband is missing. */
  leaderUnitName: string;
  /** The list's own rule, when it has one. */
  note: string | null;
  candidates: SuccessionCandidate[];
  /** Equal leading candidates require a D6 decision at the table. */
  tiedIds: string[];
  /** True when the rule says the warband cannot carry on without a specific hero (Clan Moulder with no Apprentice). */
  disbands: boolean;
}

/** Does the warband lack its leader? */
export function needsLeader(warband: RosterWarband, template: WarbandTemplate): boolean {
  const leader = leaderTemplate(template);
  if (!leader) return false;
  return !currentLeader(warband.heroes, template);
}

/** Who may take over, best candidate first. */
export function successionOptions(warband: RosterWarband, template: WarbandTemplate): SuccessionView | null {
  const leader = leaderTemplate(template);
  if (!leader || !needsLeader(warband, template)) return null;
  const rule = warbandRules(template.id).succession;
  const active = warband.heroes.filter((h) => h.status === "active" && !unitRules(h.unitTemplateId).neverLeads);
  const candidates: SuccessionCandidate[] = active.map((hero) => {
    let rank = 100;
    let reason: string | null = null;
    if (rule?.candidateUnitIds) {
      const idx = rule.candidateUnitIds.indexOf(hero.unitTemplateId);
      if (idx !== -1) {
        rank = idx;
        reason = rule.note;
      }
    }
    return { hero, reason, rank };
  });
  const named = (c: SuccessionCandidate) => (c.rank < 100 ? 0 : 1);
  candidates.sort((a, b) =>
    rule?.by !== "experience"
      ? named(a) - named(b) || b.hero.stats.Ld - a.hero.stats.Ld || b.hero.xp - a.hero.xp
      : a.rank - b.rank || b.hero.xp - a.hero.xp,
  );
  const first = candidates[0];
  const tied = first ? candidates.filter(c =>
    (rule?.by === "experience" ? c.rank === first.rank : named(c) === named(first)) &&
    (rule?.by === "experience" || c.hero.stats.Ld === first.hero.stats.Ld) && c.hero.xp === first.hero.xp) : [];
  const tiedIds = tied.length > 1 ? tied.map(c => c.hero.id) : [];
  if (rule?.candidateUnitIds && !rule.anyHero) {
    const named = candidates.filter((c) => c.rank < 100);
    return { leaderUnitName: leader.name, note: rule.note, candidates: named, tiedIds: tiedIds.filter(id => named.some(c => c.hero.id === id)), disbands: named.length === 0 && Boolean(rule.disbandsWithout) };
  }
  return { leaderUnitName: leader.name, note: rule?.note ?? null, candidates, tiedIds, disbands: false };
}

/** Appoint the same warrior, retaining their unit type when the list specifies temporary leadership. */
export function appointLeader(warband: RosterWarband, template: WarbandTemplate, heroId: string): Resolution<RosterWarband> {
  const leader = leaderTemplate(template);
  if (!leader) throw new RulesError("succession.noLeaderType", `${template.name} has no mandatory leader`);
  if (!needsLeader(warband, template)) throw new RulesError("succession.hasLeader", `${warband.name} already has a ${leader.name}`);
  const hero = warband.heroes.find((h) => h.id === heroId && h.status === "active");
  if (!hero) throw new RulesError("succession.unknownHero", `No active hero with id "${heroId}"`);
  if (unitRules(hero.unitTemplateId).neverLeads) throw new RulesError("succession.neverLeads", `${hero.name} may never lead the warband`);
  const rule = warbandRules(template.id).succession;
  const fromUnit = findUnitTemplate(template, hero.unitTemplateId);
  const gained = (rule?.grantsSkillIds ?? []).filter((id) => !hero.skillIds.includes(id));
  const next: RosterHero = {
    ...hero,
    unitTemplateId: rule?.temporary ? hero.unitTemplateId : leader.id,
    flags: { ...hero.flags, ...(rule?.temporary ? { temporaryLeader: true } : {}) },
    skillTableIds: [...hero.skillTableIds],
    skillIds: [...hero.skillIds, ...gained],
  };
  return {
    value: { ...warband, heroes: warband.heroes.map((h) => (h.id === heroId ? next : h)) },
    events: [
      {
        kind: "leader.succession",
        subjectId: heroId,
        message: `${hero.name} (${fromUnit?.name ?? hero.unitTemplateId}) takes over as ${rule?.temporary ? "temporary leader" : leader.name}${gained.length ? `, gaining ${gained.join(", ")}` : ""}${rule ? ` (${rule.note})` : ""}`,
        data: { from: hero.unitTemplateId, to: next.unitTemplateId, temporary: Boolean(rule?.temporary), gained },
      },
    ],
  };
}

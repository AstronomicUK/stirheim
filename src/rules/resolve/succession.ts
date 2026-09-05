// Leader succession: when the warband's leader is dead (or gone), who takes over and what the list
// says about it. The app suggests the candidates the rule names, in the order it names them; the
// player picks, and the chosen hero is re-templated as the leader type, keeping stats, experience,
// skills, injuries and kit.

import { warbandRules } from "../data/campaignRules";
import { unitRules } from "../data/campaignRules";
import { findUnitTemplate } from "../data/warbandTemplates";
import type { WarbandTemplate } from "../types";
import type { Resolution, RosterHero, RosterWarband } from "../types/roster";
import { RulesError } from "./errors";
import { leaderTemplate } from "./roster";

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
  /** True when the rule says the warband cannot carry on without a specific hero (Clan Moulder with no Apprentice). */
  disbands: boolean;
}

/** Does the warband lack its leader? */
export function needsLeader(warband: RosterWarband, template: WarbandTemplate): boolean {
  const leader = leaderTemplate(template);
  if (!leader) return false;
  return !warband.heroes.some((h) => h.status === "active" && h.unitTemplateId === leader.id);
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
    rule?.by === "leadership"
      ? named(a) - named(b) || b.hero.stats.Ld - a.hero.stats.Ld || b.hero.xp - a.hero.xp
      : a.rank - b.rank || b.hero.xp - a.hero.xp,
  );
  if (rule?.candidateUnitIds && !rule.anyHero) {
    const named = candidates.filter((c) => c.rank < 100);
    return { leaderUnitName: leader.name, note: rule.note, candidates: named, disbands: named.length === 0 && Boolean(rule.disbandsWithout) };
  }
  return { leaderUnitName: leader.name, note: rule?.note ?? null, candidates, disbands: false };
}

/** Make `heroId` the leader: same warrior, now of the leader's unit type, plus any skill the rule grants. */
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
    unitTemplateId: leader.id,
    skillTableIds: [...new Set([...hero.skillTableIds, ...leader.skillTableIds])],
    skillIds: [...hero.skillIds, ...gained],
  };
  return {
    value: { ...warband, heroes: warband.heroes.map((h) => (h.id === heroId ? next : h)) },
    events: [
      {
        kind: "leader.succession",
        subjectId: heroId,
        message: `${hero.name} (${fromUnit?.name ?? hero.unitTemplateId}) takes over as ${leader.name}${gained.length ? `, gaining ${gained.join(", ")}` : ""}${rule ? ` (${rule.note})` : ""}`,
        data: { from: hero.unitTemplateId, to: leader.id, gained },
      },
    ],
  };
}

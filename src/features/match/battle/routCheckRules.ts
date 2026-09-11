// Pure helpers for the rout check: whose Leadership may be used and which the rules point at.

import type { BattleLiveState } from '../../../domain/battle'
import { leaderTemplate } from '../../../rules/resolve/roster'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterHero, RosterHiredSword, RosterWarband } from '../../../rules/types/roster'
import { unitRules } from '../../../rules/data/campaignRules'
import { animalsFighting, fightingGroups, groupOut, isHeroOut, splitWarriors, routCasualties, rosterRoutThreshold } from './sheet'

/** Merchant Bribery (1c:2298): a learned skill, never a warband-wide free ability. */
export function briberyQuote(roster: RosterWarband, sheet: BattleLiveState, paidExclusions = 0) {
  const fighting = splitWarriors(roster, sheet).fighting
  const merchant = fighting.find(e => e.role === 'hero' && e.warrior.skillIds.includes('merchant_caravans_skills_bribery') && !isHeroOut(sheet, e.warrior.id))
  const hiredSwords = fighting.filter(e => e.role === 'hiredSword' && !isHeroOut(sheet, e.warrior.id)).length
  const henchmen = fightingGroups(roster).reduce((n, g) => n + Math.max(0, g.size - groupOut(sheet, g.id)), 0)
  const fightingHeroIds = new Set(fighting.filter(e => e.role === 'hero').map(e => e.warrior.id))
  // A purchased animal remains in the game when its owner falls, but not when
  // the owner was absent from the battle in the first place.
  const animals = animalsFighting(roster).filter(a => fightingHeroIds.has(a.holderId) && !isHeroOut(sheet, a.id)).length
  const nonHeroes = hiredSwords + henchmen + animals
  const cost = 5 * nonHeroes
  const casualties = Math.max(0, routCasualties(sheet, roster) - Math.max(0, paidExclusions))
  const threshold = rosterRoutThreshold(roster, sheet)
  const due = threshold > 0 && casualties >= threshold && !sheet.routed
  return { merchantId: merchant?.warrior.id, merchantName: merchant?.warrior.name, nonHeroes, hiredSwords, henchmen, animals, cost, casualties, threshold,
    available: Boolean(merchant) && due && casualties >= 1 && roster.gold >= cost,
    testStillRequiredAfterPayment: Math.max(0, casualties - 1) >= threshold,
  }
}

export interface LdOption {
  id: string
  label: string
  ld: number
  standing: boolean
  unavailableReason?: string
  availabilityNote?: string
  leader: boolean
  /** False for warriors the rules say may never lead (Flagellants, Ruffians...). */
  mayLead: boolean
}

/** Who may give their Leadership: the leader if standing, otherwise the highest eligible remaining fighter. */
export function leadershipOptions(roster: RosterWarband, template: WarbandTemplate | undefined, sheet: BattleLiveState, leaderLd: { bonus: number; sources: string[] } = { bonus: 0, sources: [] }, conditions: ReadonlyMap<string, string> = new Map()): LdOption[] {
  const leaderUnit = template ? leaderTemplate(template) : undefined
  const fighting = splitWarriors(roster, sheet).fighting
  const options = fighting.map(({ warrior }): LdOption => {
    const w = warrior as RosterHero | RosterHiredSword
    const isHero = 'unitTemplateId' in w
    const leader = isHero && leaderUnit !== undefined && w.unitTemplateId === leaderUnit.id
    // Hired Swords cannot lend Leadership for Rout tests; eligible henchmen are added below.
    const mayLead = isHero && !unitRules(w.unitTemplateId).neverLeads
    const ld = leader && leaderLd.bonus ? w.stats.Ld + leaderLd.bonus : w.stats.Ld
    const label = leader && leaderLd.bonus ? `${w.name} (Ld ${w.stats.Ld} +${leaderLd.bonus} ${leaderLd.sources.join(', ')})` : `${w.name} (Ld ${w.stats.Ld})`
    const unavailableReason = isHeroOut(sheet, w.id) ? 'out of action' : conditions.get(w.id) === 'Stunned' ? 'stunned' : undefined
    return { id: w.id, label, ld, standing: unavailableReason === undefined, unavailableReason, leader, mayLead }
  })
  for (const group of fightingGroups(roster)) {
    // Events identify the group, not which member was stunned. Apply the event only
    // to a single-model group; never mark an entire group stunned from one attack.
    const unavailableReason = groupOut(sheet, group.id) >= group.size ? 'out of action'
      : group.size === 1 && conditions.get(group.id) === 'Stunned' ? 'stunned' : undefined
    options.push({
      id: group.id, label: `${group.name} (Ld ${group.stats.Ld})`, ld: group.stats.Ld,
      standing: unavailableReason === undefined, unavailableReason, leader: false,
      availabilityNote: group.size > 1 && conditions.get(group.id) === 'Stunned' ? 'confirm an unstunned member remains' : undefined,
      mayLead: !unitRules(group.unitTemplateId).neverLeads,
    })
  }
  // Leader first, then available warriors by Leadership. Unavailable entries remain
  // selectable for approved player overrides and conditions not recorded in the app.
  return options.sort((a, b) => Number(b.leader) - Number(a.leader) || Number(b.standing) - Number(a.standing) || b.ld - a.ld)
}

/** The Leadership the rules point at: the leader while standing, else the highest standing warrior. */
export function suggestedLeadership(options: LdOption[]): LdOption | undefined {
  return options.find((o) => o.leader && o.standing) ?? options.find((o) => o.standing && o.mayLead)
}

/**
 * #68: 15 warband skills across 10 warbands re-roll or avoid a failed Rout test, and none of them
 * showed up anywhere on the rout screen despite being on the hero's own roster data. This is a
 * reminder list, not automation — same house style as the Frenzy/Hatred combat-trait badges: the
 * exact conditions (once per game, "only if not stunned or knocked down", a specific hero only)
 * are folded into the note text for the table to apply themselves, since the sheet doesn't track
 * per-turn state precisely enough to enforce them.
 */
const ROUT_SKILLS: { skillId: string; skillName: string; note: string }[] = [
  { skillId: "sisters_of_sigmar_skills_utter_determination", skillName: "Utter Determination", note: "may re-roll a failed Rout test" },
  { skillId: "protectorate_of_sigmar_special_skills_utter_determination", skillName: "Utter Determination", note: "may re-roll a failed Rout test" },
  { skillId: "beastmen_raiders_special_skills_bellowing_roar", skillName: "Bellowing Roar", note: "may re-roll the first failed Rout test" },
  { skillId: "maneaters_skills_bellowing_roar", skillName: "Bellowing Roar", note: "may re-roll the first failed Rout test" },
  { skillId: "ogre_hunting_party_skills_bellowing_roar", skillName: "Bellowing Roar", note: "may re-roll the first failed Rout test" },
  { skillId: "orc_mob_skills_da_cunnin_plan", skillName: "Da Cunnin' Plan", note: "the warband may re-roll a failed Rout test while the Boss is not out of action" },
  { skillId: "black_orcs_skills_da_cunnin_plan", skillName: "Da Cunnin' Plan", note: "the warband may re-roll a failed Rout test while the Boss is not out of action" },
  { skillId: "ostlander_mercenaries_skills_blood_oath", skillName: "Blood Oath", note: "may re-roll a failed Rout test, once per game" },
  { skillId: "bretonnian_knights_virtues_virtue_of_discipline", skillName: "Virtue of Discipline", note: "may re-roll a failed Rout test once per game, if not out of action, stunned or knocked down" },
  { skillId: "black_dwarfs_skills_tyrant", skillName: "Tyrant", note: "may re-roll a failed Rout test if not knocked down or stunned — the new result stands even if worse" },
  { skillId: "bretonnian_chapel_guard_skills_questing_vow", skillName: "Questing Vow", note: "may re-roll a Rout test once, if charging, charged, or fighting a fear-causing enemy" },
  { skillId: "marauders_of_chaos_skills_heart_of_the_warrior", skillName: "Heart of the Warrior", note: "may re-roll a failed Rout test" },
  { skillId: "dreamwalkers_cult_of_morr_skills_fanatical", skillName: "Fanatical", note: "may re-roll a failed Rout test once per game, if not out of action, stunned or knocked down" },
  { skillId: "dwarf_slayer_cult_skills_songster", skillName: "Songster", note: "gives any friendly model within 6\" +1 Leadership and a re-roll on a failed Rout test, to a max of 10" },
];

export interface RoutSkillReminder {
  warriorId: string;
  warriorName: string;
  skillName: string;
  note: string;
}

/** Standing heroes (or hired swords/personae, in case a future data source grants them one) whose
 * skills affect a Rout test. Out-of-action warriors are excluded — a fallen hero's skill can't help. */
export function routSkillReminders(roster: RosterWarband, sheet: BattleLiveState): RoutSkillReminder[] {
  const out: RoutSkillReminder[] = [];
  const warriors: { id: string; name: string; skillIds: string[] }[] = [
    ...roster.heroes,
    ...roster.hiredSwords,
  ];
  for (const warrior of warriors) {
    if (isHeroOut(sheet, warrior.id)) continue;
    for (const entry of ROUT_SKILLS) {
      if (warrior.skillIds.includes(entry.skillId)) {
        out.push({ warriorId: warrior.id, warriorName: warrior.name, skillName: entry.skillName, note: entry.note });
      }
    }
  }
  return out;
}

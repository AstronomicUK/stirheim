// Pure helpers for the rout check: whose Leadership may be used and which the rules point at.

import type { BattleLiveState } from '../../../domain/battle'
import { leaderTemplate } from '../../../rules/resolve/roster'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterHero, RosterHiredSword, RosterWarband } from '../../../rules/types/roster'
import { unitRules } from '../../../rules/data/campaignRules'
import { isHeroOut, splitWarriors } from './sheet'

export interface LdOption {
  id: string
  label: string
  ld: number
  standing: boolean
  leader: boolean
  /** False for warriors the rules say may never lead (Flagellants, Ruffians...). */
  mayLead: boolean
}

/** Who may give their Leadership: the leader if standing, otherwise any standing hero or hired sword. */
export function leadershipOptions(roster: RosterWarband, template: WarbandTemplate | undefined, sheet: BattleLiveState, leaderLd: { bonus: number; sources: string[] } = { bonus: 0, sources: [] }): LdOption[] {
  const leaderUnit = template ? leaderTemplate(template) : undefined
  const fighting = splitWarriors(roster, sheet).fighting
  const options = fighting.map(({ warrior }): LdOption => {
    const w = warrior as RosterHero | RosterHiredSword
    const isHero = 'unitTemplateId' in w
    const leader = isHero && leaderUnit !== undefined && w.unitTemplateId === leaderUnit.id
    // "You may not use the Leadership of any of the Hired Swords for Rout tests" — only a hero may ever lead.
    const mayLead = isHero && !unitRules(w.unitTemplateId).neverLeads
    const ld = leader && leaderLd.bonus ? w.stats.Ld + leaderLd.bonus : w.stats.Ld
    const label = leader && leaderLd.bonus ? `${w.name} (Ld ${w.stats.Ld} +${leaderLd.bonus} ${leaderLd.sources.join(', ')})` : `${w.name} (Ld ${w.stats.Ld})`
    return { id: w.id, label, ld, standing: !isHeroOut(sheet, w.id), leader, mayLead }
  })
  // Leader first, then standing warriors by Leadership, then the fallen (still selectable: the rules
  // for stunned or knocked-down leaders are the table's call).
  return options.sort((a, b) => Number(b.leader) - Number(a.leader) || Number(b.standing) - Number(a.standing) || b.ld - a.ld)
}

/** The Leadership the rules point at: the leader while standing, else the highest standing warrior. */
export function suggestedLeadership(options: LdOption[]): LdOption | undefined {
  return options.find((o) => o.leader && o.standing) ?? options.find((o) => o.standing && o.mayLead) ?? options.find((o) => o.standing) ?? options[0]
}

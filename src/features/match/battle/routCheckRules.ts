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
export function leadershipOptions(roster: RosterWarband, template: WarbandTemplate | undefined, sheet: BattleLiveState): LdOption[] {
  const leaderUnit = template ? leaderTemplate(template) : undefined
  const fighting = splitWarriors(roster).fighting
  const options = fighting.map(({ warrior }): LdOption => {
    const w = warrior as RosterHero | RosterHiredSword
    const leader = 'unitTemplateId' in w && leaderUnit !== undefined && w.unitTemplateId === leaderUnit.id
    const mayLead = !('unitTemplateId' in w) || !unitRules(w.unitTemplateId).neverLeads
    return { id: w.id, label: `${w.name} (Ld ${w.stats.Ld})`, ld: w.stats.Ld, standing: !isHeroOut(sheet, w.id), leader, mayLead }
  })
  // Leader first, then standing warriors by Leadership, then the fallen (still selectable: the rules
  // for stunned or knocked-down leaders are the table's call).
  return options.sort((a, b) => Number(b.leader) - Number(a.leader) || Number(b.standing) - Number(a.standing) || b.ld - a.ld)
}

/** The Leadership the rules point at: the leader while standing, else the highest standing warrior. */
export function suggestedLeadership(options: LdOption[]): LdOption | undefined {
  return options.find((o) => o.leader && o.standing) ?? options.find((o) => o.standing && o.mayLead) ?? options.find((o) => o.standing) ?? options[0]
}

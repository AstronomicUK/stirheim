// Which pre-battle rolls a warband owes: Tarot Cards for any holder, plus the rolls its list names.

import { warbandRules, type PreBattleRule } from '../../../rules/data/campaignRules'
import { leaderTemplate } from '../../../rules/resolve/roster'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterHero, RosterWarband } from '../../../rules/types/roster'

export interface Prompt {
  key: string
  title: string
  text: string
  /** Who rolls, when a hero is involved. */
  hero: RosterHero | null
  test: PreBattleRule['test']
  /** Target for a characteristic test. */
  target: number | null
  outcomes?: Record<string, string>
}

export function prompts(roster: RosterWarband, template: WarbandTemplate | undefined): Prompt[] {
  const out: Prompt[] = []
  for (const hero of roster.heroes) {
    if (hero.status !== 'active') continue
    if (hero.equipment.some((i) => i.itemId === 'tarot_cards')) {
      out.push({
        key: `tarot:${hero.id}`,
        title: `Tarot Cards · ${hero.name}`,
        text: 'Consult the cards: a Leadership test. Passed, one exploration die may be moved by one after the battle. Failed by three or more, the reading turns bad (see the item).',
        hero,
        test: 'Ld',
        target: hero.stats.Ld,
      })
    }
  }
  const leader = template ? leaderTemplate(template) : undefined
  const leaderHero = leader ? roster.heroes.find((h) => h.status === 'active' && h.unitTemplateId === leader.id) : undefined
  for (const rule of warbandRules(roster.warbandTemplateId).preBattle ?? []) {
    const hero = rule.unitId === 'leader' ? leaderHero ?? null : rule.unitId ? roster.heroes.find((h) => h.status === 'active' && h.unitTemplateId === rule.unitId) ?? null : null
    if (rule.unitId && !hero) continue
    const target = rule.test === 'Ld' && hero ? hero.stats.Ld : rule.test === 'T' && hero ? hero.stats.T : null
    out.push({ key: `${rule.key}:${hero?.id ?? 'warband'}`, title: hero ? `${rule.label} · ${hero.name}` : rule.label, text: rule.text, hero, test: rule.test, target, outcomes: rule.outcomes })
  }
  return out
}


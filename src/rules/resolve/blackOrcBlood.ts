import type { RosterWarband } from '../types/roster'
import { RulesError } from './errors'

export const BLACK_ORC_BLOOD_COST = 10
export function blackOrcBloodBlock(roster: RosterWarband, heroId: string): string | null {
  if (roster.warbandTemplateId !== 'black_orcs') return 'Black Orc Blood is an upgrade for a Black Orc warband.'
  const hero = roster.heroes.find(h => h.id === heroId)
  if (!hero || hero.unitTemplateId !== 'black_orcs_youngun' || hero.status !== 'active') return 'Choose an active Young’un.'
  if (hero.flags.blackOrcBlood || hero.skillIds.includes('black_orcs_skills_proven_warrior')) return 'This Young’un already has Black Orc Blood or has become a Proven Warrior.'
  if (roster.heroes.some(h => ['active', 'captured'].includes(h.status) && (h.flags.blackOrcBlood || h.skillIds.includes('black_orcs_skills_proven_warrior')))) return 'Only one Young’un in the warband may have the Black Orc Blood upgrade.'
  if (roster.gold < BLACK_ORC_BLOOD_COST) return 'Black Orc Blood costs 10 gc.'
  return null
}

export function purchaseBlackOrcBlood(roster: RosterWarband, heroId: string): { roster: RosterWarband; reason: string } {
  const block = blackOrcBloodBlock(roster, heroId)
  if (block) throw new RulesError('black_orc_blood.unavailable', block)
  const hero = roster.heroes.find(h => h.id === heroId)!
  return {
    roster: { ...roster, gold: roster.gold - BLACK_ORC_BLOOD_COST, heroes: roster.heroes.map(h => h.id === heroId ? { ...h, flags: { ...h.flags, blackOrcBlood: true } } : h) },
    reason: `${hero.name}: bought Black Orc Blood for 10 gc. May choose Proven Warrior after reaching 25 Experience; no characteristics, armour or advance granted by this purchase.`,
  }
}

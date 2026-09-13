import type { RosterWarband } from '../types/roster'
import { findWarbandTemplate } from '../data/warbandTemplates'
import { recruitHenchmen } from './recruitment'
import { RulesError } from './errors'

/** Cursed Cavalcade, grade-1c.md:1068–1082. Actual casualties and existing Thralls,
 * not weapon ownership, establish eligibility. Capture count includes every model. */
export interface CavalcadeCaptureFacts {
  cavalcade: boolean
  attackerIsHero: boolean
  targetIsEnemyHumanHenchman: boolean
  outOfAction: boolean
  weaponId?: string
  capturedThralls: number
  capturedThisBattle: number
}
export const isMisericordia = (id: string | undefined) => id !== undefined && ['misericordia', 'gromril_misericordia', 'ithilmar_misericordia'].includes(id)
function counts(thralls: number, captives: number) {
  if (![thralls, captives].every(n => Number.isInteger(n) && n >= 0)) throw new RulesError('cavalcade.count', 'Check the saved Thrall and battle capture counts.')
}
export function cavalcadeCaptureLimit(capturedThralls: number, capturedThisBattle: number): string | null {
  counts(capturedThralls, capturedThisBattle)
  if (capturedThralls >= 5) return 'This warband already has five Captured Thralls.'
  if (capturedThisBattle >= 2) return 'This warband has already captured two models in this battle.'
  return null
}
export function cavalcadeCaptureEligible(facts: CavalcadeCaptureFacts): boolean {
  return facts.cavalcade && facts.attackerIsHero && facts.targetIsEnemyHumanHenchman && facts.outOfAction && isMisericordia(facts.weaponId)
    && cavalcadeCaptureLimit(facts.capturedThralls, facts.capturedThisBattle) === null
}
function d6(value: number) {
  if (!Number.isInteger(value) || value < 1 || value > 6) throw new RulesError('cavalcade.die', 'Enter a D6 result from 1 to 6.')
}
export function resolveCavalcadeCapture(facts: CavalcadeCaptureFacts, roll: number, originalRoll?: number | null) {
  if (!cavalcadeCaptureEligible(facts)) throw new RulesError('cavalcade.ineligible', cavalcadeCaptureLimit(facts.capturedThralls, facts.capturedThisBattle) ?? 'Capture! requires a Cavalcade Hero to take an enemy human henchman out of action with a Misericordia.')
  d6(roll); if (originalRoll != null) d6(originalRoll)
  const captured = roll >= 5
  const dice = originalRoll == null ? `tabletop D6 ${roll}` : `app rolled ${originalRoll}${originalRoll !== roll ? `; player changed it to ${roll}` : ''}`
  return { captured, roll, originalRoll: originalRoll ?? null, text: `Capture!: ${dice}. ${captured ? 'Captured; resolve the Throne of Worms after the battle.' : 'Not captured; resolve the normal henchman survival roll after the battle.'}` }
}

/** Shared by Hero and henchman outcomes. The caller removes the victim using its own
 * saved report/case identity; this changes only the captor and never awards ordinary kill XP. */
export function cavalcadeThroneReward(captor: RosterWarband, captive: { name: string }, choice: { d6: number; groupId: string; heroId: string }) {
  const template = findWarbandTemplate(captor.warbandTemplateId)
  if (template?.id !== 'the_cursed_cavalcade') throw new RulesError('cavalcade.throne', 'Only the Cursed Cavalcade has the Throne of Worms.')
  d6(choice.d6)
  let next = captor, message: string
  if (choice.d6 >= 3 && choice.d6 <= 5) {
    next = recruitHenchmen(captor, template, 'cursed_cavalcade_captured_thrall', captive.name, 1, choice.groupId, { costOverride: 0, captiveReward: 'throne' }).value.warband
    message = `${captive.name} became a Captured Thrall; removed from the original warband.`
  } else if (choice.d6 === 6) {
    const hero = captor.heroes.find(h => h.id === choice.heroId && h.status === 'active')
    if (!hero) throw new RulesError('capture.randomHero', 'Randomly select a surviving hero for the +1 XP.')
    next = { ...captor, heroes: captor.heroes.map(h => h.id === hero.id ? { ...h, xp: h.xp + 1 } : h) }
    message = `${captive.name} sacrificed to the Throne; randomly selected ${hero.name} gains +1 XP.`
  } else message = `${captive.name} swallowed by the Throne of Worms.`
  return { captor: next, message }
}

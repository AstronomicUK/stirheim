import type { RosterWarband } from '../types/roster'
import { xpThresholds } from '../data/campaign/experience'
import { unitRules } from '../data/campaignRules'
import { hiredSwordGainsExperience } from './hiredSwordRules'

/** Only newly crossed boxes: existing XP and already-earned advances are untouched. */
export function eventAdvances(before: RosterWarband, after: RosterWarband) {
  return [...after.heroes, ...after.hiredSwords].flatMap(warrior => {
    const old = [...before.heroes, ...before.hiredSwords].find(h => h.id === warrior.id)
    if (!old || warrior.status !== 'active' || warrior.flags.hireCompanion) return []
    const hired = 'hiredSwordId' in warrior
    if (hired && !hiredSwordGainsExperience(warrior.hiredSwordId)) return []
    const thresholds = xpThresholds(hired ? 'henchman' : 'hero', hired ? 'normal' : unitRules(warrior.unitTemplateId).advanceRate)
    return thresholds.filter(xp => xp > old.xp && xp <= warrior.xp).map(threshold_xp => ({ warband_id: after.id, subject_type: 'hero', subject_id: warrior.id, threshold_xp }))
  })
}

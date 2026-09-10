import { RulesError } from './errors'
import type { RosterWarband } from '../types/roster'

export const GUARDIAN_RULES = 'Stays within 1 inch of the Merchant, cannot fulfil objectives, search or loot, and earns no experience or upkeep. Intercepts shooting and charges against the Merchant while not already engaged; charges only with the Merchant.'
export const MERCHANT_GUARDIANS = ['arabian_merchant', 'cathayan_merchant'] as const
export function hasGuardianSkill(merchant: RosterWarband['hiredSwords'][number]) {
  return (MERCHANT_GUARDIANS as readonly string[]).includes(merchant.hiredSwordId) && merchant.skillIds.includes(`hired_${merchant.hiredSwordId}_skills_guardian`)
}
/** Called when Guardian is first learned. A dead guardian is not a free replacement. */
export function grantMerchantGuardian(roster: RosterWarband, merchantId: string, companionId: string): RosterWarband {
  const merchant = roster.hiredSwords.find(h => h.id === merchantId && h.status === 'active' && !h.flags.hireCompanion)
  if (!merchant || !hasGuardianSkill(merchant)) throw new RulesError('recruitment.guardian', 'A living Merchant must earn Guardian before receiving the bodyguard.')
  const groupId = merchant.flags.hireGroupId ?? merchant.id
  if (roster.hiredSwords.some(h => h.flags.merchantGuardian && h.flags.hireGroupId === groupId)) return roster
  if (roster.hiredSwords.some(h => h.id === companionId) || roster.heroes.some(h => h.id === companionId)) throw new RulesError('recruitment.guardianId', 'The bodyguard needs a new warrior record.')
  return { ...roster, hiredSwords: [...roster.hiredSwords.map(h => h.id === merchantId ? { ...h, flags: { ...h.flags, hireGroupId: groupId } } : h), {
    ...merchant, id: companionId, name: `${merchant.name}’s bodyguard`, stats: { M: 4, WS: 4, BS: 2, S: 4, T: 3, W: 1, I: 3, A: 1, Ld: 8 }, xp: 0, levelUps: 0, skillIds: [], spellIds: [], injuries: [],
    flags: { hireGroupId: groupId, hireCompanion: true, merchantGuardian: true },
    equipment: ['sword', 'light_armour', 'shield', 'helmet'].map((itemId, i) => ({ itemId, quantity: 1, ...(i === 0 ? { notes: `Guardian: ${GUARDIAN_RULES}` } : {}) })),
  }] }
}

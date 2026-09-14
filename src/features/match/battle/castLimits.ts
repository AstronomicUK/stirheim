import type { CastRecord } from '../../../domain/battle'

export function castLimitReason(casts: readonly CastRecord[], aptitude: boolean, inMelee: boolean): string | null {
  if (!casts.length) return null
  if (!aptitude) return 'This warrior has already attempted a spell this turn.'
  if (casts.length >= 2) return 'Magical Aptitude permits at most two spell attempts per turn.'
  if (inMelee) return 'Magical Aptitude cannot be used in hand-to-hand combat.'
  switch(casts[0].aptitude) {
    case 'passed': return null
    case 'pending': return 'Resolve the saved Toughness test before attempting a second spell.'
    case 'injuryPending': return 'Resolve the saved injury roll; the Toughness test failed.'
    case 'knockedDown': case 'stunned': return 'The Toughness test failed. A second spell is not permitted.'
    case 'declined': return 'The second spell attempt was declined.'
    default: return 'No successful Magical Aptitude Toughness test is recorded for this turn.'
  }
}

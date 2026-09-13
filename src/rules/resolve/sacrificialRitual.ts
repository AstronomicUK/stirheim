import { RulesError } from './errors'

export interface RitualCaptive {
  id: string
  engineId: string
  name: string
  state: string
  victimWarbandId: string | null
  large: boolean
}

/** Preview only. Server consent and custody locks must precede any actual removal. */
export function planSacrificialRitual(input: {
  engineId: string
  holderWarbandId: string
  casterName: string
  contactConfirmed: boolean
  mortalCaptivesConfirmed: boolean
  primaryId: string
  extraIds: readonly string[]
  captives: readonly RitualCaptive[]
}) {
  if (!input.contactConfirmed) throw new RulesError('ritual.contact', 'Confirm that the Sorcerer is in contact with this Engine.')
  if (!input.mortalCaptivesConfirmed) throw new RulesError('ritual.mortal', 'Confirm that the chosen captives are eligible mortals for this ritual.')
  const ids = [input.primaryId, ...input.extraIds]
  if (new Set(ids).size !== ids.length) throw new RulesError('ritual.duplicate', 'A captive can only be selected once.')
  const selected = ids.map(id => {
    const captive = input.captives.find(c => c.id === id)
    if (!captive || captive.engineId !== input.engineId || captive.state !== 'held') {
      throw new RulesError('ritual.custody', 'Choose captives still held in this Engine. Refresh if their custody has changed.')
    }
    return captive
  })
  if (selected.reduce((places, captive) => places + (captive.large ? 2 : 1), 0) > 6) {
    throw new RulesError('ritual.capacity', 'These captives exceed the Engine’s six places. Check its custody records.')
  }
  const affectedWarbands = [...new Set(selected.flatMap(c => c.victimWarbandId ? [c.victimWarbandId] : []))]
  return {
    primary: selected[0],
    additional: selected.slice(1),
    difficultyReduction: input.extraIds.length,
    requiredWarbandAgreements: [...new Set([input.holderWarbandId, ...affectedWarbands])],
    summary: `${input.casterName}: Sacrificial Ritual using ${selected.map(c => c.name).join(', ')}.${input.extraIds.length ? ` ${input.extraIds.length} additional captive${input.extraIds.length === 1 ? '' : 's'} reduce the Difficulty by ${input.extraIds.length}; those sacrifices happen before rolling.` : ''} Confiscated equipment stays with the captors.`,
  }
}

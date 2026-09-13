import type { ExplorationDraft } from './state'

/** Engine of Chaos, equipment scrape 2288: these finds become prisoners, not the ordinary faction reward. */
export function engineExplorationCaptives(locationId: string | undefined, warbandTemplateId: string, available: boolean | undefined, draft: ExplorationDraft, maximumFinds = false) {
  if (warbandTemplateId !== 'black_dwarfs' || !available || !['straggler', 'prisoners'].includes(locationId ?? '')) return undefined
  const usesD3 = locationId === 'prisoners'
  const valid = (value: unknown): value is number => Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 3
  const count = !usesD3 ? 1 : maximumFinds ? 3 : valid(draft.enginePrisonerRoll) ? draft.enginePrisonerRoll : null
  const original = usesD3 && !maximumFinds && valid(draft.enginePrisonerOriginalRoll) ? draft.enginePrisonerOriginalRoll : null
  const note = !usesD3 ? 'Straggler: one captive found for the Engine of Chaos.' : count === null ? 'Prisoners: roll D3 for the number of captives found.' : `Prisoners: ${count} captives found for the Engine of Chaos. ${maximumFinds ? 'Maximum find: 3 captives.' : original === null ? `Tabletop D3 result ${count}.` : `App rolled ${original}${original !== count ? `; player changed it to ${count}` : ''}.`}`
  return { count, original, usesD3, maximumFinds, note }
}

import { withRollAttempt, type BattleLiveState } from '../../../domain/battle'

export function savedFightSituations(state: BattleLiveState, warriorId: string, key: string, phaseKey: string): Record<string, boolean> {
  const saved = state.fightSituations[key]
  return { ...(saved?.phaseKey === phaseKey ? saved.values : {}), frenzyEnded: Boolean(state.frenzyEnded[warriorId]) }
}

export function setFightSituation(state: BattleLiveState, warriorId: string, name: string, key: string, phaseKey: string, field: string, checked: boolean, reason: string): BattleLiveState {
  const current = savedFightSituations(state, warriorId, key, phaseKey)
  if (current[field] === checked) return state
  const psychology = field === 'frenzyEnded' || field === 'failedFearWhenCharged'
  if (psychology && current[field] && !checked && !reason.trim()) return state
  const saved = state.fightSituations[key]
  const next = field === 'frenzyEnded'
    ? { ...state, frenzyEnded: { ...state.frenzyEnded, [warriorId]: checked } }
    : { ...state, fightSituations: { ...state.fightSituations, [key]: { phaseKey, values: { ...(saved?.phaseKey === phaseKey ? saved.values : {}), [field]: checked } } } }
  if (!psychology) return next
  return withRollAttempt(next, {
    id: crypto.randomUUID(), at: new Date().toISOString(), turn: state.turn, kind: 'attack', status: 'complete',
    label: `${name}: ${field === 'frenzyEnded' ? 'Frenzy' : 'Fear'} ${checked ? 'recorded' : 'corrected'}`,
    rolls: [checked ? field === 'frenzyEnded' ? 'Frenzy has ended for this battle: the player confirmed this warrior was knocked down or stunned.' : 'Failed Fear when charged by the selected opponent in this combat phase; eligible melee attacks need 6s to hit.' : `Earlier condition cleared: ${reason.trim()}. Earlier attacks are unchanged; correct affected results separately.`],
  })
}

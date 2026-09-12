// The one line a spell tooltip shows for its Difficulty (#209): what this caster actually needs,
// the printed base when a learned reduction has lowered it, and any casting-roll bonus kept as
// its own clause — a bonus to the dice is not a lower Difficulty, and must not read as one.

import type { effectiveDifficulty } from '../../../rules/resolve/casting'

export type DifficultyDisplay = ReturnType<typeof effectiveDifficulty>

export function describeDifficulty(d: DifficultyDisplay): string {
  if (d.effective === null) return 'Cast automatically'
  const base = d.base !== null && d.base !== d.effective ? ` (Base difficulty ${d.base})` : ''
  const bonus = d.bonus ? ` · +${d.bonus} to the casting roll (${d.modifiers.map((m) => m.name).join(', ')})` : ''
  return `Difficulty: ${d.effective}${base}${bonus}`
}

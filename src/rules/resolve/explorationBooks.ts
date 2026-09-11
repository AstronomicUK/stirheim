import type { RosterWarband } from '../types/roster'

export const EXPLORATION_BOOKS = {
  alchemists_notebook: { name: 'Alchemist’s Notebook', table: 'academic', flag: 'studiedAlchemistNotebook', benefit: 'May choose Academic skills on future skill advances.' },
  training_manual: { name: 'Training Manual', table: 'combat', flag: 'studiedTrainingManual', benefit: 'May choose Combat skills on future skill advances; maximum Weapon Skill increases by 1.' },
} as const
export type ExplorationBookId = keyof typeof EXPLORATION_BOOKS
export function availableExplorationBooks(roster: RosterWarband): ExplorationBookId[] {
  const items = [...roster.stash, ...roster.heroes.filter(h => h.status === 'active').flatMap(h => h.equipment)]
  return (Object.keys(EXPLORATION_BOOKS) as ExplorationBookId[]).filter(id => items.some(i => i.itemId === id && i.quantity > 0))
}

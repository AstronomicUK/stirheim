import { withRollAttempt, type BattleLiveState } from './battle'

export type GuidingDreamKind = 'movement' | 'hit' | 'strength' | 'frenzy'
export function guidingDreamKind(sheet: BattleLiveState, warriorId: string): GuidingDreamKind | undefined {
  const result = sheet.preBattle[`guiding_dream:${warriorId}`] ?? ''
  if (result.startsWith('Disturbing Vision:')) return 'movement'
  if (result.startsWith('Vision of Truth:')) return 'hit'
  if (result.startsWith('Empowering Vision:')) return 'strength'
  if (result.startsWith('Infuriating Vision:')) return 'frenzy'
}

export function setGuidingDreamTarget(sheet: BattleLiveState, warriorId: string, name: string, target: { id: string; warbandId: string; name: string }, reason = '', turn = sheet.turn): BattleLiveState {
  const kind = guidingDreamKind(sheet, warriorId)
  if (!kind || kind === 'movement') throw new Error('This vision does not require an enemy Hero.')
  const previous = sheet.guidingDreamTargets[warriorId]
  if (previous?.id === target.id && previous.warbandId === target.warbandId) return sheet
  if (previous && !reason.trim()) throw new Error('Explain why the designated Hero is changing.')
  return withRollAttempt({ ...sheet, guidingDreamTargets: { ...sheet.guidingDreamTargets, [warriorId]: target } }, {
    id: crypto.randomUUID(), at: new Date().toISOString(), turn, kind: 'attack', status: 'complete', label: `${name}: Guiding Dream target`,
    rolls: [previous ? `Changed the Hero in the vision from ${previous.name} to ${target.name}: ${reason.trim()}.` : `Designated ${target.name} as the enemy Hero in the vision.`, 'The vision applies only when fighting this Hero.'],
  })
}

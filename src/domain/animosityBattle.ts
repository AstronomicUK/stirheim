import { withRollAttempt, type BattleLiveState } from './battle'
import { animosityTestSchema, confirmAnimosityDie, ANIMOSITY_OUTCOME_TEXT, type AnimosityTest } from './animosity'
export function currentAnimosity(sheet: BattleLiveState, warriorId: string, modelIndex: number, turnKey: string): AnimosityTest | undefined {
  return sheet.animosityTests.find(t => t.warriorId === warriorId && t.modelIndex === modelIndex && t.turnKey === turnKey && !t.correction)
}
function save(sheet: BattleLiveState, test: AnimosityTest, line: string): BattleLiveState {
  const historyId = `animosity:${test.id}`
  const history = sheet.rollAttempts.find(r => r.id === historyId)?.rolls ?? []
  return withRollAttempt({ ...sheet, animosityTests: sheet.animosityTests.map(t => t.id === test.id ? test : t) }, { id: historyId, at: test.at, turn: sheet.turn, kind: 'attack', status: test.stage === 'done' || test.correction ? 'complete' : 'incomplete', label: `${test.name}: Animosity`, rolls: [...history, line] })
}
export function beginAnimosity(sheet: BattleLiveState, input: Pick<AnimosityTest, 'id' | 'warriorId' | 'modelIndex' | 'name' | 'turnKey' | 'at'>): BattleLiveState {
  if (sheet.animosityTests.some(t => t.id === input.id) || currentAnimosity(sheet, input.warriorId, input.modelIndex, input.turnKey)) return sheet
  const test = animosityTestSchema.parse({ ...input, stage: 'trigger' })
  return save({ ...sheet, animosityTests: [...sheet.animosityTests, test] }, test, 'Start of own turn: roll one D6. Only a 1 triggers the Animosity result table.')
}
export function saveAnimosityRoll(sheet: BattleLiveState, id: string, die: number, stage: AnimosityTest['stage']): BattleLiveState {
  const test = sheet.animosityTests.find(t => t.id === id && !t.correction)
  if (!test || test.stage !== stage || stage === 'done' || test.original !== undefined) return sheet
  if (!Number.isInteger(die) || die < 1 || die > 6) throw new Error('Animosity needs one D6.')
  return save(sheet, { ...test, original: die }, `App rolled ${die} for the ${stage === 'trigger' ? 'Animosity test' : 'Animosity result'}. Awaiting confirmation.`)
}
export function acceptAnimosityRoll(sheet: BattleLiveState, id: string, die: number, stage: AnimosityTest['stage']): BattleLiveState {
  const test = sheet.animosityTests.find(t => t.id === id && !t.correction)
  if (!test || test.stage !== stage || stage === 'done') return sheet
  const next = confirmAnimosityDie(test, die)
  const provenance = test.original === undefined ? `Table roll ${die}.` : test.original === die ? `App roll ${die} confirmed.` : `Player changed app roll ${test.original} to ${die}.`
  return save(sheet, next, `${provenance} ${next.outcome ? ANIMOSITY_OUTCOME_TEXT[next.outcome] : 'Animosity triggered: roll the result die.'}`)
}
export function exemptAnimosity(sheet: BattleLiveState, id: string, reason: string): BattleLiveState {
  if (!reason.trim()) throw new Error('Record why this model does not need to test.')
  const test = sheet.animosityTests.find(t => t.id === id && !t.correction)
  if (!test || test.stage === 'done') return sheet
  return save(sheet, { ...test, stage: 'done', outcome: 'exempt', exemption: reason.trim() }, `No test: ${reason.trim()}.`)
}
export function correctAnimosity(sheet: BattleLiveState, id: string, reason: string): BattleLiveState {
  if (!reason.trim()) throw new Error('Explain the Animosity correction.')
  const test = sheet.animosityTests.find(t => t.id === id && !t.correction)
  return test ? save(sheet, { ...test, correction: reason.trim() }, `Player correction: ${reason.trim()}. Existing combat results remain in the shared log.`) : sheet
}
export function resolveAnimosityAction(sheet: BattleLiveState, id: string, note: string): BattleLiveState {
  const test = sheet.animosityTests.find(t => t.id === id && !t.correction && (t.outcome === 'fight' || t.outcome === 'rush') && !t.actionResolved)
  return test ? save(sheet, { ...test, actionResolved: true }, `${note} ${test.outcome === 'fight' ? 'No other actions this turn; may still defend in melee.' : 'Continue the turn, observing the required charge if the extra move brought an enemy within reach.'}`) : sheet
}

import { withRollAttempt, type BattleLiveState } from '../../../domain/battle'
import { currentLeader } from '../../../rules/resolve/roster'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterWarband } from '../../../rules/types/roster'
import { recordLeadershipTest } from './relicRules'
import { setRouted } from './sheet'

type RoutTest = BattleLiveState['routTests'][number]
/** Core equipment 02:1532: a Mercenary warband whose leader wears silk may re-roll its first failed Rout test. */
export function canUseRoutSilk(roster: RosterWarband, template: WarbandTemplate | undefined, sheet: BattleLiveState): boolean {
  if (!template || !/mercenar/i.test(template.name)) return false
  const leader = currentLeader(roster.heroes, template)
  if (!leader || leader.status !== 'active' || !leader.equipment.some(item => item.itemId === 'cathayan_silk_clothes' && item.quantity > 0)) return false
  // Prior saved failures count even if a player later unmarks the rout; older sheets preserve them in notes.
  return !sheet.routTests.some(t => !t.correction && t.dice[0] + t.dice[1] > t.leadership)
    && !/Rout check failed|Warband routed at the table/i.test(sheet.notes)
}
function checkDice(dice: readonly number[]) {
  if (dice.length !== 2 || dice.some(die => !Number.isInteger(die) || die < 1 || die > 6)) throw new Error('A Rout test requires two D6.')
}
function save(sheet: BattleLiveState, test: RoutTest, line: string): BattleLiveState {
  const old = sheet.rollAttempts.find(attempt => attempt.id === test.id)
  const next = withRollAttempt({ ...sheet, routTests: sheet.routTests.map(t => t.id === test.id ? test : t) }, {
    id: test.id, at: test.at, turn: test.turn, kind: 'attack', status: test.stage === 'done' ? 'complete' : 'incomplete',
    label: `Rout check: ${test.label}`, rolls: [...(old?.rolls ?? []), line],
  })
  if (test.stage !== 'done') return next
  const note = `Rout check ${test.passed ? 'passed' : 'failed'}: ${test.label}, Leadership ${test.leadership}${test.rerollDice ? ' after Cathayan Silk Clothes reroll' : ''}.`
  const recorded = { ...next, notes: [next.notes.trimEnd(), note].filter(Boolean).join('\n') }
  return test.passed ? recorded : setRouted(recorded, true, 'failed-test')
}
export function resolveRoutDice(sheet: BattleLiveState, input: Pick<RoutTest, 'id'|'warriorId'|'label'|'leadership'|'dice'|'source'>, silk: boolean): BattleLiveState {
  if (sheet.routTests.some(t => t.id === input.id)) return sheet
  if (sheet.routTests.some(t => t.stage !== 'done')) throw new Error('Finish the pending Rout check first.')
  checkDice(input.dice)
  const passed = input.dice[0] + input.dice[1] <= input.leadership
  const test: RoutTest = {...input, silk, at:new Date().toISOString(), turn:sheet.turn, stage:!passed && silk ? 'choice':'done', passed:!passed && silk ? undefined:passed}
  const next = recordLeadershipTest({...sheet,routTests:[...sheet.routTests,test]},input.warriorId,'rout')
  return save(next,test,`${input.source === 'app' ? 'App rolled' : 'Player entered tabletop dice'} ${input.dice.join(' + ')} = ${input.dice[0]+input.dice[1]} against Leadership ${input.leadership}: ${passed?'passed':'failed'}.${test.stage==='choice'?' Cathayan Silk Clothes: first failed test may be rerolled before the warband routs.':''}`)
}
export function chooseSilkReroll(sheet: BattleLiveState, id: string, accept: boolean): BattleLiveState {
  const test = sheet.routTests.find(t => t.id === id && t.stage === 'choice' && t.silk)
  if (!test) return sheet
  return save(sheet,{...test,stage:accept?'reroll':'done',passed:accept?undefined:false},accept?'Player chose the Cathayan Silk Clothes reroll. Both dice must be rerolled; the second result stands.':'Player declined the silk reroll. The warband routs.')
}
export function resolveSilkReroll(sheet: BattleLiveState, id: string, dice: [number,number], source: 'app'|'table'): BattleLiveState {
  const test = sheet.routTests.find(t => t.id === id && t.stage === 'reroll' && t.silk)
  if (!test) return sheet
  checkDice(dice)
  const passed = dice[0]+dice[1] <= test.leadership
  return save(sheet,{...test,stage:'done',passed,rerollDice:dice,rerollSource:source},`Cathayan Silk Clothes reroll: ${source==='app'?'app rolled':'player entered tabletop dice'} ${dice.join(' + ')} = ${dice[0]+dice[1]} against Leadership ${test.leadership}: ${passed?'passed':'failed'}. This result stands; it cannot be rerolled again.`)
}

export function correctPendingRout(sheet: BattleLiveState, id: string, reason: string): BattleLiveState {
  const test = sheet.routTests.find(t => t.id === id && t.stage !== 'done')
  if (!test || !reason.trim()) return sheet
  const history = sheet.rollAttempts.find(attempt => attempt.id === id)
  return withRollAttempt({...sheet,routTests:sheet.routTests.map(t=>t.id===id?{...t,stage:'done',correction:reason.trim()}:t)}, {
    id, at:test.at, turn:test.turn, kind:'attack', status:'complete', label:`Rout check corrected: ${test.label}`,
    rolls:[...(history?.rolls??[]),`Player withdrew this mistaken pending test: ${reason.trim()}. Original dice are preserved; no rout is applied.`],
  })
}

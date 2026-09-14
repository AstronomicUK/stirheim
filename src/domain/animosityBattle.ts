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
export function beginAnimosity(sheet: BattleLiveState, input: Pick<AnimosityTest, 'id' | 'warriorId' | 'modelIndex' | 'name' | 'turnKey' | 'at' | 'conflictingRule' | 'leadershipRerollAvailable'>): BattleLiveState {
  if (sheet.animosityTests.some(t => t.id === input.id) || currentAnimosity(sheet, input.warriorId, input.modelIndex, input.turnKey)) return sheet
  const test = animosityTestSchema.parse({ ...input, stage: 'trigger' })
  return save({ ...sheet, animosityTests: [...sheet.animosityTests, test] }, test, input.conflictingRule ? 'Black Orc source conflict: record the agreed D6 or Leadership test before rolling.' : 'Start of own turn: roll one D6. Only a 1 triggers the Animosity result table.')
}
export function saveAnimosityRoll(sheet: BattleLiveState, id: string, die: number, stage: AnimosityTest['stage']): BattleLiveState {
  const test = sheet.animosityTests.find(t => t.id === id && !t.correction)
  if (!test || test.stage !== stage || !['trigger','effect'].includes(stage) || test.original !== undefined) return sheet
  if (stage==='trigger' && (test.triggerRule==='leadership'||(test.conflictingRule&&!test.triggerRule))) throw new Error('Choose the agreed Animosity test first.')
  if (!Number.isInteger(die) || die < 1 || die > 6) throw new Error('Animosity needs one D6.')
  return save(sheet, { ...test, original: die }, `App rolled ${die} for the ${stage === 'trigger' ? 'Animosity test' : 'Animosity result'}. Awaiting confirmation.`)
}
export function acceptAnimosityRoll(sheet: BattleLiveState, id: string, die: number, stage: AnimosityTest['stage']): BattleLiveState {
  const test = sheet.animosityTests.find(t => t.id === id && !t.correction)
  if (!test || test.stage !== stage || !['trigger','effect'].includes(stage)) return sheet
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

export function chooseAnimosityRule(sheet:BattleLiveState,id:string,rule:'d6'|'leadership',agreement:string,leadership:number):BattleLiveState {
 const test=sheet.animosityTests.find(t=>t.id===id&&!t.correction)
 if(!test||test.stage!=='trigger'||test.original!==undefined||test.originalDice||test.triggerRule)return sheet
 if(!agreement.trim()||!['d6','leadership'].includes(rule)||!Number.isInteger(leadership)||leadership<1||leadership>10)throw Error('Record the agreed rule and Leadership (1–10).')
 return save(sheet,{...test,triggerRule:rule,ruleAgreement:agreement.trim(),leadership},`Agreed ${rule==='d6'?'D6 trigger on 1':`2D6 Leadership ${leadership} test`}: ${agreement.trim()}`)
}
export function saveAnimosityLeadership(sheet:BattleLiveState,id:string,dice:[number,number]):BattleLiveState {
 const test=sheet.animosityTests.find(t=>t.id===id&&!t.correction)
 if(!test||test.stage!=='trigger'||test.triggerRule!=='leadership'||test.originalDice)return sheet
 if(dice.some(n=>!Number.isInteger(n)||n<1||n>6))throw Error('Roll two D6.')
 return save(recordAnimosityLeadership(sheet,test),{...test,originalDice:dice},`App rolled Leadership dice ${dice.join(' + ')}; awaiting confirmation.`)
}
export function acceptAnimosityLeadership(sheet:BattleLiveState,id:string,dice:[number,number]):BattleLiveState {
 const test=sheet.animosityTests.find(t=>t.id===id&&!t.correction)
 if(!test||test.stage!=='trigger'||test.triggerRule!=='leadership')return sheet
 if(dice.some(n=>!Number.isInteger(n)||n<1||n>6)||!test.leadership)throw Error('Record two D6 and Leadership.')
 const failed=dice[0]+dice[1]>test.leadership
 const provenance=test.originalDice?`App rolled ${test.originalDice.join(' + ')}${test.originalDice.some((n,i)=>n!==dice[i])?`; player changed to ${dice.join(' + ')}`:'; confirmed'}`:`Table rolled ${dice.join(' + ')}`
 return save(recordAnimosityLeadership(sheet,test),{...test,triggerDice:dice,stage:test.leadershipRerollAvailable&&!test.firstLeadershipDice?'leadershipChoice':failed?'effect':'done',outcome:failed?undefined:'clear'},`${provenance}. Leadership ${test.leadership}: ${failed?'failed; roll the Animosity result die':'passed; acts normally'}.`)
}

function recordAnimosityLeadership(sheet:BattleLiveState,test:AnimosityTest):BattleLiveState {
 const id=`animosity-leadership:${test.id}`
 return sheet.leadershipTests.some(t=>t.id===id)?sheet:{...sheet,leadershipTests:[...sheet.leadershipTests,{id,warriorId:test.warriorId,kind:'animosity',relic:false,at:test.at,turnKey:test.turnKey}]}
}

export function chooseAnimosityLeadershipReroll(sheet:BattleLiveState,id:string,accept:boolean):BattleLiveState {
 const test=sheet.animosityTests.find(t=>t.id===id&&!t.correction&&t.stage==='leadershipChoice')
 if(!test||!test.triggerDice||!test.leadership)return sheet
 const failed=test.triggerDice[0]+test.triggerDice[1]>test.leadership
 const next:AnimosityTest=accept?{...test,stage:'trigger',firstLeadershipDice:test.triggerDice,firstLeadershipOriginal:test.originalDice,triggerDice:undefined,originalDice:undefined,outcome:undefined}:{...test,stage:failed?'effect':'done'}
 return save(sheet,next,accept?`Sashimono reroll: first test ${test.triggerDice.join(' + ')}; reroll both dice and keep the second result.`:'Player kept the first Leadership test result.')
}

import {z} from 'zod'
import {withRollAttempt,type BattleLiveState} from './battle'
const dice=z.tuple([z.number().int().min(1).max(6),z.number().int().min(1).max(6)])
export const itemLeadershipTestSchema=z.object({
 id:z.string(),warriorId:z.string(),modelIndex:z.number().int().min(0),name:z.string(),test:z.string(),leadership:z.number().int().min(1).max(10),at:z.string(),turn:z.number(),
 benefit:z.object({key:z.string(),label:z.string(),kind:z.enum(['rerollFailed','rerollAny','immune']),condition:z.string()}).optional(),
 stage:z.enum(['first','choice','second','done']),original:dice.optional(),dice:dice.optional(),secondOriginal:dice.optional(),secondDice:dice.optional(),passed:z.boolean().optional(),correction:z.string().optional(),
})
export type ItemLeadershipTest=z.infer<typeof itemLeadershipTestSchema>
function save(sheet:BattleLiveState,test:ItemLeadershipTest,line:string):BattleLiveState {
 const old=sheet.rollAttempts.find(r=>r.id===test.id)
 return withRollAttempt({...sheet,itemLeadershipTests:sheet.itemLeadershipTests.map(t=>t.id===test.id?test:t)},{id:test.id,at:test.at,turn:test.turn,kind:'attack',status:test.stage==='done'?'complete':'incomplete',label:`${test.name}: ${test.test}`,rolls:[...(old?.rolls??[]),line]})
}
function markRolled(sheet:BattleLiveState,test:ItemLeadershipTest):BattleLiveState {
 return sheet.leadershipTests.some(t=>t.id===test.id)?sheet:{...sheet,leadershipTests:[...sheet.leadershipTests,{id:test.id,warriorId:test.warriorId,kind:'item',relic:false,at:test.at}]}
}
export function beginItemLeadership(sheet:BattleLiveState,input:Omit<ItemLeadershipTest,'stage'|'at'|'turn'>):BattleLiveState {
 if(sheet.itemLeadershipTests.some(t=>t.id===input.id))return sheet
 if(sheet.itemLeadershipTests.some(t=>t.warriorId===input.warriorId&&t.modelIndex===input.modelIndex&&t.stage!=='done'))throw Error('Finish the pending Leadership test first.')
 const test=itemLeadershipTestSchema.parse({...input,at:new Date().toISOString(),turn:sheet.turn,stage:input.benefit?.kind==='immune'?'done':'first',...(input.benefit?.kind==='immune'?{passed:true}:{})})
 return save({...sheet,itemLeadershipTests:[...sheet.itemLeadershipTests,test]},test,`${test.test}: Leadership ${test.leadership}.${test.benefit?` ${test.benefit.label}: ${test.benefit.condition}${test.benefit.kind==='immune'?'; no test is needed.':''}`:''}`)
}
export function rollItemLeadership(sheet:BattleLiveState,id:string,faces:[number,number]):BattleLiveState {
 const test=sheet.itemLeadershipTests.find(t=>t.id===id&&!t.correction)
 if(!test||!['first','second'].includes(test.stage))return sheet
 dice.parse(faces)
 const field=test.stage==='first'?'original':'secondOriginal'
 if(test[field])return sheet
 return save(markRolled(sheet,test),{...test,[field]:faces},`App rolled ${faces.join(' + ')}${test.stage==='second'?' for the reroll':''}; awaiting confirmation.`)
}
export function confirmItemLeadership(sheet:BattleLiveState,id:string,faces:[number,number]):BattleLiveState {
 const test=sheet.itemLeadershipTests.find(t=>t.id===id&&!t.correction)
 if(!test||!['first','second'].includes(test.stage))return sheet
 dice.parse(faces)
 const second=test.stage==='second',original=second?test.secondOriginal:test.original,passed=faces[0]+faces[1]<=test.leadership
 const offered=!second&&test.benefit&&(test.benefit.kind==='rerollAny'||(!passed&&test.benefit.kind==='rerollFailed'))
 const source=original?`App rolled ${original.join(' + ')}${original.some((n,i)=>n!==faces[i])?`; player changed to ${faces.join(' + ')}`:'; confirmed'}`:`Table rolled ${faces.join(' + ')}`
 return save(markRolled(sheet,test),{...test,[second?'secondDice':'dice']:faces,passed,stage:offered?'choice':'done'},`${source}. ${passed?'Passed':'Failed'} against Leadership ${test.leadership}.${offered?' Item reroll available; choose before applying the result.':second?' Second result stands.':''}`)
}
export function chooseItemLeadershipReroll(sheet:BattleLiveState,id:string,accept:boolean):BattleLiveState {
 const test=sheet.itemLeadershipTests.find(t=>t.id===id&&!t.correction&&t.stage==='choice')
 return test?save(sheet,{...test,stage:accept?'second':'done'},accept?`Uses ${test.benefit?.label}; reroll both dice, second result stands.`:`Keeps the first ${test.passed?'passed':'failed'} test result.`):sheet
}
export function correctItemLeadership(sheet:BattleLiveState,id:string,reason:string):BattleLiveState {
 const test=sheet.itemLeadershipTests.find(t=>t.id===id&&!t.correction)
 if(!test||!reason.trim())return sheet
 return save(sheet,{...test,stage:'done',correction:reason.trim()},`Player correction: ${reason.trim()}. Earlier dice remain on the record; correct any resulting actions separately.`)
}

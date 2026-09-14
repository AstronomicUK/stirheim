import {chaosAftermathChoice,eyeOfGodsState,allowedChaosMarks,condemnedAtFate} from '../model/eyeOfGods'
import {Button,DieField,SelectField} from '../../../ui'
import {Card} from '../../roster/view/bits'
import type {StepProps} from './bits'
import type {ReportDraft} from '../model/state'
import type {MarauderTribe} from '../../../rules/types/roster'
export function EyeOfGodsAftermath({draft,ctx,derived,update,mode}:Pick<StepProps,'draft'|'ctx'|'derived'|'update'>&{mode:'eye'|'fate'}){
 const state=eyeOfGodsState(draft,ctx),choice=chaosAftermathChoice(draft,ctx)
 if(!state.relevant)return null
 const condemned=condemnedAtFate(ctx,new Map(derived.xp.lines.map(l=>[l.subjectId,l.xpAfter])))
 const change=(patch:Partial<NonNullable<ReportDraft['chaosAftermath']>>)=>update(d=>({...d,chaosAftermath:{...d.chaosAftermath,...patch}}))
 const prepare=(id:string)=>change({spawnIds:{...choice.spawnIds,[id]:choice.spawnIds?.[id]??crypto.randomUUID()}})
 return <>
 {mode==='eye'&&state.due?<Card className="flex flex-col gap-3 p-4"><h3 className="font-semibold">Eye of the Gods — {state.leader!.name}</h3>
 <p className="text-sm">Resolve the leader’s reward or transformation after the battle. A Seer’s starting Mark does not waive this test; a Mark awarded through Eye of the Gods does.</p>
 {!ctx.roster.marauderTribe?<SelectField label="Marauder tribe for this report" value={choice.tribe??''} onChange={e=>change({tribe:e.target.value as MarauderTribe})}><option value="">Choose the tribe</option><option value="norse">Norse</option><option value="kurgan">Kurgan</option><option value="hung">Hung</option></SelectField>:null}
 <p className="text-sm">{state.threshold}+ after adding {state.modifier} {draft.result==='won'?'for enemies taken out by the leader':draft.result==='lost'?'for your Heroes taken out':'for a drawn battle (no reward or transformation)'}.</p>
 <div className="grid grid-cols-2 gap-3">{([0,1] as const).map(i=><DieField key={i} label={`Eye of the Gods die ${i+1}`} sides={6} value={choice.dice?.[i]??null} onChange={v=>{const dice:[number|null,number|null]=[...(choice.dice??[null,null])];dice[i]=v;change({dice})}}/>)}</div>
 <Button variant="secondary" disabled={!!choice.originalDice} onClick={()=>{const dice:[number,number]=[1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6)];change({dice,originalDice:dice})}}>Roll Eye of the Gods</Button>
 {choice.originalDice?<p className="text-xs">App rolled {choice.originalDice.join(' + ')}. Edited dice are recorded in the report.</p>:null}
 {state.total!==null?<p>Total {state.total}: {state.outcome==='mark'?'a Mark may be chosen':state.outcome==='spawn'?'the leader becomes a Spawn':'no change'}.</p>:null}
 {state.outcome==='mark'?<><SelectField label="Mark of Chaos reward" value={choice.mark??''} onChange={e=>change({mark:e.target.value})}><option value="">Choose the reward</option>{allowedChaosMarks(ctx,state.leader!).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}<option value="decline">Decline this Mark</option></SelectField><p className="text-xs">A Seer keeps the patron already chosen. Different patron Marks cannot coexist; Undivided is the exception.</p>
 {choice.mark==='eagle'?<><DieField label="Random Tchar spell D6" sides={6} value={choice.spellDie??null} onChange={spellDie=>change({spellDie})}/><Button variant="secondary" disabled={!!choice.originalSpellDie} onClick={()=>{const die=1+Math.floor(Math.random()*6);change({spellDie:die,originalSpellDie:die})}}>Roll Tchar spell</Button></>:null}</>:null}
 {state.outcome==='spawn'?<><p className="text-sm">All of the former leader’s experience, skills, injuries and equipment are lost. If a Spawn already survives in the warband, the leader leaves instead.</p><Button variant="secondary" disabled={!!choice.spawnIds?.[state.leader!.id]} onClick={()=>prepare(state.leader!.id)}>{choice.spawnIds?.[state.leader!.id]?'Transformation prepared':'Prepare leader transformation'}</Button></>:null}
 </Card>:null}
 {mode==='fate'&&condemned.map(hero=><Card key={hero.id} className="flex flex-col gap-3 p-4"><h3 className="font-semibold">{hero.name} — Fate at 90 Experience</h3><p className="text-sm">After resolving any advances, confirm whether WS, Strength, Toughness and Attacks have all been permanently fixed through the Condemned’s special advancement rule. Ordinary displayed numbers are not proof: older rosters used placeholder values.</p><SelectField label={`${hero.name}: variable attributes`} value={choice.condemnedFixed?.[hero.id]===undefined?'':choice.condemnedFixed[hero.id]?'fixed':'variable'} onChange={e=>change({condemnedFixed:{...choice.condemnedFixed,[hero.id]:e.target.value==='fixed'}})}><option value="" disabled>Confirm the warrior’s advancement history</option><option value="fixed">All four are permanently fixed</option><option value="variable">At least one is still variable</option></SelectField>{choice.condemnedFixed?.[hero.id]===false?<><p className="text-sm">The Condemned becomes a Spawn, or leaves if the warband already has one.</p><Button variant="secondary" disabled={!!choice.spawnIds?.[hero.id]} onClick={()=>prepare(hero.id)}>{choice.spawnIds?.[hero.id]?'Transformation prepared':'Prepare Condemned transformation'}</Button></>:null}</Card>)}
 </>
}

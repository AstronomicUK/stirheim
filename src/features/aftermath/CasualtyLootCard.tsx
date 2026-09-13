import {useState} from 'react'
import {useQuery,useQueryClient} from '@tanstack/react-query'
import {z} from 'zod'
import {supabase} from '../../api/supabase'
import type {WarbandDetail} from '../../api/warbands'
import {findItem} from '../../rules/data/items'
import {Button,DieField,Notice,NumberField,SelectField,TextField} from '../../ui'
import {Card,Section} from '../roster/view/bits'
const kitSchema=z.array(z.object({id:z.string(),item_rules_id:z.string().nullable(),custom_name:z.string().nullable(),quantity:z.number()}))
function useLoot(warband:string){return useQuery({queryKey:['casualty-loot',warband],queryFn:async()=>{
 const r=await supabase.from('casualty_loot').select('*,casualty_loot_attempts(*)').eq('state','open').or(`source_warband_id.eq.${warband},eligible_warbands.cs.{${warband}}`).order('id')
 if(r.error)throw Error(r.error.message);return r.data
}})}
type Pool=NonNullable<ReturnType<typeof useLoot>['data']>[number]
export function CasualtyLootCard({detail,mayEdit}:{detail:WarbandDetail;mayEdit:boolean}){
 const query=useLoot(detail.warband.id)
 if(query.error)return <Notice tone="error">Could not load casualty looting: {query.error.message}</Notice>
 if(!query.data?.length)return null
 return <Section title="Looting the Dead"><p className="text-sm">Each surviving Looter may try once per casualty. A 4+ recovers that casualty’s equipment. File your battle report first.</p>{query.data.map(pool=><LootPool key={pool.id} pool={pool} detail={detail} mayEdit={mayEdit}/>)}</Section>
}
function LootPool({pool,detail,mayEdit}:{pool:Pool;detail:WarbandDetail;mayEdit:boolean}){
 const qc=useQueryClient(),[error,setError]=useState(''),[busy,setBusy]=useState(false),[note,setNote]=useState('')
 const [quantities,setQuantities]=useState<Record<string,number>[]>(()=>Array.from({length:pool.body_count},()=>({})))
 const [choice,setChoice]=useState(''),[dice,setDice]=useState<Record<number,number|null>>({}),[requests,setRequests]=useState<Record<number,string>>({})
 const [correction,setCorrection]=useState(''),[reason,setReason]=useState('')
 const kit=kitSchema.parse(pool.kit),mine=detail.warband.id
 const looters=[...detail.roster.henchmenGroups.filter(g=>g.unitTemplateId==='hochland_bandits_looter').flatMap(g=>Array.from({length:g.size},(_,i)=>({id:g.id,index:i,name:`${g.name}, model ${i+1}`}))),...detail.roster.heroes.filter(h=>h.unitTemplateId==='hochland_bandits_looter'&&h.status==='active').map(h=>({id:h.id,index:0,name:h.name}))]
 const selected=looters.find(l=>`${l.id}:${l.index}`===(choice||`${looters[0]?.id}:0`))
 const canRoll=mayEdit&&pool.eligible_warbands.includes(mine)
 async function save(action:()=>PromiseLike<{error:{message:string}|null;data:unknown}>){setBusy(true);setError('');try{const r=await action();if(r.error)throw Error(r.error.message);setNote(typeof r.data==='string'?r.data:'Saved.');await Promise.all([['casualty-loot'],['warbands'],['reports'],['awakening']].map(queryKey=>qc.invalidateQueries({queryKey})));setCorrection('');setReason('');setDice({});setRequests({})}catch(e){setError(e instanceof Error?e.message:'Could not save looting')}finally{setBusy(false)}}
 const itemName=(item:typeof kit[number])=>(item.item_rules_id?findItem(item.item_rules_id)?.name:undefined)??item.custom_name??'Equipment'
 return <Card className="my-3 flex flex-col gap-3 p-4"><h3 className="font-semibold">{pool.subject_name}</h3>{error?<Notice tone="error">{error}</Notice>:null}{note?<p className="text-sm">{note}</p>:null}
 {pool.allocations===null?<><p>These casualties carried mixed equipment. Their owner or GM must record who carried each item before anyone rolls.</p>{pool.source_warband_id===mine&&mayEdit?<>{Array.from({length:pool.body_count},(_,i)=><div key={i}><p className="font-semibold">Casualty {i+1}</p>{kit.map(item=><NumberField key={item.id} label={`${itemName(item)} (${item.quantity} total to allocate)`} value={quantities[i]?.[item.id]??0} onChange={v=>setQuantities(q=>q.map((row,n)=>n===i?{...row,[item.id]:v??0}:row))}/>)}</div>)}<Button pending={busy} onClick={()=>void save(()=>supabase.rpc('allocate_casualty_loot',{p_id:pool.id,p_quantities:quantities}))}>Confirm casualty equipment</Button></>:null}</>:<>
 {canRoll&&looters.length?<SelectField label="Looter making the attempt" value={choice||`${looters[0].id}:0`} onChange={e=>{setChoice(e.target.value);setDice({});setRequests({})}}>{looters.map(l=><option key={`${l.id}:${l.index}`} value={`${l.id}:${l.index}`}>{l.name}</option>)}</SelectField>:null}
 {Array.from({length:pool.body_count},(_,i)=>{
 const bodyKit=kitSchema.parse((pool.allocations as unknown[])[i]),attempts=pool.casualty_loot_attempts.filter(a=>a.body_index===i),winner=attempts.find(a=>a.won&&!a.reversed),used=attempts.some(a=>!a.reversed&&a.warband_id===mine&&a.looter_id===selected?.id&&a.looter_index===selected?.index)
 return <div key={i} className="flex flex-col gap-2 border-t border-border pt-3"><p className="font-semibold">Casualty {i+1}{winner?' — equipment recovered':''}</p><p className="text-sm">{bodyKit.map(item=>`${item.quantity} × ${itemName(item)}`).join(', ')||'No equipment carried.'}</p>
 {canRoll&&selected&&!winner&&!used&&bodyKit.length?<div className="flex flex-wrap items-end gap-3"><DieField label="Looting D6" sides={6} value={dice[i]??null} rollable onChange={v=>{setDice(d=>({...d,[i]:v}));setRequests(r=>({...r,[i]:crypto.randomUUID()}))}}/><Button pending={busy} disabled={!dice[i]} onClick={()=>void save(()=>supabase.rpc('roll_casualty_loot',{p_id:pool.id,p_body:i,p_warband:mine,p_looter:selected.id,p_looter_index:selected.index,p_die:dice[i]!,p_request:requests[i]??crypto.randomUUID()}))}>Record attempt</Button></div>:used&&!winner?<p className="text-sm">This Looter already tried. Select another Looter to try again.</p>:null}
 {attempts.map(a=><div key={a.id} className="text-sm"><p>{looters.find(l=>l.id===a.looter_id&&l.index===a.looter_index)?.name??`Looter ${a.looter_index+1}`}: D6 {a.die}: {a.won?'recovered equipment':'failed'}{a.reversed?` — reversed: ${a.reason}`:''}.</p>{a.warband_id===mine&&mayEdit&&!a.reversed?<Button variant="secondary" onClick={()=>setCorrection(a.id)}>Correct this attempt</Button>:null}</div>)}
 </div>})}
 </>}{correction?<div><TextField label="Reason for correction" value={reason} onChange={e=>setReason(e.target.value)}/><Button pending={busy} disabled={reason.trim().length<5} onClick={()=>void save(()=>supabase.rpc('reverse_casualty_loot',{p_attempt:correction,p_reason:reason}))}>Reverse attempt and recovered equipment</Button></div>:null}</Card>
}

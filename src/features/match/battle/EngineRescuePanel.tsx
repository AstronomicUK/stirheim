import {useState} from 'react'
import {useQueries} from '@tanstack/react-query'
import {fetchEngines} from '../../../api/engines'
import {useEngineRescues,useStartEngineRescue,useEngineRescueAction} from '../../../api/engineRescue'
import type {MatchParticipantView} from '../../../api/matches'
import type {EngineRescueAction,RescueModel} from '../../../rules/resolve/engineRescue'
import {useEnemyRosters} from '../fight/useEnemyRosters'
import {combatantsOf} from '../fight/combatants'
import {EngineBattleCard} from './EngineBattleCard'
import {Button,Notice,SelectField,Sheet,TextField} from '../../../ui'

export function EngineRescuePanel({matchId,participants,editable,isGm=false}:{matchId:string;participants:MatchParticipantView[];editable:boolean;isGm?:boolean}){
 const records=useEngineRescues(matchId),start=useStartEngineRescue(matchId),save=useEngineRescueAction(matchId)
 const rosters=useEnemyRosters(matchId,participants)
 const fleets=useQueries({queries:participants.map(p=>({queryKey:['engines',p.warband_id],queryFn:()=>fetchEngines(p.warband_id)}))})
 const engines=fleets.flatMap(f=>f.data??[]).filter(e=>e.state==='present')
 const [selected,setSelected]=useState<string|null>(null),[type,setType]=useState<EngineRescueAction['type']>('gaolerOut'),[gaoler,setGaoler]=useState(''),[model,setModel]=useState(''),[keeper,setKeeper]=useState(''),[prisoner,setPrisoner]=useState(''),[contact,setContact]=useState(false),[note,setNote]=useState('')
 const record=records.data?.find(r=>r.engine_id===selected),engine=engines.find(e=>e.id===selected)
 const manages=(id:string)=>isGm||participants.some(p=>p.warband_id===id&&p.mine)
 const models:RescueModel[]=rosters.warbands.flatMap(w=>combatantsOf(w.roster,w.template,w.roster.name,undefined).filter(c=>c.kind!=='animal'&&!c.out).flatMap(c=>c.kind==='henchman'?Array.from({length:c.groupSize??1},(_,i)=>({id:`${c.id}:${i}`,warbandId:c.warbandId,name:`${c.name} · model ${i+1}`})):[{id:c.id,warbandId:c.warbandId,name:c.name}]))
 const keepers=record?.state.keys.flatMap(k=>k.keeper?[k.keeper]:[]).filter((k,i,all)=>all.findIndex(x=>x.id===k.id)===i)??[]
 const gaolers=rosters.warbands.find(w=>w.roster.id===engine?.warband_id)?.roster.heroes.filter(h=>h.unitTemplateId==='black_dwarfs_gaolers')??[]
 const mayRecord=Boolean(record&&editable&&(type==='escaped'?(manages(record.state.holderWarbandId)||manages(record.state.prisoners.find(p=>p.id===prisoner)?.formerWarbandId??'')):type==='destroyed'||type==='holderRouted'?manages(record.state.holderWarbandId)||isGm:type==='free'||type==='keeperOut'?manages(keepers.find(k=>k.id===keeper)?.warbandId??''):model?manages(models.find(m=>m.id===model)?.warbandId??''):manages(record.state.holderWarbandId)))
 if(!engines.length)return null
 async function open(id:string){setSelected(id);setNote('');setType('gaolerOut');setContact(false);setModel('');setKeeper('');setGaoler('');setPrisoner('');if(!records.data?.some(r=>r.engine_id===id)&&editable)await start.mutateAsync(id)}
 function submit(){
  if(!record||!mayRecord)return
  const by=models.find(m=>m.id===model)??null
  const action:EngineRescueAction=type==='gaolerOut'?{type,gaolerId:gaoler,by}:type==='keeperOut'?{type,keeperId:keeper,by}:type==='free'?{type,keeperId:keeper,baseContactConfirmed:contact}:type==='escaped'?{type,prisonerId:prisoner}:{type}
  save.mutate({record,action,note},{onSuccess:()=>{setNote('');setContact(false)}})
 }
 return <section aria-label="Engine rescue" className="space-y-3">
  <div><h2 className="font-headline text-xl">Prisoners and rescue</h2><p className="mt-1 text-sm text-ink-dim">Record keys, release and escape as they happen at the table.</p></div>
  <div className="grid gap-3 md:grid-cols-2">{engines.map(e=>{const r=records.data?.find(x=>x.engine_id===e.id);return !r?<article key={e.id} className="rounded-lg border border-border bg-surface-low p-4"><h3 className="font-headline text-lg">{e.name}</h3><p className="my-2 text-sm text-ink-dim">{participants.find(p=>p.warband_id===e.warband_id)?.warband_name}</p><Button variant="secondary" disabled={!editable||start.isPending} onClick={()=>{void open(e.id).catch(()=>{})}}>View prisoners and rescue</Button></article>:<EngineBattleCard key={e.id} name={e.name} warbandName={participants.find(p=>p.warband_id===e.warband_id)?.warband_name??''} destroyed={r?.state.destroyed??false} keyHolders={r?.state.keys.flatMap(k=>k.keeper?[k.keeper.name]:['Keeper not yet known'])??[]} prisoners={r?.state.prisoners.map(p=>({...p,origin:participants.find(w=>w.warband_id===p.formerWarbandId)?.warband_name??(p.formerWarbandId?'From another warband':'Found while exploring')}))??[]} onManage={editable||r?()=>{void open(e.id).catch(()=>{})}:undefined}/>})}</div>
  {records.error?<Notice tone="error" title="Could not load rescue facts">{records.error.message}</Notice>:null}
  {selected?<Sheet open title={engine?.name??'Engine rescue'} onClose={()=>setSelected(null)} footer={record&&editable?<Button block disabled={!mayRecord||save.isPending||note.trim().length<3} onClick={submit}>Record confirmed event</Button>:undefined}>
   <p className="mb-4 text-sm text-ink-dim">These are shared battle facts. A freed captive must head for the nearest table edge. Permanent return to a former warband is resolved separately; confiscated equipment stays with the captors.</p>
   {start.error||save.error?<Notice tone="error" title="Could not record rescue facts">{start.error?.message??save.error?.message}</Notice>:null}
   {start.isPending?<p>Loading this Engine’s prisoners…</p>:null}
   {record&&editable?<div className="space-y-3">
    <SelectField label="What happened?" value={type} onChange={e=>setType(e.target.value as EngineRescueAction['type'])}>
     <option value="gaolerOut">A Gaoler was taken out of action</option><option value="keeperOut">A key holder was taken out of action</option><option value="free">A key holder reached the Engine</option><option value="destroyed">The Engine was destroyed</option><option value="holderRouted">The Chaos Dwarfs routed</option><option value="escaped">A freed prisoner reached the table edge</option>
    </SelectField>
    {type==='gaolerOut'?<SelectField label="Gaoler" value={gaoler} onChange={e=>setGaoler(e.target.value)}><option value="">Choose the Gaoler</option>{gaolers.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</SelectField>:null}
    {type==='free'||type==='keeperOut'?<SelectField label="Current key holder" value={keeper} onChange={e=>setKeeper(e.target.value)}><option value="">Choose the model</option>{keepers.map(k=><option key={k.id} value={k.id}>{k.name}</option>)}</SelectField>:null}
    {type==='gaolerOut'||type==='keeperOut'?<SelectField label="Who now has the keys?" value={model} onChange={e=>setModel(e.target.value)}><option value="">Keeper not yet known</option>{models.map(m=><option key={m.id} value={m.id}>{m.name} · {participants.find(p=>p.warband_id===m.warbandId)?.warband_name}</option>)}</SelectField>:null}
    {type==='free'?<label className="flex gap-2 text-sm"><input type="checkbox" checked={contact} onChange={e=>setContact(e.target.checked)}/>The key holder is in base contact with this Engine.</label>:null}
    {type==='escaped'?<SelectField label="Escaped prisoner" value={prisoner} onChange={e=>setPrisoner(e.target.value)}><option value="">Choose the prisoner</option>{record.state.prisoners.filter(p=>p.state==='freed').map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</SelectField>:null}
    <TextField label="What happened at the table?" value={note} maxLength={1000} onChange={e=>setNote(e.target.value)} hint="Record the agreed event so the other players can follow the rescue."/>
    {!mayRecord?<p className="text-xs text-ink-dim">The relevant model’s player, the Engine owner or the GM must confirm this action.</p>:null}
   </div>:null}
   {record?.state.prisoners.some(p=>p.profile)?<div className="mt-5 space-y-3 border-t border-border pt-3"><h3 className="text-sm font-semibold">Captives on the table</h3>{record.state.prisoners.map(p=>p.profile?<div key={p.id}><p className="text-sm">{p.name}</p><div className="mt-1 flex flex-wrap gap-2">{['M','WS','BS','S','T','W','I','A','Ld'].map(stat=><span key={stat} className="rounded border border-border px-2 py-1 text-xs">{stat} {p.profile?.[stat]??'—'}</span>)}</div></div>:null)}</div>:null}
   {record?.history.length?<div className="mt-5 border-t border-border pt-3"><h3 className="text-sm font-semibold">Rescue history</h3><ul className="mt-2 space-y-2 text-sm text-ink-dim">{record.history.filter(h=>h.note).map((h,i)=><li key={i}>{h.note}</li>)}</ul></div>:null}
  </Sheet>:null}
 </section>
}

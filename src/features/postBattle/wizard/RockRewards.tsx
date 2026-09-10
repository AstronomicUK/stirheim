import {Button,DieField,NumberField,SelectField,TextField} from '../../../ui'
import {ROCK_COMMON_ITEMS} from '../model/rockLoot'
import {rockFaction,rockXpRecipients,type RockDraft,type RockRoster,type RockConscript} from '../model/rockRewards'
export function RockRewards({state,roster,won,change}:{state:RockDraft;roster:RockRoster;won:boolean;change:(s:RockDraft)=>void}) {
 const faction=rockFaction(roster),recipients=rockXpRecipients(roster)
 const matriarchs=(roster.heroes??[]).filter(h=>/matriarch/i.test(h.unitTemplateId))
 const loot=state.loot??[],kills=state.witchKills??[],conscripts=state.conscripts??[]
 const setConscript=(i:number,patch:Partial<RockConscript>)=>change({...state,conscripts:conscripts.map((r,n)=>n===i?{...r,...patch}:r)})
 return <div className="flex flex-col gap-4">
 {!faction.sisters?<>
  <p className="text-sm">Record searches actually made during the battle, including failed searches. This is not an extra search roll after the game.</p>
  {loot.map((r,i)=><div key={i} className="flex flex-col gap-2 rounded-md border border-border p-3">
   <TextField label={`Search ${i+1}: warrior`} value={r.searcher} onChange={e=>change({...state,loot:loot.map((row,n)=>n===i?{...row,searcher:e.target.value}:row)})}/>
   <DieField label={`Search ${i+1} D6`} sides={6} value={r.die} onChange={die=>change({...state,loot:loot.map((row,n)=>n===i?{searcher:row.searcher,die}:row)})}/>
   {r.die===5?<SelectField label={`Search ${i+1}: common item`} value={r.commonItemId??''} onChange={e=>change({...state,loot:loot.map((row,n)=>n===i?{...row,commonItemId:e.target.value}:row)})}><option value="">Choose a core common item…</option>{ROCK_COMMON_ITEMS.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</SelectField>:null}
   {r.die===6?<><label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={r.desecrate??false} onChange={e=>change({...state,loot:loot.map((row,n)=>n===i?{...row,desecrate:e.target.checked,initiativeDie:null}:row)})}/>Attempt to desecrate this Holy Relic</label>{r.desecrate?<DieField label={`Relic ${i+1}: Initiative D6`} sides={6} rollable value={r.initiativeDie??null} onChange={initiativeDie=>change({...state,loot:loot.map((row,n)=>n===i?{...row,initiativeDie}:row)})}/>:null}</>:null}
   <Button variant="secondary" onClick={()=>change({...state,loot:loot.filter((_,n)=>n!==i)})}>Remove search {i+1}</Button>
  </div>)}
  <Button variant="secondary" onClick={()=>change({...state,loot:[...loot,{searcher:'',die:null}]})}>Add recorded room search</Button>
  {loot.some(r=>r.die===6&&r.desecrate)?<>
   <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={state.evil??false} onChange={e=>change({...state,evil:e.target.checked})}/>Our warband is chaotic or evil and may desecrate relics.</label>
   <SelectField label="Leader attempting desecration" value={state.leaderId??''} onChange={e=>change({...state,leaderId:e.target.value,initiative:null,initiativeReason:''})}><option value="">Choose the leader…</option>{roster.heroes?.filter(h=>h.status==='active').map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</SelectField>
   <NumberField label="Leader Initiative for desecration" value={state.initiative??roster.heroes?.find(h=>h.id===state.leaderId)?.stats.I??null} allowEmpty onChange={initiative=>change({...state,initiative})}/>
   {state.initiative!=null&&state.initiative!==roster.heroes?.find(h=>h.id===state.leaderId)?.stats.I?<TextField label="Reason for adjusted Initiative" value={state.initiativeReason??''} onChange={e=>change({...state,initiativeReason:e.target.value})}/>:null}
  </>:null}
 </>:null}
 {won&&faction.sisters?<><p className="text-sm">Recovered-tome reward: 100 gc and +2 XP for the Matriarch, if she survived.</p><SelectField label="Rewarded Matriarch" value={state.matriarchId??''} onChange={e=>change({...state,matriarchId:e.target.value})}><option value="">Choose the Matriarch…</option>{matriarchs.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</SelectField></>:null}
 {won&&(faction.witch||faction.morr)?<>
  <p className="text-sm">Destroy the recovered tome and distribute D6 XP. {faction.witch?'The Witch Hunters also receive 50 gc.':''}</p>
  <DieField label="Destroyed tome: XP D6" sides={6} rollable value={state.destructionDie??null} onChange={destructionDie=>change({...state,destructionDie,xp:{}})}/>
  {recipients.map(h=><NumberField key={h.id} label={`Tome XP: ${h.name}`} value={state.xp?.[h.id]??0} onChange={n=>change({...state,xp:{...state.xp,[h.id]:n??0}})}/>)}
 </>:null}
 {won&&!faction.sisters&&!faction.witch&&!faction.morr?<p className="text-sm">Your stash receives the Tome from the Rock. Its two-spell reading action appears on the warband screen.</p>:null}
 {faction.witch?<>
  <p className="text-sm">Witch Hunter bonus: +2 XP for each Augur or Matriarch taken out, in addition to ordinary kill XP.</p>
  {kills.map((k,i)=><div key={i} className="flex flex-col gap-2 rounded-md border border-border p-3">
   <TextField label={`Bonus casualty ${i+1}: enemy name`} value={k.enemy} onChange={e=>change({...state,witchKills:kills.map((row,n)=>n===i?{...row,enemy:e.target.value}:row)})}/>
   <SelectField label={`Bonus casualty ${i+1}: enemy type`} value={k.kind} onChange={e=>change({...state,witchKills:kills.map((row,n)=>n===i?{...row,kind:e.target.value as 'augur'|'matriarch'}:row)})}><option value="augur">Augur</option><option value="matriarch">Matriarch</option></SelectField>
   <SelectField label={`Bonus casualty ${i+1}: credited warrior`} value={k.recipientId} onChange={e=>change({...state,witchKills:kills.map((row,n)=>n===i?{...row,recipientId:e.target.value}:row)})}><option value="">Choose…</option>{recipients.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</SelectField>
   <Button variant="secondary" onClick={()=>change({...state,witchKills:kills.filter((_,n)=>n!==i)})}>Remove bonus casualty {i+1}</Button>
  </div>)}
  <Button variant="secondary" onClick={()=>change({...state,witchKills:[...kills,{recipientId:'',enemy:'',kind:'augur'}]})}>Add Augur or Matriarch taken out</Button>
 </>:null}
 {faction.sisters?<>
  <p className="text-sm">Record Sisters conscripted during the battle. Up to two from each patrol, provided it was not led by a Matriarch. Retained survivors join free with their declared weapons, subject to warband limits.</p>
  {conscripts.map((r,i)=><div key={r.id} className="flex flex-col gap-2 rounded-md border border-border p-3">
   <TextField label={`Conscript ${i+1}: patrol`} value={r.patrol} onChange={e=>setConscript(i,{patrol:e.target.value})}/>
   <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={r.eligiblePatrol} onChange={e=>setConscript(i,{eligiblePatrol:e.target.checked})}/>This patrol was not led by a Matriarch.</label>
   <NumberField label={`Conscript ${i+1}: Matriarch Leadership`} allowEmpty value={r.leadership} onChange={leadership=>setConscript(i,{leadership})}/>
   {[0,1].map(d=><DieField key={d} label={`Conscript ${i+1}: Leadership die ${d+1}`} sides={6} value={r.dice[d]??null} onChange={value=>setConscript(i,{dice:r.dice.map((old,n)=>n===d?value:old)})}/>)}
   <SelectField label={`Conscript ${i+1}: declared weapons`} value={r.kit} onChange={e=>setConscript(i,{kit:e.target.value as 'hammers'|'whip'})}><option value="hammers">Two Sigmarite warhammers</option><option value="whip">Sigmarite warhammer and steel whip</option></SelectField>
   <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={r.survived} onChange={e=>setConscript(i,{survived:e.target.checked,retain:false})}/>This Sister survived.</label>
   <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={r.retain} onChange={e=>setConscript(i,{retain:e.target.checked})}/>Retain this Sister permanently</label>
   <Button variant="secondary" onClick={()=>change({...state,conscripts:conscripts.filter((_,n)=>n!==i)})}>Remove conscript {i+1}</Button>
  </div>)}
  <Button variant="secondary" onClick={()=>change({...state,conscripts:[...conscripts,{id:crypto.randomUUID(),patrol:'',dice:[null,null],leadership:matriarchs[0]?.stats.Ld??null,kit:'hammers',survived:false,retain:false,eligiblePatrol:false}]})}>Add recorded conscription</Button>
 </>:null}
 </div>
}

import { DieField, NumberField, SelectField, TextField } from '../../../ui'
import { Card, Section } from '../../roster/view/bits'
import { PirateRecruits } from './PirateRecruits'
import type { StepProps } from './bits'
export function LocationRecruits({draft,derived,ctx,update}:Pick<StepProps,'draft'|'derived'|'ctx'|'update'>) {
 const plan=derived.recruits
 const pirate=<PirateRecruits draft={draft} derived={derived} ctx={ctx} update={update}/>
 if(!plan.kind||plan.kind==='pirate') return pirate
 return <>{pirate}<Section title="Exploration recruits"><Card className="flex flex-col gap-3 px-4 py-3">
  <p className="text-sm">{plan.kind==='zombie'?'Raise the rescued dead as Zombies, within your warband’s normal limits.':'One prisoner can join an existing human henchman group for free, with its experience and characteristics. Pay for identical equipment.'}</p>
  {plan.needsDie?<DieField label="Number of Zombies D3" sides={3} rollable value={draft.exploration.recruitDie??null} onChange={recruitDie=>update(d=>({...d,exploration:{...d.exploration,recruitDie}}))}/>:null}
  <SelectField label="Recruit reward" value={draft.exploration.recruitChoice??''} onChange={e=>{const recruitChoice=e.target.value;const recruitGroupId=recruitChoice==='new'?crypto.randomUUID():undefined;update(d=>({...d,exploration:{...d.exploration,recruitChoice,recruitGroupId,recruitKitCost:null,recruitKitReason:''}}))}}>
   <option value="">Choose…</option><option value="decline">Decline the recruits</option>
   {plan.newUnit?<option value="new">Create a new Zombie group</option>:null}
   {plan.groups.map(g=><option key={g.id} value={g.id}>Join {g.name} ({g.size} models, {g.xp} XP)</option>)}
  </SelectField>
  {plan.kind==='human'&&plan.groups.some(g=>g.id===draft.exploration.recruitChoice)?<>
   <p className="text-sm">Identical equipment: {plan.listedCost===null?'agreed price required':`${plan.listedCost} gc`}. No recruitment or veteran-experience fee.</p>
   <details><summary className="cursor-pointer text-sm">Agree a different equipment price</summary><div className="mt-3 flex flex-col gap-3">
    <NumberField label="Agreed equipment cost (gc)" value={draft.exploration.recruitKitCost??null} onChange={recruitKitCost=>update(d=>({...d,exploration:{...d.exploration,recruitKitCost}}))}/>
    <TextField label="Reason for agreed price" value={draft.exploration.recruitKitReason??''} onChange={e=>update(d=>({...d,exploration:{...d.exploration,recruitKitReason:e.target.value}}))}/>
   </div></details>
  </>:null}
 </Card></Section></>
}

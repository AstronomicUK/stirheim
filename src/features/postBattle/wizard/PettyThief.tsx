import { DieField } from '../../../ui'
import { Card, Section } from '../../roster/view/bits'
import { pettyThief } from '../model/pettyThief'
import type { StepProps } from './bits'
export function PettyThief({draft,derived,ctx,update}:Pick<StepProps,'draft'|'derived'|'ctx'|'update'>){
 const plan=pettyThief(draft,ctx,derived.participants)
 if(!plan.squire)return null
 return <Section title="Petty Thief"><Card className="flex flex-col gap-3 px-4 py-3">
  <p className="text-sm">{plan.squire.name} was not taken out of action. On 5+, steal one shard from a randomly determined opposing warband. An empty reserve yields nothing.</p>
  <DieField label="Petty Thief D6" sides={6} rollable value={draft.pettyThiefRoll??null} onChange={pettyThiefRoll=>update(d=>({...d,pettyThiefRoll,pettyThiefSelection:null}))}/>
  {(draft.pettyThiefRoll??0)>=5&&plan.opponents.length>1?<><p className="text-sm">{plan.opponents.map((o,i)=>`${i+1}: ${o.name}`).join(' · ')}</p><DieField label="Random opponent" sides={plan.opponents.length} rollable value={draft.pettyThiefSelection??null} onChange={pettyThiefSelection=>update(d=>({...d,pettyThiefSelection}))}/></>:null}
  {plan.transfer?<p className="text-sm">Selected: {plan.opponents.find(o=>o.id===plan.transfer!.target_id)?.name}. The report will record the actual transfer.</p>:null}
 </Card></Section>
}

import { DieField, NumberField, SelectField } from '../../../ui'
import { Card, Section } from '../../roster/view/bits'
import { locationXp } from '../model/locationXp'
import type { StepProps } from './bits'
export function LocationExperience({draft,derived,ctx,update}:Pick<StepProps,'draft'|'derived'|'ctx'|'update'>) {
 const heroes=ctx.roster.heroes.map(h=>derived.injuries.heroes.find(r=>r.hero.id===h.id)?.resolution.hero??h)
 const plan=locationXp(derived.exploration.location?.id,ctx.roster.warbandTemplateId,draft.exploration,heroes,derived.participants.leaderId)
 if(!plan.fixed&&!plan.sides) return null
 return <Section title="Exploration experience"><Card className="flex flex-col gap-3 px-4 py-3">
  <p className="text-sm">{plan.label}. Awards are added to the named Heroes’ experience and the report log. Any resulting advances must be rolled before filing.</p>
  {plan.sides ? <><DieField label={`Reward experience D${plan.sides}`} sides={plan.sides} rollable value={draft.exploration.locationXpDie??null} onChange={locationXpDie=>update(d=>({...d,exploration:{...d.exploration,locationXpDie,locationXp:{}}}))} />{plan.total!==null?plan.eligible.map(hero=><NumberField key={hero.id} label={`Experience for ${hero.name}`} value={draft.exploration.locationXp?.[hero.id]??0} onChange={amount=>update(d=>({...d,exploration:{...d.exploration,locationXp:{...d.exploration.locationXp,[hero.id]:amount??0}}}))} />):null}</> : <>
    {plan.eligible.some(h=>h.id===derived.participants.leaderId)?<p className="text-sm">+1 XP to {plan.eligible.find(h=>h.id===derived.participants.leaderId)!.name}, the warband leader.</p>:<SelectField label="Warband leader receiving the reward" value={draft.exploration.locationLeaderId??''} onChange={e=>update(d=>({...d,exploration:{...d.exploration,locationLeaderId:e.target.value}}))}><option value="">Choose the new leader…</option>{plan.eligible.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</SelectField>}
  </>}
  {plan.total!==null&&plan.sides?<p className="text-sm">{Object.values(draft.exploration.locationXp??{}).reduce((sum,n)=>sum+n,0)} of {plan.total} XP allocated.</p>:null}
 </Card></Section>
}

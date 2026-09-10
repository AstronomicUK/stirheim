import { DieField, NumberField, SelectField, TextField } from '../../../ui'
import { Card, Section } from '../../roster/view/bits'
import type { StepProps } from './bits'
import type { PirateRecruitDraft } from '../model/state'

export function PirateRecruits({draft,derived,ctx,update}: Pick<StepProps,'draft'|'derived'|'ctx'|'update'>) {
  const location=derived.exploration.location?.id
  if(ctx.roster.warbandTemplateId!=='pirates'||!['straggler','prisoners'].includes(location??''))return null
  const choice=draft.exploration.pirateRecruits
  const plan=derived.recruits.kind==='pirate'?derived.recruits:null
  const fresh=()=>({id:crypto.randomUUID(),rolls:[null,null] as [null,null]})
  const set=(change:(v:PirateRecruitDraft)=>PirateRecruitDraft)=>update(d=>({...d,exploration:{...d.exploration,pirateRecruits:change(d.exploration.pirateRecruits??{people:[]})}}))
  const person=(index:number,change:Partial<PirateRecruitDraft['people'][number]>)=>set(v=>({...v,people:v.people.map((p,i)=>i===index?{...p,...change}:p)}))
  return <Section title="Pirate recruitment"><Card className="flex flex-col gap-3 px-4 py-3">
    <SelectField label="Resolve this discovery" value={choice?'pirate':'ordinary'} onChange={e=>{const pirate=e.target.value==='pirate';update(d=>({...d,exploration:{...d.exploration,pirateRecruits:pirate?{people:location==='straggler'?[fresh()]:[]}:undefined,gold:null,recruitChoice:undefined,recruitGroupId:undefined,recruitDie:null}}))}}>
      <option value="ordinary">Ordinary discovery reward</option><option value="pirate">Offer a place aboard the ship</option>
    </SelectField>
    {choice&&plan?<>
      <p className="text-sm">This replaces the ordinary reward. {location==='straggler'?'A passed test gains one Swabbie; a failure gains nobody.':'Test separately for each prisoner. A pass gains Crew; failure or unaffordable matching equipment gains a Swabbie.'} Roster limits still apply.</p>
      <p className="text-sm">Captain: {plan.captain?.name??'No living Captain'} · Leadership {plan.captain?.stats.Ld??'—'}</p>
      <details><summary className="cursor-pointer text-sm">Adjust Leadership for a special rule</summary><div className="mt-2 flex flex-col gap-2">
        <NumberField label="Leadership used" value={choice.leadership??plan.captain?.stats.Ld??null} onChange={leadership=>set(v=>({...v,leadership}))}/>
        <TextField label="Reason for Leadership adjustment" value={choice.leadershipReason??''} onChange={e=>set(v=>({...v,leadershipReason:e.target.value}))}/>
      </div></details>
      {location==='prisoners'?<DieField label="Rescued prisoners D3" sides={3} rollable value={choice.count??null} onChange={count=>set(v=>({...v,count,people:Array.from({length:count??0},fresh)}))}/>:null}
      {choice.people.map((p,index)=>{
        const valid=p.rolls.every(n=>n!==null&&n>=1&&n<=6)
        const passed=valid&&p.rolls[0]!+p.rolls[1]!<=(plan.leadership??0)
        const crew=location==='prisoners'&&passed
        return <div key={p.id} className="flex flex-col gap-2 border-t border-edge pt-3">
          <p className="font-medium">Person {index+1}</p><div className="flex gap-3">{([0,1] as const).map(die=><DieField key={die} label={`Person ${index+1} Leadership die ${die+1}`} sides={6} rollable value={p.rolls[die]} onChange={value=>{const rolls=[...p.rolls] as typeof p.rolls;rolls[die]=value;person(index,{rolls,destination:undefined,kitCost:null,kitReason:''})}}/>)}</div>
          {valid&&(location==='prisoners'||passed)?<SelectField label={`Person ${index+1} destination`} value={p.destination??(crew?'':'swabbie')} onChange={e=>person(index,{destination:e.target.value,kitCost:null,kitReason:''})}>
            {crew?<><option value="">Choose Crew group…</option><option value="new">New Crew group — free dagger, buy further kit later</option>{plan.groups.map(g=><option key={g.id} value={g.id}>Join {g.name}</option>)}</>:<option value="swabbie">Keep as a Swabbie</option>}
            <option value="release">Release; do not add to the warband</option>
          </SelectField>:null}
          {crew&&plan.groups.some(g=>g.id===p.destination)?<details><summary className="cursor-pointer text-sm">Agree a matching equipment price</summary><div className="mt-2 flex flex-col gap-2">
            <NumberField label={`Person ${index+1} agreed equipment cost`} value={p.kitCost??null} onChange={kitCost=>person(index,{kitCost})}/>
            <TextField label={`Person ${index+1} equipment price reason`} value={p.kitReason??''} onChange={e=>person(index,{kitReason:e.target.value})}/>
          </div></details>:null}
          {plan.results.find(r=>r.index===index)?<p className="text-sm">{plan.results.find(r=>r.index===index)!.text}</p>:null}
        </div>
      })}
    </>:null}
  </Card></Section>
}

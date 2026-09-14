import { DieField, SelectField } from '../../../ui'
import { Card } from '../../roster/view/bits'
import { emptyExploration, setKitRoll, setKitExtraRoll } from '../model/state'
import { pirateMapChoice, recordMapDie } from '../model/pirateMapChoice'
import type { StepProps } from './bits'

export function PirateMapCard({draft,derived,ctx,update}:Pick<StepProps,'draft'|'derived'|'ctx'|'update'>) {
  const map=pirateMapChoice(draft,ctx)
  const prompt=derived.kit.prompts.find(p=>p.itemId==='treasure_map')
  const gold=prompt?.outcome?.effect?.gold
  const goldDice=gold&&typeof gold!=='number'?gold.dice:0
  if(!map.options.length&&map.requested==='regular')return null
  const heroes=ctx.roster.heroes.filter(h=>h.status==='active'&&(derived.injuries.heroes.find(r=>r.hero.id===h.id)?.resolution.hero.status??'active')==='active')
  return <Card className="flex flex-col gap-3 px-4 py-3">
    <SelectField label="Where will the crew search?" value={map.requested} onChange={e=>{
      const choice=e.target.value
      update(d=>({...d,pirateMapChoice:choice,exploration:emptyExploration()}))
    }}>
      <option value="regular">Explore the city normally</option>
      {map.options.map(row=><option key={row.id} value={row.id}>Follow a Treasure Map — {ctx.roster.heroes.find(h=>h.id===row.holder_id)?.name??'warband stash'} ({row.quantity} available)</option>)}
    </SelectField>
    <p className="text-sm text-ink-dim">A Treasure Map replaces regular exploration.{map.row?' Roll below to find where it leads.':''}</p>
    {map.problems.map(p=><p key={p} className="text-sm">{p}</p>)}
    {prompt ? <>
      <DieField label="Treasure Map destination D6" sides={6} value={prompt.rolls[0]??null} onChange={(v,source)=>update(d=>recordMapDie(setKitRoll(d,prompt.key,0,v),'Treasure Map destination D6',v,source))} rollable />
      {prompt.outcome ? <p className="text-sm">{prompt.outcome.text}</p> : null}
      <div className="flex flex-wrap gap-3">
        {Array.from({length:goldDice},(_,i)=><DieField key={i} label={`Treasure gold D6 ${i+1}`} sides={6} value={prompt.extraRolls[i]??null} onChange={(v,source)=>update(d=>recordMapDie(setKitExtraRoll(d,prompt.key,i,v),`Treasure gold D6 ${i+1}`,v,source))} rollable />)}
      </div>
      {prompt.rolls[0]===6 ? <DieField label="Black-Wyrd wyrdstone D3" sides={3} value={draft.pirateMapDetails?.shards??null} onChange={(v,source)=>update(d=>recordMapDie({...d,pirateMapDetails:{...d.pirateMapDetails,shards:v}},'Black-Wyrd wyrdstone D3',v,source))} rollable /> : null}
      {prompt.rolls[0]===5 ? <>
        <SelectField label="Hero attempting the trapped chest" value={draft.pirateMapDetails?.heroId??''} onChange={e=>{
          const id=e.target.value
          update(d=>({...d,pirateMapDetails:{...d.pirateMapDetails,heroId:id,test:null}}))
        }}>
          <option value="">Choose a surviving Hero</option>
          {heroes.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}
        </SelectField>
        <DieField label="Trapped chest Initiative D6" sides={6} value={draft.pirateMapDetails?.test??null} onChange={(v,source)=>update(d=>recordMapDie({...d,pirateMapDetails:{...d.pirateMapDetails,test:v}},'Trapped chest Initiative D6',v,source))} rollable />
      </> : null}
      {prompt.summary ? <p className="text-sm">{prompt.summary}</p> : null}
    </> : null}
  </Card>
}

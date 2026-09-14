import { abominationCasualties } from '../model/abomination'
import { SelectField, TextField } from '../../../ui'
import { Card } from '../../roster/view/bits'
import type { StepProps } from './bits'
export function AbominationAftermath({draft,ctx,update}: Pick<StepProps,'draft'|'ctx'|'update'>) {
  if(ctx.scenarioId === 'the_sword_of_the_herald' && draft.scenarioNonCampaign) return null
  return <>{abominationCasualties(draft,ctx).map(({group,index,key}) => {
    const choice = draft.abominationRecipients?.[key] ?? {warbandId:'',modelName:''}
    const change=(patch:Partial<typeof choice>)=>update(d=>({...d,abominationRecipients:{...d.abominationRecipients,[key]:{...choice,...patch}}}))
    return <Card key={key} className="flex flex-col gap-3 p-4">
      <h3 className="font-semibold">{group.name} — Powered</h3>
      <p className="text-sm">Model {index+1} survives, but needs a new shard to reanimate. Record who took it down; their warband receives its old shard when this report is applied.</p>
      <SelectField label="Opposing warband" value={choice.warbandId} onChange={e=>change({warbandId:e.target.value})}><option value="">Choose a warband</option>{ctx.opponents?.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</SelectField>
      <TextField label="Warrior who took it down" value={choice.modelName} onChange={e=>change({modelName:e.target.value})}/>
    </Card>
  })}</>
}

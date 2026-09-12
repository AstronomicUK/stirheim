import {SelectField} from '../../../ui'
import {Card} from '../../roster/view/bits'
import {reportWagons} from '../model/tradeWagonReport'
import type {StepProps} from './bits'
export function TradeWagonFacts({draft,ctx,update}:Pick<StepProps,'draft'|'ctx'|'update'>) {
  const wagons=reportWagons(ctx)
  if(!wagons.length||!draft.routed||(ctx.scenarioId==='the_sword_of_the_herald'&&draft.scenarioNonCampaign))return null
  const choice=draft.tradeWagon??{}
  return <Card className="flex flex-col gap-3 p-4">
    <p className="font-medium">Trade Wagon after the rout</p>
    <SelectField label="Why did the warband rout?" value={draft.routCause==='failed-test'||draft.routCause==='voluntary'?draft.routCause:''} onChange={e=>update(d=>({...d,routCause:e.target.value as 'failed-test'|'voluntary',tradeWagon:undefined}))}>
      <option value="">Confirm what happened</option><option value="failed-test">Failed a Rout test</option><option value="voluntary">Withdrew voluntarily</option>
    </SelectField>
    {draft.routCause==='failed-test'?<>
      <SelectField label="Was a model driving the Trade Wagon when the test failed?" value={choice.driverPresent===undefined?'':String(choice.driverPresent)} onChange={e=>update(d=>({...d,tradeWagon:{driverPresent:e.target.value===''?undefined:e.target.value==='true'}}))}>
        <option value="">Choose…</option><option value="true">Yes — the wagon was driven away</option><option value="false">No — the wagon was abandoned</option>
      </SelectField>
      {choice.driverPresent===false?<>
        {wagons.length>1?<SelectField label="Abandoned Trade Wagon" value={choice.wagonId??''} onChange={e=>update(d=>({...d,tradeWagon:{...d.tradeWagon,wagonId:e.target.value}}))}><option value="">Select the wagon</option>{wagons.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</SelectField>:null}
        <SelectField label="Winning warband that captured the wagon" value={choice.captorId??''} onChange={e=>update(d=>({...d,tradeWagon:{...d.tradeWagon,captorId:e.target.value}}))}>
          <option value="">Confirm the winning warband</option>{ctx.opponents?.filter(o=>!ctx.opponentResults?.[o.id]||ctx.opponentResults[o.id]==='won').map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
        </SelectField>
        <SelectField label="Was every Merchant Caravan model taken out of action?" value={choice.everyMerchantModelOut===undefined?'':String(choice.everyMerchantModelOut)} onChange={e=>update(d=>({...d,tradeWagon:{...d.tradeWagon,everyMerchantModelOut:e.target.value===''?undefined:e.target.value==='true'}}))}>
          <option value="">Choose…</option><option value="false">No — the captor cannot search for rare items</option><option value="true">Yes — the captor may search for rare items</option>
        </SelectField>
        <p className="text-sm text-ink-dim">Filing holds the wagon and its existing stored equipment and wyrdstone aside. Gold and new exploration finds stay with you. Agree the wagon’s outcome from either warband screen after the winner files their report.</p>
      </>:null}
    </>:null}
  </Card>
}

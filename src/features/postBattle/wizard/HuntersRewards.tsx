import { Button, DieField, NumberField, SelectField, TextField } from '../../../ui'
import { Card } from '../../roster/view/bits'
import type { HuntersDraft } from '../model/huntersRewards'
export function HuntersRewards({state,won,change,maxPlants}:{state:HuntersDraft;won:boolean;change:(v:HuntersDraft)=>void;maxPlants:number}) {
 const sold=(state.liveCaptured??0)-(state.liveKept??0)
 return <Card className="flex flex-col gap-3 px-4 py-3">
  <NumberField label="Beastmaster artefacts placed at setup" hint="The actual D3 result, 1–3 counters" allowEmpty value={state.startingArtefacts??null} onChange={startingArtefacts=>change({...state,startingArtefacts,heldArtefacts:null})}/>
  <NumberField label="Artefact counters your warband carried away" allowEmpty value={state.heldArtefacts??null} onChange={heldArtefacts=>change({...state,heldArtefacts})}/>
  <p className="text-sm">Each retained artefact is one shard. These are separate from the campaign’s unique magical artefacts.</p>
  <p className="font-medium">Loot from plants slain by your warband</p>
  {(state.plantDice??[]).map((die,index)=><div key={index} className="flex items-end gap-3"><DieField label={`Slain plant ${index+1} loot D6`} sides={6} rollable value={die} onChange={value=>change({...state,plantDice:state.plantDice!.map((d,i)=>i===index?value:d)})}/><Button variant="secondary" onClick={()=>change({...state,plantDice:state.plantDice!.filter((_,i)=>i!==index)})}>Remove plant {index+1}</Button></div>)}
  <Button variant="secondary" disabled={(state.plantDice?.length??0)>=maxPlants} onClick={()=>change({...state,plantDice:[...(state.plantDice??[]),null]})}>Add slain plant</Button>
  {won?<>
   <p className="font-medium">Cold Ones: {state.alive??'—'} alive at the end</p>
   <NumberField label="Live Cold Ones captured by your warband" allowEmpty value={state.liveCaptured??null} onChange={liveCaptured=>change({...state,liveCaptured,liveKept:null,saleBasis:undefined,saleReason:''})}/>
   <NumberField label="Captured Cold Ones to keep as mounts" hint="The remainder are sold" allowEmpty value={state.liveKept??null} onChange={liveKept=>change({...state,liveKept,saleBasis:undefined,saleReason:''})}/>
   {sold>1?<><p className="text-sm">The source says the live Cold Ones can be sold “for 80gc” without specifying whether this is each or together. Record your table’s agreed payment.</p>
    <SelectField label="Live Cold One sale ruling" value={state.saleBasis??''} onChange={e=>change({...state,saleBasis:e.target.value as HuntersDraft['saleBasis']})}><option value="">Choose…</option><option value="each">80 gc for each sold</option><option value="lot">80 gc for the sold group</option></SelectField>
    <TextField label="Reason for Cold One sale ruling" value={state.saleReason??''} onChange={e=>change({...state,saleReason:e.target.value})}/>
   </>:null}
   <NumberField label="Dead Cold Ones recovered for sale" hint="40 gc each; only those actually recovered" allowEmpty value={state.deadRecovered??null} onChange={deadRecovered=>change({...state,deadRecovered})}/>
  </>:null}
 </Card>
}

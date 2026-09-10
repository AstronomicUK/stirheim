import { NumberField, SelectField, TextField } from '../../../ui'
import type { ForbiddenSquareDraft } from '../model/forbiddenSquareRewards'
import { ScenarioTransferPicker } from './ScenarioTransferPicker'
export function ForbiddenSquareRewards({state,warbands,change}:{state:ForbiddenSquareDraft;warbands:{id:string;name:string}[];change:(s:ForbiddenSquareDraft)=>void}) {
 return <div className="flex flex-col gap-3">
 <SelectField label="Your side in the Forbidden Square" value={state.role??''} onChange={e=>change({...state,role:e.target.value as ForbiddenSquareDraft['role'],scored:null})}><option value="">Choose…</option><option value="infiltrator">Infiltrators — carry stones through the gate</option><option value="cultist">Cultists — sacrifice stones at the totem</option></SelectField>
 <NumberField label="Actual wyrdstone counters placed at setup" hint="Placement ends at the first 1. Use the actual total; there is no fixed eight-counter limit." allowEmpty value={state.placed??null} onChange={placed=>change({...state,placed,scored:null})}/>
 <NumberField label={state.role==='cultist'?'Counters sacrificed at the totem':'Counters carried out through the gate'} allowEmpty value={state.scored??null} onChange={scored=>change({...state,scored})}/>
 {state.role==='cultist'?<p className="text-sm">Sacrificed stones count towards victory but vanish; they do not enter your stash.</p>:null}
 <p className="text-sm">The source allows models to pick up weapon counters but does not explicitly state who keeps them after the battle. Record your table’s agreement. Placement alone does not delete anyone’s equipment.</p>
 <SelectField label="Weapon ownership after the battle" value={state.weaponPolicy??''} onChange={e=>change({...state,weaponPolicy:e.target.value as ForbiddenSquareDraft['weaponPolicy'],transfers:[]})}><option value="">Choose the agreed rule…</option><option value="return">Return weapons to their original owners</option><option value="keep">Keep the weapons actually recovered</option></SelectField>
 <TextField label="Weapon ownership agreement" value={state.weaponReason??''} onChange={e=>change({...state,weaponReason:e.target.value})}/>
 {state.weaponPolicy==='keep'?<ScenarioTransferPicker warbands={warbands} value={state.transfers??[]} weaponsOnly change={transfers=>change({...state,transfers})}/>:null}
 </div>
}

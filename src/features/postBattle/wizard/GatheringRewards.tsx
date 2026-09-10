import { SelectField, TextField } from '../../../ui'
import type { GatheringReward } from '../../../rules/resolve/gatheringControl'
export function GatheringRewards({value,won,warbands,change}:{value:GatheringReward;won:boolean;warbands:{id:string;name:string}[];change:(v:GatheringReward)=>void}) {
 return <div className="flex flex-col gap-3">
 <SelectField label="How did the horde battle end?" value={value.ending??''} onChange={e=>change({ending:e.target.value as GatheringReward['ending']})}><option value="">Choose…</option><option value="dirk">Dirk was taken out of action</option><option value="valnor">Valnor was taken out of action</option><option value="rout">A horde routed</option></SelectField>
 {won&&value.ending&&value.ending!=='rout'?<>
 <SelectField label="Agreed controller of Executioner’s Square" value={value.controllerId??''} onChange={e=>change({...value,controllerId:e.target.value})}><option value="">Choose a winning warband…</option>{warbands.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</SelectField>
 {warbands.length>2?<TextField label="Horde control agreement" hint="The scenario awards control but does not divide it between allied warbands. Record your agreement." value={value.reason??''} onChange={e=>change({...value,reason:e.target.value})}/>:null}
 <p className="text-sm">All reports must agree on the ending, and winning reports must name the same winning controller. Filing all reports then replaces the square’s existing footholds with that warband’s control. No extra treasure is awarded.</p>
 </>:<p className="text-sm">The special control reward is triggered by a Horde Master being taken out. A rout has only the usual campaign-map result.</p>}
 </div>
}

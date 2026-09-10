export interface GatheringReward { ending?: 'dirk' | 'valnor' | 'rout'; controllerId?: string; reason?: string }
export function gatheringRewardProblems(value: GatheringReward, won: boolean, participantIds: string[]) {
 const problems: string[]=[]
 if(!['dirk','valnor','rout'].includes(value.ending??''))problems.push('Record how Gathering of the Horde ended.')
 if(won&&value.ending&&value.ending!=='rout'){
  if(!participantIds.includes(value.controllerId??''))problems.push('Choose the winning warband agreed to control Executioner’s Square.')
  if(participantIds.length>2&&!value.reason?.trim())problems.push('Record the horde’s agreement about which warband controls the square.')
 }
 return problems
}
export function gatheringControl(participantIds: string[], reports: {warbandId:string;result:string;status:string;reward?:GatheringReward}[]) {
 if(participantIds.some(id=>!reports.some(r=>r.warbandId===id&&r.status==='applied')))return {controller:undefined,warning:'Executioner’s Square: awaiting all battle reports before applying the horde reward.'}
 const applied=reports.filter(r=>r.status==='applied'&&participantIds.includes(r.warbandId))
 const winners=applied.filter(r=>r.result==='won')
 if(!winners.length)return {controller:undefined}
 if(applied.every(r=>r.reward?.ending==='rout'))return {controller:undefined}
 const endings=new Set(applied.map(r=>r.reward?.ending))
 const controllers=new Set(winners.map(r=>r.reward?.controllerId))
 const controller=winners[0].reward?.controllerId
 if(endings.size!==1||!['dirk','valnor'].includes(winners[0].reward?.ending??'')||controllers.size!==1||!winners.some(r=>r.warbandId===controller))return {controller:undefined,warning:'Executioner’s Square: the reports must agree on the defeated Horde Master and a winning warband to control the square.'}
 return {controller}
}

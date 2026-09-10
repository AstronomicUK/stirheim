import type { FoundItem } from './state'
export interface HuntersDraft {
  startingArtefacts?: number | null
  heldArtefacts?: number | null
  alive?: number | null
  liveCaptured?: number | null
  liveKept?: number | null
  deadRecovered?: number | null
  saleBasis?: 'each' | 'lot'
  saleReason?: string
  plantDice?: (number | null)[]
}
const valid=(n:number|null|undefined,min:number,max:number):n is number=>n!=null&&Number.isInteger(n)&&n>=min&&n<=max
export function huntersRewards(state:HuntersDraft, won:boolean, participantCount=6) {
 const out={gold:0,shards:0,items:[] as FoundItem[],notes:[] as string[],problems:[] as string[]}
 if(!valid(state.startingArtefacts,1,3))out.problems.push('Record the Beastmaster’s actual starting D3 artefact counters.')
 if(!valid(state.heldArtefacts,0,state.startingArtefacts??0))out.problems.push('Record the artefact counters your warband carried away, within the starting total.')
 else {out.shards=state.heldArtefacts;out.notes.push(`Beastmaster artefacts: ${state.heldArtefacts} of ${state.startingArtefacts} starting counters retained as shards.`)}
 const plants=state.plantDice??[]
 if(plants.length>participantCount*6)out.problems.push('Plant kills exceed the maximum number placed for the participants.')
 for(const [index,die] of plants.entries())if(!valid(die,1,6))out.problems.push(`Slain plant ${index+1}: enter its loot D6.`);else {out.gold+=die;out.notes.push(`Slain carnivorous plant ${index+1}: D6 ${die}, +${die} gc.`)}
 if(won) {
  if(!valid(state.alive,0,2))out.problems.push('Record how many of the two Cold Ones survived.')
  if(!valid(state.liveCaptured,0,state.alive??0))out.problems.push('Record your captured live Cold Ones, within the surviving total.')
  if(!valid(state.liveKept,0,state.liveCaptured??0))out.problems.push('Record how many captured Cold Ones you are keeping as mounts.')
  if(!valid(state.deadRecovered,0,2-(state.alive??2)))out.problems.push('Record how many dead Cold Ones you recovered, within the dead total.')
  if(valid(state.deadRecovered,0,2-(state.alive??2))) {out.gold+=state.deadRecovered*40;out.notes.push(`Recovered dead Cold Ones: ${state.deadRecovered} at 40 gc each.`)}
  if(valid(state.liveKept,0,state.liveCaptured??0)&&valid(state.liveCaptured,0,state.alive??0)){
   if(state.liveKept)out.items.push({item_rules_id:'cold_one',custom_name:null,quantity:state.liveKept})
   const sold=state.liveCaptured-state.liveKept
   if(sold===1){out.gold+=80;out.notes.push('Sold one live Cold One for 80 gc.')}
   else if(sold>1){
    if(!state.saleBasis||!state.saleReason?.trim())out.problems.push('Agree whether the printed 80 gc is per live Cold One or for the sold group, and record the ruling.')
    else {const gold=state.saleBasis==='each'?80*sold:80;out.gold+=gold;out.notes.push(`Sold ${sold} live Cold One(s): ${gold} gc (${state.saleBasis==='each'?'80 gc each':'80 gc for the sold group'}). Ruling: ${state.saleReason.trim()}`)}
   }
   out.notes.push(`Captured live Cold Ones: ${state.liveCaptured}; ${state.liveKept} retained as mounts. ${state.alive} alive for winning survivors’ experience.`)
  }
 } else out.notes.push('No winning-warband Cold One reward. Retained artefact counters and plant-kill loot are still recorded.')
 return out
}

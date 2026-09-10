import type { ReportApplied } from '../../../domain'
import type { ReportContext } from './derive'
import type { Participants } from './participants'
import type { ReportDraft } from './state'
export function pettyThief(draft:ReportDraft,ctx:ReportContext,participants:Participants) {
 const squire=participants.heroes.find(h=>h.unitTemplateId==='mazzalupo_squire'&&!draft.heroesOut.includes(h.id))
 const opponents=[...(ctx.opponents??[])].sort((a,b)=>a.id.localeCompare(b.id))
 const out={squire,opponents,problems:[] as string[],notes:[] as string[],transfer:undefined as ReportApplied['petty_thief']}
 if(!squire) return out
 const roll=draft.pettyThiefRoll
 if(!Number.isInteger(roll)||roll!<1||roll!>6){out.problems.push('Roll the surviving Squire’s Petty Thief D6.');return out}
 if(roll!<5){out.notes.push(`${squire.name}: Petty Thief D6 ${roll}, needed 5+; no shard stolen.`);return out}
 const selection=opponents.length===1?1:draft.pettyThiefSelection
 if(!opponents.length){out.problems.push('Load the opposing warbands before resolving Petty Thief.');return out}
 if(!Number.isInteger(selection)||selection!<1||selection!>opponents.length){out.problems.push('Randomly determine the opposing warband for Petty Thief.');return out}
 const target=opponents[selection!-1]
 out.transfer={target_id:target.id,roll:roll!,squire_id:squire.id,selection_roll:selection!}
 out.notes.push(`${squire.name}: Petty Thief D6 ${roll}; opposing warband selection ${selection} of ${opponents.length}: ${target.name}. Transfer one existing shard when the report is applied, or none if their reserve is empty.`)
 return out
}

import { Link } from 'react-router'
import type { WarbandDetail } from '../../../api/warbands'
import { findWarbandTemplate, findUnitTemplate } from '../../../rules/data/warbandTemplates'
import { collapsedWarbandReason, delayedLeaderRecruitmentBlock, delayedLeaderUnit } from '../../../rules/resolve/leaderReplacement'
import { Notice } from '../../../ui'
export function LeaderWaitingCard({detail,canEdit}:{detail:WarbandDetail;canEdit:boolean}) {
 const roster=detail.roster,unitId=delayedLeaderUnit(roster.warbandTemplateId)
 if(!canEdit||detail.warband.archived||!unitId||collapsedWarbandReason(roster)||roster.heroes.some(h=>h.unitTemplateId===unitId&&(h.status==='active'||h.status==='captured'))||!roster.heroes.some(h=>h.unitTemplateId===unitId&&h.status==='dead'))return null
 const template=findWarbandTemplate(roster.warbandTemplateId)!,name=findUnitTemplate(template,unitId)!.name
 const waiting=delayedLeaderRecruitmentBlock(roster,unitId)
 return <Notice title={waiting?`Waiting for a replacement ${name}`:`A new ${name} can now join`}>
   {waiting?<p>The warband must play one further game without this leader. Filing that game’s post-battle report completes the wait. An appointed temporary leader keeps their original profile.</p>:<><p>The waiting game is complete. Recruiting the replacement will end the temporary leader’s appointment.</p><Link className="mt-2 inline-block underline" to={`/warbands/${roster.id}/recruit`}>Recruit a replacement</Link></>}
 </Notice>
}

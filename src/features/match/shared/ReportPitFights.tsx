import {Link} from 'react-router'
import {useSession} from '../../../app/session'
import {useWarband} from '../../../api/warbands'
import type {ReportView} from '../../../api/reports'
import {pitFightsOwed} from '../../../rules/resolve/pitFight'
import {BUTTON_BASE,BUTTON_VARIANTS} from '../../../ui/buttonStyles'

/** Follow the applied roster, so an old report cannot keep asking for a resolved fight. */
export function ReportPitFights({report}:{report:ReportView}) {
  const ids=new Set(report.injuries.filter(h=>h.subjectType!=='group' && h.injuryCode==='sold_to_the_pits' && h.outcome==='injured').map(h=>h.subjectId))
  const query=useWarband(ids.size && report.status==='applied'?report.warband_id:undefined)
  const {user}=useSession()
  if(!ids.size || report.status==='returned')return null
  if(report.status==='pending')return <p className="border-t border-border px-4 py-3 text-sm text-ink">Pit fight waiting: the GM must apply this report first. Then resolve the fight from the warband screen before the warrior joins another battle.</p>
  if(query.isPending)return <p className="px-4 py-3 text-sm text-ink-dim">Checking outstanding pit fights…</p>
  if(query.isError)return <p className="px-4 py-3 text-sm text-ink-dim">Could not check the pit fight. <Link className="text-brass underline" to={`/warbands/${report.warband_id}`}>Open the warband</Link> to check it.</p>
  const owed=pitFightsOwed(query.data.roster).filter(h=>ids.has(h.heroId))
  if(!owed.length)return null
  return <div className="flex flex-col gap-2 border-t border-border bg-warn/10 px-4 py-3">
    <p className="text-sm font-medium text-ink">Resolve the pit fight before the next battle</p>
    {owed.map(h=><div key={h.heroId} className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span>{h.heroName} must fight a Pit Fighter.</span>
      {query.data.warband.owner_id===user?.id ? <Link className={`${BUTTON_BASE} ${BUTTON_VARIANTS.secondary}`} to={`/warbands/${report.warband_id}?pitFight=${encodeURIComponent(h.heroId)}`}>Resolve {h.heroName}’s fight</Link> : null}
    </div>)}
  </div>
}

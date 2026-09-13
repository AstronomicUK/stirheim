// One condensed line per dice moment of a filed report: an injury roll, the exploration dice, the
// veteran pool. Pure, so the combat log and the match page can share exactly the same wording.

import type { ReportView } from '../../../api/reports'

const OUTCOME_TEXT: Record<string, string> = {
  recovered: 'recovered',
  injured: 'injured',
  dead: 'dead',
  captured: 'captured',
  retired: 'retired',
}

export function postBattleRollLines(report: ReportView): string[] {
  const lines: string[] = []
  for (const line of report.injuries) {
    if (line.subjectType === 'group') {
      const survived = Math.max(0, line.rolls.length - line.dead - (line.repairCosts?.length??0))
      if(line.captured?.length)lines.push(`${line.subjectName}: ${line.captured.length} captured by Subjugator of Mankind without an injury roll.`)
      if(line.effect)lines.push(`${line.subjectName}: ${line.effect}`)
      if(line.rolls.length || !line.captured?.length)lines.push(`${line.subjectName}: rolled ${line.rolls.length > 0 ? line.rolls.join(', ') : 'nothing'} — ${line.dead} dead, ${survived} recovered.`)
    } else {
      lines.push(line.outcome==='captured'&&!line.rolls.length?`${line.subjectName}: captured without an injury roll — ${line.effect||line.injuryName}.`:`${line.subjectName}: rolled ${line.rolls.length > 0 ? line.rolls.join(', ') : 'nothing'} — ${line.injuryName} (${OUTCOME_TEXT[line.outcome] ?? line.outcome}).`)
      for(const event of line.rollHistory??[])lines.push(`${line.subjectName}: ${event}`)
    }
  }
  if (report.exploration) {
    const e = report.exploration
    const found = [e.shards > 0 ? `${e.shards} shard${e.shards === 1 ? '' : 's'}` : null, e.goldFound > 0 ? `${e.goldFound} gc` : null].filter(Boolean).join(', ')
    lines.push(`Exploration: rolled ${e.rolls.length > 0 ? e.rolls.join(' ') : 'nothing'} (total ${e.total})${e.locationName ? ` — ${e.locationName}` : ''}${found ? `, ${found} found` : ''}.`)
  }
  if (report.veteran_pool_roll !== null) lines.push(`Veteran pool: rolled ${report.veteran_pool_roll}.`)
  return lines
}

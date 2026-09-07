// The dice a filed report rolled — injuries, exploration, the veteran pool — condensed under one
// heading so the log reads as the whole battle, not just the attacks. Shown wherever the combat
// log lives, and again on the match page once a completed match takes the log itself off-screen.

import { useMatchReports } from '../../../api/reports'
import { Card, Section } from '../../roster/view/bits'
import { postBattleRollLines } from './postBattleLog'

export function PostBattleSequence({ matchId }: { matchId: string }) {
  const reports = useMatchReports(matchId)
  const groups = (reports.data ?? []).map((report) => ({ report, lines: postBattleRollLines(report) })).filter((g) => g.lines.length > 0)
  if (groups.length === 0) return null
  return (
    <Section title="Post battle sequence">
      <Card>
        <ul className="divide-y divide-border">
          {groups.map(({ report, lines }) => (
            <li key={report.id} className="flex flex-col gap-1 px-4 py-2.5">
              <span className="text-xs uppercase tracking-wider text-ink-dim">{report.warband_name}</span>
              {lines.map((line, i) => (
                <p key={`${report.id}-${i}`} className="text-sm text-ink">
                  {line}
                </p>
              ))}
            </li>
          ))}
        </ul>
      </Card>
    </Section>
  )
}

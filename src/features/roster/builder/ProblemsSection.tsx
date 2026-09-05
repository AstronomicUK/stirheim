import type { RosterProblem } from '../../../rules/resolve/roster'
import { groupProblems } from './helpers'

export interface ProblemsSectionProps {
  problems: RosterProblem[]
}

/** What still stands between the draft and "Create warband", bucketed by kind. */
export function ProblemsSection({ problems }: ProblemsSectionProps) {
  const groups = groupProblems(problems)
  return (
    <section className="flex flex-col gap-3" aria-live="polite">
      <div className="flex items-baseline justify-between">
        <h2 className="font-headline text-xl text-ink">Problems</h2>
        <span className="text-sm tabular-nums text-ink-dim">{problems.length}</span>
      </div>
      {groups.length === 0 ? (
        <p className="rounded-md border border-ok/60 bg-ok/10 px-4 py-3 text-sm text-ink-dim">Nothing outstanding. The warband is ready to create.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-md border border-warn/60 bg-surface-low">
          {groups.map((group) => (
            <div key={group.key} className="flex flex-col gap-1 px-4 py-3">
              <h3 className="text-xs uppercase tracking-wider text-warn">{group.title}</h3>
              <ul className="flex flex-col gap-1">
                {group.problems.map((problem, index) => (
                  <li key={`${problem.code}-${problem.subjectId ?? ''}-${index}`} className="text-sm leading-relaxed text-ink">
                    {problem.message}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

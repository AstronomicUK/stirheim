// One resolver call, one update_roster batch. Every recruitment action runs a src/rules/resolve
// function on the loaded RosterWarband, diffs the result against the loaded rows and sends the
// changes with reason 'recruitment'. RulesErrors (and network errors) become `error` for the
// calling sheet to show; nothing is thrown to the page.

import { useState } from 'react'
import { useUpdateRoster, type WarbandDetail } from '../../api/warbands'
import { diffRoster } from '../../domain/rosterDiff'
import type { Resolution, ResolutionEvent, RosterWarband } from '../../rules/types/roster'
import { errorMessage } from './helpers'

export interface Committed<T> {
  value: T
  events: ResolutionEvent[]
}

export function useCommit(detail: WarbandDetail) {
  const update = useUpdateRoster(detail.warband.id)
  const [error, setError] = useState<string | null>(null)

  /**
   * Run `resolve`, pick the warband out of its value, persist the diff. Returns the resolution on
   * success and null (with `error` set) otherwise.
   */
  async function commit<T>(resolve: () => Resolution<T>, warbandOf: (value: T) => RosterWarband, reason = 'recruitment'): Promise<Committed<T> | null> {
    setError(null)
    try {
      const { value, events } = resolve()
      const rows = { warband: detail.warband, heroes: detail.heroes, groups: detail.groups, items: detail.items }
      const changes = diffRoster(rows, warbandOf(value))
      await update.mutateAsync({ reason, changes })
      return { value, events }
    } catch (e) {
      setError(errorMessage(e, 'Could not update the roster.'))
      return null
    }
  }

  return { commit, error, clearError: () => setError(null), pending: update.isPending }
}

/** What a finished action tells the page, shown in a Notice above the tabs. */
export interface Outcome {
  tone: 'success' | 'warn'
  title: string
  lines: string[]
  /** Point at the trading post (new recruits arrive without equipment). */
  suggestTrading?: boolean
}

export function outcomeFrom(title: string, events: ResolutionEvent[], extra: Partial<Outcome> = {}): Outcome {
  return { tone: 'success', title, lines: events.map((e) => e.message), ...extra }
}

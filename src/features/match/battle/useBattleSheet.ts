// The working battle sheet: seeded from the server row, edited locally, autosaved after a short
// pause, flushed when the tab is hidden, and replaced by a newer server copy (another device)
// only while there are no pending edits. All decisions live in sheet.ts; this hook only wires
// them to React and the mutation.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSaveBattleSession } from '../../../api/matches'
import { emptyBattleLiveState, type BattleLiveState } from '../../../domain'
import { applyEdit, completeSave, initialSync, reconcileRemote, type RemoteSheet, type SheetSync } from './sheet'

export type SaveState =
  /** Editing is off (spectator, or the match is no longer in progress). */
  | 'readonly'
  /** Nothing has ever been saved and nothing is pending. */
  | 'clean'
  | 'pending'
  | 'saving'
  | 'saved'
  | 'failed'

export interface BattleSheetHandle {
  sheet: BattleLiveState
  /** Apply a pure edit; ignored when read-only. */
  edit: (fn: (sheet: BattleLiveState) => BattleLiveState) => void
  saveState: SaveState
  saveError: string | null
  retry: () => void
  /** Save now if anything is pending; resolves once the attempt finishes. */
  flush: () => Promise<void>
}

const DEBOUNCE_MS = 800

export function useBattleSheet(matchId: string, warbandId: string | null, remote: RemoteSheet | undefined, editable: boolean): BattleSheetHandle {
  const [sync, setSync] = useState<SheetSync>(() => initialSync(emptyBattleLiveState()))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const save = useSaveBattleSession(matchId, warbandId ?? '')
  const saveAsync = save.mutateAsync

  // Adopt a newer server copy while clean. Done during render (same-component state) so the first
  // paint after the row loads already shows it; reconcileRemote returns the same object when
  // there is nothing to adopt, so this settles immediately.
  const current = reconcileRemote(sync, remote)
  if (current !== sync) setSync(current)

  const syncRef = useRef(current)
  const savingRef = useRef(false)
  useEffect(() => {
    syncRef.current = current
  }, [current])

  const runSave = useCallback(async () => {
    const snapshot = syncRef.current
    if (!editable || !snapshot.dirty || savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setSaveError(null)
    const version = snapshot.version
    try {
      const updatedAt = await saveAsync(snapshot.sheet)
      setSync((s) => completeSave(s, version, updatedAt))
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save the sheet.')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }, [editable, saveAsync])

  // Debounced autosave. A failed save waits for a retry or the next edit rather than looping.
  useEffect(() => {
    if (!editable || !current.dirty || saving || saveError) return
    const timer = setTimeout(() => void runSave(), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [editable, current.dirty, current.version, saving, saveError, runSave])

  // Phones background the browser constantly; flush before the tab is frozen.
  useEffect(() => {
    if (!editable) return
    const onHide = () => {
      if (document.visibilityState === 'hidden') void runSave()
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onHide)
    }
  }, [editable, runSave])

  const edit = useCallback(
    (fn: (sheet: BattleLiveState) => BattleLiveState) => {
      if (!editable) return
      setSaveError(null)
      setSync((s) => applyEdit(s, fn(s.sheet)))
    },
    [editable],
  )

  const retry = useCallback(() => {
    setSaveError(null)
    void runSave()
  }, [runSave])

  const saveState: SaveState = !editable
    ? 'readonly'
    : saving
      ? 'saving'
      : saveError
        ? 'failed'
        : current.dirty
          ? 'pending'
          : current.syncedAt
            ? 'saved'
            : 'clean'

  return { sheet: current.sheet, edit, saveState, saveError, retry, flush: runSave }
}

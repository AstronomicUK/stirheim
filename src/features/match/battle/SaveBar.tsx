import { Button, Spinner } from '../../../ui'
import type { SaveState } from './useBattleSheet'

export interface SaveBarProps {
  saveState: SaveState
  saveError: string | null
  onRetry: () => void
  /** Hidden when the viewer may not end the battle. */
  onBattleOver?: () => void
}

function SaveStatus({ saveState, saveError, onRetry }: Pick<SaveBarProps, 'saveState' | 'saveError' | 'onRetry'>) {
  switch (saveState) {
    case 'readonly':
      return <span className="text-sm text-ink-dim">Read only</span>
    case 'clean':
      return <span className="text-sm text-ink-dim">Nothing to save yet</span>
    case 'pending':
      return <span className="text-sm text-ink-dim">Unsaved changes</span>
    case 'saving':
      return (
        <span className="inline-flex items-center gap-2 text-sm text-ink-dim">
          <Spinner size="sm" label="Saving" /> Saving
        </span>
      )
    case 'saved':
      return <span className="text-sm text-ok">Saved</span>
    case 'failed':
      return (
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm text-accent-strong">
            Save failed ·{' '}
            <button type="button" onClick={onRetry} className="underline underline-offset-4">
              Retry
            </button>
          </span>
          {saveError ? <span className="truncate text-xs text-ink-dim">{saveError}</span> : null}
        </span>
      )
  }
}

/** Pinned above the tab bar: how the sheet is doing, and the way out. */
export function SaveBar({ saveState, saveError, onRetry, onBattleOver }: SaveBarProps) {
  return (
    <div className="sticky bottom-[calc(3rem+env(safe-area-inset-bottom))] z-10 -mx-5 -mb-6 mt-auto flex items-center justify-between gap-3 border-t border-border bg-surface/95 px-5 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div role="status" aria-live="polite" className="min-w-0">
        <SaveStatus saveState={saveState} saveError={saveError} onRetry={onRetry} />
      </div>
      {onBattleOver ? (
        <Button variant="danger" onClick={onBattleOver}>
          Battle over
        </Button>
      ) : null}
    </div>
  )
}

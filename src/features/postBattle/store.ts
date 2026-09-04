// One persisted draft per match + warband, so "Continue later" survives a phone lock, a reload or
// a wander back to the match page. Every edit is a pure reducer from ./model applied through
// `update`; nothing derived is stored.

import { create, useStore } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { REPORT_DRAFT_VERSION, type ReportDraft } from './model'

export function reportStorageKey(matchId: string, warbandId: string): string {
  return `stirheim.report.${matchId}.${warbandId}`
}

export interface ReportStoreState {
  draft: ReportDraft | null
  /** ISO time of the last edit, for "picked up where you left off" copy. */
  savedAt: string | null
  /** Start from a seeded draft (only when there is none yet). */
  seed(draft: ReportDraft): void
  update(edit: (draft: ReportDraft) => ReportDraft): void
  discard(): void
}

function createReportStore(key: string) {
  return create<ReportStoreState>()(
    persist(
      (set, get) => ({
        draft: null,
        savedAt: null,
        seed: (draft) => {
          if (get().draft) return
          set({ draft, savedAt: null })
        },
        update: (edit) => {
          const current = get().draft
          if (!current) return
          const next = edit(current)
          if (next === current) return
          set({ draft: next, savedAt: new Date().toISOString() })
        },
        discard: () => set({ draft: null, savedAt: null }),
      }),
      {
        name: key,
        version: REPORT_DRAFT_VERSION,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ draft: state.draft, savedAt: state.savedAt }),
        // A draft from an older shape is dropped rather than guessed at.
        migrate: () => ({ draft: null, savedAt: null }),
      },
    ),
  )
}

type ReportStore = ReturnType<typeof createReportStore>

const stores = new Map<string, ReportStore>()

/** The store for one report, created on first use and kept for the life of the page. */
export function reportStore(matchId: string, warbandId: string): ReportStore {
  const key = reportStorageKey(matchId, warbandId)
  let store = stores.get(key)
  if (!store) {
    store = createReportStore(key)
    stores.set(key, store)
  }
  return store
}

/** Remove the persisted draft and forget the store, after filing or discarding. */
export function forgetReportStore(matchId: string, warbandId: string): void {
  const key = reportStorageKey(matchId, warbandId)
  const store = stores.get(key)
  if (store) {
    store.getState().discard()
    store.persist.clearStorage()
    stores.delete(key)
  } else {
    try {
      localStorage.removeItem(key)
    } catch {
      // Storage unavailable: nothing to clear.
    }
  }
}

export function useReportStore<T>(store: ReportStore, selector: (state: ReportStoreState) => T): T {
  return useStore(store, selector)
}

// One persisted draft per pending advance, so a refresh mid-roll keeps the dice (and the promoted
// hero's generated id). Same pattern as the post-battle wizard store: every edit is a pure
// function from ./model applied through `update`; nothing derived is stored.

import { create, useStore } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { ADVANCE_DRAFT_VERSION, type AdvanceDraft } from './model'

export function advanceStorageKey(advanceId: string): string {
  return `stirheim.advance.${advanceId}`
}

export interface AdvanceStoreState {
  draft: AdvanceDraft | null
  /** Start from an empty draft (only when there is none yet). */
  seed(draft: AdvanceDraft): void
  update(edit: (draft: AdvanceDraft) => AdvanceDraft): void
  discard(): void
}

function createAdvanceStore(key: string) {
  return create<AdvanceStoreState>()(
    persist(
      (set, get) => ({
        draft: null,
        seed: (draft) => {
          if (get().draft) return
          set({ draft })
        },
        update: (edit) => {
          const current = get().draft
          if (!current) return
          const next = edit(current)
          if (next !== current) set({ draft: next })
        },
        discard: () => set({ draft: null }),
      }),
      {
        name: key,
        version: ADVANCE_DRAFT_VERSION,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ draft: state.draft }),
        // A draft from an older shape is dropped rather than guessed at.
        migrate: () => ({ draft: null }),
      },
    ),
  )
}

export type AdvanceStore = ReturnType<typeof createAdvanceStore>

const stores = new Map<string, AdvanceStore>()

/** The store for one advance, created on first use and kept for the life of the page. */
export function advanceStore(advanceId: string): AdvanceStore {
  const key = advanceStorageKey(advanceId)
  let store = stores.get(key)
  if (!store) {
    store = createAdvanceStore(key)
    stores.set(key, store)
  }
  return store
}

/** Remove the persisted draft and forget the store, after the advance is confirmed or abandoned. */
export function forgetAdvanceStore(advanceId: string): void {
  const key = advanceStorageKey(advanceId)
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

export function useAdvanceStore<T>(store: AdvanceStore, selector: (state: AdvanceStoreState) => T): T {
  return useStore(store, selector)
}

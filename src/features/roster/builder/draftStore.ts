// The one warband draft in progress, persisted to localStorage so a phone lock, a reload or a
// wander off to another page does not lose an hour of shopping. Every edit is a pure function from
// rules/resolve/builder applied through `update`; a RulesError leaves the draft untouched and is
// surfaced as `lastError` for the screen to show.

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { newWarbandDraft, type WarbandDraft } from '../../../rules/resolve/builder'
import type { WarbandTemplate } from '../../../rules/types'

export const DRAFT_STORAGE_KEY = 'stirheim.draft'

export interface DraftState {
  draft: WarbandDraft | null
  /** ISO timestamp of the last edit, for "resume your draft" copy. */
  updatedAt: string | null
  /** Message from the last edit the builder refused (not persisted). */
  lastError: string | null
  /** Replace whatever is there with a fresh draft for `template`. */
  start(template: WarbandTemplate, name: string): void
  /** Replace whatever is there with a draft built elsewhere (from a saved template). */
  load(draft: WarbandDraft): void
  /** Apply a pure builder function to the current draft. No-op when there is no draft. */
  update(edit: (draft: WarbandDraft) => WarbandDraft): void
  clear(): void
  dismissError(): void
}

export const useDraftStore = create<DraftState>()(
  persist(
    (set, get) => ({
      draft: null,
      updatedAt: null,
      lastError: null,
      start: (template, name) =>
        set({ draft: newWarbandDraft(template, name), updatedAt: new Date().toISOString(), lastError: null }),
      load: (draft) => set({ draft, updatedAt: new Date().toISOString(), lastError: null }),
      update: (edit) => {
        const current = get().draft
        if (!current) return
        try {
          set({ draft: edit(current), updatedAt: new Date().toISOString(), lastError: null })
        } catch (err) {
          set({ lastError: err instanceof Error ? err.message : String(err) })
        }
      },
      clear: () => set({ draft: null, updatedAt: null, lastError: null }),
      dismissError: () => set({ lastError: null }),
    }),
    {
      name: DRAFT_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ draft: state.draft, updatedAt: state.updatedAt }),
    },
  ),
)

/** Fresh id for a hero or henchman group in the draft. */
export function newDraftId(): string {
  return crypto.randomUUID()
}

// Which of the reader's own warbands the battle sheet should treat as "My warband" (#206).
//
// One account can own both sides of a match (a GM running test warbands, a solo player). The page
// used to take whichever owned participant the API happened to list first, whatever warband the
// player had actually opened the battle from. The requested id now travels in the URL
// (`?warband=<id>`) so it survives a reload, and the picker falls back sensibly when it is
// missing or stale.

export const MY_WARBAND_PARAM = 'warband'

export interface OwnedParticipant {
  warband_id: string
  mine: boolean
}

/**
 * The owned participant to play as: the requested one when it is genuinely one of the reader's
 * own warbands in this match, otherwise the first owned participant, otherwise nothing.
 */
export function chooseMyWarband<T extends OwnedParticipant>(participants: readonly T[], requested: string | null | undefined): T | undefined {
  const owned = participants.filter((p) => p.mine)
  if (requested) {
    const hit = owned.find((p) => p.warband_id === requested)
    if (hit) return hit
  }
  return owned[0]
}

/** The battle-sheet path for a match, carrying the warband it was opened from when there is one. */
export function battleSheetPath(matchId: string, warbandId?: string | null): string {
  const base = `/matches/${matchId}/battle`
  return warbandId ? `${base}?${MY_WARBAND_PARAM}=${encodeURIComponent(warbandId)}` : base
}

// "Suggested, not forced": wherever the app works out a figure for the player (a price, a fee,
// a number of dice), they may use another one as long as they say why. The reason travels with
// the write, into the audit log's reason column for roster changes and into a report's
// adjustments for the post-battle wizard, so the record shows what was changed and why.

export interface Override {
  amount: number
  reason: string
}

/** "Price overridden: 10 gc → 5 gc (GM ruling)". */
export function overrideNote(label: string, suggested: string, used: string, reason: string): string {
  return `${label} overridden: ${suggested} → ${used} (${reason.trim() || 'no reason given'})`;
}

/** The audit reason for a roster write: the base reason, plus the override note when there is one. */
export function reasonWith(base: string, note: string | null | undefined): string {
  return note ? `${base} · ${note}` : base;
}

/** A usable override: a whole non-negative number and a reason. */
export function overrideReady(o: Override | null): o is Override {
  return o !== null && Number.isInteger(o.amount) && o.amount >= 0 && o.reason.trim() !== '';
}

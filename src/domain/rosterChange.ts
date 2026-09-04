// The change format update_roster (supabase/migrations/20260904000004_roster_functions.sql,
// re-created in 20260904000008_advances_trading.sql) accepts: one whitelisted row change per
// entry, applied atomically in order. Lives in the domain layer so both the manual editor's
// diff (src/features/roster/view/diff.ts) and the resolver bridge (./rosterDiff.ts) can build
// batches without importing the API module.

export type RosterTable = "warbands" | "heroes" | "henchman_groups" | "items";

export interface RosterChange {
  table: RosterTable;
  op: "insert" | "update" | "delete";
  /**
   * The row to update or delete. On `insert` (heroes, henchman_groups, items) an optional
   * client-generated uuid the new row will be given, so later changes in the same batch can
   * refer to it (an item's holder_id, say).
   */
  id?: string;
  data?: Record<string, unknown>;
}

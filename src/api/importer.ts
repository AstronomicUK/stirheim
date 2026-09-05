// Battle Records importer: the GM hands import_battle_records (migration 10) a list of historical
// matches and the database writes completed matches, participants and one summary report per
// participant. Rosters are never touched. The CSV parsing and column mapping that produce the
// payload are pure code in src/features/importer/model.ts.

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Json } from './database.types'
import { campaignKeys } from './campaigns'
import { matchKeys } from './matches'
import { reportKeys } from './reports'
import { supabase } from './supabase'

export interface ImportParticipantPayload {
  warband_id: string
  won: boolean
  result: 'won' | 'lost' | 'draw'
  xp_gained?: number | null
  casualties?: number | null
  shards?: number | null
  gold?: number | null
  veteran_pool?: number | null
  notes?: string
}

export interface ImportMatchPayload {
  /** A built-in scenario id (src/rules/data/campaign/scenarios.ts), or null to keep the name in notes. */
  scenario_rules_id?: string | null
  scenario_name?: string
  /** ISO timestamp; becomes scheduled_for, started_at and completed_at. */
  played_at: string
  notes?: string
  participants: ImportParticipantPayload[]
}

/** Runs the import in one transaction; resolves to the number of matches created. */
export async function importBattleRecords(campaignId: string, matches: ImportMatchPayload[]): Promise<number> {
  const { data, error } = await supabase.rpc('import_battle_records', { p_campaign_id: campaignId, p_matches: matches as unknown as Json })
  if (error) throw new Error(error.message)
  return data
}

export function useImportBattleRecords(campaignId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (matches: ImportMatchPayload[]) => importBattleRecords(campaignId, matches),
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: reportKeys.all }),
        qc.invalidateQueries({ queryKey: matchKeys.all }),
        qc.invalidateQueries({ queryKey: campaignKeys.all }),
      ]),
  })
}

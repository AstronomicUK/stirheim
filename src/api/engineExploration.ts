import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'
import { explorationRecordSchema } from '../domain/report'

/** Only explicitly recorded Engine rewards are offered, never an old report that already paid ordinary rewards. */
export function useEngineExplorationSources(warbandId: string | undefined) {
  return useQuery({ queryKey: ['engineExplorationSources', warbandId], enabled: Boolean(warbandId), refetchInterval: 30_000, queryFn: async () => {
    const { data, error } = await supabase.from('match_reports').select('id,match_id,exploration,submitted_at').eq('warband_id', warbandId!).not('undo', 'is', null).not('exploration->enginePrisoners', 'is', null).order('submitted_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data.flatMap(row => {
      const parsed = explorationRecordSchema.safeParse(row.exploration)
      if (!parsed.success) throw new Error('An Engine exploration record could not be read. Review the battle report before placing its captives.')
      const exploration = parsed.data
      return exploration.enginePrisoners && ['straggler','prisoners'].includes(exploration.locationId ?? '') ? [{ id: row.id, matchId: row.match_id, at: row.submitted_at, exploration, count: exploration.enginePrisoners.count }] : []
    })
  } })
}

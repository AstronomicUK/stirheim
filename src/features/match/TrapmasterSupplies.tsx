import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useWarband, warbandKeys } from '../../api/warbands'
import { supabase } from '../../api/supabase'
import { Button, Notice, SelectField } from '../../ui'
import { Card } from '../roster/view/bits'
import type { RosterHero } from '../../rules/types/roster'

export function TrapmasterSupplies({ warbandId, matchId, scheduled }: { warbandId: string; matchId: string; scheduled: boolean }) {
  const detail = useWarband(warbandId)
  if (!detail.data) return null
  return <>{detail.data.roster.heroes.filter(h => h.status === 'active' && h.unitTemplateId === 'lustrian_reavers_trapmaster').map(h => <TrapSupply key={h.id} hero={h} matchId={matchId} scheduled={scheduled} gold={detail.data!.roster.gold} />)}</>
}
function TrapSupply({ hero, matchId, scheduled, gold }: { hero: RosterHero; matchId: string; scheduled: boolean; gold: number }) {
  const stored = hero.flags.trapOrders?.[matchId] ?? 0
  const [extra, setExtra] = useState<number | null>(null)
  const selected = extra ?? stored
  const qc = useQueryClient()
  const action = useMutation({
    mutationFn: async () => {
      const result = scheduled ? await supabase.rpc('set_trap_order', { p_match_id: matchId, p_hero_id: hero.id, p_extra: selected }) : await supabase.rpc('use_trap_supply', { p_match_id: matchId, p_hero_id: hero.id })
      if (result.error) throw new Error(result.error.message)
    },
    onSuccess: async () => { setExtra(null); await qc.invalidateQueries({ queryKey: warbandKeys.all }) },
  })
  if (!scheduled && hero.flags.trapSupplyMatch !== matchId) return null
  return <Card className="flex flex-col gap-3 px-4 py-3">
    <p className="font-medium">{hero.name} — traps</p>
    {scheduled ? <>
      <p className="text-sm text-ink-dim">One trap is free each game. Reserve up to five extra at 5 gc each; gold is deducted when this battle starts.</p>
      <SelectField label={`${hero.name}: extra traps for this battle`} value={String(selected)} onChange={e => setExtra(Number(e.target.value))}>{[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} extra — {n * 5} gc ({n + 1} traps total)</option>)}</SelectField>
      <p className="text-xs text-ink-dim">Saved order: {stored} extra, {stored * 5} gc at battle start. Treasury: {gold} gc.</p>
      {selected * 5 > gold ? <Notice tone="warn">The treasury cannot currently cover this order. Reduce it or add funds before starting.</Notice> : null}
      <Button variant="secondary" pending={action.isPending} disabled={selected === stored} onClick={() => action.mutate()}>Save trap order</Button>
    </> : <>
      <p className="text-sm">{hero.flags.trapSupplyRemaining ?? 0} traps left from {1 + (hero.flags.trapSupplyBought ?? 0)} supplied.</p>
      <p className="text-xs text-ink-dim">Use one in the Shooting phase instead of shooting, never in melee. Place the real and false counters within 3 inches, at least 3 inches from other models. A sprung trap inflicts D3 S5 hits with no criticals.</p>
      <Button variant="secondary" pending={action.isPending} disabled={(hero.flags.trapSupplyRemaining ?? 0) < 1} onClick={() => action.mutate()}>Mark one trap used</Button>
    </>}
    {action.error ? <Notice tone="error">{action.error.message}</Notice> : null}
  </Card>
}

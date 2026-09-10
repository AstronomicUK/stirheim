import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../api/supabase'
import { Button, Notice, NumberField, TextField } from '../../../ui'
import { Section } from './bits'
export function PirateUpkeepCard({ warbandId, gold, enabled }: { warbandId: string; gold: number; enabled: boolean }) {
  const qc = useQueryClient()
  const [amount, setAmount] = useState<number | null>(20), [reason, setReason] = useState('')
  const query = useQuery({ queryKey: ['warbands', 'pirate-upkeep', warbandId], enabled, queryFn: async () => {
    const { data, error } = await supabase.rpc('pirate_upkeep_status', { p_warband_id: warbandId })
    if (error) throw new Error(error.message)
    return data as { due: boolean; match_id: string | null; amount: number }
  } })
  const pay = useMutation({ mutationFn: async () => {
    const { error } = await supabase.rpc('pay_pirate_upkeep', { p_warband_id: warbandId, p_amount: amount ?? 20, p_reason: reason })
    if (error) throw new Error(error.message)
  }, onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['warbands'] }); await qc.invalidateQueries({ queryKey: ['matches'] }) } })
  if (!enabled) return null
  if (query.error) return <Notice tone="error">Could not check Pirate upkeep: {query.error.message}</Notice>
  if (!query.data?.due) return null
  return <Section title="Pirate mixed-crew upkeep">
    <p className="text-sm">Keeping both Elves and Dwarfs costs an extra 20 gc once for the warband, on top of their individual upkeep. If you start the next battle without paying, the remaining Elf and Dwarf hired characters will leave. Dismissing all hires of either race removes this extra charge.</p>
    <details><summary className="cursor-pointer text-sm">Agreed payment override</summary><NumberField label="Mixed-crew upkeep amount" value={amount} allowEmpty onChange={setAmount} /><TextField label="Mixed-crew payment override reason" value={reason} onChange={e => setReason(e.target.value)} /></details>
    <Button pending={pay.isPending} disabled={amount === null || !Number.isInteger(amount) || amount < 0 || amount > gold || (amount !== 20 && !reason.trim())} onClick={() => pay.mutate()}>Pay mixed-crew upkeep — {amount ?? 20} gc</Button>
    {amount !== null && amount > gold ? <p className="text-sm text-ink-dim">Sell resources first, or dismiss one race’s hires before the next battle.</p> : null}
    {pay.error ? <Notice tone="error">{pay.error.message}</Notice> : null}
  </Section>
}

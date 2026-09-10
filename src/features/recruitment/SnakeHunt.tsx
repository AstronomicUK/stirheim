import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLatestReport } from '../../api/trading'
import { reportKeys, useMatchReports } from '../../api/reports'
import { supabase } from '../../api/supabase'
import { warbandKeys, type WarbandDetail } from '../../api/warbands'
import type { RosterHiredSword } from '../../rules/types/roster'
import { Button, DieField, Notice, SelectField, TextArea } from '../../ui'

export function SnakeHunt({ detail, charmer }: { detail: WarbandDetail; charmer: RosterHiredSword }) {
  const latest = useLatestReport(detail.warband.id)
  const reports = useMatchReports(latest.data?.match_id)
  const qc = useQueryClient()
  const [die, setDie] = useState<number | null>(null)
  const [danger, setDanger] = useState<number | null>(null)
  const [outcome, setOutcome] = useState('')
  const [rolls, setRolls] = useState('')
  const action = useMutation({
    mutationFn: async () => {
      const r = await supabase.rpc('hunt_snake', { p_warband_id: detail.warband.id, p_hero_id: charmer.id, p_match_id: latest.data!.match_id, p_die: die!, p_danger_die: danger, p_hit_outcome: outcome || null, p_hit_rolls: rolls || null })
      if (r.error) throw new Error(r.error.message)
      return r.data
    },
    onSuccess: async () => { await Promise.all([qc.invalidateQueries({ queryKey: warbandKeys.all }), qc.invalidateQueries({ queryKey: reportKeys.all })]) },
  })
  const report = reports.data?.find(r => r.warband_id === detail.warband.id)
  const count = detail.roster.hiredSwords.filter(s => s.status === 'active' && s.flags.hireCompanion && s.flags.hireGroupId === (charmer.flags.hireGroupId ?? charmer.id)).length
  if (latest.isPending || reports.isPending) return <p className="text-xs text-ink-dim">Checking Snake Hunter availability…</p>
  if (latest.error || reports.error) return <Notice tone="error">Could not check the latest battle for Snake Hunter.</Notice>
  if (!latest.data || !report) return <p className="text-xs text-ink-dim">Snake Hunter becomes available after a battle report is filed.</p>
  if (charmer.flags.snakeHuntAfter === latest.data.match_id) return <Notice tone="info" title="Snake Hunter resolved">{charmer.flags.snakeHuntLog}</Notice>
  if (report.ooa.some(o => o.subjectId === charmer.id && o.count > 0)) return <p className="text-xs text-ink-dim">Snake Hunter unavailable: the Charmer was out of action this battle.</p>
  const row = detail.heroes.find(h => h.id === charmer.id)
  if (row && row.created_at > latest.data.submitted_at) return <p className="text-xs text-ink-dim">This Charmer joined after the latest battle. Snake Hunter starts after their next game.</p>
  if (count >= 5) return <p className="text-xs text-ink-dim">The Charmer already controls the maximum five snakes.</p>
  const validDie = die !== null && Number.isInteger(die) && die >= 1 && die <= 6
  const caught = validDie && die! < charmer.stats.I
  const validDanger = danger !== null && Number.isInteger(danger) && danger >= 1 && danger <= 6
  const hit = validDie && !caught && danger === 1
  const ready = validDie && (caught || validDanger && (!hit || !!outcome && !!rolls.trim()))
  return <details><summary className="cursor-pointer py-2 text-sm text-brass">Snake Hunter — {count} of 5 snakes</summary><div className="flex flex-col gap-3 py-3">
    <p className="text-sm text-ink-dim">Once after this game, roll under Initiative {charmer.stats.I} to catch one snake. A failed attempt needs a danger roll; on 1 the Charmer suffers a Strength 3 hit.</p>
    <DieField label="Snake Hunter D6" sides={6} rollable value={die} onChange={v => { setDie(v); setDanger(null); setOutcome(''); setRolls('') }} />
    {validDie && !caught ? <DieField label="Snake Hunter danger D6" sides={6} rollable value={danger} onChange={v => { setDanger(v); setOutcome(''); setRolls('') }} /> : null}
    {caught ? <p className="text-sm">Caught a snake. It will join the Charmer’s companions, with no hire fee.</p> : null}
    {hit ? <Notice tone="warn" title="Resolve a Strength 3 hit">
      <p>Resolve the hit using the Charmer’s current Toughness, saves and Wounds. If taken out of action, roll the hired-sword injury D6: 1–2 lost, 3–6 survives. Record all relevant dice below.</p>
      <SelectField label="Snake Hunter hit outcome" value={outcome} onChange={e => setOutcome(e.target.value)}><option value="">Choose the resolved outcome</option><option value="recovered">No lasting harm — Charmer survives</option><option value="lost">Charmer lost — remaining snakes leave</option></SelectField>
      <TextArea label="Snake Hunter hit and injury dice" value={rolls} onChange={e => setRolls(e.target.value)} placeholder="To wound, any saves, injury and recovery dice, with their results" />
    </Notice> : null}
    <Button variant="secondary" pending={action.isPending} disabled={!ready} onClick={() => action.mutate()}>Record Snake Hunter</Button>
    {action.error ? <Notice tone="error">{action.error.message}</Notice> : null}
  </div></details>
}

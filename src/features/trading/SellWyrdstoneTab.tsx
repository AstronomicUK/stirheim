import { useState } from 'react'
import { WARBAND_SIZE_BANDS, warbandSizeBandIndex } from '../../rules/data/campaign/income'
import { hasMasterChef, incomeSize, sellWyrdstone, wyrdstoneQuote } from '../../rules/resolve/income'
import { Button, Notice, Stepper, DicePicker } from '../../ui'
import { Card, KeyValue } from '../roster/view/bits'
import type { TradeContext } from './useTrade'
import { useMatch } from '../../api/matches'
import { useSession } from '../../app/session'
import { useMasterChef, saveMasterChef } from '../../api/trading'
import { useQueryClient } from '@tanstack/react-query'

export function SellWyrdstoneTab({ trade }: { trade: TradeContext }) {
  const { roster, phase, canTrade, pending, run } = trade
  const user = useSession(s => s.user)
  const lastMatch = useMatch(phase.matchId ?? undefined, user?.id)
  const burning = lastMatch.data?.scenario_rules_id === 'mordheim_s_burning'
  const chefRequired = hasMasterChef(roster)
  const chef = useMasterChef(roster.id, phase.matchId, chefRequired)
  const [chefPending, setChefPending] = useState(false)
  const [chefError, setChefError] = useState('')
  const [correcting, setCorrecting] = useState(false)
  const [correction, setCorrection] = useState('')
  const qc = useQueryClient()
  async function recordChef(values: number[], manual: boolean) {
    setChefPending(true); setChefError('')
    try {
      await saveMasterChef(roster.id, phase.matchId, values[0], manual, crypto.randomUUID(), correcting ? chef.data?.revision : undefined, correcting ? correction : '')
      setCorrecting(false); setCorrection('')
      await qc.invalidateQueries({queryKey:['trading','master-chef',roster.id]})
      await qc.invalidateQueries({queryKey:['warbands']})
      await qc.invalidateQueries({queryKey:['campaigns']})
    } catch(e) { setChefError(e instanceof Error ? e.message : 'Could not save the Cook roll'); await chef.refetch() }
    finally { setChefPending(false) }
  }
  const shards = roster.wyrdstone
  const [count, setCount] = useState(shards)
  const [seenShards, setSeenShards] = useState(shards)
  // Follow the treasury after a sale (or another device's edit) without fighting the stepper.
  if (shards !== seenShards) {
    setSeenShards(shards)
    setCount(shards)
  }

  const selling = Math.min(Math.max(count, 0), shards)
  const sizing = incomeSize(roster, {masterChefRoll: chef.data?.roll})
  const size = sizing.size
  const bandIndex = Math.max(0, Math.min(WARBAND_SIZE_BANDS.length - 1, warbandSizeBandIndex(size) + sizing.bandShift))
  const saleOpts = { masterChefRoll: chef.data?.roll, ...(trade.perks?.wyrdstoneSaleBonus ? { bonusRate: trade.perks.wyrdstoneSaleBonus, bonusSource: trade.perks.wyrdstoneSaleSource?.districtName } : {}), scenarioMultiplier: burning ? 3 as const : undefined }
  const income = wyrdstoneQuote(roster, selling, saleOpts)
  const activeHiredSwords = roster.hiredSwords.filter((s) => s.status === 'active').length
  const soldAlready = phase.wyrdstoneSold || Boolean(chef.data?.sold)
  const disabled = chefPending || correcting || (chefRequired && (!chef.data || chef.isPending || chef.isError)) || !canTrade || soldAlready || shards === 0 || selling < 1 || Boolean(phase.matchId && (lastMatch.isPending || lastMatch.error))

  async function confirm() {
    const result = sellWyrdstone(roster, selling, saleOpts)
    await run(() => result.value, { wyrdstoneSold: true, reason: result.events.map(e => e.message).join(' '), sale: { gold: roster.gold, shards, chefRevision: chefRequired ? chef.data?.revision : undefined } })
  }

  return (
    <div className="flex flex-col gap-4">
      {lastMatch.error ? <Notice tone="error">Could not check the last scenario’s income rules. {lastMatch.error.message}</Notice> : null}
      {burning ? <Notice title="Mordheim’s Burning">This post-battle sequence pays triple wyrdstone income. The quote below includes it.</Notice> : null}
      <Card className="grid grid-cols-3 gap-y-4 px-4 py-3">
        <KeyValue label="Shards held" value={shards} />
        <KeyValue label="Warband size" value={size} />
        <KeyValue label="Income band" value={WARBAND_SIZE_BANDS[bandIndex]} />
      </Card>
      <p className="text-sm leading-relaxed text-ink-dim">
        Income depends on how many shards you sell at once and how many warriors the warband must feed: active heroes and every henchman.
        {activeHiredSwords > 0 ? ` Hired swords (${activeHiredSwords}) are not counted.` : ''}
        {trade.perks?.wyrdstoneSaleBonus ? ` ${trade.perks.wyrdstoneSaleSource?.districtName}: +${Math.round(trade.perks.wyrdstoneSaleBonus * 100)}% on the sale, rounded down (map advantage).` : ''}
      </p>

      {chefRequired && !soldAlready && shards > 0 && <Card className="flex flex-col gap-3 px-4 py-4">
        <h3 className="font-semibold">Master Chef · 5+ to save on food</h3>
        <p className="text-sm text-ink-dim">Roll one D6 before selling. On 5+, use one smaller income band. This result is saved for the sequence.</p>
        {chef.isPending ? <p>Loading saved roll…</p> : chef.isError ? <Notice tone="error">Could not load the Cook roll. <button onClick={() => void chef.refetch()}>Try again</button></Notice> : chef.data && !correcting ? <>
          <p>Rolled {chef.data.roll} · {chef.data.roll >= 5 ? 'Success — one smaller income band' : 'No bonus — normal income band'}</p>
          <button className="text-left text-sm underline" disabled={!canTrade || pending || chefPending} onClick={() => setCorrecting(true)}>Correct recorded roll</button>
        </> : <>
          {correcting && <label className="text-sm">Reason for correction<input className="mt-1 w-full rounded border border-border p-2" value={correction} onChange={e => setCorrection(e.target.value)} /></label>}
          <DicePicker label="Master Chef" count={1} resetKey={`${phase.matchId}:${chef.data?.revision}:${correcting}`} disabled={!canTrade || pending || chefPending || (correcting && correction.trim().length < 3)} onComplete={(values,manual) => void recordChef(values,manual)} />
          {correcting && <button disabled={chefPending} className="text-left text-sm underline" onClick={() => setCorrecting(false)}>Cancel correction</button>}
        </>}
        {chefError && <Notice tone="error">{chefError}</Notice>}
      </Card>}
      {soldAlready ? (
        <Notice tone="warn" title="Already sold this sequence">
          Wyrdstone can only be sold once per post-battle sequence. File the next battle report to sell again.
        </Notice>
      ) : shards === 0 ? (
        <Notice tone="info">The warband holds no wyrdstone.</Notice>
      ) : (
        <Card className="flex flex-col gap-4 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-ink">Shards to sell</span>
            <Stepper label="shards to sell" value={selling} min={1} max={shards} onChange={setCount} disabled={!canTrade} />
          </div>
      {sizing.notes.length > 0 ? (
        <p className="text-xs text-ink-dim">
          Counted as {size} ({sizing.headCount} warriors): {sizing.notes.map(note => note.replace(/\.$/, '')).join('; ')}.
        </p>
      ) : null}
          <div className="flex items-baseline justify-between gap-3 border-t border-border pt-3">
            <span className="text-sm text-ink-dim">You would receive</span>
            <span className="text-2xl tabular-nums text-ink">{income} gc</span>
          </div>
          {selling < shards && phase.matchId !== null ? (
            <p className="text-xs text-ink-dim">
              The remaining {shards - selling} {shards - selling === 1 ? 'shard stays' : 'shards stay'} in the treasury, but you cannot sell again until the next battle.
            </p>
          ) : null}
          <Button block pending={pending} disabled={disabled} onClick={confirm}>
            Sell {selling} {selling === 1 ? 'shard' : 'shards'} for {income} gc
          </Button>
        </Card>
      )}
    </div>
  )
}

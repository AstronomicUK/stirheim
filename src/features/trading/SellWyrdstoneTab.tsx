import { useState } from 'react'
import { effectiveWarbandSize, sellWyrdstone, wyrdstoneQuote } from '../../rules/resolve/income'
import { Button, Notice, Stepper } from '../../ui'
import { Card, KeyValue } from '../roster/view/bits'
import { sizeBandLabel } from './helpers'
import type { TradeContext } from './useTrade'

export function SellWyrdstoneTab({ trade }: { trade: TradeContext }) {
  const { roster, phase, canTrade, pending, run } = trade
  const shards = roster.wyrdstone
  const [count, setCount] = useState(shards)
  const [seenShards, setSeenShards] = useState(shards)
  // Follow the treasury after a sale (or another device's edit) without fighting the stepper.
  if (shards !== seenShards) {
    setSeenShards(shards)
    setCount(shards)
  }

  const selling = Math.min(Math.max(count, 0), shards)
  const size = effectiveWarbandSize(roster)
  const income = wyrdstoneQuote(roster, selling)
  const activeHiredSwords = roster.hiredSwords.filter((s) => s.status === 'active').length
  const soldAlready = phase.wyrdstoneSold
  const disabled = !canTrade || soldAlready || shards === 0 || selling < 1

  async function confirm() {
    await run(() => sellWyrdstone(roster, selling).value, { wyrdstoneSold: true })
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="grid grid-cols-3 gap-y-4 px-4 py-3">
        <KeyValue label="Shards held" value={shards} />
        <KeyValue label="Warband size" value={size} />
        <KeyValue label="Income band" value={sizeBandLabel(size)} />
      </Card>
      <p className="text-sm leading-relaxed text-ink-dim">
        Income depends on how many shards you sell at once and how many warriors the warband must feed: active heroes and every henchman.
        {activeHiredSwords > 0 ? ` Hired swords (${activeHiredSwords}) are not counted.` : ''}
      </p>

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
          <div className="flex items-baseline justify-between gap-3 border-t border-border pt-3">
            <span className="text-sm text-ink-dim">You would receive</span>
            <span className="font-mono text-2xl tabular-nums text-ink">{income} gc</span>
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

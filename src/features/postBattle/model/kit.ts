// Kit after the battle (Phase 17, audit A5): drugs and poisons that were taken carry a roll once
// the fighting is over (Crimson Shade addiction, Mandrake Root's Toughness, Mad Cap stupidity,
// tainted Hardtack), a leader's silk clothes may be ruined when he went down, a Treasure Map leads
// somewhere, and a Lamp or a Monkey's Paw grants wishes. Every prompt comes from the item rules
// overlay (data/itemRules/effects.ts `postBattle`); this module lists which prompts a report owes,
// reads the dice the player entered and says what each outcome does to the roster.

import { findItem } from '../../../rules/data/items'
import { itemEffect, type PostBattleOutcome, type PostBattlePrompt } from '../../../rules/data/itemRules'
import type { RosterHero, RosterWarband } from '../../../rules/types/roster'
import type { StatKey } from '../../../rules/types/common'
import type { ReportDraft } from './state'

export interface KitPromptInstance {
  /** Unique per report: `${itemId}:${holderId}:${prompt.key}`. */
  key: string
  itemId: string
  itemName: string
  /** The hero the item belongs to (the stash for warband-wide items). */
  holderId: string | null
  holderName: string
  prompt: PostBattlePrompt
  /** Faces entered so far. */
  rolls: (number | null)[]
  /** The outcome once every die is in. */
  outcome: PostBattleOutcome | null
  /** Faces for the outcome's own dice (gold expressions), when it has any. */
  extraRolls: (number | null)[]
  /** Everything rolled; false while a die is missing (optional prompts count as complete when untouched). */
  complete: boolean
  /** What the outcome does, in plain words, once resolved. */
  summary: string | null
}

export interface KitDerived {
  prompts: KitPromptInstance[]
  /** Prompts still owed. */
  pending: number
}

export interface KitContext {
  roster: RosterWarband
  /** Warrior id -> item ids marked as used on the battle sheet. */
  itemsUsed: Record<string, string[]>
  /** Heroes taken out of action this battle. */
  heroesOut: ReadonlySet<string>
  leaderId: string | null
}

function diceCount(dice: PostBattlePrompt['dice']): number {
  return dice === '2D6' ? 2 : 1
}

export function outcomeFor(prompt: PostBattlePrompt, rolls: readonly (number | null)[]): PostBattleOutcome | null {
  if (rolls.length < diceCount(prompt.dice) || rolls.some((r) => r === null)) return null
  const total = rolls.reduce<number>((n, r) => n + (r ?? 0), 0)
  return prompt.outcomes.find((o) => total >= o.min && total <= o.max) ?? null
}

/** Gold an outcome pays once its own dice are rolled: `count` dice of `sides`, times `perPoint`. */
export function outcomeGold(outcome: PostBattleOutcome, extraRolls: readonly (number | null)[]): number | null {
  const gold = outcome.effect?.gold
  if (gold === undefined) return 0
  if (typeof gold === 'number') return gold
  if (extraRolls.length < gold.dice || extraRolls.some((r) => r === null)) return null
  return extraRolls.reduce<number>((n, r) => n + (r ?? 0), 0) * gold.perPoint
}

export function summarise(itemName: string, holderName: string, outcome: PostBattleOutcome, gold: number | null): string {
  const bits: string[] = []
  const e = outcome.effect
  if (e?.statDelta) for (const [k, v] of Object.entries(e.statDelta)) bits.push(`${v > 0 ? '+' : ''}${v} ${k} for ${holderName}`)
  if (e?.flag === 'stupidity') bits.push(`${holderName} becomes subject to Stupidity`)
  if (e?.flag === 'missNextGame') bits.push(`${holderName} misses the next game`)
  if (e?.flag === 'addicted') bits.push(`${holderName} is addicted to ${itemName}: buy a new batch before every battle or he leaves`)
  if (e?.removeItem) bits.push(`${itemName} is lost`)
  if (gold !== null && gold !== 0) bits.push(`${gold > 0 ? '+' : ''}${gold} gc`)
  if (e?.shards) bits.push(`+${e.shards} shard${e.shards === 1 ? '' : 's'}`)
  if (e?.xp) bits.push(`${e.xp > 0 ? '+' : ''}${e.xp} xp for ${holderName}`)
  return bits.length ? bits.join('; ') : 'No lasting effect.'
}

/** Every prompt this report owes, with what has been rolled so far. */
export function deriveKit(draft: ReportDraft, ctx: KitContext): KitDerived {
  const prompts: KitPromptInstance[] = []
  const heroes = new Map(ctx.roster.heroes.filter((h) => h.status === 'active').map((h) => [h.id, h]))
  const add = (itemId: string, holderId: string | null, holderName: string, prompt: PostBattlePrompt) => {
    const key = `${itemId}:${holderId ?? 'stash'}:${prompt.key}`
    const rolls = draft.kit[key] ?? []
    const outcome = outcomeFor(prompt, rolls)
    const extraRolls = draft.kitExtra[key] ?? []
    const gold = outcome ? outcomeGold(outcome, extraRolls) : null
    const complete = prompt.optional && rolls.every((r) => r === null) ? true : outcome !== null && gold !== null
    prompts.push({
      key,
      itemId,
      itemName: findItem(itemId)?.name ?? itemId,
      holderId,
      holderName,
      prompt,
      rolls,
      outcome,
      extraRolls,
      complete,
      summary: outcome ? summarise(findItem(itemId)?.name ?? itemId, holderName, outcome, gold) : null,
    })
  }

  // Items marked as used this battle.
  for (const [holderId, itemIds] of Object.entries(ctx.itemsUsed)) {
    const hero = heroes.get(holderId)
    if (!hero) continue
    for (const itemId of new Set(itemIds)) {
      for (const prompt of itemEffect(itemId)?.postBattle ?? []) if (prompt.trigger === 'used') add(itemId, hero.id, hero.name, prompt)
    }
  }
  // Items carried whose rule fires on the leader going down.
  for (const hero of heroes.values()) {
    for (const entry of hero.equipment) {
      if (!entry.itemId) continue
      for (const prompt of itemEffect(entry.itemId)?.postBattle ?? []) {
        if (prompt.trigger === 'leaderOutOfAction' && hero.id === ctx.leaderId && ctx.heroesOut.has(hero.id)) add(entry.itemId, hero.id, hero.name, prompt)
      }
    }
  }
  return { prompts, pending: prompts.filter((p) => !p.complete).length }
}

/** The roster effects of every resolved prompt, grouped for the report builder. */
export interface KitEffects {
  heroPatches: { heroId: string; statDelta?: Partial<Record<StatKey, number>>; flag?: 'stupidity' | 'missNextGame' | 'addicted'; itemId: string }[]
  /** Item rows to remove (by item id on the holder). */
  removeItems: { holderId: string | null; itemId: string }[]
  goldDelta: number
  shardsDelta: number
  lines: string[]
}

export function kitEffects(kit: KitDerived): KitEffects {
  const out: KitEffects = { heroPatches: [], removeItems: [], goldDelta: 0, shardsDelta: 0, lines: [] }
  for (const p of kit.prompts) {
    if (!p.outcome || !p.complete) continue
    const e = p.outcome.effect
    const gold = outcomeGold(p.outcome, p.extraRolls) ?? 0
    out.lines.push(`${p.itemName} (${p.holderName}): rolled ${p.rolls.join('+')}: ${p.outcome.text}${p.summary && p.summary !== 'No lasting effect.' ? ` [${p.summary}]` : ''}`)
    if (!e) continue
    if (p.holderId && (e.statDelta || e.flag)) out.heroPatches.push({ heroId: p.holderId, statDelta: e.statDelta, flag: e.flag, itemId: p.itemId })
    if (e.removeItem) out.removeItems.push({ holderId: p.holderId, itemId: p.itemId })
    out.goldDelta += gold
    out.shardsDelta += e.shards ?? 0
  }
  return out
}

/** Apply a stat delta to a hero, never below 1 (a Toughness of 0 is death, handled by Nurgle's Rot only). */
export function applyStatDelta(hero: RosterHero, delta: Partial<Record<StatKey, number>>): RosterHero['stats'] {
  const stats = { ...hero.stats }
  for (const [k, v] of Object.entries(delta) as [StatKey, number][]) stats[k] = Math.max(1, stats[k] + v)
  return stats
}

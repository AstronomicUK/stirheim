import { unitRules } from '../../../rules/data/campaignRules'
import {absentGroupModels} from '../../../rules/resolve/groupAbsences'
// Pure helpers behind the battle sheet: who is fighting, tally edits, the rout warning, and the
// decision of when to adopt a sheet that arrived from the server (another device). No React, no
// network, so it is unit-tested in node.

import type { TakenOutBy, BattleEventRow, BattleLiveState, BattleWarriorTally } from '../../../domain'
import type { BattlePrompt } from '../../../api/matches'
import { battleTotals, routThreshold, tallyFor, withTally } from '../../../domain'
import type { RosterHenchmanGroup, RosterHero, RosterHiredSword, RosterItem, RosterWarband } from '../../../rules/types/roster'
import { animalFighters, isAnimalId, parseAnimalId, ANIMAL_KINDS, type AnimalFighter } from '../../../rules/resolve/animals'

// ---------------------------------------------------------------------------------------------
// Who fights
// ---------------------------------------------------------------------------------------------

/** A hero or hired sword as the sheet sees them: both are tallied per model. */
export type SheetWarrior = { role: 'hero'; warrior: RosterHero } | { role: 'hiredSword'; warrior: RosterHiredSword }

/**
 * Warrior ids benched for this one battle by a failed Old Battle Wound roll — read from the
 * pre-battle record, which is the only place that roll's outcome lives. Unlike `missNextGames`
 * (a standing condition on the roster) this applies to this game alone and leaves no other trace.
 */
export function benchedByOldWound(sheet: BattleLiveState): Set<string> {
  const ids = new Set<string>()
  for (const [key, outcome] of Object.entries(sheet.preBattle)) {
    if (key.startsWith('oldWound:') && outcome.startsWith('flares up')) ids.add(key.slice('oldWound:'.length))
  }
  return ids
}

/** Why a warrior sits this one out, or null when they fight. `benched` is this game's Old Battle Wound roll, if any. */
export function notFightingReason(warrior: RosterHero | RosterHiredSword, benched = false): string | null {
  switch (warrior.status) {
    case 'dead':
      return 'Dead'
    case 'retired':
      return 'Retired'
    case 'captured':
      return 'Captured'
    case 'left':
      return 'Left the warband'
    case 'active':
      break
  }
  if ((warrior.flags.missNextGames ?? 0) > 0) return 'Misses this game'
  if (benched) return 'Old battle wound flared up'
  return null
}

export function isFighting(warrior: RosterHero | RosterHiredSword, benched = false): boolean {
  return notFightingReason(warrior, benched) === null
}

export interface SheetWarriors {
  fighting: SheetWarrior[]
  notFighting: { entry: SheetWarrior; reason: string }[]
}

/**
 * Heroes first, then hired swords, each split into those on the table and those sitting out.
 * `sheet`, when given, also benches anyone whose Old Battle Wound flared up before this battle.
 */
export function splitWarriors(roster: RosterWarband, sheet?: BattleLiveState): SheetWarriors {
  const entries: SheetWarrior[] = [
    ...roster.heroes.map((warrior): SheetWarrior => ({ role: 'hero', warrior })),
    ...roster.hiredSwords.map((warrior): SheetWarrior => ({ role: 'hiredSword', warrior })),
  ]
  const benched = sheet ? benchedByOldWound(sheet) : undefined
  const out: SheetWarriors = { fighting: [], notFighting: [] }
  for (const entry of entries) {
    const reason = notFightingReason(entry.warrior, benched?.has(entry.warrior.id))
    if (reason === null) out.fighting.push(entry)
    else out.notFighting.push({ entry, reason })
  }
  return out
}

/** Groups with at least one model; a wiped-out group is kept on the roster for history only. */
export function fightingGroups(roster: RosterWarband): RosterHenchmanGroup[] {
  return roster.henchmenGroups.filter((g) => g.size > 0 && !g.campaignState?.fanaticSittingOut).map(g=>{const absent=absentGroupModels(g);return absent?{...g,rosterSize:g.size,size:g.size-absent}:g}).filter(g=>g.size>0)
}

/** Animals (Wardogs, Gnoblar Fighters) brought by fighting heroes; each is a model on the table. */
export function animalsFighting(roster: RosterWarband): AnimalFighter[] {
  const fighting = new Set(splitWarriors(roster).fighting.filter((e) => e.role === 'hero').map((e) => e.warrior.id))
  return animalFighters(roster, (h) => fighting.has(h.id))
}

/** Models this warband put on the table: fighting heroes and hired swords plus every henchman, and the animals that count for rout tests. */
export function startingModels(roster: RosterWarband, sheet?: BattleLiveState): number {
  const warriors = splitWarriors(roster, sheet).fighting.length
  return warriors + fightingGroups(roster).reduce((n, g) => n + g.size, 0) + animalsFighting(roster).filter((a) => a.kind.countsForRout).length
}

/** Collective Rout units may be split across roster rows; pool by unit type. */
function routCollectives(roster: RosterWarband, state?: BattleLiveState): Map<string, { size: number; out: number }> {
  const pools = new Map<string, { size: number; out: number }>()
  for (const group of fightingGroups(roster)) {
    if (!unitRules(group.unitTemplateId).routCollective) continue
    const pool = pools.get(group.unitTemplateId) ?? { size: 0, out: 0 }
    pool.size += group.size
    pool.out += state ? Math.min(group.size, groupOut(state, group.id)) : 0
    pools.set(group.unitTemplateId, pool)
  }
  return pools
}

export function routStartingModels(roster: RosterWarband, state?: BattleLiveState): number {
  let models = startingModels(roster, state)
  for (const group of fightingGroups(roster)) models -= group.size * (1 - (unitRules(group.unitTemplateId).routModelWeight ?? 1))
  for (const pool of routCollectives(roster).values()) models -= pool.size - 1
  return models
}

/** Round a quarter up to a reachable casualty count, including half-model units. */
export function rosterRoutThreshold(roster: RosterWarband, state?: BattleLiveState): number {
  const step = fightingGroups(roster).some(g => unitRules(g.unitTemplateId).routCasualtyWeight === 0.5) ? 0.5 : 1
  return Math.ceil(routStartingModels(roster, state) / 4 / step) * step
}

/** Out-of-action tallies of animals that never count for rout tests (Gnoblars). */
function insignificantOut(state: BattleLiveState): number {
  return state.tallies.reduce((n, t) => {
    if (!isAnimalId(t.id)) return n
    const parsed = parseAnimalId(t.id)
    const kind = parsed ? ANIMAL_KINDS[parsed.itemId] : undefined
    return kind && !kind.countsForRout ? n + t.outOfAction : n
  }, 0)
}

/** Weighted casualties for Rout tests, kept separate from actual casualty totals. */
export function routCasualties(state: BattleLiveState, roster?: RosterWarband): number {
  let count = battleTotals(state).ownOutOfAction - insignificantOut(state)
  for (const group of roster?.henchmenGroups ?? []) {
    const weight = unitRules(group.unitTemplateId).routCasualtyWeight ?? 1
    count -= groupOut(state, group.id) * (1 - weight)
  }
  if (roster) for (const pool of routCollectives(roster, state).values()) {
    count -= pool.out
    if (pool.out >= pool.size) count += 1
  }
  return Math.max(0, count)
}

/** Per-model equipment: divide group totals by size where it divides evenly. */
export function perModelKit(items: RosterItem[], size: number): { items: RosterItem[]; exact: boolean } {
  if (size <= 1) return { items, exact: true }
  const exact = items.every((i) => i.quantity % size === 0)
  if (!exact) return { items, exact: false }
  return { items: items.map((i) => ({ ...i, quantity: i.quantity / size })), exact: true }
}

// ---------------------------------------------------------------------------------------------
// Tally edits (each returns a new state and stamps editedAt)
// ---------------------------------------------------------------------------------------------

function baseTally(state: BattleLiveState, id: string, kind: BattleWarriorTally['kind']): BattleWarriorTally {
  return tallyFor(state, id) ?? { id, kind, enemiesOutOfAction: 0, outOfAction: 0, woundsLost: 0, note: '' }
}

export function woundsLost(state: BattleLiveState, id: string): number {
  return tallyFor(state, id)?.woundsLost ?? 0
}

/** Wounds a multi-Wound model has lost so far, clamped to 0..W. Carries over between turns. */
export function setWoundsLost(state: BattleLiveState, id: string, kind: BattleWarriorTally['kind'], count: number, wounds: number): BattleLiveState {
  const tally = baseTally(state, id, kind)
  const clamped = Math.max(0, Math.min(Math.max(0, wounds), Math.trunc(count)))
  return withTally(state, { ...tally, woundsLost: clamped })
}

function touch(state: BattleLiveState, patch: Partial<BattleLiveState>): BattleLiveState {
  return { ...state, ...patch, editedAt: new Date().toISOString() }
}

/** Enemies a hero or hired sword has put out of action; never below zero. */
export function addEnemyOut(state: BattleLiveState, id: string, delta: number): BattleLiveState {
  const tally = baseTally(state, id, 'hero')
  return withTally(state, { ...tally, enemiesOutOfAction: Math.max(0, tally.enemiesOutOfAction + delta) })
}

/** Record who took a warrior (or one model of a group) out of action; `null` entries mean a fall or other. */
export function setTakenOutBy(state: BattleLiveState, id: string, entries: TakenOutBy[]): BattleLiveState {
  const takenOutBy = { ...state.takenOutBy }
  if (entries.length === 0) delete takenOutBy[id]
  else takenOutBy[id] = entries
  return touch(state, { takenOutBy })
}

export function takenOutBy(state: BattleLiveState, id: string): TakenOutBy[] {
  return state.takenOutBy[id] ?? []
}

/** A hero marked back in loses the attribution; a group keeps as many entries as models still out. */
export function trimTakenOutBy(state: BattleLiveState, id: string, out: number): BattleLiveState {
  const current = state.takenOutBy[id] ?? []
  if (current.length <= out) return state
  return setTakenOutBy(state, id, current.slice(0, out))
}

export function isHeroOut(state: BattleLiveState, id: string): boolean {
  return (tallyFor(state, id)?.outOfAction ?? 0) > 0
}

/** A hero is either standing or out of action. */
export function toggleHeroOut(state: BattleLiveState, id: string): BattleLiveState {
  const tally = baseTally(state, id, 'hero')
  const next = withTally(state, { ...tally, outOfAction: tally.outOfAction > 0 ? 0 : 1 })
  return tally.outOfAction > 0 ? trimTakenOutBy(next, id, 0) : next
}

export function groupOut(state: BattleLiveState, id: string): number {
  return tallyFor(state, id)?.outOfAction ?? 0
}

/** Models of a henchman group out of action, clamped to 0..size. */
export function setGroupOut(state: BattleLiveState, id: string, count: number, size: number): BattleLiveState {
  const tally = baseTally(state, id, 'group')
  const clamped = Math.max(0, Math.min(size, Math.trunc(count)))
  return trimTakenOutBy(withTally(state, { ...tally, outOfAction: clamped }), id, clamped)
}

export function setTurn(state: BattleLiveState, turn: number): BattleLiveState {
  return touch(state, { turn: Math.max(0, Math.trunc(turn)) })
}

export function setRouted(state: BattleLiveState, routed: boolean): BattleLiveState {
  return touch(state, { routed })
}

export function setWyrdstoneFound(state: BattleLiveState, count: number): BattleLiveState {
  return touch(state, { wyrdstoneFound: Math.max(0, Math.trunc(count)) })
}

export function setNotes(state: BattleLiveState, notes: string): BattleLiveState {
  return touch(state, { notes })
}

/** Record (or take back) that a warrior used a consumable this battle. */
export function setItemUsed(state: BattleLiveState, warriorId: string, itemId: string, used: boolean): BattleLiveState {
  const current = state.itemsUsed[warriorId] ?? []
  const next = used ? (current.includes(itemId) ? current : [...current, itemId]) : current.filter((id) => id !== itemId)
  const itemsUsed = { ...state.itemsUsed }
  if (next.length === 0) delete itemsUsed[warriorId]
  else itemsUsed[warriorId] = next
  return touch(state, { itemsUsed })
}

export function itemsUsedBy(state: BattleLiveState, warriorId: string): string[] {
  return state.itemsUsed[warriorId] ?? []
}

/** Blank loot lines are ignored. */
export function addLoot(state: BattleLiveState, line: string): BattleLiveState {
  const trimmed = line.trim()
  if (trimmed === '') return state
  return touch(state, { loot: [...state.loot, trimmed] })
}

export function removeLoot(state: BattleLiveState, index: number): BattleLiveState {
  if (index < 0 || index >= state.loot.length) return state
  return touch(state, { loot: state.loot.filter((_, i) => i !== index) })
}

// ---------------------------------------------------------------------------------------------
// Totals and the rout warning
// ---------------------------------------------------------------------------------------------

export interface SheetTotals {
  enemiesOutOfAction: number
  ownOutOfAction: number
  startingModels: number
  routCasualties: number
  routModels: number
  wyrdstoneFound: number
  /** Models out of action at which the rout test is due. */
  routAt: number
}

export function sheetTotals(state: BattleLiveState, roster: RosterWarband, paidExclusions = 0): SheetTotals {
  const totals = battleTotals(state)
  const models = startingModels(roster, state)
  return { ...totals, ownOutOfAction: totals.ownOutOfAction - insignificantOut(state), startingModels: models, routCasualties: Math.max(0, routCasualties(state, roster) - paidExclusions), routModels: routStartingModels(roster, state), wyrdstoneFound: state.wyrdstoneFound, routAt: rosterRoutThreshold(roster, state) }
}

export type RoutStatus = 'none' | 'test' | 'routed'

/**
 * "test" once a quarter (rounded up) of the starting models are out of action and the warband has
 * not routed yet; an empty roster never warns.
 */
export function routStatus(state: BattleLiveState, models: number, roster?: RosterWarband, paidExclusions = 0): RoutStatus {
  if (state.routed) return 'routed'
  if (models <= 0) return 'none'
  return Math.max(0, routCasualties(state, roster) - paidExclusions) >= (roster ? rosterRoutThreshold(roster, state) : routThreshold(models)) ? 'test' : 'none'
}

// ---------------------------------------------------------------------------------------------
// Keeping the local sheet and the server row in step
// ---------------------------------------------------------------------------------------------

export interface RemoteSheet {
  live_state: BattleLiveState
  updated_at: string
}

export interface SheetSync {
  sheet: BattleLiveState
  /** Server updated_at of the version we last saved or adopted; null before any server row was seen. */
  syncedAt: string | null
  /** Local edits not yet on the server. */
  dirty: boolean
  /** Bumped on every local edit so a save can tell whether edits landed while it was in flight. */
  version: number
}

export function initialSync(sheet: BattleLiveState): SheetSync {
  return { sheet, syncedAt: null, dirty: false, version: 0 }
}

/** A local edit: the new sheet is dirty and one version newer. Returns the same object when nothing changed. */
export function applyEdit(sync: SheetSync, sheet: BattleLiveState): SheetSync {
  if (sheet === sync.sheet) return sync
  return { ...sync, sheet, dirty: true, version: sync.version + 1 }
}

function isNewer(candidate: string, than: string | null): boolean {
  if (than === null) return true
  const a = Date.parse(candidate)
  const b = Date.parse(than)
  if (Number.isNaN(a) || Number.isNaN(b)) return candidate !== than
  return a > b
}

/**
 * A refetch brought the server's copy of our sheet. Adopt it when we have no pending edits and it
 * is newer than what we last saved or adopted (another device wrote it); otherwise keep ours.
 * Returns the same object when nothing changes so callers can compare by reference.
 */
export function reconcileRemote(sync: SheetSync, remote: RemoteSheet | undefined): SheetSync {
  if (!remote) return sync
  if (sync.dirty) return sync
  if (!isNewer(remote.updated_at, sync.syncedAt)) return sync
  return { ...sync, sheet: remote.live_state, syncedAt: remote.updated_at, dirty: false }
}

/**
 * A save finished. `version` is the version that was sent; if edits landed meanwhile the sheet
 * stays dirty so the next debounce saves them. `updatedAt` is what the server returned.
 */
export function completeSave(sync: SheetSync, version: number, updatedAt: string | null): SheetSync {
  const stillDirty = sync.version !== version
  const syncedAt = updatedAt && isNewer(updatedAt, sync.syncedAt) ? updatedAt : sync.syncedAt
  return { ...sync, dirty: stillDirty, syncedAt }
}

// ---------------------------------------------------------------------------------------------
// What the post-battle wizard will count (reference only; nothing here applies it)
// ---------------------------------------------------------------------------------------------

export const EXPERIENCE_REMINDERS: readonly { who: string; text: string }[] = [
  { who: 'Heroes and hired swords', text: '+1 for surviving the battle (even if taken out of action).' },
  { who: 'Heroes and hired swords', text: '+1 for each enemy they put out of action. That is the "Enemies out" counter.' },
  { who: 'Leader', text: '+1 if the warband wins the battle.' },
  { who: 'Henchman groups', text: '+1 for surviving the battle; henchmen do not earn experience for kills.' },
  { who: 'Scenario', text: 'Some scenarios award extra experience (for example, carrying a shard off the table). Note it under Notes.' },
]

/**
 * Who on this warband is still down. The shared log records the worst thing each attack did; a
 * knocked-down or stunned model recovers, so only results from the current turn count, and being
 * hit again later in the same turn replaces the earlier state.
 */
export function conditionsFor(events: BattleEventRow[], warbandId: string, turn: number, recoveries?: readonly { warbandId: string; at: string }[]): Map<string, string> {
  const out = new Map<string, string>()
  const timeline = [
    ...events.filter(e => e.reverted_at === null && e.payload.target_warband_id === warbandId && (recoveries !== undefined || e.payload.turn === turn)).map(event => ({ at: event.at, event })),
    ...(recoveries ?? []).filter(r => r.warbandId === warbandId).map(r => ({ at: r.at, event: null })),
  ].sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
  const removed = new Set<string>()
  for (const entry of timeline) {
    if (!entry.event) {
      for (const [id, condition] of out) {
        if (condition === 'Stunned') out.set(id, 'Knocked down')
        else if (condition === 'Knocked down') out.delete(id)
      }
      continue
    }
    const p = entry.event.payload
    const outcome = p.outcome.toLowerCase()
    if (p.out_of_action || outcome === 'out of action') { out.delete(p.target_id); if (p.target_kind === 'hero' || p.target_size === 1) removed.add(p.target_id) }
    else if (!removed.has(p.target_id) && (outcome === 'knocked down' || outcome === 'stunned')) {
      out.set(p.target_id, outcome === 'stunned' ? 'Stunned' : 'Knocked down')
    }
    // A missed attack or successful save never makes a downed warrior stand up.
  }
  return out
}

/** Questions the other side has put to these warbands and not yet had an answer to, oldest first. */
export function waitingFor(prompts: BattlePrompt[], myWarbandIds: string[]): BattlePrompt[] {
  return prompts.filter((p) => p.state === 'waiting' && myWarbandIds.includes(p.target_warband_id))
}

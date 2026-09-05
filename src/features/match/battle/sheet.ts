// Pure helpers behind the battle sheet: who is fighting, tally edits, the rout warning, and the
// decision of when to adopt a sheet that arrived from the server (another device). No React, no
// network, so it is unit-tested in node.

import type { BattleLiveState, BattleWarriorTally } from '../../../domain'
import { battleTotals, routThreshold, tallyFor, withTally } from '../../../domain'
import type { RosterHenchmanGroup, RosterHero, RosterHiredSword, RosterItem, RosterWarband } from '../../../rules/types/roster'

// ---------------------------------------------------------------------------------------------
// Who fights
// ---------------------------------------------------------------------------------------------

/** A hero or hired sword as the sheet sees them: both are tallied per model. */
export type SheetWarrior = { role: 'hero'; warrior: RosterHero } | { role: 'hiredSword'; warrior: RosterHiredSword }

/** Why a warrior sits this one out, or null when they fight. */
export function notFightingReason(warrior: RosterHero | RosterHiredSword): string | null {
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
  return null
}

export function isFighting(warrior: RosterHero | RosterHiredSword): boolean {
  return notFightingReason(warrior) === null
}

export interface SheetWarriors {
  fighting: SheetWarrior[]
  notFighting: { entry: SheetWarrior; reason: string }[]
}

/** Heroes first, then hired swords, each split into those on the table and those sitting out. */
export function splitWarriors(roster: RosterWarband): SheetWarriors {
  const entries: SheetWarrior[] = [
    ...roster.heroes.map((warrior): SheetWarrior => ({ role: 'hero', warrior })),
    ...roster.hiredSwords.map((warrior): SheetWarrior => ({ role: 'hiredSword', warrior })),
  ]
  const out: SheetWarriors = { fighting: [], notFighting: [] }
  for (const entry of entries) {
    const reason = notFightingReason(entry.warrior)
    if (reason === null) out.fighting.push(entry)
    else out.notFighting.push({ entry, reason })
  }
  return out
}

/** Groups with at least one model; a wiped-out group is kept on the roster for history only. */
export function fightingGroups(roster: RosterWarband): RosterHenchmanGroup[] {
  return roster.henchmenGroups.filter((g) => g.size > 0)
}

/** Models this warband put on the table: fighting heroes and hired swords plus every henchman. */
export function startingModels(roster: RosterWarband): number {
  const warriors = splitWarriors(roster).fighting.length
  return warriors + fightingGroups(roster).reduce((n, g) => n + g.size, 0)
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

export function isHeroOut(state: BattleLiveState, id: string): boolean {
  return (tallyFor(state, id)?.outOfAction ?? 0) > 0
}

/** A hero is either standing or out of action. */
export function toggleHeroOut(state: BattleLiveState, id: string): BattleLiveState {
  const tally = baseTally(state, id, 'hero')
  return withTally(state, { ...tally, outOfAction: tally.outOfAction > 0 ? 0 : 1 })
}

export function groupOut(state: BattleLiveState, id: string): number {
  return tallyFor(state, id)?.outOfAction ?? 0
}

/** Models of a henchman group out of action, clamped to 0..size. */
export function setGroupOut(state: BattleLiveState, id: string, count: number, size: number): BattleLiveState {
  const tally = baseTally(state, id, 'group')
  const clamped = Math.max(0, Math.min(size, Math.trunc(count)))
  return withTally(state, { ...tally, outOfAction: clamped })
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
  wyrdstoneFound: number
  /** Models out of action at which the rout test is due. */
  routAt: number
}

export function sheetTotals(state: BattleLiveState, roster: RosterWarband): SheetTotals {
  const totals = battleTotals(state)
  const models = startingModels(roster)
  return { ...totals, startingModels: models, wyrdstoneFound: state.wyrdstoneFound, routAt: routThreshold(models) }
}

export type RoutStatus = 'none' | 'test' | 'routed'

/**
 * "test" once a quarter (rounded up) of the starting models are out of action and the warband has
 * not routed yet; an empty roster never warns.
 */
export function routStatus(state: BattleLiveState, models: number): RoutStatus {
  if (state.routed) return 'routed'
  if (models <= 0) return 'none'
  return battleTotals(state).ownOutOfAction >= routThreshold(models) ? 'test' : 'none'
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

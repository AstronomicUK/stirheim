import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { warbandKeys, type WarbandDetail } from './warbands'
import { feedbackKeys } from './feedback'
import type { CaptiveCase } from './captives'
import { resolvePirateKidnapped, type KidnappedChoice, type KidnappedVictim } from '../rules/resolve/pirateKidnapped'
import type { RosterHenchmanGroup, RosterHero, RosterItem, RosterWarband } from '../rules/types/roster'
import type { Stats } from '../rules/types'

type Rpc = (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
const rpc = supabase.rpc as unknown as Rpc

/** Printed Crew profile and the Crew kit a new recruit may be issued (Pirate equipment list, henchmen lines). */
export const CREW_STATS: Stats = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }
export const CREW_KIT_ITEM_IDS = ['dagger', 'hammer', 'mace', 'axe', 'boat_hook', 'sword', 'double_handed_weapon', 'belaying_pins', 'crossbow', 'pistol', 'duelling_pistol', 'buckler', 'toughened_leathers', 'helmet', 'light_armour'] as const

export interface KidnapDice { dice: [number, number]; original?: [number, number] | null }
export interface KidnapContest { pirates?: KidnapDice; victim?: KidnapDice }
export type KidnapWinner = 'pirates' | 'victim' | 'draw'

function invalidate(cache: ReturnType<typeof useQueryClient>) {
  return Promise.all([cache.invalidateQueries({ queryKey: ['captives'] }), cache.invalidateQueries({ queryKey: warbandKeys.all }), cache.invalidateQueries({ queryKey: feedbackKeys.all })])
}

/** The Pirates roll once to recover a lost henchman's body (4+). */
export function useRecordKidnapRecovery() {
  const cache = useQueryClient()
  return useMutation({ mutationFn: async (input: { caseId: string; d6: number; original?: number | null }) => {
    const { error } = await rpc('record_kidnap_recovery', { p_case_id: input.caseId, p_d6: input.d6, p_original: input.original ?? null })
    if (error) throw new Error(error.message)
  }, onSuccess: () => invalidate(cache) })
}

/** Each player records their own two Leadership dice once; the GM may record either side by naming it. */
export function useRecordKidnapDice() {
  const cache = useQueryClient()
  return useMutation({ mutationFn: async (input: { caseId: string; dice: [number, number]; original?: [number, number] | null; side?: 'pirates' | 'victim' }) => {
    const { error } = await rpc('record_kidnap_dice', { p_case_id: input.caseId, p_dice: input.dice, p_original: input.original ?? null, p_side: input.side ?? null })
    if (error) throw new Error(error.message)
  }, onSuccess: () => invalidate(cache) })
}

/** GM-only reasoned override: both sides roll again. */
export function useResetKidnapContest() {
  const cache = useQueryClient()
  return useMutation({ mutationFn: async (input: { caseId: string; reason: string }) => {
    const { error } = await rpc('reset_kidnap_contest', { p_case_id: input.caseId, p_reason: input.reason })
    if (error) throw new Error(error.message)
  }, onSuccess: () => invalidate(cache) })
}

/** The Captain's Leadership (or the Ship's Mate's when the Captain is gone), as the server reads it. */
export function pirateCaptainLeadership(captor: RosterWarband): number | null {
  const of = (unit: string) => captor.heroes.filter(h => h.status === 'active' && h.unitTemplateId === unit).map(h => h.stats.Ld)
  const captain = of('pirates_captain'), mate = of('pirates_ships_mate')
  return captain.length ? Math.max(...captain) : mate.length ? Math.max(...mate) : null
}

/** What the reports on file say about the battle, from the Pirates' point of view. */
export function kidnapWinner(reports: { warband_id: string; result: string }[], piratesId: string, victimId: string): KidnapWinner {
  if (reports.some(r => r.warband_id === piratesId && r.result === 'won')) return 'pirates'
  if (reports.some(r => r.warband_id === victimId && r.result === 'won')) return 'victim'
  return 'draw'
}

export interface KidnapSubject { victim: KidnappedVictim; hero: RosterHero | null; kitShare: RosterItem[] }

/** The warrior at stake, from the hero row or the henchman snapshot the case carries. */
export function kidnapSubject(item: CaptiveCase, owner: WarbandDetail | undefined): KidnapSubject | null {
  if (item.subject_kind === 'hero') {
    const raw = owner ? [...owner.roster.heroes, ...owner.roster.hiredSwords].find(h => h.id === item.hero_id) : undefined
    if (!raw) return null
    const hero: RosterHero = 'unitTemplateId' in raw ? raw : { ...raw, unitTemplateId: `hired_sword:${raw.hiredSwordId}`, skillTableIds: [], status: raw.status === 'left' ? 'retired' : raw.status }
    return { victim: { name: hero.name, kind: 'unitTemplateId' in raw ? 'hero' : 'hiredSword', human: true, finalResult: 'captured', injuryRoll: 61, outOfAction: true, stats: hero.stats, skillIds: hero.skillIds }, hero, kitShare: hero.equipment }
  }
  const snap = item.model_snapshot as { group?: { stats?: Stats; campaign_state?: { inheritedSkillIds?: string[] } }; items?: { item_rules_id: string | null; custom_name: string | null; quantity: number | null; notes?: string | null }[]; survival_roll?: number; kit_unresolved?: boolean } | null
  if (!snap?.group?.stats) return null
  return {
    victim: { name: item.hero_name, kind: 'henchman', human: true, finalResult: 'dead', injuryRoll: snap.survival_roll ?? 1, outOfAction: true, stats: snap.group.stats, skillIds: snap.group.campaign_state?.inheritedSkillIds ?? [] },
    hero: null,
    // The model's own share of the group's kit as the report actually removed it; an uneven
    // allocation is left for the players to settle by hand, so nothing is claimed automatically.
    kitShare: snap.kit_unresolved ? [] : (snap.items ?? []).filter(i => typeof i.quantity === 'number' && i.quantity > 0).map(i => ({ itemId: i.item_rules_id, ...(i.item_rules_id ? {} : { customName: i.custom_name ?? undefined }), quantity: i.quantity as number, ...(i.notes ? { notes: i.notes } : {}) })),
  }
}

export interface KidnapProposalInput {
  item: CaptiveCase
  owner: WarbandDetail
  captor: WarbandDetail
  winner: KidnapWinner
  /** Existing Crew group to join (four or fewer models), or none to form a new one. */
  joinGroupId?: string
  /** Crew kit for a new group, item ids from CREW_KIT_ITEM_IDS. */
  kit: string[]
  /** Id for the new group when one is formed. */
  newGroupId: string
}

/**
 * Build the exact proposal the server will validate: the resolver's contest (for the preview text)
 * and the two rosters as they stand after the recruit joins the Pirates.
 */
export function buildKidnappedProposal(input: KidnapProposalInput): { choice: Record<string, unknown>; nextOwner: RosterWarband; nextCaptor: RosterWarband; message: string; outcome: 'crew' | 'swabbie' } {
  const { item, owner, captor } = input
  const subject = kidnapSubject(item, owner)
  if (!subject) throw new Error('The captured warrior is no longer on the roster.')
  const contest = (item.contest ?? {}) as KidnapContest
  if (!contest.pirates || !contest.victim) throw new Error('Both players must record their Leadership dice first.')
  const captainLeadership = pirateCaptainLeadership(captor.roster)
  if (captainLeadership === null) throw new Error('The Pirates have no active Captain or Ship’s Mate.')
  const existing = input.joinGroupId ? captor.roster.henchmenGroups.find(g => g.id === input.joinGroupId) : undefined
  const recovery = (item.recovery ?? null) as { d6?: number; original?: number | null } | null
  const choice: KidnappedChoice = {
    winner: input.winner, captainLeadership,
    ...(item.subject_kind === 'henchman' ? { recoveredBody: recovery?.d6, recoveredBodyOriginal: recovery?.original ?? undefined } : {}),
    pirateRoll: { dice: contest.pirates.dice, original: contest.pirates.original ?? undefined },
    victimRoll: { dice: contest.victim.dice, original: contest.victim.original ?? undefined },
    crew: existing ? { groupId: existing.id, size: existing.size, stats: existing.stats, skillIds: [] } : { size: 0, stats: CREW_STATS, skillIds: [] },
  }
  const result = resolvePirateKidnapped(subject.victim, choice)
  if (result.outcome === 'notRecovered') throw new Error('The Pirates did not recover the body.')
  const name = subject.victim.name
  let nextOwner = owner.roster
  if (subject.hero) {
    const { captured: _captured, ...flags } = subject.hero.flags
    const last = subject.hero.injuries.findLastIndex(i => i.injuryCode === 'captured')
    const gone: RosterHero = { ...subject.hero, status: 'retired', flags, equipment: [], injuries: subject.hero.injuries.map((i, n) => n === last ? { ...i, effect: `Kidnapped! by ${captor.warband.name}.` } : i) }
    nextOwner = { ...owner.roster, heroes: owner.roster.heroes.map(h => h.id === gone.id ? gone : h), hiredSwords: owner.roster.hiredSwords.map(h => h.id === gone.id ? { ...h, status: 'left' as const, flags: gone.flags, injuries: gone.injuries, equipment: [] } : h) }
  }
  let nextCaptor: RosterWarband
  if (result.outcome === 'crew') {
    if (existing) {
      nextCaptor = { ...captor.roster, henchmenGroups: captor.roster.henchmenGroups.map(g => g.id === existing.id ? { ...g, size: g.size + 1, equipment: g.equipment.map(e => ({ ...e, quantity: e.quantity + 1 })), modelNames: g.modelNames?.length ? [...g.modelNames, name] : g.modelNames } : g) }
    } else {
      const group: RosterHenchmanGroup = { id: input.newGroupId, name, unitTemplateId: 'pirates_crew', size: 1, stats: CREW_STATS, xp: 0, levelUps: 0, statIncreases: {}, equipment: input.kit.map(itemId => ({ itemId, quantity: ['pistol', 'duelling_pistol'].includes(itemId) ? 1 : 1 })), modelNames: [name] }
      nextCaptor = { ...captor.roster, henchmenGroups: [...captor.roster.henchmenGroups, group] }
    }
  } else {
    const group: RosterHenchmanGroup = { id: input.newGroupId, name, unitTemplateId: 'pirates_swabbie', size: 1, stats: result.stats, xp: 0, levelUps: 0, statIncreases: {}, equipment: [], modelNames: [name], campaignState: { inheritedSkillIds: result.skillIds } }
    nextCaptor = { ...captor.roster, henchmenGroups: [...captor.roster.henchmenGroups, group], stash: [...captor.roster.stash, ...subject.kitShare] }
  }
  return {
    outcome: result.outcome,
    choice: { kind: 'kidnapped', outcome: result.outcome, winner: input.winner, captainLeadership, pirateRoll: choice.pirateRoll, victimRoll: choice.victimRoll, crew: choice.crew, groupId: existing?.id ?? input.newGroupId, ...(choice.recoveredBody !== undefined ? { recoveredBody: choice.recoveredBody } : {}) },
    nextOwner, nextCaptor,
    message: result.log.join(' '),
  }
}

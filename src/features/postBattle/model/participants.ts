// Who took part in the battle, as the report sees it, and which hero counts as the leader.
//
// Reuses the battle sheet's definition of "fighting" so the report counts exactly the warriors
// the sheet put on the table: active status and not sitting out an injury.

import { leaderTemplate } from '../../../rules/resolve/roster'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterHenchmanGroup, RosterHero, RosterHiredSword, RosterWarband } from '../../../rules/types/roster'
import { fightingGroups, splitWarriors } from '../../match/battle/sheet'

export interface SatOut {
  id: string
  name: string
  reason: string
  /** Heroes only: games still to miss before this one is counted. */
  missNextGames: number | undefined
}

export interface Participants {
  heroes: RosterHero[]
  hiredSwords: RosterHiredSword[]
  groups: RosterHenchmanGroup[]
  satOut: SatOut[]
  leaderId: string | null
}

/**
 * The leader is the fighting hero of the template's mandatory hero type (the first with a minimum
 * of one, see rules/resolve/roster.leaderTemplate). If none of those fought, the fighting hero
 * with the highest Leadership stands in — the rulebook has the next-best hero lead when the
 * leader is lost.
 */
export function findLeaderId(heroes: RosterHero[], template: WarbandTemplate | undefined): string | null {
  if (heroes.length === 0) return null
  const leaderType = template ? leaderTemplate(template) : undefined
  const byType = leaderType ? heroes.find((h) => h.unitTemplateId === leaderType.id) : undefined
  if (byType) return byType.id
  return [...heroes].sort((a, b) => b.stats.Ld - a.stats.Ld)[0].id
}

export function participantsOf(roster: RosterWarband, template: WarbandTemplate | undefined): Participants {
  const split = splitWarriors(roster)
  const heroes: RosterHero[] = []
  const hiredSwords: RosterHiredSword[] = []
  for (const entry of split.fighting) {
    if (entry.role === 'hero') heroes.push(entry.warrior)
    else hiredSwords.push(entry.warrior)
  }
  const satOut: SatOut[] = split.notFighting.map(({ entry, reason }) => ({
    id: entry.warrior.id,
    name: entry.warrior.name,
    reason,
    missNextGames: entry.role === 'hero' && entry.warrior.status === 'active' ? entry.warrior.flags.missNextGames : undefined,
  }))
  return { heroes, hiredSwords, groups: fightingGroups(roster), satOut, leaderId: findLeaderId(heroes, template) }
}

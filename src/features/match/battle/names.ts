// Pure lookups for the battle cards: display names, rules and tags for a roster warrior.

import type { NamedRule, WarbandTemplate } from '../../../rules/types'
import type { RosterHenchmanGroup, RosterHero, RosterHiredSword } from '../../../rules/types/roster'
import { unitTypeName } from '../../roster/shared/names'
import { flagTags, hiredSwordName, warriorSpecialRules } from '../../roster/view/lookups'
import type { SheetWarrior } from './sheet'

export type TagTone = 'neutral' | 'warn' | 'danger' | 'brass'
export interface CardTag {
  label: string
  tone: TagTone
}

/** Old battle wounds and fear stand out; everything else is a plain warning tag. */
export function warriorTags(warrior: RosterHero | RosterHiredSword): CardTag[] {
  return flagTags(warrior.flags).map((label) => ({
    label,
    tone: label === 'Old battle wound' || label === 'Causes fear' || label.startsWith('Misses') ? 'danger' : 'warn',
  }))
}

export function warriorTypeName(entry: SheetWarrior, template: WarbandTemplate | undefined): string {
  return entry.role === 'hiredSword' ? hiredSwordName(entry.warrior.hiredSwordId) : unitTypeName(template?.id ?? '', entry.warrior.unitTemplateId)
}

export function warriorRules(entry: SheetWarrior, template: WarbandTemplate | undefined): NamedRule[] {
  return entry.role === 'hiredSword' ? warriorSpecialRules(template, null, entry.warrior.hiredSwordId) : warriorSpecialRules(template, entry.warrior.unitTemplateId, null)
}

export function groupTypeName(group: RosterHenchmanGroup, template: WarbandTemplate | undefined): string {
  return unitTypeName(template?.id ?? '', group.unitTemplateId)
}

export function groupRules(group: RosterHenchmanGroup, template: WarbandTemplate | undefined): NamedRule[] {
  return warriorSpecialRules(template, group.unitTemplateId, null)
}


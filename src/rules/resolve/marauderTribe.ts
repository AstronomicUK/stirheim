import type { MarauderTribe, RosterWarband } from '../types/roster'
export const MARAUDER_TRIBES: { id: MarauderTribe; name: string; text: string }[] = [
  { id: 'norse', name: 'Norse', text: '+1 to rare-item searches. Eye of the Gods triggers at 13+ (11+ with Tattooed Body).' },
  { id: 'kurgan', name: 'Kurgan', text: 'No five-Warhound limit. −1 to rare-item searches except Great Axes and Barbed Whips.' },
  { id: 'hung', name: 'Hung', text: 'Maximum 12 warriors. Warhorses cost 40 gc. Ride Warhorse remains a manual skill entry for Hung Heroes.' },
]
export function isMarauderTribe(warband: Pick<RosterWarband, 'warbandTemplateId' | 'marauderTribe'>, tribe: MarauderTribe) {
  return warband.warbandTemplateId === 'marauders_of_chaos' && warband.marauderTribe === tribe
}
export function tribeModelLimit(warband: Pick<RosterWarband, 'warbandTemplateId' | 'marauderTribe'>, normal: number | null) {
  return isMarauderTribe(warband, 'hung') ? 12 : normal
}
export function tribeRareBonus(warband: RosterWarband, itemId: string) {
  if (isMarauderTribe(warband, 'norse')) return 1
  if (isMarauderTribe(warband, 'kurgan') && !['great_axe', 'barbed_whip'].includes(itemId)) return -1
  return 0
}

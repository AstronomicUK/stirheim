// View-model helpers for the campaign map: a colour per warband, names for ids, and the per-district
// summary the canvas and the panel both read.

import type { CampaignMemberView } from '../../api/campaigns'
import { MAP_DISTRICTS, type MapDistrict } from '../../rules/data/map/districts'
import { controllerOf, districtState, type MapState } from '../../rules/resolve/mapCampaign'

/** Distinct, print-friendly inks for up to twelve warbands; repeats after that. */
export const WARBAND_COLOURS = ['#8f2b1f', '#3f5666', '#4f7a3c', '#9a6f1f', '#5b3a7a', '#1f7a72', '#b7541f', '#2f4f9a', '#7a3a3a', '#5c6b1f', '#8a4f7a', '#3b5a4a']

export interface MapWarband {
  id: string
  name: string
  ownerName: string
  colour: string
}

/** Colour by enrolment order so a warband keeps its ink for the life of the campaign. */
export function mapWarbands(members: CampaignMemberView[], former: CampaignMemberView[] = []): MapWarband[] {
  const all = [...members, ...former].sort((a, b) => a.joined_at.localeCompare(b.joined_at))
  return all.map((m, i) => ({ id: m.warband_id, name: m.warband.name, ownerName: m.display_name, colour: WARBAND_COLOURS[i % WARBAND_COLOURS.length] }))
}

export function warbandById(warbands: MapWarband[]): Map<string, MapWarband> {
  return new Map(warbands.map((w) => [w.id, w]))
}

export interface DistrictView {
  district: MapDistrict
  controller: MapWarband | null
  footholds: MapWarband[]
  explored: MapWarband[]
}

export function districtViews(state: MapState, warbands: Map<string, MapWarband>): Map<string, DistrictView> {
  const out = new Map<string, DistrictView>()
  const known = (id: string): MapWarband => warbands.get(id) ?? { id, name: 'Former warband', ownerName: '', colour: '#8a8378' }
  for (const district of MAP_DISTRICTS) {
    const s = districtState(state, district.id)
    const controllerId = controllerOf(state, district.id)
    out.set(district.id, {
      district,
      controller: controllerId ? known(controllerId) : null,
      footholds: [...s.footholds].map(known),
      explored: [...s.explored].map(known),
    })
  }
  return out
}

/** "won", "lost" or "drew" style joining: "A, B and C". */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

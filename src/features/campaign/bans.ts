// The lists a GM may ban from, built from the rules data, and their display names.

import { DRAMATIS_PERSONAE } from '../../rules/data/campaign/dramatisPersonae'
import { HIRED_SWORDS } from '../../rules/data/campaign/hiredSwords'
import { SHOP_ITEMS } from '../../rules/data/items'
import { WARBAND_SKILL_TABLES } from '../../rules/data/campaign/warbandSkills'
import type { CampaignBans } from '../../rules/types/roster'
import type { IconName } from '../../ui'
import { allSpellOptions, skillOptionsFor, CORE_SKILL_CATEGORIES } from '../roster/view/lookups'

export type BanKind = keyof CampaignBans

export interface Entry {
  id: string
  name: string
  detail: string
}

export const KIND_LABEL: Record<BanKind, string> = { items: 'Items', spells: 'Spells', hiredSwords: 'Hired swords', characters: 'Characters', skills: 'Skills' }

/** One icon per list, so the five tabs are told apart at a glance. */
export const KIND_ICON: Record<BanKind, IconName> = { items: 'trade', spells: 'cast', hiredSwords: 'hired', characters: 'characters', skills: 'advances' }

/** Every entry of a kind the GM may ban, sorted by name. */
export function banCandidates(kind: BanKind): Entry[] {
  switch (kind) {
    case 'items':
      return SHOP_ITEMS.map((i) => ({ id: i.id, name: i.name, detail: `${i.availability.text} · ${i.price.text}` })).sort((a, b) => a.name.localeCompare(b.name))
    case 'spells':
      return allSpellOptions()
        .map((s) => ({ id: s.id, name: s.name, detail: s.lore }))
        .sort((a, b) => a.name.localeCompare(b.name))
    case 'hiredSwords':
      return HIRED_SWORDS.map((h) => ({ id: h.id, name: h.name, detail: h.detail?.mayBeHired ?? '' })).sort((a, b) => a.name.localeCompare(b.name))
    case 'characters':
      return DRAMATIS_PERSONAE.map((p) => ({ id: p.id, name: p.name, detail: p.detail?.mayBeHired ?? '' })).sort((a, b) => a.name.localeCompare(b.name))
    case 'skills': {
      const seen = new Set<string>()
      const out: Entry[] = []
      for (const s of skillOptionsFor([...CORE_SKILL_CATEGORIES, ...WARBAND_SKILL_TABLES.map((t) => t.id)])) {
        if (seen.has(s.id)) continue
        seen.add(s.id)
        out.push({ id: s.id, name: s.name, detail: s.group })
      }
      return out.sort((a, b) => a.name.localeCompare(b.name))
    }
  }
}

export function banName(kind: BanKind, id: string): string {
  return banCandidates(kind).find((e) => e.id === id)?.name ?? id
}


/** Name matches lead; descriptive matches remain reachable without truncating the catalogue. */
export function searchBanCandidates(entries: readonly Entry[], query: string): Entry[] {
  const q = query.trim().toLocaleLowerCase();
  const rank = (entry: Entry) => {
    const name = entry.name.toLocaleLowerCase();
    if (!q || name === q) return 0;
    if (name.startsWith(q)) return 1;
    if (name.includes(q)) return 2;
    return entry.detail.toLocaleLowerCase().includes(q) ? 3 : 4;
  };
  return entries.filter(entry => rank(entry) < 4).sort((a,b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

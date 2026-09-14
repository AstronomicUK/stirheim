import { describe, expect, it } from 'vitest'
import { makeWarband, makeHenchmanGroup } from './fixtures'
import { findItem } from '../../data/items'
import { findWarbandTemplate } from '../../data/warbandTemplates'
import { effectivePricing } from '../itemPricing'
import { recruitmentBlock } from '../recruitment'
import { listUnits, maxRecruitable } from '../../../features/recruitment/helpers'

const template = findWarbandTemplate('marauders_of_chaos')!
const hounds = template.henchmanTemplates.find(u => u.id === 'marauders_warhounds_of_chaos')!
const marauders = template.henchmanTemplates.find(u => u.id === 'marauders_chaos_marauders')!
const roster = () => makeWarband({ warbandTemplateId: template.id, heroes: [], henchmenGroups: [] })
describe('Marauder tribe recruitment and trading', () => {
  it('removes only the Kurgan Warhound cap in both recruitment and the listing', () => {
    const wb = { ...roster(), marauderTribe: 'kurgan' as const, henchmenGroups: [makeHenchmanGroup({ unitTemplateId: hounds.id, size: 5 })] }
    expect(recruitmentBlock(wb, template, hounds, 1)).toBeUndefined()
    expect(listUnits(wb, template, 'henchman').find(u => u.unit.id === hounds.id)?.max).toBeNull()
    expect(maxRecruitable(wb, template, hounds)).toBeGreaterThan(1)
    expect(recruitmentBlock({ ...wb, marauderTribe: 'norse' }, template, hounds, 1)).toContain('limit')
  })
  it('allows the twelfth Hung warrior and blocks the thirteenth', () => {
    const wb = { ...roster(), marauderTribe: 'hung' as const, henchmenGroups: [makeHenchmanGroup({ unitTemplateId: marauders.id, size: 11 })] }
    expect(recruitmentBlock(wb, template, marauders, 1)).toBeUndefined()
    expect(recruitmentBlock(wb, template, marauders, 2)).toContain('at most 12')
    expect(maxRecruitable(wb, template, marauders)).toBe(1)
  })
  it('applies tribe rarity modifiers even to items without a pricing override', () => {
    const item = findItem('rope_hook') ?? findItem('helmet')!
    expect(effectivePricing(item, { ...roster(), marauderTribe: 'norse' }).rareRollBonus).toBe(1)
    expect(effectivePricing(item, { ...roster(), marauderTribe: 'kurgan' }).rareRollBonus).toBe(-1)
    for (const id of ['great_axe', 'barbed_whip']) expect(effectivePricing(findItem(id)!, { ...roster(), marauderTribe: 'kurgan' }).rareRollBonus).toBe(0)
    expect(effectivePricing(item, makeWarband({ marauderTribe: 'norse' })).rareRollBonus).toBe(0)
  })
  it('quotes a Hung warhorse at 40 gc at recruitment and later', () => {
    for (const atCreation of [true, false]) expect(effectivePricing(findItem('warhorse')!, { ...roster(), marauderTribe: 'hung' }, {}, { atCreation }).item.price).toEqual({ base: 40, text: '40 gc' })
  })
})

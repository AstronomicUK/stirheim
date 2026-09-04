import { describe, expect, it } from 'vitest'
import { findItem, ITEMS } from '../../rules/data/items'
import { parseDice } from '../../rules/resolve/dice'
import { makeHero, makeHiredSword, makeWarband } from '../../rules/resolve/__tests__/fixtures'
import type { Item } from '../../rules/types/items'
import { defaultCampaignHouseRules } from '../../rules/types/roster'
import {
  availabilityLabel,
  diceTotal,
  eligibleSearchers,
  groupCatalogue,
  heldQuantity,
  locationKey,
  locationOptions,
  moveStack,
  parseLocationKey,
  phaseSummary,
  priceLine,
  sellForGold,
  sellListing,
  sizeBandLabel,
} from './helpers'

function item(id: string): Item {
  const found = findItem(id)
  if (!found) throw new Error(`fixture item ${id} missing from catalogue`)
  return found
}

const halfOn = defaultCampaignHouseRules()
const halfOff = { ...defaultCampaignHouseRules(), halfPriceArmour: false }

describe('priceLine', () => {
  it('shows a plain price for common items', () => {
    expect(priceLine(item('sword'), halfOn)).toBe('10 gc')
  })

  it('shows the half-price armour rule when applied', () => {
    expect(priceLine(item('light_armour'), halfOn)).toBe('10 gc (half price armour, from 20 gc)')
    expect(priceLine(item('light_armour'), halfOff)).toBe('20 gc')
    expect(priceLine(item('shield'), halfOn)).toBe('5 gc')
  })

  it('asks for the dice on variable-priced items', () => {
    const pistol = ITEMS.find((i) => i.price.dice === '2D6' && i.price.base === 60)
    expect(pistol).toBeDefined()
    expect(priceLine(pistol!, halfOn)).toBe(`${pistol!.price.text} (roll 2D6)`)
  })

  it('falls back to the source text when nothing is listed', () => {
    const unlisted = ITEMS.find((i) => i.price.base === null)!
    expect(priceLine(unlisted, halfOn)).toBe(unlisted.price.text)
  })
})

describe('availabilityLabel', () => {
  it('names common, rare and special items', () => {
    expect(availabilityLabel(item('sword'))).toBe('Common')
    expect(availabilityLabel(item('lucky_charm'))).toBe('Rare 6')
    const restricted: Item = { ...item('sword'), availability: { kind: 'rare', rarity: 9, restriction: 'Dwarfs only', text: 'Rare 9 (Dwarfs only)' } }
    expect(availabilityLabel(restricted)).toBe('Rare 9 · Dwarfs only')
    const special: Item = { ...item('sword'), availability: { kind: 'special', text: 'Varies' } }
    expect(availabilityLabel(special)).toBe('Special')
  })
})

describe('groupCatalogue', () => {
  it('groups the whole catalogue by category in display order and sorts names', () => {
    const groups = groupCatalogue(ITEMS)
    expect(groups.map((g) => g.category)).toEqual(['melee', 'missile', 'blackpowder', 'armour', 'misc', 'animal'])
    expect(groups.reduce((n, g) => n + g.items.length, 0)).toBe(ITEMS.length)
    for (const g of groups) {
      const names = g.items.map((i) => i.name)
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
    }
  })

  it('filters by every word of the query and drops empty groups', () => {
    const groups = groupCatalogue(ITEMS, 'light arm')
    expect(groups.map((g) => g.category)).toEqual(['armour'])
    expect(groups[0].items.map((i) => i.id)).toContain('light_armour')
    expect(groups[0].items.every((i) => /light/i.test(i.name) && /arm/i.test(i.name))).toBe(true)
  })

  it('matches on availability text too', () => {
    const groups = groupCatalogue(ITEMS, 'rare 6')
    const ids = groups.flatMap((g) => g.items.map((i) => i.id))
    expect(ids).toContain('lucky_charm')
    expect(groups.flatMap((g) => g.items).every((i) => i.availability.text.toLowerCase().includes('rare 6'))).toBe(true)
  })

  it('returns nothing for a query nobody stocks', () => {
    expect(groupCatalogue(ITEMS, 'zzzz plasma rifle')).toEqual([])
  })
})

describe('diceTotal', () => {
  it('sums the faces and applies multiplier and bonus', () => {
    expect(diceTotal(parseDice('2D6'), [3, 4])).toBe(7)
    expect(diceTotal(parseDice('D6 x 10'), [5])).toBe(50)
    expect(diceTotal(parseDice('D6+1'), [6])).toBe(7)
  })

  it('is null until every die is filled and in range', () => {
    expect(diceTotal(parseDice('2D6'), [3, null])).toBeNull()
    expect(diceTotal(parseDice('2D6'), [3])).toBeNull()
    expect(diceTotal(parseDice('2D6'), [7, 1])).toBeNull()
  })
})

describe('eligibleSearchers', () => {
  it('lists active heroes who have not searched, in roster order, never hired swords', () => {
    const warband = makeWarband({
      heroes: [makeHero({ id: 'a', name: 'A' }), makeHero({ id: 'b', name: 'B', status: 'dead' }), makeHero({ id: 'c', name: 'C' })],
      hiredSwords: [makeHiredSword()],
    })
    expect(eligibleSearchers(warband, []).map((h) => h.id)).toEqual(['a', 'c'])
    expect(eligibleSearchers(warband, ['a']).map((h) => h.id)).toEqual(['c'])
    expect(eligibleSearchers(warband, ['a', 'c'])).toEqual([])
  })
})

describe('sizeBandLabel', () => {
  it('names the income chart column', () => {
    expect(sizeBandLabel(3)).toBe('1-3')
    expect(sizeBandLabel(4)).toBe('4-6')
    expect(sizeBandLabel(20)).toBe('16+')
  })
})

describe('locations', () => {
  it('round-trips keys', () => {
    for (const loc of [{ kind: 'stash' as const }, { kind: 'hero' as const, id: 'h-1' }, { kind: 'henchmanGroup' as const, id: 'g:1' }]) {
      expect(parseLocationKey(locationKey(loc))).toEqual(loc)
    }
    expect(() => parseLocationKey('nowhere:1')).toThrow()
  })

  it('offers the stash, active heroes and groups but not hired swords', () => {
    const warband = makeWarband({
      heroes: [makeHero({ id: 'a', name: 'A' }), makeHero({ id: 'b', name: 'B', status: 'retired' })],
      hiredSwords: [makeHiredSword()],
    })
    const options = locationOptions(warband)
    expect(options.map((o) => o.key)).toEqual(['stash', 'hero:a', 'henchmanGroup:group-1'])
    expect(options.map((o) => o.label)).toEqual(['Stash', 'A', 'Warriors (2)'])
  })
})

describe('sellListing', () => {
  it('lists every stack across stash, active heroes and groups with half-price sale values', () => {
    const warband = makeWarband({
      stash: [
        { itemId: 'light_armour', quantity: 1 },
        { itemId: null, customName: 'Strange idol', quantity: 1 },
      ],
      hiredSwords: [makeHiredSword({ equipment: [{ itemId: 'sword', quantity: 1 }] })],
    })
    const lines = sellListing(warband)
    expect(lines.map((l) => `${l.holder}:${l.item.itemId ?? l.item.customName}`)).toEqual([
      'Stash:light_armour',
      'Stash:Strange idol',
      'Test Captain:dagger',
      'Test Captain:sword',
      'Test Champion:dagger',
      'Warriors:dagger',
    ])
    const armour = lines[0]
    expect(armour.base).toBe(20)
    expect(armour.each).toBe(10)
    const idol = lines[1]
    expect(idol.catalogue).toBeUndefined()
    expect(idol.base).toBeNull()
    expect(idol.each).toBeNull()
    const sword = lines[3]
    expect(sword.each).toBe(5)
    expect(sword.location).toEqual({ kind: 'hero', id: 'captain' })
    expect(new Set(lines.map((l) => l.key)).size).toBe(lines.length)
  })

  it('skips dead heroes', () => {
    const warband = makeWarband({ heroes: [makeHero({ id: 'x', status: 'dead', equipment: [{ itemId: 'sword', quantity: 1 }] })] })
    expect(sellListing(warband).map((l) => l.holder)).toEqual(['Warriors'])
  })
})

describe('sellForGold', () => {
  it('removes the stack and adds the agreed gold', () => {
    const warband = makeWarband({ stash: [{ itemId: null, customName: 'Strange idol', quantity: 2 }] })
    const next = sellForGold(warband, { kind: 'stash' }, { itemId: null, customName: 'Strange idol' }, 1, 35)
    expect(next.gold).toBe(135)
    expect(next.stash).toEqual([{ itemId: null, customName: 'Strange idol', quantity: 1 }])
    expect(warband.stash[0].quantity).toBe(2)
  })

  it('refuses more than is held and bad prices', () => {
    const warband = makeWarband({ stash: [{ itemId: null, customName: 'Idol', quantity: 1 }] })
    expect(() => sellForGold(warband, { kind: 'stash' }, { itemId: null, customName: 'Idol' }, 2, 10)).toThrow(/has 1/)
    expect(() => sellForGold(warband, { kind: 'stash' }, { itemId: null, customName: 'Idol' }, 1, -1)).toThrow(/gold crowns/)
    expect(() => sellForGold(warband, { kind: 'stash' }, { itemId: null, customName: 'Idol' }, 0, 10)).toThrow(/Quantity/)
  })
})

describe('moveStack', () => {
  it('moves custom items and merges into an existing stack', () => {
    const warband = makeWarband({
      stash: [{ itemId: null, customName: 'Idol', quantity: 2, notes: 'glows' }],
      heroes: [makeHero({ id: 'a', equipment: [{ itemId: null, customName: 'Idol', quantity: 1 }] })],
    })
    const next = moveStack(warband, { kind: 'stash' }, { kind: 'hero', id: 'a' }, warband.stash[0], 1)
    expect(next.stash).toEqual([{ itemId: null, customName: 'Idol', quantity: 1, notes: 'glows' }])
    expect(next.heroes[0].equipment).toEqual([{ itemId: null, customName: 'Idol', quantity: 2 }])
    expect(heldQuantity(next, { kind: 'hero', id: 'a' }, { itemId: null, customName: 'Idol' })).toBe(2)
  })

  it('keeps notes when the destination has no such stack', () => {
    const warband = makeWarband({ stash: [{ itemId: null, customName: 'Idol', quantity: 1, notes: 'glows' }] })
    const next = moveStack(warband, { kind: 'stash' }, { kind: 'henchmanGroup', id: 'group-1' }, warband.stash[0], 1)
    expect(next.stash).toEqual([])
    expect(next.henchmenGroups[0].equipment).toContainEqual({ itemId: null, customName: 'Idol', quantity: 1, notes: 'glows' })
  })

  it('refuses a move onto itself', () => {
    const warband = makeWarband({ stash: [{ itemId: null, customName: 'Idol', quantity: 1 }] })
    expect(() => moveStack(warband, { kind: 'stash' }, { kind: 'stash' }, warband.stash[0], 1)).toThrow(/same inventory/)
  })
})

describe('phaseSummary', () => {
  it('says when there are no limits', () => {
    expect(phaseSummary(null, false, 0, 2)).toBe('Not in a post-battle sequence, no limits apply.')
  })

  it('describes the sale and the searches', () => {
    expect(phaseSummary('m', false, 0, 2)).toBe('This post-battle sequence: wyrdstone not yet sold; 2 rare-item searches left.')
    expect(phaseSummary('m', true, 1, 1)).toBe('This post-battle sequence: wyrdstone already sold; 1 rare-item search left (1 used).')
  })
})

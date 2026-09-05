import { describe, expect, it } from 'vitest'
import { emptyBattleLiveState } from '../../../domain'
import { findWarbandTemplate } from '../../../rules/data/warbandTemplates'
import type { RosterHenchmanGroup, RosterHero, RosterHiredSword, RosterItem, RosterWarband } from '../../../rules/types/roster'
import { setGroupOut, toggleHeroOut } from '../battle/sheet'
import { canBeOffHand, combatantLabel, combatantsOf, defaultOffHand, defaultPrimary, isTwoHanded, loadoutOf, offHandCandidates, traitsFromRules } from './combatants'

const stats = { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }

function item(itemId: string, quantity = 1, extra: Partial<RosterItem> = {}): RosterItem {
  return { itemId, quantity, ...extra }
}

function hero(id: string, extra: Partial<RosterHero> = {}): RosterHero {
  return {
    id,
    name: id,
    unitTemplateId: 'mercenaries_reikland_captain',
    stats,
    xp: 0,
    levelUps: 0,
    skillTableIds: [],
    skillIds: [],
    spellIds: [],
    injuries: [],
    flags: {},
    equipment: [item('sword'), item('dagger')],
    status: 'active',
    ...extra,
  }
}

function group(id: string, extra: Partial<RosterHenchmanGroup> = {}): RosterHenchmanGroup {
  return { id, name: id, unitTemplateId: 'mercenaries_reikland_warriors', size: 3, stats, xp: 0, levelUps: 0, statIncreases: {}, equipment: [item('dagger', 3), item('shield', 3)], ...extra }
}

function hiredSword(id: string, extra: Partial<RosterHiredSword> = {}): RosterHiredSword {
  return { id, hiredSwordId: 'troll_slayer', name: id, stats, xp: 0, levelUps: 0, skillIds: [], injuries: [], flags: {}, equipment: [item('dwarf_axe', 2)], status: 'active', ...extra }
}

function warband(extra: Partial<RosterWarband> = {}): RosterWarband {
  return { id: 'w1', name: 'Reikland Watch', warbandTemplateId: 'mercenaries_reikland', gold: 0, wyrdstone: 0, veteranPool: null, heroes: [], henchmenGroups: [], hiredSwords: [], stash: [], ...extra }
}

describe('loadoutOf', () => {
  it('maps a sword, a dagger and light armour', () => {
    const kit = loadoutOf([item('sword'), item('dagger'), item('light_armour')])
    expect(kit.melee.map((w) => w.id)).toEqual(['sword', 'dagger'])
    expect(kit.ranged).toEqual([])
    expect(kit.armour).toEqual({ type: 'light', shield: false, buckler: false })
    expect(kit.helmet).toBe(false)
    expect(kit.ignored).toEqual([])
  })

  it('reads shields, bucklers, helmets and the best armour worn', () => {
    const kit = loadoutOf([item('light_armour'), item('heavy_armour'), item('shield'), item('buckler'), item('helmet')])
    expect(kit.armour).toEqual({ type: 'heavy', shield: true, buckler: true })
    expect(kit.helmet).toBe(true)
  })

  it('treats gromril, chaos and lamellar armour as a 4+ save and toughened leathers as light', () => {
    expect(loadoutOf([item('chaos_armour')]).armour.type).toBe('gromril')
    expect(loadoutOf([item('lamellar_armour')]).armour.type).toBe('gromril')
    expect(loadoutOf([item('toughened_leathers')]).armour.type).toBe('light')
    expect(loadoutOf([item('ithilmar_armour')]).armour.type).toBe('heavy')
  })

  it('a kite shield counts as a shield, with the assumption spelled out', () => {
    const kit = loadoutOf([item('kite_shield')])
    expect(kit.armour.shield).toBe(true)
    expect(kit.assumptions[0]).toMatch(/Kite Shield counted as an ordinary shield/)
  })

  it('enchanted skins are a 6+ ward save', () => {
    expect(loadoutOf([item('enchanted_skins')]).wardSaveThreshold).toBe(6)
  })

  it('two of the same hand weapon are two weapons; a bought pair is one entry; ranged weapons once', () => {
    expect(loadoutOf([item('sword', 2)]).melee.map((w) => w.id)).toEqual(['sword', 'sword'])
    expect(loadoutOf([item('sword', 5)]).melee).toHaveLength(2)
    expect(loadoutOf([item('fighting_claws', 1)]).melee).toHaveLength(1)
    expect(loadoutOf([item('bow', 2)]).ranged.map((w) => w.id)).toEqual(['bow'])
  })

  it('resolves a gromril weapon from its note, defaulting to a sword', () => {
    expect(loadoutOf([item('gromril_weapon', 1, { notes: 'Gromril axe' })]).melee[0].id).toBe('gromril_axe')
    const kit = loadoutOf([item('gromril_weapon')])
    expect(kit.melee[0].id).toBe('gromril_sword')
    expect(kit.assumptions[0]).toMatch(/assumed/)
  })

  it('lists custom items and unmodelled weapons, and leaves misc gear out quietly', () => {
    const kit = loadoutOf([{ itemId: null, customName: 'Katana', quantity: 1 }, item('rope_and_hook'), item('lucky_charm')])
    expect(kit.ignored).toEqual(['Katana'])
  })
})

describe('weapon hands', () => {
  const kit = loadoutOf([item('sword'), item('dagger'), item('double_handed_weapon'), item('spear'), item('morning_star')])
  const byId = (id: string) => kit.melee.find((w) => w.id === id)!

  it('knows which weapons need both hands', () => {
    expect(isTwoHanded(byId('double_handed_sword'))).toBe(true)
    expect(isTwoHanded(byId('sword'))).toBe(false)
    expect(canBeOffHand(byId('morning_star'))).toBe(false)
    expect(canBeOffHand(byId('spear'))).toBe(false)
    expect(canBeOffHand(byId('dagger'))).toBe(true)
  })

  it('offers off-hand weapons for a hand weapon only', () => {
    expect(offHandCandidates(kit.melee, byId('sword')).map((w) => w.id)).toEqual(['dagger'])
    expect(offHandCandidates(kit.melee, byId('double_handed_sword'))).toEqual([])
    expect(offHandCandidates(kit.melee, byId('spear'))).toEqual([])
  })

  it('a second copy of the primary can be the off-hand', () => {
    const two = loadoutOf([item('sword', 2)])
    expect(offHandCandidates(two.melee, two.melee[0])).toHaveLength(1)
  })

  it('picks the heaviest hitter as the default primary and a dagger for the other hand', () => {
    expect(defaultPrimary(kit.melee).id).toBe('double_handed_sword')
    const plain = loadoutOf([item('dagger'), item('sword')])
    expect(defaultPrimary(plain.melee).id).toBe('sword')
    expect(defaultOffHand(plain.melee, defaultPrimary(plain.melee))?.id).toBe('dagger')
    expect(defaultPrimary([]).id).toBe('unarmed')
  })
})

describe('traitsFromRules', () => {
  it('maps rule headings to modelled traits', () => {
    expect(traitsFromRules([{ name: 'Frenzy', text: '' }, { name: 'Hatred', text: '' }, { name: 'Large', text: '' }, { name: 'Leader', text: '' }])).toEqual(['frenzy', 'hatred', 'large_target'])
    expect(traitsFromRules([{ name: 'Hate Chaos', text: '' }])).toEqual(['hatred'])
  })
})

describe('combatantsOf', () => {
  it('lists fighting heroes, hired swords and one model per henchman group', () => {
    const roster = warband({ heroes: [hero('cap'), hero('dead', { status: 'dead' })], hiredSwords: [hiredSword('slayer')], henchmenGroups: [group('Watchmen'), group('gone', { size: 0 })] })
    const list = combatantsOf(roster, findWarbandTemplate('mercenaries_reikland'), roster.name, undefined)
    expect(list.map((c) => [c.kind, c.id])).toEqual([
      ['hero', 'cap'],
      ['hiredSword', 'slayer'],
      ['henchman', 'Watchmen'],
    ])
    const watchmen = list[2]
    expect(watchmen.equipment).toEqual([item('dagger', 1), item('shield', 1)])
    expect(watchmen.groupSize).toBe(3)
    expect(combatantLabel(watchmen)).toBe('Watchmen (one of 3)')
    expect(list[0].typeName).toBe('Mercenary Captain')
  })

  it('carries race traits, unit traits and injury flags; hired swords skip the race traits', () => {
    const dwarfs = findWarbandTemplate('dwarf_treasure_hunters')!
    const roster = warband({
      warbandTemplateId: dwarfs.id,
      heroes: [hero('noble', { unitTemplateId: dwarfs.heroTemplates[0].id, flags: { frenzy: true, hates: 'Elves' }, isLarge: true })],
      hiredSwords: [hiredSword('ogre')],
    })
    const [noble, ogre] = combatantsOf(roster, dwarfs, roster.name, undefined)
    expect(noble.traitIds).toEqual(expect.arrayContaining(['hard_to_kill', 'hard_head', 'frenzy', 'hatred', 'large_target']))
    expect(ogre.traitIds).not.toContain('hard_to_kill')
  })

  it('marks who is already out of action from the sheet', () => {
    const roster = warband({ heroes: [hero('cap')], henchmenGroups: [group('Watchmen', { size: 2 })] })
    let sheet = toggleHeroOut(emptyBattleLiveState(), 'cap')
    sheet = setGroupOut(sheet, 'Watchmen', 2, 2)
    const list = combatantsOf(roster, findWarbandTemplate('mercenaries_reikland'), roster.name, sheet)
    expect(list.map((c) => c.out)).toEqual([true, true])
    expect(combatantsOf(roster, undefined, roster.name, setGroupOut(emptyBattleLiveState(), 'Watchmen', 1, 2)).map((c) => c.out)).toEqual([false, false])
  })
})

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { followUpChanges, matchInjury, matchSkillOrSpell, normaliseName, resolveRelicRoster, toCreatePayload, toPayloadItems, matchItems } from './rosterImport'
import { parseRelicRoster } from './rosterText'

const fixture = (name: string) => readFileSync(new URL(`./fixtures/relic-${name}.txt`, import.meta.url), 'utf8')
const ALL = ['thorgrim', 'azgul', 'argent', 'grave', 'evards', 'cult', 'ashen', 'ivory', 'beastmen', 'witch']

describe('parseRelicRoster', () => {
  it('reads the printer-friendly page: treasury, heroes with kit, injuries and skills, henchmen, stash', () => {
    const r = parseRelicRoster(fixture('thorgrim'))
    expect(r.name).toBe("Thorgrim's Seekers")
    expect(r.typeName).toBe('DWARF TREASURE HUNTERS')
    expect(r).toMatchObject({ gold: 5, wyrdstone: 0, veteranPool: 8 })
    expect(r.heroes.map((h) => h.name)).toEqual(['Thorgrim Grimmson', 'Borri Burloksson', 'Bill', 'Ben'])
    expect(r.heroes[0]).toMatchObject({ typeName: 'DWARF NOBLE', xp: 22, stats: { M: 3, WS: 5, BS: 4, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 9 } })
    expect(r.heroes[0].equipment).toEqual(['Gromril Armour', 'Shield', 'Dagger', 'Helmet', 'Pistol', 'Club, Mace or Hammer', 'Pistol'])
    expect(r.heroes[1].injuries).toEqual(['Horrible Scars'])
    expect(r.heroes[2].injuries).toEqual(['Hardened', 'Frenzy'])
    expect(r.heroes[3].skills).toEqual(['Master Of Blades'])
    expect(r.henchmen.map((g) => [g.name, g.typeName, g.size, g.xp])).toEqual([
      ['Khamm', 'BEARDLINGS', 1, 1],
      ['Mikk', 'BEARDLINGS', 1, 0],
    ])
    expect(r.henchmen[0].equipment).toEqual(['Club, Mace or Hammer', 'Club, Mace or Hammer', 'Dagger'])
    expect(r.hiredSwords).toEqual([])
    expect(r.stash).toEqual(['Gromril Armour', 'Gromril Armour'])
    expect(r.unplaced).toEqual([])
  })

  it('reads the campaign details panel: EXP on its own line, one item per line, untyped henchman groups, hired swords', () => {
    const r = parseRelicRoster(fixture('evards'))
    expect(r).toMatchObject({ name: 'Evards Quest', typeName: 'BRETONNIAN_CHAPEL_GUARD', gold: 1, wyrdstone: 0, veteranPool: null })
    expect(r.heroes).toHaveLength(5)
    expect(r.heroes[0]).toMatchObject({ typeName: 'QUESTING_KNIGHT', xp: 24 })
    expect(r.heroes[0].equipment).toEqual(['Sword', 'Club, Mace or Hammer', 'Heavy Armour', 'Lucky Charm'])
    expect(r.heroes[1].skills).toEqual(['Guiding Vision'])
    expect(r.henchmen).toHaveLength(6)
    expect(r.henchmen[0]).toMatchObject({ name: 'Pierre', typeName: null, size: 1, xp: 2 })
    expect(r.henchmen[0].equipment).toEqual(['Long Bow', 'Club, Mace or Hammer'])
    expect(r.hiredSwords).toHaveLength(1)
    expect(r.hiredSwords[0]).toMatchObject({ name: 'Halfling', typeName: 'HALFLING SCOUT', xp: 0 })
    expect(r.hiredSwords[0].equipment).toEqual(['Bow', 'Dagger', 'Cooking pot (counts as a Helmet)'])
  })

  it('handles spells with difficulties, mutations, a hired sword on the printer page and an empty kit', () => {
    const grave = parseRelicRoster(fixture('grave'))
    expect(grave.heroes[0].skills).toEqual(['Lifestealer', 'Spell Of Awakening'])
    expect(grave.hiredSwords[0]).toMatchObject({ name: 'Bone Goliath', typeName: 'BONE GOLIATH', stats: { S: 5, T: 5, W: 3, A: 3 } })
    expect(grave.henchmen[0]).toMatchObject({ name: 'Group 1 — Zombie', typeName: 'ZOMBIE', size: 3 })
    expect(grave.henchmen[0].equipment).toEqual([])
    const cult = parseRelicRoster(fixture('cult'))
    expect(cult.heroes[1].mutations).toEqual(['Great Claw'])
    expect(cult.wyrdstone).toBe(1)
    const witch = parseRelicRoster(fixture('witch'))
    expect(witch.heroes[1].injuries).toEqual(['Leg Wound'])
  })

  it('parses every captured roster without leftovers', () => {
    for (const name of ALL) {
      const r = parseRelicRoster(fixture(name))
      expect(r.heroes.length, name).toBeGreaterThan(0)
      expect(r.unplaced, name).toEqual([])
      for (const h of [...r.heroes, ...r.henchmen, ...r.hiredSwords]) expect(h.stats, `${name}: ${h.name}`).not.toBeNull()
    }
  })
})

describe('resolveRelicRoster', () => {
  it('matches warband and unit types by name, with plurals and underscores', () => {
    const r = resolveRelicRoster(parseRelicRoster(fixture('thorgrim')))
    expect(r.template?.id).toBe('dwarf_treasure_hunters')
    expect(r.heroes.map((h) => h.unitId)).toEqual(['dwarf_treasure_hunters_noble', 'dwarf_treasure_hunters_engineer', 'dwarf_treasure_hunters_troll_slayers', 'dwarf_treasure_hunters_troll_slayers'])
    expect(r.henchmen.map((g) => g.unitId)).toEqual(['dwarf_treasure_hunters_beardlings', 'dwarf_treasure_hunters_beardlings'])
    expect(r.heroes[3].skillIds).toContain('master_of_blades')
    expect(r.heroes[1].flags).toEqual({ causesFear: true })
    expect(r.heroes[1].injuries[0]).toMatchObject({ injuryCode: 'horrible_scars' })
    expect(r.heroes[2].flags).toEqual({ immuneToFear: true, frenzy: true })
    expect(r.heroes[0].items.map((i) => i.itemId)).toEqual(['gromril_armour', 'shield', 'dagger', 'helmet', 'pistol', 'club_mace_or_hammer', 'pistol'])
    expect(r.stash.map((i) => i.itemId)).toEqual(['gromril_armour', 'gromril_armour'])
  })

  it('picks the Restless Dead variant when a Bone Goliath is hired, and knows the hired sword', () => {
    const r = resolveRelicRoster(parseRelicRoster(fixture('grave')))
    expect(r.template?.id).toBe('the_restless_dead_variant')
    expect(r.hiredSwords[0].hiredSwordId).toBe('bone_goliath')
    expect(r.heroes.map((h) => h.unitId)).toEqual(['restless_dead_variant_liche', 'restless_dead_variant_necromancer', 'restless_dead_variant_grave_guards', 'restless_dead_variant_grave_guards', 'restless_dead_variant_grave_guards'])
    expect(r.henchmen.map((g) => g.unitId)).toEqual(['restless_dead_variant_zombies', 'restless_dead_variant_wights'])
    expect(r.heroes[0].spellIds.length).toBeGreaterThan(0)
  })

  it('guesses untyped henchman groups from the stat line and says so', () => {
    const r = resolveRelicRoster(parseRelicRoster(fixture('evards')))
    expect(r.template?.id).toBe('bretonnian_chapel_guard')
    expect(r.heroes.map((h) => h.unitId)).toEqual(['bretonnian_questing_knight', 'bretonnian_damsel', 'bretonnian_knight_errant', 'bretonnian_knight_errant', 'bretonnian_knight_errant'])
    expect(r.hiredSwords[0].hiredSwordId).toBe('halfling_scout')
    const guessed = r.henchmen.filter((g) => g.guessed).length
    expect(guessed + r.henchmen.filter((g) => g.unitId === null).length).toBe(r.henchmen.length)
    expect(r.issues.some((i) => /guessed|Pick one/.test(i))).toBe(true)
  })

  it('resolves every captured roster to a template, and lists what a GM must check', () => {
    const expected: Record<string, string> = {
      thorgrim: 'dwarf_treasure_hunters',
      azgul: 'the_sons_of_hashut',
      argent: 'protectorate_of_sigmar',
      grave: 'the_restless_dead_variant',
      evards: 'bretonnian_chapel_guard',
      cult: 'cult_of_the_possessed',
      ashen: 'the_undead',
      ivory: 'sorcerous_society',
      beastmen: 'beastmen_raiders',
      witch: 'witch_hunters',
    }
    for (const name of ALL) {
      const r = resolveRelicRoster(parseRelicRoster(fixture(name)))
      expect(r.template?.id, name).toBe(expected[name])
      for (const h of r.heroes) expect(h.unitId, `${name}: ${h.parsed.name} (${h.parsed.typeName})`).not.toBeNull()
    }
  })

  it('overrides win', () => {
    const parsed = parseRelicRoster(fixture('evards'))
    const r = resolveRelicRoster(parsed, { groupUnits: { 0: 'bretonnian_bowmen' } })
    expect(r.henchmen[0].unitId).toBe('bretonnian_bowmen')
    expect(r.henchmen[0].guessed).toBe(false)
  })
})

describe('payloads', () => {
  it('builds the create payload and the follow-up changes', () => {
    const r = resolveRelicRoster(parseRelicRoster(fixture('grave')))
    const payload = toCreatePayload(r)
    expect(payload).toMatchObject({ name: 'The Call of the Grave', type_rules_id: 'the_restless_dead_variant', gold: 5 })
    expect(payload.heroes).toHaveLength(5)
    expect(payload.heroes[0]).toMatchObject({ xp: 23, level_ups: 8, sort_order: 0 })
    expect(payload.heroes[0].equipment).toEqual([
      { item_rules_id: 'shield', custom_name: null, quantity: 1 },
      { item_rules_id: 'wyrdstone_pendulum', custom_name: null, quantity: 1 },
      { item_rules_id: 'heavy_armour', custom_name: null, quantity: 1 },
    ])
    expect(payload.henchman_groups[0]).toMatchObject({ size: 3, unit_type_rules_id: 'restless_dead_variant_zombies' })

    const created = payload.heroes.map((h, i) => ({ id: `hero-${i}`, sort_order: i, name: h.name }))
    let n = 0
    const changes = followUpChanges(r, created, () => `new-${++n}`)
    expect(changes[0]).toEqual({ table: 'warbands', op: 'update', data: { wyrdstone: 0, veteran_pool: 7 } })
    const liche = changes.find((c) => c.table === 'heroes' && c.op === 'update' && c.id === 'hero-0')
    expect(liche?.data).toMatchObject({ spells: expect.arrayContaining([expect.any(String)]) })
    const goliath = changes.find((c) => c.table === 'heroes' && c.op === 'insert')
    expect(goliath).toMatchObject({ id: 'new-1', data: { is_hired_sword: true, hired_sword_rules_id: 'bone_goliath', xp: 0, equipment_locked: true } })
  })

  it('stacks repeated items and keeps unknown ones as custom', () => {
    expect(toPayloadItems(matchItems(['Dagger', 'Dagger', 'Magic Bean']))).toEqual([
      { item_rules_id: 'dagger', custom_name: null, quantity: 2 },
      { item_rules_id: null, custom_name: 'Magic Bean', quantity: 1 },
    ])
  })

  it('name helpers', () => {
    expect(normaliseName('KNIGHT_ERRANT')).toBe('knight errant')
    expect(normaliseName('The Possessed')).toBe('possessed')
    expect(matchSkillOrSpell('Master Of Blades')).toEqual({ kind: 'skill', id: 'master_of_blades' })
    expect(matchSkillOrSpell('Step Aside')?.kind).toBe('skill')
    expect(matchSkillOrSpell('No Such Thing')).toBeNull()
    expect(matchInjury('Leg Wound').injury?.injuryCode).toBe('leg_wound')
    expect(matchInjury('Hardened')).toMatchObject({ flag: 'immuneToFear' })
  })
})

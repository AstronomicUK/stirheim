import { describe, expect, it } from 'vitest'
import { findWeapon } from '../../rules/data/weapons'
import { combatContextFor } from '../match/fight/odds'
import { loadoutFor } from '../match/fight/combatants'
import { applyHouseRuleDefaults } from '../../rules/resolve/houseRules'
import { combatantFromTemplate, defaultTemplateSide, kitOptionsFor, opponentWeapon, pts, skillGains, statGains, unitsOf } from './model'
import { findWarbandTemplate } from '../../rules/data/warbandTemplates'

describe('simulator model', () => {
  it('builds a combatant from a published unit with its starting stats, kit and race traits', () => {
    const side = defaultTemplateSide('skaven_of_clan_eshin')
    expect(side.unitId).toBe('skaven_assassin_adept')
    expect(side.itemIds).toContain('dagger')
    const c = combatantFromTemplate(side)!
    expect(c.kind).toBe('hero')
    expect(c.stats).toMatchObject({ M: 6, WS: 4, S: 4, I: 5 })
    expect(c.equipment.map((e) => e.itemId)).toEqual(side.itemIds)
    expect(c.skillTableIds?.length).toBeGreaterThan(0)
  })

  it('lists heroes before henchmen and only kit that resolves to an item', () => {
    const t = findWarbandTemplate('mercenaries_reikland')!
    const units = unitsOf(t)
    expect(units[0].role).toBe('hero')
    expect(units.at(-1)?.role).toBe('henchman')
    for (const o of kitOptionsFor(defaultTemplateSide('mercenaries_reikland'))) expect(o.item).toBeDefined()
  })

  it('an opponent hits back with something better than a dagger when he has it', () => {
    const c = combatantFromTemplate({ ...defaultTemplateSide('mercenaries_reikland'), itemIds: ['dagger', 'sword'] })!
    expect(opponentWeapon(loadoutFor(c), 'melee', findWeapon('sword')!).id).toBe('sword')
    expect(opponentWeapon(loadoutFor(c), 'ranged', findWeapon('bow')!).id).toBe('bow')
  })

  it('stat gains and skill gains run end to end for two template warriors', () => {
    const attacker = combatantFromTemplate({ ...defaultTemplateSide('mercenaries_reikland'), itemIds: ['dagger', 'sword'] })!
    const defender = combatantFromTemplate(defaultTemplateSide('skaven_of_clan_eshin'))!
    const houseRules = applyHouseRuleDefaults(undefined)
    const input = { attacker, attackerKit: loadoutFor(attacker), defender, defenderKit: loadoutFor(defender), phase: 'melee' as const, weapons: [findWeapon('sword')!], context: combatContextFor(houseRules, {}), houseRules }
    const stats = statGains(input, 'outOfAction', findWeapon('sword')!)
    expect(stats.rows.map((r) => r.stat)).toEqual(['WS', 'BS', 'S', 'T', 'W', 'A', 'I', 'Ld'])
    expect(stats.rows.find((r) => r.stat === 'A')!.attackGain).toBeGreaterThan(0)
    expect(stats.rows.find((r) => r.stat === 'BS')!.relevant.offensive).toBe(false)
    const skills = skillGains(input, 'offensive', findWeapon('sword')!, true)
    expect(skills.rows.length).toBeGreaterThan(0)
    expect(skills.rows.some((r) => r.skill.name === 'Strike to Injure')).toBe(true)
    expect(pts(0.0412)).toBe('+4.1')
    expect(pts(-0.0002)).toBe('0.0')
  })
})


it('published Wulfen previews use natural weapons without saved equipment', () => {
  const c = combatantFromTemplate({ ...defaultTemplateSide('norse_explorers'), unitId: 'norse_wulfen', itemIds: [] })!
  expect(loadoutFor(c).melee[0]).toMatchObject({ id: 'natural_weapons', strength: 'user' })
  expect(c.stats).toMatchObject({ S: 4, A: 2 })
});


it('Fearsome is visible on a custom unit only while the skill is selected', () => {
  const side = defaultTemplateSide('mercenaries_reikland')
  expect(combatantFromTemplate({ ...side, skillIds: ['fearsome'] })?.traitIds).toContain('causes_fear')
  expect(combatantFromTemplate({ ...side, skillIds: [] })?.traitIds).not.toContain('causes_fear')
})


it.each([
  ['battle_monks_raging_peasants', 'Improvised tools', 0],
  ['battle_monks_warrior_monks', 'Open-hand fighting', 1],
])('uses the appropriate unarmed profile for %s without changing equipped weapons', (unitId, name, bonus) => {
  const side = { ...defaultTemplateSide('battle_monks_of_cathay'), unitId: String(unitId), itemIds: [] }
  const c = combatantFromTemplate(side)!
  const kit = loadoutFor(c)
  expect(kit.melee[0].name).toBe(name)
  expect(kit.melee[0].bonusAttacks ?? 0).toBe(bonus)
  expect(kit.melee[0].strength).toBe('user')
  const equipped = combatantFromTemplate({ ...side, itemIds: ['sword'] })!
  expect(loadoutFor(equipped).melee.map(w => w.id)).toEqual(unitId === 'battle_monks_warrior_monks' ? ['sword', 'natural_weapons'] : ['sword'])
})

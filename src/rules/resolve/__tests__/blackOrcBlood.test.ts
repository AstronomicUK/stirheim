import { expect, it } from 'vitest'
import { warriorFlagsSchema } from '../../../domain/json'
import type { RosterHero, RosterWarband } from '../../types/roster'
import { blackOrcBloodBlock, purchaseBlackOrcBlood } from '../blackOrcBlood'
import { availableSkills, learnSkill } from '../advances'
const young = (id: string): RosterHero => ({ id, name: id, unitTemplateId: 'black_orcs_youngun', stats: { M: 4, WS: 2, BS: 2, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 6 }, xp: 25, levelUps: 8, skillTableIds: ['warband-unique'], skillIds: [], spellIds: [], injuries: [], flags: {}, equipment: [], status: 'active' })
const roster = (): RosterWarband => ({ id: 'w', name: 'Black Orcs', warbandTemplateId: 'black_orcs', gold: 10, wyrdstone: 0, veteranPool: null, heroes: [young('one'), young('two')], henchmenGroups: [], hiredSwords: [], stash: [] })
it('purchases one persistent upgrade, costing exactly 10 gc without granting the later skill or stats', () => {
  const original = roster(), next = purchaseBlackOrcBlood(original, 'one')
  expect(next.roster.gold).toBe(0)
  expect(next.roster.heroes[0]).toEqual({ ...original.heroes[0], flags: { blackOrcBlood: true } })
  expect(warriorFlagsSchema.parse(next.roster.heroes[0].flags).blackOrcBlood).toBe(true)
  expect(next.reason).toContain('10 gc')
  expect(() => purchaseBlackOrcBlood(next.roster, 'one')).toThrow('already')
  expect(() => purchaseBlackOrcBlood({ ...next.roster, gold: 100 }, 'two')).toThrow('Only one')
  expect(original.gold).toBe(10)
})
it('respects captured holders, releases a dead holder’s place and rejects wrong units or insufficient gold', () => {
  const r = roster(); r.heroes[0].flags.blackOrcBlood = true; r.heroes[0].status = 'captured'
  expect(blackOrcBloodBlock(r, 'two')).toContain('Only one')
  r.heroes[0].status = 'dead'; expect(blackOrcBloodBlock(r, 'two')).toBeNull()
  expect(blackOrcBloodBlock({ ...r, gold: 9 }, 'two')).toContain('10 gc')
  expect(blackOrcBloodBlock({ ...r, warbandTemplateId: 'orcs' }, 'two')).toContain('Black Orc warband')
  r.heroes[1].unitTemplateId = 'black_orcs_black_orc'; expect(blackOrcBloodBlock(r, 'two')).toContain('Young’un')
})
it('uses a real purchase for the Proven Warrior prerequisite while retaining a selectable warning', () => {
  const r = roster()
  const entry = (hero: RosterHero) => availableSkills(hero, 'black_orcs').flatMap(t => t.skills).find(s => s.id === 'black_orcs_skills_proven_warrior')
  expect(entry(r.heroes[0])?.blocked).toContain('No purchase is recorded')
  const upgraded = purchaseBlackOrcBlood(r, 'one').roster.heroes[0]
  expect(entry(upgraded)?.blocked).toBeUndefined()
  expect(entry({ ...upgraded, xp: 24 })?.blocked).toContain('25 Experience')
})


it('Proven Warrior grants Black Orc skill tables without replacing identity, stats, kit or experience', () => {
  const h = young('proven')
  const learned = learnSkill(h, 'black_orcs_skills_proven_warrior', undefined, { warbandTemplateId: 'black_orcs' }).value
  expect(learned.skillTableIds).toEqual(expect.arrayContaining(['combat', 'shooting', 'strength', 'speed', 'warband-unique']))
  expect(learned.unitTemplateId).toBe(h.unitTemplateId)
  expect(learned.stats).toEqual(h.stats); expect(learned.xp).toBe(h.xp); expect(learned.equipment).toEqual(h.equipment)
  expect(learned.levelUps).toBe(h.levelUps + 1)
  const legacy = { ...h, skillIds: ['black_orcs_skills_proven_warrior'] }
  expect(availableSkills(legacy, 'black_orcs').map(t => t.tableId)).toContain('strength')
  expect(learnSkill(legacy, 'mighty_blow', undefined, { warbandTemplateId: 'black_orcs' }).value.skillIds).toContain('mighty_blow')
  expect(availableSkills(h, 'black_orcs').map(t => t.tableId)).not.toContain('strength')
})

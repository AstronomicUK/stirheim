import { describe, expect, it } from 'vitest'
import { toRosterWarband, type PendingAdvanceRow } from '../../domain'
import { CAPTAIN_ID, REIKLAND_ID, WATCHMEN_ID, reiklandGroups, reiklandHeroes, reiklandItems, reiklandWatch } from '../../domain/__tests__/fixtures'
import { findWarbandTemplate } from '../../rules/data/warbandTemplates'
import type { RosterHero, RosterHiredSword, RosterWarband } from '../../rules/types/roster'
import {
  buildResolution,
  defaultPromotedName,
  effectiveStep,
  emptyDraft,
  draftFromRolled,
  readRolled,
  rolledFromDraft,
  findSubject,
  groupAdvancesBySubject,
  hiredSwordMaxima,
  hiredSwordSkillTables,
  planGroup,
  planHero,
  readResolution,
  reroll,
  setDice,
  setSkill,
  setSkillInstead,
  setStat,
  setSubRoll,
  singular,
  summaryText,
  toggleSkillTable,
  type AdvanceContext,
  type AdvanceDraft,
  setReward,
} from './model'

const roster: RosterWarband = toRosterWarband(reiklandWatch, reiklandHeroes, reiklandGroups, reiklandItems)
const template = findWarbandTemplate(reiklandWatch.type_rules_id)
const ctx: AdvanceContext = { roster, template }
const NEW_ID = 'dddddddd-0000-4000-8000-000000000001'

function advance(id: string, subject_type: 'hero' | 'group', subject_id: string, threshold_xp: number, created_at: string): PendingAdvanceRow {
  return { id, warband_id: REIKLAND_ID, subject_type, subject_id, threshold_xp, created_at, resolved_at: null, resolution: null, rolled: null }
}

function heroSubject(hero: RosterHero) {
  return { kind: 'hero', hero } as const
}

const captain = roster.heroes.find((h) => h.id === CAPTAIN_ID)!
const watchmen = roster.henchmenGroups.find((g) => g.id === WATCHMEN_ID)!

function rolled(a: number, b: number, draft: AdvanceDraft = emptyDraft(NEW_ID)): AdvanceDraft {
  return setDice(draft, a, b)
}

describe('groupAdvancesBySubject', () => {
  it('a hired caster can improve a known spell and retain the improvement on the hired-sword roster', () => {
    const sword: RosterHiredSword = { id: NEW_ID, hiredSwordId: 'warlock', name: 'QA Warlock', stats: captain.stats, xp: 2, levelUps: 0, skillIds: [], spellIds: ['fires_of_uzhul'], flags: {}, injuries: [], equipment: [], status: 'active' }
    const draft = { ...rolled(5, 6), mode: 'spell' as const, spellId: 'fires_of_uzhul' }
    const plan = planHero(draft, { kind: 'hiredSword', sword }, { ...ctx, roster: { ...roster, hiredSwords: [sword] } })
    expect(plan.allowSpell).toBe(true)
    expect(plan.result?.next.hiredSwords[0]).toMatchObject({ spellIds: ['fires_of_uzhul'], levelUps: 1, flags: { spellDifficultyReductions: { fires_of_uzhul: 1 } } })
  })
  it('groups by warrior, oldest warrior first, each warrior oldest advance first', () => {
    const rows = [
      advance('a3', 'hero', CAPTAIN_ID, 24, '2026-09-04T12:00:00Z'),
      advance('g1', 'group', WATCHMEN_ID, 2, '2026-09-04T11:00:00Z'),
      advance('a1', 'hero', CAPTAIN_ID, 20, '2026-09-04T10:00:00Z'),
    ]
    const groups = groupAdvancesBySubject(rows)
    expect(groups.map((g) => g.subjectId)).toEqual([CAPTAIN_ID, WATCHMEN_ID])
    expect(groups[0].advances.map((a) => a.id)).toEqual(['a1', 'a3'])
    expect(groups[0].advances.map((a) => a.threshold_xp)).toEqual([20, 24])
    expect(groups[1].subjectType).toBe('group')
  })

  it('is empty for no rows', () => {
    expect(groupAdvancesBySubject([])).toEqual([])
  })
})

describe('findSubject', () => {
  it('finds heroes and groups, and reports a missing warrior as null', () => {
    expect(findSubject(roster, 'hero', CAPTAIN_ID)?.kind).toBe('hero')
    expect(findSubject(roster, 'group', WATCHMEN_ID)?.kind).toBe('group')
    expect(findSubject(roster, 'hero', NEW_ID)).toBeNull()
  })

  it('finds hired swords under the hero subject type', () => {
    const sword: RosterHiredSword = {
      id: NEW_ID,
      hiredSwordId: 'ogre_bodyguard',
      name: 'Grumlok',
      stats: { M: 6, WS: 3, BS: 2, S: 4, T: 4, W: 3, I: 3, A: 2, Ld: 7 },
      xp: 2,
      levelUps: 0,
      skillIds: [],
      spellIds: [],
      injuries: [],
      flags: {},
      equipment: [],
      status: 'active',
    }
    const withSword = { ...roster, hiredSwords: [sword] }
    expect(findSubject(withSword, 'hero', NEW_ID)?.kind).toBe('hiredSword')
    expect(hiredSwordSkillTables(sword)).toEqual(['combat', 'strength'])
  })

  it("gives a racial-profile hired sword its own maxima instead of Human's — #61", () => {
    const dwarfSword: RosterHiredSword = {
      id: NEW_ID,
      hiredSwordId: 'runesmith_journeyman',
      name: 'Runesmith Journeyman',
      stats: { M: 3, WS: 4, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 8 },
      xp: 0,
      levelUps: 0,
      skillIds: [],
      spellIds: [],
      injuries: [],
      flags: {},
      equipment: [],
      status: 'active',
    }
    const dwarf = hiredSwordMaxima(dwarfSword, reiklandWatch.type_rules_id)
    expect(dwarf.profile).toBe('Dwarf')
    expect(dwarf.maxima.WS).toBe(7)

    const ogreSword: RosterHiredSword = { ...dwarfSword, hiredSwordId: 'ogre_bodyguard', name: 'Grumlok' }
    const ogre = hiredSwordMaxima(ogreSword, reiklandWatch.type_rules_id)
    expect(ogre.profile).toBe('Ogre')
  })
})

describe('summaryText and buildResolution', () => {
  it('describes a characteristic increase', () => {
    expect(summaryText({ kind: 'hero', subjectName: 'Ulrich', roll2d6: 9, subRoll: 5, dice: [4, 5], outcome: 'stat', stat: 'T', before: 3, after: 4 })).toBe(
      'Rolled 9 (then 5): +1 Toughness, now T4',
    )
  })

  it('describes a skill, a spell and a promotion', () => {
    expect(summaryText({ kind: 'hero', subjectName: 'Ulrich', roll2d6: 4, dice: [2, 2], outcome: 'skill', skillId: 'step_aside', skillName: 'Step Aside', tableName: 'Combat Skills' })).toBe(
      'Rolled 4: learned Step Aside (Combat Skills)',
    )
    expect(summaryText({ kind: 'hero', subjectName: 'Magister', roll2d6: 11, dice: [5, 6], outcome: 'spell', spellId: 'x', spellName: 'Vision of Torment' })).toBe(
      'Rolled 11: learned the spell Vision of Torment',
    )
    expect(summaryText({ kind: 'group', subjectName: 'Watchmen', roll2d6: 11, dice: [5, 6], outcome: 'promotion', newHeroName: 'Watchman 5', rerolled: [3] })).toBe(
      "Rolled 11: The lad's got talent — Watchman 5 becomes a hero · re-rolled 3",
    )
  })

  it('names the whole group for a henchman increase', () => {
    expect(summaryText({ kind: 'group', subjectName: 'Watchmen', roll2d6: 5, dice: [2, 3], outcome: 'stat', stat: 'S', before: 3, after: 4, groupSize: 3 })).toBe(
      'Rolled 5: +1 Strength for all 3 Watchmen, now S4',
    )
  })

  it('builds a versioned resolution without the group size and with empty re-rolls dropped', () => {
    const r = buildResolution({ kind: 'group', subjectName: 'Watchmen', roll2d6: 5, dice: [2, 3], outcome: 'stat', stat: 'S', before: 3, after: 4, groupSize: 3, rerolled: [] })
    expect(r).toEqual({ version: 1, kind: 'group', subjectName: 'Watchmen', roll2d6: 5, dice: [2, 3], outcome: 'stat', stat: 'S', before: 3, after: 4, text: 'Rolled 5: +1 Strength for all 3 Watchmen, now S4' })
    expect(readResolution(r as unknown as Record<string, unknown>)).toEqual({ subjectName: 'Watchmen', text: r.text })
    expect(readResolution(null)).toEqual({ subjectName: null, text: null })
  })
})

describe('planHero', () => {
  it('needs a roll first', () => {
    const plan = planHero(emptyDraft(NEW_ID), heroSubject(captain), ctx)
    expect(plan.need).toBe('roll')
    expect(plan.result).toBeNull()
    expect(plan.maxima.profile).toBe('Human')
    expect(plan.skillTables.map((t) => t.tableId)).toEqual(['combat', 'shooting', 'academic', 'strength', 'speed'])
  })

  it('offers a skill on 2-5 and applies the chosen one', () => {
    const pending = planHero(rolled(2, 2), heroSubject(captain), ctx)
    expect(pending.roll?.kind).toBe('newSkill')
    expect(pending.need).toBe('skill')
    expect(pending.allowSpell).toBe(false)

    const plan = planHero(setSkill(rolled(2, 2), 'step_aside'), heroSubject(captain), ctx)
    expect(plan.need).toBeNull()
    expect(plan.error).toBeNull()
    const next = plan.result!.next.heroes.find((h) => h.id === CAPTAIN_ID)!
    expect(next.skillIds).toEqual(['step_aside'])
    expect(next.levelUps).toBe(1)
    expect(plan.result!.resolution).toMatchObject({ version: 1, kind: 'hero', outcome: 'skill', roll2d6: 4, skillId: 'step_aside', skillName: 'Step Aside', tableName: 'Combat Skills' })
    expect(plan.result!.resolution.text).toBe('Rolled 4: learned Step Aside (Combat Skills)')
  })

  it('reports a rules error instead of throwing when the skill is not on an available table', () => {
    const plan = planHero(setSkill(rolled(2, 2), 'no_such_skill'), heroSubject(captain), ctx)
    expect(plan.result).toBeNull()
    expect(plan.error).toMatch(/No skill with id/)
  })

  it('asks for the sub-roll on 6, 8 and 9 and then raises the stat', () => {
    expect(planHero(rolled(3, 3), heroSubject(captain), ctx).need).toBe('subRoll')
    const plan = planHero(setSubRoll(rolled(3, 3), 2), heroSubject(captain), ctx)
    expect(plan.subStat).toBe('S')
    expect(plan.result!.next.heroes.find((h) => h.id === CAPTAIN_ID)!.stats.S).toBe(4)
    expect(plan.result!.resolution).toMatchObject({ outcome: 'stat', stat: 'S', before: 3, after: 4, subRoll: 2 })
    expect(plan.result!.resolution.text).toBe('Rolled 6 (then 2): +1 Strength, now S4')
  })

  it('takes the other option when the sub-rolled stat is at its racial maximum, and any other characteristic (or a skill) when both are (#63)', () => {
    // Rolled 6 then 1-3: Strength. Strength is maxed, so the pair's other option, Attacks, is taken.
    const strong: RosterHero = { ...captain, stats: { ...captain.stats, S: 4 } }
    const other = planHero(setSubRoll(rolled(3, 3), 1), heroSubject(strong), ctx)
    expect(other.need).toBeNull()
    expect(other.subStat).toBe('A')
    expect(other.skillReason).toMatch(/Strength is already at its racial maximum of 4, so the other option, Attacks/)
    expect(other.statOptions.map((o) => [o.stat, o.eligible])).toEqual([
      ['S', false],
      ['A', true],
    ])
    expect(other.result!.resolution).toMatchObject({ outcome: 'stat', stat: 'A', subRoll: 1 })

    // Both maxed: the rulebook's "you may increase any other characteristic instead" fallback, same
    // as the roll-of-7 branch — not a forced skill. Movement is excluded here only because this
    // Human captain's Movement already sits at its own racial maximum.
    const both: RosterHero = { ...captain, stats: { ...captain.stats, S: 4, A: 4 } }
    const pending = planHero(setSubRoll(rolled(3, 3), 1), heroSubject(both), ctx)
    expect(pending.need).toBe('stat')
    expect(pending.fallbackToAny).toBe(true)
    expect(pending.statOptions.filter((o) => o.eligible).map((o) => o.stat)).toEqual(['WS', 'BS', 'T', 'W', 'I', 'Ld'])

    // Picking one of the fallback characteristics raises it.
    const picked = planHero(setStat(setSubRoll(rolled(3, 3), 1), 'T'), heroSubject(both), ctx)
    expect(picked.result!.resolution).toMatchObject({ outcome: 'stat', stat: 'T', subRoll: 1 })

    // A skill is still offered as an alternative to the fallback characteristic.
    const skillInstead = planHero(setSkillInstead(setSubRoll(rolled(3, 3), 1), true), heroSubject(both), ctx)
    expect(skillInstead.need).toBe('skill')
    expect(skillInstead.skillReason).toMatch(/Strength and Attacks are both at their racial maximum/)
    const plan = planHero(setSkill(setSkillInstead(setSubRoll(rolled(3, 3), 1), true), 'strike_to_injure'), heroSubject(both), ctx)
    expect(plan.result!.resolution).toMatchObject({ outcome: 'skill', skillId: 'strike_to_injure', subRoll: 1 })
  })

  it('greys maxed stats on a choice and allows a skill instead when both are maxed', () => {
    const sharp: RosterHero = { ...captain, stats: { ...captain.stats, WS: 6 } }
    const one = planHero(rolled(3, 4), heroSubject(sharp), ctx)
    expect(one.need).toBe('stat')
    expect(one.fallbackToAny).toBe(false)
    expect(one.statOptions.map((o) => [o.stat, o.eligible])).toEqual([
      ['WS', false],
      ['BS', true],
    ])
    expect(planHero(setStat(rolled(3, 4), 'WS'), heroSubject(sharp), ctx).need).toBe('stat')
    expect(planHero(setStat(rolled(3, 4), 'BS'), heroSubject(sharp), ctx).result!.resolution.text).toBe('Rolled 7: +1 Ballistic Skill, now BS5')

    const both: RosterHero = { ...captain, stats: { ...captain.stats, WS: 6, BS: 6 } }
    const fallback = planHero(rolled(3, 4), heroSubject(both), ctx)
    expect(fallback.fallbackToAny).toBe(true)
    expect(fallback.statOptions.filter((o) => o.eligible).map((o) => o.stat)).toEqual(['S', 'T', 'W', 'I', 'A', 'Ld'])
    const skill = planHero(setSkillInstead(rolled(3, 4), true), heroSubject(both), ctx)
    expect(skill.need).toBe('skill')
    expect(skill.skillReason).toMatch(/both at their racial maximum/)
  })
})

describe('planGroup', () => {
  it('applies a fixed increase straight away', () => {
    const plan = planGroup(rolled(2, 3), watchmen, ctx)
    expect(plan.roll?.kind).toBe('statIncrease')
    expect(plan.need).toBeNull()
    const next = plan.result!.next.henchmenGroups.find((g) => g.id === WATCHMEN_ID)!
    expect(next.stats.S).toBe(4)
    expect(next.statIncreases.S).toBe(1)
    expect(next.levelUps).toBe(1)
    expect(plan.result!.resolution.text).toBe('Rolled 5: +1 Strength for all 3 Watchmen, now S4')
  })

  it('demands a re-roll when the stat was already increased, and keeps the old total on record', () => {
    const increased = { ...watchmen, statIncreases: { S: 1 } }
    const plan = planGroup(rolled(2, 3), increased, ctx)
    expect(plan.need).toBe('reroll')
    expect(plan.rerollReason).toMatch(/Strength is already increased once/)
    const again = reroll(rolled(2, 3))
    expect(again.dice).toEqual([null, null])
    expect(again.rerolled).toEqual([5])
    const after = planGroup(setDice(again, 1, 1), increased, ctx)
    expect(after.result!.resolution).toMatchObject({ outcome: 'stat', stat: 'I', rerolled: [5] })
  })

  it('offers only the stats that can still be increased on a choice', () => {
    const plan = planGroup(rolled(3, 3), { ...watchmen, statIncreases: { WS: 1 } }, ctx)
    expect(plan.roll?.kind).toBe('statChoice')
    expect(plan.need).toBe('stat')
    expect(plan.statOptions.map((o) => [o.stat, o.eligible])).toEqual([
      ['BS', true],
      ['WS', false],
    ])
    expect(planGroup(setStat(rolled(3, 3), 'WS'), { ...watchmen, statIncreases: { WS: 1 } }, ctx).need).toBe('stat')
    expect(planGroup(setStat(rolled(3, 3), 'BS'), { ...watchmen, statIncreases: { WS: 1 } }, ctx).result!.resolution.text).toBe(
      'Rolled 6: +1 Ballistic Skill for all 3 Watchmen, now BS4',
    )
  })

  it("promotes a henchman on The lad's got talent once a name and two tables are given", () => {
    const pending = planGroup(rolled(5, 6), watchmen, ctx, (id) => id.toUpperCase())
    expect(pending.roll?.kind).toBe('ladsGotTalent')
    expect(pending.need).toBe('promotion')
    expect(pending.heroCapacity).toBe(6)
    expect(pending.dissolvesGroup).toBe(false)
    expect(pending.tableOptions.slice(0, 2)).toEqual([
      { id: 'combat', name: 'COMBAT' },
      { id: 'shooting', name: 'SHOOTING' },
    ])

    let draft = rolled(5, 6)
    draft = { ...draft, newHeroName: 'Watchman 1' }
    draft = toggleSkillTable(toggleSkillTable(draft, 'combat'), 'speed')
    const plan = planGroup(draft, watchmen, ctx)
    expect(plan.error).toBeNull()
    expect(plan.result!.next.heroes).toHaveLength(5)
    const hero = plan.result!.next.heroes.find((h) => h.id === NEW_ID)!
    expect(hero.name).toBe('Watchman 1')
    expect(hero.skillTableIds).toEqual(['combat', 'speed'])
    expect(plan.result!.next.henchmenGroups.find((g) => g.id === WATCHMEN_ID)!.size).toBe(2)
    expect(plan.result!.resolution).toMatchObject({ outcome: 'promotion', newHeroId: NEW_ID, newHeroName: 'Watchman 1', skillTableIds: ['combat', 'speed'] })
    // The new hero rolls on the hero table at once and the rest of the group re-roll: both queued.
    expect(plan.result!.resolution.followUps).toEqual([
      { subjectType: 'hero', subjectId: NEW_ID, thresholdXp: watchmen.xp },
      { subjectType: 'group', subjectId: WATCHMEN_ID, thresholdXp: watchmen.xp },
    ])
  })

  it('refuses a promotion when the hero roster is full', () => {
    // Six heroes is the rulebook ceiling: five list slots plus one Lad already promoted.
    const full: RosterWarband = { ...roster, heroes: [...roster.heroes, { ...captain, id: NEW_ID, name: 'Fifth' }, { ...captain, id: 'sixth', name: 'Sixth' }] }
    const plan = planGroup(rolled(5, 6), watchmen, { roster: full, template })
    expect(plan.need).toBe('reroll')
    expect(plan.rerollReason).toMatch(/maximum of 6 heroes/)
  })

  it('a third table pick replaces the oldest', () => {
    const draft = toggleSkillTable(toggleSkillTable(toggleSkillTable(emptyDraft(NEW_ID), 'combat'), 'speed'), 'academic')
    expect(draft.skillTableIds).toEqual(['speed', 'academic'])
    expect(toggleSkillTable(draft, 'speed').skillTableIds).toEqual(['academic'])
  })
})

describe('pick later', () => {
  it('stores the dice of a rolled advance and restarts a draft at the choice', () => {
    const rolled = rolledFromDraft({ ...emptyDraft(NEW_ID), dice: [5, 6], rerolled: [3], mode: 'spell' }, 'New skill')
    expect(rolled).toEqual({ version: 1, dice: [5, 6], rerolled: [3], mode: 'spell', text: 'Rolled 11: New skill' })
    expect(rolledFromDraft(emptyDraft(NEW_ID), 'x')).toBeNull()
    const back = draftFromRolled(rolled as unknown as Record<string, unknown>, NEW_ID, 'Lad 1')
    expect(back).toMatchObject({ dice: [5, 6], rerolled: [3], mode: 'spell', step: 'choose', newHeroId: NEW_ID, newHeroName: 'Lad 1' })
    expect(draftFromRolled(null, NEW_ID)).toBeNull()
    expect(draftFromRolled({ dice: ['a', 2] }, NEW_ID)).toBeNull()
    expect(readRolled(rolled as unknown as Record<string, unknown>)).toBe('Rolled 11: New skill')
    expect(readRolled(null)).toBeNull()
  })
})

describe('names and steps', () => {
  it('singularises group names', () => {
    expect(singular('Watchmen')).toBe('Watchman')
    expect(singular('Marksmen')).toBe('Marksman')
    expect(singular('Youngbloods')).toBe('Youngblood')
    expect(singular('Zombies')).toBe('Zomby')
    expect(singular('Possessed')).toBe('Possessed')
  })

  it('picks the next free promoted name', () => {
    expect(defaultPromotedName(watchmen, roster)).toBe('Watchman 1')
    const taken = { ...roster, heroes: [...roster.heroes, { ...captain, id: NEW_ID, name: 'Watchman 1' }] }
    expect(defaultPromotedName(watchmen, taken)).toBe('Watchman 2')
  })

  it('never shows a step the draft has not earned', () => {
    const draft = { ...emptyDraft(NEW_ID), step: 'review' as const }
    expect(effectiveStep(draft, { need: 'roll', result: null })).toBe('roll')
    expect(effectiveStep(draft, { need: 'skill', result: null })).toBe('choose')
    const result = planGroup(rolled(2, 3), watchmen, ctx).result
    expect(effectiveStep(draft, { need: null, result })).toBe('review')
  })

  it('changing a die forgets the choices made after the roll', () => {
    const draft = setSkill(setSubRoll(rolled(3, 3), 2), 'step_aside')
    const changed = setDice(draft, 2, 2)
    expect(changed.subRoll).toBeNull()
    expect(changed.skillId).toBeNull()
    expect(changed.step).toBe('roll')
  })
})

describe('Rewards of the Shadowlord', () => {
  const possessed = findWarbandTemplate('cult_of_the_possessed')
  const magister: RosterHero = { ...captain, id: 'mag', name: 'Vhorsk', unitTemplateId: 'cult_of_the_possessed_magister', skillTableIds: ['combat', 'academic', 'speed'], skillIds: [], spellIds: [], equipment: [{ itemId: 'sword', quantity: 1 }] }
  const cultRoster: RosterWarband = { ...roster, warbandTemplateId: 'cult_of_the_possessed', heroes: [magister] }
  const on: AdvanceContext = { roster: cultRoster, template: possessed, houseRules: { rewardsOfTheShadowlord: true } }

  it('is offered on a New Skill only when the house rule is on and the warrior is a Possessed Magister or Mutant', () => {
    expect(planHero(rolled(2, 2), heroSubject(magister), on).allowReward).toBe(true)
    expect(planHero(rolled(2, 2), heroSubject(magister), { ...on, houseRules: { rewardsOfTheShadowlord: false } }).allowReward).toBe(false)
    expect(planHero(rolled(2, 2), heroSubject(captain), { roster, template, houseRules: { rewardsOfTheShadowlord: true } }).allowReward).toBe(false)
    // A characteristic roll never offers it.
    expect(planHero(rolled(4, 5), heroSubject(magister), on).allowReward).toBe(false)
  })

  it('rolls the table instead of taking a skill and carries the outcome into the roster and the record', () => {
    let draft = setReward(rolled(2, 2), { dice: [4, 5] })
    const plan = planHero(draft, heroSubject(magister), on)
    expect(plan.need).toBeNull()
    expect(plan.reward?.row?.kind).toBe('chaosArmour')
    const next = plan.result!.next.heroes.find((h) => h.id === 'mag')!
    expect(next.equipment.some((e) => e.itemId === 'chaos_armour')).toBe(true)
    expect(next.skillIds).toEqual([])
    expect(plan.result!.resolution).toMatchObject({ outcome: 'reward', rewardTotal: 9, rewardTitle: 'Chaos Armour' })
    expect(plan.result!.resolution.text).toMatch(/Rolled 4: Rewards of the Shadowlord, rolled 9: Chaos Armour\. Chaos Armour, 4\+ save\./)
    // A result that still needs a choice leaves the plan waiting.
    draft = setReward(rolled(2, 2), { dice: [6, 6] })
    expect(planHero(draft, heroSubject(magister), on).need).toBe('reward')
    // Pick later keeps the mode.
    expect(rolledFromDraft(draft, 'New skill')?.mode).toBe('reward')
  })
})


it('requires a recorded maximum-profile ruling for uncertain hired swords and preserves it on the hire',()=>{
 const sword:RosterHiredSword={id:NEW_ID,hiredSwordId:'chaos_centaur',name:'Centaur',stats:{...captain.stats,S:3},xp:2,levelUps:0,skillIds:[],spellIds:[],flags:{},injuries:[],equipment:[],status:'active'}
 const subject={kind:'hiredSword' as const,sword},context={...ctx,roster:{...roster,hiredSwords:[sword]}}
 const draft=rolled(3,3)
 expect(planHero(draft,subject,context).need).toBe('maxima')
 const agreed={...draft,subRoll:1,stat:'S' as const,agreedRacialMaxima:{M:9,WS:7,BS:6,S:5,T:5,W:4,I:6,A:4,Ld:9},agreedRacialMaximaReason:'Campaign agreed Beastman limits with M9'}
 expect(planHero(agreed,subject,context).need).toBe('maxima')
 const confirmed={...agreed,maximaRulingConfirmed:true}
 const plan=planHero(confirmed,subject,context)
 expect(plan.result?.next.hiredSwords[0].flags.agreedRacialMaxima?.M).toBe(9)
 expect(plan.result?.resolution.text).toContain('Campaign agreed')
 expect(hiredSwordMaxima(plan.result!.next.hiredSwords[0],roster.warbandTemplateId).requiresRuling).not.toBe(true)
 const saved=rolledFromDraft(confirmed,'Stat gain')
 expect(draftFromRolled(saved as unknown as Record<string,unknown>,NEW_ID)?.agreedRacialMaxima).toEqual(agreed.agreedRacialMaxima)
 expect(planHero(rolled(5,6),subject,context).need).toBe('skill')
})

import { SCENARIO_REWARD_RULES } from '../../../rules/data/campaign/scenarioRewardRules'
import { describe, it, expect } from 'vitest'
import { emptyDraft, type ReportDraft } from './state'
import { scenarioHoardFinds, scenarioRewards } from './scenarioRewards'
import type { Participants } from './participants'
import type { RosterHero } from '../../../rules/types/roster'
const participants: Participants = { heroes: ['one','two','three','four'].map(id => ({ id, name: id } as RosterHero)), hiredSwords: [], groups: [], satOut: [], leaderId: 'one' }
const base = { ...emptyDraft(), result: 'won' as const }
const derive = (id: string, state: typeof base.scenarioRewards, changes: Partial<ReportDraft> = {}) => scenarioRewards({ ...base, ...changes, scenarioRewards: state }, id, participants)

describe('scenario-earned treasure', () => {
  it('caps objective-building rewards and rejects non-participants, hires and casualties', () => {
    expect(derive('defend_the_find', { buildingHeroes: ['one','two','three','four'] }).shards).toBe(3)
    expect(derive('defend_the_find', { buildingHeroes: ['one','one'] }).shards).toBe(1)
    expect(derive('defend_the_find', { buildingHeroes: ['hire'] }).problems).toHaveLength(1)
    expect(derive('defend_the_find', { buildingHeroes: ['one'] }, { heroesOut: ['one'] }).problems).toHaveLength(1)
  })
  it('limits counts to the source counter supply and ignores stale treasure from another scenario', () => {
    expect(derive('wyrdstone_hunt', { counters: 4 }).shards).toBe(4)
    expect(derive('wyrdstone_hunt', { counters: 5 }).problems).toHaveLength(1)
    expect(derive('finders_keepers', { counters: 4 }).problems).toHaveLength(1)
    expect(derive('treasure_hunt', { counters: -1 }).problems).toHaveLength(1)
    expect(derive('skirmish', { counters: 4 }).shards).toBe(0)
  })
  it('Chance Encounter uses Hero casualties, caps captured shards, and never subtracts existing treasury shards', () => {
    const d = derive('chance_encounter', { ownStarting: 1, enemyStarting: 2, enemyHeroesOut: 9 }, { heroesOut: ['one', 'two', 'hire'] })
    expect(d.shards).toBe(2)
    expect(d.notes[0]).toContain('2 own Heroes out of action, retained 0')
    expect(derive('chance_encounter', {}).problems).toHaveLength(1)
    expect(derive('chance_encounter', { ownStarting: 4, enemyStarting: 2, enemyHeroesOut: 0 }).problems).toHaveLength(1)
  })
  it('Hidden Treasure rolls each find separately and keeps valued gems as items', () => {
    const d = derive('hidden_treasure', { finds: {
      gold: { discovery: null, dice: [2,3,4] }, shards: { discovery: 5, dice: [2] },
      armour: { discovery: 3, dice: [] }, sword: { discovery: 3, dice: [] }, gems: { discovery: 6, dice: [3] },
    } })
    expect(d.problems).toEqual([])
    expect(d.gold).toBe(9)
    expect(d.shards).toBe(2)
    expect(d.items).toEqual([{ item_rules_id: 'sword', custom_name: null, quantity: 1 }, { item_rules_id: null, custom_name: 'Gem (worth 10 gc)', quantity: 3 }])
    expect(d.notes.join('\n')).toContain('Light armour: discovery D6 3, needed 4+; not found')
    expect(d.notes.join('\n')).toContain('3D6 rolled 2, 3, 4')
  })
  it('requires all successful quantities, ignores quantities left on failed finds, and rejects invalid dice', () => {
    const state = { finds: { gold: { discovery: null, dice: [6,6,7] }, shards: { discovery: 1, dice: [3] }, armour: { discovery: 4, dice: [] }, sword: { discovery: 1, dice: [] }, gems: { discovery: 5, dice: [] } } }
    const d = derive('hidden_treasure', state)
    expect(d.problems).toHaveLength(2)
    expect(d.shards).toBe(0)
    expect(d.items[0].item_rules_id).toBe('light_armour')
  })
  it('Lost Prince requires a surviving son; losing or failed rescues ignore previously entered finds', () => {
    expect(derive('the_lost_prince', {}).problems).toEqual(['Record whether the merchant’s son survived.'])
    const dead = derive('the_lost_prince', { princeSurvived: false, finds: { gold: { discovery: null, dice: [6,6,6,6,6] } } })
    expect(dead.problems).toEqual([])
    expect(dead.gold).toBe(0)
    expect(dead.notes[0]).toContain('no reward')
    expect(scenarioRewards({ ...base, result: 'lost' }, 'hidden_treasure', participants).problems).toEqual([])
    expect(derive('the_lost_prince', { princeSurvived: true }).problems).toHaveLength(7)
  })
  it('uses 2D6 for Beujuntae discovery and includes the flat gold bonus', () => {
    const d = derive('the_secrets_of_beujuntae', { finds: {
      gold: { discovery: null, dice: [2,3] },
      sickle: { discovery: null, discoveryDice: [3,3], dice: [] },
      gems: { discovery: null, discoveryDice: [3,3], dice: [6] },
      bone: { discovery: null, discoveryDice: [4,4], dice: [] },
    } })
    expect(d.problems).toEqual([])
    expect(d.gold).toBe(10)
    expect(d.items).toHaveLength(2)
    expect(d.notes.join(' ')).toContain('2D6 3, 3 (total 6)')
    expect(d.items.some(item => item.custom_name?.includes('Gem'))).toBe(false)
  })
  it('requires the event condition, preserves distinct armour rows, and treats jewellery rolls as value', () => {
    const rule = SCENARIO_REWARD_RULES.the_mummy
    if (rule.kind !== 'hoard') throw new Error('Expected hoard')
    const finds = Object.fromEntries(rule.finds.map(find => [find.id, { discovery: find.threshold ? 6 : null, dice: typeof find.quantity === 'number' ? [] : Array(find.quantity.count).fill(2) }]))
    expect(derive('the_mummy', { finds }).problems).toHaveLength(1)
    expect(derive('the_mummy', { conditions: { mummy: false }, finds }).items).toEqual([])
    const d = derive('the_mummy', { conditions: { mummy: true }, finds })
    expect(d.problems).toEqual([])
    expect(d.items.filter(item => item.item_rules_id === 'light_armour')).toHaveLength(2)
    expect(d.items).toContainEqual({ item_rules_id: null, custom_name: 'Jewellery (worth 20 gc)', quantity: 1 })
    expect(d.gold).toBe(10)
  })
  it('applies ransom bonuses and permits qualifying grave looting without winning', () => {
    expect(derive('one_man_s_rescue_is_another_man_s_kidnap', { finds: { ransom: { discovery: null, dice: [1,1,1,1,1] } } }).gold).toBe(15)
    const d = scenarioRewards({ ...base, result: 'lost', scenarioRewards: { conditions: { erasmus: true }, finds: { grave: { discovery: null, dice: [1,2,3,4] } } } }, 'a_night_in_the_graveyard', participants)
    expect(d.gold).toBe(30)
    expect(d.problems).toEqual([])
    expect(derive('bar_room_brawl', { conditions: { sam: false } }).gold).toBe(0)
  })

})

describe('scenario bounties and individually looted rewards', () => {
  it('pays wolf and vermin bounties even after losing, requiring a valid count', () => {
    expect(derive('wolf_hunt', { bountyCount: 3 }, { result: 'lost' }).gold).toBe(30)
    expect(derive('the_rat_s_lair', { bountyCount: 7 }, { result: 'lost' }).gold).toBe(35)
    expect(derive('wolf_hunt', {}).problems).toHaveLength(1)
    expect(derive('wolf_hunt', { bountyCount: -1 }).problems).toHaveLength(1)
    expect(derive('wolf_hunt', { bountyCount: 1.5 }).problems).toHaveLength(1)
  })
  it('River Watch pays only a winning defender and records the base roll separately', () => {
    const state = { conditions: { defender: true }, bountyCount: 3, bountyDice: [4] }
    expect(derive('river_watch', state).gold).toBe(95)
    expect(derive('river_watch', state).notes.join(' ')).toContain('4 × 20 = 80 gc')
    expect(derive('river_watch', state, { result: 'lost' }).gold).toBe(0)
    expect(derive('river_watch', { ...state, conditions: { defender: false } }).gold).toBe(0)
    expect(derive('river_watch', { ...state, bountyDice: [7] }).problems).toHaveLength(1)
  })
  it('farm buildings preserve different outcomes and ignore stale gold on a shard result', () => {
    const state = { repeated: [{ roll: 1, dice: [] }, { roll: 3, dice: [2, 5] }, { roll: 6, dice: [6, 6] }] }
    const d = derive('battle_for_the_farm', state, { result: 'lost' })
    expect(d.problems).toEqual([]); expect(d.gold).toBe(7); expect(d.shards).toBe(1)
    expect(d.notes.join(' ')).toContain('Looted building 2 (D6 3): Valuables; 2D6 rolled 2, 5')
    expect(derive('battle_for_the_farm', { repeated: [{ roll: 3, dice: [] }] }).problems).toHaveLength(1)
    expect(derive('battle_for_the_farm', { repeated: [{ roll: null, dice: [1, 2] }] }).problems).toHaveLength(1)
  })
  it('Gubbinz use individual gold rolls, cap non-sacred counters at five, and remove deleted rewards', () => {
    expect(derive('dem_s_my_gubbinz', { repeated: [{ roll: null, dice: [2, 3] }, { roll: null, dice: [6, 4] }] }).gold).toBe(15)
    expect(derive('dem_s_my_gubbinz', { repeated: [{ roll: null, dice: [2, 3] }] }).gold).toBe(5)
    expect(derive('dem_s_my_gubbinz', { repeated: Array(6).fill({ roll: null, dice: [1, 1] }) }).problems).toHaveLength(1)
  })
  it('Ogham jewels retain their value as a single stash reward', () => {
    const d = derive('the_ogham_stones', { finds: { jewels: { discovery: null, dice: [1, 2, 3, 4, 5] } } })
    expect(d.gold).toBe(0); expect(d.items).toEqual([{ item_rules_id: null, custom_name: 'Ogham gems and jewels (worth 15 gc)', quantity: 1 }])
  })
})

describe('treasure already issued and repeated temple searches', () => {
  it('requires the pre-battle discovery history and never grants issued kit twice', () => {
    const rule = SCENARIO_REWARD_RULES.the_wizard_s_mansion
    if (rule.kind !== 'hoard') throw Error('Expected hoard')
    const finds = Object.fromEntries(rule.finds.map(f => [f.id, { discovery: f.threshold ? 1 : null, dice: typeof f.quantity === 'number' ? [] : Array(f.quantity.count).fill(2) }]))
    expect(derive('the_wizard_s_mansion', { finds }).problems).toHaveLength(5)
    const unclaimedBooty = Object.fromEntries(rule.finds.filter(f => f.unclaimedBeforeBattle).map(f => [f.id, false]))
    const d = derive('the_wizard_s_mansion', { finds, unclaimedBooty: { ...unclaimedBooty, 'initial-mandrake': true } })
    expect(d.problems).toEqual([]); expect(d.gold).toBe(10)
    expect(d.items).toHaveLength(1); expect(d.items[0].quantity).toBe(2)
    expect(d.notes.join(' ')).toContain('Lucky Charm: already found before the battle; no second award')
  })
  it('Temple repeats the full table per standing participating Hero but initial booty only once', () => {
    const rule = SCENARIO_REWARD_RULES.lost_temple_of_the_slann
    if (rule.kind !== 'hoard') throw Error('Expected hoard')
    const draft = { ...base, heroesOut: ['two', 'four'] }
    const rows = scenarioHoardFinds(rule, draft, participants)
    expect(rows.filter(f => f.id.endsWith(':gold'))).toHaveLength(2)
    expect(rows.filter(f => f.unclaimedBeforeBattle)).toHaveLength(5)
    const finds = Object.fromEntries(rows.map(f => [f.id, { discovery: f.threshold ? 1 : null, dice: typeof f.quantity === 'number' ? [] : Array(f.quantity.count).fill(2) }]))
    const unclaimedBooty = Object.fromEntries(rows.filter(f => f.unclaimedBeforeBattle).map(f => [f.id, false]))
    const d = scenarioRewards({ ...draft, scenarioRewards: { finds, unclaimedBooty } }, 'lost_temple_of_the_slann', participants)
    expect(d.problems).toEqual([]); expect(d.gold).toBe(12)
    expect(scenarioRewards({ ...draft, heroesOut: ['one','two','four'], scenarioRewards: { finds, unclaimedBooty } }, 'lost_temple_of_the_slann', participants).gold).toBe(6)
  })
  it('caps Temple searches at six and does not retain the guardian as loot', () => {
    const rule = SCENARIO_REWARD_RULES.lost_temple_of_the_slann
    if (rule.kind !== 'hoard') throw Error('Expected hoard')
    const rows = scenarioHoardFinds(rule, base, { ...participants, heroes: Array.from({ length: 8 }, (_, i) => ({ id: String(i), name: String(i) } as RosterHero)) })
    expect(rows.filter(f => f.id.endsWith(':gold'))).toHaveLength(6)
    expect(rows.some(f => /guard/i.test(f.label))).toBe(false)
  })
})

describe('scenario magical artefacts', () => {
  it('requires a resolved unique artefact and does not reuse stale rolls after a failed discovery', () => {
    const rule = SCENARIO_REWARD_RULES.monster_hunt
    if (rule.kind !== 'hoard') throw Error('Expected hoard')
    const finds = Object.fromEntries(rule.finds.map(f => [f.id, { discovery: f.threshold ? 1 : null, dice: typeof f.quantity === 'number' ? [] : Array(f.quantity.count).fill(2), artefactRoll: 1 }]))
    const d = { ...base, scenarioRewards: { conditions: { lair: true }, finds } }
    expect(scenarioRewards(d, 'monster_hunt', participants).artefacts).toEqual([])
    finds.artefact.discovery = 6
    expect(scenarioRewards(d, 'monster_hunt', participants).problems).toContain('Waiting for the campaign artefact record.')
    const ok = scenarioRewards(d, 'monster_hunt', participants, { artefacts: [] })
    expect(ok.problems).toEqual([]); expect(ok.artefacts).toEqual([{ roll: 1 }]); expect(ok.items).toHaveLength(1)
    const blocked = scenarioRewards(d, 'monster_hunt', participants, { artefacts: [{ roll: 1, reportId: 'other', warbandId: 'other', warbandName: 'Earlier find', foundAt: '' }] })
    expect(blocked.problems.join(' ')).toContain('already found')
  })
})

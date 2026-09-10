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

describe('scenario roles, rescued relics and printed reward ambiguity', () => {
  it('Protect the Prince uses the selected outcome and ignores the other branch', () => {
    expect(derive('protect_the_prince', {}).problems).toHaveLength(1)
    expect(derive('protect_the_prince', { branch: 'escaped', finds: { purse: { discovery: null, dice: [1,2,3,4] } } }).gold).toBe(10)
    const killed = derive('protect_the_prince', { branch: 'killed', finds: { purse: { discovery: null, dice: [1,2] } } })
    expect(killed.gold).toBe(3); expect(killed.shards).toBe(2)
    expect(derive('protect_the_prince', { branch: 'killed' }, { result: 'lost' }).shards).toBe(0)
  })
  it('Burn the Witches permits partial rescues and forbids duplicate or invented relics', () => {
    const d = derive('burn_the_witches', { branch: 'defender', finds: { relics: { discovery: null, dice: [], items: ['Holy Relic', 'Blessed Water'] } } }, { result: 'lost' })
    expect(d.problems).toEqual([]); expect(d.items).toHaveLength(2)
    expect(derive('burn_the_witches', { branch: 'defender', finds: { relics: { discovery: null, dice: [], items: ['Holy Relic', 'Holy Relic'] } } }).problems).toHaveLength(1)
    expect(derive('burn_the_witches', { branch: 'attacker', finds: { shards: { discovery: null, dice: [3] }, relics: { discovery: null, dice: [], items: ['Holy Relic'] } } }, { result: 'lost' }).shards).toBe(4)
    expect(derive('burn_the_witches', { branch: 'attacker', finds: { shards: { discovery: null, dice: [3] }, relics: { discovery: null, dice: [], items: ['Holy Relic'] } } }).items).toEqual([])
  })
  it('uses the Archive multiplier automatically but requires a ruling for the broken Town Cryer formula', () => {
    const rule = SCENARIO_REWARD_RULES.haunted_treasure
    if (rule.kind !== 'hoard') throw Error('Expected hoard')
    const finds = Object.fromEntries(rule.finds.map(f => [f.id, { discovery: f.threshold ? 1 : null, dice: typeof f.quantity === 'number' ? [] : Array(f.quantity.count).fill(2) }]))
    const state = { conditions: { chest: true }, finds }
    expect(derive('haunted_treasure_archive_pestilen', state).gold).toBe(50)
    expect(derive('haunted_treasure', state).problems.join(' ')).toContain('agreed multiplier')
    const ruled = derive('haunted_treasure', { ...state, finds: { ...finds, gold: { ...finds.gold, multiplier: 5, multiplierReason: 'Use the author’s Archive formula' } } })
    expect(ruled.problems).toEqual([]); expect(ruled.gold).toBe(50); expect(ruled.notes.join(' ')).toContain('agreed multiplier ×5')
    expect(derive('haunted_treasure', { ...state, conditions: { chest: false } }).gold).toBe(0)
  })
})

describe('retained horses and fixed village/swag tables', () => {
  it('routing loses D3−1 stolen horses without making the retained total negative', () => {
    expect(derive('blood_on_the_pasturelands', { horses: 4, lostHorsesDie: 3 }, { routed: true }).items[0].quantity).toBe(2)
    expect(derive('blood_on_the_pasturelands', { horses: 1, lostHorsesDie: 3 }, { routed: true }).items).toEqual([])
    expect(derive('blood_on_the_pasturelands', { horses: 4, lostHorsesDie: 3 }, { routed: false }).items[0].quantity).toBe(4)
    expect(derive('blood_on_the_pasturelands', { horses: 7 }).problems).toHaveLength(1)
    expect(derive('blood_on_the_pasturelands', { horses: 2 }, { routed: true }).problems).toHaveLength(1)
  })
  it('each Swag counter awards its own exact table item', () => {
    const d = derive('the_watchers', { repeated: [{ roll: 1, dice: [] }, { roll: 6, dice: [] }] }, { result: 'lost' })
    expect(d.problems).toEqual([]); expect(d.items).toHaveLength(2)
    expect(d.items[0].item_rules_id).toBe('lucky_charm')
    expect(d.notes.join(' ')).toContain('Swag counter 2 (D6 6): Tome of Magic')
  })
  it('Village attacker bonus changes the outcome; the unmodified D6 and quantity dice remain distinct', () => {
    expect(derive('defend_the_village', {}).problems).toHaveLength(1)
    expect(derive('defend_the_village', { conditions: { attacker: true } }).problems).toHaveLength(1)
    expect(derive('defend_the_village', { conditions: { attacker: true }, repeated: [{ roll: 4, dice: [3] }] }).shards).toBe(3)
    expect(derive('defend_the_village', { conditions: { attacker: false }, repeated: [{ roll: 4, dice: [3] }] }).problems).toHaveLength(1)
    expect(derive('defend_the_village', { conditions: { attacker: false }, repeated: [{ roll: 4, dice: [3,4] }] }).gold).toBe(7)
    expect(derive('defend_the_village', { conditions: { attacker: true }, repeated: [{ roll: 6, dice: [2] }] }).shards).toBe(2)
    expect(derive('defend_the_village', {}, { result: 'lost' }).problems).toEqual([])
  })
})

describe('separate Ambush versions and the Giant’s containers', () => {
  it('Reuvers Ambush caps initial D6 by Heroes and uses the appropriate side’s casualties', () => {
    const state = { conditions: { defender: true }, startingDie: 6, defendingHeroes: 3 }
    expect(derive('ambush_archive_pestilen_michael_reuvers', state, { heroesOut: ['one','two'] }).shards).toBe(1)
    expect(derive('ambush_archive_pestilen_michael_reuvers', { ...state, conditions: { defender: false }, enemyHeroesOut: 2 }).shards).toBe(2)
    expect(derive('ambush_archive_pestilen_michael_reuvers', { ...state, conditions: { defender: false }, enemyHeroesOut: 4 }).problems).toHaveLength(1)
    expect(derive('ambush_archive_pestilen', state).shards).toBe(0)
  })
  it('Giant containers roll independently, ignore unrecovered loot and do not duplicate selected containers', () => {
    const rule = SCENARIO_REWARD_RULES.don_t_wake_the_giant
    if (rule.kind !== 'hoard') throw Error('Expected hoard')
    const state = { containers: ['chest-1', 'bag', 'bag'] }
    const rows = scenarioHoardFinds(rule, { ...base, scenarioRewards: state }, participants)
    const finds = Object.fromEntries(rows.map(f => [f.id, { discovery: f.threshold ? 1 : null, dice: typeof f.quantity === 'number' ? [] : Array(f.quantity.count).fill(2) }]))
    expect(derive('don_t_wake_the_giant', { ...state, finds }, { result: 'lost' }).gold).toBe(26)
    expect(derive('don_t_wake_the_giant', { containers: ['bag'], finds }).gold).toBe(20)
    expect(derive('don_t_wake_the_giant', { containers: [], finds }).gold).toBe(0)
  })
})

describe('multi-die reward tables and variable find counts', () => {
  it('Truthsayer uses both table dice and separate value dice, without core artefact uniqueness', () => {
    expect(derive('gift_of_the_truthsayers', { conditions: { artefact: true }, repeated: [{ roll: 6, dice: [] }] }).problems).toHaveLength(1)
    const valued = derive('gift_of_the_truthsayers', { conditions: { artefact: true }, repeated: [{ roll: null, tableDice: [1,2], dice: [1,2,3,4,5] }] })
    expect(valued.problems).toEqual([]); expect(valued.items[0].custom_name).toBe('Truthsayer artefact (worth 15 gc)'); expect(valued.items[0].quantity).toBe(1); expect(valued.artefacts).toEqual([])
    const spell = derive('gift_of_the_truthsayers', { conditions: { artefact: true }, repeated: [{ roll: null, tableDice: [5,5], dice: [6,6,6,6,6] }] })
    expect(spell.items[0].item_rules_id).toBe('scenario_tome_of_the_truthsayers'); expect(spell.items[0].quantity).toBe(1)
    expect(derive('gift_of_the_truthsayers', { conditions: { artefact: false } }).items).toEqual([])
  })
  it('Tomb Raid requires exactly the D3 number of finds and distinguishes quantity from value', () => {
    expect(derive('tomb_raid', {}).problems).toHaveLength(1)
    expect(derive('tomb_raid', { tableCountRoll: 3, repeated: [{ roll: 1, dice: [] }] }).problems).toHaveLength(1)
    const d = derive('tomb_raid', { tableCountRoll: 3, repeated: [{ roll: 2, dice: [3] }, { roll: 3, dice: [5] }, { roll: 4, dice: [6] }] })
    expect(d.problems).toEqual([]); expect(d.items.map(i => i.quantity)).toEqual([3,5,1]); expect(d.items[2].custom_name).toBe('Gem-encrusted helmet (worth 60 gc)')
    expect(derive('tomb_raid', { tableCountRoll: 1, repeated: [{ roll: 2, dice: [4] }] }).problems).toHaveLength(1)
    expect(derive('tomb_raid', {}, { result: 'lost' }).problems).toEqual([])
  })
})

it('awards the Heretic winning side only, requiring one valid selection per rolled dose', () => {
  const winning = derive('hunt_the_heretic', { branch: 'witch-hunter', finds: { gold: { discovery: null, dice: [4] }, water: { discovery: null, dice: [2] } } })
  expect(winning.problems).toEqual([])
  expect(winning.gold).toBe(60)
  expect(winning.items[0].quantity).toBe(2)
  expect(derive('hunt_the_heretic', {}, { result: 'lost' }).items).toEqual([])
  expect(derive('hunt_the_heretic', { branch: 'warlock', finds: { doses: { discovery: null, dice: [3], items: ['Dark Venom'] } } }).problems).toHaveLength(1)
  const poisons = derive('hunt_the_heretic', { branch: 'warlock', finds: { doses: { discovery: null, dice: [3], items: ['Dark Venom', 'Dark Venom', 'Crimson Shade'] } } })
  expect(poisons.problems).toEqual([])
  expect(poisons.items).toHaveLength(3)
  expect(poisons.notes.join(' ')).toContain('1D3 rolled 3')
})

it('requires actual wand recovery and never awards both the wand and its sale/payment', () => {
  expect(derive('the_item_lost', { conditions: { retrieved: false }, branch: 'sell' }).gold).toBe(0)
  expect(derive('the_item_lost', { conditions: { retrieved: true }, branch: 'nicodemus' }).shards).toBe(2)
  const sale = derive('the_item_lost', { conditions: { retrieved: true }, branch: 'sell' })
  expect(sale.gold).toBe(100)
  expect(sale.items).toEqual([])
  const keep = derive('the_item_lost', { conditions: { retrieved: true }, branch: 'keep' })
  expect(keep.gold).toBe(0)
  expect(keep.items).toHaveLength(1)
})

it('saves scenario equipment by catalogue identity rather than oversized custom names', async () => {
  const { SCENARIO_REWARD_ITEMS } = await import('../../../rules/data/items/scenarioRewards')
  const { SHOP_ITEMS, findItem } = await import('../../../rules/data/items')
  const { foundItemFromName } = await import('./exploration')
  for (const item of SCENARIO_REWARD_ITEMS) {
    expect(foundItemFromName(item.name)).toEqual({ item_rules_id: item.id, custom_name: null, quantity: 1 })
    expect(findItem(item.id)?.description).toBeTruthy()
    expect(SHOP_ITEMS.some(i => i.id === item.id)).toBe(false)
  }
})

it('combines Defend the Tomb’s three finds with separate gold and individually valued gems', () => {
  const state = { repeated: [{ roll: 1, dice: [] }, { roll: 5, dice: [] }, { roll: 6, dice: [] }], finds: { gold: { discovery: null, dice: [4] }, gems: { discovery: null, dice: [2], unitValueDice: [1, 6] } } }
  const result = derive('defend_the_tomb', state)
  expect(result.problems).toEqual([])
  expect(result.gold).toBe(40)
  expect(result.items).toHaveLength(5)
  expect(result.items.filter(i => i.custom_name?.startsWith('Gem ('))).toEqual([
    { item_rules_id: null, custom_name: 'Gem (worth 5 gc)', quantity: 1 },
    { item_rules_id: null, custom_name: 'Gem (worth 30 gc)', quantity: 1 },
  ])
  expect(derive('defend_the_tomb', { ...state, repeated: state.repeated.slice(1) }).problems).toHaveLength(1)
  expect(derive('defend_the_tomb', { ...state, finds: { ...state.finds, gems: { discovery: null, dice: [3], unitValueDice: [1, 6] } } }).problems).toHaveLength(1)
  expect(derive('defend_the_tomb', state, { result: 'lost' }).items).toEqual([])
})

it('uses Bodyguards’ role-specific payment and table, requiring an explicit relic choice', () => {
  const attacker = derive('the_bodyguards', { branch: 'attacker', repeated: [{ roll: null, tableDice: [6, 6], dice: [] }], finds: { payment: { discovery: null, dice: [1, 2, 3, 4] } } })
  expect(attacker.problems).toEqual([])
  expect(attacker.gold).toBe(25)
  expect(attacker.items[0].item_rules_id).toBe('hunting_rifle')
  const defender = { branch: 'defender', repeated: [{ roll: null, tableDice: [1, 1], dice: [] }], finds: { payment: { discovery: null, dice: [1, 1, 1, 1, 1, 1, 1] } } }
  expect(derive('the_bodyguards', defender).problems).toHaveLength(1)
  const chosen = derive('the_bodyguards', { ...defender, repeated: [{ ...defender.repeated[0], itemChoice: 'Unholy Relic' }] })
  expect(chosen.problems).toEqual([])
  expect(chosen.gold).toBe(27)
  expect(chosen.items).toHaveLength(1)
  expect(derive('the_bodyguards', { branch: 'none', finds: defender.finds }).gold).toBe(0)
})

it('derives Bounty Hunting heads from actual participant count and rolls each bounty separately', () => {
  const draft = { ...base, scenarioRewards: { repeated: Array.from({ length: 10 }, () => ({ roll: null, dice: [2] })), finds: { swords: { discovery: null, dice: [2] }, daggers: { discovery: null, dice: [3, 4] } } } }
  const result = scenarioRewards(draft, 'bounty_hunting', participants, { opponents: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] })
  expect(result.problems).toEqual([])
  expect(result.gold).toBe(70)
  expect(result.items.map(i => i.quantity)).toEqual([6, 2, 7])
  expect(scenarioRewards(draft, 'bounty_hunting', participants, { opponents: [{ id: 'a' }] }).problems).toHaveLength(1)
  expect(scenarioRewards(draft, 'bounty_hunting', participants).problems).toHaveLength(1)
})

it('pays Recipe pies at the correct outcome rate, keeps routed pies and pays only the nominated winner for Geefer', () => {
  const recipe = { pies: 3, cartPies: 2, turnsInGeefer: true, dice: [1, 2, 3, 4, 5] }
  expect(derive('the_recipe', { recipe })).toMatchObject({ gold: 18, problems: [] })
  expect(derive('the_recipe', { recipe }, { result: 'lost', routed: true })).toMatchObject({ gold: 3, problems: [] })
  expect(derive('the_recipe', { recipe: { ...recipe, turnsInGeefer: false } }).gold).toBe(3)
  expect(derive('the_recipe', { recipe: { ...recipe, pies: 24 } }).problems).toHaveLength(1)
  expect(derive('the_recipe', { recipe: { ...recipe, dice: [1] } }).problems).toHaveLength(1)
})

it('uses the recorded Stake-Out ruling and printed win/loss income without inventing draw income', () => {
  const stakeOut = { mode: 'income-only' as const, reason: 'Agreed before the battle', die: 4 }
  expect(derive('stake_out', { stakeOut })).toMatchObject({ shards: 5, problems: [] })
  expect(derive('stake_out', { stakeOut }, { result: 'lost' }).shards).toBe(4)
  expect(derive('stake_out', { stakeOut }, { result: 'draw' }).shards).toBe(0)
  expect(derive('stake_out', { stakeOut: { ...stakeOut, reason: '' } }).problems).toHaveLength(1)
})

it('limits Herald splinters by player count and requires a referee exception for an ineligible sword keeper', () => {
  const state = { herald: { splinters: 2, sword: 'sell' as const } }
  expect(scenarioRewards({ ...base, scenarioRewards: state }, 'the_sword_of_the_herald', participants, { opponents: [{ id: 'opponent' }] })).toMatchObject({ gold: 100, shards: 6, items: [], problems: [] })
  expect(scenarioRewards({ ...base, scenarioRewards: { herald: { ...state.herald, splinters: 3 } } }, 'the_sword_of_the_herald', participants, { opponents: [{ id: 'opponent' }] }).problems).toHaveLength(1)
  const keep = { ...base, scenarioRewards: { herald: { splinters: 0, sword: 'keep' as const } } }
  expect(scenarioRewards(keep, 'the_sword_of_the_herald', participants, { roster: { warbandTemplateId: 'mercenaries_reikland' } }).problems).toHaveLength(1)
  const undead = scenarioRewards(keep, 'the_sword_of_the_herald', participants, { roster: { warbandTemplateId: 'the_undead' } })
  expect(undead.items[0].item_rules_id).toBe('scenario_sword_of_the_herald')
  expect(undead.gold).toBe(0)
  expect(scenarioRewards({ ...keep, scenarioRewards: { herald: { ...keep.scenarioRewards.herald, keepReason: 'Referee’s altered sword rules' } } }, 'the_sword_of_the_herald', participants).problems).toEqual([])
})


describe('Mule Train recovered cargo', () => {
  it('pays each escaped defender mule independently even after a loss', () => {
    const r = derive('mule_train', { mule: { role: 'defender', starting: 4, recovered: 2 }, finds: { 'mule-pay-0': { discovery: null, dice: [2, 3] }, 'mule-pay-1': { discovery: null, dice: [4, 5] } } }, { result: 'lost' })
    expect(r.gold).toBe(14); expect(r.items).toEqual([]); expect(r.problems).toEqual([])
  })
  it('awards actual mules and one combined cargo search with improved discovery targets', () => {
    const finds = Object.fromEntries(['light', 'heavy', 'map', 'halberds', 'swords', 'shields', 'bows', 'helmets'].map(id => [id, { discovery: 1, dice: ['map', 'heavy'].includes(id) ? [] : [2] }]))
    const r = derive('mule_train', { mule: { role: 'attacker', starting: 6, recovered: 6 }, finds: { ...finds, 'cargo-gold': { discovery: null, dice: [1, 2, 3] }, daggers: { discovery: null, dice: [4] } } })
    expect(r.gold).toBe(30); expect(r.problems).toEqual([])
    expect(r.items.find(i => i.item_rules_id === 'mule')?.quantity).toBe(6)
    expect(r.items.find(i => i.item_rules_id === 'heavy_armour')?.quantity).toBe(1)
  })
  it('rejects excess counts and grants nothing for abandoned mules', () => {
    expect(derive('mule_train', { mule: { role: 'attacker', starting: 3, recovered: 4 } }).problems).not.toEqual([])
    const r = derive('mule_train', { mule: { role: 'attacker', starting: 3, recovered: 0 } })
    expect(r.items).toEqual([]); expect(r.gold).toBe(0); expect(r.problems).toEqual([])
  })
})

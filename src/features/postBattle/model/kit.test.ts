// Phase 17: kit after the battle and Nurgle's Rot through the report.

import { describe, expect, it } from 'vitest'
import type { ItemRow } from '../../../domain'
import { findWarbandTemplate } from '../../../rules/data/warbandTemplates'
import type { RosterHero, RosterWarband } from '../../../rules/types/roster'
import { deriveReport, type ReportContext } from './derive'
import { deriveKit, kitEffects, outcomeFor } from './kit'
import { emptyDraft, setExplorationRolls, setHeroOut, setKitExtraRoll, setKitRoll, setResult, setVeteranDie, type ReportDraft } from './state'
import { itemEffect } from '../../../rules/data/itemRules'

const stats = { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 8 }
const hero = (id: string, unit: string, equipment: RosterHero['equipment'] = [], over: Partial<RosterHero> = {}): RosterHero => ({
  id, name: id, unitTemplateId: unit, stats, xp: 20, levelUps: 0, skillTableIds: [], skillIds: [], spellIds: [], injuries: [], flags: {}, equipment, status: 'active', ...over,
})
const REIKLAND = findWarbandTemplate('mercenaries_reikland')!
const roster: RosterWarband = {
  id: 'w', name: 'W', warbandTemplateId: REIKLAND.id, gold: 100, wyrdstone: 0, veteranPool: null, stash: [], henchmenGroups: [], hiredSwords: [],
  heroes: [
    hero('cap', 'mercenaries_reikland_captain', [{ itemId: 'cathayan_silk_clothes', quantity: 1 }, { itemId: 'crimson_shade', quantity: 1 }]),
    hero('champ', 'mercenaries_reikland_champions', [{ itemId: 'mad_cap_mushrooms', quantity: 2 }, { itemId: 'treasure_map', quantity: 1 }]),
  ],
}
const items: ItemRow[] = [
  { id: 'row-silk', warband_id: 'w', holder_type: 'hero', holder_id: 'cap', item_rules_id: 'cathayan_silk_clothes', custom_name: null, quantity: 1, notes: '', created_at: '', updated_at: '' },
  { id: 'row-shade', warband_id: 'w', holder_type: 'hero', holder_id: 'cap', item_rules_id: 'crimson_shade', custom_name: null, quantity: 1, notes: '', created_at: '', updated_at: '' },
  { id: 'row-caps', warband_id: 'w', holder_type: 'hero', holder_id: 'champ', item_rules_id: 'mad_cap_mushrooms', custom_name: null, quantity: 2, notes: '', created_at: '', updated_at: '' },
  { id: 'row-map', warband_id: 'w', holder_type: 'hero', holder_id: 'champ', item_rules_id: 'treasure_map', custom_name: null, quantity: 1, notes: '', created_at: '', updated_at: '' },
] as ItemRow[]
const ctx = (over: Partial<ReportContext> = {}): ReportContext => ({ roster, template: REIKLAND, items, matchId: 'm', myRating: 50, opponentRating: 50, ...over })
const won = (d: ReportDraft) => setResult(d, 'won')
/** Two heroes standing and a win: three exploration dice, plus the veteran pool, make the report complete. */
const complete = (d: ReportDraft) => setVeteranDie(setVeteranDie(setExplorationRolls(won(d), [4, 5, 6]), 0, 3), 1, 4)

describe('kit after the battle', () => {
  it('reads the outcome tables', () => {
    const shade = itemEffect('crimson_shade')!.postBattle![0]
    expect(outcomeFor(shade, [1, 2])?.effect).toEqual({ flag: 'addicted' })
    expect(outcomeFor(shade, [6, 6])?.effect).toEqual({ statDelta: { I: 1 } })
    expect(outcomeFor(shade, [3, null])).toBeNull()
  })

  it('owes a prompt for each consumable used and for the leader\'s silk when he went down', () => {
    const draft = won(emptyDraft())
    const none = deriveKit(draft, { roster, itemsUsed: {}, heroesOut: new Set(), leaderId: 'cap' })
    expect(none.prompts).toEqual([])
    const used = deriveKit(draft, { roster, itemsUsed: { cap: ['crimson_shade'], champ: ['mad_cap_mushrooms'] }, heroesOut: new Set(['cap']), leaderId: 'cap' })
    expect(used.prompts.map((p) => p.key)).toEqual(['crimson_shade:cap:side_effects', 'mad_cap_mushrooms:champ:side_effect', 'cathayan_silk_clothes:cap:ruined'])
    expect(used.pending).toBe(3)
  })

  it('applies side effects, ruined kit and map gold to the report', () => {
    let draft = won(setHeroOut(emptyDraft(), 'cap', true))
    draft = setKitRoll(setKitRoll(draft, 'crimson_shade:cap:side_effects', 0, 1), 'crimson_shade:cap:side_effects', 1, 2) // addicted
    draft = setKitRoll(draft, 'mad_cap_mushrooms:champ:side_effect', 0, 1) // stupid
    draft = setKitRoll(draft, 'cathayan_silk_clothes:cap:ruined', 0, 2) // ruined
    draft = setKitRoll(draft, 'treasure_map:champ:where', 0, 2) // stash: 1 shard + 2D6x10
    draft = setKitExtraRoll(setKitExtraRoll(draft, 'treasure_map:champ:where', 0, 3), 'treasure_map:champ:where', 1, 4)
    const c = ctx({ itemsUsed: { cap: ['crimson_shade'], champ: ['mad_cap_mushrooms', 'treasure_map'] } })
    const d = deriveReport(draft, c)
    const effects = kitEffects(d.kit)
    expect(effects.goldDelta).toBe(70)
    expect(effects.shardsDelta).toBe(1)
    expect(d.problems.injuries.some((p) => /kit after the battle/.test(p))).toBe(false)
    // The captain's injury roll is still owed, so the report is not complete; the applied patches are visible through the kit effects.
    expect(effects.heroPatches.map((p) => [p.heroId, p.flag])).toEqual([
      ['cap', 'addicted'],
      ['champ', 'stupidity'],
    ])
    expect(effects.removeItems.map((r) => r.itemId)).toEqual(['treasure_map', 'cathayan_silk_clothes'])
  })

  it('a pending prompt blocks the injuries step; an optional wish does not', () => {
    const draft = won(emptyDraft())
    const d = deriveReport(draft, ctx({ itemsUsed: { champ: ['mad_cap_mushrooms'] } }))
    expect(d.problems.injuries[0]).toMatch(/1 roll for kit after the battle/)
    const lamp = deriveKit(draft, { roster: { ...roster, heroes: [hero('cap', 'mercenaries_reikland_captain', [{ itemId: 'lamp_of_the_djinn', quantity: 1 }])] }, itemsUsed: { cap: ['lamp_of_the_djinn'] }, heroesOut: new Set(), leaderId: 'cap' })
    expect(lamp.prompts).toHaveLength(6)
    expect(lamp.pending).toBe(0)
  })
})

describe("Nurgle's Rot through the report", () => {
  it('marks the Rot on a warrior wounded by a carrier, and on the warband member it spread to', () => {
    const draft = complete(emptyDraft())
    const d = deriveReport(draft, ctx({ rotVictims: ['champ'], preBattle: { 'rot:cap': 'spread', 'rot_spread:champ': 'caught from rot:cap' } }))
    expect(d.report).not.toBeNull()
    const patch = d.report?.applied.heroes.find((h) => h.id === 'champ')?.patch
    expect(patch?.flags?.nurglesRot).toBe(true)
    expect(d.report?.applied.heroes.filter((h) => h.id === 'champ')).toHaveLength(1)
  })

  it('a failed Toughness test costs a point of Toughness; at zero the warrior dies', () => {
    const sick: RosterWarband = { ...roster, heroes: [hero('cap', 'mercenaries_reikland_captain', [], { flags: { nurglesRot: true }, stats: { ...stats, T: 1 } })] }
    const d = deriveReport(setVeteranDie(setVeteranDie(setExplorationRolls(won(emptyDraft()), [4, 5]), 0, 3), 1, 4), ctx({ roster: sick, preBattle: { 'rot:cap': 'failed' } }))
    expect(d.report).not.toBeNull()
    const patch = d.report?.applied.heroes.find((h) => h.id === 'cap')?.patch
    expect(patch?.stats?.T).toBe(0)
    expect(patch?.status).toBe('dead')
  })
})


describe('mandatory Fanatic mushroom effects', () => {
  const group = (id: string, sittingOut = false): RosterWarband['henchmenGroups'][number] => ({ id, name: id, unitTemplateId: 'night_goblins_fanatics', size: 1, stats, xp: 0, levelUps: 0, statIncreases: {}, equipment: [], campaignState: { fanaticBattleMatch: 'm', fanaticSittingOut: sittingOut } })
  const fanatics = { ...roster, henchmenGroups: [group('fed'), group('unfed', true), group('dead')] }
  const context = { roster: fanatics, matchId: 'm', survivingGroupIds: new Set(['fed', 'unfed']), itemsUsed: {}, heroesOut: new Set<string>(), leaderId: null }
  it('requires a roll only for a surviving supplied model, without a used-item checkbox', () => {
    const kit = deriveKit(emptyDraft(), context)
    expect(kit.pending).toBe(1)
    expect(kit.prompts.map(p => p.holderId)).toEqual(['fed'])
    expect(deriveKit(emptyDraft(), { ...context, matchId: 'other' }).prompts).toEqual([])
  })
  it('persists the individual effect through the complete report', () => {
    const draft = setKitRoll(complete(emptyDraft()), 'mad_cap_mushrooms:fed:side_effect', 0, 1)
    const d = deriveReport(draft, ctx({ roster: { ...roster, henchmenGroups: [group('fed'), group('unfed', true)] } }))
    expect(d.report).not.toBeNull()
    expect(d.report?.applied.groups.find(g => g.id === 'fed')?.patch.campaign_state?.permanentStupidity).toBe(true)
    expect(d.report?.applied.groups.some(g => g.id === 'unfed')).toBe(false)
  })
  it('assigns permanent Stupidity to the individual group and never consumes a second dose', () => {
    const draft = setKitRoll(emptyDraft(), 'mad_cap_mushrooms:fed:side_effect', 0, 1)
    const effects = kitEffects(deriveKit(draft, context))
    expect(effects.groupStupidity).toEqual(['fed'])
    expect(effects.heroPatches).toEqual([])
    expect(effects.removeItems).toEqual([])
    expect(effects.lines[0]).toContain('rolled 1')
  })
})

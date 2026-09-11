// The map campaign's advantages inside the report: extra exploration dice, maximum finds, the D3
// for an Abundance district, a district's Full Recovery rewrite, and the third veteran die.

import { describe, expect, it } from 'vitest'
import { findWarbandTemplate } from '../../../rules/data/warbandTemplates'
import { emptyMapPerks, type MapPerks } from '../../../rules/resolve/mapAdvantages'
import type { RosterHero, RosterWarband } from '../../../rules/types/roster'
import { deriveReport, type ReportContext } from './derive'
import { resolveHeroInjuryFlow } from './injuries'
import { addHeroInjuryRoll, emptyDraft, setAbundanceRoll, setExplorationRolls, setHeroDistrictRoll, setHeroOut, setResult, setVeteranDie, setVeteranExtraDie } from './state'

const stats = { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }
const template = findWarbandTemplate('mercenaries_reikland')

function hero(id: string, unit = 'mercenaries_reikland_champions'): RosterHero {
  return { id, name: id, unitTemplateId: unit, stats, xp: 20, levelUps: 0, skillTableIds: [], skillIds: [], spellIds: [], injuries: [], flags: {}, equipment: [{ itemId: 'sword', quantity: 1 }], status: 'active' }
}

function roster(): RosterWarband {
  return { id: 'w1', name: 'Watch', warbandTemplateId: 'mercenaries_reikland', gold: 50, wyrdstone: 0, veteranPool: null, heroes: [hero('captain', 'mercenaries_reikland_captain'), hero('champ')], henchmenGroups: [], hiredSwords: [], stash: [] }
}

const source = { districtId: 'temple-of-morr', districtName: 'Temple of Morr' }

function perks(over: Partial<MapPerks> = {}): MapPerks {
  return { ...emptyMapPerks(), districts: [source], ...over }
}

function ctx(p: MapPerks, abundance = false): ReportContext {
  return { roster: roster(), template, items: [], matchId: 'm1', myRating: 100, opponentRating: 100, map: { districtId: 'the-pit', districtName: 'The Pit', abundance, perks: p } }
}

describe('map perks in the report', () => {
  it('adds the district dice to the exploration suggestion with the source named', () => {
    const c = ctx(perks({ explorationDice: 2, explorationDiceSources: ["Executioner's Square", 'Poor Quarter'] }))
    const draft = setResult(emptyDraft(), 'won')
    const ex = deriveReport(draft, c).exploration
    // Two heroes + 1 for winning + 2 from the map.
    expect(ex.suggested?.count).toBe(5)
    expect(ex.suggested?.reason).toContain("+2 from Executioner's Square, Poor Quarter")
  })

  it('asks the winner in an Abundance district for a D3 and adds the shards', () => {
    const c = ctx(perks(), true)
    let draft = setResult(emptyDraft(), 'won')
    draft = setExplorationRolls(draft, [1, 2, 3])
    let d = deriveReport(draft, c)
    expect(d.problems.exploration.some((p) => /Abundance/.test(p))).toBe(true)
    draft = setAbundanceRoll(draft, 5)
    d = deriveReport(draft, c)
    expect(d.problems.exploration.some((p) => /Abundance/.test(p))).toBe(false)
    expect(d.report?.applied.warband.wyrdstone_delta).toBe((d.exploration.record?.shards ?? 0) + 3)
    expect(d.report?.notes).toContain('+3 shards for winning there (D6 5)')
    // The loser owes nothing.
    const lost = deriveReport(setExplorationRolls(setResult(emptyDraft(), 'lost'), [1, 2]), c)
    expect(lost.problems.exploration.some((p) => /Abundance/.test(p))).toBe(false)
  })

  it('offers the Temple of Morr D6 on a Dead result and rewrites it to Full Recovery on a 5+', () => {
    const p = perks({ injuryRewrites: [{ min: 11, max: 15, test: 5, to: 'full_recovery', source }] })
    const champ = hero('champ')
    const ask = resolveHeroInjuryFlow(champ, { rolls: [{ d66: 12, subRoll: null }], countRoll: null }, 'm1', p)
    expect(ask.pending).toMatchObject({ kind: 'districtTest', rollIndex: 0, needed: 5, districtName: 'Temple of Morr' })
    const saved = resolveHeroInjuryFlow(champ, { rolls: [{ d66: 12, subRoll: null, districtRoll: 6 }], countRoll: null }, 'm1', p)
    expect(saved.outcome).toBe('recovered')
    expect(saved.hero.status).toBe('active')
    expect(saved.steps[0]).toMatchObject({ code: 'full_recovery', rewrittenBy: 'Temple of Morr, D6 6' })
    expect(saved.line?.rolls).toEqual([12, 6])
    const failed = resolveHeroInjuryFlow(champ, { rolls: [{ d66: 12, subRoll: null, districtRoll: 2 }], countRoll: null }, 'm1', p)
    expect(failed.outcome).toBe('dead')
    expect(failed.steps[0].effect).toContain('Temple of Morr D6 2: not 5+')
  })

  it('the Gaol rewrites Captured with no roll, and other results are untouched', () => {
    const p = perks({ injuryRewrites: [{ min: 61, max: 61, to: 'full_recovery', source: { districtId: 'the-gaol', districtName: 'The Gaol' } }] })
    const freed = resolveHeroInjuryFlow(hero('champ'), { rolls: [{ d66: 61, subRoll: null }], countRoll: null }, 'm1', p)
    expect(freed.outcome).toBe('recovered')
    expect(freed.steps[0].rewrittenBy).toBe('The Gaol')
    const wound = resolveHeroInjuryFlow(hero('champ'), { rolls: [{ d66: 22, subRoll: null }], countRoll: null }, 'm1', p)
    expect(wound.pending.kind).toBe('done')
    expect(wound.outcome).toBe('injured')
  })

  it('the district test flows through the draft setters', () => {
    const p = perks({ injuryRewrites: [{ min: 11, max: 15, test: 5, to: 'full_recovery', source }] })
    let draft = setResult(emptyDraft(), 'lost')
    draft = setHeroOut(draft, 'champ', true)
    draft = addHeroInjuryRoll(draft, 'champ', 13)
    let d = deriveReport(draft, ctx(p))
    expect(d.injuries.heroes[0].resolution.pending.kind).toBe('districtTest')
    draft = setHeroDistrictRoll(draft, 'champ', 0, 5)
    d = deriveReport(draft, ctx(p))
    expect(d.injuries.heroes[0].resolution.outcome).toBe('recovered')
  })

  it('counts a third veteran die when the map allows it', () => {
    let draft = setVeteranDie(setVeteranDie(emptyDraft(), 0, 3), 1, 4)
    draft = setVeteranExtraDie(draft, 6)
    const d = deriveReport(setExplorationRolls(setResult(draft, 'lost'), [1, 2]), ctx(perks()))
    expect(d.veteranPool).toBe(13)
    expect(d.problems.veterans).toEqual([])
  })
})

it('applies the Amphitheatre automatic pit win once in the report and retains its source',()=>{
 const amphitheatre={districtId:'amphitheatre',districtName:'Amphitheatre'}
 const c=ctx(perks({pitFightAutoWin:amphitheatre}))
 const d=addHeroInjuryRoll(setHeroOut(setExplorationRolls(setResult(emptyDraft(),'lost'),[1]),'champ',true),'champ',65)
 const result=deriveReport(d,c)
 expect(result.problems).toMatchObject({injuries:[],advances:[],exploration:[]})
 expect(result.report?.applied.warband.gold_delta).toBe(50)
 expect(result.xp.lines.find(x=>x.subjectId==='champ')).toMatchObject({amount:3,xpAfter:23})
 expect(result.report?.injuries[0]).toMatchObject({injuryCode:'sold_to_the_pits',outcome:'recovered'})
 expect(result.report?.injuries[0]).toHaveProperty('effect', 'Amphitheatre: automatically won the pit fight; +50 gc, +2 Experience; kept equipment.')
 expect(result.report?.applied.heroes.find(h=>h.id==='champ')?.patch.flags?.pitFightOwed).toBeUndefined()
 expect(result.report?.applied.remove_item_ids).toEqual([])
 expect(deriveReport(d,c).report).toEqual(result.report)
 const ordinary=deriveReport(d,ctx(perks()))
 expect(ordinary.report?.applied.warband.gold_delta).toBe(0)
 expect(ordinary.injuries.heroes[0].resolution.hero.flags.pitFightOwed).toBe(true)
})

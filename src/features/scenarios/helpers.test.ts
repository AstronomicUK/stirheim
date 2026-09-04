import { describe, expect, it } from 'vitest'
import { CORE_RULEBOOK_SCENARIO_IDS, SCENARIOS } from '../../rules/data/campaign/scenarios'
import type { ScenarioSummary } from '../../rules/types/campaignContent'
import {
  absoluteImageUrls,
  ALL_SETTINGS,
  coreScenarios,
  EMPTY_SCENARIO_FORM,
  EVERYONE,
  filterScenarios,
  fromScenarioRow,
  libraryScenarios,
  parseScenarioKind,
  rulesSkeleton,
  scenarioFormChanged,
  settingsPresent,
  SKELETON_SECTIONS,
  toScenarioInput,
  validateScenarioForm,
  withSkeleton,
  type ScenarioFormValues,
} from './helpers'

const summary = (over: Partial<ScenarioSummary> & { id: string }): ScenarioSummary => ({
  title: over.id,
  description: '',
  setting: 'Mordheim',
  author: 'Anon',
  source: 'Town Cryer #1',
  ...over,
})

const SAMPLE: ScenarioSummary[] = [
  summary({ id: 'skirmish', title: 'Skirmish', description: 'Two warbands meet.', author: 'Tuomas Pirinen', source: 'Mordheim Rulebook' }),
  summary({ id: 'the_pool', title: 'The Pool', description: 'Root around for Wyrdstone in a pool.', author: 'Mark Havener', source: 'Town Cryer #5' }),
  summary({ id: 'jungle', title: 'Jungle Ambush', description: 'Lizardmen wait in the trees.', setting: 'Lustria', source: 'Town Cryer #14' }),
  summary({ id: 'tomb', title: 'Defend the Tomb', description: 'Guard the sarcophagus.', setting: 'Khemri', source: 'Fanatic #3' }),
]

describe('parseScenarioKind', () => {
  it('accepts only the two route kinds', () => {
    expect(parseScenarioKind('builtin')).toBe('builtin')
    expect(parseScenarioKind('custom')).toBe('custom')
    expect(parseScenarioKind('other')).toBeNull()
    expect(parseScenarioKind(undefined)).toBeNull()
  })
})

describe('coreScenarios / libraryScenarios', () => {
  it('returns the nine rulebook scenarios in rulebook order from the real index', () => {
    const core = coreScenarios()
    expect(core.map((s) => s.id)).toEqual(CORE_RULEBOOK_SCENARIO_IDS)
    expect(core).toHaveLength(9)
    expect(core.every((s) => s.source === 'Mordheim Rulebook')).toBe(true)
  })

  it('skips ids missing from the index and keeps the requested order', () => {
    expect(coreScenarios(SAMPLE, ['the_pool', 'missing', 'skirmish']).map((s) => s.id)).toEqual(['the_pool', 'skirmish'])
  })

  it('splits the library so nothing is in both groups and nothing is lost', () => {
    const core = coreScenarios()
    const rest = libraryScenarios()
    expect(core.length + rest.length).toBe(SCENARIOS.length)
    const coreIds = new Set(core.map((s) => s.id))
    expect(rest.some((s) => coreIds.has(s.id))).toBe(false)
  })
})

describe('settingsPresent', () => {
  it('lists distinct settings alphabetically with Mordheim first', () => {
    expect(settingsPresent(SAMPLE)).toEqual(['Mordheim', 'Khemri', 'Lustria'])
  })

  it('copes with no Mordheim entry and blank settings', () => {
    expect(settingsPresent([{ setting: 'Lustria' }, { setting: ' ' }, { setting: 'Albion' }, { setting: 'Lustria' }])).toEqual(['Albion', 'Lustria'])
  })
})

describe('filterScenarios', () => {
  it('matches every word across title, description, author and source', () => {
    expect(filterScenarios(SAMPLE, 'pool').map((s) => s.id)).toEqual(['the_pool'])
    expect(filterScenarios(SAMPLE, 'havener cryer').map((s) => s.id)).toEqual(['the_pool'])
    expect(filterScenarios(SAMPLE, 'TREES').map((s) => s.id)).toEqual(['jungle'])
    expect(filterScenarios(SAMPLE, 'pool trees')).toEqual([])
  })

  it('returns everything for an empty or whitespace query', () => {
    expect(filterScenarios(SAMPLE, '')).toHaveLength(4)
    expect(filterScenarios(SAMPLE, '   ', ALL_SETTINGS)).toHaveLength(4)
  })

  it('narrows by setting exactly', () => {
    expect(filterScenarios(SAMPLE, '', 'Lustria').map((s) => s.id)).toEqual(['jungle'])
    expect(filterScenarios(SAMPLE, 'ambush', 'Khemri')).toEqual([])
  })
})

describe('absoluteImageUrls', () => {
  it('points site-relative images at mordheimer.net', () => {
    expect(absoluteImageUrls('Deploy here.\n\n![](/assets/images/map.jpg)')).toBe('Deploy here.\n\n![](https://mordheimer.net/assets/images/map.jpg)')
    expect(absoluteImageUrls('![Map of the ruins](/assets/x.png)')).toBe('![Map of the ruins](https://mordheimer.net/assets/x.png)')
  })

  it('leaves data URIs, absolute URLs, protocol-relative URLs and plain links alone', () => {
    const data = '![](data:image/png;base64,AAAA)'
    expect(absoluteImageUrls(data)).toBe(data)
    const abs = '![](https://example.com/a.jpg)'
    expect(absoluteImageUrls(abs)).toBe(abs)
    const proto = '![](//cdn.example.com/a.jpg)'
    expect(absoluteImageUrls(proto)).toBe(proto)
    const link = '[the rules](/docs/rules)'
    expect(absoluteImageUrls(link)).toBe(link)
  })
})

describe('validateScenarioForm', () => {
  it('requires a name and trims it', () => {
    const blank = validateScenarioForm({ ...EMPTY_SCENARIO_FORM, name: '   ' })
    expect(blank.ok).toBe(false)
    if (!blank.ok) expect(blank.errors.name).toMatch(/name/i)

    const ok = validateScenarioForm({ ...EMPTY_SCENARIO_FORM, name: '  The Bell Tower  ' })
    expect(ok.ok).toBe(true)
    if (ok.ok) expect(ok.data.name).toBe('The Bell Tower')
  })

  it('caps the name at 80 characters and the summary at 280', () => {
    const long = validateScenarioForm({ ...EMPTY_SCENARIO_FORM, name: 'x'.repeat(81), summary: 'y'.repeat(281) })
    expect(long.ok).toBe(false)
    if (!long.ok) {
      expect(long.errors.name).toMatch(/80/)
      expect(long.errors.summary).toMatch(/280/)
    }
    expect(validateScenarioForm({ ...EMPTY_SCENARIO_FORM, name: 'x'.repeat(80) }).ok).toBe(true)
  })
})

describe('form <-> ScenarioInput mapping', () => {
  const filled: ScenarioFormValues = {
    name: ' Bell Tower ',
    setting: ' ',
    summary: ' Ring the bell. ',
    rulesMarkdown: '## Terrain\n\nRuins.',
    campaignId: EVERYONE,
  }

  it('maps to the API shape, defaulting a blank setting and sharing with everyone', () => {
    expect(toScenarioInput(filled)).toEqual({
      name: 'Bell Tower',
      setting: 'Custom',
      summary: 'Ring the bell.',
      rules_markdown: '## Terrain\n\nRuins.',
      campaign_id: null,
    })
  })

  it('keeps a chosen campaign id', () => {
    expect(toScenarioInput({ ...filled, campaignId: 'c-1' }).campaign_id).toBe('c-1')
  })

  it('round-trips a stored row into form values', () => {
    const values = fromScenarioRow({ name: 'Bell Tower', setting: 'Mordheim', summary: 'Ring it.', rules_markdown: '# Rules', campaign_id: null })
    expect(values).toEqual({ name: 'Bell Tower', setting: 'Mordheim', summary: 'Ring it.', rulesMarkdown: '# Rules', campaignId: EVERYONE })
    expect(fromScenarioRow({ name: 'a', setting: 'b', summary: '', rules_markdown: '', campaign_id: 'c-2' }).campaignId).toBe('c-2')
  })
})

describe('scenarioFormChanged', () => {
  const initial = fromScenarioRow({ name: 'Bell Tower', setting: 'Mordheim', summary: 'Ring it.', rules_markdown: '# Rules', campaign_id: null })

  it('ignores whitespace-only edits to trimmed fields', () => {
    expect(scenarioFormChanged(initial, initial)).toBe(false)
    expect(scenarioFormChanged(initial, { ...initial, name: '  Bell Tower ' })).toBe(false)
    expect(scenarioFormChanged(initial, { ...initial, summary: 'Ring it.  ' })).toBe(false)
  })

  it('notices real edits to any field', () => {
    expect(scenarioFormChanged(initial, { ...initial, name: 'Bell Towers' })).toBe(true)
    expect(scenarioFormChanged(initial, { ...initial, setting: 'Lustria' })).toBe(true)
    expect(scenarioFormChanged(initial, { ...initial, rulesMarkdown: '# Rules\n\nMore.' })).toBe(true)
    expect(scenarioFormChanged(initial, { ...initial, campaignId: 'c-1' })).toBe(true)
  })

  it('treats a blank setting as the stored "Custom" default', () => {
    const custom = { ...initial, setting: 'Custom' }
    expect(scenarioFormChanged(custom, { ...custom, setting: '' })).toBe(false)
  })
})

describe('rules skeleton', () => {
  it('lists the five rulebook sections as level-two headings in order', () => {
    const text = rulesSkeleton()
    const headings = text.split('\n').filter((line) => line.startsWith('## '))
    expect(headings).toEqual(SKELETON_SECTIONS.map((s) => `## ${s}`))
    expect(text).toBe('## Terrain\n\n\n## Warbands\n\n\n## Starting the game\n\n\n## Ending the game\n\n\n## Experience\n')
  })

  it('only replaces empty or whitespace text', () => {
    expect(withSkeleton('')).toBe(rulesSkeleton())
    expect(withSkeleton('  \n ')).toBe(rulesSkeleton())
    expect(withSkeleton('## Terrain\n\nRuins.')).toBe('## Terrain\n\nRuins.')
  })
})

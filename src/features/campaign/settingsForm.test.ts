import { describe, expect, it } from 'vitest'
import { defaultCampaignSettings } from '../../domain/settings'
import { defaultSettingsForm, formFromSettings, settingsFormEqual, settingsFromForm, validateCampaignName } from './settingsForm'

describe('settings form mapping', () => {
  it('round-trips the defaults', () => {
    const form = defaultSettingsForm()
    const result = settingsFromForm(form)
    expect(result).toEqual({ ok: true, settings: defaultCampaignSettings() })
  })

  it('round-trips a customised settings object', () => {
    const settings = {
      startingGold: 600,
      maxRosters: 8,
      houseRules: { strengthArmourPiercing: true, optionalCriticalTables: false, halfPriceArmour: false },
      dicePolicy: 'app_rolls' as const,
    }
    const result = settingsFromForm(formFromSettings(settings))
    expect(result).toEqual({ ok: true, settings })
  })

  it('reports a blank starting gold field', () => {
    const result = settingsFromForm({ ...defaultSettingsForm(), startingGold: Number.NaN })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.startingGold).toMatch(/whole number/)
  })

  it('rejects negative gold and a zero roster cap', () => {
    const gold = settingsFromForm({ ...defaultSettingsForm(), startingGold: -5 })
    expect(gold.ok).toBe(false)
    if (!gold.ok) expect(gold.errors.startingGold).toBeDefined()

    const cap = settingsFromForm({ ...defaultSettingsForm(), maxRosters: 0 })
    expect(cap.ok).toBe(false)
    if (!cap.ok) expect(cap.errors.maxRosters).toBeDefined()
  })

  it('accepts a blank roster cap as no cap', () => {
    const result = settingsFromForm({ ...defaultSettingsForm(), maxRosters: null })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.settings.maxRosters).toBeNull()
  })

  it('compares forms by value', () => {
    const a = defaultSettingsForm()
    const b = defaultSettingsForm()
    expect(settingsFormEqual(a, b)).toBe(true)
    b.houseRules.halfPriceArmour = false
    expect(settingsFormEqual(a, b)).toBe(false)
    expect(settingsFormEqual({ ...a, startingGold: Number.NaN }, { ...a, startingGold: Number.NaN })).toBe(true)
  })

  it('validates the campaign name', () => {
    expect(validateCampaignName('  ')).toMatch(/name/)
    expect(validateCampaignName('x'.repeat(81))).toMatch(/80/)
    expect(validateCampaignName('Stirheim')).toBeUndefined()
  })
})

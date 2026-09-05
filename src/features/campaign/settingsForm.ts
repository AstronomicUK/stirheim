// The campaign settings form, shared by the create and settings screens. The form holds what the
// fields hold (a blank required number is NaN, courtesy of NumberField); settingsFromForm() turns
// that into a validated CampaignSettings or per-field messages.

import { campaignSettingsSchema, type CampaignSettings, type CombatMode, type DicePolicy, defaultCampaignSettings } from '../../domain/settings'
import type { CampaignHouseRules } from '../../rules/types/roster'

export interface SettingsForm {
  /** NaN while the field is blank or not a number. */
  startingGold: number
  /** null = no cap. NaN while the field holds something that is not a number. */
  maxRosters: number | null
  houseRules: CampaignHouseRules
  dicePolicy: DicePolicy
  combatMode: CombatMode
  lockCombatMode: boolean
  reportApproval: boolean
}

export type SettingsFormErrors = Partial<Record<'startingGold' | 'maxRosters', string>>

export type SettingsFormResult = { ok: true; settings: CampaignSettings } | { ok: false; errors: SettingsFormErrors }

export function formFromSettings(settings: CampaignSettings): SettingsForm {
  return {
    startingGold: settings.startingGold,
    maxRosters: settings.maxRosters,
    houseRules: { ...settings.houseRules },
    dicePolicy: settings.dicePolicy,
    combatMode: settings.combatMode,
    lockCombatMode: settings.lockCombatMode,
    reportApproval: settings.reportApproval,
  }
}

export function defaultSettingsForm(): SettingsForm {
  return formFromSettings(defaultCampaignSettings())
}

export function settingsFromForm(form: SettingsForm): SettingsFormResult {
  const errors: SettingsFormErrors = {}
  if (Number.isNaN(form.startingGold)) errors.startingGold = 'Enter a whole number of gold crowns.'
  if (form.maxRosters !== null && Number.isNaN(form.maxRosters)) errors.maxRosters = 'Enter a whole number, or leave it blank for no cap.'
  if (Object.keys(errors).length) return { ok: false, errors }

  const parsed = campaignSettingsSchema.safeParse({
    startingGold: form.startingGold,
    maxRosters: form.maxRosters,
    houseRules: form.houseRules,
    dicePolicy: form.dicePolicy,
    combatMode: form.combatMode,
    lockCombatMode: form.lockCombatMode,
    reportApproval: form.reportApproval,
  })
  if (parsed.success) return { ok: true, settings: parsed.data }

  for (const issue of parsed.error.issues) {
    const field = issue.path[0]
    if (field === 'startingGold' && !errors.startingGold) errors.startingGold = 'Starting gold must be a whole number, zero or more.'
    else if (field === 'maxRosters' && !errors.maxRosters) errors.maxRosters = 'The roster cap must be at least 1, or blank for no cap.'
  }
  if (!Object.keys(errors).length) errors.startingGold = parsed.error.issues[0]?.message ?? 'Check the settings.'
  return { ok: false, errors }
}

export function settingsFormEqual(a: SettingsForm, b: SettingsForm): boolean {
  return (
    Object.is(a.startingGold, b.startingGold) &&
    Object.is(a.maxRosters, b.maxRosters) &&
    a.dicePolicy === b.dicePolicy &&
    a.combatMode === b.combatMode &&
    a.lockCombatMode === b.lockCombatMode &&
    a.reportApproval === b.reportApproval &&
    a.houseRules.strengthArmourPiercing === b.houseRules.strengthArmourPiercing &&
    a.houseRules.optionalCriticalTables === b.houseRules.optionalCriticalTables &&
    a.houseRules.halfPriceArmour === b.houseRules.halfPriceArmour &&
    a.houseRules.rabbitsFootBattleOnly === b.houseRules.rabbitsFootBattleOnly
  )
}

/** Campaign names are 1 to 80 characters (campaignRowSchema). Returns a message, or undefined when fine. */
export function validateCampaignName(name: string): string | undefined {
  const trimmed = name.trim()
  if (!trimmed) return 'Give the campaign a name.'
  if (trimmed.length > 80) return 'Keep the name under 80 characters.'
  return undefined
}

export interface HouseRuleSwitch {
  key: keyof CampaignHouseRules
  label: string
  description: string
}

/** One switch per house rule, with the one-line explanation the form shows under it. */
export const HOUSE_RULE_SWITCHES: HouseRuleSwitch[] = [
  {
    key: 'strengthArmourPiercing',
    label: 'Strength erodes armour saves',
    description: 'Core rulebook chart: a Strength 4 hit worsens the save by 1, Strength 5 by 2, and so on. Off by house rule.',
  },
  {
    key: 'optionalCriticalTables',
    label: 'Optional critical hit tables',
    description: 'Critical hits use the expanded per-weapon-type charts from the Optional Rules instead of the core chart.',
  },
  {
    key: 'halfPriceArmour',
    label: 'Half-price armour',
    description: 'Armour costs half its listed price, rounded down. Shields, bucklers and helmets stay at full price.',
  },
  {
    key: 'rabbitsFootBattleOnly',
    label: "Rabbit's Foot: battle only",
    description: 'The re-roll may only be used during the battle. Off means the rulebook rule: an unused foot re-rolls one exploration die.',
  },
]

export interface DicePolicyOption {
  value: DicePolicy
  label: string
  description: string
}

export const DICE_POLICY_OPTIONS: DicePolicyOption[] = [
  {
    value: 'players_roll',
    label: 'Players roll',
    description: 'Players roll real dice at the table and type the results in; the app applies the rules. A "roll for me" button is still offered at each step.',
  },
  {
    value: 'app_rolls',
    label: 'App rolls',
    description: 'The app rolls every die in the post-battle sequence and records the result.',
  },
]

export function dicePolicyLabel(policy: DicePolicy): string {
  return DICE_POLICY_OPTIONS.find((o) => o.value === policy)?.label ?? policy
}

export interface CombatModeOption {
  value: CombatMode
  label: string
  description: string
}

// Same order as DICE_POLICY_OPTIONS (players first, app second) so the two choices read alike.
export const COMBAT_MODE_OPTIONS: CombatModeOption[] = [
  {
    value: 'players',
    label: 'Players calculate',
    description: 'Tally sheets only: enemies out, own casualties, loot and notes. Everyone works the combat out at the table.',
  },
  {
    value: 'app',
    label: 'App calculates',
    description: 'The battle sheet offers the attack calculator: odds for any fight, dice walked through step by step, kills logged to the tally.',
  },
]

export function combatModeLabel(mode: CombatMode): string {
  return COMBAT_MODE_OPTIONS.find((o) => o.value === mode)?.label ?? mode
}

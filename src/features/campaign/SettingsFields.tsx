// The settings half of the create and settings screens: gold, roster cap, house-rule switches,
// dice policy and the rules Markdown with a preview toggle.

import { useState } from 'react'
import { Markdown, NumberField, SegmentedControl, TextArea } from '../../ui'
import { Section, ToggleRow } from './bits'
import { COMBAT_MODE_OPTIONS, DICE_POLICY_OPTIONS, HOUSE_RULE_SWITCHES, type SettingsForm, type SettingsFormErrors } from './settingsForm'

export interface SettingsFieldsProps {
  form: SettingsForm
  onChange: (form: SettingsForm) => void
  errors: SettingsFormErrors
  rules: string
  onRulesChange: (rules: string) => void
  disabled?: boolean
}

export function SettingsFields({ form, onChange, errors, rules, onRulesChange, disabled = false }: SettingsFieldsProps) {
  const [preview, setPreview] = useState(false)
  const dice = DICE_POLICY_OPTIONS.find((o) => o.value === form.dicePolicy)
  const combat = COMBAT_MODE_OPTIONS.find((o) => o.value === form.combatMode)

  return (
    <>
      <Section title="Treasury">
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Starting gold"
            value={form.startingGold}
            onChange={(v) => onChange({ ...form, startingGold: v ?? Number.NaN })}
            error={errors.startingGold}
            hint={errors.startingGold ? undefined : 'gc per new warband'}
            disabled={disabled}
          />
          <NumberField
            label="Max rosters"
            value={form.maxRosters}
            allowEmpty
            onChange={(v) => onChange({ ...form, maxRosters: v })}
            error={errors.maxRosters}
            hint={errors.maxRosters ? undefined : 'Blank for no cap'}
            disabled={disabled}
          />
        </div>
      </Section>

      <Section title="House rules">
        <div className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low px-4">
          {HOUSE_RULE_SWITCHES.map((rule) => (
            <ToggleRow
              key={rule.key}
              label={rule.label}
              description={rule.description}
              checked={form.houseRules[rule.key]}
              disabled={disabled}
              onChange={(checked) => onChange({ ...form, houseRules: { ...form.houseRules, [rule.key]: checked } })}
            />
          ))}
        </div>
      </Section>

      <Section title="Dice">
        <SegmentedControl
          label="Who rolls the dice"
          options={DICE_POLICY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={form.dicePolicy}
          onChange={(dicePolicy) => {
            if (!disabled) onChange({ ...form, dicePolicy })
          }}
        />
        {dice ? <p className="text-sm leading-relaxed text-ink-dim">{dice.description}</p> : null}
      </Section>

      <Section title="Combat during battles">
        <SegmentedControl
          label="How games are scored by default"
          options={COMBAT_MODE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={form.combatMode}
          onChange={(combatMode) => {
            if (!disabled) onChange({ ...form, combatMode })
          }}
        />
        {combat ? <p className="text-sm leading-relaxed text-ink-dim">{combat.description}</p> : null}
        <div className="flex flex-col rounded-md border border-border bg-surface-low px-4">
          <ToggleRow
            label="Lock it for every game"
            description="Players start every game this way and cannot change it. The GM can still choose per game."
            checked={form.lockCombatMode}
            disabled={disabled}
            onChange={(lockCombatMode) => onChange({ ...form, lockCombatMode })}
          />
        </div>
      </Section>

      <Section
        title="Campaign rules"
        aside={
          <button type="button" onClick={() => setPreview((v) => !v)} className="inline-flex min-h-11 items-center text-xs text-brass underline-offset-4 hover:underline">
            {preview ? 'Edit' : 'Preview'}
          </button>
        }
      >
        {preview ? (
          <div className="rounded-md border border-border bg-surface-low px-4 py-3">
            {rules.trim() ? <Markdown source={rules} /> : <p className="text-sm text-ink-dim">Nothing written yet.</p>}
          </div>
        ) : (
          <TextArea
            label="Rules and notes"
            rows={8}
            value={rules}
            disabled={disabled}
            placeholder={'## Schedule\nWe play the first Thursday of the month.\n\n## Extra house rules\n- ...'}
            hint="Markdown. Every member can read this from the campaign page."
            onChange={(e) => onRulesChange(e.target.value)}
          />
        )}
      </Section>
    </>
  )
}

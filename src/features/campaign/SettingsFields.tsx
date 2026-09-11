// The settings half of the create and settings screens: gold, roster cap, house-rule switches,
// dice policy and the rules Markdown with a preview toggle.

import { useState } from 'react'
import { Markdown, NumberField, SegmentedControl, TextArea } from '../../ui'
import { Section, ToggleRow } from './bits'
import { CampaignTypeChooser } from './CampaignTypeChooser'
import { BansEditor } from './BansEditor'
import { COMBAT_MODE_OPTIONS, DICE_POLICY_OPTIONS, FIRST_SPELL_RULE_OPTIONS, HOUSE_RULE_SWITCHES, type SettingsForm, type SettingsFormErrors } from './settingsForm'

export interface SettingsFieldsProps {
  form: SettingsForm
  onChange: (form: SettingsForm) => void
  errors: SettingsFormErrors
  rules: string
  onRulesChange: (rules: string) => void
  section?: string
  disabled?: boolean
}

export function SettingsFields({ form, onChange, errors, rules, onRulesChange, disabled = false, section }: SettingsFieldsProps) {
  const [preview, setPreview] = useState(false)
  const dice = DICE_POLICY_OPTIONS.find((o) => o.value === form.dicePolicy)
  const combat = COMBAT_MODE_OPTIONS.find((o) => o.value === form.combatMode)
  const firstSpell = FIRST_SPELL_RULE_OPTIONS.find((o) => o.value === form.houseRules.firstSpellRule)

  return (
    <>
      <div hidden={!!section && section !== 'General'} className="flex flex-col gap-6">
      <CampaignTypeChooser mapCampaign={form.mapCampaign} onChange={(mapCampaign) => onChange({ ...form, mapCampaign })} disabled={disabled} />

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

      </div>
      <div hidden={!!section && section !== 'Rules & bans'} className="flex flex-col gap-6">
      <Section title="House rules">
        <div className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low px-4">
          {HOUSE_RULE_SWITCHES.filter((rule) => !rule.parent || form.houseRules[rule.parent]).map((rule) => (
            <div key={rule.key} className={rule.parent ? 'pl-6' : ''}>
              <ToggleRow
                label={rule.label}
                description={rule.description}
                checked={form.houseRules[rule.key]}
                disabled={disabled}
                onChange={(checked) => onChange({ ...form, houseRules: { ...form.houseRules, [rule.key]: checked } })}
              />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <SegmentedControl
            label="A spellcaster's first spell"
            options={FIRST_SPELL_RULE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            value={form.houseRules.firstSpellRule}
            onChange={(firstSpellRule) => {
              if (!disabled) onChange({ ...form, houseRules: { ...form.houseRules, firstSpellRule } })
            }}
          />
          {firstSpell ? <p className="text-sm leading-relaxed text-ink-dim">{firstSpell.description}</p> : null}
        </div>
        <BansEditor bans={form.houseRules.bans} disabled={disabled} onChange={(bans) => onChange({ ...form, houseRules: { ...form.houseRules, bans } })} />
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

      <Section title="Post-battle reports">
        <div className="flex flex-col rounded-md border border-border bg-surface-low px-4">
          <ToggleRow
            label="Reports need GM approval"
            description="A player's report waits, applying nothing to the roster, until the GM approves it or returns it with a note. The GM's own reports apply at once."
            checked={form.reportApproval}
            disabled={disabled}
            onChange={(reportApproval) => onChange({ ...form, reportApproval })}
          />
        </div>
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
      </div>
    </>
  )
}

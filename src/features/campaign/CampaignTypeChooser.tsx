// What kind of campaign this is, asked as two cards rather than a switch buried among the house
// rules. Shown at the top of both the create screen and the settings screen, so a campaign always
// says plainly which it is and the GM can change their mind later.

import { HoverCard, Icon, type IconName } from '../../ui'
import { Section } from './bits'

export interface CampaignTypeChooserProps {
  mapCampaign: boolean
  onChange: (mapCampaign: boolean) => void
  disabled?: boolean
}

interface Choice {
  map: boolean
  icon: IconName
  title: string
  blurb: string
  tip: string
}

const CHOICES: Choice[] = [
  {
    map: false,
    icon: 'campaigns',
    title: 'Regular campaign',
    blurb: 'Battles are scheduled between warbands and scored on their own.',
    tip: 'The standard campaign: warbands play each other, keep their gold and wyrdstone, and the ledger tracks the results. No territory changes hands.',
  },
  {
    map: true,
    icon: 'map',
    title: 'Map campaign',
    blurb: 'Every battle is fought over a district of the city.',
    tip: "Played on the fan-made Mordheim campaign map. Each battle happens in one of thirty districts; the winner takes a foothold there, footholds bring that district's advantages to the trading post, recruitment and the battlefield, and reaching a district depends on what you already hold.",
  },
]

export function CampaignTypeChooser({ mapCampaign, onChange, disabled = false }: CampaignTypeChooserProps) {
  return (
    <Section title="Type of campaign">
      <div className="grid grid-cols-2 gap-3">
        {CHOICES.map((choice) => {
          const on = mapCampaign === choice.map
          return (
            <button
              key={choice.title}
              type="button"
              aria-pressed={on}
              disabled={disabled}
              onClick={() => onChange(choice.map)}
              className={`flex min-h-28 flex-col items-start gap-1.5 rounded-md border px-3 py-3 text-left transition-colors disabled:opacity-60 ${
                on ? 'border-brass bg-brass/10 shadow-[inset_0_0_0_1px_var(--color-brass)]' : 'border-border bg-surface-low hover:bg-surface-high'
              }`}
            >
              <Icon name={choice.icon} size={22} className="text-brass" />
              <span className="text-sm font-semibold leading-tight text-ink">{choice.title}</span>
              <span className="text-xs leading-snug text-ink-dim">{choice.blurb}</span>
              <HoverCard title={choice.title} label={<span className="text-xs text-brass">What is this?</span>}>
                {choice.tip}
              </HoverCard>
            </button>
          )
        })}
      </div>
    </Section>
  )
}

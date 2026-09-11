export function CampaignSections({ options, value, onChange, label }: { options: readonly string[]; value: string; onChange: (value: string) => void; label: string }) {
  return <nav aria-label={label} className="grid grid-cols-3 gap-2 md:flex md:flex-wrap">
    {options.map(option => <button key={option} type="button" aria-current={value === option ? 'page' : undefined} onClick={() => onChange(option)}
      className={`min-h-11 rounded-md border px-2 py-2 text-sm font-medium md:px-5 ${value === option ? 'border-brass bg-brass text-surface-low' : 'border-border bg-surface-low text-ink hover:border-brass'}`}>
      {option}
    </button>)}
  </nav>
}

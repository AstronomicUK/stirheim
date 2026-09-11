import { useMemo, useState } from 'react'
import { SCENARIOS, CORE_RULEBOOK_SCENARIO_IDS } from '../../rules/data/campaign/scenarios'
import { Button, TextField } from '../../ui'
import { Section } from './bits'
import { enabledCampaignScenarios, filterScenarios } from '../scenarios/helpers'

export function ScenarioSelection({value,onChange,disabled}:{value?:string[];onChange:(ids:string[])=>void;disabled?:boolean}) {
 const [search,setSearch]=useState('')
 const [limit,setLimit]=useState(12)
 const enabled=new Set(enabledCampaignScenarios(value).map(s=>s.id))
 const hits=useMemo(()=>filterScenarios(SCENARIOS,search),[search])
 return <div id="scenario-library"><Section title="Scenario library" aside={`${enabled.size} enabled`}>
  <p className="text-sm text-ink-dim">Choose which built-in scenarios can be selected or rolled for new battles in this campaign. Existing battles keep their scenario. Save changes below to apply your choices.</p>
  <div className="flex flex-wrap gap-2"><Button variant="ghost" disabled={disabled} onClick={()=>onChange([...CORE_RULEBOOK_SCENARIO_IDS])}>Rulebook nine</Button><Button variant="ghost" disabled={disabled} onClick={()=>onChange(SCENARIOS.map(s=>s.id))}>Enable all</Button><Button variant="ghost" disabled={disabled} onClick={()=>onChange([])}>Clear selection</Button></div>
  <TextField label="Search scenario library" placeholder="Name, setting or description" value={search} onChange={e=>{setSearch(e.target.value);setLimit(12)}}/>
  <ul aria-label="Campaign scenario selection" className="max-h-96 divide-y divide-border overflow-y-auto rounded border border-border">{hits.slice(0,limit).map(s=><li key={s.id}><label className="flex cursor-pointer items-start gap-3 px-3 py-3"><input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-brass" aria-label={`Enable ${s.title}`} checked={enabled.has(s.id)} disabled={disabled} onChange={e=>{const next=new Set(enabled);if(e.target.checked)next.add(s.id);else next.delete(s.id);onChange([...next])}}/><span className="min-w-0"><span className="block text-sm font-semibold">{s.title}</span><span className="block text-xs text-ink-dim">{s.setting} · {s.source}</span><span className="mt-1 block text-xs text-ink-dim">{s.description}</span></span></label></li>)}</ul>
  <div className="flex flex-wrap items-center justify-between gap-2"><p role="status" className="text-xs text-ink-dim">Showing {Math.min(limit,hits.length)} of {hits.length} scenarios</p>{limit<hits.length?<Button variant="ghost" onClick={()=>setLimit(n=>n+12)}>Show more scenarios</Button>:null}</div>
  {enabled.size===0?<p className="text-sm text-ink-dim">No built-in scenarios enabled. Custom scenarios and deciding a scenario later remain available.</p>:null}
 </Section></div>
}

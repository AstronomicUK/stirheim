import { useState } from 'react'
import type { WarbandDetail } from '../../api/warbands'
import { useRosterEvent } from '../../api/rosterEvents'
import { blackOrcBloodBlock, purchaseBlackOrcBlood } from '../../rules/resolve/blackOrcBlood'
import { Button, Notice, SelectField } from '../../ui'

export function BlackOrcBloodCard({ detail, canEdit }: { detail: WarbandDetail; canEdit: boolean }) {
  const [chosen, setChosen] = useState('')
  const save = useRosterEvent(detail)
  if (!canEdit || detail.warband.archived || detail.roster.warbandTemplateId !== 'black_orcs') return null
  const upgraded = detail.roster.heroes.find(h => ['active', 'captured'].includes(h.status) && (h.flags.blackOrcBlood || h.skillIds.includes('black_orcs_skills_proven_warrior')))
  if (upgraded) return <Notice title="Black Orc Blood">{upgraded.name} occupies the warband’s Black Orc Blood upgrade. Proven Warrior can be chosen as a skill at 25 Experience.</Notice>
  const candidates = detail.roster.heroes.filter(h => h.unitTemplateId === 'black_orcs_youngun' && h.status === 'active')
  if (!candidates.length) return null
  const selected = candidates.some(h => h.id === chosen) ? chosen : candidates[0].id
  const block = blackOrcBloodBlock(detail.roster, selected)
  return <Notice title="Black Orc Blood">
    <p>Upgrade one Young’un for 10 gc. This allows him to choose Proven Warrior at 25 Experience. The purchase itself grants no characteristic increase, natural armour or extra advancement.</p>
    <SelectField label="Young’un to upgrade" value={selected} onChange={e => setChosen(e.target.value)}>{candidates.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</SelectField>
    {block ? <p>{block}</p> : null}
    <Button disabled={Boolean(block)} pending={save.isPending} onClick={() => { const result = purchaseBlackOrcBlood(detail.roster, selected); save.mutate({ next: result.roster, reason: result.reason }) }}>Buy Black Orc Blood — 10 gc</Button>
    {save.error ? <p role="alert">{save.error.message}</p> : null}
  </Notice>
}

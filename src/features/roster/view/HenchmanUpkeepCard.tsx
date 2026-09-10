import { useState } from 'react'
import type { WarbandDetail } from '../../../api/warbands'
import { henchmanUpkeepDue,type HenchmanUpkeepLine } from '../../../rules/resolve/recruitment'
import { GroupUpkeepSheet } from '../../recruitment/GroupUpkeepSheet'
import { Button } from '../../../ui'
import { Card,Section } from './bits'
export function HenchmanUpkeepCard({detail,canEdit}:{detail:WarbandDetail;canEdit:boolean}){
 const [chosen,setChosen]=useState<HenchmanUpkeepLine|null>(null)
 const lines=henchmanUpkeepDue(detail.roster)
 if(!canEdit||!lines.length)return null
 return <Section title="Henchmen: upkeep due"><p className="text-sm">Settle these costs after the battle. Trolls may have an alternative when you cannot afford their food.</p>{lines.map(l=><Card key={l.groupId} className="flex items-center justify-between gap-3 p-4"><span>{l.name} · {l.gold} gc</span><Button onClick={()=>setChosen(l)}>Review upkeep</Button></Card>)}{chosen?<GroupUpkeepSheet detail={detail} line={chosen} onClose={()=>setChosen(null)} onDone={()=>setChosen(null)}/>:null}</Section>
}

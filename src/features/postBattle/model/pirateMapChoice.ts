import type { ReportContext } from './derive'
import type { ReportDraft } from './state'

/** One owned Treasure Map replaces city exploration; old battle ticks are only a default. */
export function pirateMapChoice(draft: ReportDraft, ctx: ReportContext) {
  const options = ctx.roster.warbandTemplateId === 'pirates' ? ctx.items.filter(row=>
    row.warband_id===ctx.roster.id && row.item_rules_id==='treasure_map' && row.quantity>0 &&
    (row.holder_type==='stash' || row.holder_type==='hero' && ctx.roster.heroes.some(h=>h.id===row.holder_id&&h.status==='active')),
  ) : []
  const legacy = options.find(row=>row.holder_id && ctx.itemsUsed?.[row.holder_id]?.includes('treasure_map'))
  const requested = draft.pirateMapChoice ?? legacy?.id ?? 'regular'
  const row = options.find(row=>row.id===requested)
  const problems = requested!=='regular' && !row ? ['The selected Treasure Map is no longer available. Choose an owned map or regular exploration.'] : []
  return {options,requested,row,problems}
}


export function recordMapDie(draft:ReportDraft,label:string,value:number|null,source?:'app'|'tabletop'):ReportDraft {
  if(value===null||!source)return draft
  return {...draft,pirateMapRollHistory:[...(draft.pirateMapRollHistory??[]),{label,value,source}]}
}
export function mapRollNotes(draft:ReportDraft):string[] {
  const previous=new Map<string,{value:number;source:'app'|'tabletop'}>()
  return (draft.pirateMapRollHistory??[]).map(roll=>{
    const before=previous.get(roll.label)
    previous.set(roll.label,roll)
    return before&&roll.source==='tabletop'
      ? `${roll.label}: player changed ${before.value} (${before.source==='app'?'app roll':'previous entry'}) to ${roll.value}.`
      : `${roll.label}: ${roll.source==='app'?'app rolled':'player entered'} ${roll.value}.`
  })
}

import {useState} from 'react'
import {useSellFacioNotebooks,type FacioState} from '../../api/facio'
import {findItem} from '../../rules/data/items'
import {Button,DieField,Notice} from '../../ui'
export function FacioNotebooks({warbandId,reward,canTrade}:{warbandId:string;reward:FacioState['notebooks'][number];canTrade:boolean}) {
 const [dice,setDice]=useState<(number|null)[]>([null,null])
 const [history,setHistory]=useState<string[]>([])
 const sale=useSellFacioNotebooks(warbandId)
 const valid=dice.every(d=>d!==null&&Number.isInteger(d)&&d>=1&&d<=6)
 return <section className="flex flex-col gap-3 rounded-md border border-border bg-surface-low p-4">
  <h3 className="font-medium">Sell Facio’s notebooks</h3>
  <p className="text-sm">You bought {findItem(reward.itemId)?.name??reward.itemId} for {reward.cost} gc. Now sell the notebooks to the merchant’s competitors.</p>
  <div className="flex flex-wrap gap-3">{[0,1].map(i=><DieField key={i} label={`Notebook gold D6 ${i+1}`} sides={6} value={dice[i]} rollable disabled={sale.isPending||!canTrade} onChange={(value,source)=>{
   setDice(old=>old.map((d,j)=>i===j?value:d))
   if(value!==null)setHistory(old=>[...old,`Die ${i+1}: ${source==='app'?'app rolled':'player entered'} ${value}.`])
  }}/>)}</div>
  {sale.error?<Notice>{sale.error.message}</Notice>:null}
  <Button disabled={!valid||!canTrade} pending={sale.isPending} onClick={()=>sale.mutate({reportId:reward.reportId,dice:dice as number[],reason:history.join(' ')})}>{valid?`Sell notebooks for ${(dice[0]!+dice[1]!)*10} gc`:'Roll both dice'}</Button>
 </section>
}

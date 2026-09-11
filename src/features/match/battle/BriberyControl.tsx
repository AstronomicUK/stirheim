import {matchKeys} from '../../../api/matches'
import {useState} from 'react'
import {useMutation,useQueryClient} from '@tanstack/react-query'
import {bribeKey,payBribery,type BriberyPayment} from '../../../api/battleBribes'
import {warbandKeys} from '../../../api/warbands'
import type {BattleLiveState} from '../../../domain'
import type {RosterWarband} from '../../../rules/types/roster'
import {Button} from '../../../ui'
import {briberyQuote} from './routCheckRules'
export function BriberyControl({matchId,roster,sheet,paidExclusions,ready}:{matchId:string;roster:RosterWarband;sheet:BattleLiveState;paidExclusions:number;ready:boolean}){
 const quote=briberyQuote(roster,sheet,paidExclusions)
 const client=useQueryClient()
 const [request,setRequest]=useState<BriberyPayment|null>(null)
 const payment=useMutation({mutationFn:payBribery,onSuccess:async()=>{
  await Promise.all([client.invalidateQueries({queryKey:bribeKey(matchId)}),client.invalidateQueries({queryKey:warbandKeys.all}),client.invalidateQueries({queryKey:matchKeys.roster(matchId,roster.id)})]);setRequest(null)
 }})
 if(!quote.merchantId)return null
 const submit=()=>{
  const args=request??{p_id:crypto.randomUUID(),p_match_id:matchId,p_warband_id:roster.id,p_merchant_id:quote.merchantId!,p_non_heroes:quote.nonHeroes,p_casualties:quote.casualties+paidExclusions,p_threshold:quote.threshold,p_round:sheet.turn,p_expected_gold:roster.gold,p_expected_exclusions:paidExclusions}
  setRequest(args);payment.mutate(args)
 }
 return <div className="flex flex-col gap-2 rounded border border-brass p-3 text-sm">
  <p className="font-semibold">{quote.merchantName}: Bribery</p>
  <p>Confirm {quote.nonHeroes} non-Hero members remain in the game: {quote.henchmen} henchmen, {quote.hiredSwords} hired swords and {quote.animals} animal fighters. {quote.merchantName} must be able to act.</p>
  {quote.nonHeroes>0?<>
   <p>Pay {quote.cost} gc ({roster.gold} available) to ignore one casualty for Rout tests. {quote.testStillRequiredAfterPayment?'A Rout test will still be required after this payment.':'This payment brings the Rout count below the threshold.'}</p>
   <Button variant="secondary" disabled={!ready||payment.isPending||(!request&&!quote.available)} onClick={submit}>{payment.isPending?'Paying…':request&&payment.isError?'Retry payment':`Confirm and pay ${quote.cost} gc`}</Button>
  </>:<p>No non-Hero hirelings remain. Resolve any agreed Bribery exception at the table.</p>}
  {payment.isError?<><p role="alert" className="text-warn">{payment.error.message}</p><Button variant="secondary" onClick={async()=>{await Promise.all([client.invalidateQueries({queryKey:bribeKey(matchId)}),client.invalidateQueries({queryKey:warbandKeys.all}),client.invalidateQueries({queryKey:matchKeys.roster(matchId,roster.id)})]);setRequest(null);payment.reset()}}>Review updated totals</Button></>:null}
 </div>
}

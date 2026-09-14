import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query'
import {supabase} from './supabase'
import {warbandKeys} from './warbands'
import {tradeKeys,type HaggleTrade} from './trading'
import type {RosterChange} from '../domain'
import type {Json} from './database.types'
export interface FacioState {available:{reportId:string;matchId:string}[];notebooks:{reportId:string;itemId:string;cost:number}[]}
export interface FacioPurchase {reportId:string;requestId:string;cost:number;expectedGold:number;itemId:string}
export function useFacio(warbandId:string) {
 return useQuery({queryKey:['trading','facio',warbandId],queryFn:async()=>{
  const {data,error}=await supabase.rpc('facio_trade_state',{p_warband_id:warbandId})
  if(error)throw new Error(error.message)
  return data as unknown as FacioState
 }})
}
export async function recordFacioPurchase(warbandId:string,purchase:FacioPurchase,changes:RosterChange[],reason='',haggle?:HaggleTrade) {
 const {data,error}=await supabase.rpc('record_facio_purchase',{p_warband_id:warbandId,p_report_id:purchase.reportId,p_request_id:purchase.requestId,p_changes:changes as unknown as Json,p_cost:purchase.cost,p_expected_gold:purchase.expectedGold,p_item_id:purchase.itemId,p_reason:reason,p_haggle:haggle as unknown as Json??undefined})
 if(error)throw new Error(error.message)
 return data
}
export function useSellFacioNotebooks(warbandId:string) {
 const qc=useQueryClient()
 return useMutation({mutationFn:async(input:{reportId:string;dice:number[];reason:string})=>{
  const {data,error}=await supabase.rpc('sell_facio_notebooks',{p_warband_id:warbandId,p_report_id:input.reportId,p_dice:input.dice,p_reason:input.reason})
  if(error)throw new Error(error.message)
  return data
 },onSuccess:()=>Promise.all([qc.invalidateQueries({queryKey:tradeKeys.all}),qc.invalidateQueries({queryKey:warbandKeys.all})])})
}

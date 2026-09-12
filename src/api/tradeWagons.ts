import {z} from 'zod'
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query'
import {useSession} from '../app/session'
import {uuidSchema} from '../domain/rows'
import {tradeWagonSnapshotSchema} from '../domain/tradeWagon'
import {supabase} from './supabase'
import {warbandKeys} from './warbands'

const settlementSchema=z.object({
  kind:z.enum(['ransom','keep','loot']),reason:z.string(),recorded_by:uuidSchema,
  recorded_at:z.string(),gold:z.number().int().nonnegative().optional(),
  vehicle:z.enum(['wagon','stagecoach']).optional(),
})
export const tradeWagonCaptureSchema=z.object({
  report_id:uuidSchema,match_id:uuidSchema,merchant_id:uuidSchema,captor_id:uuidSchema,
  state:z.enum(['pending','settled']),created_at:z.string(),
  snapshot:tradeWagonSnapshotSchema,settlement:settlementSchema.nullable(),
})
export type TradeWagonCapture=z.infer<typeof tradeWagonCaptureSchema>
export async function fetchTradeWagonCaptures(warbandId:string) {
  const id=uuidSchema.parse(warbandId)
  const {data,error}=await supabase.from('trade_wagon_captures').select('*')
    .or(`merchant_id.eq.${id},captor_id.eq.${id}`).order('created_at',{ascending:false})
  if(error)throw new Error(error.message)
  return z.array(tradeWagonCaptureSchema).parse(data)
}
export function useTradeWagonCaptures(warbandId:string|undefined) {
  const userId=useSession(s=>s.user?.id)
  return useQuery({queryKey:['trade-wagon-captures',warbandId,userId],enabled:!!warbandId&&!!userId,
    queryFn:()=>fetchTradeWagonCaptures(warbandId!)})
}
type OutcomeInput={reportId:string;reason:string;merchantUpdated:string;captorUpdated:string}&(
  {kind:'ransom';gold:number}|{kind:'loot'}|{kind:'keep';vehicle:'wagon'|'stagecoach';vehicleAllowed:boolean}
)
export async function settleTradeWagon(input:OutcomeInput) {
  const shared={p_report_id:input.reportId,p_reason:input.reason,
    p_merchant_updated:input.merchantUpdated,p_captor_updated:input.captorUpdated}
  const {error}=input.kind==='ransom'
    ?await supabase.rpc('settle_trade_wagon_ransom',{...shared,p_gold:input.gold})
    :input.kind==='loot'?await supabase.rpc('loot_captured_trade_wagon',shared)
    :await supabase.rpc('keep_captured_trade_wagon',{...shared,p_vehicle:input.vehicle,p_vehicle_allowed:input.vehicleAllowed})
  if(error)throw new Error(error.message)
}
export async function undoTradeWagon(input:{reportId:string;kind:'ransom'|'keep'|'loot';reason:string}) {
  const {error}=await supabase.rpc(input.kind==='ransom'?'undo_trade_wagon_ransom':input.kind==='loot'?'undo_looted_trade_wagon':'undo_kept_trade_wagon',{
    p_report_id:input.reportId,p_reason:input.reason,
  })
  if(error)throw new Error(error.message)
}
function useInvalidateTradeWagon() {
  const qc=useQueryClient()
  return ()=>Promise.all([
    qc.invalidateQueries({queryKey:['trade-wagon-captures']}),
    qc.invalidateQueries({queryKey:['trade-wagon-search']}),
    qc.invalidateQueries({queryKey:warbandKeys.all}),
    qc.invalidateQueries({queryKey:['reports']}),
  ])
}
export function useSettleTradeWagon() {
  const invalidate=useInvalidateTradeWagon()
  return useMutation({mutationFn:settleTradeWagon,onSuccess:invalidate})
}
export function useUndoTradeWagon() {
  const invalidate=useInvalidateTradeWagon()
  return useMutation({mutationFn:undoTradeWagon,onSuccess:invalidate})
}

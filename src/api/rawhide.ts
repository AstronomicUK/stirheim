import {useSession} from '../app/session'
import {z} from 'zod'
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query'
import {supabase} from './supabase'
const cargoSchema=z.discriminatedUnion('declared',[
 z.object({declared:z.literal(false)}),
 z.object({declared:z.literal(true),warband_id:z.string(),revealed:z.boolean(),locked:z.boolean(),wagon:z.number().nullable().optional(),gold:z.number().optional(),wyrdstone:z.number().optional(),sale_value:z.number().optional(),valuation_note:z.string().optional(),rounding:z.enum(['up','down']).optional(),settled_report_id:z.string().nullable().optional()})
])
export type RawhideCargo=z.infer<typeof cargoSchema>
export async function fetchRawhideCargo(matchId:string):Promise<RawhideCargo>{const {data,error}=await supabase.rpc('get_rawhide_cargo',{p_match_id:matchId});if(error)throw new Error(error.message);return cargoSchema.parse(data)}
export function useRawhideCargo(matchId:string|undefined,phase?:string){const userId=useSession(s=>s.user?.id);return useQuery({queryKey:['rawhide-cargo',matchId,phase,userId],enabled:!!matchId&&!!userId,queryFn:()=>fetchRawhideCargo(matchId!),refetchInterval:phase==='scheduled'?10000:false})}
export interface CargoDeclaration {matchId:string;warbandId:string;wagon:number|null;saleValue:number;note:string;rounding:'up'|'down'}
export function useDeclareRawhideCargo(){const qc=useQueryClient();return useMutation({mutationFn:async(d:CargoDeclaration)=>{const {error}=await supabase.rpc('set_rawhide_cargo',{p_match_id:d.matchId,p_warband_id:d.warbandId,p_wagon:d.wagon??undefined,p_sale_value:d.saleValue,p_valuation_note:d.note,p_rounding:d.rounding});if(error)throw new Error(error.message)},onSuccess:()=>qc.invalidateQueries({queryKey:['rawhide-cargo']})})}

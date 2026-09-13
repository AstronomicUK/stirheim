import {createClient,type SupabaseClient} from '@supabase/supabase-js'
import {beforeAll,beforeEach,afterEach,describe,it,expect} from 'vitest'
const uid='22222222-2222-4222-8222-222222222222'
describe.skipIf(process.env.SUPABASE_LOCAL!=='1')('Construct repair settlement',()=>{
 let admin:SupabaseClient,player:SupabaseClient,band:string,group:string
 const state={constructRepairs:[{cost:20,injuryRoll:1,repairRoll:4}]}
 const check=(r:{error:unknown})=>{if(r.error)throw r.error}
 beforeAll(async()=>{admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);player=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});check(await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'}))})
 beforeEach(async()=>{band=crypto.randomUUID();group=crypto.randomUUID();check(await admin.from('warbands').insert({id:band,name:'Construct repair QA',owner_id:uid,type_rules_id:'masters_of_horror',gold:30}));check(await admin.from('henchman_groups').insert({id:group,warband_id:band,name:'Construct',unit_type_rules_id:'masters_of_horror_flesh_construct',size:1,campaign_state:state,stats:{M:4,WS:3,BS:0,S:4,T:4,W:3,I:2,A:2,Ld:5}}))})
 afterEach(async()=>{check(await admin.from('warbands').delete().eq('id',band))})
 const args=()=>({p_group_id:group,p_request_id:crypto.randomUUID(),p_action:'repair',p_expected_state:state})
 const read=async()=>{const g=await admin.from('henchman_groups').select('size,campaign_state').eq('id',group).single();const w=await admin.from('warbands').select('gold').eq('id',band).single();check(g);check(w);return {g:g.data!,gold:w.data!.gold}}
 it('deducts once, restores the exact debt and gold on undo, and rejects another refund',async()=>{
  const a=args();check(await player.rpc('resolve_construct_repair',a));check(await player.rpc('resolve_construct_repair',a));let r=await read();expect(r.gold).toBe(10);expect(r.g.size).toBe(1);expect(r.g.campaign_state.constructRepairs).toBeUndefined()
  const undo={...a,p_action:'undo',p_expected_state:r.g.campaign_state};check(await player.rpc('resolve_construct_repair',undo));r=await read();expect(r).toEqual({g:{size:1,campaign_state:state},gold:30});expect((await player.rpc('resolve_construct_repair',undo)).error).toBeTruthy();expect((await read()).gold).toBe(30)
 })
 it('keeps unaffordable damage and permits abandonment with no gold change, then restores it',async()=>{
  check(await admin.from('warbands').update({gold:5}).eq('id',band));expect((await player.rpc('resolve_construct_repair',args())).error).toBeTruthy();expect((await read()).g.campaign_state).toEqual(state)
  const a={...args(),p_action:'abandon'};check(await player.rpc('resolve_construct_repair',a));const r=await read();expect(r.gold).toBe(5);expect(r.g.size).toBe(0);check(await player.rpc('resolve_construct_repair',{...a,p_action:'undo',p_expected_state:r.g.campaign_state}));expect((await read()).g.size).toBe(1)
 })
 it('allows only one simultaneous payment and refuses stale-state undo after a roster edit',async()=>{
  const r=await Promise.all([player.rpc('resolve_construct_repair',args()),player.rpc('resolve_construct_repair',args())]);expect(r.filter(v=>!v.error)).toHaveLength(1)
  const current=await read();check(await admin.from('henchman_groups').update({size:2}).eq('id',group));expect((await player.rpc('resolve_construct_repair',{...args(),p_action:'undo',p_request_id:current.g.campaign_state.constructRepairReceipt.requestId,p_expected_state:current.g.campaign_state})).error).toBeTruthy();expect((await read()).gold).toBe(10)
 })
})

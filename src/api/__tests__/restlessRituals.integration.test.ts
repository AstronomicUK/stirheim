import {createClient,type SupabaseClient} from '@supabase/supabase-js'
import {beforeAll,beforeEach,afterEach,describe,it,expect} from 'vitest'
const check=(r:{error:unknown})=>{if(r.error)throw r.error}
const stats={M:4,WS:3,BS:3,S:3,T:4,W:4,I:3,A:1,Ld:8}
describe.skipIf(process.env.SUPABASE_LOCAL!=='1')('Restless Dead rituals',()=>{
 let admin:SupabaseClient,player:SupabaseClient,band:string,hero:string,campaign:string,match:string
 beforeAll(async()=>{admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);player=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});check(await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'}))})
 beforeEach(async()=>{band=crypto.randomUUID();hero=crypto.randomUUID();campaign=crypto.randomUUID();match=crypto.randomUUID();check(await admin.from('warbands').insert({id:band,owner_id:'22222222-2222-4222-8222-222222222222',name:'Ritual QA',type_rules_id:'the_restless_dead_variant',gold:500,wyrdstone:5}));check(await admin.from('heroes').insert({id:hero,warband_id:band,name:'Liche',unit_type_rules_id:'restless_dead_variant_liche',stats}))})
 afterEach(async()=>{check(await admin.from('campaigns').delete().eq('id',campaign));check(await admin.from('warbands').delete().eq('id',band))})
 async function phase(ooa:unknown[]=[]){check(await admin.from('campaigns').insert({id:campaign,name:'Ritual QA',gm_id:'22222222-2222-4222-8222-222222222222'}));check(await admin.from('matches').insert({id:match,campaign_id:campaign,created_by:'22222222-2222-4222-8222-222222222222',state:'awaiting_reports'}));check(await admin.from('match_reports').insert({match_id:match,warband_id:band,submitted_by:'22222222-2222-4222-8222-222222222222',result:'lost',ooa,status:'pending'}))}
 const act=(kind:string,die?:number,id=crypto.randomUUID())=>player.rpc('resolve_restless_ritual',{p_warband_id:band,p_request_id:id,p_kind:kind,p_die:die})
 async function read(){const w=await admin.from('warbands').select('gold,wyrdstone').eq('id',band).single(),h=await admin.from('heroes').select('stats').eq('id',hero).single();check(w);check(h);return {...w.data!,W:h.data!.stats.W}}
 it('exempts initial construction, charges exactly once, and undoes it',async()=>{
  const id=crypto.randomUUID();check(await act('construct',undefined,id));check(await act('construct',undefined,id));expect(await read()).toEqual({gold:275,wyrdstone:5,W:4})
  expect((await act('construct',2)).error).toBeTruthy()
  check(await act('undo',undefined,id));expect(await read()).toEqual({gold:500,wyrdstone:5,W:4})
  expect((await act('undo',undefined,id)).error).toBeTruthy()
 })
 it('charges D3 Wounds after battle, with a W1 floor and no rare searches',async()=>{
  await phase();check(await admin.from('heroes').update({stats:{...stats,W:2}}).eq('id',hero));check(await act('construct',3));expect((await read()).W).toBe(1)
  const r=await player.rpc('record_rare_item_trade',{p_warband_id:band,p_match_id:match,p_changes:[],p_wyrdstone_sold:false,p_heroes_searched:[hero],p_reason:'QA rare search'})
  expect(r.error?.message).toContain('construction')
 })
 it('consumes D3 shards per ritual, supports repetition, and fails without enough shards',async()=>{
  await phase();check(await act('feed',3));expect(await read()).toEqual({gold:500,wyrdstone:2,W:5})
  const id=crypto.randomUUID();check(await act('feed',3,id));check(await act('feed',3,id));expect(await read()).toEqual({gold:500,wyrdstone:0,W:5})
  check(await act('undo',undefined,id));expect(await read()).toEqual({gold:500,wyrdstone:2,W:5})
  expect((await player.rpc('record_rare_item_trade',{p_warband_id:band,p_match_id:match,p_changes:[],p_wyrdstone_sold:false,p_heroes_searched:[hero],p_reason:'Search after ritual'})).error).toBeTruthy()
 })
 it('blocks an OOA Liche and construction after a rare search',async()=>{
  await phase([{subjectType:'hero',subjectId:hero,subjectName:'Liche',count:1,by:[]}]);expect((await act('feed',1)).error?.message).toContain('out of action')
  check(await admin.from('trade_phase_state').upsert({warband_id:band,match_id:match,heroes_searched:[hero],rare_item_searchers:[hero]}));expect((await act('construct',1)).error?.message).toContain('already searched')
 })
})

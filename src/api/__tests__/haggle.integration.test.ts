import {createClient,type SupabaseClient} from '@supabase/supabase-js'
import {afterEach,beforeAll,beforeEach,describe,expect,it} from 'vitest'
const uid='22222222-2222-4222-8222-222222222222'
describe.skipIf(process.env.SUPABASE_LOCAL!=='1')('Haggle purchase transaction',()=>{
 let admin:SupabaseClient,player:SupabaseClient,band:string,hero:string,match:string,campaign:string
 const check=(r:{error:unknown})=>{if(r.error)throw r.error}
 beforeAll(async()=>{admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);player=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});check(await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'}))})
 beforeEach(async()=>{
  band=crypto.randomUUID();hero=crypto.randomUUID();match=crypto.randomUUID();campaign=crypto.randomUUID()
  check(await admin.from('campaigns').insert({id:campaign,gm_id:uid,name:'Disposable Haggle QA'}))
  check(await admin.from('warbands').insert({id:band,owner_id:uid,name:'Haggle QA',type_rules_id:'mercenaries_reikland',gold:100}))
  check(await admin.from('heroes').insert({id:hero,warband_id:band,name:'Haggler',unit_type_rules_id:'mercenaries_reikland_champions',is_hired_sword:false,status:'active',skills:['haggle'],flags:{},stats:{M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7}}))
  check(await admin.from('matches').insert({id:match,campaign_id:campaign,created_by:uid,state:'awaiting_reports'}))
  check(await admin.from('match_participants').insert({match_id:match,warband_id:band}))
  check(await admin.from('match_reports').insert({match_id:match,warband_id:band,submitted_by:uid,result:'won',submitted_at:new Date().toISOString()}))
 })
 afterEach(async()=>{check(await admin.from('campaigns').delete().eq('id',campaign));check(await admin.from('warbands').delete().eq('id',band))})
 const args=()=>({p_warband_id:band,p_match_id:match,p_changes:[{table:'warbands',op:'update',id:band,data:{gold:99}},{table:'items',op:'insert',data:{holder_type:'stash',item_rules_id:'sword',quantity:1}}],p_heroes_searched:[],p_reason:'',p_hero_id:hero,p_dice:[6,6],p_request_id:crypto.randomUUID(),p_item_name:'Sword',p_price_before:10})
 it('charges the one-gold minimum, saves raw dice and makes exact retry idempotent',async()=>{
  const a=args();check(await player.rpc('record_haggled_trade',a));check(await player.rpc('record_haggled_trade',a))
  const w=await admin.from('warbands').select('gold').eq('id',band).single();check(w);expect(w.data!.gold).toBe(99)
  const items=await admin.from('items').select('quantity').eq('warband_id',band);check(items);expect(items.data).toEqual([{quantity:1}])
  const h=await admin.from('heroes').select('flags').eq('id',hero).single();check(h);expect(h.data!.flags.haggleUse.dice).toEqual([6,6]);expect(h.data!.flags.haggleUse.priceAfter).toBe(1)
  expect((await player.rpc('record_haggled_trade',{...a,p_item_name:'Axe'})).error).toBeTruthy()
 })
 it('allows only one concurrent purchase for a Hero this phase',async()=>{
  const r=await Promise.all([player.rpc('record_haggled_trade',args()),player.rpc('record_haggled_trade',args())]);expect(r.filter(x=>!x.error)).toHaveLength(1)
 })
 it('recognises only a currently carried symbol, and refuses stale treasury totals',async()=>{
  check(await admin.from('heroes').update({skills:[]}).eq('id',hero))
  expect((await player.rpc('record_haggled_trade',args())).error).toBeTruthy()
  check(await admin.from('items').insert({warband_id:band,holder_type:'hero',holder_id:hero,item_rules_id:'symbol_of_the_order_of_freetraders',quantity:1}))
  const stale=args();stale.p_changes[0].data={gold:98};expect((await player.rpc('record_haggled_trade',stale)).error).toBeTruthy()
  check(await player.rpc('record_haggled_trade',args()))
 })
 it('rejects out-of-action Heroes and refreshes only for a newer report',async()=>{
  check(await admin.from('match_reports').update({ooa:[{subjectId:hero,subjectType:'hero',count:1}]}).eq('match_id',match).eq('warband_id',band))
  expect((await player.rpc('record_haggled_trade',args())).error).toBeTruthy()
  check(await admin.from('match_reports').update({ooa:[]}).eq('match_id',match).eq('warband_id',band));check(await player.rpc('record_haggled_trade',args()))
  const later=crypto.randomUUID()
  check(await admin.from('matches').insert({id:later,campaign_id:campaign,created_by:uid,state:'awaiting_reports'}))
  check(await admin.from('match_participants').insert({match_id:later,warband_id:band}))
  check(await admin.from('match_reports').insert({match_id:later,warband_id:band,submitted_by:uid,result:'won',submitted_at:new Date(Date.now()+60000).toISOString()}))
  const a=args();a.p_changes[0].data={gold:98}
  expect((await player.rpc('record_haggled_trade',a)).error).toBeTruthy()
  check(await player.rpc('record_haggled_trade',{...a,p_match_id:later}))
 })
 it('does not spend Haggle when the shared rare search transaction fails',async()=>{
  check(await admin.from('trade_phase_state').insert({warband_id:band,match_id:match,heroes_searched:[hero]}))
  expect((await player.rpc('record_haggled_trade',{...args(),p_heroes_searched:[hero]})).error).toBeTruthy()
  const h=await admin.from('heroes').select('flags').eq('id',hero).single();check(h);expect(h.data!.flags.haggleUse).toBeUndefined()
  const w=await admin.from('warbands').select('gold').eq('id',band).single();check(w);expect(w.data!.gold).toBe(100)
 })
})

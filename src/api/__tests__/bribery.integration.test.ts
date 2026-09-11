import {createClient,type SupabaseClient} from '@supabase/supabase-js'
import {afterEach,beforeAll,beforeEach,describe,expect,it} from 'vitest'
const uid='22222222-2222-4222-8222-222222222222'
describe.skipIf(process.env.SUPABASE_LOCAL!=='1')('atomic Merchant Bribery',()=>{
 let admin:SupabaseClient,player:SupabaseClient,campaign:string,match:string,band:string,hero:string
 beforeAll(async()=>{admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);player=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});const r=await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'});if(r.error)throw r.error})
 beforeEach(async()=>{
  campaign=crypto.randomUUID();match=crypto.randomUUID();band=crypto.randomUUID();hero=crypto.randomUUID()
  for(const r of [await admin.from('campaigns').insert({id:campaign,name:'Disposable Bribery QA',gm_id:uid}),await admin.from('warbands').insert({id:band,name:'Bribery QA',owner_id:uid,type_rules_id:'merchant_caravans',gold:100}),await admin.from('heroes').insert({id:hero,warband_id:band,name:'Merchant',unit_type_rules_id:'merchant_caravans_merchant',skills:['merchant_caravans_skills_bribery'],stats:{M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:8}}),await admin.from('matches').insert({id:match,campaign_id:campaign,created_by:uid,state:'in_progress'}),await admin.from('match_participants').insert({match_id:match,warband_id:band,accepted_at:new Date().toISOString()})])if(r.error)throw r.error
 })
 afterEach(async()=>{await admin.from('campaigns').delete().eq('id',campaign);await admin.from('warbands').delete().eq('id',band)})
 const input=(over:Record<string,unknown>={})=>({p_id:crypto.randomUUID(),p_match_id:match,p_warband_id:band,p_merchant_id:hero,p_non_heroes:4,p_casualties:4,p_threshold:3,p_round:1,p_expected_gold:100,p_expected_exclusions:0,...over})
 const gold=async()=>(await admin.from('warbands').select('gold').eq('id',band).single()).data?.gold
 it('deducts once, retries exactly, and persists each paid exclusion separately',async()=>{
  const args=input();const first=await player.rpc('pay_merchant_bribery',args);expect(first.error).toBeNull();expect(first.data.amount).toBe(20);expect(await gold()).toBe(80)
  expect((await player.rpc('pay_merchant_bribery',args)).data.id).toBe(args.p_id);expect(await gold()).toBe(80)
  expect((await player.rpc('pay_merchant_bribery',{...args,p_non_heroes:3})).error?.message).toContain('different details')
  const next=await player.rpc('pay_merchant_bribery',input({p_expected_gold:80,p_expected_exclusions:1}));expect(next.error).toBeNull();expect(await gold()).toBe(60)
  expect((await player.rpc('pay_merchant_bribery',input({p_expected_gold:60,p_expected_exclusions:2}))).error?.message).toContain('no longer require')
  expect((await admin.from('battle_bribes').select('id').eq('match_id',match)).data).toHaveLength(2)
 })
 it('serializes competing payments and leaves no extra debit on stale quotes',async()=>{
  const results=await Promise.all([player.rpc('pay_merchant_bribery',input()),player.rpc('pay_merchant_bribery',input())]);expect(results.filter(r=>!r.error)).toHaveLength(1);expect(await gold()).toBe(80)
 })
 it('rejects missing skill, insufficient funds and zero-member payments without debiting',async()=>{
  expect((await player.rpc('pay_merchant_bribery',input({p_non_heroes:0}))).error?.message).toContain('Confirm')
  expect((await player.rpc('pay_merchant_bribery',input({p_non_heroes:21}))).error?.message).toContain('Not enough gold')
  await admin.from('heroes').update({skills:[]}).eq('id',hero)
  expect((await player.rpc('pay_merchant_bribery',input())).error?.message).toContain('learned Bribery')
  expect(await gold()).toBe(100)
 })
 it('denies strangers and direct receipt edits',async()=>{
  const outsider=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});await outsider.auth.signInWithPassword({email:'gm@stirheim.test',password:'stirheim-dev'})
  expect((await outsider.rpc('pay_merchant_bribery',input())).error?.message).toContain('Only this warband')
  const result=await player.rpc('pay_merchant_bribery',input());expect(result.error).toBeNull()
  await player.from('battle_bribes').delete().eq('id',result.data.id)
  expect((await admin.from('battle_bribes').select('id').eq('id',result.data.id)).data).toHaveLength(1)
  await outsider.auth.signOut()
 })
})

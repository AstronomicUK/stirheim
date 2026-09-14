import {beforeAll,beforeEach,afterEach,describe,it,expect} from 'vitest'
import {createClient,type SupabaseClient} from '@supabase/supabase-js'
const check=<T>(r:{data:T;error:unknown}):T=>{if(r.error)throw r.error;return r.data}
const owner='22222222-2222-4222-8222-222222222222'
describe.skipIf(process.env.SUPABASE_LOCAL!=='1')('Facio purchase and notebook settlement',()=>{
 let admin:SupabaseClient,player:SupabaseClient,band:string,campaign:string,match:string,report:string
 beforeAll(async()=>{
  admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)
  player=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}})
  const login=await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'});if(login.error)throw login.error
 })
 beforeEach(async()=>{
  band=crypto.randomUUID();campaign=crypto.randomUUID();match=crypto.randomUUID();report=crypto.randomUUID()
  check(await admin.from('warbands').insert({id:band,owner_id:owner,name:'Disposable Facio crew',type_rules_id:'pirates',gold:100}))
  check(await admin.from('campaigns').insert({id:campaign,gm_id:owner,name:'Disposable Facio campaign'}))
  check(await admin.from('campaign_members').insert({campaign_id:campaign,warband_id:band,user_id:owner}))
  check(await admin.from('matches').insert({id:match,campaign_id:campaign,created_by:owner,state:'awaiting_reports',started_at:'2026-09-01T10:00:00Z'}))
  check(await admin.from('match_participants').insert({match_id:match,warband_id:band,accepted_at:'2026-09-01T09:00:00Z'}))
  check(await admin.from('match_reports').insert({id:report,match_id:match,warband_id:band,submitted_by:owner,result:'won',status:'applied',applied:{scenario_effects:{facio:true}}}))
 })
 afterEach(async()=>{
  check(await admin.from('facio_purchases').delete().eq('warband_id',band))
  check(await admin.from('campaigns').delete().eq('id',campaign))
  check(await admin.from('warbands').delete().eq('id',band))
 })
 const state=async()=>check(await player.rpc('facio_trade_state',{p_warband_id:band}))
 const gold=async()=>check(await admin.from('warbands').select('gold').eq('id',band).single())!.gold
 const changes=(cost=50,item='elf_bow')=>[{table:'warbands',op:'update',id:band,data:{gold:100-cost}},{table:'items',op:'insert',data:{holder_type:'stash',holder_id:null,item_rules_id:item,quantity:1}}]
 const buy=(id=crypto.randomUUID(),cost=50,item='elf_bow',batch:unknown=changes(cost,item))=>player.rpc('record_facio_purchase',{p_warband_id:band,p_report_id:report,p_request_id:id,p_changes:batch,p_cost:cost,p_expected_gold:100,p_item_id:item})
 const sell=(dice=[3,4])=>player.rpc('sell_facio_notebooks',{p_warband_id:band,p_report_id:report,p_dice:dice,p_reason:'App rolled 3; player entered 4.'})
 it('requires an affordable purchase before payout and preserves the receipt across reloads',async()=>{
  expect((await state()).available).toEqual([{reportId:report,matchId:match}])
  expect((await sell()).error?.message).toContain('Buy the item before')
  expect((await buy(undefined,110)).error?.message).toContain('Afford the item')
  expect(await gold()).toBe(100)
  const id=crypto.randomUUID();check(await buy(id));expect(await gold()).toBe(50)
  check(await buy(id));expect(await gold()).toBe(50)
  expect((await state()).available).toEqual([])
  expect((await state()).notebooks).toEqual([{reportId:report,itemId:'elf_bow',cost:50}])
  expect((await buy()).error).toBeTruthy()
  expect((await sell([7,1])).error?.message).toContain('two D6')
  check(await sell());expect(await gold()).toBe(120)
  check(await sell([6,6]));expect(await gold()).toBe(120)
  expect((await state()).notebooks).toEqual([])
 })
 it('rejects duplicate concurrent purchases and pays concurrent retries once',async()=>{
  const results=await Promise.all([buy(),buy()]);expect(results.filter(r=>!r.error)).toHaveLength(1)
  const paid=await Promise.all([sell(),sell()]);paid.forEach(check)
  expect(await gold()).toBe(120)
  expect(check(await admin.from('items').select('quantity').eq('warband_id',band))).toEqual([{quantity:1}])
 })
 it('rejects Pirate-only or found-only items, extra quantities and unrelated changes',async()=>{
  for(const item of ['treasure_map','swivel_gun','amethyst','training_manual']) expect((await buy(undefined,50,item)).error?.message).toContain('Price Chart')
  const two=changes();two[1].data.quantity=2
  expect((await buy(undefined,50,'elf_bow',two)).error?.message).toContain('exactly one')
  expect((await buy(undefined,50,'elf_bow',[...changes(),{table:'warbands',op:'update',id:band,data:{wyrdstone:99}}])).error?.message).toContain('deduct exactly')
  expect(await gold()).toBe(100)
 })
 it('buys into an existing stack and refuses a stale quantity',async()=>{
  const row=check(await admin.from('items').insert({warband_id:band,holder_type:'stash',item_rules_id:'elf_bow',quantity:2}).select('id').single())!
  const batch=[changes()[0],{table:'items',op:'update',id:row.id,data:{quantity:4}}]
  expect((await buy(undefined,50,'elf_bow',batch)).error?.message).toContain('stack changed')
  batch[1].data.quantity=3
  check(await buy(undefined,50,'elf_bow',batch))
  expect(check(await admin.from('items').select('quantity').eq('id',row.id).single())!.quantity).toBe(3)
 })
 it('retains Haggle and records its use without consuming a rare search',async()=>{
  const hero=check(await admin.from('heroes').insert({warband_id:band,name:'Haggling Captain',unit_type_rules_id:'pirates_captain',skills:['haggle'],stats:{M:4,WS:4,BS:3,S:3,T:3,W:1,I:4,A:1,Ld:8},status:'active'}).select('id').single())!
  check(await player.rpc('record_facio_purchase',{p_warband_id:band,p_report_id:report,p_request_id:crypto.randomUUID(),p_changes:changes(43),p_cost:43,p_expected_gold:100,p_item_id:'elf_bow',p_haggle:{heroId:hero.id,dice:[3,4],requestId:crypto.randomUUID(),itemName:'Elf Bow',priceBefore:50}}))
  expect(await gold()).toBe(57)
  const saved=check(await admin.from('heroes').select('flags').eq('id',hero.id).single())!
  expect(saved.flags.haggleUse.matchId).toBe(match)
  const phase=check(await admin.from('trade_phase_state').select('heroes_searched').eq('warband_id',band).eq('match_id',match).single())!
  expect(phase.heroes_searched).toEqual([])
 })
 it('expires unused purchases when the next battle starts',async()=>{
  const next=crypto.randomUUID()
  check(await admin.from('matches').insert({id:next,campaign_id:campaign,created_by:owner,state:'in_progress',started_at:'2026-09-02T10:00:00Z'}))
  check(await admin.from('match_participants').insert({match_id:next,warband_id:band,accepted_at:'2026-09-02T09:00:00Z'}))
  expect((await state()).available).toEqual([])
  expect((await buy()).error?.message).toContain('no longer available')
 })
 it('refuses withdrawn rewards and another player’s purchase',async()=>{
  const outsider=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}})
  expect((await outsider.rpc('record_facio_purchase',{p_warband_id:band,p_report_id:report,p_request_id:crypto.randomUUID(),p_changes:changes(),p_cost:50,p_expected_gold:100,p_item_id:'elf_bow'})).error).toBeTruthy()
  check(await admin.from('match_reports').update({status:'pending'}).eq('id',report))
  expect((await buy()).error?.message).toContain('no longer available')
 })
})

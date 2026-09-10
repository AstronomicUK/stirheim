import {createClient,type SupabaseClient} from '@supabase/supabase-js'
import {afterEach,beforeAll,beforeEach,describe,expect,it} from 'vitest'
const owner='22222222-2222-4222-8222-222222222222',gm='11111111-1111-4111-8111-111111111111'
describe.skipIf(process.env.SUPABASE_LOCAL!=='1')('Rawhide private declarations',()=>{
 let admin:SupabaseClient,player:SupabaseClient,opponent:SupabaseClient,campaign:string,match:string,warbands:string[]
 beforeAll(async()=>{
  admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)
  player=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}})
  opponent=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}})
  for(const r of [await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'}),await opponent.auth.signInWithPassword({email:'gm@stirheim.test',password:'stirheim-dev'})])if(r.error)throw r.error
 })
 beforeEach(async()=>{
  campaign=crypto.randomUUID();match=crypto.randomUUID();warbands=[crypto.randomUUID(),crypto.randomUUID()]
  for(const r of [await admin.from('campaigns').insert({id:campaign,name:'Disposable Rawhide QA',gm_id:gm}),await admin.from('warbands').insert(warbands.map((id,i)=>({id,owner_id:i?gm:owner,name:i?'Ambushers':'Merchants',type_rules_id:'mercenaries_marienburg',gold:100,wyrdstone:3}))),await admin.from('matches').insert({id:match,campaign_id:campaign,created_by:owner,state:'scheduled',scenario_rules_id:'rawhide'}),await admin.from('match_participants').insert(warbands.map(warband_id=>({match_id:match,warband_id,accepted_at:new Date().toISOString()})))])if(r.error)throw r.error
 })
 afterEach(async()=>{await admin.from('campaigns').delete().eq('id',campaign);await admin.from('warbands').delete().in('id',warbands)})
 const declare=(wagon:number|null=2)=>player.rpc('set_rawhide_cargo',{p_match_id:match,p_warband_id:warbands[0],p_wagon:wagon,p_sale_value:160,p_valuation_note:'100 gc coins + 60 gc agreed value for three shards',p_rounding:'down'})
 const start=()=>player.rpc('start_match',{p_match_id:match})
 it('keeps the choice private from an opposing GM until the battle ends',async()=>{
  expect((await declare()).error).toBeNull()
  const own=await player.rpc('get_rawhide_cargo',{p_match_id:match});expect(own.error).toBeNull();expect(own.data).toMatchObject({declared:true,revealed:true,wagon:2,gold:100,wyrdstone:3})
  const hidden=await opponent.rpc('get_rawhide_cargo',{p_match_id:match});expect(hidden.error).toBeNull();expect(hidden.data).toEqual({declared:true,warband_id:warbands[0],revealed:false,locked:false})
  expect((await opponent.from('rawhide_cargo').select('*')).error).not.toBeNull()
  expect((await start()).error).toBeNull()
  expect((await opponent.rpc('get_rawhide_cargo',{p_match_id:match})).data.revealed).toBe(false)
  await admin.from('matches').update({state:'awaiting_reports'}).eq('id',match)
  expect((await opponent.rpc('get_rawhide_cargo',{p_match_id:match})).data).toMatchObject({revealed:true,wagon:2,gold:100,wyrdstone:3})
 })
 it('requires a current declaration and freezes it without revealing the choice through the treasury',async()=>{
  expect((await start()).error?.message).toContain('privately declare')
  expect((await declare()).error).toBeNull()
  await admin.from('warbands').update({gold:101}).eq('id',warbands[0])
  expect((await start()).error?.message).toContain('treasury changed')
  await admin.from('warbands').update({gold:100}).eq('id',warbands[0])
  expect((await start()).error).toBeNull()
  expect((await admin.from('warbands').select('gold,wyrdstone').eq('id',warbands[0]).single()).data).toEqual({gold:100,wyrdstone:3})
  expect((await declare(null)).error?.message).toContain('before the battle starts')
  expect((await admin.from('warbands').update({gold:99}).eq('id',warbands[0])).error?.message).toContain('committed to Rawhide')
  expect((await admin.from('warbands').update({wyrdstone:2}).eq('id',warbands[0])).error?.message).toContain('committed to Rawhide')
  await admin.from('matches').update({state:'cancelled'}).eq('id',match)
  expect((await admin.from('warbands').update({gold:99,wyrdstone:2}).eq('id',warbands[0])).error).toBeNull()
 })
 it('permits explicit empty wagons, but does not let an opponent replace the declaration',async()=>{
  expect((await declare(null)).error).toBeNull()
  expect((await opponent.rpc('set_rawhide_cargo',{p_match_id:match,p_warband_id:warbands[1],p_wagon:1,p_sale_value:160,p_valuation_note:'Other cargo',p_rounding:'up'})).error?.message).toContain('Another player')
  expect((await start()).error).toBeNull()
  expect((await admin.from('warbands').update({gold:50,wyrdstone:1}).eq('id',warbands[0])).error).toBeNull()
 })
 it('leaves ordinary battles without a chosen scenario unaffected',async()=>{
  await admin.from('matches').update({scenario_rules_id:null}).eq('id',match)
  expect((await declare()).error?.message).toContain('Rawhide cargo')
  expect((await start()).error).toBeNull()
 })
 const end=async()=>{expect((await start()).error).toBeNull();expect((await admin.from('matches').update({state:'awaiting_reports'}).eq('id',match)).error).toBeNull()}
 const settle=(outcome:string,i=0,goldDelta=0)=>(i?opponent:player).rpc('submit_battle_report',{p_match_id:match,p_warband_id:warbands[i],p_report:{won:true,result:'won',routed:false,applied:{warband:{gold_delta:goldDelta,wyrdstone_delta:0},rawhide_settlement:{outcome}}}})
 const balances=async()=>Promise.all(warbands.map(async id=>(await admin.from('warbands').select('gold,wyrdstone').eq('id',id).single()).data))
 it('sells the actual declared cargo for 130 percent, and restores it on withdrawal',async()=>{
  expect((await declare()).error).toBeNull();await end()
  expect((await settle('escaped')).error).toBeNull()
  expect(await balances()).toEqual([{gold:208,wyrdstone:0},{gold:100,wyrdstone:3}])
  expect((await opponent.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:warbands[0]})).error).toBeNull()
  expect(await balances()).toEqual([{gold:100,wyrdstone:3},{gold:100,wyrdstone:3}])
  expect((await admin.from('warbands').update({gold:99}).eq('id',warbands[0])).error?.message).toContain('committed to Rawhide')
 })
 it('transfers captured cargo once, rejects a second claim and prevents withdrawal after spending',async()=>{
  expect((await declare()).error).toBeNull();await end()
  expect((await settle('captured',1)).error).toBeNull()
  expect(await balances()).toEqual([{gold:0,wyrdstone:0},{gold:200,wyrdstone:6}])
  expect((await settle('escaped')).error?.message).toContain('already been settled')
  await admin.from('warbands').update({gold:199}).eq('id',warbands[1])
  expect((await opponent.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:warbands[1]})).error?.message).toContain('treasury changed')
  await admin.from('warbands').update({gold:200}).eq('id',warbands[1])
  expect((await opponent.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:warbands[1]})).error).toBeNull()
  expect(await balances()).toEqual([{gold:100,wyrdstone:3},{gold:100,wyrdstone:3}])
 })
 it('rejects the wrong recipient and a false empty claim',async()=>{
  expect((await declare()).error).toBeNull();await end()
  expect((await settle('escaped',1)).error?.message).toContain('merchant settles')
  expect((await settle('captured')).error?.message).toContain('merchant settles')
  expect((await settle('empty')).error?.message).toContain('pre-battle cargo')
  expect(await balances()).toEqual([{gold:100,wyrdstone:3},{gold:100,wyrdstone:3}])
 })
 it('settles explicitly empty wagons without awarding money or equipment',async()=>{
  expect((await declare(null)).error).toBeNull();await end()
  expect((await settle('empty')).error).toBeNull()
  expect(await balances()).toEqual([{gold:100,wyrdstone:3},{gold:100,wyrdstone:3}])
 })

 it('can reverse cargo proceeds spent within the same report',async()=>{
  expect((await declare()).error).toBeNull();await end()
  expect((await settle('captured',1,-150)).error).toBeNull()
  expect(await balances()).toEqual([{gold:0,wyrdstone:0},{gold:50,wyrdstone:6}])
  expect((await opponent.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:warbands[1]})).error).toBeNull()
  expect(await balances()).toEqual([{gold:100,wyrdstone:3},{gold:100,wyrdstone:3}])
 })

})

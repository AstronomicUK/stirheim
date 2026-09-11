import {createClient,type SupabaseClient} from '@supabase/supabase-js'
import {afterEach,beforeAll,beforeEach,describe,expect,it} from 'vitest'
const uid='22222222-2222-4222-8222-222222222222'
describe.skipIf(process.env.SUPABASE_LOCAL!=='1')('shared Staff of Light allowance',()=>{
 let admin:SupabaseClient,player:SupabaseClient,campaign:string,match:string,bands:string[],hero:string,item:string
 beforeAll(async()=>{admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);player=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});const r=await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'});if(r.error)throw r.error})
 beforeEach(async()=>{
  campaign=crypto.randomUUID();match=crypto.randomUUID();bands=[crypto.randomUUID(),crypto.randomUUID()];hero=crypto.randomUUID();item=crypto.randomUUID()
  for(const r of [await admin.from('campaigns').insert({id:campaign,name:'Disposable dispel QA',gm_id:uid}),await admin.from('warbands').insert(bands.map(id=>({id,name:'Dispel QA',owner_id:uid,type_rules_id:'mercenaries_reikland'}))),await admin.from('heroes').insert({id:hero,warband_id:bands[1],name:'Truthsayer',is_hired_sword:true,hired_sword_rules_id:'truthsayer',stats:{M:4,WS:4,BS:3,S:4,T:4,W:2,I:4,A:2,Ld:9}}),await admin.from('items').insert({id:item,warband_id:bands[1],holder_type:'hero',holder_id:hero,item_rules_id:'halberd',notes:'Staff of Light: also dispels one enemy spell per turn on 4+.',quantity:1}),await admin.from('matches').insert({id:match,campaign_id:campaign,created_by:uid,state:'in_progress',combat_mode:'app'}),await admin.from('match_participants').insert(bands.map(warband_id=>({match_id:match,warband_id,accepted_at:new Date().toISOString()}))),await admin.from('battle_turns').insert({match_id:match,turn_order:bands})])if(r.error)throw r.error
 })
 afterEach(async()=>{await admin.from('campaigns').delete().eq('id',campaign);await admin.from('warbands').delete().in('id',bands)})
 const input=(over:Record<string,unknown>={})=>({p_id:crypto.randomUUID(),p_match_id:match,p_caster_warband_id:bands[0],p_source_hero_id:hero,p_round:1,p_active_warband_id:bands[0],p_spell_name:'Vision of Torment',p_roll:2,p_manual:true,...over})
 const attempt=(args=input())=>player.rpc('record_staff_dispel',args)
 it('spends failed attempts, retries exactly, and resets in the next shared round',async()=>{
  const args=input();const first=await attempt(args);expect(first.error).toBeNull();expect(first.data.roll).toBe(2)
  expect((await attempt(args)).data.id).toBe(args.p_id)
  expect((await attempt()).error?.message).toContain('already attempted')
  expect((await attempt({...args,p_roll:6})).error?.message).toContain('different details')
  await admin.from('battle_turns').update({round:2}).eq('match_id',match)
  expect((await attempt(args)).data.id).toBe(args.p_id)
  expect((await attempt(input({p_round:2,p_roll:4}))).error).toBeNull()
  const saved=await player.from('battle_dispels').select('*').eq('match_id',match);expect(saved.data).toHaveLength(2)
 })
 it('serializes simultaneous attempts from different screens',async()=>{
  const both=await Promise.all([attempt(),attempt()]);expect(both.filter(r=>!r.error)).toHaveLength(1);expect(both.find(r=>r.error)?.error?.message).toContain('already attempted')
 })
 it('rejects an unrelated account and direct client writes to the ledger',async()=>{
  const outsider=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}})
  expect((await outsider.auth.signInWithPassword({email:'gm@stirheim.test',password:'stirheim-dev'})).error).toBeNull()
  expect((await outsider.rpc('record_staff_dispel',input())).error?.message).toContain('Only the casting player')
  const valid=await attempt();expect(valid.error).toBeNull()
  await player.from('battle_dispels').update({roll:6}).eq('id',valid.data.id)
  expect((await admin.from('battle_dispels').select('roll').eq('id',valid.data.id).single()).data?.roll).toBe(2)
  await outsider.auth.signOut()
 })
 it('rejects stale turns, absent equipment, dead bearers and invalid dice',async()=>{
  expect((await attempt(input({p_round:2}))).error?.message).toContain('turn changed')
  expect((await attempt(input({p_roll:7}))).error?.message).toContain('D6')
  expect((await admin.from('items').delete().eq('id',item)).error).toBeNull()
  expect((await attempt()).error?.message).toContain('no longer carries')
  expect((await admin.from('items').insert({id:item,warband_id:bands[1],holder_type:'hero',holder_id:hero,item_rules_id:'staff_of_light',quantity:1})).error).toBeNull()
  expect((await admin.from('heroes').update({status:'dead'}).eq('id',hero)).error).toBeNull()
  expect((await attempt()).error?.message).toContain('active opposing')
 })
})

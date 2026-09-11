import {createClient,type SupabaseClient} from '@supabase/supabase-js'
import {afterEach,beforeAll,beforeEach,describe,expect,it} from 'vitest'
const uid='22222222-2222-4222-8222-222222222222', otherId='11111111-1111-4111-8111-111111111111'
describe.skipIf(process.env.SUPABASE_LOCAL!=='1')('personal GM checklist',()=>{
 let admin:SupabaseClient,player:SupabaseClient,other:SupabaseClient,campaign:string
 const check=(r:{error:unknown})=>{if(r.error)throw r.error}
 beforeAll(async()=>{
  const options={auth:{persistSession:false}}
  admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,options)
  player=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,options)
  other=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,options)
  check(await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'}));check(await other.auth.signInWithPassword({email:'gm@stirheim.test',password:'stirheim-dev'}))
 })
 beforeEach(async()=>{campaign=crypto.randomUUID();check(await admin.from('campaigns').insert({id:campaign,name:'Disposable checklist QA',gm_id:uid}))})
 afterEach(async()=>{check(await admin.from('campaigns').delete().eq('id',campaign))})
 const save=(status:string,completed_steps:string[]=[])=>player.from('gm_checklists').upsert({campaign_id:campaign,user_id:uid,status,completed_steps})
 it('persists completion, dismissal and reopening without losing checked steps',async()=>{
  for(const status of ['open','hidden','complete','open']){
   check(await save(status,['invite','house_rules']))
   const r=await player.from('gm_checklists').select('status,completed_steps').eq('campaign_id',campaign).single();check(r)
   expect(r.data).toEqual({status,completed_steps:['invite','house_rules']})
  }
 })
 it('refuses another user and gives a replacement GM independent state',async()=>{
  check(await save('complete',['invite']))
  const hidden=await other.from('gm_checklists').select('*').eq('campaign_id',campaign);check(hidden);expect(hidden.data).toEqual([])
  expect((await other.from('gm_checklists').upsert({campaign_id:campaign,user_id:uid,status:'hidden'})).error).not.toBeNull()
  expect((await player.from('gm_checklists').upsert({campaign_id:campaign,user_id:otherId,status:'hidden'})).error).not.toBeNull()
  check(await admin.from('campaigns').update({gm_id:otherId}).eq('id',campaign))
  check(await other.from('gm_checklists').insert({campaign_id:campaign,user_id:otherId,status:'open'}))
  const own=await other.from('gm_checklists').select('status').eq('campaign_id',campaign);check(own);expect(own.data).toEqual([{status:'open'}])
  expect((await save('hidden')).error).not.toBeNull()
 })
 it('rejects unknown steps or states',async()=>{
  expect((await save('invented')).error).not.toBeNull()
  expect((await save('open',['unknown'])).error).not.toBeNull()
 })
})

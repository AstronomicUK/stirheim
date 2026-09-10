import {createClient,type SupabaseClient} from '@supabase/supabase-js'
import {afterEach,beforeAll,beforeEach,describe,expect,it} from 'vitest'
const uid='22222222-2222-4222-8222-222222222222'
describe.skipIf(process.env.SUPABASE_LOCAL!=='1')('Balewolf aftermath persistence',()=>{
 let admin:SupabaseClient,player:SupabaseClient,campaign:string,warband:string,match:string,hero:string,sword:string,armour:string,snapshots:{item_id:string;expected:Record<string,unknown>}[]
 const stats={M:3,WS:4,BS:3,S:3,T:3,W:1,I:4,A:1,Ld:8}
 const injury={injuryCode:'leg_wound',name:'Leg Wound',rolled:{d66:22},effect:'-1 M'}
 beforeAll(async()=>{admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);player=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});const r=await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'});if(r.error)throw r.error})
 beforeEach(async()=>{
  campaign=crypto.randomUUID();warband=crypto.randomUUID();match=crypto.randomUUID();hero=crypto.randomUUID();sword=crypto.randomUUID();armour=crypto.randomUUID()
  for(const r of [await admin.from('campaigns').insert({id:campaign,name:'Disposable Balewolf QA',gm_id:uid}),await admin.from('warbands').insert({id:warband,name:'Patients',owner_id:uid,type_rules_id:'mercenaries_reikland',gold:100}),await admin.from('heroes').insert({id:hero,warband_id:warband,name:'Otto',unit_type_rules_id:'mercenaries_reikland_champions',stats,xp:51,injuries:[injury],flags:{causesFear:true},skills:[],spells:[]}),await admin.from('items').insert([{id:sword,warband_id:warband,holder_type:'hero',holder_id:hero,item_rules_id:'sword',quantity:1},{id:armour,warband_id:warband,holder_type:'hero',holder_id:hero,item_rules_id:'light_armour',quantity:1}]),await admin.from('matches').insert({id:match,campaign_id:campaign,created_by:uid,state:'awaiting_reports'}),await admin.from('match_participants').insert({match_id:match,warband_id:warband,accepted_at:new Date().toISOString()})])if(r.error)throw r.error
  const items=await admin.from('items').select('*').eq('warband_id',warband);if(items.error)throw items.error
  snapshots=items.data.map(row=>{const expected={...row};delete expected.created_at;delete expected.updated_at;return {item_id:row.id,expected}})
 })
 afterEach(async()=>{await admin.from('campaigns').delete().eq('id',campaign);await admin.from('warbands').delete().eq('id',warband)})
 const file=(applied:Record<string,unknown>)=>player.rpc('submit_battle_report',{p_match_id:match,p_warband_id:warband,p_report:{won:false,result:'lost',routed:false,applied:{warband:{gold_delta:0,wyrdstone_delta:0},...applied}}})
 const withdraw=()=>player.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:warband})
 it('persists a reviewed cure and restores original injuries and characteristics on withdrawal',async()=>{
  expect((await file({heroes:[{id:hero,patch:{stats:{...stats,M:4},injuries:[],flags:{causesFear:true,lycanthrope:{contractedAfter:match}}}}]})).error).toBeNull()
  expect((await admin.from('heroes').select('stats,injuries,flags').eq('id',hero).single()).data).toMatchObject({stats:{M:4},injuries:[],flags:{causesFear:true,lycanthrope:{contractedAfter:match}}})
  expect((await withdraw()).error).toBeNull()
  expect((await admin.from('heroes').select('stats,injuries,flags').eq('id',hero).single()).data).toEqual({stats,injuries:[injury],flags:{causesFear:true}})
 })
 it('moves an original recovered sword to stash while retiring its owner, then safely reverses it',async()=>{
  expect((await file({heroes:[{id:hero,patch:{status:'retired'}}],lycanthrope_equipment:snapshots,remove_item_ids:[sword,armour],awarded_items:[{holder_type:'stash',holder_id:null,item_rules_id:'sword',custom_name:null,quantity:1,notes:''}]})).error).toBeNull()
  const remaining=await admin.from('items').select('item_rules_id,holder_type,quantity').eq('warband_id',warband)
  expect(remaining.data).toEqual([{item_rules_id:'sword',holder_type:'stash',quantity:1}])
  expect((await withdraw()).error).toBeNull()
  expect((await admin.from('items').select('id').eq('warband_id',warband)).data?.map(i=>i.id).sort()).toEqual([sword,armour].sort())
  expect((await admin.from('heroes').select('status').eq('id',hero).single()).data?.status).toBe('active')
 })
 it('rejects equipment changed after review rather than applying a stale loss',async()=>{
  await admin.from('items').update({quantity:2}).eq('id',sword)
  expect((await file({lycanthrope_equipment:snapshots,item_patches:[{id:sword,quantity:0}]})).error?.message).toContain('equipment changed')
  expect((await admin.from('items').select('quantity').eq('id',sword).single()).data?.quantity).toBe(2)
 })
})

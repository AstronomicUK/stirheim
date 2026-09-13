import {beforeAll,afterAll,beforeEach,afterEach,describe,it,expect} from 'vitest'
import {createClient,type SupabaseClient} from '@supabase/supabase-js'
const enabled=process.env.SUPABASE_LOCAL==='1'
const stats={M:4,WS:4,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:8}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const check=(r:{data:unknown;error:{message:string}|null}):any=>{if(r.error)throw Error(r.error.message);return r.data}
describe.skipIf(!enabled)('Slaaneshi per-model holds',()=>{
 let admin:SupabaseClient,captor:SupabaseClient,victim:SupabaseClient,outsider:SupabaseClient
 const users:string[]=[];let campaign:string,match:string,cw:string,vw:string,wielder:string,target:string
 beforeAll(async()=>{
  admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const clients:SupabaseClient[]=[]
  for(let i=0;i<3;i++){
   const email=`holds-${crypto.randomUUID()}@stirheim.test`,password=crypto.randomUUID()
   const {user}=check(await admin.auth.admin.createUser({email,password,email_confirm:true}));users.push(user.id)
   const client=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});check(await client.auth.signInWithPassword({email,password}));clients.push(client)
  }
  ;[captor,victim,outsider]=clients
 })
 beforeEach(async()=>{
  const bands=check(await admin.from('warbands').insert([{owner_id:users[0],name:'Whipmaster QA',type_rules_id:'court_of_the_profane_pleasures',gold:100},{owner_id:users[1],name:'Victim QA',type_rules_id:'mercenaries_reikland',gold:100}]).select('id')) as {id:string}[];[cw,vw]=bands.map(w=>w.id)
  campaign=check(await admin.from('campaigns').insert({gm_id:users[0],name:'Disposable holds'}).select('id').single()).id
  check(await admin.from('campaign_members').insert([{campaign_id:campaign,warband_id:cw,user_id:users[0]},{campaign_id:campaign,warband_id:vw,user_id:users[1]}]))
  match=check(await admin.from('matches').insert({campaign_id:campaign,created_by:users[0],state:'in_progress'}).select('id').single()).id
  check(await admin.from('match_participants').insert([cw,vw].map(warband_id=>({match_id:match,warband_id,accepted_at:new Date().toISOString()}))))
  wielder=check(await admin.from('heroes').insert({warband_id:cw,name:'Whipmaster',unit_type_rules_id:'court_of_pleasures_whipmaster',status:'active',stats,xp:20}).select('id').single()).id
  target=check(await admin.from('henchman_groups').insert({warband_id:vw,name:'Three warriors',unit_type_rules_id:'mercenaries_reikland_warriors',size:3,stats,xp:0}).select('id').single()).id
  check(await admin.from('items').insert({warband_id:cw,holder_type:'hero',holder_id:wielder,item_rules_id:'slaaneshi_man_catcher',quantity:1}))
 })
 afterEach(async()=>{
  if(match){await admin.from('slaaneshi_holds').delete().eq('match_id',match);await admin.from('matches').delete().eq('id',match)}
  if(campaign)await admin.from('campaigns').delete().eq('id',campaign)
  if(cw)await admin.from('warbands').delete().in('id',[cw,vw])
 })
 afterAll(async()=>{for(const id of users)await admin.auth.admin.deleteUser(id)})
 const attack=(extra:Record<string,unknown>={})=>captor.from('battle_events').insert({match_id:match,actor_id:users[0],actor_warband_id:cw,kind:'attack',summary:'Unsaved wound: held',payload:{attacker_warband_id:cw,attacker_id:wielder,attacker_kind:'hero',attacker_name:'Whipmaster',target_warband_id:vw,target_id:target,target_kind:'group',target_name:'Warriors',target_size:3,wounds_lost:1,out_of_action:false,kill:false,outcome:'Knocked down',slaaneshi_lock:{weaponId:'slaaneshi_man_catcher',modelIndex:1},...extra}}).select('id').single()
 const holds=async(client=victim)=>check(await client.from('slaaneshi_holds').select('*').eq('match_id',match))
 it('shares exactly one held group member, prevents duplicates, and records a victim-confirmed release',async()=>{
  check(await attack());const [held]=await holds()
  expect(held).toMatchObject({target_model_index:1,target_id:target,released_at:null,confirmed_end_at:null})
  expect(await holds(outsider)).toEqual([])
  expect((await attack({slaaneshi_lock:{weaponId:'slaaneshi_man_catcher',modelIndex:0}})).error).not.toBeNull()
  expect((await outsider.rpc('slaaneshi_hold_action',{p_hold_id:held.id,p_action:'magicEscape'})).error).not.toBeNull()
  check(await victim.rpc('slaaneshi_hold_action',{p_hold_id:held.id,p_action:'magicEscape',p_reason:'Escape spell resolved at the table'}))
  expect((await holds())[0]).toMatchObject({release_reason:'magicEscape',confirmed_end_at:null})
  expect((await holds())[0].history.at(-1).note).toContain('Escape spell')
  expect(check(await admin.from('henchman_groups').select('size').eq('id',target).single()).size).toBe(3)
 })
 it('rejects Large targets, invalid model slots, no wound and false kill outcomes',async()=>{
  check(await admin.from('henchman_groups').update({is_large:true}).eq('id',target))
  expect((await attack()).error?.message).toMatch(/Large/)
  check(await admin.from('henchman_groups').update({is_large:false}).eq('id',target))
  expect((await attack({slaaneshi_lock:{weaponId:'slaaneshi_man_catcher',modelIndex:3}})).error?.message).toMatch(/model still/)
  expect((await attack({wounds_lost:0})).error?.message).toMatch(/unsaved wound/)
  expect((await attack({kill:true})).error?.message).toMatch(/out-of-action kill/)
  expect(await holds()).toEqual([])
 })
 it('source correction ends an active hold but never revives a separately released hold',async()=>{
  const event=check(await attack());const [held]=await holds()
  check(await admin.from('battle_events').update({reverted_at:new Date().toISOString()}).eq('id',event.id))
  expect((await holds())[0].release_reason).toBe('sourceReverted')
  check(await admin.from('battle_events').update({reverted_at:null}).eq('id',event.id))
  expect((await holds())[0].released_at).toBeNull()
  check(await victim.rpc('slaaneshi_hold_action',{p_hold_id:held.id,p_action:'meleeEnded'}))
  check(await admin.from('battle_events').update({reverted_at:new Date().toISOString()}).eq('id',event.id))
  check(await admin.from('battle_events').update({reverted_at:null}).eq('id',event.id))
  expect((await holds())[0].release_reason).toBe('meleeEnded')
 })
 it('continues one hold across repeated hits and preserves all supporting corrections',async()=>{
  const first=check(await attack()),second=check(await attack())
  expect(await holds()).toHaveLength(1);expect((await holds())[0].source_event_id).toBe(second.id)
  check(await admin.from('battle_events').update({reverted_at:new Date().toISOString()}).eq('id',second.id))
  expect((await holds())[0]).toMatchObject({source_event_id:first.id,released_at:null})
  check(await admin.from('battle_events').update({reverted_at:new Date().toISOString()}).eq('id',first.id))
  expect((await holds())[0].release_reason).toBe('sourceReverted')
  check(await admin.from('battle_events').update({reverted_at:null}).eq('id',second.id))
  expect((await holds())[0]).toMatchObject({source_event_id:second.id,released_at:null})
  check(await victim.rpc('slaaneshi_hold_action',{p_hold_id:(await holds())[0].id,p_action:'magicEscape'}))
  check(await admin.from('battle_events').update({reverted_at:null}).eq('id',first.id))
  expect((await holds())[0].release_reason).toBe('magicEscape')
 })
 it('only releases the exact held casualty and follows correction of that casualty',async()=>{
  check(await attack())
  check(await attack({slaaneshi_lock:undefined,out_of_action:true,outcome:'Out of action',target_model_index:0}))
  expect((await holds())[0].released_at).toBeNull()
  const casualty=check(await attack({slaaneshi_lock:undefined,out_of_action:true,outcome:'Out of action',target_model_index:1}))
  expect((await holds())[0].release_reason).toBe('targetOutOfAction')
  check(await admin.from('battle_events').update({reverted_at:new Date().toISOString()}).eq('id',casualty.id))
  expect((await holds())[0].released_at).toBeNull()
  check(await admin.from('battle_events').update({reverted_at:null}).eq('id',casualty.id))
  expect((await holds())[0].release_reason).toBe('targetOutOfAction')
  check(await admin.from('battle_events').update({reverted_at:new Date().toISOString()}).eq('id',casualty.id))
  check(await victim.rpc('slaaneshi_hold_action',{p_hold_id:(await holds())[0].id,p_action:'magicEscape'}))
  check(await admin.from('battle_events').update({reverted_at:null}).eq('id',casualty.id))
  check(await admin.from('battle_events').update({reverted_at:new Date().toISOString()}).eq('id',casualty.id))
  expect((await holds())[0].release_reason).toBe('magicEscape')
 })
 it('requires an end confirmation and invalidates it when more fighting occurs',async()=>{
  check(await attack());const [held]=await holds()
  expect((await captor.rpc('end_match',{p_match_id:match})).error?.message).toMatch(/Confirm which Man-Catcher holds/)
  check(await victim.rpc('slaaneshi_hold_action',{p_hold_id:held.id,p_action:'confirmEnd'}))
  expect((await holds())[0].confirmed_end_at).not.toBeNull()
  check(await attack({slaaneshi_lock:undefined,wounds_lost:0,outcome:'Missed'}))
  expect((await holds())[0].confirmed_end_at).toBeNull()
  check(await victim.rpc('slaaneshi_hold_action',{p_hold_id:held.id,p_action:'confirmEnd'}))
  check(await captor.rpc('end_match',{p_match_id:match}))
  expect((await victim.rpc('slaaneshi_hold_action',{p_hold_id:held.id,p_action:'magicEscape'})).error?.message).toMatch(/dependent report/)
 })

 it('captures the exact held equipment companion without an OOA',async()=>{
  const hero=check(await admin.from('heroes').insert({warband_id:vw,name:'Dog handler',unit_type_rules_id:'mercenaries_reikland_captain',status:'active',stats,xp:20}).select('id').single())
  const item=check(await admin.from('items').insert({warband_id:vw,holder_type:'hero',holder_id:hero.id,item_rules_id:'wardogs',quantity:2,notes:'Trained pair'}).select('id').single())
  const animalId=`animal:${hero.id}:wardogs:2`
  const event=check(await attack({target_id:animalId,target_kind:'hero',target_name:'Wardog',slaaneshi_lock:{weaponId:'slaaneshi_man_catcher',modelIndex:0}}))
  const [held]=await holds();expect(held.target_id).toBe(animalId)
  check(await victim.rpc('slaaneshi_hold_action',{p_hold_id:held.id,p_action:'confirmEnd'}))
  check(await captor.rpc('end_match',{p_match_id:match}))
  check(await captor.rpc('submit_battle_report',{p_match_id:match,p_warband_id:cw,p_report:{result:'won',applied:{}}}))
  check(await victim.rpc('submit_battle_report',{p_match_id:match,p_warband_id:vw,p_report:{result:'lost',ooa:[],applied:{item_patches:[{id:item.id,quantity:1}],captured_companions:[{sourceItemId:item.id,holderId:hero.id,itemId:'wardogs',animalId,eventId:event.id,captorWarbandId:cw,reason:'slaaneshi_lock'}]}}}))
  const cases=check(await victim.from('captive_cases').select('*').eq('match_id',match))
  expect(cases).toHaveLength(1);expect(cases[0]).toMatchObject({subject_kind:'companion',model_snapshot:{reason:'slaaneshi_lock',animal_id:animalId,item:{notes:'Trained pair'}}})
  expect(check(await admin.from('items').select('quantity').eq('id',item.id).single()).quantity).toBe(1)
 })
 it('assigns a held Hero to the actual Whipmaster without inventing an OOA',async()=>{
  const hero=check(await admin.from('heroes').insert({warband_id:vw,name:'Held Captain',unit_type_rules_id:'mercenaries_reikland_captain',status:'active',stats,xp:20}).select('id').single())
  check(await attack({target_id:hero.id,target_kind:'hero',target_name:'Held Captain',slaaneshi_lock:{weaponId:'slaaneshi_man_catcher',modelIndex:0}}))
  const [held]=await holds();check(await victim.rpc('slaaneshi_hold_action',{p_hold_id:held.id,p_action:'confirmEnd'}))
  check(await captor.rpc('end_match',{p_match_id:match}))
  check(await captor.rpc('submit_battle_report',{p_match_id:match,p_warband_id:cw,p_report:{result:'won',applied:{}}}))
  check(await victim.rpc('submit_battle_report',{p_match_id:match,p_warband_id:vw,p_report:{result:'lost',ooa:[],injuries:[{subjectType:'hero',subjectId:hero.id,subjectName:'Held Captain',rolls:[],outcome:'captured',effect:'Held at battle end by the Slaaneshi Man-Catcher.'}],applied:{heroes:[{id:hero.id,patch:{status:'captured'}}]}}}))
  const cases=check(await victim.from('captive_cases').select('*').eq('match_id',match))
  expect(cases).toHaveLength(1);expect(cases[0]).toMatchObject({hero_id:hero.id,captor_warband_id:cw})
  expect(check(await admin.from('heroes').select('xp').eq('id',wielder).single()).xp).toBe(20)
 })
 it('creates a captive for a confirmed held henchman without an OOA kill and retains exact kit',async()=>{
  const kit=check(await admin.from('items').insert({warband_id:vw,holder_type:'group',holder_id:target,item_rules_id:'sword',quantity:3,notes:'Engraved pommel'}).select('id').single())
  const event=check(await attack());const [held]=await holds()
  check(await victim.rpc('slaaneshi_hold_action',{p_hold_id:held.id,p_action:'confirmEnd'}))
  check(await captor.rpc('end_match',{p_match_id:match}))
  const file=(heldModelIndex:number)=>victim.rpc('submit_battle_report',{p_match_id:match,p_warband_id:vw,p_report:{result:'lost',ooa:[],injuries:[{subjectType:'group',subjectId:target,subjectName:'Warriors',rolls:[],dead:0,captured:[{modelIndex:1,heldModelIndex,eventId:event.id,captorWarbandId:cw,reason:'slaaneshi_lock',kit:[{sourceItemId:kit.id,itemId:'sword',quantity:1,notes:'Engraved pommel'}]}],equipmentLost:[{sourceItemId:kit.id,quantity:1}]}],applied:{groups:[{id:target,patch:{size:2}}],item_patches:[{id:kit.id,quantity:2}]}}})
  check(await captor.rpc('submit_battle_report',{p_match_id:match,p_warband_id:cw,p_report:{result:'won',applied:{}}}))
  expect((await file(3)).error?.message).toMatch(/unreverted capture event/)
  check(await file(2))
  const cases=check(await victim.from('captive_cases').select('*').eq('match_id',match))
  expect(cases).toHaveLength(1);expect(cases[0].hero_name).toContain('model 2')
  expect(cases[0].model_snapshot).toMatchObject({reason:'slaaneshi_lock',held_model_index:2,event_id:event.id,items:[{quantity:1,notes:'Engraved pommel'}]})
  expect(check(await admin.from('battle_events').select('payload').eq('id',event.id).single()).payload).toMatchObject({out_of_action:false,kill:false})
  expect((await admin.from('battle_events').update({reverted_at:new Date().toISOString()}).eq('id',event.id)).error?.message).toMatch(/dependent report/)
  expect(check(await admin.from('heroes').select('xp').eq('id',wielder).single()).xp).toBe(20)
 })

})

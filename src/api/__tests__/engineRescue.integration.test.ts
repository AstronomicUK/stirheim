import {beforeAll,afterAll,beforeEach,afterEach,describe,it,expect} from 'vitest'
import {createClient,type SupabaseClient} from '@supabase/supabase-js'
const enabled=process.env.SUPABASE_LOCAL==='1'
const stats={M:4,WS:4,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:8}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const check=(r:{data:unknown;error:{message:string}|null}):any=>{if(r.error)throw Error(r.error.message);return r.data}
describe.skipIf(!enabled)('Engine rescue battle facts',()=>{
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
  const bands=check(await admin.from('warbands').insert([{owner_id:users[0],name:'Whipmaster QA',type_rules_id:'black_dwarfs',gold:100},{owner_id:users[1],name:'Victim QA',type_rules_id:'mercenaries_reikland',gold:100}]).select('id')) as {id:string}[];[cw,vw]=bands.map(w=>w.id)
  campaign=check(await admin.from('campaigns').insert({gm_id:users[0],name:'Disposable holds'}).select('id').single()).id
  check(await admin.from('campaign_members').insert([{campaign_id:campaign,warband_id:cw,user_id:users[0]},{campaign_id:campaign,warband_id:vw,user_id:users[1]}]))
  match=check(await admin.from('matches').insert({campaign_id:campaign,created_by:users[0],state:'in_progress'}).select('id').single()).id
  check(await admin.from('match_participants').insert([cw,vw].map(warband_id=>({match_id:match,warband_id,accepted_at:new Date().toISOString()}))))
  wielder=check(await admin.from('heroes').insert({warband_id:cw,name:'Whipmaster',unit_type_rules_id:'black_dwarfs_gaolers',status:'active',stats,xp:20}).select('id').single()).id
  target=check(await admin.from('henchman_groups').insert({warband_id:vw,name:'Three warriors',unit_type_rules_id:'mercenaries_reikland_warriors',size:3,stats,xp:0}).select('id').single()).id
  check(await admin.from('items').insert({warband_id:cw,holder_type:'stash',item_rules_id:'engine_of_chaos',quantity:2}))
 })
 afterEach(async()=>{
  if(match){check(await admin.from('engine_prisoners').delete().in('holder_warband_id',[cw,vw]));check(await admin.from('matches').delete().eq('id',match))}
  if(campaign)check(await admin.from('campaigns').delete().eq('id',campaign))
  if(cw)check(await admin.from('warbands').delete().in('id',[cw,vw]))
 })
 afterAll(async()=>{for(const id of users)check(await admin.auth.admin.deleteUser(id))})
 const engines=async()=>check(await admin.from('engine_of_chaos_units').select('*').eq('warband_id',cw).order('stock_index'))
 const start=(engineId:string,client=victim)=>client.rpc('start_engine_rescue',{p_match_id:match,p_engine_id:engineId})
 const act=(r:{id:string;revision:number},action:unknown,client=victim)=>client.rpc('record_engine_rescue_action',{p_rescue_id:r.id,p_revision:r.revision,p_action:action,p_note:'Confirmed at the tabletop by the players.'})
 it('shares canonical keys between Engines, rejects outsiders and preserves physical group identity',async()=>{
  const [first,second]=await engines()
  expect((await start(first.id,outsider)).error?.code).toBe('42501')
  let r=check(await start(first.id));const other=check(await start(second.id))
  const by={id:target+':1',warbandId:cw,name:'Spoofed'}
  r=check(await act(r,{type:'gaolerOut',gaolerId:wielder,by}))
  expect(r.state.keys[0].keeper).toEqual({id:target+':1',warbandId:vw,name:'Three warriors · model 2'})
  const shared=check(await victim.from('engine_rescue_battles').select('*').eq('id',other.id).single())
  expect(shared.state.keys).toEqual(r.state.keys)
  expect((await act(other,{type:'holderRouted'},captor)).error?.message).toMatch(/changed on another device/)
  expect((await act(r,{type:'destroyed'},victim)).error?.code).toBe('42501')
  expect((await outsider.from('engine_rescue_battles').select('*').eq('match_id',match)).data).toEqual([])
  r=check(await act(r,{type:'keeperOut',keeperId:target+':1',by:null}))
  expect(r.state.keys[0].keeper).toBeNull()
  expect((await act(r,{type:'free',keeperId:target+':1',baseContactConfirmed:true})).error?.message).toMatch(/carrying the keys/)
 })
 it('identifies unknown keys and corrects shared facts in order with history retained',async()=>{
  const [engine,second]=await engines();let r=check(await start(engine.id));const other=check(await start(second.id))
  r=check(await act(r,{type:'gaolerOut',gaolerId:wielder,by:null},captor))
  r=check(await act(r,{type:'locateKeys',gaolerId:wielder,by:{id:target+':0'}}))
  const correct=(row:any,client=victim)=>client.rpc('correct_last_engine_rescue_action',{p_rescue_id:row.id,p_revision:row.revision,p_reason:'The table record was mistaken.'})
  expect((await correct(r,outsider)).error?.code).toBe('42501')
  r=check(await correct(r));expect(r.state.keys[0].keeper).toBeNull()
  expect(r.history.some((h:any)=>h.revertedAt)).toBe(true)
  const shared=check(await victim.from('engine_rescue_battles').select('*').eq('id',other.id).single())
  expect(shared.state.keys[0].keeper).toBeNull()
  r=check(await correct(r,captor));expect(r.state.keys).toEqual([])
  expect((await correct(r,captor)).error?.message).toMatch(/No recorded action/)
 })
 it('links Gaoler keys to the actual combat result and withdraws a corrected notification',async()=>{
  const [engine]=await engines();let r=check(await start(engine.id))
  const event=check(await victim.from('battle_events').insert({match_id:match,actor_id:users[1],actor_warband_id:vw,kind:'attack',summary:'Gaoler casualty',payload:{attacker_warband_id:vw,attacker_id:target,attacker_kind:'group',attacker_name:'Warriors',target_warband_id:cw,target_id:wielder,target_kind:'hero',target_name:'Gaoler',wounds_lost:1,out_of_action:true,kill:true,outcome:'Out of action',turn:1}}).select('id').single())
  expect(check(await victim.from('app_notifications').select('id').eq('dedupe_key','engine-keys:'+event.id))).toHaveLength(1)
  expect((await act(r,{type:'gaolerOut',gaolerId:wielder,by:{id:wielder},sourceEventId:event.id})).error?.message).toMatch(/match the attacker/)
  r=check(await act(r,{type:'gaolerOut',gaolerId:wielder,by:{id:target+':1'},sourceEventId:event.id}))
  expect((await admin.from('battle_events').update({reverted_at:new Date().toISOString()}).eq('id',event.id)).error?.message).toMatch(/linked prison-key event/)
  check(await victim.rpc('correct_last_engine_rescue_action',{p_rescue_id:r.id,p_revision:r.revision,p_reason:'Correcting the source casualty first.'}))
  check(await admin.from('battle_events').update({reverted_at:new Date().toISOString()}).eq('id',event.id))
  expect(check(await victim.from('app_notifications').select('id').eq('dedupe_key','engine-keys:'+event.id))).toEqual([])
 })
 it('requires a reviewed revision and rejects a Gaoler taking their own keys',async()=>{
  const [engine]=await engines();const r=check(await start(engine.id))
  const action={type:'gaolerOut',gaolerId:wielder,by:{id:wielder}}
  expect((await act(r,action,captor)).error?.message).toMatch(/cannot take their own keys/)
  expect((await victim.rpc('record_engine_rescue_action',{p_rescue_id:r.id,p_revision:null,p_action:{...action,by:{id:target+':0'}},p_note:'Confirmed at the table.'})).error?.message).toMatch(/changed on another device/)
  const recorded=check(await act(r,{...action,by:{id:target+':0'}}))
  expect((await victim.rpc('correct_last_engine_rescue_action',{p_rescue_id:recorded.id,p_revision:null,p_reason:'Correction without a reviewed version'})).error?.message).toMatch(/Refresh before correcting/)
 })
 it('notifies the actual key-holder player once across Engines and retracts a corrected casualty',async()=>{
  const [first,second]=await engines();let r=check(await start(first.id));check(await start(second.id))
  r=check(await act(r,{type:'gaolerOut',gaolerId:wielder,by:{id:target+':1'}}))
  const casualty=async(index:number)=>check(await captor.from('battle_events').insert({match_id:match,actor_id:users[0],actor_warband_id:cw,kind:'attack',summary:'Key holder casualty',payload:{attacker_warband_id:cw,attacker_id:wielder,attacker_kind:'hero',attacker_name:'Gaoler',target_warband_id:vw,target_id:target,target_kind:'group',target_model_index:index,target_name:'Three warriors',wounds_lost:1,out_of_action:true,kill:true,outcome:'Out of action',turn:2}}).select('id').single())
  const wrong=await casualty(0)
  expect(check(await victim.from('app_notifications').select('id').like('dedupe_key','engine-key-loss:'+wrong.id+':%'))).toEqual([])
  const exact=await casualty(1)
  expect(check(await victim.from('app_notifications').select('title').like('dedupe_key','engine-key-loss:'+exact.id+':%'))).toEqual([{title:'Check your prison keys'}])
  expect(check(await captor.from('app_notifications').select('id').like('dedupe_key','engine-key-loss:'+exact.id+':%'))).toEqual([])
  check(await admin.from('battle_events').update({reverted_at:new Date().toISOString()}).eq('id',exact.id))
  expect(check(await victim.from('app_notifications').select('id').like('dedupe_key','engine-key-loss:'+exact.id+':%'))).toEqual([])
 })
 it('records release and escape without changing permanent custody or creating roster models',async()=>{
  const [engine]=await engines()
  const report=check(await admin.from('match_reports').insert({match_id:match,warband_id:cw,submitted_by:users[0],status:'pending',applied:{}}).select('id').single())
  const prisoner=check(await admin.from('engine_prisoners').insert({engine_id:engine.id,holder_warband_id:cw,exploration_report_id:report.id,name:'Anonymous prisoner',places:1,snapshot:{anonymous:true}}).select('id').single())
  let r=check(await start(engine.id));expect(r.state.prisoners[0].profile).toMatchObject({M:4,WS:3,T:3,W:1})
  r=check(await act(r,{type:'gaolerOut',gaolerId:wielder,by:{id:target+':0'}}))
  expect((await act(r,{type:'free',keeperId:target+':0',baseContactConfirmed:false})).error?.message).toMatch(/base contact/)
  r=check(await act(r,{type:'free',keeperId:target+':0',baseContactConfirmed:true}))
  expect(r.state.prisoners[0].state).toBe('freed')
  r=check(await act(r,{type:'escaped',prisonerId:prisoner.id},captor))
  expect(r.state.prisoners[0].state).toBe('escaped')
  expect(check(await admin.from('engine_prisoners').select('state').eq('id',prisoner.id).single()).state).toBe('held')
  expect(check(await admin.from('heroes').select('id').in('warband_id',[cw,vw]))).toHaveLength(1)
  expect((await captor.rpc('finish_anonymous_engine_rescue',{p_rescue_id:r.id,p_prisoner_id:prisoner.id})).error?.message).toMatch(/Complete the rescue battle/)
  check(await admin.from('matches').update({state:'completed'}).eq('id',match))
  expect((await victim.rpc('finish_anonymous_engine_rescue',{p_rescue_id:r.id,p_prisoner_id:prisoner.id})).error?.code).toBe('42501')
  check(await captor.rpc('finish_anonymous_engine_rescue',{p_rescue_id:r.id,p_prisoner_id:prisoner.id}))
  expect(check(await admin.from('engine_prisoners').select('state').eq('id',prisoner.id).single()).state).toBe('freed')
  check(await admin.from('match_reports').update({undo:{}}).eq('id',report.id))
  expect((await admin.from('match_reports').update({undo:null}).eq('id',report.id)).error?.message).toMatch(/Reverse the anonymous prisoner departure/)
  expect((await captor.rpc('correct_last_engine_rescue_action',{p_rescue_id:r.id,p_revision:r.revision,p_reason:'Escape was recorded wrongly'})).error?.message).toMatch(/reverse completed returns/)
  check(await captor.rpc('reverse_anonymous_engine_rescue',{p_rescue_id:r.id,p_prisoner_id:prisoner.id,p_reason:'Escape was recorded wrongly'}))
  r=check(await captor.rpc('correct_last_engine_rescue_action',{p_rescue_id:r.id,p_revision:r.revision,p_reason:'Escape was recorded wrongly'}))
  expect(r.state.prisoners[0].state).toBe('freed')
  expect(check(await admin.from('engine_prisoners').select('state').eq('id',prisoner.id).single()).state).toBe('held')
 })
})

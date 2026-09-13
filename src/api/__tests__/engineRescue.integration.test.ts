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
  if(match){await admin.from('slaaneshi_holds').delete().eq('match_id',match);await admin.from('matches').delete().eq('id',match)}
  if(campaign)await admin.from('campaigns').delete().eq('id',campaign)
  if(cw)await admin.from('warbands').delete().in('id',[cw,vw])
 })
 afterAll(async()=>{for(const id of users)await admin.auth.admin.deleteUser(id)})
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
 })
})

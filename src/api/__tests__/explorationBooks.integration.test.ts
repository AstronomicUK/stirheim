import {createClient,type SupabaseClient} from '@supabase/supabase-js'
import {afterEach,beforeAll,beforeEach,describe,expect,it} from 'vitest'
const uid='22222222-2222-4222-8222-222222222222'
describe.skipIf(process.env.SUPABASE_LOCAL!=='1')('exploration book study',()=>{
 let admin:SupabaseClient,player:SupabaseClient,band:string,heroes:string[]
 const check=(r:{error:unknown})=>{if(r.error)throw r.error}
 beforeAll(async()=>{admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);player=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});check(await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'}))})
 beforeEach(async()=>{
  band=crypto.randomUUID();heroes=[crypto.randomUUID(),crypto.randomUUID()]
  check(await admin.from('warbands').insert({id:band,owner_id:uid,name:'Disposable book study QA',type_rules_id:'mercenaries_reikland',gold:100}))
  check(await admin.from('heroes').insert(heroes.map(id=>({id,warband_id:band,name:'Reader',unit_type_rules_id:'mercenaries_reikland_champions',is_hired_sword:false,status:'active',skill_tables:['shooting'],skills:[],flags:{},stats:{M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7}}))))
 })
 afterEach(async()=>{check(await admin.from('warbands').delete().eq('id',band))})
 const study=(hero:string,book='training_manual')=>player.rpc('study_exploration_book',{p_warband_id:band,p_hero_id:hero,p_book_id:book})
 const add=(quantity=1,book='training_manual')=>admin.from('items').insert({warband_id:band,holder_type:'stash',item_rules_id:book,quantity})
 it('allows one reader of the last copy, with persisted learning and readable history',async()=>{
  check(await add())
  const results=await Promise.all(heroes.map(h=>study(h)))
  expect(results.filter(r=>!r.error)).toHaveLength(1)
  const winner=heroes[results.findIndex(r=>!r.error)]
  const saved=await admin.from('heroes').select('*').eq('id',winner).single();check(saved)
  expect(saved.data!.flags.studiedTrainingManual).toBe(true);expect(saved.data!.skill_tables).toEqual(['shooting','combat'])
  expect(saved.data.stats.WS).toBe(3);expect(saved.data.skills).toEqual([])
  expect(saved.data.notes).toContain('maximum Weapon Skill increases by 1')
  const stock=await admin.from('items').select('id').eq('warband_id',band);check(stock);expect(stock.data).toHaveLength(0)
  check(await study(winner))
  const log=await admin.from('audit_log').select('reason').eq('warband_id',band);check(log)
  expect(log.data!.some((r:{reason:string|null})=>r.reason?.includes('studied Training Manual instead of selling it'))).toBe(true)
 })
 it('consumes just one notebook, preserves other learning, and cannot repeat a benefit',async()=>{
  check(await add(2,'alchemists_notebook'));check(await study(heroes[0],'alchemists_notebook'));check(await study(heroes[0],'alchemists_notebook'))
  const stock=await admin.from('items').select('quantity').eq('warband_id',band).single();check(stock);expect(stock.data!.quantity).toBe(1)
  const saved=await admin.from('heroes').select('flags,skill_tables').eq('id',heroes[0]).single();check(saved)
  expect(saved.data!.flags.studiedAlchemistNotebook).toBe(true);expect(saved.data!.skill_tables).toEqual(['shooting','academic'])
  check(await add());check(await study(heroes[0]));const both=await admin.from('heroes').select('flags,skill_tables').eq('id',heroes[0]).single();check(both)
  expect(both.data!.flags).toEqual({studiedAlchemistNotebook:true,studiedTrainingManual:true})
 })
 it('rejects missing stock, dead readers, and another player’s warband',async()=>{
  expect((await study(heroes[0])).error).toBeTruthy();check(await add())
  check(await admin.from('heroes').update({status:'dead'}).eq('id',heroes[0]));expect((await study(heroes[0])).error).toBeTruthy()
  const other=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}})
  check(await other.auth.signInWithPassword({email:'gm@stirheim.test',password:'stirheim-dev'}))
  expect((await other.rpc('study_exploration_book',{p_warband_id:band,p_hero_id:heroes[1],p_book_id:'training_manual'})).error).toBeTruthy()
  await other.auth.signOut()
 })
})

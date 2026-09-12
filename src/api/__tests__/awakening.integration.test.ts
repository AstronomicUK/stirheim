import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
const enabled=process.env.SUPABASE_LOCAL==='1'
const stats={M:4,WS:5,BS:4,S:4,T:3,W:2,I:4,A:2,Ld:8}
const check=(r:{data:unknown;error:{message:string}|null}):any=>{if(r.error)throw Error(r.error.message);return r.data}
describe.skipIf(!enabled)('Awakening report-backed opportunities',()=>{
 let admin:SupabaseClient,victim:SupabaseClient,necromancer:SupabaseClient,gm:SupabaseClient
 const users:string[]=[];let from:string,to:string,campaign:string,match:string,hero:string,caster:string,kit:string[]=[],extraBands:string[]=[]
 beforeAll(async()=>{
  admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const clients=[]
  for(let i=0;i<3;i++){
   const email=`awakening-${crypto.randomUUID()}@stirheim.test`,password=crypto.randomUUID()
   const {user}=check(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:`Awakening QA ${i}`}}));users.push(user.id)
   const client=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});check(await client.auth.signInWithPassword({email,password}));clients.push(client)
  }
  ;[victim,necromancer,gm]=clients
 })
 beforeEach(async()=>{
  extraBands=[]
  const bands=check(await admin.from('warbands').insert([{owner_id:users[0],name:'Disposable victim',type_rules_id:'mercenaries_reikland',gold:0},{owner_id:users[1],name:'Disposable necromancers',type_rules_id:'the_undead',gold:0}]).select('id'));[from,to]=bands.map((b:any)=>b.id)
  campaign=check(await admin.from('campaigns').insert({gm_id:users[2],name:'Disposable Awakening',settings:{reportApproval:false}}).select('id').single()).id
  check(await admin.from('campaign_members').insert([{campaign_id:campaign,warband_id:from,user_id:users[0]},{campaign_id:campaign,warband_id:to,user_id:users[1]}]))
  match=check(await admin.from('matches').insert({campaign_id:campaign,created_by:users[2],state:'awaiting_reports'}).select('id').single()).id
  check(await admin.from('match_participants').insert([from,to].map(warband_id=>({match_id:match,warband_id,accepted_at:new Date().toISOString()}))))
  hero=check(await admin.from('heroes').insert({warband_id:from,name:'Fallen Captain',unit_type_rules_id:'mercenaries_reikland_captain',stats,xp:20,status:'active',skills:['mighty_blow']}).select('id').single()).id
  caster=check(await admin.from('heroes').insert({warband_id:to,name:'Necromancer',unit_type_rules_id:'undead_necromancer',stats,xp:8,status:'active',spells:['spell_of_awakening']}).select('id').single()).id
  kit=check(await admin.from('items').insert(['sword','light_armour','rope_and_hook'].map(item_rules_id=>({warband_id:from,holder_type:'hero',holder_id:hero,item_rules_id,quantity:1}))).select('id')).map((i:any)=>i.id)
 })
 afterEach(async()=>{
  if(match){await admin.from('awakening_offers').delete().eq('match_id',match);await admin.from('matches').delete().eq('id',match)}
  if(campaign)await admin.from('campaigns').delete().eq('id',campaign)
  if(from&&to)await admin.from('warbands').delete().in('id',[from,to,...extraBands])
  await admin.from('app_notifications').delete().in('user_id',users)
 })
 afterAll(async()=>{for(const id of users)await admin.auth.admin.deleteUser(id)})
 const fileVictim=(roll=11,subjectType='hero')=>victim.rpc('submit_battle_report',{p_match_id:match,p_warband_id:from,p_report:{result:'lost',injuries:[{subjectType,subjectId:hero,subjectName:'Fallen Captain',rolls:[roll],outcome:'dead',injuryCode:'dead',injuryName:'Dead',effect:'Dead'}],applied:{heroes:[{id:hero,patch:{status:'dead'}}],remove_item_ids:kit}}})
 const fileCaster=()=>necromancer.rpc('submit_battle_report',{p_match_id:match,p_warband_id:to,p_report:{result:'won',applied:{}}})
 const offers=async()=>check(await necromancer.from('awakening_offers').select('*').eq('match_id',match))
 it('creates from a real filed death, preserves weapons/profile, notifies both owners, and requires recipient report',async()=>{
  check(await fileVictim());const [offer]=await offers();expect(offer.hero_name).toBe('Fallen Captain');expect(offer.snapshot.items).toHaveLength(3)
  expect(check(await admin.from('items').select('id').in('id',kit))).toHaveLength(0)
  expect(check(await victim.from('app_notifications').select('id'))).toHaveLength(1);expect(check(await necromancer.from('app_notifications').select('id'))).toHaveLength(1)
  expect(check(await gm.from('app_notifications').select('id'))).toHaveLength(0)
  expect((await victim.rpc('resolve_awakening',{p_offer_id:offer.id,p_action:'accept'})).error?.message).toMatch(/receiving player/)
  expect((await necromancer.rpc('resolve_awakening',{p_offer_id:offer.id,p_action:'accept'})).error?.message).toMatch(/own post-battle report/)
  check(await fileCaster());const id=check(await necromancer.rpc('resolve_awakening',{p_offer_id:offer.id,p_action:'accept'}))
  expect(check(await admin.from('henchman_groups').select('*').eq('id',id).single())).toMatchObject({name:'Fallen Captain (Zombie)',stats,size:1,xp:0,unit_type_rules_id:'undead_zombies'})
  const items=check(await admin.from('items').select('item_rules_id').eq('holder_id',id));expect(items.map((i:any)=>i.item_rules_id).sort()).toEqual(['light_armour','sword'])
  expect((await necromancer.rpc('resolve_awakening',{p_offer_id:offer.id,p_action:'accept'})).error?.message).toMatch(/already been resolved/)
  expect(check(await admin.from('match_reports').select('notes').eq('match_id',match)).every((r:any)=>r.notes.includes('raised as a Zombie'))).toBe(true)
 })
 it('requires a genuine Hero death and a surviving eligible caster',async()=>{
  check(await fileVictim(66));expect(await offers()).toHaveLength(0)
 })
 it('rejects a dead caster at acceptance even when it knew the spell before its report',async()=>{
  check(await fileVictim());const [offer]=await offers();check(await fileCaster());check(await admin.from('heroes').update({status:'dead'}).eq('id',caster))
  expect((await necromancer.rpc('resolve_awakening',{p_offer_id:offer.id,p_action:'accept'})).error?.message).toMatch(/no surviving spellcaster/)
 })
 it('withdrawal voids pending offers and accepted offers block withdrawal until reversed',async()=>{
  check(await fileVictim());const [offer]=await offers();check(await fileCaster());const id=check(await necromancer.rpc('resolve_awakening',{p_offer_id:offer.id,p_action:'accept'}))
  expect((await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:from})).error?.message).toMatch(/Reverse the Awakening/)
  expect((await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:to})).error?.message).toMatch(/Reverse the Awakening/)
  check(await necromancer.rpc('resolve_awakening',{p_offer_id:offer.id,p_action:'reverse',p_reason:'Corrected the reported death'}))
  expect(check(await admin.from('henchman_groups').select('id').eq('id',id))).toHaveLength(0)
  check(await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:from}))
  expect(check(await admin.from('heroes').select('status').eq('id',hero).single()).status).toBe('active')
  expect(check(await admin.from('items').select('id').in('id',kit))).toHaveLength(3)
 })

 it('serializes competing accepts so exactly one Zombie is created',async()=>{
  check(await fileVictim());const [offer]=await offers();check(await fileCaster())
  const results=await Promise.all([1,2].map(()=>necromancer.rpc('resolve_awakening',{p_offer_id:offer.id,p_action:'accept'})))
  expect(results.filter(r=>!r.error)).toHaveLength(1)
  expect(check(await admin.from('henchman_groups').select('id').eq('warband_id',to))).toHaveLength(1)
 })
 it('refuses automatic reversal after the raised warrior changes, and records a decline',async()=>{
  check(await fileVictim());const [offer]=await offers();check(await fileCaster());const id=check(await necromancer.rpc('resolve_awakening',{p_offer_id:offer.id,p_action:'accept'}))
  check(await admin.from('henchman_groups').update({notes:'Changed at the table'}).eq('id',id))
  expect((await necromancer.rpc('resolve_awakening',{p_offer_id:offer.id,p_action:'reverse',p_reason:'Correct the earlier report'})).error?.message).toMatch(/has changed/)
  expect(check(await admin.from('henchman_groups').select('id').eq('id',id))).toHaveLength(1)
 })
 it('declining is durable and tells the original owner',async()=>{
  check(await fileVictim());const [offer]=await offers()
  check(await necromancer.rpc('resolve_awakening',{p_offer_id:offer.id,p_action:'decline'}))
  expect((await offers())[0].state).toBe('declined')
  expect(check(await victim.from('app_notifications').select('title')).some((n:any)=>n.title.includes('declined'))).toBe(true)
 })

 it('pending offer cannot be used after the source report is withdrawn',async()=>{
  check(await fileVictim());const [offer]=await offers();check(await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:from}))
  expect((await necromancer.rpc('resolve_awakening',{p_offer_id:offer.id,p_action:'accept'})).error).not.toBeNull()
 })
 it('requires an agreed recipient for multiple warbands and only the source player or GM can record it',async()=>{
  const extra=check(await admin.from('warbands').insert({owner_id:users[1],name:'Other necromancers',type_rules_id:'the_undead',gold:0}).select('id').single()).id;extraBands.push(extra)
  check(await admin.from('campaign_members').insert({campaign_id:campaign,warband_id:extra,user_id:users[1]}))
  check(await admin.from('match_participants').insert({match_id:match,warband_id:extra,accepted_at:new Date().toISOString()}))
  check(await admin.from('heroes').insert({warband_id:extra,name:'Other caster',unit_type_rules_id:'undead_necromancer',stats,xp:8,status:'active',spells:['spell_of_awakening']}))
  check(await fileVictim());check(await fileCaster())
  check(await necromancer.rpc('submit_battle_report',{p_match_id:match,p_warband_id:extra,p_report:{result:'lost',applied:{}}}))
  const available=await offers(),first=available.find((o:any)=>o.to_warband_id===to),second=available.find((o:any)=>o.to_warband_id===extra)
  expect(available).toHaveLength(2);expect(available.every((o:any)=>o.allocation_required)).toBe(true)
  expect((await necromancer.rpc('resolve_awakening',{p_offer_id:first.id,p_action:'accept'})).error?.message).toMatch(/agreed Awakening recipient/)
  expect((await necromancer.rpc('agree_awakening_recipient',{p_offer_id:first.id})).error?.message).toMatch(/fallen Hero’s player/)
  check(await victim.rpc('agree_awakening_recipient',{p_offer_id:first.id}))
  expect((await necromancer.rpc('resolve_awakening',{p_offer_id:second.id,p_action:'accept'})).error?.message).toMatch(/agreed Awakening recipient/)
  check(await gm.rpc('agree_awakening_recipient',{p_offer_id:second.id,p_reason:'Players corrected their agreed recipient'}))
  const zombie=check(await necromancer.rpc('resolve_awakening',{p_offer_id:second.id,p_action:'accept'}))
  expect(check(await admin.from('henchman_groups').select('warband_id').eq('id',zombie).single()).warband_id).toBe(extra)
  expect((await victim.rpc('agree_awakening_recipient',{p_offer_id:first.id})).error?.message).toMatch(/Reverse the accepted/)
  expect(check(await victim.from('app_notifications').select('body')).some((n:any)=>n.body.includes('players agreed'))).toBe(true)
 })

})

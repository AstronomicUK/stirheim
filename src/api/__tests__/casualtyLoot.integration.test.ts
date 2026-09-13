import {createClient,type SupabaseClient} from '@supabase/supabase-js'
import {beforeAll,beforeEach,afterEach,it,expect,describe} from 'vitest'
const check=(r:{data:unknown,error:{message:string}|null}):any=>{if(r.error)throw Error(r.error.message);return r.data}
const owner='22222222-2222-4222-8222-222222222222',stats={M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7}
describe.skipIf(process.env.SUPABASE_LOCAL!=='1')('casualty looting',()=>{
 let admin:SupabaseClient,player:SupabaseClient,from:string,to:string,campaign:string,match:string,hero:string,looter:string,item:string
 beforeAll(async()=>{admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);player=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});check(await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'}))})
 beforeEach(async()=>{
  const bands=check(await admin.from('warbands').insert([{owner_id:owner,name:'Loot casualty QA',type_rules_id:'mercenaries_reikland'},{owner_id:owner,name:'Loot Bandits QA',type_rules_id:'hochland_bandits'}]).select('id'));[from,to]=bands.map((b:any)=>b.id)
  campaign=check(await admin.from('campaigns').insert({gm_id:owner,name:'Loot QA',settings:{reportApproval:false}}).select('id').single()).id
  check(await admin.from('campaign_members').insert([from,to].map(warband_id=>({campaign_id:campaign,warband_id,user_id:owner}))))
  match=check(await admin.from('matches').insert({campaign_id:campaign,created_by:owner,state:'awaiting_reports'}).select('id').single()).id
  check(await admin.from('match_participants').insert([from,to].map(warband_id=>({match_id:match,warband_id,accepted_at:new Date().toISOString()}))))
  hero=check(await admin.from('heroes').insert({warband_id:from,name:'Victim',unit_type_rules_id:'mercenaries_reikland_captain',stats}).select('id').single()).id
  looter=check(await admin.from('henchman_groups').insert({warband_id:to,name:'Looters',unit_type_rules_id:'hochland_bandits_looter',size:2,stats}).select('id').single()).id
  item=check(await admin.from('items').insert({warband_id:from,holder_type:'hero',holder_id:hero,item_rules_id:'sword',quantity:1}).select('id').single()).id
 })
 afterEach(async()=>{const pools=check(await admin.from('casualty_loot').select('id').eq('match_id',match));for(const c of pools)check(await admin.from('casualty_loot_attempts').delete().eq('casualty_id',c.id));check(await admin.from('campaigns').delete().eq('id',campaign));check(await admin.from('warbands').delete().in('id',[from,to]))})
 const fileSource=()=>player.rpc('submit_battle_report',{p_match_id:match,p_warband_id:from,p_report:{result:'lost',injuries:[{subjectType:'hero',subjectId:hero,subjectName:'Victim',rolls:[11],outcome:'dead',injuryCode:'dead',injuryName:'Dead',effect:'Dead'}],applied:{heroes:[{id:hero,patch:{status:'dead'}}],remove_item_ids:[item]}}})
 const fileBandit=()=>player.rpc('submit_battle_report',{p_match_id:match,p_warband_id:to,p_report:{result:'won',applied:{}}})
 async function pool(){return check(await player.from('casualty_loot').select('*').eq('match_id',match).single())}
 const roll=(id:string,index:number,die:number,request=crypto.randomUUID())=>player.rpc('roll_casualty_loot',{p_id:id,p_body:0,p_warband:to,p_looter:looter,p_looter_index:index,p_die:die,p_request:request})
 it('offers an actual death, lets two Looters try, transfers once and safely reverses',async()=>{
  check(await fileSource());const c=await pool();expect(c.kit[0].item_rules_id).toBe('sword')
  expect((await roll(c.id,0,4)).error?.message).toContain('File your battle report')
  check(await fileBandit());check(await roll(c.id,0,2));expect((await roll(c.id,0,6)).error?.message).toContain('already tried')
  const request=crypto.randomUUID();check(await roll(c.id,1,4,request));check(await roll(c.id,1,4,request))
  const kit=check(await player.from('items').select('*').eq('warband_id',to));expect(kit).toHaveLength(1);expect(kit[0].quantity).toBe(1)
  expect((await roll(c.id,0,6)).error?.message).toContain('already been looted')
  check(await player.rpc('reverse_casualty_loot',{p_attempt:request,p_reason:'QA correction of the roll'}))
  expect(check(await player.from('items').select('*').eq('warband_id',to))).toHaveLength(0)
 })
 it('does not erase equipment changes during reversal',async()=>{
  check(await fileSource());check(await fileBandit());const c=await pool(),request=crypto.randomUUID();check(await roll(c.id,0,6,request))
  check(await admin.from('items').update({notes:'Changed after looting'}).eq('warband_id',to))
  expect((await player.rpc('reverse_casualty_loot',{p_attempt:request,p_reason:'QA changed equipment'})).error?.message).toContain('equipment has changed')
 })
 it('requires precise allocation of mixed group kit and excludes survivor equipment',async()=>{
  const group=check(await admin.from('henchman_groups').insert({warband_id:from,name:'Mixed warriors',unit_type_rules_id:'mercenaries_reikland_warriors',size:3,stats}).select('id').single()).id
  const sword=check(await admin.from('items').insert({warband_id:from,holder_type:'group',holder_id:group,item_rules_id:'sword',quantity:2}).select('id').single()).id
  check(await player.rpc('submit_battle_report',{p_match_id:match,p_warband_id:from,p_report:{result:'lost',injuries:[{subjectType:'group',subjectId:group,subjectName:'Mixed warriors',rolls:[1,2],dead:2,equipmentLost:[{sourceItemId:sword,quantity:1,manual:true}]}],applied:{groups:[{id:group,patch:{size:1}}],item_patches:[{id:sword,quantity:1}]}}}))
  const c=await pool();expect(c.allocations).toBeNull();expect(c.kit[0].quantity).toBe(1)
  expect((await player.rpc('allocate_casualty_loot',{p_id:c.id,p_quantities:[{[sword]:1},{[sword]:1}]})).error?.message).toContain('exactly once')
  check(await player.rpc('allocate_casualty_loot',{p_id:c.id,p_quantities:[{[sword]:1},{}]}));check(await fileBandit());check(await roll(c.id,0,5))
  expect(check(await player.from('items').select('quantity').eq('id',sword).single()).quantity).toBe(1)
 })
 it('serializes competing successes so a casualty gives equipment only once',async()=>{
  check(await fileSource());check(await fileBandit());const c=await pool()
  const results=await Promise.all([roll(c.id,0,4),roll(c.id,1,6)])
  expect(results.filter(r=>!r.error)).toHaveLength(1)
  expect(check(await player.from('items').select('*').eq('warband_id',to))).toHaveLength(1)
 })
 it('rejects outsiders and Looters recruited after the report',async()=>{
  check(await fileSource());check(await fileBandit());const c=await pool()
  const late=check(await admin.from('henchman_groups').insert({warband_id:to,name:'Late Looter',unit_type_rules_id:'hochland_bandits_looter',size:1,stats}).select('id').single()).id
  expect((await player.rpc('roll_casualty_loot',{p_id:c.id,p_body:0,p_warband:to,p_looter:late,p_looter_index:0,p_die:6,p_request:crypto.randomUUID()})).error?.message).toContain('joined after')
  const outsider=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}})
  check(await outsider.auth.signInWithPassword({email:'gm@stirheim.test',password:'stirheim-dev'}))
  expect((await outsider.rpc('roll_casualty_loot',{p_id:c.id,p_body:0,p_warband:to,p_looter:looter,p_looter_index:0,p_die:6,p_request:crypto.randomUUID()})).error?.message).toContain('cannot control')
 })

})

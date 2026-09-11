import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
const enabled=process.env.SUPABASE_LOCAL==='1'
describe.skipIf(!enabled)('atomic captive roster save',()=>{
 let player:SupabaseClient, other:SupabaseClient, admin:SupabaseClient
 const ids:string[]=[]
 beforeAll(async()=>{
  const url=process.env.SUPABASE_URL!,key=process.env.SUPABASE_ANON_KEY!
  player=createClient(url,key);other=createClient(url,key);admin=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY!)
  for(const [client,email] of [[player,'player@stirheim.test'],[other,'gm@stirheim.test']] as const){const r=await client.auth.signInWithPassword({email,password:'stirheim-dev'});if(r.error)throw r.error}
  for(let i=0;i<2;i++){const r=await player.rpc('create_warband',{payload:{name:`Captive QA ${i}`,type_rules_id:'mercenaries_reikland',gold:100,heroes:[],henchman_groups:[],stash:[]}});if(r.error)throw r.error;ids.push(r.data)}
 })
 afterAll(async()=>{if(ids.length)await admin.from('warbands').delete().in('id',ids);await player?.auth.signOut();await other?.auth.signOut()})
 async function args(){const r=await player.from('warbands').select('id,updated_at').in('id',ids);if(r.error)throw r.error;return {p_first:ids[0],p_second:ids[1],p_first_updated:r.data.find(w=>w.id===ids[0])!.updated_at,p_second_updated:r.data.find(w=>w.id===ids[1])!.updated_at,p_reason:'Captive test',p_first_changes:[{table:'warbands',op:'update',data:{gold:70}}],p_second_changes:[{table:'warbands',op:'update',data:{gold:130}}],p_expected:{heroes:[],henchman_groups:[],items:[]}}}
 it('rejects a caller who cannot edit both rosters',async()=>{const r=await other.rpc('resolve_captive_rosters',await args());expect(r.error?.code).toBe('42501')})
 it('rolls back the first roster if the second update fails',async()=>{const a=await args();a.p_second_changes=[{table:'warbands',op:'update',data:{gold:-1}}];const r=await player.rpc('resolve_captive_rosters',a);expect(r.error).not.toBeNull();const w=await player.from('warbands').select('gold').in('id',ids);expect(w.data?.map(x=>x.gold)).toEqual([100,100])})
 it('updates both and rejects reusing the stale preview',async()=>{const a=await args();expect((await player.rpc('resolve_captive_rosters',a)).error).toBeNull();const w=await player.from('warbands').select('gold').in('id',ids);expect(w.data?.map(x=>x.gold).sort()).toEqual([130,70]);expect((await player.rpc('resolve_captive_rosters',a)).error?.code).toBe('40001')})
 it('records event XP and an advancement atomically, then rejects a stale child snapshot',async()=>{
  const id=crypto.randomUUID()
  const inserted=await player.rpc('update_roster',{p_warband_id:ids[0],p_reason:'QA hero',p_changes:[{table:'heroes',op:'insert',id,data:{name:'Event hero',unit_type_rules_id:'mercenaries_reikland_captain',stats:{M:4,WS:4,BS:4,S:3,T:3,W:1,I:4,A:1,Ld:8},xp:0}}]})
  expect(inserted.error).toBeNull()
  const w=await player.from('warbands').select('updated_at').eq('id',ids[0]).single()
  const h=await player.from('heroes').select('*').eq('warband_id',ids[0])
  const args={p_warband_id:ids[0],p_updated:w.data!.updated_at,p_reason:'Won pit fight',p_changes:[{table:'heroes',op:'update',id,data:{xp:2}}],p_expected:{heroes:h.data,henchman_groups:[],items:[]},p_advances:[{subject_id:id,threshold_xp:2}]}
  expect((await player.rpc('resolve_roster_event',args)).error).toBeNull()
  const xp=await player.from('heroes').select('xp').eq('id',id).single()
  const advances=await player.from('pending_advances').select('threshold_xp').eq('subject_id',id)
  expect(xp.data?.xp).toBe(2);expect(advances.data).toEqual([{threshold_xp:2}])
  const fresh=await player.from('warbands').select('updated_at').eq('id',ids[0]).single()
  expect((await player.rpc('resolve_roster_event',{...args,p_updated:fresh.data!.updated_at})).error?.code).toBe('40001')
 })

 it('queues a zero-XP Lustrian replacement advance atomically and rejects a replay',async()=>{
  const created=await player.rpc('create_warband',{payload:{name:'Lustrian atomic replacement QA',type_rules_id:'lustrian_reavers',gold:0,heroes:[],henchman_groups:[],stash:[]}})
  expect(created.error).toBeNull();const band=created.data;ids.push(band)
  const id=crypto.randomUUID(),fallen=crypto.randomUUID()
  const w=await player.from('warbands').select('updated_at').eq('id',band).single()
  const args={p_warband_id:band,p_updated:w.data!.updated_at,p_reason:'Lustrian replacement QA',p_expected:{heroes:[],henchman_groups:[],items:[]},p_changes:[{table:'heroes',op:'insert',id,data:{name:'Zero-XP replacement',unit_type_rules_id:'lustrian_reavers_conqueror',xp:0,stats:{M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7},flags:{lustrianReplacementOf:fallen}}}],p_advances:[{subject_id:id,threshold_xp:1}]}
  expect((await player.rpc('resolve_roster_event',args)).error).toBeNull()
  expect((await player.from('heroes').select('xp').eq('id',id).single()).data?.xp).toBe(0)
  expect((await player.from('pending_advances').select('threshold_xp').eq('subject_id',id)).data).toEqual([{threshold_xp:1}])
  expect((await player.rpc('resolve_roster_event',args)).error?.code).toBe('40001')
  expect((await player.from('pending_advances').select('id').eq('subject_id',id)).data).toHaveLength(1)
 })

})

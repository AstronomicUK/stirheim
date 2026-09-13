import { createClient,type SupabaseClient } from '@supabase/supabase-js'
import { beforeAll,afterEach,describe,it,expect } from 'vitest'
import { findWarbandTemplate } from '../../rules/data/warbandTemplates'
import { addDraftHero,addDraftGroup,newWarbandDraft,draftToCreatePayload } from '../../rules/resolve/builder'
const check=(r:{error:unknown})=>{if(r.error)throw r.error}
describe.skipIf(process.env.SUPABASE_LOCAL!=='1')('atomic starting choices',()=>{
 let player:SupabaseClient,admin:SupabaseClient;const ids:string[]=[]
 beforeAll(async()=>{player=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);check(await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'}))})
 afterEach(async()=>{for(const id of ids.splice(0))check(await admin.from('warbands').delete().eq('id',id))})
 it('saves mutation equipment, changed profile, cost and initial spell in a single creation call',async()=>{
  const t=findWarbandTemplate('cult_of_the_possessed')!;let d=addDraftHero(newWarbandDraft(t,'Creation QA'),t,'cult_of_the_possessed_mutants','m')
  d={...d,heroes:d.heroes.map(h=>h.id==='m'?{...h,recruitGiftIds:['cloven_hoofs','cloven_hoofs']}:{...h,spellIds:['fires_of_uzhul']})}
  const payload=draftToCreatePayload(d,t);const created=await player.rpc('create_warband',{payload});check(created);ids.push(created.data)
  const heroes=await player.from('heroes').select('*').eq('warband_id',created.data);check(heroes)
  const mutant=heroes.data!.find(h=>h.unit_type_rules_id==='cult_of_the_possessed_mutants')!
  expect(mutant.stats.M).toBe(6)
  expect(heroes.data!.find(h=>h.id!==mutant.id)!.spells).toEqual(['fires_of_uzhul'])
  const items=await player.from('items').select('*').eq('holder_id',mutant.id).eq('item_rules_id','cloven_hoofs');check(items);expect(items.data).toHaveLength(1);expect(items.data![0].quantity).toBe(2)
  const w=await player.from('warbands').select('gold').eq('id',created.data).single();check(w);expect(w.data!.gold).toBe(payload.gold)
 })
 it('saves a Scarecrow controller and the original War Beast entitlement with its group',async()=>{
  for(const type of ['the_restless_dead','lustrian_reavers']) {
   const t=findWarbandTemplate(type)!;let d=addDraftGroup(newWarbandDraft(t,'Group choices QA'),t,type==='the_restless_dead'?'restless_dead_scarecrows':'lustrian_reavers_estalian_warhound','g',1)
   if(type==='the_restless_dead')d={...d,groups:d.groups.map(g=>({...g,constructController:'restless_dead_liche' as const}))}
   const r=await player.rpc('create_warband',{payload:draftToCreatePayload(d,t)});check(r);ids.push(r.data)
   const groups=await player.from('henchman_groups').select('campaign_state').eq('warband_id',r.data);check(groups)
   expect(groups.data![0].campaign_state).toEqual(type==='the_restless_dead'?{constructController:'restless_dead_liche'}:{warBeastSlots:1})
  }
 })
})

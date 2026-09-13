import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import {afterEach,beforeAll,beforeEach,describe,expect,it} from 'vitest';
import {toRosterWarband} from '../../domain/roster';
import {diffRoster} from '../../domain/rosterDiff';
import {sellWyrdstone} from '../../rules/resolve/income';
import {sellItem} from '../../rules/resolve/trading';
import {recruitHenchmen} from '../../rules/resolve/recruitment';
import {findWarbandTemplate} from '../../rules/data/warbandTemplates';
const uid='22222222-2222-4222-8222-222222222222';
describe.skipIf(process.env.SUPABASE_LOCAL!=='1')('Trading batch saved outcomes',()=>{
 let admin:SupabaseClient,player:SupabaseClient,band:string,hero:string,match:string,campaign:string;
 const check=(r:{error:unknown})=>{if(r.error)throw r.error};
 beforeAll(async()=>{admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);player=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});check(await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'}))});
 beforeEach(async()=>{
  band=crypto.randomUUID();hero=crypto.randomUUID();match=crypto.randomUUID();campaign=crypto.randomUUID();
  check(await admin.from('campaigns').insert({id:campaign,gm_id:uid,name:'Disposable Chef QA'}));
  check(await admin.from('warbands').insert({id:band,owner_id:uid,name:'Chef QA',type_rules_id:'mercenaries_reikland',gold:100,wyrdstone:4}));
  check(await admin.from('heroes').insert({id:hero,warband_id:band,name:'Cook',unit_type_rules_id:'halflings_cook',is_hired_sword:false,status:'active',stats:{M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7}}));
  check(await admin.from('matches').insert({id:match,campaign_id:campaign,created_by:uid,state:'awaiting_reports'}));
  check(await admin.from('match_participants').insert({match_id:match,warband_id:band}));
  check(await admin.from('match_reports').insert({match_id:match,warband_id:band,submitted_by:uid,result:'won',submitted_at:new Date().toISOString()}));
 });
 afterEach(async()=>{check(await admin.from('campaigns').delete().eq('id',campaign));check(await admin.from('warbands').delete().eq('id',band))});

 async function detail(){
  const results=await Promise.all([admin.from('warbands').select('*').eq('id',band).single(),admin.from('heroes').select('*').eq('warband_id',band),admin.from('henchman_groups').select('*').eq('warband_id',band),admin.from('items').select('*').eq('warband_id',band)]);
  results.forEach(check);const [w,h,g,i]=results;
  return {warband:w.data,heroes:h.data!,groups:g.data!,items:i.data!,roster:toRosterWarband(w.data,h.data!,g.data!,i.data!)};
 }
 async function addSupplies(){const id=crypto.randomUUID();check(await admin.from('items').insert({id,warband_id:band,holder_type:'stash',item_rules_id:'victuals',quantity:3}));return id}
 async function sale(){const d=await detail();const result=sellWyrdstone(d.roster,2,{victuals:1});return {p_warband_id:band,p_match_id:match,p_changes:diffRoster(d,result.value),p_reason:result.events[0].message,p_expected_gold:d.roster.gold,p_expected_shards:4,p_victuals:1,p_expected_victuals:d.items.filter(i=>i.item_rules_id==='victuals').map(({id,quantity,holder_type,holder_id})=>({id,quantity,holder_type,holder_id}))}}
 it('saves consumed supplies, shards, gold and readable history together; concurrent retries cannot consume twice',async()=>{
  const id=await addSupplies();const input=await sale();const results=await Promise.all([player.rpc('record_wyrdstone_sale',input),player.rpc('record_wyrdstone_sale',input)]);
  expect(results.filter(r=>!r.error)).toHaveLength(1);
  const saved=await detail();expect(saved.roster.gold).toBe(160);expect(saved.roster.wyrdstone).toBe(2);expect(saved.items.find(i=>i.id===id)?.quantity).toBe(2);
  const history=await admin.from('audit_log').select('reason').eq('warband_id',band);check(history);expect(history.data!.some(r=>r.reason?.includes('Consumed 1 Victuals'))).toBe(true);
 });
 it('rejects changed stock without touching treasury or sale allowance',async()=>{
  const id=await addSupplies();const input=await sale();check(await admin.from('items').update({quantity:2}).eq('id',id));
  expect((await player.rpc('record_wyrdstone_sale',input)).error?.message).toContain('inventory changed');
  const saved=await detail();expect(saved.roster.gold).toBe(100);expect(saved.roster.wyrdstone).toBe(4);
  check(await player.rpc('record_wyrdstone_sale',await sale()));
 });
 it('rolls back the entire sale if the selected supply was not consumed, and blocks pre-battle use',async()=>{
  await addSupplies();const input=await sale();
  expect((await player.rpc('record_wyrdstone_sale',{...input,p_changes:input.p_changes.filter(c=>c.table!=='items')})).error?.message).toContain('consume exactly');
  const saved=await detail();expect(saved.roster.gold).toBe(100);expect(saved.roster.wyrdstone).toBe(4);
  expect((await player.rpc('record_wyrdstone_sale',{...input,p_match_id:null})).error?.message).toContain('after a battle');
  check(await player.rpc('record_wyrdstone_sale',input));
 });
 it('saves the Bandit random-price bonus and removes both copies',async()=>{
  check(await admin.from('warbands').update({type_rules_id:'hochland_bandits'}).eq('id',band));
  check(await admin.from('items').insert({warband_id:band,holder_type:'stash',item_rules_id:'blessed_water',quantity:2}));
  const d=await detail();const result=sellItem(d.roster,{kind:'stash'},'blessed_water',2,10,{rolls:[[1,3,5],[6,6,6]]});
  check(await player.rpc('record_trade',{p_warband_id:band,p_match_id:match,p_changes:diffRoster(d,result.value),p_reason:result.events[0].message}));
  const saved=await detail();expect(saved.roster.gold).toBe(123);expect(saved.roster.stash).toEqual([]);
 });
 it('persists the Uncommon pool cost independently of hire gold and retains a zero pool',async()=>{
  check(await admin.from('warbands').update({type_rules_id:'the_sons_of_hashut',gold:500,veteran_pool:12}).eq('id',band));
  const group=crypto.randomUUID(),unit='sons_of_hashut_chaos_dwarf_warriors';
  check(await admin.from('henchman_groups').insert({id:group,warband_id:band,name:'Veterans',unit_type_rules_id:unit,size:1,xp:4,stats:{M:3,WS:4,BS:3,S:3,T:4,W:1,I:2,A:1,Ld:9}}));
  const d=await detail();const result=recruitHenchmen(d.roster,findWarbandTemplate('the_sons_of_hashut')!,unit,'Veterans',2,group,{intoGroupId:group});
  check(await player.rpc('update_roster',{p_warband_id:band,p_reason:'Recruit veteran Chaos Dwarfs',p_changes:diffRoster(d,{...result.value.warband,veteranPool:result.value.poolRemaining})}));
  const saved=await detail();expect(saved.roster.gold).toBe(404);expect(saved.roster.veteranPool).toBe(0);expect(saved.roster.henchmenGroups[0].size).toBe(3);
 });
});

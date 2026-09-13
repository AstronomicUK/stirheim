import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import {afterEach,beforeAll,beforeEach,describe,expect,it} from 'vitest';
const uid='22222222-2222-4222-8222-222222222222';
describe.skipIf(process.env.SUPABASE_LOCAL!=='1')('Master Chef saved roll and sale',()=>{
 let admin:SupabaseClient,player:SupabaseClient,band:string,hero:string,match:string,campaign:string;
 const check=(r:{error:unknown})=>{if(r.error)throw r.error};
 beforeAll(async()=>{admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);player=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});check(await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'}))});
 beforeEach(async()=>{
  band=crypto.randomUUID();hero=crypto.randomUUID();match=crypto.randomUUID();campaign=crypto.randomUUID();
  check(await admin.from('campaigns').insert({id:campaign,gm_id:uid,name:'Disposable Chef QA'}));
  check(await admin.from('warbands').insert({id:band,owner_id:uid,name:'Chef QA',type_rules_id:'halflings',gold:100,wyrdstone:4}));
  check(await admin.from('heroes').insert({id:hero,warband_id:band,name:'Cook',unit_type_rules_id:'halflings_cook',is_hired_sword:false,status:'active',stats:{M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7}}));
  check(await admin.from('matches').insert({id:match,campaign_id:campaign,created_by:uid,state:'awaiting_reports'}));
  check(await admin.from('match_participants').insert({match_id:match,warband_id:band}));
  check(await admin.from('match_reports').insert({match_id:match,warband_id:band,submitted_by:uid,result:'won',submitted_at:new Date().toISOString()}));
 });
 afterEach(async()=>{check(await admin.from('campaigns').delete().eq('id',campaign));check(await admin.from('warbands').delete().eq('id',band))});
 const roll=(value=4)=>({p_warband_id:band,p_match_id:match,p_roll:value,p_source:'app',p_request_id:crypto.randomUUID()});
 const sale=()=>({p_warband_id:band,p_match_id:match,p_changes:[{table:'warbands',op:'update',id:band,data:{gold:175,wyrdstone:0}}],p_reason:'Sold 4 wyrdstone for 75 gc; Master Chef rolled 4: no bonus.',p_expected_gold:100,p_expected_shards:4,p_chef_revision:1});
 it('saves once, retries safely and retains original dice after an explained correction',async()=>{
  const a=roll();check(await player.rpc('record_master_chef',a));check(await player.rpc('record_master_chef',a));
  expect((await player.rpc('record_master_chef',roll(6))).error).toBeTruthy();
  expect((await player.rpc('record_master_chef',{...roll(6),p_expected_revision:1})).error).toBeTruthy();
  check(await player.rpc('record_master_chef',{...roll(6),p_expected_revision:1,p_reason:'Corrected the tabletop result'}));
  const saved=await player.from('master_chef_checks').select('*').eq('warband_id',band).single();check(saved);expect(saved.data).toMatchObject({roll:6,original_roll:4,revision:2});
  const history=await admin.from('audit_log').select('reason').eq('warband_id',band).eq('table_name','master_chef_checks').order('id');check(history);expect(history.data).toHaveLength(2);expect(history.data![1].reason).toContain('corrected D6 4 to 6');
  const w=await admin.from('warbands').select('gold,wyrdstone').eq('id',band).single();check(w);expect(w.data).toEqual({gold:100,wyrdstone:4});
 });
 it('refuses missing/stale rolls and competing corrections; a sale cannot duplicate gold',async()=>{
  expect((await player.rpc('record_wyrdstone_sale',sale())).error).toBeTruthy();
  check(await player.rpc('record_master_chef',roll()));
  const corrections=await Promise.all([5,6].map(v=>player.rpc('record_master_chef',{...roll(v),p_expected_revision:1,p_reason:'Agreed correction'})));
  expect(corrections.filter(r=>!r.error)).toHaveLength(1);
  expect((await player.rpc('record_wyrdstone_sale',sale())).error).toBeTruthy();
  const sales=await Promise.all([1,2].map(()=>player.rpc('record_wyrdstone_sale',{...sale(),p_chef_revision:2})));
  expect(sales.filter(r=>!r.error)).toHaveLength(1);
  expect((await player.rpc('record_master_chef',{...roll(1),p_expected_revision:2,p_reason:'Too late'})).error).toBeTruthy();
  const w=await admin.from('warbands').select('gold,wyrdstone').eq('id',band).single();check(w);expect(w.data).toEqual({gold:175,wyrdstone:0});
 });
 it('rejects ineligible Cook, invalid dice, wrong phase and direct ledger writes',async()=>{
  for(const value of [0,7])expect((await player.rpc('record_master_chef',roll(value))).error).toBeTruthy();
  expect((await player.rpc('record_master_chef',{...roll(),p_match_id:null})).error).toBeTruthy();
  check(await admin.from('heroes').update({status:'dead'}).eq('id',hero));expect((await player.rpc('record_master_chef',roll())).error).toBeTruthy();
  expect((await player.from('master_chef_checks').insert({warband_id:band,match_id:match,roll:6,original_roll:6,source:'app',request_id:crypto.randomUUID()})).error).toBeTruthy();
 });
 it('rejects a stale quote when the Cook disappears and refuses another account',async()=>{
  check(await player.rpc('record_master_chef',roll()));
  check(await admin.from('heroes').update({status:'captured'}).eq('id',hero));
  expect((await player.rpc('record_wyrdstone_sale',sale())).error?.message).toContain('Cook is no longer available');
  const outsider=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});
  expect((await outsider.rpc('record_master_chef',roll())).error).toBeTruthy();
  expect((await outsider.from('master_chef_checks').select('*').eq('warband_id',band)).error).toBeTruthy();
 });
 it('retains the pre-battle roll across reload and grants a new roll only for a new sequence',async()=>{
  check(await admin.from('match_reports').delete().eq('warband_id',band));check(await player.rpc('record_master_chef',{...roll(),p_match_id:null}));
  expect((await player.rpc('record_master_chef',{...roll(6),p_match_id:null})).error).toBeTruthy();
  check(await admin.from('match_reports').insert({match_id:match,warband_id:band,submitted_by:uid,result:'won',submitted_at:new Date().toISOString()}));
  check(await player.rpc('record_master_chef',roll(6)));
  const all=await player.from('master_chef_checks').select('roll').eq('warband_id',band);check(all);expect(all.data).toHaveLength(2);
 });
});

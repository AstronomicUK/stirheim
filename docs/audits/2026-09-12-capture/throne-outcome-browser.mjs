// Outcome-contract acceptance only. The saved forced-capture fixture is supplied
// directly; this does not prove the separately pending Misericordia trigger.
import {chromium,expect} from '@playwright/test';
import {createClient} from '@supabase/supabase-js';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('../../..',import.meta.url));
const raw=execFileSync('npx',['supabase','status','-o','env'],{cwd,env:{...process.env,DOCKER_HOST:'unix:///Users/tombrookes/.docker/run/docker.sock'},encoding:'utf8',stdio:['ignore','pipe','pipe']});
const env=Object.fromEntries([...raw.matchAll(/^(\w+)="(.*)"$/gm)].map(m=>[m[1],m[2]]));
if(!/^http:\/\/(127\.0\.0\.1|localhost):/.test(env.API_URL))throw Error('Local only');
const admin=createClient(env.API_URL,env.SERVICE_ROLE_KEY),users=[],bands=[];
const must=r=>{if(r.error)throw Error(r.error.message);return r.data};
let browser,campaign,match;
try{
 for(let i=0;i<3;i++){
  const email=`throne-${crypto.randomUUID()}@stirheim.test`,password=crypto.randomUUID();
  const {user}=must(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:`Throne QA ${i}`}}));
  const api=createClient(env.API_URL,env.ANON_KEY,{auth:{persistSession:false}});must(await api.auth.signInWithPassword({email,password}));users.push({id:user.id,email,password,api});
 }
 for(let i=0;i<2;i++)bands.push(must(await admin.from('warbands').insert({owner_id:users[i].id,name:i?'Victim warband':'Cavalcade',type_rules_id:i?'mercenaries_reikland':'the_cursed_cavalcade',gold:100}).select('id').single()).id);
 campaign=must(await admin.from('campaigns').insert({gm_id:users[2].id,name:'Disposable Throne outcome',settings:{reportApproval:false}}).select('id').single()).id;
 must(await admin.from('campaign_members').insert(bands.map((warband_id,i)=>({campaign_id:campaign,warband_id,user_id:users[i].id}))));
 match=must(await admin.from('matches').insert({campaign_id:campaign,created_by:users[2].id,state:'awaiting_reports'}).select('id').single()).id;
 must(await admin.from('match_participants').insert(bands.map(warband_id=>({match_id:match,warband_id,accepted_at:new Date().toISOString()}))));
 const stats={M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7};
 const hero=must(await admin.from('heroes').insert({warband_id:bands[0],name:'Aristocrat',unit_type_rules_id:'cursed_cavalcade_aristocrat',status:'active',xp:23,stats}).select('id').single()).id;
 const group=must(await admin.from('henchman_groups').insert({warband_id:bands[1],name:'Warriors',unit_type_rules_id:'mercenaries_reikland_warriors',size:2,xp:2,stats}).select('id').single()).id;
 const sword=must(await admin.from('items').insert({warband_id:bands[1],holder_type:'group',holder_id:group,item_rules_id:'sword',quantity:2,notes:'Red grip'}).select('id').single()).id;
 const event=must(await admin.from('battle_events').insert({match_id:match,actor_id:users[0].id,actor_warband_id:bands[0],kind:'attack',payload:{attacker_warband_id:bands[0],attacker_id:hero,attacker_kind:'hero',attacker_name:'Aristocrat',target_warband_id:bands[1],target_id:group,target_kind:'group',target_name:'Warriors',target_size:2,out_of_action:true,wounds_lost:1,kill:false,outcome:'Captured fixture',capture_reason:'subjugator'}}).select('id').single()).id;
 must(await users[1].api.rpc('submit_battle_report',{p_match_id:match,p_warband_id:bands[1],p_report:{result:'lost',injuries:[{subjectType:'group',subjectId:group,subjectName:'Warriors',rolls:[],dead:0,equipmentLost:[{sourceItemId:sword,quantity:1}],captured:[{modelIndex:1,eventId:event,captorWarbandId:bands[0],reason:'subjugator',kit:[{sourceItemId:sword,itemId:'sword',quantity:1,notes:'Red grip'}]}]}],applied:{groups:[{id:group,patch:{size:1}}],item_patches:[{id:sword,quantity:1}]}}}));
 must(await users[0].api.rpc('submit_battle_report',{p_match_id:match,p_warband_id:bands[0],p_report:{result:'won',applied:{}}}));
 browser=await chromium.launch();const pages=[],errors=[];
 for(let i=0;i<2;i++){
  const page=await browser.newPage({viewport:{width:i?1200:390,height:900},isMobile:!i,hasTouch:!i});page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5193/sign-in');await page.getByLabel('Email',{exact:true}).fill(users[i].email);await page.getByLabel('Password',{exact:true}).fill(users[i].password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('http://127.0.0.1:5193/');pages.push(page);
 }
 const [captor,victim]=pages;
 await captor.goto(`http://127.0.0.1:5193/warbands/${bands[0]}`);
 await captor.getByRole('group',{name:'Throne of Worms D6',exact:true}).getByRole('button',{name:'Roll D6',exact:true}).click();
 const die=captor.getByLabel('Throne of Worms D6 result',{exact:true});await expect(die).toHaveValue(/[1-6]/);const original=Number(await die.inputValue());const edited=original===4?3:4;await die.fill(String(edited));
 await expect(captor.getByText(`App rolled ${original}; changed to ${edited}. This stays in the record.`,{exact:true})).toBeVisible();
 expect(await captor.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await captor.getByRole('heading',{name:'Throne of Worms',exact:true}).scrollIntoViewIfNeeded();await captor.screenshot({path:'/tmp/stirheim-henchman-throne-mobile.png'});
 await captor.getByRole('button',{name:'Propose to the player of Victim warband',exact:true}).click();
 await expect(captor.getByText('Your proposal, awaiting the other player',{exact:true})).toBeVisible();
 expect(must(await admin.from('henchman_groups').select('id').eq('warband_id',bands[0]))).toHaveLength(0);
 await victim.goto(`http://127.0.0.1:5193/warbands/${bands[1]}`);
 await expect(victim.getByText(new RegExp(`app rolled ${original}; player changed this to ${edited}`)).first()).toBeVisible();
 await victim.getByRole('button',{name:'Accept and apply to both rosters',exact:true}).click();
 await expect(victim.getByText('Outcome recorded',{exact:true})).toBeVisible();
 await captor.reload();await expect(captor.getByText('Outcome recorded',{exact:true})).toBeVisible();
 expect(must(await admin.from('henchman_groups').select('size,xp,unit_type_rules_id').eq('warband_id',bands[0]))).toEqual([{size:1,xp:0,unit_type_rules_id:'cursed_cavalcade_captured_thrall'}]);
 expect(must(await admin.from('henchman_groups').select('size').eq('id',group).single()).size).toBe(1);
 expect(must(await admin.from('items').select('quantity,notes').eq('warband_id',bands[0]).eq('holder_type','stash').eq('item_rules_id','sword'))).toEqual([{quantity:1,notes:'Red grip'}]);
 expect(errors).toEqual([]);console.log('PASS: mobile app die → edit → separate-player consent → one Thrall, exact kit, no second casualty.');
}finally{
 await browser?.close();if(match){await admin.from('captive_cases').delete().eq('match_id',match);await admin.from('battle_events').delete().eq('match_id',match);await admin.from('matches').delete().eq('id',match);}if(campaign)await admin.from('campaigns').delete().eq('id',campaign);if(bands.length)await admin.from('warbands').delete().in('id',bands);for(const user of users){await admin.from('app_notifications').delete().eq('user_id',user.id);must(await admin.auth.admin.deleteUser(user.id));}
}

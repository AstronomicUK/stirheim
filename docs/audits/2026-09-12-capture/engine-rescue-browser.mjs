import {chromium,expect} from '@playwright/test';
import {createClient} from '@supabase/supabase-js';
import {execFileSync,spawn} from 'node:child_process';
const cwd='/Users/tombrookes/Documents/Claude Scripts/stirheim';
const raw=execFileSync('npx',['supabase','status','-o','env'],{cwd,env:{...process.env,DOCKER_HOST:'unix:///Users/tombrookes/.docker/run/docker.sock'},encoding:'utf8',stdio:['ignore','pipe','pipe']});
const env=Object.fromEntries([...raw.matchAll(/^(\w+)="(.*)"$/gm)].map(m=>[m[1],m[2]]));
if(!/^http:\/\/(127\.0\.0\.1|localhost):/.test(env.API_URL))throw Error('Local only');
const admin=createClient(env.API_URL,env.SERVICE_ROLE_KEY),users=[],bands=[];
const must=r=>{if(r.error)throw Error(r.error.message);return r.data};
let browser,campaign,match;
const dockerEnv={...process.env,DOCKER_HOST:'unix:///Users/tombrookes/.docker/run/docker.sock'};
async function holdMatchRow(id){
 const child=spawn('docker',['exec','-i','supabase_db_stirheim','psql','-U','postgres','-d','postgres','-qAt','-v','ON_ERROR_STOP=1'],{env:dockerEnv});
 let output='',errors='';child.stderr.on('data',chunk=>errors+=chunk);
 const exited=new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error(errors||`Lock process exited ${code}`)));});
 const ready=new Promise((resolve,reject)=>{child.stdout.on('data',chunk=>{output+=chunk;if(output.includes('LOCKED'))resolve();});child.once('error',reject);child.once('exit',()=>{if(!output.includes('LOCKED'))reject(Error(errors||'Lock was not acquired'));});});
 child.stdin.write(`BEGIN; SELECT id FROM public.matches WHERE id='${id}' FOR UPDATE; SELECT 'LOCKED';\n`);
 await ready;
 return {release:async()=>{child.stdin.end('COMMIT;\n');await exited;}};
}

try {
 for(let i=0;i<3;i++){
  const email=`engine-browser-${crypto.randomUUID()}@stirheim.test`,password=crypto.randomUUID();
  const {user}=must(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:`Engine player ${i}`}}));
  const api=createClient(env.API_URL,env.ANON_KEY,{auth:{persistSession:false}});must(await api.auth.signInWithPassword({email,password}));users.push({id:user.id,email,password,api});
 }
 for(let i=0;i<2;i++)bands.push(must(await admin.from('warbands').insert({owner_id:users[i].id,name:i?'Engine Victims QA':'Engine Captors QA',type_rules_id:i?'mercenaries_reikland':'black_dwarfs',gold:100}).select('id').single()).id);
 campaign=must(await admin.from('campaigns').insert({name:'Disposable two-player Engine QA',gm_id:users[2].id,settings:{reportApproval:false}}).select('id').single()).id;
 must(await admin.from('campaign_members').insert(bands.map((warband_id,i)=>({campaign_id:campaign,warband_id,user_id:users[i].id}))));
 match=must(await admin.from('matches').insert({campaign_id:campaign,created_by:users[2].id,state:'awaiting_reports',scenario_rules_id:'skirmish'}).select('id').single()).id;
 must(await admin.from('match_participants').insert(bands.map(warband_id=>({match_id:match,warband_id,accepted_at:new Date().toISOString()}))));
 const escort=must(await admin.from('heroes').insert({warband_id:bands[0],name:'Zhatan the Escort',unit_type_rules_id:'black_dwarfs_sorcerer',status:'active',stats:{M:3,WS:4,BS:3,S:3,T:4,W:1,I:2,A:1,Ld:9},xp:23}).select('id').single()).id;
 const hero=must(await admin.from('heroes').insert({warband_id:bands[1],name:'Grukk the Captive',is_hired_sword:true,hired_sword_rules_id:'ogre_bodyguard',unit_type_rules_id:null,is_large:false,status:'active',stats:{M:6,WS:3,BS:2,S:4,T:4,W:3,I:3,A:2,Ld:7},xp:12}).select('id').single()).id;
 must(await admin.from('items').insert([{warband_id:bands[1],holder_type:'hero',holder_id:hero,item_rules_id:'sword',quantity:1,notes:'Carved family name'},{warband_id:bands[1],holder_type:'hero',holder_id:hero,item_rules_id:'dagger',quantity:2,notes:'Notched'}]));
 const stock=must(await admin.from('items').insert({warband_id:bands[0],holder_type:'stash',item_rules_id:'engine_of_chaos',quantity:1}).select('id').single()).id;
 const engine=must(await admin.from('engine_of_chaos_units').select('id').eq('inventory_item_id',stock).single()).id;
 must(await users[1].api.rpc('submit_battle_report',{p_match_id:match,p_warband_id:bands[1],p_report:{result:'lost',injuries:[{subjectType:'hero',subjectId:hero,subjectName:'Grukk the Captive',rolls:[61],outcome:'captured',injuryCode:'captured',injuryName:'Captured',effect:''}],applied:{heroes:[{id:hero,patch:{status:'captured',flags:{captured:true}}}]}}}));
 must(await users[0].api.rpc('submit_battle_report',{p_match_id:match,p_warband_id:bands[0],p_report:{result:'won',applied:{}}}));
 browser=await chromium.launch();const pages=[],errors=[];
 for(let i=0;i<2;i++){
  const context=await browser.newContext({viewport:{width:i?390:1200,height:900},isMobile:!!i,hasTouch:!!i});const p=await context.newPage();p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:5193/sign-in');await p.getByLabel('Email',{exact:true}).fill(users[i].email);await p.getByLabel('Password',{exact:true}).fill(users[i].password);await p.getByRole('button',{name:'Sign in',exact:true}).click();await p.waitForURL('http://127.0.0.1:5193/');pages.push(p);
 }
 const [captor,victim]=pages;
 await captor.goto(`http://127.0.0.1:5193/warbands/${bands[0]}`);
 await captor.getByRole('button',{name:'Choose an engine',exact:true}).click();
 await expect(captor.getByText(/Large captive · two places/)).toBeVisible();
 await captor.getByRole('radio',{name:/Engine of Chaos/}).check();
 await expect(captor.getByText('Carved family name',{exact:true})).toBeVisible();
 await captor.getByRole('button',{name:'Propose imprisonment',exact:true}).click();
 await expect(captor.getByRole('dialog')).toHaveCount(0);
 expect(must(await admin.from('items').select('id').eq('holder_id',hero))).toHaveLength(2);
 expect(must(await admin.from('engine_prisoners').select('id').eq('engine_id',engine))).toHaveLength(0);
 await victim.goto(`http://127.0.0.1:5193/warbands/${bands[1]}`);
 await expect(victim.getByText(/taking two places \(Large\) \(2 of 6 used\)/)).toBeVisible();
 await victim.getByRole('button',{name:'Accept and apply to both rosters',exact:true}).click();
 await expect(victim.getByText('Imprisoned in an Engine of Chaos',{exact:true})).toBeVisible();
 await expect(victim.getByRole('combobox',{name:'Outcome',exact:true})).toHaveCount(0);
 expect(must(await admin.from('heroes').select('status,is_hired_sword').eq('id',hero).single())).toEqual({status:'captured',is_hired_sword:true});
 expect(must(await admin.from('items').select('id').eq('holder_id',hero))).toHaveLength(0);
 await captor.reload();
 await expect(captor.getByRole('img',{name:'2 of 6 places occupied. Large captives use two places.'})).toBeVisible();
 await captor.getByRole('button',{name:/Grukk the Captive.*2 places/}).click();
 await expect(captor.getByRole('dialog').getByText('Carved family name',{exact:true})).toBeVisible();
 await captor.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).click();
 await captor.getByRole('button',{name:'View history',exact:true}).click();
 await captor.getByLabel('Engine name',{exact:true}).fill('The Iron Maw');
 await captor.getByRole('button',{name:'Save name',exact:true}).click();
 await expect(captor.getByRole('dialog')).toHaveCount(0);
 await expect(captor.getByRole('heading',{name:'The Iron Maw',exact:true})).toBeVisible();
 expect(must(await admin.from('engine_of_chaos_units').select('id,name').eq('inventory_item_id',stock).single())).toEqual({id:engine,name:'The Iron Maw'});
 const rescueMatch=must(await admin.from('matches').insert({campaign_id:campaign,created_by:users[2].id,state:'in_progress',scenario_rules_id:'skirmish'}).select('id').single()).id;
 must(await admin.from('match_participants').insert(bands.map(warband_id=>({match_id:rescueMatch,warband_id,accepted_at:new Date().toISOString()}))));
 must(await admin.from('heroes').update({unit_type_rules_id:'black_dwarfs_gaolers',name:'Gaoler Drazh'}).eq('id',escort));
 const rescuer=must(await admin.from('heroes').insert({warband_id:bands[1],name:'Rescuer Karl',unit_type_rules_id:'mercenaries_reikland_captain',status:'active',stats:{M:4,WS:4,BS:4,S:3,T:3,W:1,I:4,A:1,Ld:8},xp:20}).select('id').single()).id;
 await victim.goto(`http://127.0.0.1:5193/matches/${rescueMatch}/battle`);
 await victim.getByRole('button',{name:'View prisoners and rescue',exact:true}).click();
 await victim.getByLabel('Gaoler',{exact:true}).selectOption(escort);
 await victim.getByLabel('Who now has the keys?',{exact:true}).selectOption(rescuer);
 await victim.getByLabel('What happened at the table?',{exact:true}).fill('Karl took Gaoler Drazh out of action and took the keys.');
 await victim.getByRole('button',{name:'Record confirmed event',exact:true}).click();
 await expect.poll(async()=>must(await admin.from('engine_rescue_battles').select('revision').eq('match_id',rescueMatch).single()).revision).toBe(1);
 await victim.getByLabel('What happened?',{exact:true}).selectOption('free');
 await victim.getByLabel('Current key holder',{exact:true}).selectOption(rescuer);
 await victim.getByText('The key holder is in base contact with this Engine.',{exact:true}).click();
 await victim.getByLabel('What happened at the table?',{exact:true}).fill('Karl reached base contact and opened the prison.');
 await victim.getByRole('button',{name:'Record confirmed event',exact:true}).click();
 await expect.poll(async()=>must(await admin.from('engine_rescue_battles').select('state').eq('match_id',rescueMatch).single()).state.prisoners[0].state).toBe('freed');
 const prisoner=must(await admin.from('engine_prisoners').select('id').eq('engine_id',engine).eq('state','held').single());
 await victim.getByLabel('What happened?',{exact:true}).selectOption('escaped');
 await victim.getByLabel('Escaped prisoner',{exact:true}).selectOption(prisoner.id);
 await victim.getByLabel('What happened at the table?',{exact:true}).fill('Grukk reached the nearest table edge.');
 await victim.getByRole('button',{name:'Record confirmed event',exact:true}).click();
 await expect.poll(async()=>must(await admin.from('engine_rescue_battles').select('state').eq('match_id',rescueMatch).single()).state.prisoners[0].state).toBe('escaped');
 await victim.getByText('Correct a recorded event',{exact:true}).click();
 await victim.getByLabel('Reason for correction',{exact:true}).fill('The first escape was recorded too early.');
 await victim.getByRole('button',{name:'Undo latest rescue event',exact:true}).click();
 await expect.poll(async()=>must(await admin.from('engine_rescue_battles').select('state').eq('match_id',rescueMatch).single()).state.prisoners[0].state).toBe('freed');
 await victim.getByLabel('What happened at the table?',{exact:true}).fill('Grukk has now reached the nearest table edge.');
 await victim.getByRole('button',{name:'Record confirmed event',exact:true}).click();
 await expect.poll(async()=>must(await admin.from('engine_rescue_battles').select('state').eq('match_id',rescueMatch).single()).state.prisoners[0].state).toBe('escaped');

 expect(must(await admin.from('heroes').select('status').eq('id',hero).single()).status).toBe('captured');
 must(await users[0].api.rpc('submit_battle_report',{p_match_id:rescueMatch,p_warband_id:bands[0],p_report:{result:'lost',applied:{}}}));
 must(await users[1].api.rpc('submit_battle_report',{p_match_id:rescueMatch,p_warband_id:bands[1],p_report:{result:'won',applied:{}}}));
 const rescue=must(await admin.from('engine_rescue_battles').select('id').eq('match_id',rescueMatch).single());
 await victim.goto(`http://127.0.0.1:5193/matches/${rescueMatch}/battle`);
 await victim.getByRole('button',{name:'Prisoners and rescue',exact:true}).click();
 await victim.getByRole('button',{name:'Propose return to former warband',exact:true}).click();
 await expect(victim.getByRole('link',{name:'Review the proposed return',exact:true})).toBeVisible();
 const proposal=must(await admin.from('captive_proposals').select('id').eq('choice->>rescueId',rescue.id).eq('state','proposed').single()).id;
 expect(must(await admin.from('heroes').select('status').eq('id',hero).single()).status).toBe('captured');
 await captor.goto(`http://127.0.0.1:5193/warbands/${bands[0]}`);
 await captor.getByRole('button',{name:'Accept and apply to both rosters',exact:true}).click();
 await expect.poll(async()=>must(await admin.from('heroes').select('status').eq('id',hero).single()).status).toBe('active');
 expect(must(await admin.from('items').select('id').eq('holder_id',hero))).toHaveLength(0);
 expect(must(await admin.from('items').select('quantity').eq('warband_id',bands[0]).eq('item_rules_id','sword'))).toEqual([{quantity:1}]);
 expect(must(await admin.from('engine_prisoners').select('state').eq('id',prisoner.id).single()).state).toBe('freed');
 const originalCase=must(await admin.from('captive_proposals').select('case_id').eq('id',proposal).single());
 must(await users[2].api.rpc('reverse_captive_resolution',{p_case_id:originalCase.case_id,p_reason:'QA correction of the recorded escape',p_release_only:false}));
 expect(must(await admin.from('heroes').select('status').eq('id',hero).single()).status).toBe('captured');
 expect(must(await admin.from('engine_prisoners').select('state').eq('id',prisoner.id).single()).state).toBe('held');
 expect(must(await admin.from('captive_cases').select('state').eq('id',originalCase.case_id).single()).state).toBe('held');
 expect(await victim.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
 await victim.screenshot({path:'/tmp/stirheim-engine-rescue-mobile.png',fullPage:true});
 console.log('PASS: separate mobile player records Gaoler keys, confirmed contact, release and escape; agreed post-battle return preserves confiscated kit, and GM reversal restores custody.');
} finally {
 await browser?.close();
 if(bands.length)must(await admin.from('engine_journeys').delete().in('warband_id',bands));
 if(match){must(await admin.from('captive_cases').delete().eq('match_id',match));must(await admin.from('engine_prisoners').delete().in('holder_warband_id',bands));must(await admin.from('matches').delete().eq('campaign_id',campaign));}
 if(campaign)must(await admin.from('campaigns').delete().eq('id',campaign));if(bands.length)must(await admin.from('warbands').delete().in('id',bands));
 for(const user of users){must(await admin.from('app_notifications').delete().eq('user_id',user.id));await user.api.auth.signOut();must(await admin.auth.admin.deleteUser(user.id));}
}

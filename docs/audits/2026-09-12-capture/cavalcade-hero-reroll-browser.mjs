import {chromium,expect} from '/Users/tombrookes/Documents/Claude Scripts/stirheim/node_modules/@playwright/test/index.mjs';
import {createClient} from '/Users/tombrookes/Documents/Claude Scripts/stirheim/node_modules/@supabase/supabase-js/dist/index.mjs';
import {execFileSync} from 'node:child_process';
const raw=execFileSync('npx',['supabase','status','-o','env'],{cwd:'/Users/tombrookes/Documents/Claude Scripts/stirheim',env:{...process.env,DOCKER_HOST:'unix:///Users/tombrookes/.docker/run/docker.sock'},encoding:'utf8',stdio:['ignore','pipe','pipe']});
const env=Object.fromEntries([...raw.matchAll(/^(\w+)="(.*)"$/gm)].map(m=>[m[1],m[2]]));
if(!/^http:\/\/(127\.0\.0\.1|localhost):/.test(env.API_URL))throw Error('Local only');
const admin=createClient(env.API_URL,env.SERVICE_ROLE_KEY),player=createClient(env.API_URL,env.ANON_KEY);
const auth=await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'});if(auth.error)throw auth.error;
const uid=auth.data.user.id,ids=[];let campaign,b;
const must=r=>{if(r.error)throw Error(r.error.message);return r.data};
let match;
try {
 for(const name of ['Scenario Rewards QA','Scenario Opponent QA']) ids.push(must(await player.rpc('create_warband',{payload:{name,type_rules_id:name==='Scenario Rewards QA'?'the_cursed_cavalcade':'mercenaries_reikland',gold:100,heroes:[],henchman_groups:[],stash:[]}})));
 campaign=must(await admin.from('campaigns').insert({name:'Disposable Scenario Rewards QA',gm_id:uid}).select('id').single()).id;
 must(await admin.from('campaign_members').insert(ids.map(warband_id=>({campaign_id:campaign,warband_id,user_id:uid}))));
 match=must(await admin.from('matches').insert({campaign_id:campaign,created_by:uid,state:'in_progress',scenario_rules_id:'hidden_treasure'}).select('id').single()).id;
 must(await admin.from('match_participants').insert(ids.map(warband_id=>({match_id:match,warband_id,accepted_at:new Date().toISOString()}))));
 b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>{errors.push(e.message); console.error(e.message)});
 await p.goto('http://127.0.0.1:5193/sign-in');await p.getByLabel('Email',{exact:true}).fill('player@stirheim.test');await p.getByLabel('Password',{exact:true}).fill('stirheim-dev');await p.getByRole('button',{name:'Sign in',exact:true}).click();await p.waitForURL('http://127.0.0.1:5193/');

 const heroes=must(await admin.from('heroes').insert(ids.map((warband_id,i)=>({warband_id,name:i?'QA Defender':'QA Captain',unit_type_rules_id:i?'mercenaries_reikland_captain':'cursed_cavalcade_aristocrat',is_hired_sword:false,status:'active',skills:[],flags:{},xp:20,level_ups:8,stats:{M:4,WS:4,BS:3,S:3,T:4,W:1,I:3,A:1,Ld:8}}))).select('id,warband_id'));
 must(await admin.from('items').insert(heroes.flatMap(h=>['misericordia','dagger'].map(item_rules_id=>({warband_id:h.warband_id,holder_type:'hero',holder_id:h.id,item_rules_id,quantity:2})))));
 must(await admin.from('heroes').insert({warband_id:ids[0],name:'QA Friend',unit_type_rules_id:'mercenaries_reikland_champion',is_hired_sword:false,status:'active',skills:[],flags:{},xp:8,level_ups:4,stats:{M:4,WS:4,BS:3,S:3,T:4,W:1,I:3,A:1,Ld:8}}).select('id').single());
 const thralls=must(await admin.from('henchman_groups').insert({warband_id:ids[0],name:'Five Thralls',unit_type_rules_id:'cursed_cavalcade_captured_thrall',size:5,xp:0,stats:{M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:5}}).select('id').single());
 const target=heroes.find(h=>h.warband_id===ids[1]);
 await p.goto(`http://127.0.0.1:5193/matches/${match}/report/${ids[1]}`);
 await expect(p.getByRole('radio',{name:'Lost',exact:true})).toBeVisible();
 const key=`stirheim.report.${match}.${ids[1]}`;
 await expect.poll(()=>p.evaluate(key=>!!localStorage.getItem(key),key)).toBe(true);
 await p.evaluate(({key,hero})=>{const saved=JSON.parse(localStorage.getItem(key));saved.state.draft={...saved.state.draft,step:2,result:'lost',heroesOut:[hero],heroInjuries:{[hero]:{rolls:[{d66:61,subRoll:null,source:'app'}],countRoll:null}}};localStorage.setItem(key,JSON.stringify(saved));},{key,hero:target.id});
 await p.reload();
 await expect(p.getByText(/Roll another D66/)).toBeVisible();
 await p.getByLabel('Tens',{exact:true}).fill('4');await p.getByLabel('Units',{exact:true}).fill('1');
 await p.getByRole('button',{name:'Confirm roll',exact:true}).click();
 await expect(p.getByText('Recovered',{exact:true}).first()).toBeVisible();
 // Removing the cap later must not resurrect the rejected 61 on reload.
 must(await admin.from('henchman_groups').update({size:4}).eq('id',thralls.id));
 await p.reload();await expect(p.getByText('Recovered',{exact:true}).first()).toBeVisible();
 const saved=await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).state.draft,key);
 expect(saved.heroInjuries[target.id].rolls[0].captureRerollReason).toContain('five');
 expect(saved.heroInjuries[target.id].rolls[0].source).toBe('app');
 expect(saved.heroInjuries[target.id].rolls.map(r=>r.d66)).toEqual([61,41]);
 expect(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await p.screenshot({path:'/tmp/stirheim-cavalcade-hero-reroll-mobile.png',fullPage:true});
 expect(errors).toEqual([]);console.log('PASS: mobile Hero 61 capacity reroll, original app provenance and stable recovery after a later capacity change.');
}finally{await b?.close();if(match){const cases=must(await admin.from('captive_cases').select('id').eq('match_id',match));for(const c of cases)await admin.from('app_notifications').delete().like('dedupe_key',`captive:${c.id}:%`);await admin.from('captive_cases').delete().eq('match_id',match);await admin.from('matches').delete().eq('id',match);}if(campaign)await admin.from('campaigns').delete().eq('id',campaign);if(ids.length)await admin.from('warbands').delete().in('id',ids);await player.auth.signOut();}

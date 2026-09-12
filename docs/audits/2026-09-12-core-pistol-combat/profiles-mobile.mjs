import {chromium,expect} from '/Users/tombrookes/Documents/Claude Scripts/stirheim/node_modules/@playwright/test/index.mjs';
import {createClient} from '/Users/tombrookes/Documents/Claude Scripts/stirheim/node_modules/@supabase/supabase-js/dist/index.mjs';
import {execFileSync} from 'node:child_process';
const raw=execFileSync('npx',['supabase','status','-o','env'],{cwd:'/Users/tombrookes/Documents/Claude Scripts/stirheim',env:{...process.env,DOCKER_HOST:'unix:///Users/tombrookes/.docker/run/docker.sock'},encoding:'utf8',stdio:['ignore','pipe','pipe']});
const env=Object.fromEntries([...raw.matchAll(/^(\w+)="(.*)"$/gm)].map(m=>[m[1],m[2]]));
const admin=createClient(env.API_URL,env.SERVICE_ROLE_KEY),player=createClient(env.API_URL,env.ANON_KEY);
const auth=await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'});if(auth.error)throw auth.error;
const uid=auth.data.user.id,ids=[];let campaign,b;
const must=r=>{if(r.error)throw Error(r.error.message);return r.data};
let match;
try {
 for(const name of ['Scenario Rewards QA','Scenario Opponent QA']) ids.push(must(await player.rpc('create_warband',{payload:{name,type_rules_id:'mercenaries_reikland',gold:100,heroes:[],henchman_groups:[],stash:[]}})));
 campaign=must(await admin.from('campaigns').insert({name:'Disposable Scenario Rewards QA',gm_id:uid}).select('id').single()).id;
 must(await admin.from('campaign_members').insert(ids.map(warband_id=>({campaign_id:campaign,warband_id,user_id:uid}))));
 match=must(await admin.from('matches').insert({campaign_id:campaign,created_by:uid,state:'in_progress',scenario_rules_id:'hidden_treasure'}).select('id').single()).id;
 must(await admin.from('match_participants').insert(ids.map(warband_id=>({match_id:match,warband_id,accepted_at:new Date().toISOString()}))));
 b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>{errors.push(e.message); console.error(e.message)});
 await p.goto('http://localhost:5175/sign-in');await p.getByLabel('Email',{exact:true}).fill('player@stirheim.test');await p.getByLabel('Password',{exact:true}).fill('stirheim-dev');await p.getByRole('button',{name:'Sign in',exact:true}).click();await p.waitForURL('http://localhost:5175/');

 const heroes=must(await admin.from('heroes').insert(ids.map((warband_id,i)=>({warband_id,name:i?'QA Defender':'QA Captain',unit_type_rules_id:'mercenaries_reikland_captain',is_hired_sword:false,status:'active',flags:{},xp:20,level_ups:8,stats:{M:4,WS:4,BS:3,S:3,T:4,W:1,I:3,A:3,Ld:8}}))).select('id,warband_id'));
 must(await admin.from('items').insert(heroes.flatMap(h=>['pistol','dagger','crossbow_pistol'].map(item_rules_id=>({warband_id:h.warband_id,holder_type:'hero',holder_id:h.id,item_rules_id,quantity:2})))));
 must(await admin.from('heroes').insert({warband_id:ids[0],name:'QA Friend',unit_type_rules_id:'mercenaries_reikland_champion',is_hired_sword:false,status:'active',flags:{},xp:8,level_ups:4,stats:{M:4,WS:4,BS:3,S:3,T:4,W:1,I:3,A:3,Ld:8}}).select('id').single());
 await p.goto(`http://localhost:5175/matches/${match}/battle`);
 await p.getByRole('combobox',{name:'Playing as',exact:true}).selectOption(ids[0]);
 await p.getByRole('button',{name:'Melee Attack',exact:false}).first().click();
 await p.getByRole('button',{name:'Roll it through',exact:true}).click();
 const dialog=p.getByRole('dialog');
 await dialog.getByRole('combobox',{name:'Weapon',exact:true}).selectOption({label:'Dagger (1)'});
 await dialog.getByRole('combobox',{name:'Other hand',exact:true}).selectOption({label:'Pistol (close combat)'});
 await dialog.getByLabel('Why this is a new combat',{exact:true}).fill('Opening charge');
 await dialog.getByRole('button',{name:'Confirm new combat',exact:true}).click();
 await expect(dialog).toContainText('4 attacks this phase');
 await dialog.getByRole('button',{name:'Begin attacks',exact:true}).click();
 const state=async()=>must(await admin.from('battle_sessions').select('live_state').eq('match_id',match).eq('warband_id',ids[0]).maybeSingle())?.live_state;
 await expect.poll(async()=>(await state())?.pistolCombatUses?.length).toBe(0);
 for(const label of ['First','Second','Third']) {
  await dialog.getByText('Enter tabletop dice instead',{exact:true}).click();
  await dialog.getByRole('button',{name:`${label} attack (Dagger): to hit: 1`,exact:true}).click();
 }
 await expect.poll(async()=>(await state())?.pistolCombatUses?.length).toBe(1);
 await dialog.getByText('Enter tabletop dice instead',{exact:true}).click();
 await dialog.getByRole('button',{name:'Fourth attack (Pistol (close combat)): to hit: 1',exact:true}).click();
 await dialog.getByRole('button',{name:'Close',exact:true}).last().click();
 await p.getByRole('button',{name:'Roll it through',exact:true}).click();
 await dialog.getByRole('combobox',{name:'Weapon',exact:true}).selectOption({label:'Crossbow Pistol (opening shot)'});
 await expect(dialog).toContainText('1 attack this phase');
 console.log(await dialog.innerText());
 await dialog.getByRole('button',{name:'Begin attacks',exact:true}).click();
 await dialog.getByText('Enter tabletop dice instead',{exact:true}).click();
 await dialog.getByRole('button',{name:'Crossbow Pistol (opening shot): to hit: 1',exact:true}).click();
 await expect.poll(async()=>(await state())?.pistolCombatUses?.length).toBe(2);
 await expect.poll(async()=>(await state())?.blackpowderShots?.length).toBe(1);
 console.log('PASS: A3 ordinary attacks plus one pistol; pistol use starts only when reached; crossbow opener is separate one-attack BS profile and does not spend blackpowder.');
 if(errors.length)throw Error(errors.join('\n'));

} finally {await b?.close();if(match)await admin.from('matches').delete().eq('id',match);if(campaign)await admin.from('campaigns').delete().eq('id',campaign);if(ids.length)await admin.from('warbands').delete().in('id',ids);await player.auth.signOut();}

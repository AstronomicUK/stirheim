import {chromium,expect} from '/Users/tombrookes/Documents/Claude Scripts/stirheim/node_modules/@playwright/test/index.mjs';
import {createClient} from '/Users/tombrookes/Documents/Claude Scripts/stirheim/node_modules/@supabase/supabase-js/dist/index.mjs';
import {execFileSync} from 'node:child_process';import {randomUUID} from 'node:crypto';
const cwd='/Users/tombrookes/Documents/Claude Scripts/stirheim';const raw=execFileSync('npx',['supabase','status','-o','env'],{cwd,env:{...process.env,DOCKER_HOST:'unix:///Users/tombrookes/.docker/run/docker.sock'},encoding:'utf8',stdio:['ignore','pipe','pipe']});const env=Object.fromEntries([...raw.matchAll(/^(\w+)="(.*)"$/gm)].map(m=>[m[1],m[2]]));if(!/^http:\/\/(127\.0\.0\.1|localhost):/.test(env.API_URL))throw Error('Local only');
const admin=createClient(env.API_URL,env.SERVICE_ROLE_KEY),check=r=>{if(r.error)throw Error(r.error.message);return r.data};const users=[],bands=[];let campaign,match,b;
try {
 const password=randomUUID();
 for(let i=0;i<3;i++){const email=`awakening-ui-${randomUUID()}@stirheim.test`;const {user}=check(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:'Awakening UI'}}));const client=createClient(env.API_URL,env.ANON_KEY);check(await client.auth.signInWithPassword({email,password}));users.push({id:user.id,email,client})}
 for(let i=0;i<3;i++)bands.push(check(await admin.from('warbands').insert({owner_id:users[i].id,name:i?`Awakening UI Undead ${i}`:'Awakening UI Victim',type_rules_id:i?'the_undead':'mercenaries_reikland',gold:0}).select('id').single()).id);
 campaign=check(await admin.from('campaigns').insert({gm_id:users[0].id,name:'Disposable Awakening UI'}).select('id').single()).id;check(await admin.from('campaign_members').insert(bands.map((warband_id,i)=>({campaign_id:campaign,warband_id,user_id:users[i].id}))));match=check(await admin.from('matches').insert({campaign_id:campaign,created_by:users[0].id,state:'awaiting_reports'}).select('id').single()).id;check(await admin.from('match_participants').insert(bands.map(warband_id=>({match_id:match,warband_id,accepted_at:new Date().toISOString()}))));
 const stats={M:4,WS:4,BS:3,S:4,T:3,W:1,I:4,A:2,Ld:8};const hero=check(await admin.from('heroes').insert({warband_id:bands[0],name:'Fallen UI Captain',unit_type_rules_id:'mercenaries_reikland_captain',stats,xp:20}).select('id').single()).id;for(const band of bands.slice(1))check(await admin.from('heroes').insert({warband_id:band,name:'UI Necromancer',unit_type_rules_id:'undead_necromancer',stats,xp:8,spells:['spell_of_awakening']}));const item=check(await admin.from('items').insert({warband_id:bands[0],holder_type:'hero',holder_id:hero,item_rules_id:'sword',quantity:1}).select('id').single()).id;
 check(await users[0].client.rpc('submit_battle_report',{p_match_id:match,p_warband_id:bands[0],p_report:{result:'lost',injuries:[{subjectType:'hero',subjectId:hero,subjectName:'Fallen UI Captain',rolls:[11],outcome:'dead'}],applied:{heroes:[{id:hero,patch:{status:'dead'}}],remove_item_ids:[item]}}}));check(await users[1].client.rpc('submit_battle_report',{p_match_id:match,p_warband_id:bands[1],p_report:{result:'won',applied:{}}}));

 check(await users[2].client.rpc('submit_battle_report',{p_match_id:match,p_warband_id:bands[2],p_report:{result:'lost',applied:{}}}));
 b=await chromium.launch();const errors=[];
 async function login(i){const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:5193/sign-in');await p.getByLabel('Email',{exact:true}).fill(users[i].email);await p.getByLabel('Password',{exact:true}).fill(password);await p.getByRole('button',{name:'Sign in',exact:true}).click();await p.waitForURL('http://127.0.0.1:5193/');await p.goto(`http://127.0.0.1:5193/warbands/${bands[i]}`);return p;}
 const first=await login(1);await expect(first.getByRole('button',{name:'Raise as a Zombie',exact:true})).toBeDisabled();
 const source=await login(0);
 await source.getByRole('combobox',{name:'Agreed Awakening recipient'}).selectOption({label:'Awakening UI Undead 2'});
 await source.getByRole('button',{name:'Record agreed recipient',exact:true}).click();
 await expect(source.getByText(/players agreed that Awakening UI Undead 2 may use Spell of Awakening/).first()).toBeVisible();
 await first.reload();await expect(first.getByRole('button',{name:'Raise as a Zombie',exact:true})).toBeDisabled();
 const chosen=await login(2);await chosen.getByRole('button',{name:'Raise as a Zombie',exact:true}).click();await chosen.getByRole('button',{name:'Raise as a Zombie',exact:true}).click();
 await expect(chosen.getByText('Awakening recorded',{exact:true})).toBeVisible();
 expect(check(await admin.from('henchman_groups').select('id').eq('warband_id',bands[1]))).toHaveLength(0);
 expect(check(await admin.from('henchman_groups').select('name').eq('warband_id',bands[2]))).toEqual([{name:'Fallen UI Captain (Zombie)'}]);
 expect(await source.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
 console.log('PASS: mobile source owner records agreed recipient; unchosen caster stays blocked and chosen caster raises the Hero.');
} finally {if(b)await b.close();if(match){await admin.from('awakening_offers').delete().eq('match_id',match);await admin.from('matches').delete().eq('id',match)}if(campaign)await admin.from('campaigns').delete().eq('id',campaign);if(bands.length)await admin.from('warbands').delete().in('id',bands);for(const u of users)await admin.auth.admin.deleteUser(u.id)}

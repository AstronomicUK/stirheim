import {chromium,expect} from '/Users/tombrookes/Documents/Claude Scripts/stirheim/node_modules/@playwright/test/index.mjs';
import {createClient} from '/Users/tombrookes/Documents/Claude Scripts/stirheim/node_modules/@supabase/supabase-js/dist/index.mjs';
import {execFileSync} from 'node:child_process';
const raw=execFileSync('npx',['supabase','status','-o','env'],{cwd:'/Users/tombrookes/Documents/Claude Scripts/stirheim',env:{...process.env,DOCKER_HOST:'unix:///Users/tombrookes/.docker/run/docker.sock'},encoding:'utf8',stdio:['ignore','pipe','pipe']});
const env=Object.fromEntries([...raw.matchAll(/^(\w+)="(.*)"$/gm)].map(m=>[m[1],m[2]]));
if(!/^http:\/\/(127\.0\.0\.1|localhost):/.test(env.API_URL))throw Error('Local only');
const reloadRule=process.env.CHAMBER_RELOAD_RULE??'none';
if(!['none','full_reload'].includes(reloadRule))throw Error('Unsupported check mode');
const full=reloadRule==='full_reload';
const admin=createClient(env.API_URL,env.SERVICE_ROLE_KEY),player=createClient(env.API_URL,env.ANON_KEY);
const auth=await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'});if(auth.error)throw auth.error;
const uid=auth.data.user.id,ids=[];let campaign,b;
const must=r=>{if(r.error)throw Error(r.error.message);return r.data};
let match;
try {
 campaign=must(await admin.from('campaigns').insert({name:'Disposable reload settings',gm_id:uid}).select('id').single()).id;
 b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:5193/sign-in');await p.getByLabel('Email',{exact:true}).fill('player@stirheim.test');await p.getByLabel('Password',{exact:true}).fill('stirheim-dev');await p.getByRole('button',{name:'Sign in',exact:true}).click();await p.waitForURL('http://127.0.0.1:5193/');
 await p.goto(`http://127.0.0.1:5193/campaigns/${campaign}/settings`);
 for(const policy of ['full_reload','extra_chamber','none']) {
  await p.getByRole('button',{name:'Rules & bans',exact:true}).click();
  await p.getByRole('combobox',{name:'Hunter / Pistolier: double-barrel reloads',exact:true}).selectOption(policy);
  await p.getByRole('button',{name:'Save changes',exact:true}).click();
  await expect.poll(async()=>must(await admin.from('campaigns').select('settings').eq('id',campaign).single()).settings.houseRules.doubleBarrelSkillReload).toBe(policy);
  await p.reload();await p.getByRole('button',{name:'Rules & bans',exact:true}).click();
  await expect(p.getByRole('combobox',{name:'Hunter / Pistolier: double-barrel reloads',exact:true})).toHaveValue(policy);
  expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 expect(errors).toEqual([]);console.log('PASS: mobile campaign settings save all three reload policies, reload correctly, and fit the viewport.');

} finally {await b?.close();if(match)must(await admin.from('matches').delete().eq('id',match));if(campaign)must(await admin.from('campaigns').delete().eq('id',campaign));if(ids.length)must(await admin.from('warbands').delete().in('id',ids));await player.auth.signOut();}

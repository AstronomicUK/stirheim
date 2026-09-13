import {chromium,expect} from '@playwright/test';
import {createClient} from '@supabase/supabase-js';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('../../..',import.meta.url));
const raw=execFileSync('npx',['supabase','status','-o','env'],{cwd,env:{...process.env,DOCKER_HOST:'unix:///Users/tombrookes/.docker/run/docker.sock'},encoding:'utf8',stdio:['ignore','pipe','pipe']});
const env=Object.fromEntries([...raw.matchAll(/^(\w+)="(.*)"$/gm)].map(m=>[m[1],m[2]]));
if(!/^http:\/\/(127\.0\.0\.1|localhost):/.test(env.API_URL))throw Error('Local only');
const admin=createClient(env.API_URL,env.SERVICE_ROLE_KEY);
const must=r=>{if(r.error)throw Error(r.error.message);return r.data};
let user,band,browser;
try{
 const email=`capacity-${crypto.randomUUID()}@stirheim.test`,password=crypto.randomUUID();
 user=must(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:'Disposable capacity QA'}})).user;
 band=must(await admin.from('warbands').insert({owner_id:user.id,name:'Disposable Cavalcade capacity',type_rules_id:'the_cursed_cavalcade',gold:100}).select('id').single()).id;
 const stats={M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:5};
 must(await admin.from('heroes').insert({warband_id:band,name:'Aristocrat',unit_type_rules_id:'cursed_cavalcade_aristocrat',status:'active',xp:20,stats:{...stats,WS:4,BS:4,I:4,Ld:8}}));
 must(await admin.from('henchman_groups').insert([...Array.from({length:3},(_,i)=>({warband_id:band,name:`Ordinary Thralls ${i+1}`,unit_type_rules_id:'cursed_cavalcade_thrall',size:4,xp:0,stats:{...stats,Ld:6}})),{warband_id:band,name:'Captured Thralls',unit_type_rules_id:'cursed_cavalcade_captured_thrall',size:5,xp:0,stats}]));
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5193/sign-in');await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('http://127.0.0.1:5193/');
 await page.goto(`http://127.0.0.1:5193/warbands/${band}/recruit`);
 await expect(page.getByText('+5 extra',{exact:true})).toBeVisible();
 await expect(page.getByText('13/13',{exact:false})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.screenshot({path:'/tmp/stirheim-cavalcade-capacity-mobile.png'});
 await page.setViewportSize({width:1280,height:900});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 expect(errors).toEqual([]);
 console.log('PASS: mobile and desktop show 13/13 +5 extra without overflow.');
}finally{
 await browser?.close();if(band)must(await admin.from('warbands').delete().eq('id',band));if(user)must(await admin.auth.admin.deleteUser(user.id));
}

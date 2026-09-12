import {chromium,expect} from '/Users/tombrookes/Documents/Claude Scripts/stirheim/node_modules/@playwright/test/index.mjs';
import {createClient} from '/Users/tombrookes/Documents/Claude Scripts/stirheim/node_modules/@supabase/supabase-js/dist/index.mjs';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
const cwd='/Users/tombrookes/Documents/Claude Scripts/stirheim';
const raw=execFileSync('npx',['supabase','status','-o','env'],{cwd,env:{...process.env,DOCKER_HOST:'unix:///Users/tombrookes/.docker/run/docker.sock'},encoding:'utf8',stdio:['ignore','pipe','pipe']});
const env=Object.fromEntries([...raw.matchAll(/^(\w+)="(.*)"$/gm)].map(m=>[m[1],m[2]]));
if(!/^http:\/\/(127\.0\.0\.1|localhost):/.test(env.API_URL))throw Error('Local only');
const admin=createClient(env.API_URL,env.SERVICE_ROLE_KEY);const must=r=>{if(r.error)throw Error(r.error.message);return r.data};
const tag=randomUUID().slice(0,8),password=randomUUID();const users=[];let browser;
try {
 for(const role of ['reporter','reviewer']) {
  const email=`${role}-${tag}@stirheim.test`;
  const {user}=must(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:`QA ${role}`}}));
  users.push({id:user.id,email});
 }
 must(await admin.from('app_notifications').insert([{user_id:users[0].id,title:'QA Capture request',body:'Agree what happens to the captured warrior.',href:'/feedback'},{user_id:users[0].id,title:'QA Fix released',body:'Your reported problem is fixed.',href:'/feedback'},{user_id:users[1].id,title:'Private other-player request',body:'This must not affect the first player’s count.',href:'/feedback'}]));
 browser=await chromium.launch();const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:5193/sign-in');await p.getByLabel('Email',{exact:true}).fill(users[0].email);await p.getByLabel('Password',{exact:true}).fill(password);await p.getByRole('button',{name:'Sign in',exact:true}).click();await p.waitForURL('http://127.0.0.1:5193/');
 await expect(p.getByRole('link',{name:'2 unread updates. Account',exact:true})).toBeVisible();
 await p.getByRole('link',{name:'2 unread updates. Account',exact:true}).click();
 await p.getByRole('link',{name:/Feedback & updates/}).click();
 await expect(p).toHaveURL(/view=notifications/);
 await expect(p.getByRole('heading',{name:'QA Capture request',exact:true})).toBeVisible();
 await expect(p.getByRole('heading',{name:'Private other-player request',exact:true})).toHaveCount(0);
 await p.setViewportSize({width:1440,height:1000});
 await expect(p.getByRole('link',{name:'Account 2 unread updates',exact:true})).toBeVisible();
 await p.getByRole('button',{name:'Mark as read',exact:true}).first().click();
 await expect(p.getByRole('link',{name:'Account 1 unread updates',exact:true})).toBeVisible();
 await expect(p.getByRole('button',{name:'Mark as read',exact:true})).toHaveCount(1);
 await p.getByRole('button',{name:'Mark as read',exact:true}).click();
 await expect(p.getByRole('link',{name:'Account',exact:true})).toBeVisible();
 await p.setViewportSize({width:390,height:844});await expect(p.getByRole('link',{name:'Account',exact:true})).toBeVisible();
 expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);console.log('PASS: mobile and desktop unread navigation counts stay private, open the inbox, and clear after reading.');
} finally {await browser?.close();for(const user of users)await admin.auth.admin.deleteUser(user.id);}

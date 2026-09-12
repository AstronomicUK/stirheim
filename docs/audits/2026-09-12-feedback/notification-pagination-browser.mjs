import {chromium,expect} from '/Users/tombrookes/Documents/Claude Scripts/stirheim/node_modules/@playwright/test/index.mjs';
import {createClient} from '/Users/tombrookes/Documents/Claude Scripts/stirheim/node_modules/@supabase/supabase-js/dist/index.mjs';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
const cwd='/Users/tombrookes/Documents/Claude Scripts/stirheim';
const raw=execFileSync('npx',['supabase','status','-o','env'],{cwd,env:{...process.env,DOCKER_HOST:'unix:///Users/tombrookes/.docker/run/docker.sock'},encoding:'utf8',stdio:['ignore','pipe','pipe']});
const env=Object.fromEntries([...raw.matchAll(/^(\w+)="(.*)"$/gm)].map(m=>[m[1],m[2]]));
if(!/^http:\/\/(127\.0\.0\.1|localhost):/.test(env.API_URL))throw Error('Local only');
const admin=createClient(env.API_URL,env.SERVICE_ROLE_KEY);const must=r=>{if(r.error)throw Error(r.error.message);return r.data};
const tag=randomUUID().slice(0,8),password=randomUUID();const users=[],issues=[],releases=[];let browser;
try {
 for(const role of ['reporter','reviewer']) {
  const email=`${role}-${tag}@stirheim.test`;
  const {user}=must(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:`QA ${role}`}}));
  users.push({id:user.id,email});
 }
 must(await admin.from('feedback_maintainers').insert({user_id:users[1].id}));
 browser=await chromium.launch();const errors=[];
 const open=async(user,viewport)=>{
  const p=await browser.newPage({viewport});p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:5193/sign-in');await p.getByLabel('Email',{exact:true}).fill(user.email);await p.getByLabel('Password',{exact:true}).fill(password);await p.getByRole('button',{name:'Sign in',exact:true}).click();await p.waitForURL('http://127.0.0.1:5193/');await p.goto('http://127.0.0.1:5193/feedback');return p;
 };
 const p=await open(users[0],{width:390,height:844});
 await p.getByRole('button',{name:'+ Report a bug',exact:true}).click();
 await p.getByLabel('A short title').fill(`QA ${tag} reload display issue`);await p.getByLabel('Details',{exact:true}).fill('Disposable browser verification: loaded chambers should remain visible after changing turn.');await p.getByRole('button',{name:'Submit report',exact:true}).click();
 await expect(p.getByRole('heading',{name:`QA ${tag} reload display issue`})).toBeVisible();
 const rows=must(await admin.from('feedback_issues').select('*').like('title',`QA ${tag}%`));issues.push(...rows.map(x=>x.id));expect(rows).toHaveLength(1);const id=rows[0].id;
 expect(rows[0].reported_by).toBe('QA reporter');await expect(p.getByRole('button',{name:'Following · stop updates'})).toBeVisible();
 await p.reload();await expect(p.getByRole('heading',{name:`QA ${tag} reload display issue`})).toBeVisible();
 expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const m=await open(users[1],{width:1440,height:1000});await m.goto(`http://127.0.0.1:5193/feedback?issue=${id}`);
 await m.getByText('Review this report',{exact:true}).click();await m.getByLabel('Priority',{exact:true}).selectOption('high');await m.getByLabel('Stage',{exact:true}).last().selectOption('working_on');await m.getByRole('button',{name:'Save review'}).click();
 await expect.poll(async()=>must(await admin.from('feedback_issues').select('status').eq('id',id).single()).status).toBe('working_on');
 await m.goto('http://127.0.0.1:5193/feedback?view=releases');await m.getByText('Manage release notes',{exact:true}).click();
 await m.getByLabel('Version',{exact:true}).fill(`qa-${tag}`);await m.getByLabel('Release title').fill('Disposable QA release');await m.getByLabel('What changed?').fill('Improved the chamber display for local QA.');await m.getByRole('button',{name:'Save private draft'}).click();
 await expect(m.getByRole('button',{name:'Review publication'}).last()).toBeVisible();
 const release=must(await admin.from('feedback_releases').select('id').eq('version',`qa-${tag}`).single());releases.push(release.id);
 await m.goto(`http://127.0.0.1:5193/feedback?issue=${id}`);await m.getByText('Review this report',{exact:true}).click();await m.getByLabel('Release',{exact:true}).selectOption(release.id);await m.getByRole('button',{name:'Save review'}).click();
 await expect.poll(async()=>must(await admin.from('feedback_issues').select('release_id').eq('id',id).single()).release_id).toBe(release.id);
 await m.goto('http://127.0.0.1:5193/feedback?view=releases');await m.getByText('Manage release notes',{exact:true}).click();await m.getByRole('button',{name:'Review publication'}).last().click();await m.getByRole('button',{name:'The update is live — publish notes'}).click();
 await expect.poll(async()=>must(await admin.from('feedback_issues').select('status').eq('id',id).single()).status).toBe('implemented');
 await p.goto('http://127.0.0.1:5193/feedback?view=notifications');await expect(p.getByText(new RegExp(`#${id} is in release`))).toBeVisible();await p.getByRole('link',{name:'View details'}).click();await expect(p.getByRole('heading',{name:`QA ${tag} reload display issue`})).toBeVisible();
 const sent=must(await admin.from('app_notifications').select('id,read_at').eq('user_id',users[0].id));expect(sent).toHaveLength(1);await expect.poll(async()=>must(await admin.from('app_notifications').select('read_at').eq('id',sent[0].id).single()).read_at).not.toBeNull();
 must(await admin.from('app_notifications').insert(Array.from({length:205},(_,i)=>({user_id:users[0].id,title:`QA paginated update ${i}`,body:'Disposable pagination verification.',href:'/feedback',created_at:new Date(Date.now()-1000*(i+1)).toISOString()}))));
 await p.goto('http://127.0.0.1:5193/feedback?view=notifications');
 await expect(p.getByRole('heading',{name:'QA paginated update 204',exact:true})).toBeVisible();
 await expect(p.getByRole('heading',{name:/QA paginated update/})).toHaveCount(205);
 expect(errors).toEqual([]);console.log('PASS: mobile public report, attribution, auto-follow, persistence, desktop review, private release draft, publish, stage transition, private notification and working deep link. No page errors.');
} finally {
 if(browser)await browser.close();
 const leftovers=await admin.from('feedback_issues').select('id').like('title',`QA ${tag}%`);if(leftovers.data?.length)await admin.from('feedback_issues').delete().in('id',leftovers.data.map(x=>x.id));
 await admin.from('feedback_releases').delete().eq('version',`qa-${tag}`);
 for(const u of users)await admin.auth.admin.deleteUser(u.id);
}

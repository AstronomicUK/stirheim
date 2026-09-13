import {execFileSync} from 'node:child_process';
import {createClient} from '/Users/tombrookes/Documents/Claude Scripts/stirheim/node_modules/@supabase/supabase-js/dist/index.mjs';
import {chromium,expect} from '/Users/tombrookes/Documents/Claude Scripts/stirheim/node_modules/@playwright/test/index.mjs';
const cwd='/Users/tombrookes/Documents/Claude Scripts/stirheim';
const raw=execFileSync('npx',['supabase','status','-o','env'],{cwd,env:{...process.env,DOCKER_HOST:'unix:///Users/tombrookes/.docker/run/docker.sock'},encoding:'utf8',stdio:['ignore','pipe','pipe']});
const env=Object.fromEntries([...raw.matchAll(/^(\w+)="(.*)"$/gm)].map(m=>[m[1],m[2]]));
if(!['127.0.0.1','localhost'].includes(new URL(env.API_URL).hostname))throw Error('Local only');
const admin=createClient(env.API_URL,env.SERVICE_ROLE_KEY),anon=createClient(env.API_URL,env.ANON_KEY);
const must=r=>{if(r.error)throw Error(r.error.message);return r.data};
const before=must(await admin.from('feedback_issues').select('id').lte('id',231)).map(r=>r.id);
const existingRelease=must(await admin.from('feedback_releases').select('id').eq('version','2026.09.12').maybeSingle());
let b;
try {
 const output=execFileSync('node',['scripts/feedback/import.mjs','--apply'],{cwd,env:{...process.env,SUPABASE_URL:env.API_URL,SUPABASE_SERVICE_ROLE_KEY:env.SERVICE_ROLE_KEY},encoding:'utf8'});process.stdout.write(output);
 const rows=must(await anon.from('feedback_issues').select('id,title,status,reported_by').lte('id',231));expect(rows.length).toBe(221);expect(rows.find(r=>r.id===1).reported_by).toBe('AstronomicUK');
 expect(rows.find(r=>r.id===181).status).toBe('reviewed');expect(rows.find(r=>r.id===176).status).toBe('implemented');
 b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:5193/feedback');
 await p.getByLabel('Search reports').fill('191');await p.getByLabel('Stage',{exact:true}).selectOption('reviewed');
 await expect(p.getByRole('button',{name:/Penthesilea adds 5 rating/})).toBeVisible();await p.getByRole('button',{name:/Penthesilea adds 5 rating/}).click();
 await expect(p.getByText(/because her entry's rating text/)).toBeVisible();
 expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
 console.log('PASS: 221 public entries imported locally; mobile search/detail verified without overflow or page errors.');
} finally {
 await b?.close();const now=must(await admin.from('feedback_issues').select('id').lte('id',231)).map(r=>r.id).filter(id=>!before.includes(id));if(now.length)must(await admin.from('feedback_issues').delete().in('id',now));
 if(!existingRelease)must(await admin.from('feedback_releases').delete().eq('version','2026.09.12'));
}

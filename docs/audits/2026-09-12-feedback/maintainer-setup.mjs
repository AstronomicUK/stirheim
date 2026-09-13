import {execFileSync} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';
import {expect} from '@playwright/test';
const cwd='/Users/tombrookes/Documents/Claude Scripts/stirheim';
const raw=execFileSync('npx',['supabase','status','-o','env'],{cwd,env:{...process.env,DOCKER_HOST:'unix:///Users/tombrookes/.docker/run/docker.sock'},encoding:'utf8',stdio:['ignore','pipe','pipe']});
const env=Object.fromEntries([...raw.matchAll(/^(\w+)="(.*)"$/gm)].map(m=>[m[1],m[2]]));
if(!['127.0.0.1','localhost'].includes(new URL(env.API_URL).hostname))throw Error('Local only');
const admin=createClient(env.API_URL,env.SERVICE_ROLE_KEY),users=[],username=`Maintainer QA ${crypto.randomUUID().slice(0,8)}`;
const must=r=>{if(r.error)throw Error(r.error.message);return r.data;};
const setup=()=>execFileSync('node',['scripts/feedback/maintainer.mjs',`--username=${username}`,'--apply'],{cwd,env:{...process.env,SUPABASE_URL:env.API_URL,SUPABASE_SERVICE_ROLE_KEY:env.SERVICE_ROLE_KEY},encoding:'utf8',stdio:['ignore','pipe','pipe']});
try{
 const create=async()=>{const {user}=must(await admin.auth.admin.createUser({email:`maintainer-${crypto.randomUUID()}@stirheim.test`,password:crypto.randomUUID(),email_confirm:true,user_metadata:{display_name:username}}));users.push(user.id);};
 await create();setup();setup();
 expect(must(await admin.from('feedback_maintainers').select('user_id').in('user_id',users))).toEqual([{user_id:users[0]}]);
 await create();let rejected=false;
 try{setup();}catch(e){if(!String(e.stderr).includes('does not identify exactly one existing account'))throw e;rejected=true;}
 expect(rejected).toBe(true);
 expect(must(await admin.from('feedback_maintainers').select('user_id').in('user_id',users))).toEqual([{user_id:users[0]}]);
 console.log('PASS: verified existing profile receives maintainer access exactly once; ambiguous duplicate display names are refused without granting another account.');
}finally{if(users.length)must(await admin.from('feedback_maintainers').delete().in('user_id',users));for(const id of users)must(await admin.auth.admin.deleteUser(id));}

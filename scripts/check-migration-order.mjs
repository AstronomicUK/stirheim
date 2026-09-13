/** Local-only migration-order check; creates and removes its own disposable database. */
import {execFileSync} from 'node:child_process';
import {readdirSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
const env={...process.env,DOCKER_HOST:'unix:///Users/tombrookes/.docker/run/docker.sock'};
const db=`stirheim_migration_qa_${Date.now()}`;
const run=(args,input)=>execFileSync('docker',['exec',...(input!==undefined?['-i']:[]),'supabase_db_stirheim',...args],{env,input,encoding:'utf8',maxBuffer:20*1024*1024,stdio:['pipe','pipe','pipe']});
let created=false;
try{
 const auth=run(['pg_dump','-U','postgres','-d','postgres','--schema=auth','--section=pre-data','--schema-only','--no-owner','--no-privileges']);
 run(['createdb','-U','postgres',db]);created=true;
 run(['psql','-U','postgres','-d',db,'-v','ON_ERROR_STOP=1','-q'],auth+'\nALTER TABLE auth.users ADD PRIMARY KEY (id); CREATE SCHEMA extensions; CREATE PUBLICATION supabase_realtime;\n');
 const files=readdirSync(`${root}/supabase/migrations`).filter(f=>f.endsWith('.sql')).sort();
 for(const [i,file] of files.entries()){
  try{run(['psql','-U','postgres','-d',db,'-v','ON_ERROR_STOP=1','-q'],readFileSync(`${root}/supabase/migrations/${file}`,'utf8'));}
  catch(e){throw Error(`${file}: ${String(e.stderr||e.message).slice(-3500)}`);}
  if((i+1)%20===0)console.log(`Applied ${i+1}/${files.length} migration files to isolated database.`);
 }
 console.log(`PASS: all ${files.length} migrations applied in filename order to a separate empty database with the local Auth pre-data schema and users primary key.`);
}finally{
 if(created){run(['dropdb','-U','postgres',db]);console.log('Removed isolated migration-check database. Shared application database was unchanged.');}
}

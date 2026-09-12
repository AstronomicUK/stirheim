/** Read-only current board snapshot. Does not overwrite the historical audit tracker. */
import { writeFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_ANON_KEY
if(!url||!key)throw Error('Provide SUPABASE_URL and SUPABASE_ANON_KEY')
const db=createClient(url,key,{auth:{persistSession:false}}), rows=[]
for(let offset=0;;offset+=200){const {data,error}=await db.from('feedback_issues').select('*').order('id').range(offset,offset+199);if(error)throw Error(error.message);rows.push(...data);if(data.length<200)break}
const target=process.argv[2]
if(!target)throw Error('Provide an output JSON path for the current public tracker snapshot')
await writeFile(target,JSON.stringify({exported_at:new Date().toISOString(),issues:rows},null,2)+'\n')
console.log(`Exported ${rows.length} current reports.`)

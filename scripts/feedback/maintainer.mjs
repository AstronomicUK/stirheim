/** Grant tracker management to one verified existing account. Dry-run by default. */
import {createClient} from '@supabase/supabase-js'
const username=process.argv.find(arg=>arg.startsWith('--username='))?.slice('--username='.length).trim()
if(!username)throw Error('Provide the exact verified Stirheim username with --username=')
if(!process.argv.includes('--apply')){console.log(`Dry run: configure tracker management for ${username}. No database connection or changes.`);process.exit(0)}
const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY
if(!url||!key)throw Error('Provide SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
const host=new URL(url).hostname
if(!['localhost','127.0.0.1'].includes(host)&&!process.argv.includes(`--confirm-host=${host}`))throw Error('Remote setup requires the matching --confirm-host argument')
const db=createClient(url,key,{auth:{persistSession:false}})
const check=result=>{if(result.error)throw Error(result.error.message);return result.data}
const matches=check(await db.from('profiles').select('user_id,display_name').eq('display_name',username).limit(2))
if(matches.length!==1)throw Error('The username does not identify exactly one existing account. Resolve the account identity before granting access.')
check(await db.from('feedback_maintainers').upsert({user_id:matches[0].user_id},{onConflict:'user_id',ignoreDuplicates:true}))
const verified=check(await db.from('feedback_maintainers').select('user_id').eq('user_id',matches[0].user_id).single())
if(!verified)throw Error('Maintainer setup could not be verified')
console.log(`Tracker management configured for ${matches[0].display_name}.`)

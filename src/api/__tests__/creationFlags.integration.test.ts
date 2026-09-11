import { createClient } from '@supabase/supabase-js'
import { describe,it,expect } from 'vitest'

describe.skipIf(process.env.SUPABASE_LOCAL!=='1')('initial certification transaction',()=>{
 it('persists certification with creation, leaves old payloads valid and rolls back invalid creation',async()=>{
   const options={auth:{persistSession:false,autoRefreshToken:false}}
   const url=process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
   const player=createClient(url,process.env.SUPABASE_ANON_KEY!,options)
   const admin=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY!,options)
   const ids:string[]=[]
   const name=`Certification QA ${crypto.randomUUID()}`
   try {
     const login=await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'});if(login.error)throw login.error
     const certification={die:2,afterMatch:null,recordedAt:'2026-09-11T12:00:00Z',history:['App rolled 5','Player entered 2']}
     const hero={name:'Priest',unit_type_rules_id:'dreamwalkers_priest_of_morr',stats:{M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7},flags:{dreamerCertification:certification}}
     const payload={name,type_rules_id:'dreamwalkers_cult_of_morr',gold:400,heroes:[hero],henchman_groups:[],stash:[]}
     const made=await player.rpc('create_warband',{payload});if(made.error)throw made.error;ids.push(made.data)
     const rows=await player.from('heroes').select('flags').eq('warband_id',made.data);expect(rows.error).toBeNull();expect(rows.data![0].flags).toEqual(hero.flags)
     const legacy=await player.rpc('create_warband',{payload:{...payload,heroes:[{...hero,flags:undefined}]}});if(legacy.error)throw legacy.error;ids.push(legacy.data)
     expect((await player.from('heroes').select('flags').eq('warband_id',legacy.data)).data![0].flags).toEqual({})
     const bad=await player.rpc('create_warband',{payload:{...payload,name:name+' invalid',heroes:[hero,{...hero,stats:null}]}});expect(bad.error).not.toBeNull()
     expect((await admin.from('warbands').select('id').eq('name',name+' invalid')).data).toEqual([])
   } finally {if(ids.length)await admin.from('warbands').delete().in('id',ids);await player.auth.signOut()}
 })
})

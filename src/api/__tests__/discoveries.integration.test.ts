import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
const enabled=process.env.SUPABASE_LOCAL==='1'
const owner='22222222-2222-4222-8222-222222222222'
describe.skipIf(!enabled)('Returning a Favour contract claim',()=>{
 let admin:SupabaseClient, warband:string
 beforeAll(()=>{admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)})
 beforeEach(async()=>{warband=crypto.randomUUID();const r=await admin.from('warbands').insert({id:warband,owner_id:owner,name:'Disposable favour QA',type_rules_id:'mercenaries_reikland'});if(r.error)throw r.error})
 afterEach(async()=>{await admin.from('warbands').delete().eq('id',warband)})
 it('admits only one simultaneous claim and retains the claim when that hire leaves',async()=>{
  const source=crypto.randomUUID()
  const stats={M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7}
  const make=(name:string)=>admin.from('heroes').insert({warband_id:warband,name,is_hired_sword:true,hired_sword_rules_id:'warlock',stats,flags:{returningFavourReportId:source}}).select('id').single()
  const results=await Promise.all([make('One'),make('Two')]);expect(results.filter(r=>!r.error)).toHaveLength(1)
  expect(results.find(r=>r.error)?.error?.code).toBe('23505')
  const id=results.find(r=>!r.error)!.data!.id
  expect((await admin.from('heroes').update({status:'left'}).eq('id',id)).error).toBeNull()
  expect((await make('Three')).error?.code).toBe('23505')
 })
})

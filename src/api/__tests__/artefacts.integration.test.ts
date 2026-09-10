import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
const enabled = process.env.SUPABASE_LOCAL === '1'
const playerId = '22222222-2222-4222-8222-222222222222'
describe.skipIf(!enabled)('campaign artefact ledger (#190)', () => {
 let admin:SupabaseClient, player:SupabaseClient, anonymous:SupabaseClient
 let campaign:string, match:string, warbands:string[]
 beforeAll(async () => {
  const url=process.env.SUPABASE_URL!, key=process.env.SUPABASE_ANON_KEY!
  admin=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY!)
  player=createClient(url,key,{auth:{persistSession:false}}); anonymous=createClient(url,key,{auth:{persistSession:false}})
  const login=await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'});if(login.error)throw login.error
 })
 beforeEach(async () => {
  campaign=crypto.randomUUID();match=crypto.randomUUID();warbands=[crypto.randomUUID(),crypto.randomUUID()]
  for (const response of [
   await admin.from('campaigns').insert({id:campaign,name:'Disposable artefact QA',gm_id:playerId}),
   await admin.from('warbands').insert(warbands.map(id=>({id,owner_id:playerId,name:'Artefact QA',type_rules_id:'mercenaries_reikland'}))),
   await admin.from('matches').insert({id:match,campaign_id:campaign,created_by:playerId,state:'awaiting_reports'}),
  ]) if(response.error)throw response.error
 })
 afterEach(async()=> {await admin.from('campaigns').delete().eq('id',campaign);await admin.from('warbands').delete().in('id',warbands)})
 const report = (i:number, overrideReason?:string) => admin.from('match_reports').insert({match_id:match,warband_id:warbands[i],submitted_by:playerId,exploration:{artefact:{roll:1,...(overrideReason ? {overrideReason} : {})}}}).select('id').single()
 it('allows only one of two simultaneous discoveries, with the losing report rolled back',async()=> {
  const results=await Promise.all([report(0),report(1)])
  expect(results.filter(r=>!r.error)).toHaveLength(1)
  expect(results.find(r=>r.error)?.error?.message).toContain('already been found')
  expect((await admin.from('match_reports').select('id').eq('match_id',match)).data).toHaveLength(1)
  expect((await player.rpc('campaign_artefact_ledger',{p_campaign_id:campaign})).data).toHaveLength(1)
 })
 it('retains the discovery after deletion of its original bearer/report and rejects duplicates',async()=> {
  const first=await report(0);expect(first.error).toBeNull()
  await admin.from('warbands').delete().eq('id',warbands[0])
  const ledger=await player.rpc('campaign_artefact_ledger',{p_campaign_id:campaign})
  expect(ledger.data[0]).toMatchObject({roll:1,warbandId:null,reportId:null})
  expect((await report(1)).error?.message).toContain('already been found')
 })
 it('accepts an explained duplicate and preserves the original discovery',async()=> {
  const first=await report(0);expect(first.error).toBeNull()
  const duplicate=await report(1,'Campaign agreed a duplicate for this narrative scenario');expect(duplicate.error).toBeNull()
  const ledger=await player.rpc('campaign_artefact_ledger',{p_campaign_id:campaign});expect(ledger.data).toHaveLength(1);expect(ledger.data[0].reportId).toBe(first.data!.id)
 })
 it('permits re-filing the same discovery and rejects anonymous reads',async()=> {
  const first=await report(0);expect(first.error).toBeNull()
  expect((await admin.from('match_reports').update({exploration:{artefact:{roll:1}}}).eq('id',first.data!.id)).error).toBeNull()
  expect((await anonymous.rpc('campaign_artefact_ledger',{p_campaign_id:campaign})).error).not.toBeNull()
 })
 it('serializes scenario and exploration discoveries against the same ledger',async()=> {
  const results=await Promise.all([report(0),admin.from('match_reports').insert({match_id:match,warband_id:warbands[1],submitted_by:playerId,applied:{scenario_artefacts:[{roll:1}]}})])
  expect(results.filter(r=>!r.error)).toHaveLength(1)
  expect(results.find(r=>r.error)?.error?.message).toContain('already been found')
  expect((await player.rpc('campaign_artefact_ledger',{p_campaign_id:campaign})).data).toHaveLength(1)
 })
 it('rejects unexplained duplicate artefacts within a single report and rolls the ledger back',async()=> {
  const row={match_id:match,warband_id:warbands[0],submitted_by:playerId,exploration:{artefact:{roll:2}},applied:{scenario_artefacts:[{roll:2}]}}
  expect((await admin.from('match_reports').insert(row)).error?.message).toContain('twice in this report')
  expect((await player.rpc('campaign_artefact_ledger',{p_campaign_id:campaign})).data).toEqual([])
  expect((await admin.from('match_reports').insert({...row,applied:{scenario_artefacts:[{roll:2,overrideReason:'Agreed duplicate reward'}]}})).error).toBeNull()
  expect((await player.rpc('campaign_artefact_ledger',{p_campaign_id:campaign})).data).toHaveLength(1)
 })

})

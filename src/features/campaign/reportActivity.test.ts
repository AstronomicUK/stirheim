import {expect,it} from 'vitest'
import {reportActivityChanges} from './reportActivity'
import type {CampaignActivity} from '../../api/campaigns'
const entry=(patch:Partial<CampaignActivity>):CampaignActivity=>({id:1,at:'2026-09-11T00:00:00Z',actor_id:'a',actor_display_name:'Tom',table_name:'match_reports',action:'insert',reason:'post_battle',warband_id:'w',warband_name:'Dwarves',before:null,after:null,...patch})
it('turns the supplied post-battle structure into named facts without leaking application patches',()=>{
 const report={result:'lost',status:'pending',revision:1,submitted_at:'internal timestamp',xp_log:[{subjectName:'Dwarf Engineer',amount:1,xpBefore:10,xpAfter:11,reasons:['+1 survived the battle'],advancesEarned:1}],ooa:[{subjectName:'Dwarf Engineer',count:1,by:['Artur']}],injuries:[{subjectName:'Dwarf Engineer',injuryName:'Sold To The Pits',rolls:[65],effect:'Fight a Pit Fighter; winning earns 50 gc and 2 XP.'}],exploration:{rolls:[2,5],total:7,shards:3,goldFound:0,notes:['Incomparable Miners: +1 shard'],itemsFound:[]},veteran_pool_roll:9,applied:{heroes:[{id:'internal id',patch:{xp:11}}],warband:{gold_delta:0,wyrdstone_delta:3}},adjustments:[{label:'Injury roll',suggested:'22',used:'65',reason:'Agreed at the table'}]}
 const changes=reportActivityChanges(entry({after:report}));const prose=changes.map(c=>c.sentence).join('\n')
 expect(prose).toContain('Dwarf Engineer: +1 XP (10 → 11)');expect(prose).toContain('1 advance earned')
 expect(prose).toContain('Sold To The Pits. Injury dice: 65. A pit fight must be resolved.')
 expect(changes.find(c=>c.label==='Injury 0')?.details).toContain('50 gc')
 expect(prose).toContain('used 65 instead of 22. Reason: Agreed at the table')
 expect(prose).toContain('Dice: 2, 5. Total: 7. Wyrdstone: 3.')
 expect(prose).not.toMatch(/patch|revision|submitted|internal id|internal timestamp|Report status|Gold found: 0|applied to the warband/)
})
it('does not repeat the full report for a later approval status update',()=>{
 const before={status:'pending',xp_log:[{subjectName:'Engineer',amount:1}],applied:{warband:{gold_delta:50}}}
 expect(reportActivityChanges(entry({action:'update',before,after:{...before,status:'applied'}}))).toEqual([{label:'Report status',before:'',after:'',sentence:'The report’s changes were applied to the warband.'}])
})
it('does not invent an original dice result for a historical injury',()=>{
 const changes=reportActivityChanges(entry({after:{injuries:[{subjectName:'Engineer',injuryName:'Leg Wound',rolls:[22]}]}}))
 expect(changes[0].sentence).toBe('Engineer: Leg Wound. Injury dice: 22.')
 expect(JSON.stringify(changes)).not.toMatch(/override|app.roll|instead/)
})
it('labels deleted report facts as a removed record, not fresh awards',()=>{
 expect(reportActivityChanges(entry({action:'delete',before:{result:'won'}}))[0].sentence).toBe('Removed record: Won the battle.')
})

it('makes removed warriors and cleared report facts visible in amendments',()=>{
 const before={xp_log:[{subjectId:'a',subjectName:'Engineer',amount:1},{subjectId:'b',subjectName:'Noble',amount:1}],injuries:[{subjectId:'a',subjectName:'Engineer',injuryName:'Leg Wound'}],exploration:{shards:3},notes:'Table ruling',adjustments:[{label:'Dice',used:'65'}],veteran_pool_roll:9,applied:{warband:{gold_delta:50}}}
 const after={xp_log:[before.xp_log[1]],injuries:[],exploration:null,notes:'',adjustments:[],veteran_pool_roll:null,applied:{warband:{gold_delta:0}}}
 const prose=reportActivityChanges(entry({action:'update',before,after})).map(c=>c.sentence).join('\n')
 expect(prose).toContain('Removed Engineer’s previously recorded experience award')
 expect(prose).toContain('Removed Engineer’s previously recorded injury entry')
 expect(prose).toContain('Removed the previously recorded exploration result')
 expect(prose).toContain('Cleared the previously recorded report notes')
 expect(prose).toContain('Cleared the previously recorded player adjustments')
 expect(prose).toContain('Cleared the previously recorded veteran recruit experience pool')
 expect(prose).toContain('Treasury: 0 gc in this report.')
 expect(prose).not.toContain('Removed Noble')
})

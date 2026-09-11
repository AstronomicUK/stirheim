import { expect, it } from 'vitest';
import { banCandidates, searchBanCandidates, type BanKind } from './bans';
it('puts Witch itself before other hires mentioning Witch Hunters, retaining every match', () => {
 const entries=banCandidates('hiredSwords'); const result=searchBanCandidates(entries,' Witch ');
 expect(result[0].name).toBe('Witch');
 expect(result.length).toBeGreaterThan(12);
 expect(result).toHaveLength(entries.filter(e=>`${e.name} ${e.detail}`.toLowerCase().includes('witch')).length);
});
it.each<BanKind>(['items','spells','hiredSwords','characters','skills'])('allows browsing all %s without a query', kind => {
 const entries=banCandidates(kind); expect(searchBanCandidates(entries,'')).toEqual(entries);
});
it('ranks exact, prefix, contained name and descriptive matches in that order',()=>{
 const rows=[{id:'a',name:'Alpha',detail:'witch'}, {id:'b',name:'Witch Hunter',detail:''},{id:'c',name:'Dark Witch',detail:''},{id:'d',name:'Witch',detail:''}];
 expect(searchBanCandidates(rows,'witch').map(e=>e.id)).toEqual(['d','b','c','a']);
 expect(searchBanCandidates(rows,'zzzz')).toEqual([]);
});

import { describe, expect, it } from 'vitest'
import { makeHero, makeWarband } from '../../../rules/resolve/__tests__/fixtures'
import { deriveExploration } from './exploration'
import { emptyExploration } from './state'

const heroes = ['a','b','c'].map(id => makeHero({id}))
const roster = makeWarband({heroes})
const input = {won:false,eligibleHeroes:heroes}

describe('Conditional location rewards (#187)', () => {
  it('awards 4D6 after a Tavern pass and D6 after a failure, never both', () => {
    for (const passed of [true,false]) {
      const result = deriveExploration({...emptyExploration(),rolls:[1,1,1],testPassed:passed,gold:5},roster,input)
      expect(result.gold.expressions).toEqual([passed ? '4D6' : 'D6'])
      expect(result.record?.goldFound).toBe(5)
    }
    expect(deriveExploration({...emptyExploration(),rolls:[1,1,1]},roster,input).problems.join(' ')).toContain('test')
  })
  it('automatically passes the Tavern test for the three named warbands', () => {
    for (const warbandTemplateId of ['the_undead','witch_hunters','sisters_of_sigmar']) {
      const result = deriveExploration({...emptyExploration(),rolls:[1,1,1],gold:10}, {...roster,warbandTemplateId},input)
      expect(result.needsTest).toBeNull()
      expect(result.gold.expressions).toEqual(['4D6'])
      expect(result.record?.notes.join(' ')).toContain('automatically passes')
    }
  })
  it('only finds the Shop charm when its gold D6 is one, including maximum-find districts', () => {
    for (const gold of [null,1,2,6]) {
      const result = deriveExploration({...emptyExploration(),rolls:[2,2,3],gold},roster,input)
      expect(result.suggestedItems.some(i => i.item_rules_id === 'lucky_charm')).toBe(gold === 1)
    }
    const result = deriveExploration({...emptyExploration(),rolls:[2,2,3],gold:1},roster,{...input,maxFinds:{districtName:'Rich Quarter'}})
    expect(result.gold.value).toBe(6)
    expect(result.suggestedItems).toEqual([])
  })
})

 it('requires an explicit choice per Armourer find and supports mixed Shields and Bucklers', () => {
   const party = [...heroes,makeHero({id:'d'})];
   const warband = {...roster,heroes:party};
   const draft = {...emptyExploration(),rolls:[4,4,4,4],subRoll:1,itemQuantities:{'armourer:1:0':3}};
   const result = deriveExploration(draft,warband,{won:false,eligibleHeroes:party});
   expect(result.itemChoicePrompts[0].quantity).toBe(3);
   expect(result.problems.join(' ')).toContain('choose a Shield or Buckler');
   const resolved = deriveExploration({...draft,itemChoices:{'armourer:1:0':['Shield','Buckler','Shield']}},warband,{won:false,eligibleHeroes:party});
   expect(resolved.items).toEqual([{item_rules_id:'shield',custom_name:null,quantity:2},{item_rules_id:'buckler',custom_name:null,quantity:1}]);
   expect(resolved.record?.itemsFound).toEqual(resolved.items);
 });

 it('records an artefact and requires reroll or explanation for a campaign duplicate', () => {
   const party = Array.from({length:6},(_,i)=>makeHero({id:String(i)}));const warband={...roster,heroes:party};
   const draft={...emptyExploration(),rolls:[6,6,6,6,6,6],subRoll:6,artefactRoll:1};
   const input={won:false,eligibleHeroes:party,artefacts:[]};
   const available=deriveExploration(draft,warband,input);
   expect(available.record?.artefact?.roll).toBe(1);
   expect(available.items[0].custom_name).toBe('The Boots and Rope of Pieter');
   const discovery={roll:1,reportId:'original',warbandId:'other',warbandName:'Other warband',foundAt:'2026-09-10'};
   expect(deriveExploration(draft,warband,{...input,artefacts:[discovery]}).problems.join(' ')).toContain('already found');
   const override=deriveExploration({...draft,artefactOverrideReason:'Agreed narrative exception'},warband,{...input,artefacts:[discovery]});
   expect(override.record?.artefact?.overrideReason).toBe('Agreed narrative exception');
   expect(deriveExploration(draft,warband,{...input,artefacts:[discovery],reportId:'original'}).record).not.toBeNull();
   expect(deriveExploration(draft,warband,{...input,artefacts:undefined}).problems.join(' ')).toContain('Waiting');
 });

 it('Shattered Building always gives shards and only adds the wardog after the Leadership pass', () => {
   const party=Array.from({length:5},(_,i)=>makeHero({id:String(i)}));const warband={...roster,heroes:party};
   for (const testPassed of [false,true,null]) {
     const result=deriveExploration({...emptyExploration(),rolls:[5,5,5,5,5],extraShards:2,testPassed},warband,{won:false,eligibleHeroes:party});
     expect(result.extraShards.value).toBe(2);
     expect(result.items.some(item=>item.item_rules_id==='wardogs')).toBe(testPassed===true);
     expect(result.record!==null).toBe(testPassed!==null);
   }
 });

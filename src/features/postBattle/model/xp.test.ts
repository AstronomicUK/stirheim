// #60 A2: Dramatis Personae never earn Experience, unlike ordinary hired swords who earn as heroes.

import { describe, expect, it } from 'vitest'
import type { RosterHiredSword, RosterHero, RosterHenchmanGroup } from '../../../rules/types/roster'
import { groupXpLine, warriorXpLine, type XpContext } from './xp'

const stats = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }
const hiredSword = (id: string, hiredSwordId: string): RosterHiredSword => ({
  id, hiredSwordId, name: id, stats, xp: 0, levelUps: 0, skillIds: [], spellIds: [], injuries: [], flags: {}, equipment: [], status: 'active',
})
const ctx: XpContext = { won: false, leaderId: null, underdogBonus: 0, enemiesOut: {}, extras: {} }

describe('warriorXpLine and Dramatis Personae', () => {
  it('an ordinary hired sword still earns Experience for surviving (docs/PLANNING.md, confirmed as-is)', () => {
    const before = hiredSword('hs', 'ogre_bodyguard')
    const line = warriorXpLine('hiredSword', before, before, true, ctx)
    expect(line).not.toBeNull()
    expect(line!.reasons.some((r) => r.includes('survived the battle'))).toBe(true)
  })

  it('a Dramatis Persona earns none, even though he survived and fought well', () => {
    const before = hiredSword('p', 'johann_the_knife')
    const line = warriorXpLine('hiredSword', before, before, true, { ...ctx, won: true, leaderId: 'p', enemiesOut: { p: 2 } })
    expect(line).toBeNull()
  })
})

it('Rigors grants two survival XP only to Heroes, including promoted Runts and Shoota Teams (#112)', () => {
 for(const unit of ['bullied_goblin','bigsnotz','snotling_scouts','snotling_shaman','runts','snotling_shoota_team']) {
  const hero: RosterHero={id:'h',name:'Snotling hero',unitTemplateId:unit,stats,xp:0,levelUps:0,skillTableIds:[],skillIds:[],spellIds:[],injuries:[],flags:{},equipment:[],status:'active'};
  const line=warriorXpLine('hero',hero,hero,true,ctx)!;
  expect(line.amount).toBe(2);
  expect(line.reasons.join(' ')).toContain('Rigors of Leadership');
  expect(warriorXpLine('hero',hero,hero,false,ctx)).toBeNull();
 }
 const group: RosterHenchmanGroup={id:'g',name:'Runts',unitTemplateId:'runts',stats,size:2,xp:0,levelUps:0,statIncreases:{},equipment:[]};
 expect(groupXpLine(group,group,ctx)?.amount).toBe(1);
 const mob={...group,unitTemplateId:'snotling_mobs'};
 expect(groupXpLine(mob,mob,ctx)?.amount).toBe(1);
});
it('WEB Night Goblin Snotlings never gain XP, without excluding the advancing Snotling warband (#113)', () => {
 const group: RosterHenchmanGroup={id:'g',name:'Snotlings',unitTemplateId:'night_goblins_web_snotlings',stats,size:5,xp:0,levelUps:0,statIncreases:{},equipment:[]};
 expect(groupXpLine(group,group,{...ctx,underdogBonus:3,extras:{g:[{amount:2,reason:'objective'}]}})).toBeNull();
 const mob={...group,unitTemplateId:'snotling_mobs'};
 expect(groupXpLine(mob,mob,ctx)?.amount).toBe(1);
});

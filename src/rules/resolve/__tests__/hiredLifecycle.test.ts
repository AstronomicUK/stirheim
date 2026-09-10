import { expect, it } from 'vitest'
import { hireHiredSword, payUpkeep, dismissWarrior, recruitHero } from '../recruitment'
import { conditionalHireDepartures, hiredSwordGainsExperience, hiredSwordStartingSkills } from '../hiredSwordRules'
import { warbandRating } from '../rating'
import { findWarbandTemplate } from '../../data/warbandTemplates'
import { warriorXpLine } from '../../../features/postBattle/model/xp'
import { resolvePersonaInjury } from '../../../features/postBattle/model/injuries'
import type { RosterWarband } from '../../types/roster'
const roster=():RosterWarband=>({id:'w',name:'QA',warbandTemplateId:'mercenaries_reikland',gold:1000,wyrdstone:5,veteranPool:null,heroes:[],henchmenGroups:[],hiredSwords:[],stash:[]})
it('creates both rogues with separate profiles and one shared rating and fee',()=>{const r=hireHiredSword(roster(),'ulli_and_marquand','pair').value;expect(r.gold).toBe(970);expect(r.hiredSwords.map(h=>h.stats.S)).toEqual([3,4]);expect(r.hiredSwords[1].skillIds).toContain('strongman');expect(r.hiredSwords[0].equipment).toContainEqual({itemId:'throwing_knives_stars',quantity:1});expect(warbandRating(r,findWarbandTemplate(r.warbandTemplateId)).total).toBe(60);expect(dismissWarrior(r,r.hiredSwords[1].id).value.hiredSwords.every(h=>h.status==='left')).toBe(true)})
it('creates three snakes with no XP, 5 rating each and shared upkeep',()=>{const r=hireHiredSword(roster(),'snake_charmer','charmer').value;expect(r.hiredSwords).toHaveLength(4);expect(r.hiredSwords.slice(1).every(h=>h.flags.hireCompanion&&h.stats.S===1)).toBe(true);expect(warbandRating(r,findWarbandTemplate(r.warbandTemplateId)).total).toBe(20);expect(payUpkeep(r,'charmer').value.warband.gold).toBe(r.gold-25);expect(dismissWarrior(r,r.hiredSwords[1].id).value.hiredSwords.filter(h=>h.status==='active')).toHaveLength(3)})
it('requires and charges Maglah’s retinue, permitting up to five scouts',()=>{let r=hireHiredSword(roster(),'maglah_khan_s_horde','khan',{scouts:2}).value;expect(r.gold).toBe(830);expect(r.hiredSwords).toHaveLength(3);for(let i=2;i<5;i++)r=hireHiredSword(r,'hobgoblin_scout',`scout-${i}`).value;expect(()=>hireHiredSword(r,'hobgoblin_scout','sixth')).toThrow()})
it('includes the Ninja dice fee and grants printed starting skills',()=>{const r=hireHiredSword(roster(),'ninja','n',{rng:()=>0}).value;expect(r.gold).toBe(927);expect(r.hiredSwords[0].skillIds).toContain('expert_swordsman');expect(hiredSwordStartingSkills('ogre_bodyguard')).toEqual([])})
it('uses Henchman XP awards and thresholds and respects exclusions',()=>{const r=hireHiredSword(roster(),'ogre_bodyguard','o').value.hiredSwords[0];const before={...r,xp:4};const ctx={won:true,leaderId:'o',underdogBonus:0,enemiesOut:{o:3},extras:{}};const line=warriorXpLine('hiredSword',before,before,true,ctx);expect(line).toMatchObject({amount:1,xpAfter:5,advancesEarned:1});for(const id of ['ninja','bone_goliath','clan_skryre_rat_ogre','chaos_fury','aenur_the_sword_of_twilight'])expect(hiredSwordGainsExperience(id)).toBe(false)})
it('personae retain D66 injuries and captured status without gaining XP',()=>{const s=hireHiredSword(roster(),'aenur_the_sword_of_twilight','a').value.hiredSwords[0];const injury=resolvePersonaInjury(s,{rolls:[{d66:22,subRoll:null}],countRoll:null});expect(injury.sword.stats.M).toBe(s.stats.M-1);expect(injury.sword.injuries[0].injuryCode).toBe('leg_wound');expect(resolvePersonaInjury(s,{rolls:[{d66:61,subRoll:null}],countRoll:null}).sword.status).toBe('captured');expect(resolvePersonaInjury(s,{rolls:[{d66:66,subRoll:null}],countRoll:null}).sword.xp).toBe(0)})
it('requires Old Coot and Marianna outcomes and applies departure or free service',()=>{
 const old=hireHiredSword(roster(),'old_prospector','p').value
 old.hiredSwords[0].flags.contractCheckOwed=true
 expect(()=>payUpkeep(old,'p')).toThrow('contract check')
 expect(payUpkeep(old,'p',{contractRoll:1}).value.warband.hiredSwords[0].status).toBe('left')
 expect(payUpkeep(old,'p',{contractRoll:4}).value.warband.wyrdstone).toBe(old.wyrdstone-1)
 const m=hireHiredSword(roster(),'countess_marianna_chevaux_vampire_assassin','m').value
 m.hiredSwords[0].flags.contractCheckOwed=true
 expect(()=>payUpkeep(m,'m',{contractRoll:6})).toThrow('minions')
 expect(payUpkeep(m,'m',{contractRoll:6,mariannaHelpedAndSurvived:true}).value.warband.gold).toBe(m.gold)
 expect(payUpkeep(m,'m',{contractRoll:2}).value.warband.hiredSwords[0].status).toBe('left')
})
it('dismisses Maglah’s retinue while retaining one scout',()=>{
 const r=hireHiredSword(roster(),'maglah_khan_s_horde','m',{scouts:3}).value
 const next=dismissWarrior(r,'m').value
 expect(next.hiredSwords.filter(s=>s.status==='active')).toHaveLength(1)
 expect(next.hiredSwords.find(s=>s.status==='active')?.hiredSwordId).toBe('hobgoblin_scout')
})
it('supplies the previously empty equipment entries and Luthor’s chosen role',async()=>{
 const {findItem}=await import('../../data/items')
 for(const id of ['chameleon_skink','dark_emissary','truthsayer','luthor_wolfenbaum']) {
  const roles=id==='luthor_wolfenbaum'?['crimson','wizard','archer'] as const:[undefined]
  for(const luthorRole of roles) {
   const s=hireHiredSword(roster(),id,id,{luthorRole}).value.hiredSwords[0]
   expect(s.equipment.length).toBeGreaterThan(0)
   for(const item of s.equipment) if(item.itemId) expect(findItem(item.itemId),item.itemId).toBeDefined()
  }
 }
})

it('removes hired Ogres and logs why when an Ogre Hunter returns',()=>{
 const before=hireHiredSword({...roster(),warbandTemplateId:'ogre_hunting_party'},'ogre_bodyguard','ogre').value
 const result=recruitHero(before,findWarbandTemplate('ogre_hunting_party')!,'ogre_hunting_party_ogre_hunter','Hunter','hunter')
 expect(result.value.hiredSwords[0].status).toBe('left')
 expect(result.events.some(e=>e.message.includes('Hunter rejoins'))).toBe(true)
 const leader=result.value.heroes[0]
 const maneaters={...before,warbandTemplateId:'maneaters',heroes:[{...leader,skillIds:['maneaters_skills_dog_of_war']}]}
 expect(conditionalHireDepartures(maneaters,{...maneaters,heroes:[{...maneaters.heroes[0],status:'dead'}]})).toHaveLength(1)
 expect(conditionalHireDepartures(maneaters,maneaters)).toEqual([])
})

it('honours the selected Scout through dismissal and unpaid upkeep',()=>{
 const r=hireHiredSword(roster(),'maglah_khan_s_horde','khan',{scouts:3}).value
 const scouts=r.hiredSwords.filter(s=>s.hiredSwordId==='hobgoblin_scout')
 r.hiredSwords.find(s=>s.id==='khan')!.flags.retainedScoutId=scouts[2].id
 expect(dismissWarrior(r,'khan').value.hiredSwords.filter(s=>s.status==='active').map(s=>s.id)).toEqual([scouts[2].id])
 expect(payUpkeep({...r,gold:0},'khan').value.warband.hiredSwords.filter(s=>s.status==='active').map(s=>s.id)).toEqual([scouts[2].id])
})

it('offers optional starting mounts only when selected and transfers a Knight’s existing Warhorse', () => {
  for (const [id, mount] of [['freelancer', 'warhorse'], ['highwayman', 'riding_draft_horse'], ['roadwarden', 'riding_draft_horse']]) {
    const foot = hireHiredSword(roster(), id, 'hire').value
    const mounted = hireHiredSword(roster(), id, 'hire', { mounted: true }).value
    expect(foot.hiredSwords[0].equipment.some(i => i.itemId === mount)).toBe(false)
    expect(mounted.hiredSwords[0].equipment).toContainEqual({ itemId: mount, quantity: 1 })
    expect(mounted.gold).toBe(foot.gold)
  }
  expect(() => hireHiredSword(roster(), 'knight_of_the_white_wolf', 'knight', { mounted: true })).toThrow('existing Warhorse')
  const r = hireHiredSword({ ...roster(), stash: [{ itemId: 'warhorse', quantity: 2 }] }, 'knight_of_the_white_wolf', 'knight', { mounted: true }).value
  expect(r.stash).toEqual([{ itemId: 'warhorse', quantity: 1 }])
  expect(r.hiredSwords[0].equipment).toContainEqual({ itemId: 'warhorse', quantity: 1 })
})

it('does not charge a Snake separately from the Charmer’s shared contract', () => {
  const r = hireHiredSword(roster(), 'snake_charmer', 'charmer').value
  expect(() => payUpkeep(r, r.hiredSwords[1].id)).toThrow('no separate upkeep')
})

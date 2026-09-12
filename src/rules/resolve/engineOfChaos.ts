import {RulesError} from './errors'

/** Engine of Chaos, Border Town Burning: equipment scrape lines 2284–2297. */
export const ENGINE_PRISON_CAPACITY=6
export interface EnginePrisoner {id:string;large:boolean}

/** Capacity counts a Large captive twice; Hashut's reward counts actual captives. */
export function enginePrisonLoad(prisoners:readonly EnginePrisoner[]){
 if(new Set(prisoners.map(p=>p.id)).size!==prisoners.length)throw new RulesError('engine.duplicate','The same captive cannot occupy two places.')
 const used=prisoners.reduce((total,p)=>total+(p.large?2:1),0)
 return {models:prisoners.length,used,free:Math.max(0,ENGINE_PRISON_CAPACITY-used),overCapacity:used>ENGINE_PRISON_CAPACITY}
}

export function canManCatcherCapture(input:{outOfAction:boolean;usedManCatcher:boolean;engineAvailable:boolean;targetLarge:boolean;targetAnimal:boolean}){
 return input.outOfAction&&input.usedManCatcher&&input.engineAvailable&&!input.targetLarge&&!input.targetAnimal
}

export type HashutRewardPlan={captives:number;xpRecipient:'leader'|'heroes';fixedXp:number;d3Count:number;d6GoldCount:number}
/** A dispatched Engine and escort miss the next battle; roll this only when they return. */
export function hashutRewardPlan(prisoners:readonly EnginePrisoner[]):HashutRewardPlan{
 const load=enginePrisonLoad(prisoners)
 if(!load.models)throw new RulesError('engine.emptyJourney','Choose at least one captive to send to the Dark Lands.')
 if(load.overCapacity)throw new RulesError('engine.capacity','The Engine can carry six places; a Large captive uses two.')
 return load.models<=3?{captives:load.models,xpRecipient:'leader',fixedXp:1,d3Count:0,d6GoldCount:0}
  :load.models<=5?{captives:load.models,xpRecipient:'heroes',fixedXp:0,d3Count:1,d6GoldCount:0}
  :{captives:6,xpRecipient:'heroes',fixedXp:0,d3Count:2,d6GoldCount:1}
}

/** Validate physical dice separately from allocating earned XP or changing either roster. */
export function resolveHashutReward(plan:HashutRewardPlan,d3:readonly number[],goldD6?:number){
 if(d3.length!==plan.d3Count||d3.some(d=>!Number.isInteger(d)||d<1||d>3))throw new RulesError('engine.rewardDice',`Record ${plan.d3Count} D3 result${plan.d3Count===1?'':'s'} for the experience reward.`)
 if(plan.d6GoldCount&&(goldD6===undefined||!Number.isInteger(goldD6)||goldD6<1||goldD6>6))throw new RulesError('engine.goldDice','Record a D6 for the gold reward.')
 if(!plan.d6GoldCount&&goldD6!==undefined)throw new RulesError('engine.unearnedGold','This number of captives does not award gold.')
 return {xp:plan.fixedXp+d3.reduce((a,b)=>a+b,0),gold:plan.d6GoldCount?goldD6!*5:0,xpRecipient:plan.xpRecipient}
}

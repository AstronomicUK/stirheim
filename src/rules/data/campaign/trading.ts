// Trading Rules — reference/rules/03-campaigns-magic-optional-rules.md lines 1039-1096
// (mordheimer.net/docs/campaigns/trading), plus the warband rating rule (03:46-53) and the
// post battle sequence (03:54-70) from "Playing a Campaign".

import type { NamedRule } from "../../types";
import type { DiceExpression, SourceRef } from "../../types/common";

export const TRADING_SOURCE: SourceRef = {
  publication: "Mordheim Rulebook (mordheimer.net/docs/campaigns/trading)",
  file: "03-campaigns-magic-optional-rules.md:1039-1096",
};

export const CAMPAIGN_SOURCE: SourceRef = {
  publication: "Mordheim Rulebook (mordheimer.net/docs/campaigns)",
  file: "03-campaigns-magic-optional-rules.md:24-90",
};

// ---- Rare items ----

/** Roll made per Hero looking for a rare item; success on equal-or-greater than the item's rarity. */
export const RARE_ROLL: DiceExpression = "2D6";

/** "If the roll is equal or greater, the item is available." One rare item per successful roll, one roll per Hero. */
export function rareItemAvailable(roll: number, rarity: number): boolean {
  return roll >= rarity;
}

// ---- Selling ----

/** Equipment sells for half its listed price; variable-priced rare items fetch half the basic cost only. */
export const SELL_PRICE_FRACTION = 0.5;

/**
 * Sale value of a piece of equipment given its listed (or, for variable-priced items, basic) price.
 * The source does not say how to round odd prices; this floors (a 15 gc item sells for 7 gc).
 */
export function sellPrice(listedOrBasePrice: number): number {
  return Math.floor(listedOrBasePrice * SELL_PRICE_FRACTION);
}

// ---- Veteran recruits ----

/** "Between each battle, roll 2D6: this represents the experience of the warriors currently available for hire." */
export const VETERAN_RECRUIT_ROLL: DiceExpression = "2D6";

/** "add 2 gold crowns to their cost for each extra Experience point they add to the warband's total." */
export const VETERAN_XP_COST_GC = 2;

// ---- Verbatim rule text ----

export const TRADING_RULES: NamedRule[] = [
  {
    name: "Spending Cash",
    text: "After every game, a warband can collect income from exploration, etc, and sell any wyrdstone and treasures they have acquired. Cash can be spent on recruiting new warriors, or on new equipment for the warband.\n\nThe price of wyrdstone varies according to current demand. See the Income section for details.",
  },
  {
    name: "New Recruits",
    text: "New warriors are recruited in the same way as the original warband with the notable exception of equipment. After the start of a campaign, a new hireling can only buy Common items from his warband's equipment chart freely. He may only be given Rare items from his warband's equipment chart if the warband can obtain them via the normal trading rules.\n\nWarbands may recruit whatever type of warriors the player wishes, but the usual restrictions apply regarding the number of Heroes, Henchmen, wizards, etc. For example, no warband may recruit a second leader, and no Mercenary warband can have more than two Champions.",
  },
  {
    name: "Recruiting Hired Swords",
    text: "Players may hire mercenary warriors known as 'Hired Swords' for the warband if they wish. See the Hired Swords section.",
  },
  {
    name: "New Recruits and Existing Henchmen Groups",
    text: "You may add new recruits to existing Henchman groups. If the group is relatively inexperienced, you will have no difficulty in finding raw recruits to add to their numbers. But more experienced gnarled veterans are not so keen on letting novice warriors join them – and quite rightly so! Between each battle, roll 2D6: this represents the experience of the warriors currently available for hire. You can hire as many warriors as you wish, as long as their combined Experience does not exceed your dice roll. For example, if you rolled 7, you could add a single warrior to a Henchman group with 7 Experience points, or two warriors to a Henchman group with 3 Experience points, or any combination thereof. Disregard any excess Experience points.\n\nAs with other new Henchmen, you must pay for all their weapons and armour, and in addition you must add 2 gold crowns to their cost for each extra Experience point they add to the warband's total. New Henchmen must be armed and equipped in the same way as existing members of the group.",
  },
  {
    name: "Weapons",
    text: "If a player wants to buy new weapons or other equipment for existing warriors, refer to the Trading Post. The chart lists all the equipment available in Mordheim, not just the common weapons included in the Recruitment charts. Rare items and weapons are not always available and vary in price. Remember that your warriors lack the skill to use any weapons other than the ones listed in the Recruitment charts. You may still want to buy rare items offered to you, as your warriors may be able to use them as they gain in experience.\n\nPlayers should preferably complete any recruiting and trading after the battle is over, making the appropriate dice rolls whilst both players are present.\n\nHowever, some players may prefer to wait until the heat of battle has cooled and they are able to consider purchases more carefully. Determine which rare items are offered for sale while both players are together. The players can work out what they will buy later.",
  },
  {
    name: "Trading",
    text: "Trade items are divided into two sections: common and rare items. Common items can be bought quite readily in any of the numerous trading posts and settlements around Mordheim. Players may purchase as many of these items as they want. The price of common items is fixed, so players always pay the same rate for them.\n\nRare items are hard or even impossible to come by. Only occasionally do such items turn up for sale and the price asked is often way above the true value. These items are often offered only to the most famous warbands, or those with the most money.",
  },
  {
    name: "Availability",
    text: "The Price chart has a column marked 'Availability'. Common items are always available, and can be bought in any quantity. Items marked 'rare' are more difficult to find. A rare item's availability is indicated by a number, for example 'Rare 9'.\n\nWhenever a Hero wants to buy a rare item, roll 2D6 and compare the result to the number stated. If the roll is equal or greater, the item is available. For example, you need to roll 9 or more to acquire an item marked 'Rare 9'. You can only buy one rare item for each successful roll. You may also only make one roll for each Hero looking for rare items. For example, if your warband has four Heroes, you may make four rolls to locate rare items. Warriors taken out of action during the last battle may not look for rare items.",
  },
  {
    name: "Selling",
    text: "A player may trade in weapons and equipment at the same time he buys new ones. After all, as warbands become more powerful they often abandon their earlier armament in favour of something better. However, the second-hand value of equipment is not high due to the considerable wear and tear inflicted on it by your warriors.\n\nWarriors can automatically sell equipment for half its listed price. In the case of rare equipment and weapons which have a variable price, the warband receives half of the basic cost only (merchants are far better at haggling than your warriors).\n\nAlternatively, weapons, armour and equipment may be hoarded for future use (make a note on the warband roster) or swapped around the warband from one fighter to another (though not between warbands). As a weapon's value is low compared to the cost of equipping any new recruits you may get, a warband can usually find a use for its cast-off armaments.",
  },
];

// ---- Warband rating (03:46-53) ----

/** Points per ordinary warrior in the rating formula. */
export const RATING_POINTS_PER_WARRIOR = 5;
/** Points per large creature (e.g. Rat Ogre) in the rating formula. */
export const RATING_POINTS_PER_LARGE_CREATURE = 20;

export const WARBAND_RATING_RULE: NamedRule = {
  name: "Warband Rating",
  text: "Each warband has a warband rating – the higher the rating the better the warband. The warband rating is simply the number of warriors in it multiplied by 5, plus their accumulated experience.\n\nLarge creatures such as Rat Ogres are worth 20 points plus the number of Experience points they have accumulated.\n\nThe warband's rating changes after each game, because surviving warriors will gain extra experience, warriors may have been killed, new ones added, etc. Hopefully your warband rating will go up, signifying your increase in power!",
};

/** Rating = 5 per warrior (20 per large creature) plus every warrior's accumulated experience. */
export function warbandRating(warriors: { experience: number; largeCreature?: boolean }[]): number {
  return warriors.reduce(
    (sum, w) => sum + (w.largeCreature ? RATING_POINTS_PER_LARGE_CREATURE : RATING_POINTS_PER_WARRIOR) + w.experience,
    0,
  );
}

// ---- Post battle sequence (03:54-70) ----

export const POST_BATTLE_SEQUENCE_INTRO =
  "After the battle is over, both players work their way through the following sequence. You do not have to work through it all at once (try to do the first three parts straight after the battle – you may wish to consider further purchases later) but any dice rolls must be seen by both players or a neutral third party.";

/** Steps 1-10 verbatim (index 0 = step 1); markdown bold markers around each step title removed. */
export const POST_BATTLE_SEQUENCE: string[] = [
  "Injuries. Determine the extent of injuries for each warrior who is out of action at the end of the game. See Serious Injuries.",
  "Allocate experience. Heroes and Henchmen groups gain experience for surviving battles. See the Experience and Scenarios sections for details.",
  "Roll on the Exploration chart. See the Income section for details.",
  "Sell Wyrdstone. This can only be done once per post battle sequence.",
  "Check available veterans. Roll to see how much Experience worth of veterans is available for hire. You don't have to commit to hiring any at this point.",
  "Make rarity rolls and buy rare items. Make rolls for any rare items you intend to buy and pay for them. These items go into the warband's stash.",
  "Look for Dramatis Personae. If you want to hire any.",
  "Hire new recruits & buy common items. New recruits come equipped with their free dagger and may be bought common items. This is done in any order and may be done several times. Note that newly hired recruits cannot buy rare items. They can, however, be equipped with rare items if there are any in the warband's stash in stage 9.",
  "Reallocate equipment. Swap equipment between models as desired (provided they are eligible to use it).",
  "Update your warband rating. You are now ready to fight again.",
];

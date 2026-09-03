// Warband templates — Grade 1c, scraped from mordheimer.net (rules/warbands/grade-1c.md).
//
// NOTE on equipment lists: `EquipmentList` (src/types/index.ts) only has meleeWeapons /
// missileWeapons / armour buckets — there is no bucket for a source "Miscellaneous Equipment"
// sub-list. Plain misc items with no independent write-up (e.g. a bare "Horse — 30 gc" or
// "Lucky Charm — 10 gc" line) are therefore intentionally NOT reproduced in equipmentLists.
// Anything from the source's "### Special Equipment" section (named items with their own rules
// text, including mounts/vehicles/masks) is instead captured losslessly as a warband-level
// specialRules entry named "Special Equipment: <Item Name>", regardless of which unit(s) can buy
// it — this keeps every full-text rule discoverable in exactly one place per warband.
//
// NOTE on skillTableIds: only Heroes pick skills from the warband's skill table in Mordheim, so
// every henchmanTemplates entry below has skillTableIds: [] (a Henchman that's promoted to Hero
// via "The Lad's Got Talent" switches to that Hero type's own skill-list access).
//
// NOTE on raceTraits: left as [] except where the source's warband-wide Special Rules literally
// restate the modeled Dwarf toughness traits (Black Dwarfs, The Sons of Hashut) — see traits.ts.
// Several warbands have psychology-flavoured special rules (e.g. Fear, Hatred, Animosity) that
// apply to most-but-not-all warband members (explicit per-source exceptions), so per the task
// brief these are captured in specialRules text only, not hoisted into raceTraits.

import type { WarbandTemplate } from "../../types";

export const WARBANDS: WarbandTemplate[] = [
  // ===================================================================================
  // Battle Monks of Cathay
  // ===================================================================================
  {
    id: `battle_monks_of_cathay`,
    name: `Battle Monks of Cathay`,
    grade: `1c`,
    race: `Human (Cathayan)`,
    originalSetting: `Grand Cathay`,
    sourcebook: `Border Town Burning (PDF)`,
    raceTraits: [],
    specialRules: [
      {
        name: `Strictures`,
        text: `A stringent regime of meditation is used by monks. Their faith is supported by a notion that the skin of one's body is armour in itself. Dragon Monks and Warrior Monks never wear any kind of armour.`,
      },
      {
        name: `Distaste for Poison`,
        text: `The use of poisons and various drugs is a speciality for dishonorable warriors who would stoop to such ends. Dragon Monks and Warrior Monks frown on this and may never use any kind of poison or venom.`,
      },
      {
        name: `Outsiders`,
        text: `Foreigners are generally considered unwelcome by the border guards of Cathay. The Battle Monks warband may never hire any sort of Hired Sword or Dramatis Personae unless specifically stated with the Hired sword/Dramatis Personae.`,
      },
      {
        name: `Warband Skill: Energy Focus`,
        text: `If fighting unarmed, the Hero may choose to reduce his Attacks by –1 and thus gain +1 Strength in close combat. The monk may sacrifice any number of attacks this way.`,
      },
      {
        name: `Warband Skill: Lightning Speed`,
        text: `The monk may triple his Movement whilst running or charging and may run even when there are enemy models within 8".`,
      },
      {
        name: `Warband Skill: Leap of Faith`,
        text: `The Hero cannot be intercepted whilst charging. He may escape from combat (as described on p. 161 in the Mordheim rulebook) by leaping away without having to pass an Ld test and may declare a leaping charge at the same time in the same turn.`,
      },
      {
        name: `Warband Skill: Human Shield`,
        text: `If two or more models are engaged in close combat with the monk, he may choose to grab one to use it as a shield instead of his normal attacks. To do this, he must pass an Initiative test after the first model has attacked, but before the second model attacks. On a successful roll, the monk grabs the first model – the second model directs its full attacks on the friendly model. After the combat phase, the model breaks free and the battle goes on as usual. On a failed roll, the monk and the second model use their normal attacks.`,
      },
      {
        name: `Warband Skill: Warmonger`,
        text: `The Emissary may make an Ld test before the battle. If the test is successful, D3+1 Raging Peasants join the warband for the next game (this may exceed the maximum number of warriors). Each Raging Peasant in the warband is subject to Hatred for the duration of the battle. Note: the Emissary may only pick the Warmonger skill.`,
      },
      {
        name: `Special Equipment: Chain Sticks`,
        text: `Cost: 20 gc · Availability: Rare 7 · Range: Close Combat · Strength: As user. A set of chain sticks allows its wielder to unleash a furious bludgeoning. A warrior armed with chain sticks gets +2 Attacks. This bonus only applies in the first turn of each hand-to-hard combat. Using chain sticks otherwise counts as having two hand weapons. Two-handed: Requires two hands to wield.`,
      },
      {
        name: `Special Equipment: Dragon Sword`,
        text: `Cost: 20 gc · Availability: Rare 10 · Range: Close Combat · Strength: As user +1. Dragon Swords are great-swords that are typically used by Cathayan soldiers and ronins, and occasionally lifted by monks. Two-handed: A model armed with a Dragon Sword may not use a shield, buckler or additional weapon in close combat. It gets an additional +1 armour save bonus against ranged attacks if it carries a shield. Parry: Dragon Swords, despite their great size, can be used for parrying like a sword. When his opponent rolls to hit, the model armed with it may roll a D6. If the score is greater than the highest to hit score of his opponent, the model has parried the blow, and that attack is discarded. A model may not parry attacks made with double or more its own Strength - they are simply too powerful to be stopped. (Note: in some older material, the Dragon Sword was referred to as "Katana".)`,
      },
      {
        name: `Special Equipment: Quarter Staff`,
        text: `Cost: 15 gc · Availability: Common · Range: Close Combat · Strength: As user. Balanced: A quarter staff is especially light and easy to wield. A model armed with a fighting staff gets +1 Initiative in close combat. Parry: Can parry enemy blows. Freestyle: Although a staff does not always require two hands to use, it cannot be combined with another weapon, shield, buckler, etc. However, it can be combined with the Monks bare hand attacks. This means that the Monk is still getting +1 Attack.`,
      },
      {
        name: `Special Equipment: Fish-hook Shot`,
        text: `Cost: 10 gc · Availability: Rare 7 · Range: 3" · Strength: 3. Thrown Weapon: Models using a fish-hook shot do not suffer penalties for range or moving as it is designed for short-range use anyway. Precise: A model using a fish-hook shot is so well-trained in the use of this weapon that he may attack enemy models that are engaged in close combat. However, the hook shot is useless when the monk himself is engaged in close combat. Caused Fall: The warrior may declare to try and cause an enemy model to fall instead of causing damage. The warrior must roll to hit as normal and then pass a Strength test. If the test is successful, the enemy model counts as knocked down. Apply a +1 modifier to the Strength test against large models. When a mount gets knocked down, the rider falls off (see 3-4 on the Whoa Boy! table).`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `battle_monks_soldier`,
        name: `Soldier Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Dragon Sword`, cost: `20 gc` },
          { name: `Cathayan longsword (Emissary only)`, cost: `75 gc` },
        ],
        missileWeapons: [
          { name: `Duelling pistol`, cost: `30 gc (60 gc for a brace)` },
          { name: `Handgun`, cost: `35 gc` },
          { name: `Bow`, cost: `10 gc` },
          { name: `Crossbow`, cost: `25 gc` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Heavy armour`, cost: `50 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
      {
        id: `battle_monks_monk`,
        name: `Monk Equipment List`,
        meleeWeapons: [
          { name: `Axe`, cost: `5 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Quarter staff`, cost: `15 gc` },
          { name: `Dragon Sword`, cost: `20 gc` },
          { name: `Chain sticks`, cost: `20 gc` },
        ],
        missileWeapons: [
          { name: `Fish-hook shot`, cost: `10 gc` },
          { name: `Throwing stars`, cost: `15 gc` },
        ],
        armour: [],
      },
      {
        id: `battle_monks_none`,
        name: `No Equipment (fights unarmed)`,
        meleeWeapons: [],
        missileWeapons: [],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: `battle_monks_emissary`,
        name: `Emissary`,
        role: `hero`,
        cost: 60,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 4, WS: 3, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: `battle_monks_soldier`,
        skillTableIds: [`shooting`, `academic`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Leader`, text: `Any warrior within 6" of the Emissary may use his Leadership when taking Ld tests.` },
          { name: `Ride Horse`, text: `The Emissary is trained in riding Horses.` },
          {
            name: `Decree`,
            text: `When the Emissary dies, a new one must be hired as soon as possible. Until you have done so, no other warriors and/or equipment may be bought. The new Emissary will then reclaim Leadership of the warband.`,
          },
        ],
      },
      {
        id: `battle_monks_officer`,
        name: `Officer`,
        role: `hero`,
        cost: 40,
        rosterLimit: `0-1`,
        startingExperience: 12,
        stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 7 },
        equipmentListId: `battle_monks_soldier`,
        skillTableIds: [`combat`, `shooting`, `strength`, `speed`],
        specialRules: [],
      },
      {
        id: `battle_monks_dragon_monks`,
        name: `Dragon Monks`,
        role: `hero`,
        cost: 55,
        rosterLimit: `0-3`,
        startingExperience: 15,
        stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: `battle_monks_monk`,
        skillTableIds: [`combat`, `academic`, `strength`, `speed`, `warband-unique`],
        specialRules: [
          {
            name: `Unarmed Combat`,
            text: `Monks suffer no penalties whatsoever for fighting unarmed and they receive +1 Attack when doing so.`,
          },
          {
            name: `Art of Silent Death`,
            text: `Dragon Monks have become masters of the Cathayan art of open-hand fighting. In hand-to-hand combat, if fighting unarmed, they will cause a critical hit on a roll 'to wound' of 5-6 instead of a 6. If the Dragon Monk wields a quarter staff, only the unarmed attacks will cause a critical hit on 5+.`,
          },
        ],
      },
    ],
    henchmanTemplates: [
      {
        id: `battle_monks_soldiers`,
        name: `Soldiers`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `battle_monks_soldier`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `battle_monks_warrior_monks`,
        name: `Warrior Monks`,
        role: `henchman`,
        cost: 35,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 7 },
        equipmentListId: `battle_monks_monk`,
        skillTableIds: [],
        specialRules: [
          {
            name: `Unarmed Combat`,
            text: `Monks suffer no penalties whatsoever for fighting unarmed, and they receive +1 Attack when doing so.`,
          },
        ],
      },
      {
        id: `battle_monks_raging_peasants`,
        name: `Raging Peasants`,
        role: `henchman`,
        cost: 10,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 6 },
        equipmentListId: `battle_monks_none`,
        skillTableIds: [],
        specialRules: [
          {
            name: `Equipment`,
            text: `A peasant is usually equipped with a pitchfork, torch, or other simple tool. Treat them as fighting unarmed but without any penalties.`,
          },
          { name: `Simple folk`, text: `Peasants never gain Experience.` },
          {
            name: `Mob`,
            text: `Peasants become threatening in large numbers. A Peasant gets +1 Ld for each other allied Peasant model within 3". Due to their rage, they do not benefit from the leader rule.`,
          },
          {
            name: `Ignored`,
            text: `Peasants that are out of action do not count toward the number of out-of-action models for the purpose of Rout tests.`,
          },
          {
            name: `Downtrodden`,
            text: `When a Peasant is wounded, do not roll for injury. The model is immediately taken out of action.`,
          },
        ],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1c-warbands/battle-monks-of-cathay`,
  },

  // ===================================================================================
  // Black Dwarfs
  // ===================================================================================
  {
    id: `black_dwarfs`,
    name: `Black Dwarfs`,
    grade: `1c`,
    race: `Chaos Dwarf`,
    originalSetting: `Border Town Burning`,
    sourcebook: `Border Town Burning (PDF)`,
    raceTraits: [`hard_to_kill`, `hard_head`],
    specialRules: [
      {
        name: `Applicability`,
        text: `The following special rules apply to all warriors in the warband excluding Informers.`,
      },
      {
        name: `Hard to Kill`,
        text: `Like their uncorrupted brethren, Chaos Dwarfs are tough, resilient individuals who can only be taken out of action on a roll of 6 instead of 5-6 when rolling on the Injury chart. Treat a roll of 1-2 as knocked down, 3-5 as stunned, and 6 as out of action.`,
      },
      {
        name: `Hard Head`,
        text: `Chaos Dwarfs ignore the special rules for clubs, maces, etc. They too are not easy to knock out!`,
      },
      { name: `Armour`, text: `Chaos Dwarfs never suffer movement penalties for wearing armour.` },
      {
        name: `Hired Swords`,
        text: `A Chaos Dwarf warband may hire the following Hired Swords: Ogre Bodyguard, Pit Fighter, Warlock, Imperial Assassin, and Hobgoblin Scout. They may hire any Hired Sword described as all may hire, or allowed by Orc warbands and Chaos warbands. They may never hire Elves of any sort!`,
      },
      {
        name: `Warband Skill: Chaos Engineer`,
        text: `The Hero has great technical skill and can use this to craft wicked armours and weapons. Whenever a Hero with this skill searches for Chaos armour (including Mechanical Suits) or Obsidian Weapons, he gets +3 on the roll. This represents the Engineer's ability to craft these items himself. The Hero ignores the Rarity and Gift of Chaos special rules and may never wear the Chaos Armours.`,
      },
      {
        name: `Warband Skill: Tyrant`,
        text: `This skill is for the Chaos Dwarf leader only. This Priest of Hashut is renowned for his tyranny. His word is absolute so his own warband fears his cruelty more then the enemy. When making a Rout test, and if led by a leader with this skill, the leader may inspire his warband to stick around. This skill allows the leader to re-roll any failed Rout test, as long as the leader is not knocked down or stunned. If re-rolled, the new result will apply even if the new result is worse. If the leader is taken out of action the warband must make an immediate Rout test.`,
      },
      {
        name: `Special Equipment: Man-catcher`,
        text: `Cost: 25 gc · Availability: Rare 10 · Range: Close Combat · Strength: As user. Semi-circular prongs mounted on pole-arms are popular among the Gaolers of Zharr-Naggrund. This non-lethal spring loaded device can ensnare the most violent of prisoners. Capture: A model taken out of action by a Mancatcher becomes captured. Do not roll for Serious Injuries. The catch is locked up in the Engine of Chaos instead. If the warband does not include an Engine of Chaos, roll for Serious Injuries as normal. Large models, such as Ogres, Trolls and Minotaurs, cannot be captured this way, and neither can animals. Two-handed: Requires two hands to wield.`,
      },
      {
        name: `Special Equipment: Obsidian Weapon`,
        text: `Cost: 4 x Price · Availability: Rare 12 · Range: Close Combat · Strength: As user +1. Obsidian is mined in the Dark Lands by the minions of Chaos. When expertly derived from its ore, the curious volcanic rock becomes ensorcelled by engineers manufacturing artefacts in the furnaces of Zharr-Naggrund. Forging weapons using these vile techniques requires acute diabolic expertise making them extremely rare. Blemished: Although not strictly tainted by Chaos, all artefacts of Obsidian are considered tinged with evil, by the same darkness associated with their artisans. Obsidian weapons may never be used by Dwarfs, Elves, Sisters of Sigmar, Witch Hunters or Priests. Heavy: Obsidian weapons are so heavy that the warrior using them always strikes last, even when charging. (Note: Both the Sons of Hashut warband and Border Town Burning contain the Obsidian Weapon; use EITHER the obsidian rules contained, or from Border Town Burning, not both, unless you rename one of them for clarity.)`,
      },
      {
        name: `Special Equipment: Steel Whip`,
        text: `Cost: 10 gc · Availability: Common · Range: Close Combat · Strength: As user. Another weapon unique to the Sisterhood is the steel whip, made from barbed steel chains. Cannot be parried: The steel whip is a flexible weapon and the Priestesses use it with great expertise. Attempts to parry its strikes are futile. A model attacked by a steel whip may not make parries with swords or bucklers. Whipcrack: When the wielder charges they gain +1A for that turn. This bonus attack is added after any other modifications. When the wielder is charged they gain +1A that they may only use against the charger. This additional attack will 'strike first'. If the wielder is simultaneously charged by two or more opponents they will still only receive a total of +1A. If the wielder is using two whips at the same time then they get +1A for the additional hand weapon, but only the first whip gets the whipcrack +1A.`,
      },
      {
        name: `Special Equipment: Chaos Armour`,
        text: `Cost: 185 gc · Availability: Rare 13 · Save: 4+. Chaos Armour is a suit of strangely-worked and unnatural metal. It is the mark of a Dark God's favour. While most suits of Chaos Armour are received as Gifts from an Infernal Patron, they can be acquired, though only from Chaos Dwarfs in an exclusive exchange for many captives or perhaps some impossible deed to further their interests. Rarity: When searching for Chaos armour a warrior gains +1 on his Rarity roll for each model he took out of action in the previous battle. Cost: The cost for found Chaos armour is decreased by 1 gold crown for each Experience point the Hero has. Gift of Chaos: A Hero who has successfully purchased a suit of Chaos armour will never give it away to another warband member but put it on himself immediately. Chaos armour becomes fused to the body of its wearer. It can never be removed. Spellcasters: Chaos armour does not hinder its wearer from casting spells or rituals. It can be worn by spellcasters but they cannot combine it with a shield or buckler without appropriate skills. Movement Penalty: There is no Movement penalty for combining Chaos Armour with a Shield.`,
      },
      {
        name: `Special Equipment: Mechanical Suit`,
        text: `Cost: 225 gc · Availability: Rare 14 (Chaos Dwarfs only). The Curse of Stone comes to all Chaos Dwarf Sorcerers, gradually transforming them to rock from the feet up. Engineers have crafted machines which can transport their Priests as they begin to pay the price for working dark rituals. Rarity/Cost/Gift of Chaos/Spellcasters rules as per Chaos Armour above. Suited and Booted: A Sorcerer equipped with a Mechanical suit receives +3 to Movement. Movement Penalty: There is no Movement penalty for combining Chaos Armour with a Shield.`,
      },
      {
        name: `Special Equipment: Vehicles — Engine of Chaos`,
        text: `Cost: 195 gc · Availability: Rare 10 (Chaos Dwarfs only). Profile — Engine: M-, WS-, BS-, S-, T8, W4, I-, A-, Ld-. Wheel: M-, WS-, BS-, S-, T6, W1, I-, A-, Ld-. Daemon: M6, WS-, BS-, S-, T6, W3, I-, A-, Ld-. Gaolers lock up their victims in a twisted daemonic machine crafted by the industrial insanity of Chaos Engineers. Wagon: The Engine of Chaos follows all rules for Wagons (see Empire in Flames Supplement, p. 30–33) unless specified otherwise here. Daemon: The Engine of Chaos is powered by the binding of a daemon; daemon movement is unaffected by cargo. Passengers: A Chaos Dwarf must function as the driver. No other models but captives may passage the Engine of Chaos. No more than six captives may be imprisoned in the Engine at a time – large creatures count as two models. Pedal to the Metal: The driver may apply the effects of the lash; if an Engine of Chaos goes out of control refer to the Out of Control table, with 'Loss of Control' result 5 replaced by the Daemon releasing itself, moving 6" straight ahead then halting for the rest of the battle. Prisoners: Models always become captives when fighting a battle against a Chaos Dwarf warband that has an Engine of Chaos by rolling the Captured result on the Serious Injuries table or by being taken out of action by a Man-catcher (their equipment is lost to the Chaos Dwarf warband). Captives can be set free by destroying the Engine of Chaos or using the prison keys (taken from a Gaoler put out of action). Hashut's Reward: The Chaos Dwarfs may choose to send captives back to the Dark Lands after a battle — any number of captives must be sacrificed to Hashut; the Engine of Chaos plus one Hero must miss the next battle; captives must be removed from their warbands' rosters permanently. After the Hero rejoins: 1-3 captives = +1 Experience for the leader; 4-5 = +D3 Experience distributed among Heroes; 6 = +2D3 Experience distributed among Heroes plus D6x5 gold crowns.`,
      },
    ],
    warbandSkillIds: [`extra_tough`, `thick_skull`, `resource_hunter`, `true_grit`],
    equipmentLists: [
      {
        id: `black_dwarfs_chaos_dwarf`,
        name: `Chaos Dwarf Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Steel Whip (Gaolers only)`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
          { name: `Man-catcher (Gaolers only)`, cost: `25 gc` },
        ],
        missileWeapons: [
          { name: `Pistol`, cost: `15 gc (30 gc for a brace)` },
          { name: `Blunderbuss`, cost: `30 gc` },
          { name: `Handgun`, cost: `35 gc` },
        ],
        armour: [
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Light armour`, cost: `20 gc` },
          { name: `Heavy armour`, cost: `50 gc` },
          { name: `Mechanical Suit (Sorcerer only)`, cost: `175 gc` },
        ],
      },
      {
        id: `black_dwarfs_informer`,
        name: `Informer Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Spear`, cost: `10 gc` },
        ],
        missileWeapons: [
          { name: `Sling`, cost: `2 gc` },
          { name: `Bow`, cost: `10 gc` },
        ],
        armour: [
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Light armour`, cost: `20 gc` },
        ],
      },
    ],
    heroTemplates: [
      {
        id: `black_dwarfs_sorcerer`,
        name: `Sorcerer`,
        role: `hero`,
        cost: 85,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 3, WS: 4, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 9 },
        equipmentListId: `black_dwarfs_chaos_dwarf`,
        skillTableIds: [`combat`, `academic`, `strength`, `warband-unique`],
        specialRules: [
          { name: `Leader`, text: `Any warrior within 6" of the Sorcerer may use his Leadership when taking Ld tests.` },
          { name: `Wizard`, text: `The Sorcerer is a wizard and follows the rules for wizards in the magic section. Sorcerers may cast Rituals of Hashut.` },
          {
            name: `Priest`,
            text: `The Sorcerer starts with two rituals. One of them is the Sacrificial Ritual. The other spell is determined as usual from the Rituals of Hashut.`,
          },
        ],
      },
      {
        id: `black_dwarfs_bull_centaur`,
        name: `Bull Centaur`,
        role: `hero`,
        cost: 100,
        rosterLimit: `0-1`,
        startingExperience: 10,
        stats: { M: 8, WS: 4, BS: 3, S: 4, T: 4, W: 1, I: 3, A: 2, Ld: 9 },
        equipmentListId: `black_dwarfs_chaos_dwarf`,
        skillTableIds: [`combat`, `strength`],
        specialRules: [
          { name: `No missile weapons`, text: `Bull Centaur may be equipped with weapons and armour chosen from the Chaos Dwarf Equipment list, but may never use any missile weapons.` },
          {
            name: `Large target`,
            text: `Bull centaurs are large creatures and therefore make tempting targets for archers. Anyone shooting at the Bull Centaur gains a +1 'to hit' and may shoot at it even if it is not the closest target. As large targets a Bull Centaur adds an extra +20 to the warband's rating.`,
          },
        ],
      },
      {
        id: `black_dwarfs_gaolers`,
        name: `Gaolers`,
        role: `hero`,
        cost: 50,
        rosterLimit: `0-2`,
        startingExperience: 8,
        stats: { M: 3, WS: 4, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 9 },
        equipmentListId: `black_dwarfs_chaos_dwarf`,
        skillTableIds: [`combat`, `shooting`, `strength`, `warband-unique`],
        specialRules: [
          {
            name: `Nasty Reputation`,
            text: `Gaolers are known for their brutality. The dreaded sight of them and the very thought of being captured causes fear in Humans.`,
          },
        ],
      },
    ],
    henchmanTemplates: [
      {
        id: `black_dwarfs_informers`,
        name: `Informers`,
        role: `henchman`,
        cost: 15,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `black_dwarfs_informer`,
        skillTableIds: [],
        specialRules: [
          {
            name: `Drudgery`,
            text: `Informers have had their will broken by their masters. Informers may never become Heroes. Re-roll all results of 'The lad's got talent' for them.`,
          },
        ],
        notes: `Informers are excluded from the warband's Hard to Kill / Hard Head / Armour special rules (see the warband-level "Applicability" note).`,
      },
      {
        id: `black_dwarfs_chaos_dwarfs`,
        name: `Chaos Dwarfs`,
        role: `henchman`,
        cost: 40,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 3, WS: 4, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 9 },
        equipmentListId: `black_dwarfs_chaos_dwarf`,
        skillTableIds: [],
        specialRules: [],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1c-warbands/black-dwarfs`,
  },

  // ===================================================================================
  // Bretonnian Chapel Guard
  // ===================================================================================
  {
    id: `bretonnian_chapel_guard`,
    name: `Bretonnian Chapel Guard`,
    grade: `1c`,
    race: `Human (Bretonnian)`,
    originalSetting: `Mordheim`,
    sourcebook: `Fan made from the web (PDF). Editors: David "StyrofoamKing" Seidman-Joria and Malte Lund "Master" Adamson based on the Bretonnian Warband by Tom Merrigan, Formatting by Steven Young`,
    raceTraits: [],
    specialRules: [
      {
        name: `Chivalry`,
        text: `No Knight may ever use any missile weapon at all, with the exception of Holy Water. Likewise, they will never use any drug or poison, nor learn any spells (prayers are allowed).`,
      },
      {
        name: `Lord's Boon`,
        text: `Every Knight, either at warband formation or upon later recruitment, is likely to start with some sort of boon from the baron, marquis, or similar lord he serves. Each Knight may, upon purchase, start with ONE of the following items, which is bought at half cost: a Warhorse, Light Armour, OR Heavy Armour. This item may not be traded, given to another warrior, or sold. The warrior may set it aside and choose not to use it, but no Bretonnian warrior would dare use a boon item that belonged to another Knight, even after the warrior's death. If the Knight dies, his "Lord's Boon" item is removed from the warband, having been buried with him or returned to his benefactor.`,
      },
      {
        name: `Virtue of Purity`,
        text: `Knights with the Virtue of Purity may never voluntarily break from combat, unless he is knocked down. He is immune to All Alone and any other mundane effect that would cause him to leave combat. Magical spells and effects that would cause him to flee (ex. Dread of Aramar) affect him as normal.`,
      },
      {
        name: `Warband Skill: Renowned Virtue`,
        text: `The Knight may learn one Virtue from the original Bretonnian Warband list, written by Tom Merrigan. The "Renowned Virtue" skill may only be taken once.`,
      },
      {
        name: `Warband Skill: Questing Vow`,
        text: `Questing Knight only. If the knight is charging, charged by, or in combat with a fear-causing enemy, they may reroll any Leadership test they take once, accepting the second result. This includes Rout tests.`,
      },
      {
        name: `Warband Skill: Shield Bash`,
        text: `Each turn, the Knight may make an additional attack with a shield or kite shield, which is made at -1 Strength. Treat the shield attack as a club.`,
      },
      {
        name: `Warband Skill: Bulging Muscles`,
        text: `The Knight retains the +1/+2 Strength bonus from Flails and Morning Stars after the first round of combat.`,
      },
      {
        name: `Warband Skill: Untiring`,
        text: `The Knight ignores movement penalties for wearing armour while on foot. In addition, strength, axes, critical hits, and similar modifiers cannot reduce the saving throw lower than 5+, nor will it be ignored by any non-magical means.`,
      },
      {
        name: `Special Equipment: Broadsword`,
        text: `Cost: 15 gc · Availability: Common · Range: Close Combat · Strength: As user +1. Difficult to use: A model with a Broadsword may not use a second weapon or buckler in his other hand because it requires all his skill to wield it. He may carry a shield or a kite shield as normal though. Strike last: Broadswords are so heavy that the model using them always strikes last, even when charging. Just like a Double-Handed weapon, learning the skill 'Strongman' negates 'Strike Last'.`,
      },
      {
        name: `Special Equipment: Shortsword`,
        text: `Cost: 7 gc · Availability: Common · Range: Close Combat · Strength: As user. Parry: Shortswords offer an excellent balance of defence and offence. A model armed with a sword may parry blows. When his opponent rolls to hit, the model armed with a sword may roll a D6. If the score is greater than the highest to hit score of his opponent, the model has parried the blow, and that attack is discarded. A model may not parry attacks made with double or more its own Strength – they are simply too powerful to be stopped. +1 Enemy armour save: An enemy wounded by a short sword gains a +1 bonus to his armour save, and a 6+ armour save if he has none normally.`,
      },
      {
        name: `Special Equipment: Kite Shield`,
        text: `Cost: 10 gc · Availability: Common · Save: 5+ on foot, 6+ mounted (or +2 on foot, +1 mounted with armour). A model with a kite shield has a basic save of 5+ on a D6 while on foot, and 6+ while mounted (or, if the model is already wearing armour, as +2 on foot, and +1 save while mounted). This cannot bring a save over 1+. (Note: If your gaming group already uses house rules for enhanced shields, remove Kite Shield from the equipment list.)`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `bretonnian_knights`,
        name: `Knights Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Broadsword`, cost: `15 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
          { name: `Morning star`, cost: `15 gc` },
          { name: `Flail`, cost: `15 gc` },
          { name: `Lance (Not Questing Knight)`, cost: `20 gc` },
        ],
        missileWeapons: [],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Heavy armour`, cost: `50 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Kite Shield`, cost: `10 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Barding`, cost: `30 gc` },
        ],
      },
      {
        id: `bretonnian_pilgrims`,
        name: `Pilgrims' Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Shortsword`, cost: `7 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Halberd`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
        ],
        missileWeapons: [],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Buckler`, cost: `5 gc` },
        ],
      },
      {
        id: `bretonnian_bowmen`,
        name: `Bowmen Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Shortsword`, cost: `7 gc` },
          { name: `Spear`, cost: `10 gc` },
        ],
        missileWeapons: [
          { name: `Bow`, cost: `10 gc` },
          { name: `Long bow`, cost: `15 gc` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
    ],
    heroTemplates: [
      {
        id: `bretonnian_questing_knight`,
        name: `Questing Knight`,
        role: `hero`,
        cost: 75,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 4, WS: 4, BS: 3, S: 4, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: `bretonnian_knights`,
        skillTableIds: [`combat`, `academic`, `strength`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Leader`, text: `Any warrior within 6" of the Questing Knight may use his Leadership characteristic when taking Leadership tests.` },
          { name: `Knight`, text: `The Questing Knight has the following rules from above apply to him: Chivalry, Lord's Boon and Virtue of Purity.` },
          { name: `Ride`, text: `A Questing Knight starts with the skill 'Ride Warhorse'.` },
          { name: `Vow of Poverty`, text: `May not take a Lance.` },
        ],
      },
      {
        id: `bretonnian_damsel`,
        name: `Damsel`,
        role: `hero`,
        cost: 35,
        rosterLimit: `0-1`,
        startingExperience: 12,
        stats: { M: 4, WS: 2, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 7 },
        equipmentListId: `bretonnian_bowmen`,
        skillTableIds: [`academic`, `speed`],
        specialRules: [
          { name: `Equipment restriction`, text: `A Damsel may be equipped with any non-missile, non-armour item chosen from the Bowmen section of the Bretonnian Equipment list.` },
          { name: `Prayercaster`, text: `The Damsel starts with one prayer from the "Lady's Prayers" list, and can learn additional prayers as outlined in the Magic section.` },
        ],
      },
      {
        id: `bretonnian_knight_errant`,
        name: `Knight Errant`,
        role: `hero`,
        cost: 35,
        rosterLimit: `0-3`,
        startingExperience: 8,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `bretonnian_knights`,
        skillTableIds: [`combat`, `strength`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Knight`, text: `The Knight Errant has the following rules from above apply to him: Chivalry, Lord's Boon and Virtue of Purity.` },
          { name: `Vain`, text: `The Knight may not wear a helmet, as it reduces their chances of being noticed by pretty ladies.` },
          {
            name: `Impetuous`,
            text: `During each Movement Phase, after declaring charges, a Knight Errant that is not in combat and did not charge this turn must charge an opposing standing warrior (not knocked down or stunned) that is within range if they are able. Likewise, a Knight Errant that declared a charge against a knocked down or stunned opponent will be compelled to charge a viable standing opponent instead. If you wish, you may choose to have the Knight take a leadership test (they may use their Leader's Leadership if they are within range); if the test is passed, they may move as normal or charge their original target. When making a compelled charge, the Knight Errant automatically passes all fear tests or any other psychology tests that would prevent them from charging.`,
          },
        ],
      },
    ],
    henchmanTemplates: [
      {
        id: `bretonnian_squires`,
        name: `Squires`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `bretonnian_bowmen`,
        skillTableIds: [],
        specialRules: [
          {
            name: `Equipment restriction`,
            text: `Squires may be equipped with weapons and armour chosen from the Battle Pilgrims and from the Bowmen section of the Bretonnian Equipment list. A Squire may not ride a horse unless the Questing Knight and any Knight Errant in the warband are riding warhorses.`,
          },
          {
            name: `Knighthood`,
            text: `When a Squire rolls "The Lad's Got Talent", you may choose one of two options when promoting him to a hero: to have him remain a Squire, or to have him become a Knight Errant (this may exceed three Knights Errant in the warband). If kept a Squire, he may choose two skill lists from Combat, Academic, Strength, or Speed, retaining his normal Squire equipment tables. If made a Knight Errant, he immediately gains the 'Knight', 'Vain' and 'Impetuous' rules instead of receiving an immediate advancement; he may learn Special Skills in addition to two other skill sets, but must immediately switch his equipment to the Knight Equipment list, and may never use missile weapons.`,
          },
        ],
      },
      {
        id: `bretonnian_battle_pilgrims`,
        name: `Battle Pilgrims`,
        role: `henchman`,
        cost: 30,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `bretonnian_pilgrims`,
        skillTableIds: [],
        specialRules: [
          {
            name: `Low Caste`,
            text: `Battle Pilgrims are peasants; Low Caste henchmen learn experience and advance as normal, but reroll any results of "The Lad's Got Talent", and may never become heroes.`,
          },
          { name: `Hatred`, text: `Battle Pilgrims suffer Hatred against all of their enemies, seeing them as enemies and heretics to the true Lady's cause.` },
          { name: `Stubborn`, text: `Battle Pilgrims reroll all failed Leadership rolls once, accepting the second result.` },
          {
            name: `Holy Relics`,
            text: `Battle Pilgrims may be given a Holy Relic, regardless of the fact that henchman are not normally allowed to take Miscellaneous items. If a Battle Pilgrim owns a Holy Relic, he gains the ability Frenzy (immune to Hatred while frenzied). It is possible to give a Holy Relic to a Battle Pilgrim that is part of a larger henchman group — if there aren't enough Holy Relics for every member, the Pilgrim with the relic breaks off and forms his own individual henchman group.`,
          },
        ],
      },
      {
        id: `bretonnian_bowmen`,
        name: `Bowmen`,
        role: `henchman`,
        cost: 15,
        rosterLimit: `0-7`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 4 },
        equipmentListId: `bretonnian_bowmen`,
        skillTableIds: [],
        specialRules: [
          {
            name: `Low Caste`,
            text: `Bowmen are peasants; Low Caste henchmen learn experience and advance as normal, but reroll any results of "The Lad's Got Talent", and may never become heroes.`,
          },
        ],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1c-warbands/bretonnian-chapel-guard`,
  },

  // ===================================================================================
  // Court of the Profane Pleasures
  // TODO: source explicitly states "Currently there is no skill table available, this has been
  // acknowledged by the authors and will be published when available" — every hero below therefore
  // has skillTableIds: [] pending that publication. The source also warns this whole warband "is
  // still in draft stage and very much work in progress".
  // TODO: the "Wretches Equipment List" is headed "(Thralls only)" in the source even though this
  // warband's henchman type is named "Wretches", not "Thralls" (that label appears to be carried
  // over from The Cursed Cavalcade's near-identical Thralls Equipment List) — reproduced as-is.
  // ===================================================================================
  {
    id: `court_of_the_profane_pleasures`,
    name: `Court of the Profane Pleasures`,
    grade: `1c`,
    race: `Human (Slaaneshi Cult) with Beastmen/Hounds`,
    originalSetting: `Mordheim`,
    sourcebook: `Tuomas Pirinen (PDF)`,
    raceTraits: [],
    specialRules: [
      {
        name: `Corruption of the Mind and Flesh`,
        text: `Whenever an enemy model, be it Hero or a Henchman of the opponents of the Warband or one of their own models dies, the Warband may opt to perform an obscene ritual to attach a part of the dying warrior into one of the Slaaneshi Beastmen, Cultist or the Slaaneshi Hounds: arm, leg, head or strips of muscle, for example. You can take one stat of the fallen warrior and replace it with the same stat of the Beastman, Cultist or Hound. We encourage players to convert the model to represent the corrupted creature with appropriate new body parts. This ritual costs 1 Wyrdstone, and 1 Hero cannot search for Rare items at the market while performing the ritual.`,
      },
      {
        name: `Mutations`,
        text: `Any Hero may buy one of the following Mutations when you recruit them (see Cults of Possessed Rules for Mutations): Extra arm, Tentacle, Great Claw.`,
      },
      {
        name: `Special Equipment: Slaaneshi Man-Catcher`,
        text: `Cost: 30 gc · Availability: Rare 10 (Whipmaster only) · Range: Close combat · Strength: As user +1 · Special Rules: Requires two hands, Lock. Lock: If it hits and causes an unsaved wound, do not roll on the injury chart. Instead, the enemy is knocked down, and cannot stand up as long as it is in melee combat with the wielder. The target cannot move away from the combat unless magic is used. The wielder can move (and drags the enemy with them) as long as they are not engaged in combat with any other model. The Man-Catcher does not work on Large creatures such as Ogres, or Steeds such as Horses. If you switch weapons while using the Man-Catcher, the opponent can then stand up as normal in their recovery phase. At the end of the battle, the target model is captured as a result of a 61 on the Serious Injury chart if still pinned down by the Man-Catcher, even if it is a Henchman.`,
      },
      {
        name: `Special Equipment: Hedonist Whip`,
        text: `Cost: 15 gc · Availability: Common (Heroes only) · Range: Close combat · Strength: As user · Special Rules: Cannot be parried, Whipcrack. Cannot be parried: A model attacked by a Hedonist Whip may not make parries with swords or bucklers. Whipcrack: When the wielder charges they gain +1A for that turn, added after any other modifications. When charged, they gain +1A usable only against the charger, which 'strikes first'. If simultaneously charged by two or more opponents, still only a total of +1A. If using two whips at once, +1A for the additional hand weapon, but only the first whip gets the Whipcrack +1A.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `court_of_pleasures_equipment`,
        name: `Court of Pleasures Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Hedonist Whip (Heroes only)`, cost: `15 gc` },
          { name: `Slaaneshi Man-Catcher (Whipmaster only)`, cost: `30 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
        ],
        missileWeapons: [
          { name: `Bow`, cost: `15 gc` },
          { name: `Pistol`, cost: `15 gc (30 for a brace)` },
          { name: `Long rifle`, cost: `200 gc` },
          { name: `Crossbow pistol`, cost: `35 gc` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Buckler`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
      {
        id: `court_of_pleasures_wretches`,
        name: `Wretches Equipment List (Thralls only)`,
        meleeWeapons: [
          { name: `Dagger`, cost: `2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
        ],
        missileWeapons: [{ name: `Short bow`, cost: `10 gc` }],
        armour: [
          { name: `Shield`, cost: `5 gc` },
          { name: `Buckler`, cost: `5 gc` },
        ],
      },
      {
        id: `court_of_pleasures_none`,
        name: `No Equipment`,
        meleeWeapons: [],
        missileWeapons: [],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: `court_of_pleasures_whipmaster`,
        name: `Slaaneshi Whipmaster`,
        role: `hero`,
        cost: 70,
        rosterLimit: `0-1`,
        startingExperience: 8,
        stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: `court_of_pleasures_equipment`,
        skillTableIds: [],
        specialRules: [
          {
            name: `Agony and Ecstasy`,
            text: `The Whipmaster who is armed with a Hedonist Whip may decide to use one of its attacks to scourge one friendly model within 3". This attack automatically hits and has +1 on its rolls to wound. Roll for any injuries as standard. As a reward for such a pious act of devotion, Slaanesh rewards the Whipmaster with a surge of ecstasy that makes the Whipmaster all but invulnerable. The Whipmaster doubles its Toughness. Take a Leadership test at the start of each new turn of the Slaaneshi player. On a failure, this effect ends, though it can be re-activated.`,
          },
          {
            name: `Pain and Pleasure`,
            text: `Whenever the Whipmaster suffers an unsaved wound, they will be subject to the rules of Frenzy until the end of their next turn — this Frenzy is not negated by being Knocked Down or Stunned.`,
          },
        ],
      },
      {
        id: `court_of_pleasures_danseuse`,
        name: `Slaaneshi Danseuse`,
        role: `hero`,
        cost: 70,
        rosterLimit: `0-1`,
        startingExperience: 8,
        stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 7 },
        equipmentListId: `court_of_pleasures_equipment`,
        skillTableIds: [],
        specialRules: [
          { name: `No armour`, text: `A Danseuse may never wear armour.` },
          {
            name: `Strange Allure`,
            text: `An enemy wishing to attack a Danseuse in melee combat or with a missile attack must pass a Leadership test to do so before making its attacks. On a failure, the model must re-roll any successful hits.`,
          },
        ],
      },
      {
        id: `court_of_pleasures_flesh_merchant`,
        name: `Slaaneshi Flesh Merchant`,
        role: `hero`,
        cost: 65,
        rosterLimit: `0-1`,
        startingExperience: 8,
        stats: { M: 4, WS: 4, BS: 3, S: 4, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `court_of_pleasures_equipment`,
        skillTableIds: [],
        specialRules: [
          {
            name: `Pound of Flesh`,
            text: `Before the battle, you may decide to give one of the Wretches to the Flesh Merchant to carry as a "meat shield" as part of the Merchant's Equipment. When the Flesh Merchant suffers a wound for any reason, you may elect to let the slave take the hit instead — the Slave is taken Out of Action and removed from the game. The Wretch can make its normal Attacks in melee if used as a Meat Shield, has no base of its own, and cannot be targeted by enemy attacks. If the Merchant dies, the Wretch is lost with it.`,
          },
          {
            name: `Cruel Fate`,
            text: `Any captives the warband gains through combat results or exploration can be turned into Wretches at no cost. This is achieved via lobotomy, torture and other acts of depravity.`,
          },
        ],
      },
      {
        id: `court_of_pleasures_priest_of_obscene`,
        name: `Slaaneshi Priest of Obscene`,
        role: `hero`,
        cost: 50,
        rosterLimit: `0-1`,
        startingExperience: 6,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: `court_of_pleasures_equipment`,
        skillTableIds: [],
        specialRules: [
          {
            name: `Flesh Reserve`,
            text: `Before the battle, you may decide to give one of the Wretches to the Priest to carry as a "sacrificial pawn" as part of the Priest's Equipment. When the Priest fails to cast a spell, they can choose to sacrifice the Wretch to re-roll the spell roll. The Wretch can make its normal Attacks in melee until it's alive, has no base of its own and cannot be targeted by enemy attacks. If the Priest dies, the Wretch is lost with it.`,
          },
          { name: `Wizard`, text: `The Priest of Obscene is a Wizard and uses the Chaos Rituals Spell list.` },
        ],
      },
      {
        id: `court_of_pleasures_devout`,
        name: `Slaaneshi Devout`,
        role: `hero`,
        cost: 65,
        rosterLimit: `0-1`,
        startingExperience: 8,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `court_of_pleasures_equipment`,
        skillTableIds: [],
        specialRules: [
          {
            name: `Fluctuating Form`,
            text: `At the beginning of the battle, and every turn in the Recovery phase, if not engaged in close combat, you may choose whether the Devout manifests in male or female aspect. Male Form profile: M4 WS4 BS3 S4 T4 W1 I3 A2 Ld7 (base +1 WS, S, A, T). Female Form profile: M6 WS3 BS4 S3 T3 W1 I5 A1 Ld9 (base +1 BS, +2 I, +2 Ld, +2 M).`,
          },
          { name: `Immune to Psychology`, text: `The Devout is immune to Psychology and all alone tests.` },
        ],
        notes: `stats above are the "Base" row from the source's 3-row profile table (Base/Male Form/Female Form); see the Fluctuating Form rule for the Male/Female deltas.`,
      },
    ],
    henchmanTemplates: [
      {
        id: `court_of_pleasures_chaos_hounds`,
        name: `Slaaneshi Chaos Hounds`,
        role: `henchman`,
        cost: 15,
        rosterLimit: `0-3`,
        startingExperience: 0,
        stats: { M: 7, WS: 4, BS: 0, S: 4, T: 3, W: 1, I: 3, A: 1, Ld: 3 },
        equipmentListId: `court_of_pleasures_none`,
        skillTableIds: [],
        specialRules: [{ name: `Animal`, text: `Chaos Hounds are animals and never gain any experience.` }],
      },
      {
        id: `court_of_pleasures_beastmen`,
        name: `Slaaneshi Beastmen`,
        role: `henchman`,
        cost: 35,
        rosterLimit: `0-3`,
        startingExperience: 0,
        stats: { M: 5, WS: 4, BS: 3, S: 3, T: 4, W: 1, I: 4, A: 1, Ld: 6 },
        equipmentListId: `court_of_pleasures_equipment`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `court_of_pleasures_wretches`,
        name: `Slaaneshi Wretches`,
        role: `henchman`,
        cost: 10,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 5 },
        equipmentListId: `court_of_pleasures_wretches`,
        skillTableIds: [],
        specialRules: [
          {
            name: `Slaves to Darkness`,
            text: `Wretches are Immune to all psychology and All Alone tests if within 6" of a friendly Hero. Wretches can't become Heroes. If you roll The Lad's Got Talent result on the chart, and then roll it again, the model receives a Serious Injury as if it were a Hero (roll it immediately).`,
          },
        ],
      },
      {
        id: `court_of_pleasures_cultists`,
        name: `Cultists`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `court_of_pleasures_equipment`,
        skillTableIds: [],
        specialRules: [],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1c-warbands/court-of-the-profane-pleasures`,
  },

  // ===================================================================================
  // The Cursed Cavalcade
  // ===================================================================================
  {
    id: `the_cursed_cavalcade`,
    name: `The Cursed Cavalcade`,
    grade: `1c`,
    race: `Human (Fallen Nobility)`,
    originalSetting: `Mordheim`,
    sourcebook: `Tuomas Pirinen (PDF)`,
    raceTraits: [],
    specialRules: [
      {
        name: `Foolish Nobleness`,
        text: `Even if all non-animal members of the warband are Human, the distorted and perverted power of the dark gods bent the morale and psyche of these men beyond any imaginable level, even for the most tolerant of mercenary. For this reason, the Cursed Cavalcade is treated as an Evil warband, similarly to the Cult of the Possessed, for all game effects purpose (such as, for example, for the effect 333 - Prisoners, on the exploration chart). They cannot hire any Hired Sword or Dramatis Personae, other than the Crow Master and anyone that specifically says otherwise.`,
      },
      {
        name: `Capture!`,
        text: `If a Hero takes Out of Action an enemy human Henchmen model with a Misericordia, and you have less than 5 Captured Thrall in your warband, roll a die: on a 5+ the model is captured. Enemy Heroes can only be Captured as a result of a roll of "61 - Captured!" on the Serious Injuries Table. It's not possible to Capture more than 2 models per game. If you already captured 2 henchmen, or already have 5 Captured Thrall in your warband, reroll any result of "61 - Captured!" for the heroes.`,
      },
      {
        name: `The Throne of Worms`,
        text: `The most horrible end for an enemy of the Cavalcade is not death but capture! Captured models are brought down to the Throne of Worms and abandoned to the judgment of this abomination. For each enemy captured, instead of rolling on the Serious Injury Table after the battle, roll 1d6: 1-2 The warrior is swallowed up forever by the Throne of Worms — remove the warrior from the original warband's roster. 3-5 The warrior completely loses his mind and is submitted to the power of the Throne — remove the warrior from the original warband's roster and you gain a Captured Thrall for your warband. 6 The warrior is sacrificed with a ritual to the Throne — remove the warrior from the original warband's roster and a random Hero in your warband gains 1 XP. Note: this replaces the Captured! standard rules on the Serious Injuries Table for Heroes.`,
      },
      {
        name: `Warband Skill: Noblesse Obliges`,
        text: `The warrior feels utterly superior to his opponents, with long lineage and prestige to look down upon his common enemies, seen as nothing more than cattle to be slaughtered. The Warrior is immune to fear and can stomp opponents who are knocked down with his iron-shod boots. This gives them an additional attack against Knocked down opponents at their own Strength.`,
      },
      {
        name: `Warband Skill: Torturer`,
        text: `Having learned the craft of torture in the Ritual of the Comet, the warrior knows how to inflict maximum pain on the body and uses it in a sadistic and cruel way in combat. Any model successfully wounded (and not saved) in close combat by this Hero loses 1 point of Strength permanently for the duration of the battle as the pain from the wound causes agony. The effect is accumulative and can reduce the Strength of the target to a minimum of 1. The Undead are immune to this effect.`,
      },
      {
        name: `Warband Skill: Duelist`,
        text: `The warrior is an expert in hand-to-hand combat method of the Imperial duelist, aristocrats famed for their skill in single combat. At the end of each Close Combat phase, the Duelist can force any non-large opponent he is fighting one-on-one to pass a Strength test or be pushed 2" in any direction chosen by the Duelist. If this brings the target in contact with another model, both suffer an automatic Strength 2 hit. If this pushes the opponent off from a high place, then he falls and takes damage as normal. The duelist stays on the elevated area.`,
      },
      {
        name: `Special Equipment: Banner of the Noble House`,
        text: `(used instead of the standard Banner) — Cost: 25 gc · Availability: Rare 10. Boosts the Leadership of the model carrying it by 1, up to a maximum of 10. The model carrying the banner must use one of his hands to hold it aloft, and cannot carry a shield, buckler, double-handed weapon or additional weapon.`,
      },
      {
        name: `Special Equipment: Bird of Prey`,
        text: `Cost: 30 gc · Availability: Rare 10 (Aristocrat only). Can be used in the Shooting Phase like a Missile weapon: range 18", does not need line of sight (but cannot be used against hidden targets), ignores penalties for moving, long range and cover. Use the owner's BS to hit; a hit causes a Strength 4 hit.`,
      },
      {
        name: `Special Equipment: Boar Spear`,
        text: `Cost: 30 gc · Availability: Rare 10 (Aristocrat only) · Range: Close combat · Strength: As user +1 · Special Rules: Strike First, Cavalry Bonus, Cross Guard, Unwieldy. Strike First: strikes first even when charged, only during the first turn of hand-to-hand combat. Cavalry Bonus: if used mounted, +1 Strength on the turn it charges. Cross Guard: when charged, reduces the number of attacks of the first assailant into the close combat by 1 (down to a minimum of 1); attacks from an offhand weapon or other sources are unaffected. Unwieldy: may only use a shield or buckler in the other hand, may not use a second weapon.`,
      },
      {
        name: `Special Equipment: Cathayan Quilted Silk Armour`,
        text: `Cost: 15 gc · Availability: Rare 10 (Aristocrat only). Adds +1 to the armour saves against any type of attack, and can be combined with any other type of armour.`,
      },
      {
        name: `Special Equipment: Misericordia`,
        text: `Cost: 5 gc · Availability: Rare 9 · Range: Close combat · Strength: As user · Special Rules: Coup de Grace. Coup de Grace: When attacking knocked down opponents, the Misericordia bypasses all armour saves.`,
      },
      {
        name: `Special Equipment: Nightmare`,
        text: `Cost: 95 gc · Availability: Rare 11 (Aristocrat only). Mount profile: M8 WS2 BS0 S3 T3 W1 I2 A1 Ld5. Special Rules: May Not Run (as Undead, may charge as normal), Immune to Poison, Immune to psychology (as Undead, never has to take Leadership tests and will always stand still if left leaderless; if the rider suffers a wound he must still roll on the Whoa Boy! table). Your Aristocrat may purchase and ride a Nightmare if using the rules for mounted warriors.`,
      },
      {
        name: `Special Equipment: Cursed Masks`,
        text: `While all members of the Cavalcade wear masks of metal associated with the Ritual of the Comet, the inner circle of the count has access to special masks carrying a potent corrupt curse. When hiring a Hero during Warband Creation, you may give him a special mask for free. Each mask is unique — only 1 of each kind in the warband at any time — and once applied a mask cannot be removed. After Warband creation, masks may be bought for each hero without one during the postmatch sequence, at the price given below. Sun King Mask — 70 gc (Aristocrat only): the wearer cannot be Knocked Down or Stunned, nor by effects or a result on the Injury Table. Silver Death Mask — 50 gc: if the wearer is taken Out of Action, he may reroll any result on a Serious Injury chart, accepting the second result even if worse. Fish Head Mask — 60 gc: every time the wearer takes an opponent Out of Action he gains a wound back (if any lost) or gains an additional wound up to a maximum of 5, lasting until the end of the battle. Faceless Mask — 30 gc: the wearer may stop one model from Intercepting his charge once per game (models immune to psychology are unaffected). Plague Doctor Mask — 45 gc (Twisted Scholar only): once per game, in the shooting phase, unleashes a black cloud that hits any enemy model within a growing range (starting 3" Strength 1 on turn 1, +1" range and +1 Strength each subsequent turn, up to 7" Strength 5); rolls to hit and wound as usual with no range/cover penalties; cannot cause critical hits. Evil Jester Mask — 70 gc: at the start of the battle roll a D6 — on a 1 the warrior is subject to Stupidity for the battle, on 2-5 the warrior hates all enemies during the battle, on a 6 the warrior is affected by Frenzy.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `cursed_cavalcade_heroes`,
        name: `Heroes Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Misericordia`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
          { name: `Boar Spear (Aristocrat only)`, cost: `30 gc` },
          { name: `Lance`, cost: `20 gc` },
        ],
        missileWeapons: [
          { name: `Long bow`, cost: `15 gc` },
          { name: `Duelling pistol`, cost: `25 gc (50 for a brace)` },
          { name: `Hunting rifle`, cost: `200 gc` },
          { name: `Blunderbuss (One per warband)`, cost: `30 gc` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Heavy armour`, cost: `50 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Buckler`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Cathayan Quilted Silk Armour`, cost: `15 gc` },
        ],
      },
      {
        id: `cursed_cavalcade_thralls`,
        name: `Thralls Equipment List (Thralls only)`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
        ],
        missileWeapons: [
          { name: `Short bow`, cost: `5 gc` },
          { name: `Bow`, cost: `10 gc` },
          { name: `Crossbow (Max 3 per warband)`, cost: `25 gc` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
      {
        id: `cursed_cavalcade_none`,
        name: `No Equipment (beasts never use weapons or armour)`,
        meleeWeapons: [],
        missileWeapons: [],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: `cursed_cavalcade_aristocrat`,
        name: `Aristocrat`,
        role: `hero`,
        cost: 70,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: `cursed_cavalcade_heroes`,
        skillTableIds: [`combat`, `shooting`, `academic`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Leader`, text: `Any warrior of the Cavalcade Warband within 6" of the Aristocrat may use his Leadership value when taking Leadership tests.` },
          { name: `Expert Horseman`, text: `The Aristocrat has the Ride (Nightmare) skill.` },
        ],
      },
      {
        id: `cursed_cavalcade_companions`,
        name: `Companions`,
        role: `hero`,
        cost: 45,
        rosterLimit: `0-2`,
        startingExperience: 8,
        stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 7 },
        equipmentListId: `cursed_cavalcade_heroes`,
        skillTableIds: [`combat`, `shooting`, `strength`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Expert Swordsman`, text: `As imperial nobles, the Companions have been taught the way of the sword since an early age. Companions all have the Expert Swordsman Skill.` },
        ],
      },
      {
        id: `cursed_cavalcade_twisted_scholar`,
        name: `Twisted Scholar`,
        role: `hero`,
        cost: 25,
        rosterLimit: `0-1`,
        startingExperience: 4,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `cursed_cavalcade_heroes`,
        skillTableIds: [`academic`, `warband-unique`],
        specialRules: [
          { name: `Magical Adept`, text: `When hiring a Twisted Scholar, you may pay 10 additional GC to upgrade it to a Wizard. If you do this then the twisted scholar uses Lesser Magic and knows 1 spell chosen randomly.` },
          { name: `Story Teller`, text: `When hiring a Twisted Scholar, if you did not upgrade it to a Wizard, you may pay 10 additional GC to make it a Chronicler. A Chronicler has in-depth knowledge of the city of Mordheim and may reroll an extra dice during Exploration phase and may decide which of the two dice to keep.` },
        ],
      },
      {
        id: `cursed_cavalcade_cursed_piper`,
        name: `Cursed Piper`,
        role: `hero`,
        cost: 40,
        rosterLimit: `0-1`,
        startingExperience: 6,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `cursed_cavalcade_heroes`,
        skillTableIds: [`academic`, `warband-unique`],
        specialRules: [
          {
            name: `Equipment restriction`,
            text: `The Cursed Piper must play a flute or another instrument with one hand, and may not use an offhand weapon, double-handed weapon, brace of pistols of any kind, or use Bows or Crossbows.`,
          },
          {
            name: `Danse Macabre`,
            text: `During the shooting phase the Cursed Piper can direct the cursed melody of his flute against one enemy model he can see within 6" from the Piper. The enemy model must take a Ld test. If failed, the warrior is cursed by the Danse Macabre, loses control of his body and is forced to dance under the Piper's will — the Piper can move the enemy model in any direction he wishes, also out of close combat or force him to fall from height. At the beginning of the enemy's turn, in the recovery phase the warrior must pass a Ld test or continue to be under the Piper's control and cannot shoot, charge or cast spells; if engaged in close combat the model cannot attack. Only one enemy warrior at a time can be controlled by the Danse Macabre — targeting another frees the previous one.`,
          },
        ],
      },
    ],
    henchmanTemplates: [
      {
        id: `cursed_cavalcade_thrall`,
        name: `Thrall`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 6 },
        equipmentListId: `cursed_cavalcade_thralls`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `cursed_cavalcade_captured_thrall`,
        name: `Captured Thrall`,
        role: `henchman`,
        cost: null,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 5 },
        equipmentListId: `cursed_cavalcade_thralls`,
        skillTableIds: [],
        specialRules: [
          {
            name: `Extra servitors, worthless, but still precious`,
            text: `Captured Thralls do not count toward the maximum number of models allowed in your warband, effectively increasing the maximum capacity from 13 to 18. You cannot dismiss any Captured Thrall you own.`,
          },
          { name: `Not really clever`, text: `Captured Thralls cannot earn experience points, and therefore cannot gain any advancement.` },
        ],
        notes: `Not directly hireable for gold crowns — gained only via the Capture!/Throne of Worms warband-level special rules, hence cost: null.`,
      },
      {
        id: `cursed_cavalcade_great_bear`,
        name: `Great Bear`,
        role: `henchman`,
        cost: 140,
        rosterLimit: `0-1`,
        startingExperience: 0,
        stats: { M: 5, WS: 3, BS: 0, S: 5, T: 5, W: 2, I: 3, A: 2, Ld: 6 },
        equipmentListId: `cursed_cavalcade_none`,
        skillTableIds: [],
        specialRules: [
          { name: `Maddened With Pain`, text: `As soon as the Great Bear suffers a single wound it gains an additional attack.` },
          { name: `Large Target`, text: `Great Bears are Large Targets as defined in the shooting rules.` },
          { name: `Animal`, text: `Great Bears are animals and thus do not gain experience.` },
        ],
      },
      {
        id: `cursed_cavalcade_wild_beasts`,
        name: `Wild Beasts`,
        role: `henchman`,
        cost: 45,
        rosterLimit: `0-2`,
        startingExperience: 0,
        stats: { M: 6, WS: 3, BS: 0, S: 4, T: 4, W: 1, I: 5, A: 2, Ld: 5 },
        equipmentListId: `cursed_cavalcade_none`,
        skillTableIds: [],
        specialRules: [
          { name: `Charge`, text: `When charging their enemies the Wild Beasts gain +1 Attack on the first turn of close combat.` },
          { name: `Animal`, text: `Wild Beasts are animals and thus do not gain experience.` },
        ],
      },
      {
        id: `cursed_cavalcade_fighting_ape`,
        name: `Fighting Ape`,
        role: `henchman`,
        cost: 95,
        rosterLimit: `0-1`,
        startingExperience: 0,
        stats: { M: 6, WS: 3, BS: 0, S: 4, T: 4, W: 1, I: 5, A: 2, Ld: 5 },
        equipmentListId: `cursed_cavalcade_none`,
        skillTableIds: [],
        specialRules: [
          { name: `Cymbals`, text: `When hiring a Fighting Ape, you may give her a pair of cymbals at 15 gc, which it frenziedly beats together to the forbidding tune of Danse Macabre. Any enemy model within 6" will be so disturbed by the sound that they suffer a penalty of -1 to BS and Ld.` },
          {
            name: `Agile`,
            text: `The Fighting Apes are fantastically agile and nimble, putting even the greatest acrobat or Skaven Assassin to shame. The Fighting Ape has the Scale Sheer Surfaces Skill, Acrobat Skill, and Dodge Skill. In addition, the Fighting Ape can make a diving charge from up to 10" high.`,
          },
          { name: `Animal`, text: `Fighting Apes are animals and thus do not gain experience, but can still climb and enter buildings as normal.` },
        ],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1c-warbands/cursed-cavalcade`,
  },

  // ===================================================================================
  // Lustrian Reavers
  // TODO: the Tilean Hunting Hawk's profile gives "-" for both Wounds and Leadership (it "acts at
  // the same time as the Beastmaster" and "cannot be targeted separately by any attack or spell",
  // i.e. it isn't an independently-woundable/leadership-testing model). Encoded as W:0, Ld:0 below
  // since Stats requires numbers — treat those two fields as not-applicable for this profile.
  // ===================================================================================
  {
    id: `lustrian_reavers`,
    name: `Lustrian Reavers`,
    grade: `1c`,
    race: `Human (Estalian/Tilean explorers)`,
    originalSetting: `Lustria`,
    sourcebook: `Facebook (2024) (PDF), Author: Tuomas Pirinen`,
    raceTraits: [],
    specialRules: [
      {
        name: `Rare Heroes`,
        text: `You can only ever buy one of each type of Heroes during the existence of your Warband, representing the extreme rarity of these the toughest of survivors of Lustria.`,
      },
      {
        name: `Promotions`,
        text: `When you lose one of the Heroes for whatever reason, you cannot buy a new one. However, you retain all the equipment of the fallen Hero, and you may now promote one of the Prospects into the role of the lost hero, as if that Henchman just successfully rolled Lad's Got Talent on the Henchmen Advancement Table: you may choose two skill lists available to Heroes in your warband as the skill types your new Hero can choose from. The new Hero can immediately make one roll on the Heroes Advance table, then gains the armour, weapons and equipment of the fallen Hero and assumes their position in the Warband. The Prospect's own equipment may be added to the Warband stash. If you have no Prospect currently in your Warband, you can promote the next one you hire. (Hero Position: the prospect becomes a warrior of that type, gaining the special rules and wargear access, no longer a prospect, albeit with access to only 2 skill lists.)`,
      },
      {
        name: `Hired Swords`,
        text: `The Lustrian Reavers are proud and suspicious, and therefore rarely use Hired Swords. They may hire an Ogre Bodyguard, Dwarf Trollslayer, Tilean Marksman or a Big Game Hunter.`,
      },
      {
        name: `Special Equipment: Masterwork Heavy Armour`,
        text: `Availability: Common · Save: 4+. An heirloom brought from Tilea, where the craft of forging highly ornate and almost impenetrable heavy armour is taught. Movement Penalty: grants a 4+ Armour Save, but suffers -1M even without a shield.`,
      },
      {
        name: `Special Equipment: Bec de Corbin`,
        text: `Availability: Common · Range: Close Combat · Strength: As user +1. A Tilean invention combining the best aspects of a Halberd, spear and warhammer. Two-handed: may not use a shield, buckler or additional weapon in close combat; still gets a +1 bonus to armour save against shooting if carrying a shield. Strike First: strikes in initiative order when charged instead of going last. Concussion: 2-4 is treated as stunned when rolling on the Injury chart (Dwarfs are immune).`,
      },
      {
        name: `Special Equipment: Misericordia`,
        text: `Cost: 10 gc · Availability: Common · Range: Close Combat · Strength: As user. +1 Enemy armour save: an enemy wounded by a dagger (which the Misericordia counts as) gains a +1 bonus to armour save, and a 6+ save if none normally. Armour Piercing: when attacking enemies that are Knocked-Down, roll 2D6 and pick the highest number on the 'to wound' roll.`,
      },
      {
        name: `Special Equipment: Firepots Miragliano`,
        text: `Availability: Common · Range: 8" · Strength: 2. Awkward Thrown Weapon: no penalties for range, but -1 to hit if used after moving that turn. Smoke: if the orb hits, the target suffers 1 S2 hit from the bursting flames, and must roll under Initiative at the start of its next turn to see through the smoke — on a failure it cannot charge or shoot until the beginning of its next turn (can still move or fight in hand-to-hand combat).`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `lustrian_reavers_hero`,
        name: `Hero Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Misericordia`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
          { name: `Lance`, cost: `40 gc` },
        ],
        missileWeapons: [
          { name: `Javelin`, cost: `10 gc` },
          { name: `Throwing Knives`, cost: `15 gc` },
          { name: `Blowpipe`, cost: `15 gc` },
          { name: `Pistol`, cost: `15 gc` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Shield`, cost: `10 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Buckler`, cost: `10 gc` },
        ],
      },
      {
        id: `lustrian_reavers_prospect`,
        name: `Prospect Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Spear`, cost: `10 gc` },
        ],
        missileWeapons: [{ name: `Short bow`, cost: `5 gc` }],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Shield`, cost: `10 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
      {
        id: `lustrian_reavers_none`,
        name: `No Equipment (War Beasts)`,
        meleeWeapons: [],
        missileWeapons: [],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: `lustrian_reavers_conqueror`,
        name: `Conqueror`,
        role: `hero`,
        cost: 150,
        rosterLimit: `0-1`,
        startingExperience: 24,
        stats: { M: 4, WS: 4, BS: 3, S: 4, T: 4, W: 2, I: 3, A: 2, Ld: 7 },
        equipmentListId: `lustrian_reavers_hero`,
        skillTableIds: [`combat`, `strength`],
        specialRules: [
          { name: `Starting Equipment`, text: `Masterwork Heavy Armour, Bec de Corbin, Helmet. Further weapons, armour and equipment can be bought from the Reavers Equipment list.` },
          {
            name: `Survivor`,
            text: `Cannot be taken out of Action unless the model is already Knocked Down or Stunned. Treat Out of Action as Stunned if the Conqueror is standing when receiving the Wound. In addition, the first time a Conqueror suffers a Dead result on the Serious Injury Chart, treat it as Multiple Injuries instead. This ability can save the Conqueror only one time.`,
          },
        ],
      },
      {
        id: `lustrian_reavers_saurus_slayer`,
        name: `Saurus Slayer`,
        role: `hero`,
        cost: 135,
        rosterLimit: `0-1`,
        startingExperience: 20,
        stats: { M: 4, WS: 4, BS: 3, S: 4, T: 3, W: 1, I: 4, A: 2, Ld: 8 },
        equipmentListId: `lustrian_reavers_hero`,
        skillTableIds: [`combat`, `strength`, `speed`],
        specialRules: [
          { name: `Starting Equipment`, text: `Heavy Armour, Misericordia, 2 Swords, Helmet. Further weapons, armour and equipment can be bought from the Reavers Equipment list.` },
          {
            name: `Duellist`,
            text: `If the Saurus Slayer is engaged with only a single opponent in melee, they can re-roll missed hits on the first turn whether they charged the enemy or were charged.`,
          },
          {
            name: `Trophies (purchasable)`,
            text: `Lizardmen Skin Cloak: Grants 6+ Ward save, separate from Armour Save, not reduced by enemy strength or other modifiers (10 gc). Skull Mask: Causes Fear (15 gc). Upgrade any sword into a Lizardman Sword: +1 to wound rolls due to Poison (30 gc). Trophy Slann Holy Headdress: +2 bonus to armour saves (35 gc).`,
          },
        ],
      },
      {
        id: `lustrian_reavers_beastmaster`,
        name: `Reaver Beastmaster`,
        role: `hero`,
        cost: 90,
        rosterLimit: `0-1`,
        startingExperience: 20,
        stats: { M: 4, WS: 4, BS: 4, S: 4, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: `lustrian_reavers_hero`,
        skillTableIds: [`shooting`, `strength`, `speed`],
        specialRules: [
          { name: `Starting Equipment`, text: `Heavy Armour, Spear, Sword. Further weapons, armour and equipment can be bought from the Reavers Equipment list.` },
          {
            name: `War Beasts`,
            text: `If your Warband includes a Beastmaster, you may include up to 2 War Beasts (Estalian Warhound, Barbary Monkey, Tilean Hunting Hawk). These count towards the maximum size of the Warband, must be bought when the Warband is created but can be replaced if killed, and can use the Ld of the Beastmaster if within 6" of him. All War Beasts are subject to the rules of Animals and may not gain experience; they suffer injuries exactly as Henchmen (if taken out of action they are dead on a roll of 1-2 on D6).`,
          },
        ],
      },
      {
        id: `lustrian_reavers_jungle_shadow`,
        name: `Jungle Shadow`,
        role: `hero`,
        cost: 90,
        rosterLimit: `0-1`,
        startingExperience: 20,
        stats: { M: 4, WS: 4, BS: 4, S: 4, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: `lustrian_reavers_hero`,
        skillTableIds: [`shooting`, `academic`, `speed`],
        specialRules: [
          { name: `Starting Equipment`, text: `Javelins, Light Armour, two Daggers. Further weapons, armour and equipment can be bought from the Reavers Equipment list.` },
          {
            name: `Wizard option`,
            text: `At the cost of +30 Gold Crowns, you can make Jungle Shadow a Wizard using the Lesser Magic list, generating a single Spell as standard for a wizard. If made a Wizard, remove the Light Armour from the starting equipment and generate 1 Lesser Magic spell.`,
          },
          { name: `Silent Hunter`, text: `Jungle Shadow is always considered to be Hidden if the model is touching any piece of terrain of 1" high. Shooting does not reveal Jungle Shadow's position, though spellcasting does.` },
          { name: `Surprise attack`, text: `If the Shadow attacks an enemy that has its back turned to it, the Shadow can re-roll missed to hit rolls.` },
          { name: `Canopy Walker`, text: `Jungle Shadow automatically passes all climbing, jumping and falling off ledges tests.` },
        ],
      },
      {
        id: `lustrian_reavers_trapmaster`,
        name: `Trapmaster`,
        role: `hero`,
        cost: 140,
        rosterLimit: `0-1`,
        startingExperience: 17,
        stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: `lustrian_reavers_hero`,
        skillTableIds: [`combat`, `shooting`, `academic`],
        specialRules: [
          { name: `Starting Equipment`, text: `Heavy Armour, Sword, Tilean Hunting Rifle (treat as Hochland Long Rifle), Firepots, Leaf Coat (counts as an Elven Cloak). Further weapons, armour and equipment can be bought from the Reavers Equipment list.` },
          { name: `Deadeye`, text: `Trapmaster suffers no penalties for shooting at long range.` },
          {
            name: `Traps`,
            text: `The Trapmaster starts each game with 1 Trap and can buy up to 5 further Traps before the start of the game at 5 GC each. Each trap is one use only, used in the Shooting Phase instead of shooting (1 at a time, cannot be used in Melee). Place 2 1" diameter counters (one false, one real) anywhere within 3" of the Trapmaster, at least 3" from any other models. Any model moving within 2" of a counter must flip it over — a false one does nothing, a real one deals D3 S5 Hits immediately. Traps do not cause Criticals. Remove the counters when the trap is sprung.`,
          },
        ],
      },
    ],
    henchmanTemplates: [
      {
        id: `lustrian_reavers_prospects`,
        name: `Prospects`,
        role: `henchman`,
        cost: 35,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `lustrian_reavers_prospect`,
        skillTableIds: [],
        specialRules: [
          {
            name: `Promotion Only`,
            text: `Re-roll any Lad's Got Talent results on Henchmen Advancement table. When promoted, you can then hire a new Prospect as the model no longer counts as one of them.`,
          },
        ],
      },
      {
        id: `lustrian_reavers_estalian_warhound`,
        name: `Estalian Warhound`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `0-2`,
        startingExperience: 0,
        stats: { M: 6, WS: 4, BS: 0, S: 4, T: 3, W: 1, I: 4, A: 1, Ld: 5 },
        equipmentListId: `lustrian_reavers_none`,
        skillTableIds: [],
        specialRules: [
          { name: `5+ armour save`, text: `Beastmasters raise savage Estalian warhounds: giant beasts trained to bring down any prey or enemy, and protected by padded armour to ward off arrows and iron collars against blades.` },
        ],
        notes: `War Beast — only purchasable if the warband includes a Reaver Beastmaster (see that Hero's War Beasts rule).`,
      },
      {
        id: `lustrian_reavers_barbary_monkey`,
        name: `Barbary Monkey`,
        role: `henchman`,
        cost: 40,
        rosterLimit: `0-1`,
        startingExperience: 0,
        stats: { M: 6, WS: 4, BS: 0, S: 3, T: 3, W: 1, I: 5, A: 2, Ld: 6 },
        equipmentListId: `lustrian_reavers_none`,
        skillTableIds: [],
        specialRules: [
          {
            name: `Nimble`,
            text: `Can climb any sheer surfaces without taking Initiative tests. Can re-roll all failed Diving Charge tests. Can enter buildings unlike other animals. Has a 5+ Ward save which it can take against any and all wounds it suffers in Melee combat or from shooting/magic or even falling damage.`,
          },
        ],
        notes: `War Beast — only purchasable if the warband includes a Reaver Beastmaster (see that Hero's War Beasts rule).`,
      },
      {
        id: `lustrian_reavers_tilean_hunting_hawk`,
        name: `Tilean Hunting Hawk`,
        role: `henchman`,
        cost: 30,
        rosterLimit: `0-1`,
        startingExperience: 0,
        stats: { M: 12, WS: 4, BS: 0, S: 4, T: 3, W: 0, I: 5, A: 1, Ld: 0 },
        equipmentListId: `lustrian_reavers_none`,
        skillTableIds: [],
        specialRules: [
          {
            name: `Part of the Equipment`,
            text: `Acts at the same time as the Beastmaster. Can attack any enemy within 12" as a melee attack, even those out of line of sight (unless Hidden), and return to the Beastmaster immediately. The hawk cannot be targeted separately by any attack or spell. The Hawk does not attack if the Beastmaster is engaged in hand-to-hand combat, being too busy to command the hawk!`,
          },
        ],
        notes: `War Beast — only purchasable if the warband includes a Reaver Beastmaster. W and Ld are literally "-" in the source (not independently woundable/Ld-testing); encoded here as 0 — see file-level TODO.`,
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1c-warbands/lustrian-reavers`,
  },

  // ===================================================================================
  // Maneaters
  // ===================================================================================
  {
    id: `maneaters`,
    name: `Maneaters`,
    grade: `1c`,
    race: `Ogre`,
    originalSetting: `Border Town Burning`,
    sourcebook: `Border Town Burning (PDF)`,
    raceTraits: [],
    specialRules: [
      { name: `Fear`, text: `Ogres are large, threatening creatures that with the exception of Youngbloods, cause fear.` },
      {
        name: `Large`,
        text: `Except for Youngbloods and Half-growns Ogres are huge, lumbering creatures and therefore make tempting targets for archers. Any model may shoot at them, even if they are not the closest target and gets a +1 bonus on the 'to hit' roll.`,
      },
      {
        name: `Gluttony`,
        text: `Because of a voracious appetite, each Ogre model counts as two models when selling wyrdstone or treasure. Any model which is captured due to Serious Injuries or Exploration can be devoured and his possessions retained, reducing the combined model count of your warband by one (or two if the captive 'shared meal' is a Large Target). Each Ogre always counts as at least one model towards the total, no matter how much he eats! An Ogre Hero devouring captured models is granted experience points equal to the number of models that were consumed. Any member or animal (including mounts) from your warband can be eaten in the same way! Remove any consumed comrades from the warband roster immediately.`,
      },
      {
        name: `Slow Witted`,
        text: `Although Ogres are capable of earning experience and bettering themselves they are not the smartest of creatures. Ogres only improve at half the rate of everyone else. They must earn twice the usual number of experience points to gain an advance.`,
      },
      {
        name: `Difficult Customers`,
        text: `Unable to create anything of lasting worth, Ogres tend to rely on more civilised folk for the acquisition of quality goods. Widely regarded by vendors as their least popular and most frightening customers, Ogre Heroes suffer -1 when rolling to find Rare items that are not exclusively available to Ogres.`,
      },
      {
        name: `Cannibals`,
        text: `Most Hired Swords refuse to work for Ogres, as they know for sure they'll end up being a meal sooner or later. An Ogre warband may never hire any Hired Swords, except for Halflings (Scout, Thief, etc.) and the Ogre Bodyguard, or unless stated otherwise, in which case Ogres can choose to devour him when the contract ends (see Gluttony).`,
      },
      {
        name: `Warband Skill: Master of Arms`,
        text: `The Ogre learns how to use his size. He may now wield a Difficult to Use weapon and a hand weapon at the same time, but not two Difficult to Use weapons.`,
      },
      {
        name: `Warband Skill: Crude Belch`,
        text: `Ogres eat almost anything. Consequences are to be expected from those inconsiderate enough to consume a rich meal before battle. A Hero with this 'condition' may unleash his thunderous fumes on all enemies engaged in close combat. Those that do not pass a Ld test suffer a –1 'to hit' modifier for the turn. The Ogre must wait until a new enemy engages him in combat before he relieves himself again.`,
      },
      {
        name: `Warband Skill: Maneater`,
        text: `Ogres are not civilized of their own accord but it is proven they are prone to absorb foreign customs when travelling the world. Some eventually learn strange new skills before returning home to their tribes. This Ogre may immediately learn one skill from the Shooting or Academic skill lists. This skill may be taken only once and may not be taken by the Guide.`,
      },
      {
        name: `Warband Skill: Bull Charge`,
        text: `Ogres learn to use their vast bulk in a charge, trampling the enemy to the ground. When charging, an Ogre with this skill may attempt a single attack with a +1 'to hit' modifier rather than making his normal attacks. If successful the enemy model is automatically knocked down.`,
      },
      {
        name: `Warband Skill: Dog of War`,
        text: `When an Ogre travels south he can find employment as a tavern bouncer. Some are enlisted by Paymasters to fight for Tilean City States. Drawing from experience gained during a stint on foreign soil, the band can now hire those Hired Swords available for Mercenaries. This skill may only be taken by the leader and if he dies all Hired Swords are removed from the warband.`,
      },
      {
        name: `Warband Skill: Bellowing Roar`,
        text: `An Ogre leader expects challenges to his authority. One of the best ways to suppress a mutineer in the ranks is to give his ear drums a good pounding. This skill may only be taken by the warband leader, allowing him to re-roll the first failed Rout test.`,
      },
      {
        name: `Special Equipment: Iron Fist`,
        text: `Cost: 15 gc · Availability: Common · Range: Close Combat · Strength: As user. Parry: A model with an iron fist may parry enemy blows. Gloved: may not hold another weapon in the same hand (so a double-handed weapon cannot be used); two iron fists means no other close combat weapons may be used. Dual-role: operates like a buckler and a bladed hand weapon at the same time, allowing the wearer to re-roll failed parry attempts if paired with a sword or another iron fist.`,
      },
      {
        name: `Special Equipment: Ogre Club`,
        text: `Cost: 10 gc · Availability: Common · Range: Close Combat · Strength: As user. Concussion: a roll of 2-4 is treated as stunned when rolling for Injuries. Crushing Attack: imposes -1 to enemy armour saves; the Strength of the attack is considered one higher for parry attempts by the defender (so a S3 model may not parry attacks by a S5 Ogre wielding the club). Crushing Attack only applies if the Ogre uses the club with both hands.`,
      },
      {
        name: `Special Equipment: Harpoon Crossbow`,
        text: `Cost: 50 gc · Availability: Rare 10 · Range: 30" · Strength: 5. Move or fire: may not move and fire in the same turn. Prepare shot: requires a full turn to prepare before shooting.`,
      },
      {
        name: `Special Equipment: Hand-Held Mortar`,
        text: `Cost: 80 + 2D6 gc · Availability: Rare 12 · Range: 24" · Strength: 4. Prepare shot: takes a complete turn to reload, so may only fire every other turn. Move or fire: may not move and fire in the same turn, other than to pivot on the spot to face target or stand up. Save Modifier: a warrior wounded by it takes its armour save with a -2 modifier. Scatter: if the roll to hit is missed, the shot lands 2D6" in a random direction. Experimental: always subject to the optional Blackpowder Weapons rules, even if not normally used — on any result other than "BOOM!" the weapon has jammed or run out of loaded barrels and must be reloaded. Explosive Radius: the target and any models within 1½" of him each take a single S4 hit from the blast.`,
      },
      {
        name: `Special Equipment: Claimed Gnoblars`,
        text: `Treat these Gnoblars in all aspects like miscellaneous equipment (they are not models and do not occupy their own bases). If the Ogre owning them is taken out of action, roll a D6 for each Gnoblar: on a 1-2 they are dead and removed from their master's equipment. Ogres may own up to two different Claimed Gnoblars. Lookout-Gnoblar — 20 gc · Rare 8 (Ogres only): grants the Dodge skill from the Speed skill list. Luck-Gnoblar — 25 gc · Rare 9 (Ogres only): may re-roll one dice during the battle (never re-roll a re-roll). Sword-Gnoblar — 30 gc · Rare 10 (Ogres only): grants one extra Strength 2 attack in Close Combat at the weapon skill of the owning model, made at the same time as the owning Hero's attacks and directed at a model the Ogre has directed attacks toward.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `maneaters_ogre`,
        name: `Ogre Equipment List`,
        meleeWeapons: [
          { name: `Cleaver (counts as axe)`, cost: `5 gc` },
          { name: `Ogre club`, cost: `10 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Morning star`, cost: `15 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
          { name: `Iron fist`, cost: `15 gc` },
          { name: `Cathayan longsword (Captain only)`, cost: `75 gc` },
        ],
        missileWeapons: [{ name: `Hand-held mortar`, cost: `70 gc` }],
        armour: [
          { name: `Helmet`, cost: `10 gc` },
          { name: `Light armour`, cost: `20 gc` },
          { name: `Heavy armour`, cost: `50 gc` },
        ],
      },
      {
        id: `maneaters_guide`,
        name: `Mountain Guide Equipment List`,
        meleeWeapons: [
          { name: `Cleaver (counts as axe)`, cost: `5 gc` },
          { name: `Ogre club`, cost: `10 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
        ],
        missileWeapons: [{ name: `Harpoon crossbow`, cost: `50 gc` }],
        armour: [
          { name: `Helmet`, cost: `10 gc` },
          { name: `Light armour`, cost: `20 gc` },
        ],
      },
      {
        id: `maneaters_none`,
        name: `No Equipment (Tusks and primal ferocity)`,
        meleeWeapons: [],
        missileWeapons: [],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: `maneaters_captain`,
        name: `Captain`,
        role: `hero`,
        cost: 145,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 6, WS: 4, BS: 3, S: 4, T: 4, W: 3, I: 3, A: 2, Ld: 8 },
        equipmentListId: `maneaters_ogre`,
        skillTableIds: [`combat`, `strength`, `warband-unique`],
        specialRules: [
          { name: `No free dagger`, text: `Unlike other models Ogres don't have free daggers, even though they might carry one reserved for eating; Ogres never fight with daggers in close combat.` },
          { name: `Leader`, text: `Any warrior within 6" of the Captain may use his Leadership when taking Ld tests.` },
        ],
      },
      {
        id: `maneaters_youngbloods`,
        name: `Youngbloods`,
        role: `hero`,
        cost: 45,
        rosterLimit: `0-3`,
        startingExperience: 0,
        stats: { M: 6, WS: 2, BS: 2, S: 3, T: 4, W: 2, I: 2, A: 1, Ld: 6 },
        equipmentListId: `maneaters_ogre`,
        skillTableIds: [`combat`, `strength`, `warband-unique`],
        specialRules: [
          { name: `No free dagger`, text: `Unlike other models Ogres don't have free daggers, even though they might carry one reserved for eating; Ogres never fight with daggers in close combat.` },
        ],
      },
      {
        id: `maneaters_mountain_guide`,
        name: `Mountain Guide`,
        role: `hero`,
        cost: 145,
        rosterLimit: `0-1`,
        startingExperience: 8,
        stats: { M: 6, WS: 4, BS: 3, S: 4, T: 4, W: 3, I: 3, A: 2, Ld: 8 },
        equipmentListId: `maneaters_guide`,
        skillTableIds: [`combat`, `strength`, `warband-unique`],
        specialRules: [
          { name: `No free dagger`, text: `Unlike other models Ogres don't have free daggers, even though they might carry one reserved for eating; Ogres never fight with daggers in close combat.` },
          { name: `Ranger`, text: `A Mountain Guide is a dedicated tracker. If he's not put out of action in the battle, you may roll two dice for Exploration and pick one as the result (not a re-roll).` },
          { name: `Loner`, text: `Mountain Guides are Ogre Hunters, used to the solitude of the highest peaks. A Mountain Guide hunts the slopes alone and will never claim a Gnoblar or take one as a pet. They are immune to all alone tests and may never become the warband leader.` },
        ],
      },
    ],
    henchmanTemplates: [
      {
        id: `maneaters_bulls`,
        name: `Bulls`,
        role: `henchman`,
        cost: 140,
        rosterLimit: `0-2`,
        startingExperience: 0,
        stats: { M: 6, WS: 3, BS: 2, S: 4, T: 4, W: 3, I: 2, A: 3, Ld: 7 },
        equipmentListId: `maneaters_ogre`,
        skillTableIds: [],
        specialRules: [
          { name: `No free dagger`, text: `Unlike other models Ogres don't have free daggers, even though they might carry one reserved for eating; Ogres never fight with daggers in close combat.` },
          {
            name: `Bull Charge`,
            text: `When charging, Bulls may attempt a single attack with a +1 'to hit' modifier rather than making their normal attacks. If successful the enemy model is automatically knocked down.`,
          },
        ],
      },
      {
        id: `maneaters_half_growns`,
        name: `Half-growns`,
        role: `henchman`,
        cost: 85,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 6, WS: 3, BS: 2, S: 4, T: 4, W: 2, I: 2, A: 2, Ld: 7 },
        equipmentListId: `maneaters_ogre`,
        skillTableIds: [],
        specialRules: [
          { name: `No free dagger`, text: `Unlike other models Ogres don't have free daggers, even though they might carry one reserved for eating; Ogres never fight with daggers in close combat.` },
        ],
      },
      {
        id: `maneaters_sabretusks`,
        name: `Sabretusks`,
        role: `henchman`,
        cost: 125,
        rosterLimit: `0-2`,
        startingExperience: 0,
        stats: { M: 8, WS: 4, BS: 0, S: 4, T: 4, W: 2, I: 4, A: 3, Ld: 4 },
        equipmentListId: `maneaters_none`,
        skillTableIds: [],
        specialRules: [
          { name: `Trained`, text: `Sabretusks may use the Leadership of the Mountain Guide if within 6" of him. If no Mountain Guide is included in the warband due to a death or injury, the Sabretusks cannot be used until the Mountain Guide is replaced — they must be caged and left at the camp.` },
          { name: `Feral Instinct`, text: `At the beginning of the Ogres turn the Sabretusk must pass a Leadership test. If failed, the opponent may move the Sabretusk this turn — an uncontrolled Sabretusk may charge models from its own warband!` },
          { name: `Ignored`, text: `Sabretusks that are out of action do not count to the number of out of action models for the purpose of Rout tests.` },
          { name: `Fear`, text: `Sabretusks are huge feline predators and thus cause fear.` },
          { name: `Animals`, text: `Sabretusks are animals and thus do not gain experience.` },
        ],
        notes: `Only recruitable "if it includes a Guide" per the top Choice of Warriors list.`,
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1c-warbands/maneaters`,
  },

  // ===================================================================================
  // Marauders of Chaos
  // TODO: the Condemned's WS/S/T/A and the Spawn of Chaos's M/A are genuinely variable in the
  // source (e.g. Condemned: "WS: D6, S: D6, T: D6, A: D3", rolled fresh every turn per the
  // Inconsistency rule; Spawn of Chaos: M 2D6, A D6+1). Stats requires fixed numbers, so these are
  // filled in with an approximate average value (rounded down) as a placeholder — the true
  // per-turn-random mechanic is preserved verbatim in each unit's specialRules text and is NOT
  // otherwise modeled.
  // ===================================================================================
  {
    id: `marauders_of_chaos`,
    name: `Marauders of Chaos`,
    grade: `1c`,
    race: `Human (Chaos Marauder — Norse/Kurgan/Hung)`,
    originalSetting: `Border Town Burning`,
    sourcebook: `Border Town Burning (PDF)`,
    raceTraits: [],
    specialRules: [
      {
        name: `Eye of the Gods`,
        text: `An aspiring chaos follower is always Eye of the Gods: watched by the vigilant eyes of the dark gods, who reward the successful generously but punish failures harshly. Roll 2D6 after every battle. Spawn of Chaos: if you lost the preceding battle, add +1 to the roll for each of your Heroes that was taken out of action during the battle; on a total of 12+ the warband's leader turns into a Chaos spawn (his experience, skills, injuries and equipment are lost). Mark of Chaos: if you won the battle, add +1 for every enemy model the leader took out of action; on a total of 12+ you may choose a Mark of Chaos for the winning leader. As soon as the leader receives a Mark of Chaos through this rule the test is no longer taken — until the leader leaves the warband, when the new leader must prove himself the same way. There may never be more than one Spawn of Chaos in a single warband; if the warband already includes one, a doomed leader is simply erased from the roster. This rule is not in effect if the warband leader did not take part in the previous battle.`,
      },
      {
        name: `Hired Swords`,
        text: `Marauders of Chaos may only hire the following Hired Swords: Pit Fighters, Ogres, Norse Shamans and Imperial Assassins plus any other Hired Swords which specify they may be hired by Marauders of Chaos. Witches and Warlocks may be hired except by warbands that include warriors with the Mark of Arkhar.`,
      },
      {
        name: `Follow the Darkest Tribe`,
        text: `When starting a Marauders of Chaos warband you may decide which of three major Chaos tribes your warriors belong to; all follow the same Choice of Warriors, Skills and Equipment rules except as noted. The Norse: fierce, pale-skinned, fur-clad barbarians of the north, warriors at sea as well as on land. Reavers: +1 to rarity rolls when searching during the post-game sequence. Pantheon: the Eye of the Gods effect happens on a result of 13+ instead of 12+. The Kurgan: a raven-haired, dark-skinned, powerfully-built race, numerous and eager when Chaos armies gather to invade. Pedigree: may include any number of Warhounds of Chaos, not only up to five. Bone Bows: Heroes and Chaos Marauder Henchmen may use bows (cost 10 gc, availability common). Difficult Customers: suffers -1 when rolling to find Rare items except Great Axes and Barbed Whips. The Hung: an oriental race resembling the people of Cathay, reckoned the greatest of all horsemen. Disloyalty: maximum warriors is 12 instead of 15. Affinity with Horses: Warhorses always cost 40 gc; all Heroes (including Henchmen that advance to Heroes) automatically have the Ride Warhorse skill; the number of mounts per warband is not restricted in the Border Town Burning setting.`,
      },
      {
        name: `Warband Skill: Chosen of Chaos`,
        text: `The Hero has been found worthy of his god's service and entered the rank of a Chaos Warrior. He uses the maximum profile for Warriors of Chaos and the Hero equipment list (if he does not already).`,
      },
      {
        name: `Warband Skill: Tattooed Body`,
        text: `Only the warband's leader may have this skill. The Hero's body is covered with unholy Chaos signs to attract his patron's attention. The Eye of the Gods special rule's effect happens on a result of 10+ instead of 12+ only (11+ for the less favoured Norse leaders).`,
      },
      {
        name: `Warband Skill: Sweeping Blow`,
        text: `Whenever the Hero takes an enemy model out of action using a double-handed weapon he may immediately make an additional attack against another model in base contact. Requires the Strongman skill.`,
      },
      {
        name: `Warband Skill: Mutant`,
        text: `The Hero may buy one mutation (see the Mutations section of the Possessed special rules). Heroes with the Mark of Onogal may choose a Blessing of Nurgle instead except the Mark of Nurgle. Unlike other skills, Marauder Heroes may take this skill more than once.`,
      },
      {
        name: `Warband Skill: Heart of the Warrior`,
        text: `Only the warband's leader may have this skill. He may re-roll any failed Rout test and is immune to fear and all alone tests.`,
      },
      {
        name: `Special Equipment: Barbed Whip`,
        text: `Cost: 15 gc · Availability: Rare 9 · Range: Close Combat · Strength: As user. Whipcrack: as the Steel Whip's Whipcrack rule (charging/being charged +1A, first-strike when charged). Cannot Be Parried: a model attacked by a barbed whip may not parry with a sword or buckler. Enrage: as long as the Hero is not involved in close combat, all Warhounds of Chaos within 4" gain +1 attack.`,
      },
      {
        name: `Special Equipment: Great Axe`,
        text: `Cost: 25 gc · Availability: Rare 8 (Marauders of Chaos Heroes with the Chosen of Chaos skill only) · Range: Close Combat · Strength: As user +2. Two-handed: may not use a shield, buckler or additional weapon in close combat (still gets +1 armour save vs shooting with a shield). Strike last: always strikes last, even when charging, unless it has the Strongman skill. Cutting Edge: extra save modifier of -1 (e.g. S4 with a Great Axe gives a -4 save modifier in melee).`,
      },
      {
        name: `Special Equipment: Obsidian Weapon`,
        text: `Cost: 4 x Price · Availability: Rare 12 · Range: Close Combat · Strength: As user +1. Blemished: may never be used by Dwarfs, Elves, Sisters of Sigmar, Witch Hunters or Priests. Heavy: always strikes last, even when charging. (Note: use EITHER these obsidian rules or the Sons of Hashut's, not both, unless renamed for clarity.)`,
      },
      {
        name: `Special Equipment: Chaos Armour`,
        text: `Cost: 185 gc · Availability: Rare 13 · Save: 4+. Rarity: +1 on Rarity roll per model taken out of action in the previous battle. Cost: decreased by 1 gc per Experience point the Hero has. Gift of Chaos: fuses to the wearer and can never be removed or given away. Spellcasters: does not hinder spellcasting; cannot combine with a shield/buckler without appropriate skills. Movement Penalty: none for combining with a Shield.`,
      },
      {
        name: `Special Equipment: Wolfcloak`,
        text: `Cost: 10 gc · Availability: Common (Middenheimers only). To acquire, a Hero pays 10 gc and must roll equal to or under his Strength on a D6 to slay a great wolf and wear its cloak (Middenheimers may buy without an availability test when starting their warband). Grants +1 to armour saves against all shooting attacks.`,
      },
      {
        name: `Mark of the Dark Gods: Mark of Chaos Undivided`,
        text: `A Hero with this mark believes in Chaos in its purest form. Leader: all warband members within the leader rule's radius (6" normally, 12" with Battle Tongue) may re-roll all failed Ld tests. Seer: the warband may include 0-3 Gors (see Beastmen Raiders) counting toward the maximum of 15 members, re-rolling all 'The lad's got talent' results; a Seer of Chaos Undivided uses Chaos Rituals.`,
      },
      {
        name: `Mark of the Dark Gods: Mark of Tchar the Eagle`,
        text: `Leader: capable of casting spells, immediately learns one random spell from the Tchar Rituals, but suffers -1 on all rolls for Difficulty unless already a wizard. Seer: starts with two spells from the Tchar Rituals — one chosen freely, the second randomly determined.`,
      },
      {
        name: `Mark of the Dark Gods: Mark of Arkhar the Dog`,
        text: `Leader: subject to frenzy from now on; any spell that targets the Hero fails on a roll of 4+. Seer: counts as a Bloodfather, a war-priest who cannot cast spells but communes with daemons and the deity through visions — take a Ld test each time the Bloodfather takes an enemy out of action in melee; on a pass, add +1 to WS, S, T or I (each once) until the end of the battle. A Bloodfather may take Strength skills in addition to those normally available to a Seer.`,
      },
      {
        name: `Mark of the Dark Gods: Mark of Onogal the Crow`,
        text: `Leader: +1 T, may re-roll on the Serious Injuries table once, and is immune to poison. Seer: uses Onogal Rituals and is immune to poison.`,
      },
      {
        name: `Mark of the Dark Gods: Mark of Shornaal the Serpent`,
        text: `Leader: enemy models not immune to psychology cannot attack the Hero in close combat unless they pass a Ld test with 3D6 discarding the lowest die (once passed, no further test needed for the battle); on a fail, they are hit automatically in close combat. Seer: uses the Shornaal Rituals; if not taken out of action, instead of searching for rare items may brew a strong drink for the warband (treat as Bugman's Ale, cannot be sold).`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `marauders_hero`,
        name: `Hero Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Halberd`, cost: `10 gc` },
          { name: `Morning Star`, cost: `15 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
          { name: `Flail`, cost: `15 gc` },
          { name: `Barbed Whip`, cost: `15 gc` },
          { name: `Great Axe`, cost: `25 gc` },
        ],
        missileWeapons: [],
        armour: [
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Light armour`, cost: `20 gc` },
          { name: `Heavy armour`, cost: `50 gc` },
        ],
      },
      {
        id: `marauders_henchmen`,
        name: `Henchmen Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Morning Star`, cost: `15 gc` },
          { name: `Flail`, cost: `15 gc` },
        ],
        missileWeapons: [{ name: `Throwing Axes (same as Throwing Knives)`, cost: `15 gc` }],
        armour: [
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Light armour`, cost: `20 gc` },
        ],
      },
      {
        id: `marauders_none`,
        name: `No Equipment`,
        meleeWeapons: [],
        missileWeapons: [],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: `marauders_chieftain`,
        name: `Marauder Chieftain`,
        role: `hero`,
        cost: 95,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 4, WS: 5, BS: 3, S: 4, T: 4, W: 1, I: 5, A: 1, Ld: 8 },
        equipmentListId: `marauders_hero`,
        skillTableIds: [`combat`, `strength`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Leader`, text: `Any Warrior within 6" of the Marauder Chieftain may use his Leadership instead of his own when taking Ld tests.` },
        ],
      },
      {
        id: `marauders_seer`,
        name: `Seer`,
        role: `hero`,
        cost: 45,
        rosterLimit: `0-1`,
        startingExperience: 8,
        stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: `marauders_hero`,
        skillTableIds: [`combat`, `academic`, `warband-unique`],
        specialRules: [
          { name: `Wizard`, text: `A Seer is a Wizard and may use Magic as detailed in the Magic section.` },
          {
            name: `Mark of Chaos`,
            text: `The Seer gets a Mark of Chaos when hired to determine the kind of magic he uses: the Mark of the Serpent, the Mark of the Crow, the Mark of the Eagle, the Mark of Arkhar or the Mark of Chaos Undivided.`,
          },
        ],
      },
      {
        id: `marauders_champions`,
        name: `Champions`,
        role: `hero`,
        cost: 45,
        rosterLimit: `0-2`,
        startingExperience: 8,
        stats: { M: 4, WS: 4, BS: 3, S: 4, T: 3, W: 1, I: 4, A: 1, Ld: 7 },
        equipmentListId: `marauders_hero`,
        skillTableIds: [`combat`, `strength`, `warband-unique`],
        specialRules: [],
      },
      {
        id: `marauders_condemned`,
        name: `Condemned`,
        role: `hero`,
        cost: 55,
        rosterLimit: `0-1`,
        startingExperience: 8,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 2, Ld: 7 },
        equipmentListId: `marauders_none`,
        skillTableIds: [`strength`, `speed`, `warband-unique`],
        specialRules: [
          {
            name: `Inconsistency`,
            text: `The body of the Condemned is mutating permanently. The variable attributes WS, S, T and A (shown in the source as D6, D6, D6 and D3 respectively) are determined whenever needed, once every turn.`,
          },
          { name: `Fear`, text: `The Condemned's unnatural appearance makes him cause fear in his enemies.` },
          {
            name: `Experience`,
            text: `Whenever the Condemned would increase one of his variable attributes the player rolls an appropriate die instead; if satisfied with the result, he may set the attribute on that number, otherwise the attribute remains variable (the advance is lost). The maximum attributes of the Marauders may be exceeded due to the special nature of the Condemned.`,
          },
          {
            name: `Fate`,
            text: `Once all variable attributes are set, the Condemned may use weapons, armour and miscellaneous equipment as usual. But if he has 90 Experience and still variable attributes, he turns into a terrifying Spawn of Chaos (or wanders off into the wastes if the warband already has a spawn).`,
          },
        ],
        notes: `Uses no equipment ("fights without penalties"); WS/S/T/A are variable (D6/D6/D6/D3), fixed here at an approximate placeholder — see file-level TODO.`,
      },
    ],
    henchmanTemplates: [
      {
        id: `marauders_chaos_marauders`,
        name: `Chaos Marauders`,
        role: `henchman`,
        cost: 35,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 7 },
        equipmentListId: `marauders_henchmen`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `marauders_warhounds_of_chaos`,
        name: `Warhounds of Chaos`,
        role: `henchman`,
        cost: 15,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 7, WS: 4, BS: 0, S: 4, T: 3, W: 1, I: 3, A: 1, Ld: 5 },
        equipmentListId: `marauders_none`,
        skillTableIds: [],
        specialRules: [{ name: `Animals`, text: `Warhounds are animals and thus do not gain experience.` }],
        notes: `A Kurgan-tribe warband may include any number of Warhounds, not only up to five (see the Follow the Darkest Tribe rule).`,
      },
      {
        id: `marauders_spawn_of_chaos`,
        name: `Spawn of Chaos`,
        role: `henchman`,
        cost: 180,
        rosterLimit: `0-1`,
        startingExperience: 0,
        stats: { M: 7, WS: 3, BS: 0, S: 4, T: 5, W: 3, I: 2, A: 4, Ld: 10 },
        equipmentListId: `marauders_none`,
        skillTableIds: [],
        specialRules: [
          { name: `Special Attacks`, text: `Roll at the beginning of each Close Combat phase to determine the spawn's number of Attacks for that phase (D6+1).` },
          { name: `Fear`, text: `Spawn are disgusting and revolting blasphemies against nature and cause fear.` },
          {
            name: `Special Movement`,
            text: `The Spawn moves 2D6" straight ahead in each of its Movement phases (the player may turn it beforehand to choose direction). It does not double its movement for charging — if its movement takes it into contact with a model, it counts as charging and engages that model in close combat.`,
          },
          { name: `Psychology`, text: `Spawns are mindless creatures, knowing no fear of pain or death, and automatically pass any Leadership-based test.` },
          { name: `No Brain`, text: `Spawns of Chaos are crazed creatures and therefore gain no experience.` },
          { name: `Large`, text: `Spawns of Chaos are huge tempting creatures and count as Large Targets as defined in the shooting rules.` },
        ],
        notes: `M is 2D6 and A is D6+1 in the source (both variable per-turn/per-purchase) — fixed here at an approximate placeholder; see file-level TODO.`,
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1c-warbands/marauders-of-chaos`,
  },

  // ===================================================================================
  // Merchant Caravans
  // ===================================================================================
  {
    id: `merchant_caravans`,
    name: `Merchant Caravans`,
    grade: `1c`,
    race: `Human`,
    originalSetting: `Cathay Borderlands`,
    sourcebook: `Border Town Burning (PDF)`,
    raceTraits: [],
    specialRules: [
      {
        name: `Merchant`,
        text: `The Merchant is the warband's leader (any Warrior within 6" of him may use his Leadership when taking Ld tests) and the one who is in charge of the business. If the Merchant leaves the caravan (e.g. dies permanently through Serious Injuries), a new leader is determined as normal and gets the Merchant special rule, allowing him to choose new skills from the Merchant's special skills section. The model counts as a Merchant for all purposes just as the previous Merchant used to. If no model in the warband is allowed to become the leader, an Apprentice must be bought as soon as possible to become the leader.`,
      },
      {
        name: `Trade`,
        text: `Instead of searching for rare items the Merchant may sell a rare item that has been stored in the Trade Cart during the preceding battle, before Heroes of either warband search for rare items. Roll a D6 to determine gold coins: 1-2 half the item's basic price; 3-4 the item's full basic price; 5-6 full plus half the item's basic price. The Merchant may decide whether to sell at that price or try again after the next battle. Can be combined with the Wholesale skill to sell up to D3+1 items each game.`,
      },
      {
        name: `Open for Business`,
        text: `All players may choose to send any of their Heroes to the Merchant instead of having them search for rare items. A Hero doing so may buy one item from the warband's stored equipment if the players can agree on a price (including exchange deals with items and Treasures), or may go to the Merchant to sell any one item (rare, common, magical, treasure counters) to him. If players cannot agree on a price, no deal is closed and the visit is wasted.`,
      },
      {
        name: `Rarity`,
        text: `Any rare item that is reduced to Rare 2 or below by the Trade Wagon's Reputation rule, the Streetwise skill, etc., can be bought as Common items.`,
      },
      { name: `Hired Swords`, text: `Merchant Caravans may hire every Hired Sword that is available to Mercenary warbands.` },
      {
        name: `Warband Skill: Bribery`,
        text: `Whenever the warband has to take a Rout test, the Merchant may talk his hirelings into staying a little longer and face the danger. He may immediately pay 5 gc per non-Hero warband member (including Hired Swords) still in the game — one member taken out of action already does not count for Rout tests. If a Rout test is still required, test as normal. May be used as many times as required so long as the coffers aren't empty.`,
      },
      {
        name: `Warband Skill: Dubious Income`,
        text: `After every battle in which the Merchant was not taken out of action, he may choose to use this skill before the trading phase. If he does, he must pass a Ld test — on a success the warband receives one gold coin per Experience point the Merchant has; on a failure the warband loses up to the same amount of gold coins.`,
      },
      {
        name: `Warband Skill: Wholesale`,
        text: `The Merchant may search for D3+1 rare items after each battle instead of one item only (if he was not taken out of action).`,
      },
      {
        name: `Warband Skill: Deal Breaker`,
        text: `When trying to sell items through the Trade special rule, the Merchant gets a +1 bonus on the roll to see what the item would fetch.`,
      },
      {
        name: `Warband Skill: Connected`,
        text: `Instead of searching for rare items as normal, the Merchant may visit the local black market and its fencers, searching for items from a special table (Dispel Scroll 50+4D6 gc Rare 12; Lesser Artefact 200+D6x15 gc Rare 16; Magical Artefact 350+D6x25 gc Rare 18; Magical Scroll 100 gc Rare 14), applying the normal rules. Items bought this way can never be sold back again.`,
      },
      {
        name: `Special Equipment: Dragon Sword`,
        text: `Cost: 20 gc · Availability: Rare 10 · Range: Close Combat · Strength: As user +1. Two-handed: may not use a shield, buckler or additional weapon in close combat; +1 armour save bonus against ranged attacks if carrying a shield. Parry: may roll a D6 to parry like a sword (cannot parry attacks made with double or more its own Strength). (Note: sometimes called a "Katana" in older material.)`,
      },
      {
        name: `Special Equipment: Pike (Merchant Caravans)`,
        text: `Cost: 10 gc · Availability: Rare 8 · Range: Close Combat · Strength: As user. Strike First: strikes first in the first turn of a hand-to-hand combat, gaining +1 Initiative for that turn. Two Handed: may not use a shield, buckler, or additional weapon in close combat, but gets +1 armour save bonus against ranged attacks if carrying a shield.`,
      },
      {
        name: `Special Equipment: Rapier`,
        text: `Cost: 15 gc · Availability: Rare 5 · Range: Close Combat · Strength: As user. Parry: as a sword. Barrage: if you hit but fail to wound, you may attack again at -1 to hit (down to a maximum of needing a 6), continuing as long as you hit. Armour Save: because it's a light sword, armour saves against it are made at +1.`,
      },
      {
        name: `Special Equipment: Trade Wagon`,
        text: `180 gold crowns to buy · Availability: Common, Merchant Caravans only. Profile — Cart: T8 W4; Wheel: T6 W1; Draft Horse: M8 WS1 BS0 S3 T3 W1 I3 A0 Ld5. A starting warband must always include one Trade Wagon (cost includes two draft horses; one warband model must act as driver). Wagon: follows all rules for Wagons (Empire in Flames Supplement, p. 30–33). Storage: all the warband's stored equipment and treasures are stored inside it (not gold crowns) — if destroyed, all stored equipment and treasures are lost, and none can be stored until a replacement is bought; treasures gained after a battle are lost if not sold before the next game. Reputation: for every five different rare items stored inside, the Merchant gets +1 to his rolls for finding rare items. Abandoned: if the warband fails its Rout test and no model is driving the Trade Wagon, it is abandoned to the winning warband (who may steal the contents, keep the wagon, or ransom it back); the losing Merchant's warband may not search for rare items following the battle unless every one of their models was taken out of action.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `merchant_hero`,
        name: `Hero Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Rapier`, cost: `15 gc` },
        ],
        missileWeapons: [
          { name: `Pistol`, cost: `15 gc (30 gc for a brace)` },
          { name: `Duelling pistol`, cost: `30 gc (60 gc for a brace)` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Heavy armour`, cost: `50 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
      {
        id: `merchant_henchman`,
        name: `Henchman Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Pike (Sell-swords only)`, cost: `10 gc` },
          { name: `Halberd (Sell-swords only)`, cost: `10 gc` },
        ],
        missileWeapons: [{ name: `Crossbow`, cost: `25 gc` }],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Heavy armour`, cost: `50 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
      {
        id: `merchant_cathayan`,
        name: `Cathayan Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Club`, cost: `3 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
          { name: `Dragon Sword`, cost: `20 gc` },
        ],
        missileWeapons: [],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Heavy armour`, cost: `50 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
    ],
    heroTemplates: [
      {
        id: `merchant_merchant`,
        name: `Merchant`,
        role: `hero`,
        cost: 50,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 4, WS: 2, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 8 },
        equipmentListId: `merchant_hero`,
        skillTableIds: [`shooting`, `academic`, `warband-unique`],
        specialRules: [{ name: `Merchant`, text: `A Merchant is always the warband's leader. Refer to the special rules for when using a Merchant.` }],
      },
      {
        id: `merchant_apprentice`,
        name: `Apprentice`,
        role: `hero`,
        cost: 15,
        rosterLimit: `0-1`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 6 },
        equipmentListId: `merchant_hero`,
        skillTableIds: [`combat`, `shooting`, `academic`, `speed`],
        specialRules: [],
      },
      {
        id: `merchant_knights_vanguard`,
        name: `Knights Vanguard`,
        role: `hero`,
        cost: 45,
        rosterLimit: `0-2`,
        startingExperience: 8,
        stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 7 },
        equipmentListId: `merchant_hero`,
        skillTableIds: [`combat`, `strength`, `speed`],
        specialRules: [
          { name: `Equipment`, text: `Knights Vanguard may be equipped with weapons and armour chosen from the Hero Equipment list and the Cathayan Equipment list.` },
          {
            name: `Lightning Reflexes`,
            text: `If the Knights Vanguard is charged, he will 'strike first' against those that charged that turn. As the charger(s) will also normally 'strike first' (for charging), the order of attack between the charger(s) and the Knights Vanguard will be determined by comparing Initiative values.`,
          },
          { name: `Ride Warhorse`, text: `The Knights Vanguard is trained in riding Warhorses.` },
          { name: `Hirelings`, text: `The Knights Vanguard is a hireling, paid by the Merchant and therefore can never become the warband's leader.` },
        ],
      },
      {
        id: `merchant_magician`,
        name: `Magician`,
        role: `hero`,
        cost: 40,
        rosterLimit: `0-1`,
        startingExperience: 8,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: `merchant_hero`,
        skillTableIds: [`academic`, `speed`],
        specialRules: [
          { name: `Wizard`, text: `A Magician is a wizard and uses Lesser Magic. See the Magic section in the Mordheim rulebook for details.` },
          { name: `Hireling`, text: `The Magician is a hireling, paid by the Merchant. He can never become the warband's leader.` },
        ],
      },
    ],
    henchmanTemplates: [
      {
        id: `merchant_sell_swords`,
        name: `Sell-swords`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `merchant_henchman`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `merchant_marksmen`,
        name: `Marksmen`,
        role: `henchman`,
        cost: 30,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 4, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `merchant_henchman`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `merchant_blackguards`,
        name: `Blackguards`,
        role: `henchman`,
        cost: 35,
        rosterLimit: `0-3`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `merchant_cathayan`,
        skillTableIds: [],
        specialRules: [
          { name: `Strongman`, text: `Blackguards are capable of great feats of strength. They may use a double-handed weapon without the usual penalty of always striking last.` },
          {
            name: `Unreliable Hirelings`,
            text: `Blackguards are only hired by the Merchant to serve him by protecting his cargo. They are not much trusted or granted with any responsibilities. Therefore they may never become Heroes. Re-roll all results of 'The lad's got talent' for them.`,
          },
        ],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1c-warbands/merchant-caravans`,
  },

  // ===================================================================================
  // Night Goblins
  // Note: distinct from "Night Goblins (web)" below — different source document, id
  // `night_goblins` vs `night_goblins_web`.
  // ===================================================================================
  {
    id: `night_goblins`,
    name: `Night Goblins`,
    grade: `1c`,
    race: `Night Goblin (Greenskin)`,
    originalSetting: `Mordheim`,
    sourcebook: `Mordheimer's Information Centre (PDF), Author: Terry Maltman`,
    raceTraits: [],
    specialRules: [
      {
        name: `Animosity`,
        text: `Goblins spend much of their lives squabbling and fighting amongst themselves. Sometimes this will happen at the worst of times. At the beginning of each Night Goblin turn roll a D6. On a roll of 1 they start to squabble and will do nothing else for the rest of the turn. Only Night Goblins are affected. Trolls, Squigs, Snotlings and other non-goblins are not affected and will act as normal.`,
      },
      {
        name: `Hate Stunties`,
        text: `Night Goblins are subject to hatred towards Dwarfs. This only affects Night Goblins not any other greenskins. Fanatics are so out of their skull that they are not affected.`,
      },
      {
        name: `Warband Skill: Ded Shooty`,
        text: `The clever little git adds +6" to the range of any missile weapons he uses (not including nets).`,
      },
      {
        name: `Warband Skill: Sneaky Git`,
        text: `The greenskin is so sneaky that he can move D3 of his warband members after all other deployment is complete. Night Goblin Big Boss only.`,
      },
      {
        name: `Warband Skill: Infiltrate`,
        text: `A Night Goblin with this skill is always placed on the battlefield after the opposing warband and can be placed anywhere on the table as long as it is out of sight of the opposing warband and more than 12" away from any enemy model. If both players have models which infiltrate, roll a D6 for each, and the lowest roll sets up first.`,
      },
      {
        name: `Warband Skill: Netter`,
        text: `The goblin is adept at using a net to disable his enemies. He may declare a net charge, throwing the net at a target as described in the Mordheim rulebook. If he hits and the target fails to escape, the target counts as knocked down and the goblin completes his charge; if he misses or the target escapes, the goblin makes a failed charge (stopping 1" away if it would otherwise reach base contact). A warrior caught in a net is automatically hit in combat (roll to wound as with a knocked down enemy); in his next recovery phase, unless stunned or out of action, he cuts himself out of the net but can do nothing else and goes last in combat, as if standing up from being knocked down.`,
      },
      {
        name: `Special Equipment: Ball and Chain`,
        text: `Cost: 15 gc · Availability: Common (Goblins only) · Range: Close Combat · Strength: As user +2. Incredible Force: no armour saves allowed against wounds caused by it; any hit that wounds does 1D3 wounds instead of 1. Random: on first use, moves the model 2D6" in a nominated direction; subsequent Movement phases roll a D6 — 1: the model strangles himself and is taken out of action (rolling for Injury, 1-3 means out permanently instead of 1-2); 2-5: moves 2D6" in a nominated direction; 6: moves 2D6" in a random direction. Moving into contact with any model counts as charging into close combat; opponents attacking a Ball and Chain wielder suffer -1 to hit; the wielder cannot be held in combat and automatically moves even from base contact, is taken out of action if it moves into a building/wall/obstruction, and ignores Animosity while wielding it. Cumbersome: may carry no other weapons or equipment, and only a model under Mad Cap Mushrooms has the strength to wield one. Unwieldy: at the end of the battle, roll for Injury for each model that used a Ball and Chain (as if taken out of action), even if not actually taken out of action that battle (only one roll if it was).`,
      },
      {
        name: `Special Equipment: Poison Daggers`,
        text: `Cost: 25 gc · Availability: Common · Range: Close Combat · Strength: As user. Paired: gets an additional attack. Poisoned: coated in Death Cap Mushroom juice, same effect as Black Lotus — wounds the target automatically on a 6 to hit (roll separately to determine if it's a critical hit); otherwise causes a normal wound; armour saves as normal. +1 Enemy armour save.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `night_goblins_standard`,
        name: `Night Goblin Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Club`, cost: `3 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
        ],
        missileWeapons: [{ name: `Short bow`, cost: `5 gc` }],
        armour: [
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Light armour`, cost: `20 gc` },
        ],
      },
      {
        id: `night_goblins_fanatic`,
        name: `Fanatic Equipment List`,
        meleeWeapons: [
          { name: `Double-handed Weapon`, cost: `15 gc` },
          { name: `Ball & Chain`, cost: `15 gc` },
          { name: `Poison Daggers`, cost: `25 gc` },
        ],
        missileWeapons: [],
        armour: [],
      },
      {
        id: `night_goblins_none`,
        name: `No Equipment`,
        meleeWeapons: [],
        missileWeapons: [],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: `night_goblins_big_boss`,
        name: `Big Boss`,
        role: `hero`,
        cost: 45,
        rosterLimit: `1`,
        startingExperience: 17,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `night_goblins_standard`,
        skillTableIds: [`combat`, `shooting`, `strength`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Leader`, text: `Any warrior within 6" of the Orc Boss may use his Leadership characteristic when taking Leadership tests.` },
        ],
      },
      {
        id: `night_goblins_shaman`,
        name: `Shaman`,
        role: `hero`,
        cost: 50,
        rosterLimit: `0-1`,
        startingExperience: 10,
        stats: { M: 4, WS: 2, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 6 },
        equipmentListId: `night_goblins_standard`,
        skillTableIds: [`shooting`, `academic`, `speed`],
        specialRules: [{ name: `Wizard`, text: `A Shaman is a wizard and uses Waaagh! Magic.` }],
      },
      {
        id: `night_goblins_bosses`,
        name: `Bosses`,
        role: `hero`,
        cost: 25,
        rosterLimit: `0-4`,
        startingExperience: 6,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 6 },
        equipmentListId: `night_goblins_standard`,
        skillTableIds: [`combat`, `shooting`, `speed`, `warband-unique`],
        specialRules: [],
      },
    ],
    henchmanTemplates: [
      {
        id: `night_goblins_warriors`,
        name: `Night Goblins`,
        role: `henchman`,
        cost: 15,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 5 },
        equipmentListId: `night_goblins_standard`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `night_goblins_fanatics`,
        name: `Fanatics`,
        role: `henchman`,
        cost: 20,
        rosterLimit: `0-2`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 5 },
        equipmentListId: `night_goblins_fanatic`,
        skillTableIds: [],
        specialRules: [
          {
            name: `Addict`,
            text: `The Fanatic is dependent on a regular supply of Madcap Mushrooms (25 gc, common), which must be bought each game. If he can't get any before a battle he will stay in his cave foaming at the mouth and not take part. If available he will eat his mushrooms before the battle.`,
          },
          { name: `Mushroom Brain`, text: `Due to the effect of prolonged use of Madcap Mushrooms the Fanatic's brain is about useless. He cannot gain experience.` },
          { name: `Looney`, text: `Due to the effect of the Mushrooms he is subject to frenzy. He must also test for permanent damage after the battle as described in the rulebook.` },
          { name: `Frantic`, text: `The Fanatic is hyperactive and will strike first in combat ignoring penalties or bonuses for weapons or initiative order.` },
        ],
      },
      {
        id: `night_goblins_cave_squigs`,
        name: `Cave Squigs`,
        role: `henchman`,
        cost: 15,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 7, WS: 4, BS: 0, S: 4, T: 3, W: 1, I: 4, A: 1, Ld: 5 },
        equipmentListId: `night_goblins_none`,
        skillTableIds: [],
        specialRules: [
          { name: `Movement`, text: `Cave Squigs move with an ungainly bouncing stride: roll 2D6 for the distance they move. They never run and never declare charges, but may contact enemy models with their normal 2D6" movement, counting as charging for the following round of close combat.` },
          { name: `Minderz`, text: `Each Cave Squig must always remain within 6" of a Goblin Warrior. If it finds itself without one within 6" at the start of its Movement phase, it goes wild: moves 2D6" in a random direction each Movement phase, engaging any model it contacts, out of the Orc & Goblin player's control until the end of the game.` },
          { name: `Animals`, text: `Cave Squigs are animals of a sort and so do not gain experience.` },
        ],
        notes: `The warband may never have more Cave Squigs than it has Night Goblins.`,
      },
      {
        id: `night_goblins_troll`,
        name: `Troll`,
        role: `henchman`,
        cost: 200,
        rosterLimit: `0-1`,
        startingExperience: 0,
        stats: { M: 6, WS: 3, BS: 1, S: 5, T: 4, W: 3, I: 1, A: 3, Ld: 4 },
        equipmentListId: `night_goblins_none`,
        skillTableIds: [],
        specialRules: [
          { name: `Fear`, text: `Trolls are frightening monsters which cause fear.` },
          { name: `Stupidity`, text: `A Troll is subject to the rules for stupidity.` },
          {
            name: `Regeneration`,
            text: `Whenever an enemy successfully inflicts a wound on a Troll, roll a D6; on a 4+ the wound is ignored and the Troll is unhurt (does not apply to wounds caused by fire or fire-based magic). Trolls never roll for Injury after a battle.`,
          },
          { name: `Dumb Monster`, text: `A Troll is far too stupid to ever learn any new skills. Trolls do not gain experience.` },
          {
            name: `Always Hungry`,
            text: `The warband must pay 15 gold crowns after every game to keep the Troll, or sacrifice two Goblin Warriors or Cave Squigs in lieu of buying food. If this fee is not paid, the Troll wanders off in search of food.`,
          },
          { name: `Vomit Attack`, text: `Instead of his normal attacks, a Troll can regurgitate its highly corrosive digestive juices: a single attack that automatically hits with a Strength of 5 and ignores armour saves.` },
          { name: `Large Target`, text: `Trolls are Large Targets as defined in the shooting rules.` },
        ],
      },
      {
        id: `night_goblins_snotling_mob`,
        name: `Snotling Mob`,
        role: `henchman`,
        cost: 50,
        rosterLimit: `0-1`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 2, T: 2, W: 1, I: 3, A: 1, Ld: 4 },
        equipmentListId: `night_goblins_none`,
        skillTableIds: [],
        specialRules: [
          { name: `Equipment`, text: `Snotlings may only ever use a pointy stick, found for free — counts as a dagger, giving the enemy +1 to armour save or a 6+ save if they had none.` },
          { name: `Mob`, text: `Bought in a mob of 5; members may be replaced up to the maximum of 5 at 10 gc each. Always move and fight as a mob — all members must stay within 1" and join the same combat if possible.` },
          { name: `Weedy`, text: `If wounded: knocked down on a 1, stunned on a 2-3, out of action on a 4-6.` },
          { name: `Dodgy`, text: `They get a 6+ dodge save against shooting.` },
          {
            name: `Insignificant`,
            text: `The whole mob counts as a single model for rout tests, maximum warband size and calculating income. An enemy Hero only gains experience for taking the last Snotling Out of Action.`,
          },
        ],
        notes: `Consists of 5 Snotlings for 50 gc; individual Snotlings replaced at 10 gc each thereafter.`,
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1c-warbands/night-goblins`,
  },

  // ===================================================================================
  // Night Goblins (web)
  // Note: distinct from "Night Goblins" above — different source document, id
  // `night_goblins_web` vs `night_goblins`.
  // TODO: the Animosity rule references "consult the Animosity Result chart to see what happens"
  // but the referenced D6 chart itself is not reproduced anywhere in the scraped source page —
  // captured verbatim as far as the source goes, the chart contents are simply missing upstream.
  // ===================================================================================
  {
    id: `night_goblins_web`,
    name: `Night Goblins (web)`,
    grade: `1c`,
    race: `Night Goblin (Greenskin)`,
    originalSetting: `Mordheim`,
    sourcebook: `Fan made from the web (PDF)`,
    raceTraits: [],
    specialRules: [
      {
        name: `Animosity`,
        text: `Night Goblins spend much of their lives squabbling and fighting among themselves. At the start of the Night Goblin player's turn, roll a D6 for each Night Goblin Warrior Henchman (not for models engaged in hand-to-hand combat). To find out how offended the model is, roll another D6 and consult the Animosity Result chart to see what happens (a roll of 1 on the first D6 means the warrior has taken offense).`,
      },
      {
        name: `Hate Stunties`,
        text: `Night Goblins are subject to hatred towards Dwarfs. This only affects Night Goblins, not any other models in the warband. Fanatics are so out of their skull that they are not affected.`,
      },
      {
        name: `Fear Elves`,
        text: `Night Goblins are terrified of the Elven race. This only affects Night Goblins, not any other models in the warband. Fanatics are so out of their skull that they are not affected.`,
      },
      {
        name: `Distasteful Company`,
        text: `Many Hired Swords refuse to work for Night Goblins, they know that the backstabbing 'lil gits are likely to turn on them. Night Goblins may only hire Pit Fighters, Ogre Bodyguards, Warlocks, Witches, plus any Hired Sword that specifically states they work with Orcs or Goblins.`,
      },
      {
        name: `Mad Cap Masters`,
        text: `Night Goblins consume so much dangerous fungi they can ignore some of the permanent side effects of Mad Cap Mushrooms, provided they have a constant supply. Night Goblins affected by Mad Cap overuse may ignore the resulting stupidity, but only while under the effect of more Mad Caps. Once the model loses frenzy, due to being knocked down or stunned, it will be affected by Stupidity as normal.`,
      },
      {
        name: `Warband Skill: Fungus Farmer`,
        text: `The industrious little git has a mushroom crop back at the cave. If the Hero doesn't search for rare items, it may pick D3-1 Mad Cap Mushrooms instead (there is a chance of getting none). Each Mad Cap Mushroom must be used in the next battle and cannot be sold or traded.`,
      },
      {
        name: `Warband Skill: Hide in Shadows`,
        text: `The sneaky Goblin has become an expert at concealing themselves from enemies (and potential victims). An enemy warrior attempting to detect this warrior when it is Hidden must halve their Initiative (round up) before measuring the distance.`,
      },
      {
        name: `Warband Skill: Infiltrate`,
        text: `A Night Goblin with this skill is always placed on the battlefield after the opposing warband and can be placed anywhere on the table as long as it is out of sight of the opposing warband, and more than 12" away from any enemy model. If both players have models which infiltrate, roll a D6 for each, and the lowest roll sets up first.`,
      },
      {
        name: `Warband Skill: Netter`,
        text: `Instead of their normal use, the Goblin may throw a Net they are equipped with at an enemy who is charging them, reducing the charger's charge range by D6". If this means the attacker cannot reach the Goblin, it is a failed charge. The Net is lost when this skill is used regardless of outcome.`,
      },
      {
        name: `Warband Skill: Ride Squig`,
        text: `This Goblin can ride one of the warband's Cave Squigs, or even a Great Squig — the pair deploy as a single model and move together using the Squig's movement rules, but attack separately in Close Combat. Any shooting or close combat attack hits the rider on a D6 of 1-2 and the Squig on 3-6. If the Squig is stunned or taken out of action, the rider takes a Strength 2 hit with no Armour save and is dismounted for the rest of the battle; likewise if the rider is stunned or taken out of action, the Squig reverts to normal behavior and the rider is dismounted. On a double/triple movement roll, the rider must roll under their Strength or be thrown off (Strength 2 hit, no save, dismounted).`,
      },
      {
        name: `Warband Skill: Sneaky Git`,
        text: `The Goblin specializes in attacking their targets from the shadows. They may charge an opponent from hiding, even if they cannot see the target, with no Initiative test required, and the target may be over the normal 4" limit for charging unseen targets. If successful, the opponent attacks at half Weapon Skill and half Initiative (rounded up) for the first round of combat only.`,
      },
      {
        name: `Special Equipment: Ball and Chain`,
        text: `Cost: 15 gc · Availability: Common (Goblins only) · Range: Close Combat · Strength: As user +2. Incredible Force: no armour saves against wounds; wounds do 1D3 wounds instead of 1. Random: on first use, moves 2D6" in a nominated direction; subsequent Movement phases roll a D6 — 1: strangles himself, out of action (Injury roll 1-3 = out permanently); 2-5: moves 2D6" nominated direction; 6: moves 2D6" random direction. Contact with any model counts as charging; opponents suffer -1 to hit against the wielder; the wielder cannot be held in combat, is taken out of action on hitting an obstruction, and ignores Animosity. Cumbersome: no other weapons/equipment; only usable under Mad Cap Mushrooms. Unwieldy: roll for Injury for each model that used it at the end of the battle, as if taken out of action (one roll only if actually taken out of action).`,
      },
      {
        name: `Special Equipment: Boss Pole`,
        text: `Cost: 20 gc · Availability: Common · Range: Close Combat · Strength: As user. Lets the hero and any Goblin henchmen within 6" ignore animosity; acts as a spear in close combat (Strike First on the first turn of combat, Unwieldy — only a shield/buckler in the other hand, Cavalry Bonus +1 Strength on the charge if mounted).`,
      },
      {
        name: `Special Equipment: Poison Daggers`,
        text: `Cost: 25 gc · Availability: Common · Range: Close Combat · Strength: As user. Paired: additional attack. Poisoned: same effect as Black Lotus, automatic wound on a 6 to hit (roll separately for critical). +1 Enemy armour save.`,
      },
      {
        name: `Special Equipment: Squig Prodder`,
        text: `Cost: 15 gc · Availability: Common (Goblins only). A Goblin with a Squig prodder keeps all Cave Squigs within 12" from going wild (instead of the normal 6", see Minderz). Treated exactly like a spear in hand-to-hand combat.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `night_goblins_web_hero`,
        name: `Hero Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Club`, cost: `3 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Halberd`, cost: `10 gc` },
          { name: `Two-handed weapon`, cost: `15 gc` },
          { name: `Boss pole`, cost: `20 gc` },
          { name: `Poison Daggers`, cost: `25 gc` },
        ],
        missileWeapons: [
          { name: `Short bow`, cost: `5 gc` },
          { name: `Sling`, cost: `2 gc` },
          { name: `Throwing Knives`, cost: `15 gc` },
        ],
        armour: [
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Light armour`, cost: `20 gc` },
        ],
      },
      {
        id: `night_goblins_web_henchmen`,
        name: `Henchmen Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Club`, cost: `3 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `5 gc` },
        ],
        missileWeapons: [{ name: `Short bow`, cost: `5 gc` }],
        armour: [
          { name: `Shield`, cost: `5 gc` },
          { name: `Light armour`, cost: `20 gc` },
        ],
      },
      {
        id: `night_goblins_web_fanatic`,
        name: `Fanatic Equipment List`,
        meleeWeapons: [
          { name: `Double-handed Weapon`, cost: `15 gc` },
          { name: `Ball & Chain`, cost: `15 gc` },
          { name: `Poison Daggers`, cost: `25 gc` },
        ],
        missileWeapons: [],
        armour: [],
      },
      {
        id: `night_goblins_web_none`,
        name: `No Equipment`,
        meleeWeapons: [],
        missileWeapons: [],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: `night_goblins_web_boss`,
        name: `Boss`,
        role: `hero`,
        cost: 45,
        rosterLimit: `1`,
        startingExperience: 17,
        stats: { M: 4, WS: 3, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 7 },
        equipmentListId: `night_goblins_web_hero`,
        skillTableIds: [`combat`, `shooting`, `strength`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Leader`, text: `Any warrior within 6" of the Boss may use their Leadership value when taking Leadership tests.` },
          {
            name: `Da Biggest Boss`,
            text: `The Boss is so big, compared to other Night Goblins that is, that they may choose Strength skills. If the Boss dies, the promoted leader will gain this rule. No other member of the warband except the current leader may ever use Strength skills.`,
          },
          {
            name: `Promoted Henchmen restriction`,
            text: `Per the skill table footnote, a promoted Henchman (rather than the original Boss) may never choose Strength as one of their skill sets.`,
          },
        ],
      },
      {
        id: `night_goblins_web_squig_herder`,
        name: `Squig Herder`,
        role: `hero`,
        cost: 35,
        rosterLimit: `0-1`,
        startingExperience: 6,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 6 },
        equipmentListId: `night_goblins_web_hero`,
        skillTableIds: [`combat`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Handle Animal - Squig`, text: `Any Cave Squig within 6" (12" with a Squig Prodder) of the herder can use their Leadership value when taking Leadership tests.` },
          { name: `Master Herder`, text: `During the recovery phase, any out of control Cave Squigs or Great Squigs in the herder's control range (6", or 12" with a Squig Prodder) will stop running amok, and may be controlled normally, if the Herder can pass a Leadership test.` },
          {
            name: `Squig Herder Skill: Gassy Squigs`,
            text: `The Squig Herder is feeding the warband's Squigs a blend of rotten fungus, flint, and sharp pebbles for shrapnel. When any untrained Cave Squig goes out of action, instead of rolling a D6 recovery roll after the battle, roll immediately. On a 1-2 it explodes, hitting all models in D6" with a strength 3 hit. That Squig is now DEAD!`,
          },
          {
            name: `Squig Herder Skill: Threaten`,
            text: `During the Movement Phase, all Cave Squigs and Great Squigs in 6" (12" with a Squig Prodder) of the Squig Herder may re-roll their movement dice.`,
          },
          {
            name: `Squig Herder Skill: Trainin'`,
            text: `The Squig Herder may train one particularly intelligent and vicious Squig to be their personal guard. The next single Cave Squig purchased gains experience normally, rolling on the Henchmen Advance Table while rerolling "Lad's Got Talent". If the Squig Herder dies the Trained Squig is removed from the warband; if the Trained Squig dies a new one can be purchased. Only one Trained Cave Squig ever exists in a warband (still counts toward the max Cave Squigs); it only ever dies on a roll of 1 after going out of action. If the Squig Herder is taken out of action and the Trained Squig has not gone wild, it guards the Herder — remove it from the table but treat all "Sold to the Pits", "Captured", and "Robbed" results on the Serious Injuries Chart for the Squig Herder as "Full Recovery".`,
          },
        ],
      },
      {
        id: `night_goblins_web_goonz`,
        name: `Goonz`,
        role: `hero`,
        cost: 20,
        rosterLimit: `0-3`,
        startingExperience: 4,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 6 },
        equipmentListId: `night_goblins_web_hero`,
        skillTableIds: [`combat`, `shooting`, `speed`, `warband-unique`],
        specialRules: [],
      },
      {
        id: `night_goblins_web_shaman`,
        name: `Shaman`,
        role: `hero`,
        cost: 25,
        rosterLimit: `0-1`,
        startingExperience: 6,
        stats: { M: 4, WS: 2, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 6 },
        equipmentListId: `night_goblins_web_hero`,
        skillTableIds: [`academic`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Wizard`, text: `A Shaman begins with one spell randomly chosen from the Goblin Magic spell list.` },
          {
            name: `Fungus Brew`,
            text: `Before a battle, the Shaman may brew a special batch of Fungus Brew using 1 to 3 Mad Cap Mushrooms, consumed immediately, affecting a single Night Goblin Warrior henchmen group until the end of the battle. Roll on the Fungus Brew Table once per Mad Cap Mushroom used (if any dice match, the batch is ruined). 1 Rowdy: Animosity on a 1 or 2. 2 Dizzy: -1 Initiative. 3 Fearless: immune to fear and all alone tests. 4 Numbed: +1 Save, not reducible below 6+. 5 Belligerent: hatred against the opposing warband(s). 6 Loony: frenzy, followed by stupidity if it wears off by being knocked down or stunned.`,
          },
        ],
      },
    ],
    henchmanTemplates: [
      {
        id: `night_goblins_web_warriors`,
        name: `Night Goblin Warriors`,
        role: `henchman`,
        cost: 15,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 5 },
        equipmentListId: `night_goblins_web_henchmen`,
        skillTableIds: [],
        specialRules: [{ name: `Animosity`, text: `Night Goblins are subject to the rules for Animosity.` }],
      },
      {
        id: `night_goblins_web_fanatics`,
        name: `Night Goblin Fanatics`,
        role: `henchman`,
        cost: 20,
        rosterLimit: `0-3`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 5 },
        equipmentListId: `night_goblins_web_fanatic`,
        skillTableIds: [],
        specialRules: [
          { name: `Addict`, text: `Fanatics are dependent on a regular supply of Mad Cap Mushrooms which must be bought each game. If a fanatic can't get any before a battle they will stay in their cave foaming at the mouth and not take part. If available they will eat their mushrooms before the battle.` },
          { name: `Loony`, text: `Fanatics are so far gone from reality that they are not subject to the rules for Animosity. Fanatics must re-roll results of "Lad's Got Talent."` },
        ],
      },
      {
        id: `night_goblins_web_cave_squigs`,
        name: `Cave Squigs`,
        role: `henchman`,
        cost: 15,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 7, WS: 4, BS: 0, S: 4, T: 3, W: 1, I: 4, A: 1, Ld: 5 },
        equipmentListId: `night_goblins_web_none`,
        skillTableIds: [],
        specialRules: [
          { name: `Movement`, text: `Declare a direction and roll 2D6 for movement distance; never run or declare charges, but count as charging if their movement brings them into contact with an enemy model.` },
          { name: `Minderz`, text: `Must remain within 6" of a Goblin or go wild (2D6" random movement each phase, out of control until the end of the game).` },
          { name: `Just Squigs`, text: `Squigs only count as half a model for Rout test purposes.` },
          { name: `Animals`, text: `Cave Squigs are animals of a sort and so do not gain experience, or climb ladders (though they can reach higher levels via a particularly high bounce).` },
        ],
      },
      {
        id: `night_goblins_web_snotlings`,
        name: `Snotlings`,
        role: `henchman`,
        cost: 10,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 2, T: 2, W: 1, I: 3, A: 1, Ld: 4 },
        equipmentListId: `night_goblins_web_none`,
        skillTableIds: [],
        specialRules: [
          { name: `Equipment`, text: `Snotlings may only ever use a pointy stick or similar mundane object, found for free — counts as a dagger.` },
          { name: `Mob`, text: `All Snotlings in a warband count as one model for warband size.` },
          { name: `Weedy`, text: `If wounded: knocked down on a 1, stunned on a 2-3, out of action on a 4-6.` },
          { name: `Dodgy`, text: `All hits from shooting or hand-to-hand suffer -1 to hit against Snotlings.` },
          {
            name: `Insignificant`,
            text: `All Snotlings in the warband count as 1 model for rout tests purposes and warband maintenance costs. Each Snotling is worth half an experience point, rounded down, at the end of the battle. Snotlings may be ignored for shooting priority purposes and never gain experience.`,
          },
        ],
      },
      {
        id: `night_goblins_web_great_squig`,
        name: `Great Squig`,
        role: `henchman`,
        cost: 210,
        rosterLimit: `0-1`,
        startingExperience: 0,
        stats: { M: 10, WS: 4, BS: 0, S: 5, T: 5, W: 3, I: 4, A: 3, Ld: 5 },
        equipmentListId: `night_goblins_web_none`,
        skillTableIds: [],
        specialRules: [
          { name: `Movement`, text: `Moves like a Cave Squig, except it rolls 3D6 for the distance.` },
          { name: `Wild`, text: `Needs a Goblin to keep it in line, like a Cave Squig; if a wild Great Squig's scatter die result is a "hit", it moves towards the closest model (friend or foe) it can see, engaging in close combat (counting as charging) if contacted, even against its own warband.` },
          { name: `Cause Fear`, text: `Great Squigs are massive balls of flesh and teeth, they cause fear.` },
          { name: `Large Target`, text: `Great Squigs are large targets as defined in the shooting rules.` },
          { name: `Animal`, text: `Great Squigs are animals of a sort and so do not gain experience, or climb ladders (though they can reach higher levels via a particularly high bounce).` },
        ],
        notes: `M is 3D6 in the source (variable); fixed here at an approximate placeholder average of 10. A warband may include a Great Squig or a Troll, but never both.`,
      },
      {
        id: `night_goblins_web_troll`,
        name: `Troll`,
        role: `henchman`,
        cost: 200,
        rosterLimit: `0-1`,
        startingExperience: 0,
        stats: { M: 6, WS: 3, BS: 1, S: 5, T: 4, W: 3, I: 1, A: 3, Ld: 4 },
        equipmentListId: `night_goblins_web_none`,
        skillTableIds: [],
        specialRules: [
          { name: `Fear`, text: `Trolls are frightening monsters which cause fear.` },
          { name: `Stupidity`, text: `A Troll is subject to the rules for stupidity.` },
          {
            name: `Regeneration`,
            text: `Whenever an enemy successfully inflicts a wound on a Troll, roll a D6; on a 4+ the wound is ignored (not for fire/fire-based magic). Trolls never roll for Injury after a battle.`,
          },
          { name: `Dumb Monster`, text: `A Troll is far too stupid to ever learn any new skills. Trolls do not gain experience.` },
          {
            name: `Always Hungry`,
            text: `The warband must pay 15 gold crowns after every game to keep the Troll, or sacrifice two Goblin Warriors or Cave Squigs in lieu of buying food. If this fee is not paid, the Troll wanders off in search of food.`,
          },
          { name: `Vomit Attack`, text: `Instead of his normal attacks, a Troll can regurgitate its highly corrosive digestive juices: a single attack that automatically hits with a Strength of 5 and ignores armour saves.` },
          { name: `Large Target`, text: `Trolls are Large Targets as defined in the shooting rules.` },
        ],
        notes: `A warband may include a Troll or a Great Squig, but never both.`,
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1c-warbands/night-goblins-web`,
  },

  // ===================================================================================
  // The Restless Dead
  // Note: source uses 'The Restless Dead', 'Undead Liche' and 'Undead' interchangeably for this
  // warband's name — unified here as The Restless Dead per the source's own note.
  // TODO: Scarecrows' Toughness is given as "3(6)" in the source (T3 normally, effectively T6
  // against shooting and magical missiles per the No Substance rule below) — stats.T is fixed at 3
  // (the melee-relevant value); the shooting-specific T6 is only captured in the specialRules text.
  // ===================================================================================
  {
    id: `the_restless_dead`,
    name: `The Restless Dead`,
    grade: `1c`,
    race: `Undead`,
    originalSetting: `Border Town Burning`,
    sourcebook: `Border Town Burning (PDF)`,
    raceTraits: [],
    specialRules: [
      {
        name: `Note`,
        text: `No warband-wide always-active special rule beyond what is listed per-model below; the Restless Dead have access to a unique Hired Sword called the Bone Goliath, this construct has special rules to be included during warband creation.`,
      },
      {
        name: `Warband Skill: Corpse Bomb`,
        text: `Secretly nominate one Zombie at the beginning of the battle to be a Corpse Bomb. If the enemy charges or is charged by the Zombie, it immediately detonates — all models within D6 inches take D3 Strength 4 hits. The detonated Zombie may never be used again. Corpse bombs killed by shooting do not detonate. Only one Zombie at a time can be a corpse bomb, though the skill can be taken by both the Necromancer and the Liche.`,
      },
      {
        name: `Warband Skill: Deathspeaker`,
        text: `At the start of the battle, the undead player may deploy D3 Zombies for free. These zombies do not count towards the maximum number of models in the warband, but increase the warband's rating as normal, may not be used as Corpse Bombs, and only last for the duration of the battle.`,
      },
      {
        name: `Warband Skill: Wraith Touch`,
        text: `The hero may make a Wraith Touch attack instead of their normal attacks in close combat: a single unarmed attack that wounds automatically if it hits (all unarmed-attack rules apply). If a Liche uses this and wounds, he may regain one lost wound (not beyond his starting total). Necromancers do not regain wounds this way. No effect on the Possessed or Undead.`,
      },
      {
        name: `Warband Skill: Forbidden Rite`,
        text: `If the hero with this skill did not search for rare items during their last exploration phase, they start the next battle with a pool of D3+1 modifiers they can use to increase their casting rolls, using as many at a time as desired.`,
      },
      { name: `Warband Skill: Summoner`, text: `The maximum warband size is increased by 1.` },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `restless_dead_equipment`,
        name: `Restless Dead Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Halberd`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
        ],
        missileWeapons: [
          { name: `Shortbow`, cost: `5 gc` },
          { name: `Bow`, cost: `10 gc` },
        ],
        armour: [
          { name: `Shield`, cost: `5 gc` },
          { name: `Buckler`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Light armour`, cost: `20 gc` },
          { name: `Heavy armour`, cost: `50 gc` },
        ],
      },
      {
        id: `restless_dead_none`,
        name: `No Equipment`,
        meleeWeapons: [],
        missileWeapons: [],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: `restless_dead_liche`,
        name: `Liche`,
        role: `hero`,
        cost: 125,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 4, WS: 2, BS: 2, S: 2, T: 2, W: 4, I: 4, A: 1, Ld: 8 },
        equipmentListId: `restless_dead_equipment`,
        skillTableIds: [`academic`, `warband-unique`],
        specialRules: [
          { name: `Equipment restriction`, text: `Liches may not carry any non-magical weapons and do not suffer any penalties for this. They may wear any armour from the Restless Dead Equipment list.` },
          { name: `Wizard`, text: `A Liche is a powerful wizard and so is able to use Necromantic magic and starts with two spells randomly generated from the Necromantic magic list (a different list to the Core Rules' Necromancy spells).` },
          { name: `Cause Fear`, text: `A Liche is a horrible abomination and causes fear.` },
          { name: `Immune to Psychology`, text: `A Liche is not affected by psychology and never leaves combat.` },
          { name: `No Pain`, text: `A Liche treats a stunned result on the injury chart as knocked down.` },
          { name: `Immune to Poison`, text: `A Liche is not affected by poison.` },
          {
            name: `Eternal`,
            text: `A Liche can choose to ignore any result on the hero's Serious Injury chart except Killed by taking a permanent -1 on their starting Wound profile (not available with only 1 Wound remaining). A Liche that gets a Killed result instead takes a permanent -D3 Wounds on their starting profile; if this takes their starting Wound total to 0 or less, the Liche is Killed as normal.`,
          },
          {
            name: `Feed Upon Magic`,
            text: `A Liche can perform spells that, with the consumption of D3 Treasures, can give the Liche a permanent +1 Wound on their starting profile. Only usable between battles, and not if the Liche searched for rare items or was put out of action in the previous battle. If the warband lacks enough Treasures, they are consumed anyway with no Wound gained.`,
          },
          { name: `Warrior Wizard`, text: `The Liche may wear armour and cast spells; it is often the clothing and armour alone that gives the Liche substance and form.` },
          { name: `Advancement`, text: `If a Liche gets an advance roll of +1 Wound, they may instead pick a new skill from their available lists.` },
        ],
      },
      {
        id: `restless_dead_necromancer`,
        name: `Necromancer`,
        role: `hero`,
        cost: 40,
        rosterLimit: `0-1`,
        startingExperience: 8,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `restless_dead_equipment`,
        skillTableIds: [`academic`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Wizard`, text: `Necromancers are wizards being trained by their Liche masters in the art of Necromancy and so are able to use Necromantic magic. They start out knowing one of the two spells known by their Liche masters.` },
          {
            name: `Apprentices`,
            text: `Necromancers may only ever know spells known by their Liche masters. If the Liche is ever killed, the Necromancer can continue to learn magic spells as a normal wizard, ignoring the Apprentice rule.`,
          },
          { name: `Gofer`, text: `When a Necromancer searches for rare items, they roll 3D6 and pick the two highest.` },
        ],
      },
      {
        id: `restless_dead_grave_guards`,
        name: `Grave Guards`,
        role: `hero`,
        cost: 35,
        rosterLimit: `0-3`,
        startingExperience: 6,
        stats: { M: 4, WS: 3, BS: 2, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 6 },
        equipmentListId: `restless_dead_equipment`,
        skillTableIds: [`combat`, `strength`],
        specialRules: [
          { name: `Wight Blades`, text: `All close combat 'to hit' rolls of a 6 will automatically wound; roll 'to wound' as normal to determine a critical hit, but even a failed 'to wound' roll still causes a wound if a 6 was rolled first 'to hit'.` },
          { name: `Cause Fear`, text: `Grave Guards are terrifying undead creatures and so cause fear.` },
          { name: `Immune to Poison`, text: `Grave Guards are not affected by poison.` },
          { name: `Immune to Psychology`, text: `Grave Guards are not affected by psychology and never leave combat.` },
          { name: `No Pain`, text: `Grave Guards treat a stunned result on the injury chart as knocked down.` },
          { name: `May not Run`, text: `Grave Guards are slow undead creatures and may not run (but can charge normally).` },
          { name: `No deal`, text: `Grave Guards may not search for rare items.` },
        ],
      },
    ],
    henchmanTemplates: [
      {
        id: `restless_dead_zombies`,
        name: `Zombies`,
        role: `henchman`,
        cost: 15,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 0, S: 3, T: 3, W: 1, I: 1, A: 1, Ld: 5 },
        equipmentListId: `restless_dead_none`,
        skillTableIds: [],
        specialRules: [
          { name: `Equipment`, text: `Zombies may not carry any weapons or wear armour and do not suffer any penalties for this.` },
          { name: `Cause Fear`, text: `Zombies are horrible abominations and so cause fear.` },
          { name: `May not run`, text: `Zombies are slow undead creatures and may not run (but may charge normally).` },
          { name: `Immune to Psychology`, text: `A Zombie is not affected by psychology and never leaves combat.` },
          { name: `Immune to Poison`, text: `A Zombie is not affected by poison.` },
          { name: `No Pain`, text: `Zombies treat stunned results on the injury chart as knocked down.` },
          { name: `No Brain`, text: `Zombies never gain experience.` },
        ],
      },
      {
        id: `restless_dead_skeletons`,
        name: `Skeletons`,
        role: `henchman`,
        cost: 20,
        rosterLimit: `0-8`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 5 },
        equipmentListId: `restless_dead_equipment`,
        skillTableIds: [],
        specialRules: [
          { name: `Cause Fear`, text: `Skeletons are horrible abominations and so cause fear.` },
          { name: `May not run`, text: `Skeletons are slow undead creatures and may not run (but may charge normally).` },
          { name: `Immune to Psychology`, text: `Skeletons are not affected by psychology and never leave combat.` },
          { name: `Immune to Poison`, text: `Skeletons are not affected by poison.` },
          { name: `No Pain`, text: `Skeletons treat stunned results on the injury chart as knocked down.` },
          { name: `No Brain`, text: `Skeletons never gain experience.` },
        ],
      },
      {
        id: `restless_dead_wights`,
        name: `Wights`,
        role: `henchman`,
        cost: 30,
        rosterLimit: `0-3`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 6 },
        equipmentListId: `restless_dead_equipment`,
        skillTableIds: [],
        specialRules: [
          { name: `Cause Fear`, text: `Wights are horrible abominations and so cause fear.` },
          { name: `May not run`, text: `Wights are slow undead creatures and may not run (but may charge normally).` },
          { name: `Immune to Psychology`, text: `Wights are not affected by psychology and never leave combat.` },
          { name: `Immune to Poison`, text: `Wights are not affected by poison.` },
          { name: `No Pain`, text: `Wights treat stunned results on the injury chart as knocked down.` },
          {
            name: `Experience`,
            text: `Wights may gain experience, however Wights promoted to become Heroes by rolling The lad's got talent will be unable to search for rare items in the same way as Grave Guards. They must choose the Combat and Strength skill lists if promoted, and also gain Wight Blades if they become Heroes.`,
          },
        ],
      },
      {
        id: `restless_dead_scarecrows`,
        name: `Scarecrows`,
        role: `henchman`,
        cost: 65,
        rosterLimit: `0-2`,
        startingExperience: 0,
        stats: { M: 5, WS: 3, BS: 0, S: 3, T: 3, W: 1, I: 3, A: 2, Ld: 10 },
        equipmentListId: `restless_dead_none`,
        skillTableIds: [],
        specialRules: [
          { name: `Equipment`, text: `The scarecrow carries no equipment and suffers no penalties for this.` },
          { name: `Cause Fear`, text: `The sight of a tall, lanky and silent scarecrow moving is highly unnatural and so causes fear.` },
          { name: `Immune to Psychology`, text: `The scarecrow is immune to all psychology and will never leave combat.` },
          { name: `Immune to Poison`, text: `The scarecrow is immune to all poisons.` },
          { name: `No Pain`, text: `The scarecrow treats all stunned results on the injury chart as knocked down.` },
          { name: `No Brain`, text: `The scarecrow never gains experience.` },
          {
            name: `No Substance`,
            text: `The scarecrow counts as having a T6 against all shooting and magical missiles (immune to critical hits caused by shooting), except missile weapons or spells that are fire based, which deal damage as normal.`,
          },
          {
            name: `Flammable`,
            text: `Scarecrows count as being flammable, catching fire on a roll of 3+ instead of the normal 4+ (and, per the consensus house ruling referenced by the source, take double damage from fire-based attacks).`,
          },
          { name: `Construct`, text: `The scarecrow is an undead construct and may re-roll any rolls on the injury table except for wounds caused by fire.` },
          {
            name: `Animated Construct`,
            text: `The scarecrow is controlled by either the Liche or the Necromancer (noted on the warband roster), each of whom may only control one at a time — a warband with both a Liche and a Necromancer may take two Scarecrows. If the controller is unable to participate in a battle, their Scarecrow is also unable to participate. Whenever the scarecrow's controller loses a wound he must pass an unmodified Leadership test or the magical bond is broken and the scarecrow is immediately taken out of action.`,
          },
        ],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1c-warbands/restless-dead`,
  },

  // ===================================================================================
  // The Sons of Hashut
  // ===================================================================================
  {
    id: `the_sons_of_hashut`,
    name: `The Sons of Hashut`,
    grade: `1c`,
    race: `Chaos Dwarf`,
    originalSetting: `Mordheim`,
    sourcebook: `By GW Troll Magazine (Spain) (PDF). Editors: Hernán "Moska" Garcia & Dave "StyrofoamKing" Seidman-Joria`,
    raceTraits: [`hard_to_kill`, `hard_head`],
    specialRules: [
      { name: `Hard Head`, text: `Chaos Dwarfs and Bull Centaurs ignore the special rules for maces, clubs, etc. They are not easy to knock out!` },
      { name: `Armour`, text: `Chaos Dwarfs and Bull Centaurs never suffer movement penalties for wearing armour.` },
      {
        name: `Hard to Kill`,
        text: `Chaos Dwarfs and Bull Centaurs are tough, resilient individuals who can only be taken out of action on a roll of 6 instead of 5-6 when rolling on the Injury chart. Treat a roll of 1-2 as knocked down, 3-5 as stunned, and 6 as out of action.`,
      },
      {
        name: `Slavers`,
        text: `The Chaos Dwarfs will never free any slave they capture. Pick one: Sacrifice them (the apprentice sorcerer gets +1 Experience per slave sacrificed) or put them to work (gain +1 wyrdstone per working slave at the end of the game, then roll 1D6: 2-6 the captive dies and the band keeps their equipment; on a 1, the captive escapes with equipment intact and gains an experience bonus of 1D3, or +1 if a henchman).`,
      },
      {
        name: `Uncommon`,
        text: `Chaos Dwarfs are quite rare in Old World settlements. When making rolls for the acquisition of new recruits, they have to spend 1.5 times (rounding up) the amount of experience they normally spend for veterancy (not the case for Hobgoblins). Example: a group of Chaos Dwarf recruits armed with blunderbusses with 4 experience points would require at least 6 experience points to acquire one recruit, 12 to recruit two and so on.`,
      },
      {
        name: `Indentured Servants`,
        text: `A Chaos Dwarf warband must start with at least 4 Hobgoblins; if it drops below 4 Hobgoblins, you cannot recruit other members until the number of Hobgoblins is increased to four or more.`,
      },
      {
        name: `Hired Swords`,
        text: `A Chaos Dwarf warband may hire the following Hired Swords: Ogre Bodyguard, Pit Fighter, Warlock, Imperial Assassin, and Hobgoblin Scout. They may hire any Hired Sword described as "all may hire," or allowed by Orc warbands and Chaos warbands. They may never hire Elves of any sort!`,
      },
      { name: `Warband Skill: Unlimited Hatred`, text: `The warrior suffers hatred against everyone.` },
      {
        name: `Special Equipment: Hobgoblin Poisoned Daggers`,
        text: `Cost: 15 gc · Availability: Rare 9 (Hobgoblins only) · Range: Close Combat · Strength: As user. Pair: gets an additional attack for the offhand weapon attack. Swift: +1 Initiative when determining combat order. Poisoned: counts as being permanently coated in Black Lotus — no additional poison may be applied. +1 Enemy Armour Save: as daggers, an enemy wounded gains +1 to armour save, or a 6+ save if none normally.`,
      },
      {
        name: `Special Equipment: Sons of Hashut Obsidian Weapon`,
        text: `Cost: 60 gc · Availability: Rare 10 (Chaos Dwarfs only) · Range: Close Combat · Strength: As user +1. Personal: only swords, axes, and hammers can be made of obsidian (all cost the same, 60 crowns). Heavy: subtracts 1 from Initiative in melee combat. (Note: use EITHER these obsidian rules or Border Town Burning's, not both, unless renamed for clarity, e.g. "Blackshard weapons".)`,
      },
      {
        name: `Special Equipment: Chaos Dwarf Blunderbuss`,
        text: `Cost: 40 gc · Availability: Rare 9 (Chaos Dwarfs only) · Range: 16" · Strength: 3. Shot: draw a straight line 16" long and 1" wide in any direction from the firer; any and all models in its path are automatically hit by a Strength 3 hit. Prepare Shot: takes a complete turn to reload, so may only be fired every other turn.`,
      },
      {
        name: `Editors' Notes`,
        text: `Styrofoam King — changes from the original for balance/clarification: added Hired Swords rules (based on Border Town Burning); Sorcerer starting cost changed from 75gc to 85gc; Bull Centaur starting cost changed from 50gc to 75gc, added Large, removed access to shooting skills (max BS3); Obsidian Weapon unchanged but recommend using EITHER these rules or Border Town Burning's, not both; Chaos Dwarf Blunderbuss given "Prepare Shot" (fire every OTHER turn, not every turn), reduced-cost-on-startup removed; Poisoned Daggers given Rarity 9 and +1 Save like other daggers, reduced-cost-on-startup removed. Uncle Mel — cleaned up translations: standardised "out of action"/"serious injury" terminology, brought Thick Skull in line with other dwarfs, fixed the Blunderbuss special-rules reference and clarified Blunderbusser starting equipment, clarified the Uncommon rule, standardised Bull Centaur references and added it to Hard Head, standardised "Dwarfs" and UK "armour" spelling, clarified equipment wording, added lore to Apprentice Sorcerer, fixed the Warlock reference in Starting Experience.`,
      },
    ],
    warbandSkillIds: [`true_grit`, `extra_tough`, `thick_skull`],
    equipmentLists: [
      {
        id: `sons_of_hashut_chaos_dwarf`,
        name: `Chaos Dwarf Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
          { name: `Obsidian weapon`, cost: `30 gc` },
        ],
        missileWeapons: [{ name: `Pistol`, cost: `15 gc (30 gc for a brace)` }],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Heavy armour`, cost: `50 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
      {
        id: `sons_of_hashut_blunderbusser`,
        name: `Blunderbusser Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
        ],
        missileWeapons: [
          { name: `Chaos Dwarf Blunderbuss`, cost: `40 gc` },
          { name: `Pistol`, cost: `15 gc (30 gc for a brace)` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Heavy armour`, cost: `50 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
      {
        id: `sons_of_hashut_hobgoblins`,
        name: `Hobgoblins Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Hobgoblin Poisoned daggers`, cost: `15 gc` },
        ],
        missileWeapons: [
          { name: `Shortbow`, cost: `5 gc` },
          { name: `Bow`, cost: `10 gc` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Shield`, cost: `5 gc` },
        ],
      },
    ],
    heroTemplates: [
      {
        id: `sons_of_hashut_apprentice_sorcerer`,
        name: `Apprentice Sorcerer`,
        role: `hero`,
        cost: 85,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 3, WS: 4, BS: 3, S: 3, T: 4, W: 1, I: 3, A: 1, Ld: 9 },
        equipmentListId: `sons_of_hashut_chaos_dwarf`,
        skillTableIds: [`combat`, `academic`, `warband-unique`],
        specialRules: [
          { name: `Equipment note`, text: `If you equip a wizard with armour, he cannot cast spells.` },
          { name: `Leader`, text: `Any warrior within 6" of the Apprentice Sorcerer may use his Leadership when taking Ld tests.` },
          { name: `Rituals of Chaos`, text: `Chaos Dwarf spellcasters are wizards and can learn a random spell from the Chaos Dwarf spell list.` },
        ],
      },
      {
        id: `sons_of_hashut_bull_centaur`,
        name: `Bull Centaur`,
        role: `hero`,
        cost: 75,
        rosterLimit: `0-1`,
        startingExperience: 12,
        stats: { M: 7, WS: 4, BS: 3, S: 4, T: 4, W: 1, I: 3, A: 2, Ld: 9 },
        equipmentListId: `sons_of_hashut_chaos_dwarf`,
        skillTableIds: [`combat`, `strength`, `warband-unique`],
        specialRules: [
          {
            name: `Large Target`,
            text: `Bull Centaurs are large creatures and therefore make tempting targets for archers. Anyone shooting at the Bull Centaur gains a +1 'to hit' and may shoot at it even if it is not the closest target. As large targets, a Bull Centaur adds an extra +20 to the warband's rating (instead of +5).`,
          },
        ],
      },
      {
        id: `sons_of_hashut_chaos_dwarf_champions`,
        name: `Chaos Dwarf Champions`,
        role: `hero`,
        cost: 50,
        rosterLimit: `0-2`,
        startingExperience: 8,
        stats: { M: 3, WS: 5, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 9 },
        equipmentListId: `sons_of_hashut_chaos_dwarf`,
        skillTableIds: [`combat`, `shooting`, `strength`, `warband-unique`],
        specialRules: [],
      },
    ],
    henchmanTemplates: [
      {
        id: `sons_of_hashut_chaos_dwarf_warriors`,
        name: `Chaos Dwarf Warriors`,
        role: `henchman`,
        cost: 40,
        rosterLimit: `0-6`,
        startingExperience: 0,
        stats: { M: 3, WS: 4, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 9 },
        equipmentListId: `sons_of_hashut_chaos_dwarf`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `sons_of_hashut_blunderbuss_chaos_dwarfs`,
        name: `Blunderbuss Chaos Dwarfs`,
        role: `henchman`,
        cost: 40,
        rosterLimit: `0-3`,
        startingExperience: 0,
        stats: { M: 3, WS: 4, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 9 },
        equipmentListId: `sons_of_hashut_blunderbusser`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `sons_of_hashut_hobgoblins`,
        name: `Hobgoblins`,
        role: `henchman`,
        cost: 15,
        rosterLimit: `4+`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 6 },
        equipmentListId: `sons_of_hashut_hobgoblins`,
        skillTableIds: [],
        specialRules: [
          {
            name: `Skinny`,
            text: `Hobgoblins are naturally cowardly creatures forced to fight by their Chaos Dwarf masters — they take damage easily and try to escape at the slightest opportunity. When making serious injury rolls, a result of 1-3 indicates that they abandon the band.`,
          },
          {
            name: `Nobody cares about them`,
            text: `Hobgoblins count as half the number of troops if the band has to make a rout check (e.g. in a band of 12, if 2 Hobgoblins and 1 Chaos Dwarf are out of action, the total counts as two: 1/2 + 1/2 + 1 = 2). Hobgoblins cannot be heroes — just reroll the "Lad's got talent" roll.`,
          },
        ],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1c-warbands/sons-of-hashut`,
  },
];

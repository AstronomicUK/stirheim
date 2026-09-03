// Warbands added from sources outside mordheimer.net. Each entry cites its source; the full rule
// text lives alongside in rules/warbands/ for checking.
//
// The Restless Dead (Variant) — "The Restless Dead" by Chris de la Rosa (an earlier, Liche-led
// version of the Border Town Burning list), supplied by Tom as a PDF and transcribed to
// rules/warbands/restless-dead-variant.md. Differences from the mordheimer.net Restless Dead
// (grade-1c.ts `the_restless_dead`): Wight Blades crit on a 5+ (rather than auto-wounding on a 6
// to hit), a Bone Goliath construct instead of Scarecrows, "Dark Ritual" instead of "Forbidden
// Rite", Feed Upon Magic consumes wyrdstone, and its own revised Necromancy list.

import type { WarbandTemplate } from "../../types";

const UNDEAD_HENCHMAN_TRAITS = ["no_pain", "immune_to_poison", "immune_to_psychology", "causes_fear"];

export const WARBANDS: WarbandTemplate[] = [
  {
    id: "the_restless_dead_variant",
    name: "The Restless Dead (Variant)",
    grade: "variant",
    race: "Undead (Liche-led)",
    originalSetting: "Mordheim",
    sourcebook: "The Restless Dead by Chris de la Rosa (PDF supplied by Tom)",
    raceTraits: [],
    specialRules: [
      {
        name: "Choice of Warriors",
        text: "An Undead Liche warband must include a minimum of three models. You have 500 gold crowns to recruit your warband. The maximum number of warriors may not exceed 12. Liche: exactly one. Necromancer: 0-1. Grave Guards: 0-3. Zombies: any number. Skeletons: 0-8. Wights: 0-3. Bone Goliath: 0-1.",
      },
      {
        name: "Racial maximums",
        text: "Liche: M5 WS4 BS4 S4 T4 W8 I6 A3 Ld10. Grave Guard (and Wights promoted to Heroes): M5 WS5 BS5 S4 T4 W4 I5 A4 Ld10. Necromancers use Human maximums.",
      },
      {
        name: "Undead special skills",
        text: "Liches and Necromancers may choose to use the following skill list instead of any of the standard Skill tables available to them: Corpse Bomb, Deathspeaker, Wraith Touch, Dark Ritual, Summoner.",
      },
      {
        name: "Warband Skill: Corpse Bomb",
        text: "Secretly nominate one Zombie at the beginning of the battle to be a Corpse Bomb. If the enemy charges or is charged by the Zombie, it immediately detonates: all models within D6 inches take D3 Strength 4 hits. The detonated Zombie may never be used again. Corpse bombs killed by shooting do not detonate. Only one Zombie at a time can be a corpse bomb, although the skill can be taken by both the Necromancer and the Liche.",
      },
      {
        name: "Warband Skill: Deathspeaker",
        text: "At the start of the battle, the undead player may deploy D3 Zombies for free. These zombies do not count towards the maximum number of models in the warband, but increase the warband's rating as normal. They may not be used as Corpse Bombs and only last for the duration of the battle.",
      },
      {
        name: "Warband Skill: Wraith Touch",
        text: "The hero may make a Wraith Touch attack instead of their normal attacks in close combat: a single unarmed attack that wounds automatically if it hits (all unarmed-attack rules apply). If a Liche uses this skill and wounds, he may regain one lost wound, not beyond his starting total. Necromancers do not regain wounds with this skill. No effect on the Possessed or Undead.",
      },
      {
        name: "Warband Skill: Dark Ritual",
        text: "Nominate one spell known by the hero with this skill. That spell, for the duration of the battle, gets a bonus of +D3 to see if the spell is cast. Roll the D3 at the beginning of the game, not for every separate casting.",
      },
      { name: "Warband Skill: Summoner", text: "The maximum warband size is increased by 1." },
      {
        name: "Necromancy (revised for a Liche warband)",
        text: "1 Lifestealer (10): a model within 6\" suffers a wound with no saves and the caster gains a wound for the battle. 2 Re-Animation (5): a Zombie taken out of action last combat phase returns within 6\"; may instead restore 1 lost wound to a Grave Guard or Wight. 3 Death Vision (Necromancers only, 6): the Necromancer causes fear and is immune to it; Horror (Liche only, 8): a model within 8\" takes a wound with no armour save if D6+3 equals or beats its Leadership, and if it survives may not move, shoot or cast next turn. 4 Spell of Doom (9): an enemy within 12\" rolls equal to or under its Strength or suffers an Injury roll. 5 Call of Vanhel (6): a Zombie, Skeleton, Wight or Grave Guard within 6\" moves again (counts as charging if it makes contact). 6 Spell of Awakening (auto): a killed enemy Hero is raised as a Zombie retaining its characteristics and equipment.",
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: "restless_dead_variant_equipment",
        name: "Undead Equipment List",
        meleeWeapons: [
          { name: "Dagger", cost: "1st free/2 gc" },
          { name: "Mace", cost: "3 gc" },
          { name: "Hammer", cost: "3 gc" },
          { name: "Axe", cost: "5 gc" },
          { name: "Sword", cost: "10 gc" },
          { name: "Double-handed weapon", cost: "15 gc" },
          { name: "Spear", cost: "10 gc" },
          { name: "Halberd", cost: "10 gc" },
        ],
        missileWeapons: [
          { name: "Shortbow", cost: "5 gc" },
          { name: "Bow", cost: "10 gc" },
        ],
        armour: [
          { name: "Light armour", cost: "20 gc" },
          { name: "Heavy armour", cost: "50 gc" },
          { name: "Shield", cost: "5 gc" },
          { name: "Buckler", cost: "5 gc" },
          { name: "Helmet", cost: "10 gc" },
        ],
      },
      {
        id: "restless_dead_variant_armour_only",
        name: "Armour only (Liche)",
        meleeWeapons: [],
        missileWeapons: [],
        armour: [
          { name: "Light armour", cost: "20 gc" },
          { name: "Heavy armour", cost: "50 gc" },
          { name: "Shield", cost: "5 gc" },
          { name: "Buckler", cost: "5 gc" },
          { name: "Helmet", cost: "10 gc" },
        ],
      },
      { id: "restless_dead_variant_none", name: "No Equipment", meleeWeapons: [], missileWeapons: [], armour: [] },
    ],
    heroTemplates: [
      {
        id: "restless_dead_variant_liche",
        name: "Liche",
        role: "hero",
        cost: 125,
        rosterLimit: "1",
        startingExperience: 20,
        stats: { M: 4, WS: 2, BS: 2, S: 2, T: 2, W: 4, I: 4, A: 1, Ld: 8 },
        equipmentListId: "restless_dead_variant_armour_only",
        skillTableIds: ["academic", "warband-unique"],
        traitIds: ["immune_to_poison", "immune_to_psychology", "causes_fear"],
        specialRules: [
          { name: "Weapons/Armour", text: "Liches may not carry any non-magical weapons and do not suffer any penalties for this. They may wear any armour from the Undead Equipment list." },
          { name: "Wizard", text: "A Liche is a powerful wizard and so is able to use Necromantic magic and starts with two spells randomly generated from the Necromantic magic list." },
          { name: "Cause Fear", text: "A Liche is a horrible abomination and causes fear." },
          { name: "Immune to Psychology", text: "A Liche is not affected by psychology and never leaves combat." },
          { name: "Immune to Poison", text: "A Liche is not affected by poison." },
          {
            name: "Eternal",
            text: "A Liche can choose to ignore any result on the hero's Serious Injury chart except Killed by taking a permanent -1 on their starting Wound profile. A Liche with 1 Wound remaining on their starting profile does not have this option. A Liche that gets a Killed result instead takes a permanent -D3 Wounds on their starting profile; if this takes their starting Wound total to 0 or less, the Liche is Killed as normal.",
          },
          {
            name: "Feed Upon Magic",
            text: "A Liche can perform rituals that, with the consumption of D3 shards of wyrdstone, give the Liche a permanent +1 Wound on their starting profile. Only between battles, and not if the Liche searched for rare items or was put out of action in the previous battle. If the warband does not have enough wyrdstone, the shards are consumed anyway and the Liche does not gain the Wound.",
          },
          { name: "Warrior Wizard", text: "The Liche may wear armour and cast spells. It is often the clothing and armour alone that gives the Liche substance and form." },
          { name: "Advancement", text: "If a Liche gets an advance roll of +1 Wound, they may instead pick a new skill from their available lists." },
        ],
        notes: "Fights unarmed unless given a magical weapon (Wraith Touch is the intended attack).",
      },
      {
        id: "restless_dead_variant_necromancer",
        name: "Necromancer",
        role: "hero",
        cost: 40,
        rosterLimit: "0-1",
        startingExperience: 8,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: "restless_dead_variant_equipment",
        skillTableIds: ["academic", "speed", "warband-unique"],
        traitIds: [],
        specialRules: [
          { name: "Wizard", text: "Necromancers are wizards being trained by their Liche masters in the art of Necromancy and so are able to use Necromantic magic. They start out knowing one of the two spells known by their Liche masters." },
          {
            name: "Apprentices",
            text: "Necromancers may only ever know spells known by their Liche masters. If the Liche is ever killed, the Necromancer can continue to learn magic spells as a normal wizard, ignoring the Apprentice rule.",
          },
          { name: "Gofer", text: "When a Necromancer searches for rare items, they roll 3D6 and pick the two highest." },
        ],
      },
      {
        id: "restless_dead_variant_grave_guards",
        name: "Grave Guards",
        role: "hero",
        cost: 35,
        rosterLimit: "0-3",
        startingExperience: 6,
        stats: { M: 4, WS: 3, BS: 2, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 6 },
        equipmentListId: "restless_dead_variant_equipment",
        skillTableIds: ["combat", "strength"],
        traitIds: ["wight_blades_5plus", ...UNDEAD_HENCHMAN_TRAITS],
        specialRules: [
          {
            name: "Wight Blades",
            text: "Any non-magical close combat weapon carried by the Grave Guards counts as a Wight Blade. In addition to any special rules the weapon has, it will cause 'critical hits' on a roll of 5+ instead of 6. Gromril and Ithilmar weapons may not become Wight Blades.",
          },
          { name: "Cause Fear", text: "Grave Guards are terrifying undead creatures and so cause fear." },
          { name: "Immune to Poison", text: "Grave Guards are not affected by poison." },
          { name: "Immune to Psychology", text: "Grave Guards are not affected by psychology and never leave combat." },
          { name: "No Pain", text: "Grave Guards treat a stunned result on the injury chart as knocked down." },
          { name: "May not Run", text: "Grave Guards are slow undead creatures and may not run (but can charge normally)." },
          { name: "Truly Horrifying", text: "Grave Guards may not search for rare items." },
        ],
      },
    ],
    henchmanTemplates: [
      {
        id: "restless_dead_variant_zombies",
        name: "Zombies",
        role: "henchman",
        cost: 15,
        rosterLimit: "any",
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 0, S: 3, T: 3, W: 1, I: 1, A: 1, Ld: 5 },
        equipmentListId: "restless_dead_variant_none",
        skillTableIds: [],
        traitIds: UNDEAD_HENCHMAN_TRAITS,
        specialRules: [
          { name: "Weapons/Armour", text: "Zombies may not carry any weapons or wear armour and do not suffer any penalties for this." },
          { name: "Cause Fear", text: "Zombies are horrible abominations and so cause fear." },
          { name: "May not run", text: "Zombies are slow undead creatures and may not run (but may charge normally)." },
          { name: "Immune to Psychology", text: "A Zombie is not affected by psychology and never leaves combat." },
          { name: "Immune to Poison", text: "A Zombie is not affected by poison." },
          { name: "No Pain", text: "Zombies treat stunned results on the injury chart as knocked down." },
          { name: "No Brain", text: "Zombies never gain experience." },
        ],
        notes: "Fights with its natural weapons — equip 'Zombie Claws' (unarmed, no attack cap).",
      },
      {
        id: "restless_dead_variant_skeletons",
        name: "Skeletons",
        role: "henchman",
        cost: 20,
        rosterLimit: "0-8",
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 5 },
        equipmentListId: "restless_dead_variant_equipment",
        skillTableIds: [],
        traitIds: UNDEAD_HENCHMAN_TRAITS,
        specialRules: [
          { name: "Cause Fear", text: "Skeletons are terrifying undead monsters and so cause fear." },
          { name: "May not run", text: "Skeletons are slow undead creatures and may not run (but may charge normally)." },
          { name: "Immune to Psychology", text: "A Skeleton is not affected by psychology and never leaves combat." },
          { name: "Immune to Poison", text: "A Skeleton is not affected by poison." },
          { name: "No Pain", text: "Skeletons treat stunned results on the injury chart as knocked down." },
          { name: "Mindless", text: "Skeletons never gain experience." },
        ],
      },
      {
        id: "restless_dead_variant_wights",
        name: "Wights",
        role: "henchman",
        cost: 30,
        rosterLimit: "0-3",
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 6 },
        equipmentListId: "restless_dead_variant_equipment",
        skillTableIds: [],
        traitIds: UNDEAD_HENCHMAN_TRAITS,
        specialRules: [
          { name: "Cause Fear", text: "Wights are terrifying undead creatures and so cause fear." },
          { name: "Immune to Poison", text: "Wights are not affected by poison." },
          { name: "Immune to Psychology", text: "Wights are not affected by psychology and never leave combat." },
          { name: "No Pain", text: "Wights treat a stunned result on the injury chart as knocked down." },
          { name: "May not Run", text: "Wights are slow undead creatures and may not run (but can charge normally)." },
          {
            name: "Experience",
            text: "Wights are the only henchmen to gain experience. Wights that roll The lad's got talent will be unable to search for items as heroes in the same way as Grave Guards. They may not choose Academic, Speed or Special as one of their two skill lists and use the same racial maximums as Grave Guards.",
          },
        ],
      },
      {
        id: "restless_dead_variant_bone_goliath",
        name: "Bone Goliath",
        role: "henchman",
        cost: 225,
        rosterLimit: "0-1",
        startingExperience: 0,
        stats: { M: 5, WS: 3, BS: 0, S: 5, T: 5, W: 3, I: 2, A: 3, Ld: 6 },
        equipmentListId: "restless_dead_variant_none",
        skillTableIds: [],
        traitIds: ["undead_construct", "large_target", ...UNDEAD_HENCHMAN_TRAITS],
        specialRules: [
          { name: "Weapons/Armour", text: "Bone Goliaths may never carry any weapons and suffer no penalties for this. They also never wear any armour." },
          { name: "Cause Fear", text: "A Bone Goliath is a gargantuan undead construct and causes fear." },
          { name: "May not run", text: "Bone Goliaths are slow undead creatures and may not run (but may charge normally)." },
          { name: "Immune to Psychology", text: "A Bone Goliath is not affected by psychology and never leaves combat." },
          { name: "Immune to Poison", text: "A Bone Goliath is not affected by poison." },
          {
            name: "Undead Construct",
            text: "Bone Goliaths ignore any injury rolled on the injury chart on the roll of a 4+ and continue fighting, so a Bone Goliath can take much more damage than its 3 wounds suggest. This is not an armour save and is not modified by the Strength of the attack. Ignored for wounds caused by magic or magic weapons.",
          },
          {
            name: "Construction",
            text: "Bone Goliaths are constructed, not hired: the Liche loses a permanent D3 from their starting Wound total (to a minimum of 1) in addition to the 225 gc. A warband constructing one may not look for rare items that turn. A warband without a Liche may not construct one, but an existing Goliath is unaffected if the Liche dies. Warbands starting with a Bone Goliath ignore this rule.",
          },
          { name: "Large", text: "Any model may shoot at a Bone Goliath, even if it is not the closest target, and gets a +1 to hit bonus." },
          { name: "No Pain", text: "Bone Goliaths treat stunned results on the injury chart as knocked down." },
          { name: "Mindless", text: "Bone Goliaths never gain experience." },
        ],
        notes: "Fights with its natural weapons: equip 'Zombie Claws' (unarmed, strikes at the model's own Strength 5, no attack cap) rather than 'Fist', which is for disarmed warriors and is capped at one attack.",
      },
    ],
    sourceUrl: "rules/warbands/restless-dead-variant.md",
  },
];

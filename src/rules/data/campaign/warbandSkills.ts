// Warband-specific skill tables, extracted verbatim from reference/rules/warbands/*.md by a
// scratchpad generator (not committed). The core Combat/Shooting/Academic/Strength/Speed lists live
// in data/skills.ts and are NOT repeated here; this file holds only the lists a warband gets on top
// of (or instead of) those, i.e. the "Special" column of each warband's skill-access table.
//
// Conventions:
// - `name` is the source heading verbatim. Where a list has no heading of its own the bold
//   "<Warband> Skill Table" heading of the access table is used (e.g. Sisters of Sigmar).
// - `restriction` is set where the source states who may take the skill — either a parenthetical
//   in the skill name ("(Captain only)"), a sub-heading ("*Skinks Only*"), a list-level qualifier
//   ("Troll Slayers only"), or a sentence inside the rule text (kept verbatim there as well).
// - Skill ids are prefixed with their table id so the same skill name in several warbands
//   (True Grit, Infiltration, Black Hunger...) stays unique.
// - The Restless Dead (Variant) list comes from a two-column PDF transcription; its rule text is the
//   column lines joined, and the truncated heading/intro fragments ("Undead sp… pecial skills") are
//   reconstructed to match the grade-1c Restless Dead wording.

import type { WarbandSkillTable } from "../../types/warbandSkills";

export const WARBAND_SKILL_TABLES: WarbandSkillTable[] = [
  {
    id: "sisters_of_sigmar_skills",
    name: "Sisters of Sigmar Skill Table",
    warbandId: "sisters_of_sigmar",
    intro: "The Sisters of Sigmar may use the following skill list instead of the standard skill lists.",
    skills: [
      {
        id: "sisters_of_sigmar_skills_sign_of_sigmar",
        name: "Sign of Sigmar",
        text: "The Sister is favoured by the great god Sigmar. Possessed or Undead opponents lose their first attack against the Priestess in the first round of hand-to-hand combat (down to a minimum of 1).",
      },
      {
        id: "sisters_of_sigmar_skills_protection_of_sigmar",
        name: "Protection of Sigmar",
        text: "The Sister has been blessed by the High Matriarch. Any spell which would affect her is nullified on a D6 roll of 4+. Note that if the spell is nullified it will not affect any other models either.",
      },
      {
        id: "sisters_of_sigmar_skills_utter_determination",
        name: "Utter Determination",
        text: "Only the Matriarch may have this skill, which allows her to re-roll any failed Rout tests.",
        restriction: "Only the Matriarch may have this skill",
      },
      {
        id: "sisters_of_sigmar_skills_righteous_fury",
        name: "Righteous Fury",
        text: "The Sister feels cold fury and utter contempt towards any evil that pollutes the soil of the holy Empire with its presence. The model hates all Skaven, Undead, Possessed, Beastmen, Dark Elves and any other 'evil' warband and all models in them. Non-Chaos humans who just like to kill, loot, etc, are not included.",
      },
      {
        id: "sisters_of_sigmar_skills_absolute_faith",
        name: "Absolute Faith",
        text: "The Sister puts her faith in Sigmar, and faces dangers unflinchingly. She may re-roll any fear tests and does not have to test if she is fighting alone against several opponents.",
      },
    ],
    source: { publication: "Mordheim Rulebook (PDF)", file: "warbands/core-and-grade-1a.md:518-529" },
  },
  {
    id: "skaven_of_clan_eshin_skills",
    name: "Skaven Skill Table",
    warbandId: "skaven_of_clan_eshin",
    intro: "Skaven Heroes may choose to use the following Skill list instead of any of the standard Skill tables available to them.",
    skills: [
      {
        id: "skaven_of_clan_eshin_skills_black_hunger",
        name: "Black Hunger",
        text: "The Skaven can draw upon the dreaded Black Hunger, the fighting frenzy which gives him unnatural strength and speed but can ravage him from inside. The Skaven Hero may declare at the beginning of his turn that he is using this skill. The Hero may add +1 attack and +D3\" to the total move to his profile for the duration of his own turn but will suffer D3 S3 hits with no armour save possible at the end of the turn.",
      },
      {
        id: "skaven_of_clan_eshin_skills_tail_fighting",
        name: "Tail Fighting",
        text: "The Skaven may wield a shield, knife or a sword with its tail. The model gains an extra attack with the appropriate weapon or a +1 bonus to its armour save.",
      },
      {
        id: "skaven_of_clan_eshin_skills_wall_runner",
        name: "Wall Runner",
        text: "The Skaven does not need to take an Initiative test when climbing up walls and other sheer surfaces.",
      },
      {
        id: "skaven_of_clan_eshin_skills_infiltration",
        name: "Infiltration",
        text: "A Skaven with this skill is always placed on the battlefield after the opposing warband and can be placed anywhere on the table as long as it is out of sight of the opposing warband and more than 12\" away from any enemy model. If both players have models which infiltrate, roll a D6 for each, and the lowest roll sets up first.",
      },
      {
        id: "skaven_of_clan_eshin_skills_art_of_silent_death",
        name: "Art of Silent Death",
        text: "The Skaven has patiently mastered the deadly art of open-hand fighting, as taught by the mystics of Cathay in the temples of the far East. In hand-to-hand combat, the Skaven can fight with his bare paws without any penalties and counts as having two weapons (ie, +1 attack). In addition, a Skaven Hero with this skill will cause a critical hit on a To Wound roll of 5-6 instead of just 6. This skill may be used in conjunction with the Eshin Fighting Claws (+2 Attacks instead of +1).",
      },
    ],
    source: { publication: "Mordheim Rulebook (PDF)", file: "warbands/core-and-grade-1a.md:692-703" },
  },
  {
    id: "beastmen_raiders_special_skills",
    name: "Beastmen Special Skills",
    warbandId: "beastmen_raiders",
    skills: [
      {
        id: "beastmen_raiders_special_skills_shaggy_hide",
        name: "Shaggy Hide",
        text: "The Beastman's massively shaggy hide acts as armour, deflecting sword strokes and protecting him from harm. The model gains a 6+ Armour Save that can be combined with other armour as normal.",
      },
      {
        id: "beastmen_raiders_special_skills_mutant",
        name: "Mutant",
        text: "The Beastman may buy one mutation. See Mutants section on special rules.",
      },
      {
        id: "beastmen_raiders_special_skills_fearless",
        name: "Fearless",
        text: "Immune to fear and All Alone tests.",
      },
      {
        id: "beastmen_raiders_special_skills_horned_one",
        name: "Horned One",
        text: "The Beastman has mighty horns, and can make an additional Attack with its basic Strength on a turn it charges.",
      },
      {
        id: "beastmen_raiders_special_skills_bellowing_roar",
        name: "Bellowing Roar",
        text: "Only the Beastmen Chief may have this skill. He may re-roll any failed Rout tests.",
        restriction: "Only the Beastmen Chief may have this skill",
      },
      {
        id: "beastmen_raiders_special_skills_manhater",
        name: "Manhater",
        text: "Will be affected by the rules of hatred when fighting any Human warbands.",
      },
    ],
    source: { publication: "Empire in Flames (PDF)", file: "warbands/core-and-grade-1a.md:1611-1623" },
  },
  {
    id: "dwarf_treasure_hunters_dwarf_skills",
    name: "Dwarf Skill Table",
    warbandId: "dwarf_treasure_hunters",
    intro: "Dwarf Heroes may use the following Skill table instead of any of the standard Skill tables available to them.",
    skills: [
      {
        id: "dwarf_treasure_hunters_dwarf_skills_master_of_blades",
        name: "Master of Blades",
        text: "This Dwarf's martial skills surpass those of a normal warrior; he has fought unscathed against hordes of Orcs and Goblins. When using a weapon that has a Parry special rule, this hero parries successfully if he beats or matches his opponent's highest 'to hit' roll, not just if he beats the roll. In addition, if this warrior is using two weapons that have the Parry special rule, he is allowed to parry two attacks (if his two dice match or beat the two highest Attack dice against him) instead of the normal maximum of one. Note that if this Dwarf has two Dwarf axes he can reroll any failed parries.",
      },
      {
        id: "dwarf_treasure_hunters_dwarf_skills_extra_tough",
        name: "Extra Tough",
        text: "This Dwarf is notorious for walking away from wounds that would kill a lesser being. When rolling on the Heroes Serious Injury chart for this Hero after a game in which he has been taken out of action, the dice may be re-rolled once. The result of this second dice roll must be accepted, even if it is a worse result.",
      },
      {
        id: "dwarf_treasure_hunters_dwarf_skills_resource_hunter",
        name: "Resource Hunter",
        text: "This Dwarf is especially good at locating valuable resources. When rolling on the Exploration chart at the end of a game, the Hero may modify one dice roll by +1/-1.",
      },
      {
        id: "dwarf_treasure_hunters_dwarf_skills_true_grit",
        name: "True Grit",
        text: "Dwarfs are hardy individuals and this Hero is hardy even for a Dwarf! When rolling on the Injury table for this Hero, a roll of 1-3 is treated as knocked down, 4-5 as stunned, and 6 as out of action.",
      },
      {
        id: "dwarf_treasure_hunters_dwarf_skills_thick_skull",
        name: "Thick Skull",
        text: "The Hero has a thick skull, even for a Dwarf. He has a 3+ save on a D6 to avoid being stunned. If the save is made, treat a stunned result as knocked down instead. If the Dwarf also wears a helmet, this save is 2+ instead of 3+ (this takes the place of the normal Helmet special rule).",
      },
    ],
    source: { publication: "Town Cryer #4 (PDF), revised in Mordheim Annual 2002 · **Author:** Mark Havener", file: "warbands/core-and-grade-1a.md:2074-2085" },
  },
  {
    id: "dwarf_treasure_hunters_troll_slayer_skills",
    name: "Troll Slayer Skills",
    warbandId: "dwarf_treasure_hunters",
    intro: "(usable alongside any of the standard Skill tables)",
    skills: [
      {
        id: "dwarf_treasure_hunters_troll_slayer_skills_ferocious_charge",
        name: "Ferocious Charge",
        text: "The Slayer may double his attacks on the turn in which he charges. He will suffer a -1 'to hit' penalty on that turn.",
        restriction: "Troll Slayers only",
      },
      {
        id: "dwarf_treasure_hunters_troll_slayer_skills_monster_slayer",
        name: "Monster Slayer",
        text: "The Slayer always wounds any opponent on a roll of 4+, regardless of Toughness, unless his own Strength (after all modifiers due to weapon bonuses, etc) would mean that a lower roll than this is needed.",
        restriction: "Troll Slayers only",
      },
      {
        id: "dwarf_treasure_hunters_troll_slayer_skills_berserker",
        name: "Berserker",
        text: "The Slayer may add +1 to his close combat 'to hit' rolls during the turn in which he charges.",
        restriction: "Troll Slayers only",
      },
    ],
    source: { publication: "Town Cryer #4 (PDF), revised in Mordheim Annual 2002 · **Author:** Mark Havener", file: "warbands/core-and-grade-1a.md:2200-2204" },
  },
  {
    id: "orc_mob_skills",
    name: "Orc Skill Table",
    warbandId: "orc_mob",
    intro: "Orc Heroes may use the following Skill list instead of any of the standard Skill lists available to them.",
    skills: [
      {
        id: "orc_mob_skills_ard_ead",
        name: "'Ard Ead",
        text: "The warrior has a thick skull even for an Orc. He has a special 3+ save on a D6 to avoid being stunned. If the save is made, treat a stunned result as knocked down instead. If the Orc also wears a helmet, this save is 2+ instead of 3+ (this takes the place of the normal helmet special rule).",
      },
      {
        id: "orc_mob_skills_waaagh",
        name: "Waaagh!",
        text: "Orcs are aggressive creatures and some are experts at bulldozing charges. The warrior may add +D3\" to his charge range.",
      },
      {
        id: "orc_mob_skills_ere_we_go",
        name: "'Ere We Go!",
        text: "Orcs often charge even the most fearsome opponents. The model may ignore fear tests when charging.",
      },
      {
        id: "orc_mob_skills_da_cunnin_plan",
        name: "Da Cunnin' Plan",
        text: "Only the Boss may have this skill. The warband may re-roll any failed Rout tests as long as the Boss is not out of action.",
        restriction: "Only the Boss may have this skill",
      },
      {
        id: "orc_mob_skills_well_ard",
        name: "Well 'Ard",
        text: "The Orc has a thick, dark-green skin, possibly indicating Black Orc blood. Such is the toughness of the Orc that he may add +1 to any armour saves.",
      },
      {
        id: "orc_mob_skills_eadbasher",
        name: "'Eadbasher",
        text: "Orcs have massive physical strength and some of them even learn to aim their blows at the heads of their opponents, with obvious results. Any knocked down results which the Orc causes in hand-to-hand count as stunned results instead.",
      },
    ],
    source: { publication: "Town Cryer #6 (PDF), revised in Mordheim Annual 2002 · **Author:** Mark Havener", file: "warbands/core-and-grade-1a.md:2544-2557" },
  },
  {
    id: "ostlander_mercenaries_skills",
    name: "Ostlander Skill Table",
    warbandId: "ostlander_mercenaries",
    intro: "Ostlander Heroes may use the following Skill table instead of any of the standard skill tables available to them:",
    skills: [
      {
        id: "ostlander_mercenaries_skills_bull_rush",
        name: "Bull Rush",
        text: "This warrior is huge, even by Ostlander standards, and can use his massive girth to overpower his opponents. When he charges, this Hero may attempt to knock down his opponent rather than making his normal attacks. Roll to hit once with a +1 to hit modifier, though no 'to wound' roll is necessary. Instead, if the warrior hits with this attack, the opposing model is Knocked Down. (Models with the Bull Rush skill should have a suitably large beer-belly modelled out of putty whenever possible!)",
      },
      {
        id: "ostlander_mercenaries_skills_foul_odour",
        name: "Foul Odour",
        text: "Ostlanders are prodigious drinkers and none too hygienic! This warrior rises head and shoulders above the rest. After a lifetime of drinking, liquor has little effect on him any more... not that this stops him from consuming massive quantities! His unwashed clothes and sweat reek of alcohol and all living enemies (not Undead or Possessed) are at -1 to hit him in hand-to-hand combat. In addition, the warrior cannot carry any open flames (torch, lantern, etc) and fire attacks made against him are resolved at +1 Strength as his booze soaked clothing burns readily.",
      },
      {
        id: "ostlander_mercenaries_skills_taunt",
        name: "Taunt",
        text: "After years of baiting opponents into drunken brawls, this Ostlander has learned some of most vile insults in the Empire. During the Shooting phase, the warrior may choose to taunt one enemy instead of shooting with a missile weapon or casting a spell. The warrior must be able to see the enemy and taunting follows all the LOS rules for shooting (you must taunt the nearest opponent, etc). The player should insult the enemy model in some manner whenever possible (perhaps his hat looks like a strangled parrot or his mother was a Bretonnian!). The enemy then takes a Leadership test. If he passes, nothing happens, but if he fails he must spend his next Movement phase trying to get into close combat with the warrior who taunted him.",
      },
      {
        id: "ostlander_mercenaries_skills_animal_friendship",
        name: "Animal Friendship",
        text: "Having grown up amidst the animals of the forest, this warrior exudes a certain charm to all 'normal' animals (ie, warhorses, warhounds, etc). Animals will never attack him and up to two wardogs (see Mordheim book, page 54) that the warrior owns do not count against the maximum number of models in the warband.",
      },
      {
        id: "ostlander_mercenaries_skills_blood_oath",
        name: "Blood Oath",
        text: "The leader of an Ostlander warband sometimes takes a blood oath never to leave any of his fallen 'family' members behind. Such is his determination to protect his fallen blood-kin that it is extremely difficult to cause him to rout from the field. Only a warband's leader may have this skill, which allows him to reroll a single Rout test once per game.",
        restriction: "Only a warband's leader may have this skill",
      },
    ],
    source: { publication: "Town Cryer #11 (PDF), revised in Mordheim Annual 2002", file: "warbands/core-and-grade-1a.md:2779-2790" },
  },
  {
    id: "amazons_lustria_skills",
    name: "Amazon Skill Table",
    warbandId: "amazons_lustria",
    intro: "Amazon Heroines may use the following skill table instead of any of the standard skill tables available to them.",
    skills: [
      {
        id: "amazons_lustria_skills_skink_hunter",
        name: "Skink Hunter",
        text: "Through her exploits the Amazon has proven herself a master when it comes to hunting Lizardmen, particularly Skinks. An Amazon with this skill will always strike first in the first round of combat against Skink models no matter who charged.",
      },
      {
        id: "amazons_lustria_skills_elixir_of_life",
        name: "Elixir of Life",
        text: "After years of service among her tribe an Amazon is granted access to the waters that make the Elixir of Life. The Elixir is said to heal wounds and make the Amazons immortal. Any Amazon with this Elixir can re-roll a Serious Injury roll once after the battle, accepting the result of the second roll.",
      },
      {
        id: "amazons_lustria_skills_mesmerising_dance",
        name: "Mesmerising Dance",
        text: "Some Amazon women develop their fighting motions into a graceful dance that can transfix their foes. Any model fighting in base contact with the Amazon must take a Leadership test at the start of each turn. If they fail they cannot attack that turn but may defend themselves. The dance however is useless against Lizardmen and undead who are immune to their charms.",
      },
      {
        id: "amazons_lustria_skills_savage_fury",
        name: "Savage Fury",
        text: "The Amazon has learned to channel her anger and aggression making her a veritable animal while attacking her foes. Any Amazon model with this skill receives +1 A when charging and is immune to charm effects and fear.",
      },
      {
        id: "amazons_lustria_skills_concealment",
        name: "Concealment",
        text: "The Amazon is adept at blending in with her surroundings. When hiding in jungle terrain all enemy models must halve the range at which they can spot them.",
      },
    ],
    source: { publication: "Town Cryer #15 (PDF)", file: "warbands/grade-1b-part1.md:52-63" },
  },
  {
    id: "arabian_tomb_raiders_skills",
    name: "Arabian Tomb Raiders Skill Table",
    warbandId: "arabian_tomb_raiders",
    intro: "Arab Heroes may use the following skill table instead of any of the standard skill tables available to them.",
    skills: [
      {
        id: "arabian_tomb_raiders_skills_sand_worm",
        name: "Sand Worm",
        text: "The warrior can bury himself in sand and become almost undetectable. The model can hide in open ground. Cannot be used inside buildings.",
      },
      {
        id: "arabian_tomb_raiders_skills_hit_and_run",
        name: "Hit and Run",
        text: "The warrior can run and shoot but suffer -2 to hit instead of the -1 to hit for moving.",
      },
      {
        id: "arabian_tomb_raiders_skills_weather_tolerant",
        name: "Weather Tolerant",
        text: "The warrior has grown so used to the weather it doesn't even affect him anymore. Weather conditions such as heat and such no longer affect this model.",
      },
    ],
    source: { publication: "Town Cryer #20 (PDF)", file: "warbands/grade-1b-part1.md:556-563" },
  },
  {
    id: "black_orcs_skills",
    name: "Orc Skill Table",
    warbandId: "black_orcs",
    intro: "Black Orc Heroes may use the following Skill list instead of the standard skill lists available to them.",
    skills: [
      {
        id: "black_orcs_skills_proven_warrior",
        name: "Proven Warrior",
        text: "This young warrior has proven himself worthy of his Black Orc heritage. This skill may only be taken by a Young'un with the Black Orc blood ability and 25 experience. Once he gains this skill, the model is now considered a full Black Orc Warrior (yet still retains the title of Young'un). He follows all the rules for Black Orcs and uses their equipment list and has access to the same skill lists as a Black Orc.",
        restriction: "This skill may only be taken by a Young'un with the Black Orc blood ability and 25 experience",
      },
      {
        id: "black_orcs_skills_ard_ead",
        name: "'Ard Ead",
        text: "The warrior has a thick skull even for an Orc. He has a special 3+ save on a D6 to avoid being stunned. If the save is made, treat a stunned result as knocked down instead. If the Orc also wears a helmet, this save is 2+ instead of 3+ (this takes the place of the normal helmet special rule).",
      },
      {
        id: "black_orcs_skills_waaagh",
        name: "Waaagh!",
        text: "Orcs are aggressive creatures and some are experts at bulldozing charges. The warrior may add +D3\" to his charge range.",
      },
      {
        id: "black_orcs_skills_ere_we_go",
        name: "'Ere We Go!",
        text: "Orcs often charge even the most fearsome opponents. The model may ignore fear tests when charging.",
      },
      {
        id: "black_orcs_skills_da_cunnin_plan",
        name: "Da Cunnin' Plan",
        text: "Only the Boss may have this skill. The warband may re-roll any failed Rout tests as long as the Boss is not out of action.",
        restriction: "Only the Boss may have this skill",
      },
      {
        id: "black_orcs_skills_eadbasher",
        name: "'Eadbasher",
        text: "Orcs have massive physical strength and some of them even learn to aim their blows at the heads of their opponents, with obvious results. Any knocked down results which the Orc causes in hand-to-hand count as stunned results instead.",
      },
    ],
    source: { publication: "Nemesis Crown (PDF)", file: "warbands/grade-1b-part1.md:749-762" },
  },
  {
    id: "bretonnian_knights_virtues",
    name: "Bretonnian Knight Virtues",
    warbandId: "bretonnian_knights",
    intro: "Bretonnian Questing Knights may use the following Skill table instead of any of the standard Skill tables available to them.",
    skills: [
      {
        id: "bretonnian_knights_virtues_virtue_of_purity",
        name: "Virtue of Purity",
        text: "The Knight's sole purpose is to serve the Lady of the Lake. His purity of heart and discipline endow him with the strength of spirit to resist enemy magic. Any spell cast against the knight will be dispelled on the D6 roll of a 4+. This is a natural dispel on account of the knights extreme piety.",
      },
      {
        id: "bretonnian_knights_virtues_virtue_of_valour",
        name: "Virtue of Valour",
        text: "The Knight has vowed to confront the biggest and strongest foes. The more awesome his enemy, the more valourous are his efforts. If fighting a model with a higher Strength characteristic than himself, the Knight may reroll any failed to hit rolls in hand-to-hand combat.",
      },
      {
        id: "bretonnian_knights_virtues_virtue_of_discipline",
        name: "Virtue of Discipline",
        text: "The Knight has total faith in his chivalric code: he maintains self-control in the face of adversity, and displays complete confidence whatever the odds. Once per game, if the knight is not out of action, stunned or knocked down, you may re-roll a failed rout test.",
      },
      {
        id: "bretonnian_knights_virtues_virtue_of_noble_disdain",
        name: "Virtue of Noble Disdain",
        text: "The Knight has nothing but contempt for enemies who hide behind weapons of dishonour. The Knight is subject to hatred of all enemies armed with shooting weapons.",
      },
      {
        id: "bretonnian_knights_virtues_virtue_of_impetuous",
        name: "Virtue of Impetuous",
        text: "The Knight is eager to get to grips with the enemy. He charges into combat with reckless enthusiasm. The Knight may add +D3\" to his move when charging. Roll the dice each time you wish to charge and before moving the model.",
      },
    ],
    source: { publication: "Town Cryer #8 (PDF) · **Author:** Sir Tomaso De Merrigan", file: "warbands/grade-1b-part1.md:992-1003" },
  },
  {
    id: "dark_elves_skills",
    name: "Dark Elf Skill Table",
    warbandId: "dark_elves",
    intro: "Dark Elf Heroes may use the following Skill table instead of any of the standard Skill tables available to them.",
    skills: [
      {
        id: "dark_elves_skills_fury_of_khaine",
        name: "Fury of Khaine",
        text: "The Dark Elf is infused with an intense raging thirst for blood and is a whirlwind in hand-to-hand combat, moving from opponent to opponent. The Dark Elf may make a 4\" follow up move if he takes all of his opponents Out Of Action. If he comes into contact with another enemy this starts a new combat. This new combat takes place in the following turn and the model counts as charging. May not follow up in the opponent's turn.",
      },
      {
        id: "dark_elves_skills_powerful_build",
        name: "Powerful Build",
        text: "The warrior is strongly built for an Elf and is capable of feats of strength. A warrior with this skill may choose skills from the Strength table. The Sorceress may never take this skill and no more than two warriors in the warband may take this skill at any one time.",
        restriction: "The Sorceress may never take this skill and no more than two warriors in the warband may take this skill at any one time",
      },
      {
        id: "dark_elves_skills_fey_quickness",
        name: "Fey Quickness",
        text: "Few can ever hope to match an Elf's inhuman quickness and agility. An Elf with Fey Quickness can avoid melee or missile attacks on a roll of 6. If the Elf also has Step Aside or Dodge this will increase to a 4+ in the relevant area. For example, an Elf with Fey Quickness and Step Aside avoids melee attacks on a 4+ and missile attacks on a 6.",
      },
      {
        id: "dark_elves_skills_infiltration",
        name: "Infiltration",
        text: "The Dark Elf with this skill is always placed on the battlefield after the opposing warband and can be placed anywhere on the table as long as it is out of sight of the opposing warband and more than 12\" away from any enemy model. If both players have models which infiltrate, roll a D6 for each, and the lowest roll sets up first.",
      },
      {
        id: "dark_elves_skills_master_of_poisons",
        name: "Master of Poisons",
        text: "The Dark Elf is proficient in concocting different poisons. If the Hero doesn't search for rare items, he may make D3-1 doses of Dark Venom instead. There is a chance of getting none, as the hero doesn't have access to a stable workplace. The poison must be used in the next battle and cannot be sold or traded to other warbands as the Dark Elves guard their secrets very carefully.",
      },
    ],
    source: { publication: "Town Cryer #12 (PDF)", file: "warbands/grade-1b-part1.md:1243-1254" },
  },
  {
    id: "dwarf_rangers_dwarf_skills",
    name: "Dwarf Skill Table",
    warbandId: "dwarf_rangers",
    intro: "*Note that Dwarfs may never take the Arcane Lore skill. It is not possible for a dwarf to learn to cast spells.\n\nDwarf Heroes may use the following Skill table instead of any of the standard Skill tables available to them.",
    skills: [
      {
        id: "dwarf_rangers_dwarf_skills_combat_master",
        name: "Combat Master",
        text: "This Dwarf's martial skills surpass those of a normal warrior; he is used to fighting by himself against hordes of opponents and coming through unscathed. When using a weapon that has a Parry special rule, this hero parries successfully if he beats OR MATCHES his opponent's highest 'to hit' roll, not just if he beats the roll. In addition, if this warrior is using two weapons that have the Parry special rule, he is allowed to parry two attacks (if his two dice match or beat the highest two attack dice against him) instead of the normal maximum of one.",
      },
      {
        id: "dwarf_rangers_dwarf_skills_extra_tough",
        name: "Extra Tough",
        text: "This Dwarf is notorious for walking away from wounds that would kill a lesser being. When rolling on the Heroes Serious Injury chart for this Hero after a game in which he has been taken out of action, the dice may be re-rolled once. The result of this second dice roll must be accepted, even if it is a worse result.",
      },
      {
        id: "dwarf_rangers_dwarf_skills_resource_hunter",
        name: "Resource Hunter",
        text: "This Dwarf is especially good at locating valuable resources. When rolling on the Exploration chart at the end of a game, the Hero may modify one dice roll by +1/-1.",
      },
      {
        id: "dwarf_rangers_dwarf_skills_true_grit",
        name: "True Grit",
        text: "Dwarfs are hardy individuals and this Hero is hardy even for a Dwarf! When rolling on the Injury table for this Hero, a roll of 1-3 is treated as knocked down, 4-5 as stunned, and 6 as out of action.",
      },
      {
        id: "dwarf_rangers_dwarf_skills_thick_skull",
        name: "Thick Skull",
        text: "The Hero has a thick skull, even for a Dwarf. He has a 3+ save on a D6 to avoid being stunned. If the save is made, treat a stunned result as knocked down instead. If the Dwarf also wears a helmet, this save is 2+ instead of 3+ (this takes the place of the normal Helmet special rule).",
      },
    ],
    source: { publication: "Nemesis Crown Supplement (PDF) · **Author:** Mordheim Nemesis Crown Development Team", file: "warbands/grade-1b-part1.md:1508-1521" },
  },
  {
    id: "dwarf_rangers_slayer_special_skills",
    name: "Slayer Special Skills (Troll Slayers only)",
    warbandId: "dwarf_rangers",
    skills: [
      {
        id: "dwarf_rangers_slayer_special_skills_ferocious_charge",
        name: "Ferocious Charge",
        text: "The Slayer may double his attacks on the turn in which he charges. He will suffer a –1 to hit penalty on that turn.",
        restriction: "Troll Slayers only",
      },
      {
        id: "dwarf_rangers_slayer_special_skills_monster_slayer",
        name: "Monster Slayer",
        text: "The Slayer always wounds any opponent on a roll of 4+, regardless of Toughness, unless his own strength (with weapon modifiers) would mean that a lower roll than this is needed.",
        restriction: "Troll Slayers only",
      },
      {
        id: "dwarf_rangers_slayer_special_skills_berserker",
        name: "Berserker",
        text: "The Slayer may add +1 to his to hit rolls during the turn in which he charges.",
        restriction: "Troll Slayers only",
      },
    ],
    source: { publication: "Nemesis Crown Supplement (PDF) · **Author:** Mordheim Nemesis Crown Development Team", file: "warbands/grade-1b-part1.md:1523-1529" },
  },
  {
    id: "hochland_bandits_skills",
    name: "Bandit Skill Table",
    warbandId: "hochland_bandits",
    intro: "Bandit Heroes may use the following skill list.",
    skills: [
      {
        id: "hochland_bandits_skills_banditry",
        name: "Banditry",
        text: "Between missions, the bandit goes off and robs travelers or other innocent victims. Instead of searching for Rare equipment, the hero may engage in banditry - roll a D6, on a result of 2-6, the banditry is successful and the hero adds D6+1 gold to the warband's stash. However, on a result of 1, the attempted robbery has somehow gone wrong - roll on the Serious Injury table for the bandit, as if he had been taken Out of Action in the last game. If several heroes have this skill, it is quite possible that some are successful and some not in their Banditry attempt between games...that is the nature of thieves' honor - if a man falls behind, he is usually on his own! This skill may not be combined with the Huckster's Slick Operator special ability.",
      },
      {
        id: "hochland_bandits_skills_hide_in_shadows",
        name: "Hide in Shadows",
        text: "The Bandit has become an expert at concealing himself from his enemies (and potential victims!). An enemy warrior attempting to detect this warrior when he is Hidden must halve his Initiative (round up) before measuring the distance.",
      },
      {
        id: "hochland_bandits_skills_jump_back",
        name: "Jump Back",
        text: "This warrior is an expert at getting himself out of sticky situations. If the warrior is in close combat with an enemy warrior (and not Knocked Down or Stunned) at the start of his Movement Phase, he may attempt to jump out of combat. To attempt to do so, the warrior must make an Initiative test. If he fails the test, the warrior will automatically strike last in that round of combat. However, if he passes, immediately move him 1\" away from the enemy warrior (this does not count against his movement for that Movement Phase); he may then move and otherwise act normally for the rest of that turn (even charging back into combat if he chooses!).",
      },
      {
        id: "hochland_bandits_skills_sniper",
        name: "Sniper",
        text: "The bandit is an expert at shooting his victims from the comfort of cover. When Hiding, the warrior may cast spells or shoot and still remain Hidden. Note that the bandit may not use this skill if he is shooting a Blackpowder weapon!",
      },
      {
        id: "hochland_bandits_skills_throw_voice",
        name: "Throw Voice",
        text: "This rogue has mastered the art of misdirecting enemies who get too close by making them hear noises or voices some distance from his location. If an enemy warrior is attempting to detect the bandit while he is Hidden, roll a D6 - on a result of 4 or better, the bandit is undetected and remains Hidden.",
      },
    ],
    source: { publication: "Nemesis Crown Supplement (PDF) · **Author:** Mordheim Nemesis Crown Development Team", file: "warbands/grade-1b-part1.md:2330-2341" },
  },
  {
    id: "horned_hunters_skills",
    name: "Horned Hunter Skill Table",
    warbandId: "horned_hunters",
    intro: "Horned Hunter Heroes may choose to use the following Skill list instead of any of the standard Skill tables available to them.",
    skills: [
      {
        id: "horned_hunters_skills_master_trapper",
        name: "Master Trapper",
        text: "This huntsman is a masterful trap setter. Trip wire range has been extended by this warrior to reach 4\". Traps set by a master trapper are triggered by a score of 2+.",
      },
      {
        id: "horned_hunters_skills_infiltration",
        name: "Infiltration",
        text: "A warrior with this skill is always placed on the battlefield after the opposing warband and can be placed anywhere on the table as long as it is out of sight of the opposing warband and more than 12\" away from any enemy model. If both players have models which infiltrate, roll a D6 for each, and the lowest roll sets up first.",
      },
      {
        id: "horned_hunters_skills_foul_odour",
        name: "Foul Odour",
        text: "Worshippers of Taal are one and all prodigious drinkers and none too hygienic! This warrior rises head and shoulders above the rest. After a lifetime of drinking, liquor has little effect on him any more... not that this stops him from consuming massive quantities! His unwashed clothes and sweat reek of alcohol and all living enemies (not Undead or Possessed) are at -1 to hit him in close combat. In addition, the warrior cannot carry any open flames (torch, lantern, etc.) and fire attacks made against him are resolved at +1 Strength as his beer soaked clothing burns readily.",
      },
      {
        id: "horned_hunters_skills_animal_friendship",
        name: "Animal Friendship",
        text: "Having grown up amidst the animals of the forest this warrior exudes a certain charm to all 'normal' animals (warhorses, warhounds, etc.). Animals will never attack him and up to two wardogs that the warrior owns do not count against the maximum number of models in the Warband.",
      },
      {
        id: "horned_hunters_skills_pathfinder",
        name: "Pathfinder",
        text: "Taal has gifted this hunter with an uncanny ability to find paths through unexplored territories. Roll one additional D6 during the exploration phase. A warband may only contain one pathfinder.",
        restriction: "A warband may only contain one pathfinder",
      },
      {
        id: "horned_hunters_skills_hide_in_shadows",
        name: "Hide in Shadows",
        text: "The hunter has learned to crouch unseen in any cover they can find. Enemy models must halve their Initiative when attempting to find this warrior when he is Hidden.",
      },
    ],
    source: { publication: "Nemesis Crown Supplement (PDF) · **Author:** Mordheim Nemesis Crown Development Team", file: "warbands/grade-1b-part1.md:2627-2640" },
  },
  {
    id: "lizardmen_special_skills",
    name: "Lizardmen Special Skills",
    warbandId: "lizardmen",
    intro: "Lizardmen Heroes with the Special skill list available to them may use these skill lists instead of the normal ones when they gain a new skill.",
    skills: [
      {
        id: "lizardmen_special_skills_infiltration",
        name: "Infiltration",
        text: "The Skink is a great hunter and is an expert at sneaking upon his prey unnoticed. The Hero may set up anywhere on the table but no closer than 12\" to an enemy and he must start the game in hiding.",
        restriction: "Skinks Only",
      },
      {
        id: "lizardmen_special_skills_great_hunter",
        name: "Great Hunter",
        text: "The Skink Great Crest is adept at making the most of the cover available and imposes an additional -1 to hit the Skink if he is in cover, i.e. a -2 to hit penalty.",
        restriction: "Skinks Only",
      },
      {
        id: "lizardmen_special_skills_bellowing_battle_roar",
        name: "Bellowing Battle Roar",
        text: "The Saurus' roar is so deafening that enemy models in base contact suffer -1 to hit in the first round of combat against them.",
        restriction: "Saurus Only",
      },
      {
        id: "lizardmen_special_skills_toughened_hide",
        name: "Toughened Hide",
        text: "Through years of battle the Saurus' hide has become hardened and the Saurus will only be taken out of action on a 6+.",
        restriction: "Saurus Only",
      },
    ],
    source: { publication: "Town Cryer #11 (PDF)", file: "warbands/grade-1b-part2.md:251-265" },
  },
  {
    id: "norse_explorers_special_skills",
    name: "Norse Special Skills",
    warbandId: "norse_explorers",
    intro: "Norse heroes may use the following skill list instead of any of the standard skill lists.",
    skills: [
      {
        id: "norse_explorers_special_skills_barbarian_courage",
        name: "Barbarian Courage",
        text: "As Norse warriors strive to die bravely in battle, they learn to fear nothing and embrace hardship. This hero never needs to take all alone tests and may re-roll failed fear tests.",
      },
      {
        id: "norse_explorers_special_skills_battle_tongue",
        name: "Battle Tongue",
        text: "Only a hero with the leader skill may gain this skill. It allows models within 12\" of him to use his leadership, rather than the normal 6\".",
        restriction: "Only a hero with the leader skill may gain this skill",
      },
      {
        id: "norse_explorers_special_skills_berserk_charge",
        name: "Berserk Charge",
        text: "The Norse are very skilled with weapons that many other races see as primitive and savage. When this hero is armed with an axe or double handed weapon, he may re-roll all failed to hit rolls when he charges.",
      },
      {
        id: "norse_explorers_special_skills_crushing_blow",
        name: "Crushing Blow",
        text: "Norse warriors train in almost all of their spare time. They are expert fighters and learn to put all of their strength into very powerful attacks. No enemy may parry an attack made by this hero because it strikes with such great power that it pushes right through a buckler or sword.",
      },
      {
        id: "norse_explorers_special_skills_shield_master",
        name: "Shield Master",
        text: "Norse warriors begin training with shields when they are still children. Some warriors become so skilled with these weapons they can block almost any blow against them. When this hero is armed with a shield he may parry with it in addition to getting a 6+ save.",
      },
    ],
    source: { publication: "Town Cryer #13 (PDF), Border Town Burning (PDF) · **Author:** Derek Whitman", file: "warbands/grade-1b-part2.md:641-653" },
  },
  {
    id: "pirates_special_skills",
    name: "Pirate Special Skills",
    warbandId: "pirates",
    intro: "Pirate Heroes may use the following Skill table instead of any of the standard Skill tables available to them.",
    skills: [
      {
        id: "pirates_special_skills_sea_shanty_singer",
        name: "Sea Shanty Singer",
        text: "The pirate is renowned throughout the seas as one of the greatest singers aboard a ship, able to raise the spirits of any crew with his stirring renditions of pirate ditties. At the start of his Close Combat phase he can suddenly burst out in song, distracting one opponent in base contact of his choosing. That enemy must pass a Leadership test, or lose 1 Attack that turn. This does not affect Undead or other non-living creatures, such as Possessed.",
      },
      {
        id: "pirates_special_skills_sea_legs",
        name: "Sea Legs",
        text: "Even in the strongest seas, the pirate has learned to keep his footing and equilibrium. If he Falls during a battle, he may ignore the effects of the D3 hits on a roll of 4+ (make a single roll to see if any of the hits take effect or not). In addition, if he is knocked down or stunned within 1\" of a precipice he may re-roll his Initiative test to see if he falls down or not.",
      },
      {
        id: "pirates_special_skills_cutlass_master",
        name: "Cutlass Master",
        text: "These short, single bladed swords are the mainstay weapon of any pirate crew, and in the hands of a trained seaman they are superb weapons for close quarters fighting. If the pirate is equipped with a Sword, this skill will give him the additional benefit of also being able to parry successfully if the player rolls equal to number rolled to hit, not just higher as normal. This extra ability only applies if the Pirate is not in the open; i.e., only when in cover or in a building, within 2\" of a terrain feature like a wall or tree, etc.",
      },
      {
        id: "pirates_special_skills_booming_voice",
        name: "Booming Voice",
        text: "The Captain has spent many a battle bellowing orders to his crew, yelling above the roar of the cannons and the screams of the enemy. Once per turn, the captain may shout encouraging words (or threats) at any one pirate within 8\" who just failed his test to see if he runs away from combat, or to stop running away if he was already fleeing. That pirate may then re-roll the test. This can only be done if the Captain is on his feet, but not if the Captain is in close combat himself.",
        restriction: "Captain only",
      },
      {
        id: "pirates_special_skills_hardy_constitution",
        name: "Hardy Constitution",
        text: "Many months at sea, and especially many months eating hardtack, have hardened the pirate's body to effects that would cause a lesser man to collapse. During the battle, the pirate may ignore any Critical Hits on a roll of 5+ (the wound is treated as normal if the roll is successful). If the roll is failed, the Critical Hit is worked out as normal.",
      },
      {
        id: "pirates_special_skills_swashbuckler",
        name: "Swashbuckler",
        text: "The pirate cuts a dashing figure in combat, mixing dazzling swordplay and acrobatic feats with charm and witty comments. Even the basest villains in Mordheim respect (and curse) his ability to always seem to effortlessly slip from their grasp. The pirate may make a Leadership Test at the end of any Hand-to-Hand phase (pirate's or enemy's turn) if he is still in base contact with any enemy models. If he passes he may make a normal movement away from the enemy (he may not run or charge), without the enemy striking any blows on him. If he fails the test he remains in combat and must fight as normal in the following turn.",
      },
    ],
    source: { publication: "Town Cryer #9 (PDF) · **Author:** Cap'n Tim Huckelbery", file: "warbands/grade-1b-part2.md:1053-1067" },
  },
  {
    id: "pit_fighters_skills",
    name: "Pit Fighter Skills",
    warbandId: "pit_fighters",
    skills: [
      {
        id: "pit_fighters_skills_bulging_biceps",
        name: "Bulging Biceps",
        text: "The Pit Fighter may ignore the entire 'heavy' weapons special rule penalty. The Strength bonus will now apply to all rounds in Close-Combat. So a Morning Star will give +1 Strength in all turns not only the first one.",
      },
      {
        id: "pit_fighters_skills_force_of_will",
        name: "Force of Will",
        text: "When the Pit Fighter loses his last wound and is taken Out-of-Action, he must roll a D6 equal to or under his Toughness. Each following round he has to roll again on his toughness but then with a -1 modifier for each subsequent round. If he succeeds he gets up and may continue to fight. When he gets taken Out-of-Action a second time he'll be removed as normal.",
      },
      {
        id: "pit_fighters_skills_arms_master",
        name: "Arms Master",
        text: "The Pit Fighter may now ignore all 'difficult to use' rules for all weapons. This enables him to combine certain types of weapons. He can combine a Morning Star with a buckler, or even a Morning Star with a Morning Star.",
      },
      {
        id: "pit_fighters_skills_body_slam",
        name: "Body Slam",
        text: "Instead of making a normal charge, the Pit Fighter may attempt to slam his opponent to the ground, he burrows his shoulder deep into his opponent's stomach. Instead of making his normal attacks the Pit Fighter may make a single attack resolved as following: +1 Str, +1 to Hit, no weapon bonuses or abilities. Critical hit on a 5+.",
      },
      {
        id: "pit_fighters_skills_grizzled_veteran",
        name: "Grizzled Veteran",
        text: "The Pit Fighter is used to fighting fearsome monsters and being cornered in the pit when there's no escape. He has been close to death so many times that he has made his peace and the thought of death no longer bothers him. The Pit Fighter is immune to all psychology.",
      },
    ],
    source: { publication: "Town Cryer #21 (Revised from TC #14) (PDF)", file: "warbands/grade-1b-part2.md:1411-1421" },
  },
  {
    id: "pit_fighters_troll_slayer_special_skills",
    name: "Troll Slayer Special Skills",
    warbandId: "pit_fighters",
    intro: "Dwarf Slayers may use the following Skill table as well as any of the standard Skill tables available to Dwarfs.",
    skills: [
      {
        id: "pit_fighters_troll_slayer_special_skills_ferocious_charge",
        name: "Ferocious Charge",
        text: "The Slayer may double his attacks on the turn that he charges. He will suffer a -1 to hit penalty on that turn.",
        restriction: "Dwarf Slayers only",
      },
      {
        id: "pit_fighters_troll_slayer_special_skills_monster_slayer",
        name: "Monster Slayer",
        text: "The Slayer always wounds any opponent on a roll of 4+, regardless of Toughness, unless his own Strength (after all modifiers due to weapon bonuses, etc.) would mean that a lower roll than this is needed.",
        restriction: "Dwarf Slayers only",
      },
      {
        id: "pit_fighters_troll_slayer_special_skills_berserker",
        name: "Berserker",
        text: "The Slayer may add +1 to his close combat to hit rolls during the turn which he charges (may not be used with Ferocious Charge).",
        restriction: "Dwarf Slayers only",
      },
    ],
    source: { publication: "Town Cryer #21 (Revised from TC #14) (PDF)", file: "warbands/grade-1b-part2.md:1423-1429" },
  },
  {
    id: "shadow_warriors_special_skills",
    name: "Shadow Warrior Special Skills",
    warbandId: "shadow_warriors",
    intro: "Shadow Warrior Heroes may use the following Skill table instead of any of the standard Skill tables available to them.",
    skills: [
      {
        id: "shadow_warriors_special_skills_infiltration",
        name: "Infiltration",
        text: "An Elf with this skill is always placed on the battlefield after the opposing warband and can be placed anywhere on the table as long as it is out of sight of the opposing warband and more than 12\" away from any enemy model. If both players have models which infiltrate, roll a D6 for each, and the lowest roll sets up first.",
      },
      {
        id: "shadow_warriors_special_skills_see_in_shadows",
        name: "See in Shadows",
        text: "The warrior's senses have become especially keen from years spent walking the shadows. As long as he has movement to reach them, the warrior may always roll to charge opponents he cannot see (instead of the normal 4\").",
      },
      {
        id: "shadow_warriors_special_skills_hide_in_shadows",
        name: "Hide in Shadows",
        text: "Over time Shadow Warriors have learned how to freeze in place and remain undetected, even from the heightened senses of their Dark Elf cousins. An enemy warrior attempting to detect this warrior when he is Hidden must halve his Initiative before measuring the distance.",
      },
      {
        id: "shadow_warriors_special_skills_sniper",
        name: "Sniper",
        text: "Long years of guerrilla warfare against the Dark Elves have taught Shadow Warriors how to strike from the shadows without being seen. If Hidden, a warrior with this skill may shoot or cast spells and still remain Hidden. If his target is not immediately taken out of action by the Sniper they get to test against their Initiative in an attempt to spot him. A successful test means that the Sniper has been spotted and is no longer hidden.",
      },
      {
        id: "shadow_warriors_special_skills_powerful_build",
        name: "Powerful Build",
        text: "The warrior is strongly built for an Elf, and is capable of feats of strength not often seen among the people of Ulthuan. A warrior with this skill may choose skills from the Strength skills table from now on. This skill may not be taken by Shadow Weavers. There may never be more than two Elves with this skill in the warband at any one time.",
        restriction: "This skill may not be taken by Shadow Weavers. There may never be more than two Elves with this skill in the warband at any one time",
      },
      {
        id: "shadow_warriors_special_skills_master_of_runes",
        name: "Master of Runes",
        text: "The Shadow Weaver has learned to harness the power of the High Elven runes of power (see Elven Runestones, below) to a degree few mages attain. When using Elven Runestones, the mage is +1 to his dispel roll. In addition, the mage can inscribe the weapons and armour of one of his fellow warriors with Elven runes. One member of the Warband may reroll a single failed armour save or Parry roll once per battle. After a single battle, the runes lose their glamour and must be redone. This skill may only be taken by Shadow Weavers.",
        restriction: "This skill may only be taken by Shadow Weavers",
      },
    ],
    source: { publication: "Town Cryer #10 (PDF), revised in Mordheim Annual 2002", file: "warbands/grade-1b-part2.md:1641-1655" },
  },
  {
    id: "skaven_of_clan_pestilens_special_skills",
    name: "Clan Pestilens Special Skills",
    warbandId: "skaven_of_clan_pestilens",
    intro: "Members of Clan Pestilens may choose to use the following Skill list instead of any of the standard Skill tables available to them.",
    skills: [
      {
        id: "skaven_of_clan_pestilens_special_skills_black_hunger",
        name: "Black Hunger",
        text: "The Skaven can draw upon the dreaded Black Hunger, the fighting frenzy which gives him unnatural strength and speed but can ravage him from inside. The Skaven Hero may declare at the beginning of his turn that he is using this skill. The Hero may add +1 attack and +D3\" to the total move to his profile for the duration of his own turn but will suffer D3 S3 hits with no armour save possible at the end of the turn.",
      },
      {
        id: "skaven_of_clan_pestilens_special_skills_censer_bearer",
        name: "Censer Bearer",
        text: "Only a Clan Pestilens member with the Black Hunger special skill may choose the Censer Bearer special skill. A Clan Pestilens member with this skill is called Censer Bearer. He gains the special rule frenzy and the only weapon he may use in close combat is a censer.",
        restriction: "Only a Clan Pestilens member with the Black Hunger special skill may choose the Censer Bearer special skill",
      },
      {
        id: "skaven_of_clan_pestilens_special_skills_rotten_body",
        name: "Rotten Body",
        text: "A Clan Pestilens member with this skill has grown accustomed to poisons, diseases and the fog of death emanated by censers. He is now immune to poison and diseases and, if taken out of action because of a failed test by wielding a censer, he will not have to roll for injuries at the end of the battle, recovering automatically.",
      },
      {
        id: "skaven_of_clan_pestilens_special_skills_contagious",
        name: "Contagious",
        text: "Only a Clan Pestilens member with the Rotten Body special skill may choose the Contagious special skill. A model who inflicts an injury in close combat that sends the contagious member of the Clan Pestilens out of action must take a Toughness test. Roll a D6. If the result is higher than the Toughness of the model taking the test, he will suffer an automatic wound. A result of 6 always inflicts a wound. Models of undead and possessed never take this test.",
        restriction: "Only a Clan Pestilens member with the Rotten Body special skill may choose the Contagious special skill",
      },
      {
        id: "skaven_of_clan_pestilens_special_skills_ignore_pain",
        name: "Ignore Pain",
        text: "Only a Clan Pestilens member with the Resilient strength skill may choose the Ignore Pain special skill. A Clan Pestilens member with this skill treats \"Stunned\" injuries as \"Knocked Down\".",
        restriction: "Only a Clan Pestilens member with the Resilient strength skill may choose the Ignore Pain special skill",
      },
    ],
    source: { publication: "Town Cryer #29 (PDF)", file: "warbands/grade-1b-part2.md:1835-1847" },
  },
  {
    id: "tomb_guardians_additional_skills",
    name: "Tomb Guardian Additional Skills",
    warbandId: "tomb_guardians",
    skills: [
      {
        id: "tomb_guardians_additional_skills_drive_chariot_academic",
        name: "Drive Chariot (Academic)",
        text: "Chariots are very difficult to control and a warrior must have this skill to drive a chariot effectively in combat. A charioteer without this skill cannot charge.",
      },
    ],
    source: { publication: "Town Cryer #18 (PDF)", file: "warbands/grade-1b-part2.md:2354-2356" },
  },
  {
    id: "battle_monks_of_cathay_skills",
    name: "Battle Monks Skill Table",
    warbandId: "battle_monks_of_cathay",
    intro: "Battle Monks of Cathay may choose to use the following skill list instead of the standard skill lists. Note that the Emissary may only pick the Warmonger skill.",
    skills: [
      {
        id: "battle_monks_of_cathay_skills_energy_focus",
        name: "Energy Focus",
        text: "If fighting unarmed, the Hero may choose to reduce his Attacks by –1 and thus gain +1 Strength in close combat. The monk may sacrifice any number of attacks this way.",
      },
      {
        id: "battle_monks_of_cathay_skills_lightning_speed",
        name: "Lightning Speed",
        text: "The monk may triple his Movement whilst running or charging and may run even when there are enemy models within 8”.",
      },
      {
        id: "battle_monks_of_cathay_skills_leap_of_faith",
        name: "Leap of Faith",
        text: "The Hero cannot be intercepted whilst charging. He may escape from combat (as described on p. 161 in the Mordheim rulebook) by leaping away without having to pass an Ld test and may declare a leaping charge at the same time in the same turn.",
      },
      {
        id: "battle_monks_of_cathay_skills_human_shield",
        name: "Human Shield",
        text: "If two or more models are engaged in close combat with the monk, he may choose to grab one to use it as a shield instead of his normal attacks. To do this, he must pass an Initiative test after the first model has attacked, but before the second model attacks. On a successful roll, the monk grabs the first model – the second model directs its full attacks on the friendly model. After the combat phase, the model breaks free and the battle goes on as usual. On a failed roll, the monk and the second model use their normal attacks.",
      },
      {
        id: "battle_monks_of_cathay_skills_warmonger",
        name: "Warmonger",
        text: "The Emissary may make an Ld test before the battle. If the test is successful, D3+1 Raging Peasants join the warband for the next game (this may exceed the maximum number of warriors). Each Raging Peasant in the warband is subject to Hatred for the duration of the battle.",
      },
    ],
    source: { publication: "Border Town Burning (PDF)", file: "warbands/grade-1c.md:45-56" },
  },
  {
    id: "black_dwarfs_skills",
    name: "Chaos Dwarf Skill Table",
    warbandId: "black_dwarfs",
    intro: "Chaos Dwarfs may choose to use the following skill list instead of the standard skill lists.",
    skills: [
      {
        id: "black_dwarfs_skills_extra_tough",
        name: "Extra Tough",
        text: "A Chaos Dwarf with this skill is notorious for walking away from wounds that would kill a lesser warrior. When rolling on the Heroes Serious Injury chart for this Hero after a game in which he has been taken out of action, the dice may be re-rolled once. The result of this second dice roll must be accepted, even if it is a worse result.",
      },
      {
        id: "black_dwarfs_skills_chaos_engineer",
        name: "Chaos Engineer",
        text: "The Hero has great technical skill and can use this to craft wicked armours and weapons. Whenever a Hero with this skill searches for Chaos armour (including Mechanical Suits) or Obsidian Weapons, he gets +3 on the roll. This represents the Engineer's ability to craft these items himself. The Hero ignores the Rarity and Gift of Chaos special rules and may never wear the Chaos Armours.",
      },
      {
        id: "black_dwarfs_skills_thick_skull",
        name: "Thick Skull",
        text: "The Hero has a thick skull, even for a Chaos Dwarf. He has a 3+ save on a D6 to avoid being stunned. If the save is made, treat a stunned result as knocked down instead. If the Chaos Dwarf also wears a helmet, this save is 2+ instead of 3+ (this takes the place of the normal Helmet special rule).",
      },
      {
        id: "black_dwarfs_skills_resource_hunter",
        name: "Resource Hunter",
        text: "This Chaos Dwarf is especially good at locating valuable resources. When rolling on the Exploration chart at the end of a game, the hero may modify one dice roll by +1/-1.",
      },
      {
        id: "black_dwarfs_skills_tyrant",
        name: "Tyrant",
        text: "This skill is for the Chaos Dwarf leader only. This Priest of Hashut is renowned for his tyranny. His word is absolute so his own warband fears his cruelty more then the enemy. When making a Rout test, and if led by a leader with this skill, the leader may inspire his warband to stick around. This skill allows the leader to re-roll any failed Rout test, as long as the leader is not knocked down or stunned. If re-rolled, the new result will apply even if the new result is worse. If the leader is taken out of action the warband must make an immediate Rout test.",
        restriction: "This skill is for the Chaos Dwarf leader only",
      },
      {
        id: "black_dwarfs_skills_true_grit",
        name: "True Grit",
        text: "Chaos Dwarfs are hardy individuals and this Hero is resolute, even for a Chaos Dwarf! When rolling on the Injury table for this Hero, a roll of 1-3 is treated as knocked down, 4-5 as stunned, and 6 as out of action.",
      },
    ],
    source: { publication: "Border Town Burning (PDF)", file: "warbands/grade-1c.md:281-294" },
  },
  {
    id: "bretonnian_chapel_guard_skills",
    name: "Bretonnian Skill Table",
    warbandId: "bretonnian_chapel_guard",
    intro: "Bretonnian Chapel Guard Knights may use the following Skill list instead of the standard skill lists available to them.",
    skills: [
      {
        id: "bretonnian_chapel_guard_skills_renowned_virtue",
        name: "Renowned Virtue",
        text: "The Knight may learn one Virtue from the original Bretonnian Warband list, written by Tom Merrigan. The \"Renowned Virtue\" skill may only be taken once.",
      },
      {
        id: "bretonnian_chapel_guard_skills_questing_vow",
        name: "Questing Vow",
        text: "Questing Knight only. If the knight is charging, charged by, or in combat with a fear-causing enemy, they may reroll any Leadership test they take once, accepting the second result. This includes Rout tests.",
        restriction: "Questing Knight only",
      },
      {
        id: "bretonnian_chapel_guard_skills_shield_bash",
        name: "Shield Bash",
        text: "Each turn, the Knight may make an additional attack with a shield or kite shield, which is made at -1 Strength. Treat the shield attack as a club.",
      },
      {
        id: "bretonnian_chapel_guard_skills_bulging_muscles",
        name: "Bulging Muscles",
        text: "The Knight retains the +1/+2 Strength bonus from Flails and Morning Stars after the first round of combat.",
      },
      {
        id: "bretonnian_chapel_guard_skills_untiring",
        name: "Untiring",
        text: "The Knight ignores movement penalties for wearing armour while on foot. In addition, strength, axes, critical hits, and similar modifiers cannot reduce the saving throw lower than 5+, nor will it be ignored by any non-magical means.",
      },
    ],
    source: { publication: "Fan made from the web (PDF). Editors: David \"StyrofoamKing\" Seidman-Joria and Malte Lund \"Master\" Adamson based on the Bretonnian Warband by Tom Merrigan, Formatting by Steven Young", file: "warbands/grade-1c.md:568-579" },
  },
  {
    id: "the_cursed_cavalcade_skills",
    name: "Cursed Cavalcade Skill Table",
    warbandId: "the_cursed_cavalcade",
    intro: "Cursed Cavalcade Heroes can use the list of skills below instead of the standard list.",
    skills: [
      {
        id: "the_cursed_cavalcade_skills_noblesse_obliges",
        name: "Noblesse Obliges",
        text: "The warrior feels utterly superior to his opponents, with long lineage and prestige to look down upon his common enemies, seen as nothing more than cattle to be slaughtered. The Warrior is immune to fear and can stomp opponents who are knocked down with is iron-shod boots. This gives them additional attack against Knocked down opponents at their own Strength.",
      },
      {
        id: "the_cursed_cavalcade_skills_torturer",
        name: "Torturer",
        text: "Having learned the craft of torture in the Ritual of the Comet, the warrior knows how to inflict maximum pain on the body and uses it in a sadistic and cruel way in combat. Any model successfully wounded (and not saved) in close combat by this Hero loses 1 point of Strength permanently for the duration of the battle as the pain from the wound causes agony. The effect is accumulative and can reduce the Strength of the target to a minimum of 1. The Undead are immune to this effect.",
      },
      {
        id: "the_cursed_cavalcade_skills_duelist",
        name: "Duelist",
        text: "The warrior is an expert in hand-to-hand combat method of the Imperial duelist, aristocrats famed for their skill in single combat. At the end of each Close Combat phase, the Duelist can force any non-large opponent he is fighting one-on-one to pass a Strength test or be pushed 2\" in any direction choosen by the Duelist. If this brings the target in contact with another model, both suffer an automatic Strength 2 hit. If this pushes the opponent off from a high place, then he falls and takes damage as normal. The duelist stays on the elevated area.",
      },
    ],
    source: { publication: "Tuomas Pirinen (PDF)", file: "warbands/grade-1c.md:1106-1113" },
  },
  {
    id: "maneaters_skills",
    name: "Maneaters Skill Table",
    warbandId: "maneaters",
    intro: "Ogres may choose to use the following skill list instead of the standard skill lists.",
    skills: [
      {
        id: "maneaters_skills_master_of_arms",
        name: "Master of Arms",
        text: "The Ogre learns how to use his size. He may now wield a Difficult to Use weapon and a hand weapon at the same time, but not two Difficult to Use weapons.",
      },
      {
        id: "maneaters_skills_crude_belch",
        name: "Crude Belch",
        text: "Ogres eat almost anything. Consequences are to be expected from those inconsiderate enough to consume a rich meal before battle. A Hero with this 'condition' may unleash his thunderous fumes on all enemies engaged in close combat. Those that do not pass a Ld test suffer a –1 'to hit' modifier for the turn. The Ogre must wait until a new enemy engages him in combat before he relieves himself again.",
      },
      {
        id: "maneaters_skills_maneater",
        name: "Maneater",
        text: "Ogres are not civilized of their own accord but it is proven they are prone to absorb foreign customs when travelling the world. Some eventually learn strange new skills before returning home to their tribes. This Ogre may immediately learn one skill from the Shooting or Academic skill lists. This skill may be taken only once and may not be taken by the Guide.",
        restriction: "This skill may be taken only once and may not be taken by the Guide",
      },
      {
        id: "maneaters_skills_bull_charge",
        name: "Bull Charge",
        text: "Ogres learn to use their vast bulk in a charge, trampling the enemy to the ground. When charging, an Ogre with this skill may attempt a single attack with a +1 'to hit' modifier rather than making his normal attacks. If successful the enemy model is automatically knocked down.",
      },
      {
        id: "maneaters_skills_dog_of_war",
        name: "Dog of War",
        text: "When an Ogre travels south he can find employment as a tavern bouncer. Some are enlisted by Paymasters to fight for Tilean City States. Drawing from experience gained during a stint on foreign soil, the band can now hire those Hired Swords available for Mercenaries. This skill may only be taken by the leader and if he dies all Hired Swords are removed from the warband.",
        restriction: "This skill may only be taken by the leader",
      },
      {
        id: "maneaters_skills_bellowing_roar",
        name: "Bellowing Roar",
        text: "An Ogre leader expects challenges to his authority. One of the best ways to suppress a mutineer in the ranks is to give his ear drums a good pounding. This skill may only be taken by the warband leader, allowing him to re-roll the first failed Rout test.",
        restriction: "This skill may only be taken by the warband leader",
      },
    ],
    source: { publication: "Border Town Burning (PDF)", file: "warbands/grade-1c.md:1704-1717" },
  },
  {
    id: "marauders_of_chaos_skills",
    name: "Marauder Skill Table",
    warbandId: "marauders_of_chaos",
    intro: "The Marauders of Chaos may use the following skill list instead of any of the standard skill lists.",
    skills: [
      {
        id: "marauders_of_chaos_skills_chosen_of_chaos",
        name: "Chosen of Chaos",
        text: "The Hero has been found worthy of his god's service and entered the rank of a Chaos Warrior. He uses the maximum profile for Warriors of Chaos and the Hero equipment list (if he does not already).",
      },
      {
        id: "marauders_of_chaos_skills_tattooed_body",
        name: "Tattooed Body",
        text: "Only the warband's leader may have this skill. The Hero's body is covered with unholy Chaos signs to attract his patron's attention. The Eye of the Gods special rule's effect (of becoming a Chaos Spawn or receiving a Mark) happens on a result of 10+ instead of 12+ only. Note that for the less favoured Norse leaders this is 11+.",
        restriction: "Only the warband's leader may have this skill",
      },
      {
        id: "marauders_of_chaos_skills_sweeping_blow",
        name: "Sweeping Blow",
        text: "Whenever the Hero takes an enemy model out of action using a double-handed weapon he may immediately make an additional attack against another model in base contact. Requires the Strongman skill.",
        restriction: "Requires the Strongman skill",
      },
      {
        id: "marauders_of_chaos_skills_mutant",
        name: "Mutant",
        text: "The Hero may buy one mutation. See the Mutations section of the Possessed on special rules. Heroes with the Mark of Onogal may choose a Blessing of Nurgle instead except the Mark of Nurgle. Note that unlike other skills Marauder Heroes may take this skill more than once.",
      },
      {
        id: "marauders_of_chaos_skills_heart_of_the_warrior",
        name: "Heart of the Warrior",
        text: "Only the warband's leader may have this skill. He may re-roll any failed Rout test and is immune to fear and all alone tests.",
        restriction: "Only the warband's leader may have this skill",
      },
    ],
    source: { publication: "Border Town Burning (PDF)", file: "warbands/grade-1c.md:1991-2002" },
  },
  {
    id: "merchant_caravans_skills",
    name: "Merchant Caravan Skill Table",
    warbandId: "merchant_caravans",
    intro: "Merchants may choose to use the following skill list instead of the standard skill lists.",
    skills: [
      {
        id: "merchant_caravans_skills_bribery",
        name: "Bribery",
        text: "Whenever the warband has to take a Rout test, the Merchant may talk his hirelings into staying a little longer and face the danger. He may immediately pay 5 gc per non-Hero warband member (including Hired Swords!) still in the game. If he does, one member taken out of action already does not count for Rout tests. If after that, a Rout test is still required, test as normal. This skill may be used as many times as required so long as the coffers aren't empty!",
      },
      {
        id: "merchant_caravans_skills_dubious_income",
        name: "Dubious Income",
        text: "The Merchant has set up an underground business that proves to be quite profitable. After every battle in which the Merchant was not taken out of action, he may choose to use this skill before the trading phase (i.e. before any gold is spent). If he does, he must pass a Ld test. If the test is successful, the warband receives one gold coin per Experience point the Merchant has. If the test is failed, the warband loses up to the same amount of gold coins.",
      },
      {
        id: "merchant_caravans_skills_wholesale",
        name: "Wholesale",
        text: "The Merchant is known for buying items in greater numbers and so is especially welcome at the other merchants. He may search for D3+1 rare items after each battle instead of one item only (if he was not taken out of action, of course!).",
      },
      {
        id: "merchant_caravans_skills_deal_breaker",
        name: "Deal Breaker",
        text: "When trying to sell items through the Trade special rule, the Merchant gets a +1 bonus on the roll to see what the item would fetch.",
      },
      {
        id: "merchant_caravans_skills_connected",
        name: "Connected",
        text: "The Merchant knows many retailers and ways of getting hold of rare items. Instead of searching for rare items as normal, he may visit the local black market and its fencers. If he does, he may search for items from the following table, applying the normal rules.\n\n| Item | Cost | Availability | Source |\n|---|---|---|---|\n| Dispel Scroll | 50 + 4D6 gc | Rare 12 | see Mordheim Annual 2002, p. 31 |\n| Lesser Artefact | 200 + D6x15 gc | Rare 16 | roll on the Lesser Artefacts table |\n| Magical Artefact | 350 + D6x25 gc | Rare 18 | roll on the Magical Artefact Table from the Mordheim rulebook, p. 141 |\n| Magical Scroll | 100 gc | Rare 14 | roll on the Magical Scroll Artefact table |\n\nNote that though the Merchant may buy items using the table above he can never sell them back again (and must hope for other players to be interested in them).",
      },
    ],
    source: { publication: "Border Town Burning (PDF)", file: "warbands/grade-1c.md:2295-2315" },
  },
  {
    id: "night_goblins_skills",
    name: "Night Goblin Skill Table",
    warbandId: "night_goblins",
    intro: "Night Goblin Heroes may use the following Skill list instead of any of the standard Skill lists available to them.",
    skills: [
      {
        id: "night_goblins_skills_ded_shooty",
        name: "Ded Shooty",
        text: "The clever little git adds +6\" to the range of any missile weapons he uses (not including nets).",
      },
      {
        id: "night_goblins_skills_sneaky_git",
        name: "Sneaky Git",
        text: "The greenskin is so sneaky that he can move D3 of his warband members after all other deployment is complete. Night Goblin Big Boss only.",
        restriction: "Night Goblin Big Boss only",
      },
      {
        id: "night_goblins_skills_infiltrate",
        name: "Infiltrate",
        text: "A Night Goblin with this skill is always placed on the battlefield after the opposing warband and can be placed anywhere on the table as long as it is out of sight of the opposing warband and more than 12\" away from any enemy model. If both players have models which infiltrate, roll a D6 for each, and the lowest roll sets up first.",
      },
      {
        id: "night_goblins_skills_netter",
        name: "Netter",
        text: "The goblin is adept at using a net to disable his enemies. They learn their skill hunting wild cave squigs in the depths of the mountains. The technique he has mastered is 'chuck and charge'. The goblin may declare that he is making a net charge. He throws the net at a target in the same way as described in the Mordheim rulebook. If he hits and the target fails to escape the net then target counts as knocked down and the goblin completes his charge. If he misses or the target escapes then the goblin makes a failed charge. If the failed charge would take him into base contact then stop him 1\" away. A warrior who is caught in a net will be automatically hit in combat. The goblin must still roll to wound just as with a knocked down enemy. In the warrior's next recovery phase, unless he is stunned or out of action he will cut himself out of the net but cannot do anything else and will go last in combat just as if he had stood up from being knocked down.",
      },
    ],
    source: { publication: "Mordheimer's Information Centre (PDF), Author: Terry Maltman", file: "warbands/grade-1c.md:2594-2603" },
  },
  {
    id: "night_goblins_web_skills",
    name: "Night Goblin Skill Table",
    warbandId: "night_goblins_web",
    intro: "*Promoted Henchmen may never choose Strength as one of their skill sets.",
    skills: [
      {
        id: "night_goblins_web_skills_fungus_farmer",
        name: "Fungus Farmer",
        text: "The industrious little git has a mushroom crop back at the cave. If the Hero doesn't search for rare items, it may pick D3-1 Mad Cap Mushrooms instead. There is a chance of getting none, as there is no guarantee they will be ready for harvest. Each Mad Cap Mushroom must be used in the next battle, and they cannot be sold or traded to other warbands — these are a special high yield/low shelf life crop.",
      },
      {
        id: "night_goblins_web_skills_hide_in_shadows",
        name: "Hide in Shadows",
        text: "The sneaky Goblin has become an expert at concealing themselves from enemies (and potential victims!). An enemy warrior attempting to detect this warrior when it is Hidden must halve their Initiative (round up) before measuring the distance.",
      },
      {
        id: "night_goblins_web_skills_infiltrate",
        name: "Infiltrate",
        text: "A Night Goblin with this skill is always placed on the battlefield after the opposing warband and can be placed anywhere on the table as long as it is out of sight of the opposing warband, and more than 12\" away from any enemy model. If both players have models which infiltrate, roll a D6 for each, and the lowest roll sets up first.",
      },
      {
        id: "night_goblins_web_skills_netter",
        name: "Netter",
        text: "The Goblin applies techniques learned hunting wild Cave Squigs in the depths of the mountains to disable charging enemies. Instead of their normal use, the Goblin may throw a Net they are equipped with at an enemy who is charging them. This will reduce the charge range of the attacker by D6 inches as the charger either slows down to avoid the net, or gets tangled up in it. If this means that the attacker cannot reach the Goblin then it is a failed charge. Regardless of the outcome the Net is lost when this skill is used.",
      },
      {
        id: "night_goblins_web_skills_ride_squig",
        name: "Ride Squig",
        text: "This Goblin can ride one of the warband's Cave Squigs, or even a Great Squig! The pair deploy as a single model. Standard mount rules are not used, although the rider counts as being mounted for the Cavalry Bonus rule (see spears and lances). While the Squig is being ridden, it and the rider move as a single model using the Squig's movement rules, but attack separately in Close Combat. In this skill's text, the use of \"Squig\" refers to both Cave Squigs and Great Squigs. Any shooting or close combat attacks will hit the rider on a D6 roll of 1-2, and the Squig on a 3-6. If the Squig is stunned or taken out of action, the rider takes a Strength 2 hit with no Armour save as they crash to the ground. If the Rider is stunned or taken out of action, the Squig reverts to normal Squig behavior. In either case the rider is now dismounted for the rest of the battle. Squigs don't like being ridden. If the movement roll results in a double or triple, the rider must roll a D6 before the Squig moves. If the result is over the rider's Strength, they are thrown off before the Squig moves away, and take a Strength 2 hit with no Armour save as they crash to the ground. The rider is now dismounted for the rest of the battle. If the roll is equal to or below their Strength, the rider keeps their grip and remains atop the Squig.",
      },
      {
        id: "night_goblins_web_skills_sneaky_git",
        name: "Sneaky Git",
        text: "The Goblin specializes in attacking their targets from the shadows. They may charge an opponent from hiding, even if they cannot see the target. There is no need for an initiative test, and the target may be over the normal 4” limit for charging unseen targets. If the charge is successful, the Goblin surprises their opponent who will attack at half Weapon Skill and half Initiative, rounded up. This penalty lasts for the first round of combat only, as the opponent will swiftly recover their wits if the initial assault is survived.",
      },
    ],
    source: { publication: "Fan made from the web (PDF)", file: "warbands/grade-1c.md:2869-2882" },
  },
  {
    id: "night_goblins_web_squig_herder_skills",
    name: "Squig Herder Skills",
    warbandId: "night_goblins_web",
    intro: "(Squig Herders may choose from the following list when they gain a skill, as well as any of the standard Skills available to them)",
    skills: [
      {
        id: "night_goblins_web_squig_herder_skills_gassy_squigs",
        name: "Gassy Squigs",
        text: "The Squig Herder is feeding the warband's Squigs a blend of rotten fungus, flint, and sharp pebbles for shrapnel. When any untrained Cave Squig goes out of action, instead of rolling a D6 recovery roll after the battle, roll immediately. On a 1-2 it explodes, hitting all models in D6” with a strength 3 hit. That Squig is now DEAD!",
        restriction: "Squig Herders only",
      },
      {
        id: "night_goblins_web_squig_herder_skills_threaten",
        name: "Threaten",
        text: "During the Movement Phase, all Cave Squigs and Great Squigs in 6” (12” with a Squig Prodder) of the Squig Herder may re-roll their movement dice.",
        restriction: "Squig Herders only",
      },
      {
        id: "night_goblins_web_squig_herder_skills_trainin",
        name: "Trainin'",
        text: "The Squig Herder may train one particularly intelligent and vicious Squig to be their personal guard. The next single Cave Squig purchased will gain experience like normal, rolling on the Henchmen Advance Table while rerolling \"Lad's Got Talent\". If the Squig Herder dies the Trained Squig is removed from the warband. If the Trained Squig dies a new one can be purchased. There will only ever be one Trained Cave Squig in a warband, and it still counts towards the maximum number of Cave Squigs. Because of the special attention (kicks, prods) the herder gives the Trained Squig, it will only ever die on a roll of a 1 after going out of action. In return for this lavished attention, the Trained Squig will defend its fallen master fiercely. If the Squig Herder is taken out of action, and the Trained Squig has not gone wild, it will guard the Herder; remove the Trained Squig from the table but treat all \"Sold to the Pits\", \"Captured\", and \"Robbed\" results on the Serious Injuries Chart for the Squig Herder as a \"Full Recovery.\"",
        restriction: "Squig Herders only",
      },
    ],
    source: { publication: "Fan made from the web (PDF)", file: "warbands/grade-1c.md:3057-3063" },
  },
  {
    id: "the_restless_dead_skills",
    name: "Restless Dead Skill Table",
    warbandId: "the_restless_dead",
    intro: "Liches and Necromancers may choose to use the following skill list instead of any of the standard Skill tables available to them.",
    skills: [
      {
        id: "the_restless_dead_skills_corpse_bomb",
        name: "Corpse Bomb",
        text: "Special magics and rituals can cause a Zombie to explode when they are near the enemy. Secretly nominate one Zombie at the beginning of the battle to be a Corpse Bomb. If the enemy charges or is charged by the Zombie, it immediately detonates. All models within D6 inches take D3 Strength 4 hits. The detonated Zombie may never be used again as it is splattered in a million pieces! Corpse bombs killed by shooting do not detonate. Only one Zombie at a time can be a corpse bomb although the skill can be taken by both the Necromancer and the Liche.",
      },
      {
        id: "the_restless_dead_skills_deathspeaker",
        name: "Deathspeaker",
        text: "At the start of the battle, the undead player may deploy D3 Zombies for free. These zombies do not count towards the maximum number of models in the warband, but increase the warband's rating as normal. Zombies created in this way may not be used as Corpse Bombs. These Zombies only last for the duration of the battle.",
      },
      {
        id: "the_restless_dead_skills_wraith_touch",
        name: "Wraith Touch",
        text: "The hero may make a Wraith Touch attack instead of their normal attacks in close combat. The hero making a Wraith Touch makes a single unarmed attack, if it hits, it wounds automatically, all rules that apply to unarmed attacks apply to the Wraith Touch. If a Liche uses this skill and wounds, then he may regain one lost wound. This may not take the hero beyond his starting total. Necromancers do not regain wounds with this skill. This skill has no effect on the Possessed or Undead.",
      },
      {
        id: "the_restless_dead_skills_forbidden_rite",
        name: "Forbidden Rite",
        text: "If the hero with this skill did not search for rare items during their last exploration phase, then they start the next battle with a pool of D3+1 (+1) modifiers they can use to increase their casting rolls. They may use as many of these modifiers at a time as they desire.",
      },
      {
        id: "the_restless_dead_skills_summoner",
        name: "Summoner",
        text: "The maximum warband size is increased by 1.",
      },
    ],
    source: { publication: "Border Town Burning (PDF)", file: "warbands/grade-1c.md:3262-3273" },
  },
  {
    id: "the_sons_of_hashut_skills",
    name: "Chaos Dwarf Skill Table",
    warbandId: "the_sons_of_hashut",
    skills: [
      {
        id: "the_sons_of_hashut_skills_true_grit",
        name: "True Grit",
        text: "A result of 1-3 indicates that the miniature is knocked down, a result of 4-5 indicates that it is stunned, and a result of 6 indicates that it is out of action.",
      },
      {
        id: "the_sons_of_hashut_skills_extra_tough",
        name: "Extra Tough",
        text: "Allows re-rolls for Serious Injuries after the game is over. The second result is the prevailing result.",
      },
      {
        id: "the_sons_of_hashut_skills_unlimited_hatred",
        name: "Unlimited Hatred",
        text: "The warrior suffers hatred against everyone.",
      },
      {
        id: "the_sons_of_hashut_skills_thick_skull",
        name: "Thick Skull",
        text: "The Hero has a thick skull, even for a Dwarf. He has a 3+ save on a D6 to avoid being stunned. If the save is made, treat a stunned result as knocked down instead. If the Dwarf also wears a helmet, this save is 2+ instead of 3+ (this takes the place of the normal Helmet special rule).",
      },
    ],
    source: { publication: "By GW Troll Magazine (Spain) (PDF). Editors: Hernán \"Moska\" Garcia & Dave \"StyrofoamKing\" Seidman-Joria", file: "warbands/grade-1c.md:3537-3544" },
  },
  {
    id: "dreamwalkers_cult_of_morr_skills",
    name: "Dreamwalkers Skill Table",
    warbandId: "dreamwalkers_cult_of_morr",
    intro: "Dreamwalkers Heroes with access to Special Skills may use the following list:",
    skills: [
      {
        id: "dreamwalkers_cult_of_morr_skills_inspiring_presence",
        name: "Inspiring Presence",
        text: "When a Dreamer proves to be a brave leader and truly chosen of Morr, his followers will follow their dreamer to death with unwavering courage. To represent this, Morr Worshwishpers can use the dreamer's lead if they are 12\" away instead of the usual 6\". (Only for Dreamer).",
        restriction: "Only for Dreamer",
      },
      {
        id: "dreamwalkers_cult_of_morr_skills_fanatical",
        name: "Fanatical",
        text: "The dreamwalkers are convinced that they are the chosen ones to carry out Morr's will and eradicate the necromantic plague of the old world. Once per game, if the Dreamer is not out of action, stunned or knocked down, you may re-roll a failed rout test. (Only for Dreamer).",
        restriction: "Only for Dreamer",
      },
      {
        id: "dreamwalkers_cult_of_morr_skills_inured_to_horror",
        name: "Inured to Horror",
        text: "Only the true faithful followers of Morr know and accept death and become inured to horror. The model is immune to Fear, and need never take All Alone tests.",
      },
      {
        id: "dreamwalkers_cult_of_morr_skills_blessed_by_morr",
        name: "Blessed by Morr",
        text: "The hero has been blessed by Morr and has his protection against the magic that his enemies cast against him. Any spell that could affect the model is nullified with a D6 roll of +4 when fighting the undead. Note that if the spell is nullified, it does not affect this model, but it does affect any other model as it normally would.",
      },
    ],
    source: { publication: "Mordheim Facebook Group (PDF)", file: "warbands/grade-2a-part1.md:61-70" },
  },
  {
    id: "druchii_skills",
    name: "Druchii Skill Table",
    warbandId: "druchii",
    intro: "Druchii Heroes may use the following Special Skills in addition to any normally available to them:",
    skills: [
      {
        id: "druchii_skills_frenzied_charge",
        name: "Frenzied Charge",
        text: "The Dark Elf is infused with an intense raging thirst for blood and is a whirlwind in hand-to-hand combat, moving from opponent to opponent. The Druchii may make a 4\" follow up move if they take all of their opponents out of action. If the elf comes into contact with another enemy, this starts a new combat. This new combat takes place in the following turn and the model counts as charging.",
      },
      {
        id: "druchii_skills_fey_quickness",
        name: "Fey Quickness",
        text: "Few can ever hope to match an Elf's inhuman quickness and agility. An Elf with Fey Quickness can avoid melee or missile attacks on a roll of 6. If the Elf also has Step Aside or Dodge, this will increase to a 4+ in the relevant area. For example, an Elf with Fey Quickness and Step Aside avoids melee attacks on a 4+ and missile attacks on a 6.",
      },
      {
        id: "druchii_skills_infiltration",
        name: "Infiltration",
        text: "The Dark Elf can Infiltrate. This skill is identical to the Skaven skill.",
      },
      {
        id: "druchii_skills_poisoner",
        name: "Poisoner",
        text: "The Dark Elf is proficient in concocting different poisons. If the Hero doesn't search for rare items, he may make D2 doses of Dark Venom instead. The poison must be used in the next battle and cannot be sold or traded to other warbands as the Dark Elves guard their secrets very carefully.",
      },
      {
        id: "druchii_skills_marksman_of_naggaroth",
        name: "Marksman of Naggaroth",
        text: "Eyes of this hero are so keen and hands so steady that he can completely omit the penalty for long range if using a crossbow type weapon. Further, if he did not move this turn, he can shoot from repeater crossbow twice per turn without penalty or three times per turn with -1 penalty to hit.",
      },
      {
        id: "druchii_skills_will_to_survive",
        name: "Will to Survive",
        text: "Naggaroth is a harsh land with harsh inhabitants and weaklings are shown no mercy. This elf is able to survive by pure strength of will. If the model gets out of action and result of the Serious Injuries roll is death, make a Leadership test against unmodified Ld of the model (no holy relics etc.). If you succeed, the model will survive but will miss D3 battles instead.",
      },
      {
        id: "druchii_skills_keen_sight",
        name: "Keen Sight",
        text: "There are numerous legends detailing the excellent eyesight of the Elves, both Druchii and Asur kin. This elf can spot Hidden enemies from twice as far away than normal warriors (i.e. twice his Initiative value in inches).",
      },
    ],
    source: { publication: "Druchii.net (PDF)", file: "warbands/grade-2a-part1.md:343-358" },
  },
  {
    id: "dwarf_slayer_cult_skills",
    name: "Dwarf Slayer Cult Skill Table",
    warbandId: "dwarf_slayer_cult",
    skills: [
      {
        id: "dwarf_slayer_cult_skills_deathwish",
        name: "Deathwish",
        text: "The hero is completely immune to all psychology and never need to test if fighting alone. [Stubbles and Axe Hurlers Only. See 'Stubbles' and \"Axe Hurlers\" for details.] Slayers Only",
        restriction: "Slayers Only",
      },
      {
        id: "dwarf_slayer_cult_skills_ferocious_charge",
        name: "Ferocious Charge",
        text: "The Slayer may double his attacks on the turn in which he charges. He will suffer a -1 'to hit' penalty on that turn. Slayers Only",
        restriction: "Slayers Only",
      },
      {
        id: "dwarf_slayer_cult_skills_monster_slayer",
        name: "Monster Slayer",
        text: "In close combat, the Slayer always wounds any opponent on a roll of 4+, regardless of Toughness, unless his own Strength (after all modifiers due to weapon bonuses, etc) would mean that a lower roll than this is needed. Slayers Only.",
        restriction: "Slayers Only",
      },
      {
        id: "dwarf_slayer_cult_skills_berserker",
        name: "Berserker",
        text: "The Slayer may add +1 to his close combat 'to hit' rolls during the turn in which he charges. Slayers Only.",
        restriction: "Slayers Only",
      },
      {
        id: "dwarf_slayer_cult_skills_deathblow",
        name: "Deathblow",
        text: "If the Hero is taken out of action in hand-to-hand, he may immediately make the remainder of his attacks before being removed, if he hasn't made all of his attacks already this turn. He may use this skill if he is knocked down or stunned. Slayers Only.",
        restriction: "Slayers Only",
      },
      {
        id: "dwarf_slayer_cult_skills_relentless",
        name: "Relentless",
        text: "If the Hero charges a model but the charge fails, the Hero may still move the full distance of his move. This skill may only be used against enemies within sight or that the Slayer can detect. Slayers Only.",
        restriction: "Slayers Only",
      },
      {
        id: "dwarf_slayer_cult_skills_axe_mastery",
        name: "Axe Mastery",
        text: "The Hero is well taught in the hand-to-hand arts of axemanship. He may reroll all missed attacks if he was using an axe or a dwarven axe in the hand-to-hand phase of the turn that he charges. May not be used with Whirling Blades.",
      },
      {
        id: "dwarf_slayer_cult_skills_true_grit",
        name: "True Grit",
        text: "Dwarfs are hardy individuals and this Hero is hardy even for a Dwarf! When rolling on the Injury table for this Hero, a roll of 1-3 is treated as knocked down, 4-5 as stunned, and 6 as out of action.",
      },
      {
        id: "dwarf_slayer_cult_skills_thick_skull",
        name: "Thick Skull",
        text: "The Hero has a thick skull, even for a Dwarf. He has a 3+ save on a D6 to avoid being stunned. If the save is made, treat a stunned result as knocked down instead.",
      },
      {
        id: "dwarf_slayer_cult_skills_songster",
        name: "Songster",
        text: "A Bard's rousing war songs steel the hearts of all those around him. Any friendly model within 6\" of a Bard may re-roll any failed Leadership test with a +1 to Leadership, to a max of 10. This includes rout tests. Rememberer only.",
        restriction: "Rememberer only",
      },
      {
        id: "dwarf_slayer_cult_skills_song_of_honor",
        name: "Song of Honor",
        text: "In the postgame, if one or more Slayers in your warband died, all heroes and henchmen gain +1 Experience. Rememberer only.",
        restriction: "Rememberer only",
      },
    ],
    source: { publication: "By Dave 'Styrofoam King' Joria, based on Mark Havener's Dwarf Treasure Hunters (PDF) · Version: V5.0", file: "warbands/grade-2a-part1.md:717-738" },
  },
  {
    id: "grave_robbers_skills",
    name: "Grave Robber Skill Table",
    warbandId: "grave_robbers",
    intro: "Grave Robber Heroes with access to Special skills may choose from the following list instead of any standard skill tables.",
    skills: [
      {
        id: "grave_robbers_skills_darkstalker",
        name: "Darkstalker",
        text: "The warrior is accustomed to darkness and has almost cat-like sight. Ignores All Alone tests and may double his Initiative when looking for Hidden models.",
      },
      {
        id: "grave_robbers_skills_instinctual_violence",
        name: "Instinctual Violence",
        text: "Having experienced countless encounters with the Undead, this warrior is hardened to terror. When charged by any Undead models, he does not have to take a Fear test. Additionally, he may nominate one of his attacks to Strike First.",
      },
      {
        id: "grave_robbers_skills_de_animator",
        name: "De-animator",
        text: "The warrior is adept at fighting animated corpses. He ignores the No Pain rule for Undead and may stun them as normal.",
      },
      {
        id: "grave_robbers_skills_hardy_constitution",
        name: "Hardy Constitution",
        text: "Veteran of many grave-robbing escapades, the warrior is completely immune to all diseases and poisons.",
      },
      {
        id: "grave_robbers_skills_body_dealer",
        name: "Body Dealer",
        text: "This warrior is skilled at salvaging the bodies of the dead for profit. On a 4+, you may recover the body (and gear) of a friendly model slain in the Serious Injury phase. You may also attempt to do the same for enemy models by comparing Initiative rolls between the Body Dealer and enemy leader (or their most experienced model). On a tie, nothing is recovered; if the enemy wins, your Body Dealer is captured.",
      },
    ],
    source: { publication: "Angelic Gobbo (Pawel), with help from Brahm Tazoul and MordainThade (PDF)", file: "warbands/grade-2a-part1.md:1022-1033" },
  },
  {
    id: "halflings_skills",
    name: "Halfling Skill Table",
    warbandId: "halflings",
    intro: "All Halflings may choose from the following special skills.",
    skills: [
      {
        id: "halflings_skills_quiet_as_a_mouse",
        name: "Quiet as a Mouse",
        text: "The halfling as adept at staying as quiet as a mouse whilst hiding. Enemy warriors must use half their initiative value in inches (rounded down) when trying to detect this hidden halfling.",
      },
      {
        id: "halflings_skills_crude_belch",
        name: "Crude Belch",
        text: "Having eaten a meal or six, this halfling may release a withering belch to distract his enemies. During the first round of hand to hand combat the halfling can release his noxious fumes upon all enemies within base contact. All enemies effected must take a leadership test. If the leadership test is failed then the putrid odor has severely affected the warrior's fighting ability and he must miss his first attack (regardless of whether he has only one attack or not).",
      },
      {
        id: "halflings_skills_wizened_halfling",
        name: "Wizened Halfling",
        text: "This old halfling is greatly respected by the other members of the warband and they never question his word. All halflings may also re-roll any failed leadership test when within 6\" of the leader as well as using his leadership for both tests.",
        restriction: "leaders only",
      },
      {
        id: "halflings_skills_stealthy",
        name: "Stealthy",
        text: "The Halfling Thief can hide even after running, and can run while within 8\" of enemy models if he starts and ends his move hidden.",
        restriction: "halfling thieves only",
      },
      {
        id: "halflings_skills_skilled_huntsman",
        name: "Skilled Huntsman",
        text: "The halfling has been hunting things ever since he was young (the more food he has, the better!) and has become well adapted to firing as silently and discreetly as possible. To represent this a Halfling may try and fire a ranged weapon and remain hidden.\n\nWhen shooting from hiding roll D6. On a 3+ the Halfling has managed to keep his actions inconspicuous to the eye of the enemy and may remain hidden that turn. Note this skill may not be combined with black powder weapons, they are just too noisy!",
      },
      {
        id: "halflings_skills_layers_of_fat",
        name: "Layers of Fat",
        text: "The Halfling has gained mountains of flab during his vast experience of eating fine foods and his thick bulk could swallow a sword whole!\n\nThe Halfling always has a basic saving throw of 6 regardless of the enemy warrior's strength and on top of any armour he already wears.",
      },
      {
        id: "halflings_skills_shifty",
        name: "Shifty",
        text: "The halfling has long-been skirting in the shadows, avoiding unwanted attention. So nimble is he that he may surprise even those who believe they've got them dead-to-rights. The halfling gains a bonus attack when charged that strikes first.",
      },
    ],
    source: { publication: "PDF", file: "warbands/grade-2a-part1.md:1241-1260" },
  },
  {
    id: "masters_of_horror_skills",
    name: "Masters of Horror Skill Table",
    warbandId: "masters_of_horror",
    intro: "The following skill list may be used by the Mad Scientist instead of the standard skill lists. Lunatic is available to all Heroes.",
    skills: [
      {
        id: "masters_of_horror_skills_surgeon",
        name: "Surgeon",
        text: "The Mad Scientist can attempt to operate upon an injured minion. Reroll one dice of a single injury roll. You must accept the second roll.",
      },
      {
        id: "masters_of_horror_skills_alchemist",
        name: "Alchemist",
        text: "The Mad Scientist fancies himself an alchemist and brews all sorts of concoctions and potions to guzzle down prior to battle.\n\nRoll a D6 at game-start and consult the following table:\n\n| D6 | Potion | Effect |\n|---|---|---|\n| 1 | Potion of Resilience | Add +1 to Toughness for duration of game. |\n| 2 | Brew of Strength | Add +1 to Strength for duration of game. |\n| 3–4 | Quicksilver | Add +1 to Movement for duration of game. |\n| 5 | Backley's Brew | Remove -1 from both Strength and Initiative until a Toughness test is passed. |\n| 6 | Aberrantius Vigortia | Adds +1 to both Strength and Toughness. Highly addictive. Roll D6 after battle. On 5+, Scientist becomes addicted and will not engage in any other activity during a game until he has had his Aberrantius Vigortia potion. He will stand and brew potions until a 6 is rolled |",
      },
      {
        id: "masters_of_horror_skills_apt_revitalist",
        name: "Apt Revitalist",
        text: "The Mad Scientist has gone above and beyond the understanding of most men, and has gained the ability to recreate life from death. Simply animating meat-puppets who parody life has bored him; he has moved on to reanimating dead cells. Any zombies within the warband now gain exp as normal human henchmen.",
      },
      {
        id: "masters_of_horror_skills_lunatic",
        name: "Lunatic",
        text: "Giving in to ones insanity is quite rewarding. The model causes Fear and may reroll any Leadership Test.",
      },
    ],
    source: { publication: "(PDF)", file: "warbands/grade-2a-part1.md:1523-1542" },
  },
  {
    id: "necrarchs_the_soul_stealers_skills",
    name: "Necrarch Skill Table",
    warbandId: "necrarchs_the_soul_stealers",
    intro: "Necrarch Vampire and Thrall Heroes with access to Special Skills may use the following list:",
    skills: [
      {
        id: "necrarchs_the_soul_stealers_skills_pupil_of_nagash",
        name: "Pupil of Nagash",
        text: "Delving further into the evil teachings of Nagash, the Necrarch Vampire brings greater darkness to the realm of the living. He may roll immediately on the Scrolls of Nagash for a spell, and choose to do so again instead of a future Skill.",
      },
      {
        id: "necrarchs_the_soul_stealers_skills_master_of_the_black_arts",
        name: "Master of the Black Arts",
        text: "Such is the power of the Necrarch that the range of all his magical workings is extended by half-again.",
      },
      {
        id: "necrarchs_the_soul_stealers_skills_pull_of_undeath",
        name: "Pull of Undeath",
        text: "So strong is the center of undeath within the Necrarch that he may save his constructs around him from their demise. As long as the Necrarch is within 4 inches of an undead henchman, they may only be taken Out of Action on a roll of a natural 6. Available only to the Leader.",
        restriction: "Available only to the Leader",
      },
    ],
    source: { publication: "PDF", file: "warbands/grade-2a-part1.md:2109-2116" },
  },
  {
    id: "nipponese_expedition_skills",
    name: "Nippon Skill Table",
    warbandId: "nipponese_expedition",
    intro: "Nippon Warband members may choose to use the following skill list instead of the standard skill lists.",
    skills: [
      {
        id: "nipponese_expedition_skills_death_before_dishonor",
        name: "Death Before Dishonor",
        text: "Defiance echoes through the ruins as a Nipponese warrior stares into the abyss of defeat. Once per grim engagement, when fate decrees their demise in the swirling melee, they unleash a final barrage of strikes before the void claims them. If these last, desperate blows fell an adversary, the warrior defies death's grasp, standing amidst the carnage with but a single thread of life remaining.\n\nIf this model would be removed from the battlefield as the result of a close combat attack, before removing it make a single close combat attack with them as normal.",
      },
      {
        id: "nipponese_expedition_skills_night_fighter",
        name: "Night Fighter",
        text: "Stealth is their ally, the cloak of darkness their refuge. Skulking amidst the rubble, this shadow-clad warrior remains unseen, a specter haunting the twilight. Beyond the reach of distant foes, concealed behind shattered remnants of once-majestic edifices, they evade the enemy's gaze, a predator in the gloom.\n\nThis Skill may only be taken by the Shinobi. This model is able to run while remaining hidden, as per hiding rules",
        restriction: "This Skill may only be taken by the Shinobi",
      },
      {
        id: "nipponese_expedition_skills_iaijutsu",
        name: "Iaijutsu",
        text: "Swift as the striking serpent, the Nipponese warrior answers the call to arms with deadly precision. When the enemy's charge shatters the silence, they retaliate with a lightning-quick strike, their blade singing the song of vengeance. In that fleeting moment, the strike-first rule bends to their will, delivering swift retribution to those who dare to assail them.\n\nWhen this model is charged they gain +1A that they may only use against the charger. This additional attack will 'strike first'. If the wielder is simultaneously charged by two or more opponents they will still only receive a total of +1A. These attacks are resolved at the Strength value of the model, with no further modifiers.",
      },
      {
        id: "nipponese_expedition_skills_last_stand",
        name: "Last Stand",
        text: "Alone they stand, surrounded by the whispers of the fallen and the specters of despair. Yet, in the face of overwhelming odds, the spirit of the Nipponese warrior remains unbroken. When the tempest of fear threatens to engulf them, they steel themselves against its icy grip. The solitary warrior defies the darkness, their resolve unyielding, bolstered by the ghosts of fallen comrades.\n\nIf this model would normally take an all-alone test, it may be re-rolled, in addition, at the start of this models turn, if it is 6\" away from friendly models, it can choose to have +1 to WS or BS until the start of its next turn.",
      },
      {
        id: "nipponese_expedition_skills_tea_ceremony",
        name: "Tea Ceremony",
        text: "Amidst the ruins, this warrior's serene rituals grant solace and insight. Forgoing treasure, they invest in reflection, seeking growth with a calming cup.\n\nAfter a battle, if this hero survives and did not go out of action, they can forgo searching for rare items and spends 10 gold crowns representing the cost of preparations for the tea ceremony. Then, Choose any other hero, and roll a D6. on a 3+, the chosen hero gains an Experience point from the introspective nature of the ceremony.",
      },
      {
        id: "nipponese_expedition_skills_blessed_by_the_kami",
        name: "Blessed by the Kami",
        text: "In the crucible of war, the favor of the divine grants protection to the faithful. Blessed by unseen forces, the Nipponese warrior defies the jaws of death itself. With the whispered blessings of the Kami, they rise from the brink of oblivion, their wounds miraculously mended, their spirit unbroken by the ravages of fate.\n\nWhen rolling on the Heroes Serious Injury chart for this Hero after a game in which he has been taken out of action, the dice may be re-rolled once. The result of this second dice roll must be accepted, even if it is a worse result.",
      },
    ],
    source: { publication: "PDF, Author: Krakatoa (SoCal Mordheim)", file: "warbands/grade-2a-part1.md:2437-2462" },
  },
  {
    id: "ogre_hunting_party_skills",
    name: "Ogre Hunting Party Skill Table",
    warbandId: "ogre_hunting_party",
    skills: [
      {
        id: "ogre_hunting_party_skills_crude_belch",
        name: "Crude Belch",
        text: "Ogres and Gnoblars eat almost anything. Consequences are to be expected from those inconsiderate enough to consume a rich meal before battle. A Hero with this 'condition' may unleash his noxious fumes on all enemies engaged in close combat. Those that do not pass a Ld test suffer a –1 'to hit' modifier for the turn. The Hero must wait until a new enemy engages him in combat before he relieves himself again.",
      },
      {
        id: "ogre_hunting_party_skills_scent_hound",
        name: "Scent Hound",
        text: "The Ogre or Gnoblar has the keen nose of an expert tracker. The hero spots Hidden enemies from two times as far away as other warriors (ie, twice his Initiative value in inches).",
      },
      {
        id: "ogre_hunting_party_skills_sabre_trainer",
        name: "Sabre Trainer",
        text: "Whenever a Sabretusk cub rolls a 1 for Untamed, if it started the turn within 6\" of this hero, you may move the cub 3D6\" towards any model within 12\" of it that it can see (instead of towards the nearest model).",
      },
      {
        id: "ogre_hunting_party_skills_maneater",
        name: "Maneater",
        text: "Ogre Hunters shun the companies of others, but they do travel far and wide, observing other the customs and skills of other cultures from afar. This Ogre may immediately learn one skill from the Shooting or Academic skill lists. This skill may be taken only once. Ogres only.",
        restriction: "Ogres only",
      },
      {
        id: "ogre_hunting_party_skills_bull_charge",
        name: "Bull Charge",
        text: "Ogres learn to use their vast bulk in a charge, trampling the enemy to the ground. When charging, an Ogre with this skill may attempt a single attack with a +1 'to hit' modifier rather than making his normal attacks. If successful the enemy model is automatically knocked down. Ogres only.",
        restriction: "Ogres only",
      },
      {
        id: "ogre_hunting_party_skills_bellowing_roar",
        name: "Bellowing Roar",
        text: "An Ogre leader expects challenges to his authority. One of the best ways to suppress a mutineer in the ranks is to give his ear drums a good pounding. This skill may only be taken by the warband leader, allowing him to reroll the first failed Rout test. Ogres only.",
        restriction: "Leader only",
      },
      {
        id: "ogre_hunting_party_skills_set_traps",
        name: "Set Traps",
        text: "Trappers are experts at dropping snares. A Trapper may set a trap if he spends a turn doing nothing else (he may not set traps if he's just recovered from being Knocked Down). Place a marker in base contact with the Trapper. When another model, friend or foe, moves within 2\" of the marker he risks setting off the trap: roll a D6. On a score of 3+ he has triggered the trap and suffers a S4 hit (note that the Trapper won't trigger his own traps). If the trap did not wound the model, the injured model has multiple wounds, or it didn't trigger, the 'victim' may finish his move — however, if the model was knocked Down or Stunned, place him 2\" from the marker. Regardless whether the trap was triggered or not, the marker is removed. Gnoblar only.",
        restriction: "Gnoblars only",
      },
      {
        id: "ogre_hunting_party_skills_infiltration",
        name: "Infiltration",
        text: "A Gnoblar with this skill is always placed on the battlefield after the opposing warband and can be placed anywhere on the table as long as it is out of sight of the opposing warband and more than 12\" away from any enemy model. If both players have models which infiltrate, roll a D6 for each, and the lowest roll sets up first. Gnoblar only.",
        restriction: "Gnoblars only",
      },
      {
        id: "ogre_hunting_party_skills_netter",
        name: "Netter",
        text: "Each game, the hero starts with 3 Nets. These may not be sold, traded, or given to another warrior — if not used during the game, they assumed to be stashed away or fallen apart. The next game, the hero will start with 3 nets, without penalty or cost. Gnoblar only.",
        restriction: "Gnoblars only",
      },
    ],
    source: { publication: "Dave \"StyrofoamKing\" Seidman-Joria and Catferret (PDF) · Version: V1.3", file: "warbands/grade-2a-part1.md:2801-2818" },
  },
  {
    id: "protectorate_of_sigmar_special_skills",
    name: "Special Skills",
    warbandId: "protectorate_of_sigmar",
    intro: "Protectorate Heroes with access to Special Skills may use the following list:",
    skills: [
      {
        id: "protectorate_of_sigmar_special_skills_protection_of_sigmar",
        name: "Protection of Sigmar",
        text: "The pious has been blessed by the Church. Any spell which would affect him is nullified on a D6 roll of 4+. Note that if the spell is nullified it will not affect any other models either.",
      },
      {
        id: "protectorate_of_sigmar_special_skills_unshakeable_faith",
        name: "Unshakeable Faith",
        text: "Such is the faith of the warrior that there is little room for doubt or hesitation in his actions. When the opportunity arises to smite evil, one must be able to strike! As such, the warrior is hardened and immune to Fear.",
      },
      {
        id: "protectorate_of_sigmar_special_skills_utter_determination",
        name: "Utter Determination",
        text: "Allows him to re-roll any failed Rout tests.",
        restriction: "Warrior Priest only",
      },
      {
        id: "protectorate_of_sigmar_special_skills_rousing_sermon",
        name: "Rousing Sermon",
        text: "The Warrior Priest bellows his prayers to Sigmar, beseeching his protector to lend he and his men the strength to forge onwards. A Rousing Sermon must be declared at the beginning of a player's turn. The Warrior Priest and all friendly models within 6\" gain +1 attack during that Hand to Hand combat phase. There may only be one Rousing Sermon per game.",
        restriction: "Warrior Priest only",
      },
      {
        id: "protectorate_of_sigmar_special_skills_sigmars_guidance",
        name: "Sigmar's Guidance",
        text: "With the blessed hand of Sigmar guiding his aim, the warrior lets loose his arrow. He may freely choose his target, and not only the closest enemy when declaring ranged attacks.",
      },
    ],
    source: { publication: "(PDF), uncredited", file: "warbands/grade-2a-part2.md:496-502" },
  },
  {
    id: "skaven_of_clan_moulder_special_skills",
    name: "Special Skills",
    warbandId: "skaven_of_clan_moulder",
    intro: "Clan Moulder heroes may choose to use the following Skill list instead of any of the standard Skill tables available to them.",
    skills: [
      {
        id: "skaven_of_clan_moulder_special_skills_black_hunger",
        name: "Black Hunger",
        text: "The Skaven can draw upon the dreaded Black Hunger, the fighting frenzy which gives him unnatural strength and speed but can ravage him from the inside. The Clan Moulder Hero may declare at the beginning of his turn that he is using this skill. The Hero may add +1 attack and +D3\" to the total move on his profile for the duration of his own turn, but will suffer D3 S3 hits with no armour save possible at the end of the turn.",
      },
      {
        id: "skaven_of_clan_moulder_special_skills_beastkin",
        name: "Beastkin",
        text: "A Clan Moulder hero with this skill has developed such an affinity for the horrific creatures under their dominion that the range at which any Beast/Animal Handling skills operate is doubled to 12\". This applies to any and all such skills the character has and any they take in future.",
      },
      {
        id: "skaven_of_clan_moulder_special_skills_hypnotic_musk",
        name: "Hypnotic Musk",
        text: "The Hero has a scent that is particularly compelling to animals of all kinds, inspiring within them a desire to obey him. Any animal or beast from an opposing warband wishing to charge him must pass a Leadership test to do so unless said charge is the result of Goading. Mounts are assumed to be sufficiently under the control of their riders as to make them immune to the effect.",
      },
      {
        id: "skaven_of_clan_moulder_special_skills_subjugator_of_mankind",
        name: "Subjugator of Mankind",
        text: "The Hero has become so adept with the Thingcatcher that even intelligent and nimble creatures such as Humans cannot escape him. If a Hero with this skill and equipped with a Thingcatcher takes an opposing model out of action, do not roll for injuries post-battle, instead treat the enemy as if they'd rolled Captured on the Serious Injuries chart. Large creatures such as Ogres cannot be caught in this way, but animals can.",
      },
      {
        id: "skaven_of_clan_moulder_special_skills_twistkin",
        name: "Twistkin",
        text: "Accidental exposure to raw warpstone or the experimental attentions — welcome or otherwise — of a Clan Moulder superior has resulted in this Hero developing some monstrous but useful mutation. Upon taking this skill the Hero must buy a Mutation from the list in the Mordheim Rulebook (see Possessed Warband) at half the listed cost.",
        restriction: "Stormvermin only",
      },
    ],
    source: { publication: "(PDF), uncredited", file: "warbands/grade-2a-part2.md:726-732" },
  },
  {
    id: "snotlings_special_skills",
    name: "Snotling Special Skills",
    warbandId: "snotlings",
    intro: "The Bullied Goblin and Snotling Heroes may use the following skill list instead of any of the standard skill tables available to them.",
    skills: [
      {
        id: "snotlings_special_skills_stampede",
        name: "Stampede",
        text: "When the hero with Stampede charges an opposing warrior, keep track of any other Snotlings that charged that same warrior this turn. You may have one of those charging Snotlings forfeit his attack in order to give the Stampeding Hero +1 Strength for each Base Attack forfeited (Example: a Snotling BigSnot with S2 and Stampede charges an opponent — he has a Snotling Mob charge with him. The Mob forfeits its attack, granting the BigSnot +3 Strength; +1 S for each of the Mob's Base attacks (do not count additional hand attacks)). This bonus lasts until the end of the turn, and may be used multiple times (i.e. you may have multiple snotlings each forfeit their attack, each adding +1 S for each attack). However, each snotling may only forfeit his attack once per turn (thus, if you have two Stampeding heroes, you cannot have 1 snotling runt forfeit his attack TWICE, giving the bonus to two different warriors). A Snotling that forfeits his attacks forfeits them ALL — he may not choose to give up \"half\" his attacks or any other fraction. A Hero's Strength may not be increased beyond Strength 10.",
      },
      {
        id: "snotlings_special_skills_achilles_heel",
        name: "Achilles' Heel",
        text: "Your Snotling always causes Critical Hits on rolls of 6 (when wounding) regardless of opponent's toughness. In addition, when combined with the Stampede charge attack, on any successful rolls to wound of 5+, the opponent gains no armour save.",
      },
      {
        id: "snotlings_special_skills_worm",
        name: "Worm",
        text: "The Snotling is a master of fitting through small spaces and cracks in solid walls as well as burrowing under doors and floors. During the movement phase, you can declare that the Snotling is moving through a wall (even charging, if you can see/detect the target). Roll a D6... on anything but a 1, your Snotling squeezes through and can attack as normal. On a 1, he has charged the wall blindly and not found a crevice, concussing himself in a cartoony manner. He cannot move again this turn and counts as knocked down if attacked in close combat. This Skill cannot be combined with the \"Stampede\" skill above.",
        restriction: "Scout and Promoted Runts only",
      },
      {
        id: "snotlings_special_skills_big_bully",
        name: "Big Bully",
        text: "The BigSnot is immensely Big and strong, especially by Snotling standards. The BigSnot immediately learns ONE Strength Skill. A BigSnot may only take this skill once each. Cannot be combined with the skill \"Frustratingly Tiny.\"",
        restriction: "BigSnotz only",
      },
      {
        id: "snotlings_special_skills_frustratingly_tiny",
        name: "Frustratingly Tiny",
        text: "Your Snotling is a master of using his tiny size to his advantage. In Hand-to-hand combat, enemies attacking your hero are at -1 to hit. Also, all opponents halve their Initiative when trying to detect a Hidden \"Tiny\" hero. This skill cannot be combined with the \"Big Bully\" skill above.",
        restriction: "Snotlings only",
      },
      {
        id: "snotlings_special_skills_mob_master",
        name: "Mob Master",
        text: "The Hero is a Master at controlling and leading the Snotlings around him as a Mob. So long as your Hero is within 2\" of a Snotling Mob, both he and the Snotling Mob become Immune to Psychology exactly as if the Hero counted as a second Snotling Mob. When this skill is combined with the \"Stampede\" skill above, the Hero automatically gains +1 to hit for each forfeited attack, in addition to +1 Strength. A natural roll of 1 will always fail to hit.",
      },
    ],
    source: { publication: "Luke \"Ram Rock Ed First/Auretious Taak\" Roberts and Dave \"Styrofoamking\" Seidman-Joria (PDF)", file: "warbands/grade-2a-part2.md:1025-1032" },
  },
  {
    id: "sorcerous_society_additional_academic_skills",
    name: "Additional Academic Skills",
    warbandId: "sorcerous_society",
    intro: "(as found in Town Cryer 7/2002 Annual)",
    skills: [
      {
        id: "sorcerous_society_additional_academic_skills_scribe",
        name: "Scribe",
        text: "The warrior is a natural adept at writing and making scrolls. Any warrior with the ability to cast spells or use prayers may take this skill. It allows them to make a scroll before the battle and inscribe a single spell/prayer upon it that they are versed in. The scroll may be used just before they are about to cast the spell/prayer and allows the caster +2 to his difficulty roll.",
        restriction: "Any warrior with the ability to cast spells or use prayers may take this skill",
      },
      {
        id: "sorcerous_society_additional_academic_skills_mind_focus",
        name: "Mind Focus",
        text: "The warrior possesses a great strength of mind which allows him to concentrate beyond the levels of most normal men. When using a spell or prayer the warrior with this skill may re-roll one dice roll used in the difficulty roll. Note that this cannot cancel a Miscast.",
      },
      {
        id: "sorcerous_society_additional_academic_skills_magical_aptitude",
        name: "Magical Aptitude",
        text: "This skill may only be taken by a warrior capable of casting spells. It may not be used by Sisters of Sigmar or Warrior Priests. The warrior has a keen aptitude for magic and can push himself beyond normal limits to produce a storm of spells. The warrior may attempt to cast two spells each turn as long as he is not in hand-to-hand combat. After attempting the first spell he must take a Toughness test. If he passes he may attempt a second spell that turn or even cast the same spell twice. If he fails, you must roll on the injury table immediately with no saves, treating Out of Action results as Stunned instead.",
        restriction: "This skill may only be taken by a warrior capable of casting spells. It may not be used by Sisters of Sigmar or Warrior Priests",
      },
    ],
    source: { publication: "Chris \"Miginath\" Van Tighem and Tom \"Brahm Tazoul\" Bell (PDF)", file: "warbands/grade-2a-part2.md:1360-1364" },
  },
  {
    id: "survivors_of_strigos_strigoi_vampire_skills",
    name: "Strigoi Vampire Only",
    warbandId: "survivors_of_strigos",
    intro: "this skill list may be used by the Strigoi Vampire instead of the standard lists.",
    skills: [
      {
        id: "survivors_of_strigos_strigoi_vampire_skills_iron_sinews",
        name: "Iron Sinews",
        text: "After death the Vampire's muscles grow far greater than they ever could have in his mortal life. The Strigoi becomes a beast of pure muscular power. Add +1S to the Vampire's profile.",
        restriction: "Strigoi Vampire Only",
      },
      {
        id: "survivors_of_strigos_strigoi_vampire_skills_great_thirster",
        name: "Great Thirster",
        text: "Such is the appetite of this beast that he must feed almost constantly. Once the taste of blood has touched his lips, there is little that can stop the Vampire from drinking again. Once the Vampire takes a model Out of Action, treat him as Frenzied. This effect remains until he is Knocked Down, Stunned, or taken Out of Action.",
        restriction: "Strigoi Vampire Only",
      },
      {
        id: "survivors_of_strigos_strigoi_vampire_skills_curse_of_the_revenant",
        name: "Curse of the Revenant",
        text: "So strong is the desire for some to continue living that they defy death. Once a Vampire has taken the Great Thirster special skill, he may choose the Curse of the Revenant. This skill allows the Vampire to regenerate lost wounds on a D6 roll of 5+. Only one wound may be recovered in this fashion per turn.",
        restriction: "Strigoi Vampire Only",
      },
      {
        id: "survivors_of_strigos_strigoi_vampire_skills_dark_arts",
        name: "Dark Arts",
        text: "The Strigoi has retained some of its former magical aptitude. He may choose Arcane Lore as an advance, and immediately roll for a spell on the Dark Arts table (see Magic below). Subsequent spells may be chosen instead of skills.",
        restriction: "Strigoi Vampire Only",
      },
    ],
    source: { publication: "Written & tested by Brahm Tazoul (PDF)", file: "warbands/grade-2a-part2.md:1664-1669" },
  },
  {
    id: "survivors_of_strigos_strigany_skills",
    name: "Strigany Heroes Only",
    warbandId: "survivors_of_strigos",
    intro: "this skill list may be used by Strigany Heroes instead of the standard lists. Strigoi Vampires may not use this list.",
    skills: [
      {
        id: "survivors_of_strigos_strigany_skills_light_fingers",
        name: "Light Fingers",
        text: "Gypsies are apt to find things that others have lost. Should a Hero with this skill take an enemy model Out of Action, they will find an extra piece of Wyrdstone. Only one piece of treasure may be found in this manner per game.",
        restriction: "Strigany Heroes Only",
      },
      {
        id: "survivors_of_strigos_strigany_skills_practiced_arm",
        name: "Practiced Arm",
        text: "Such is the skill with which the Gypsy can launch throwing knives that he can throw two of them per turn. These missiles must be at the same target and gain +1 to their injury rolls to represent the skill with which they were aimed.",
        restriction: "Strigany Heroes Only",
      },
    ],
    source: { publication: "Written & tested by Brahm Tazoul (PDF)", file: "warbands/grade-2a-part2.md:1671-1674" },
  },
  {
    id: "vampire_hunters_of_sylvania_special_skills",
    name: "Special Skills",
    warbandId: "vampire_hunters_of_sylvania",
    intro: "Vampire Hunters and Slayers may use the following skill list instead of the standard skill lists. The Priest of Morr may choose Blessing of Morr and Thirst for Vengeance as well as his normal skills.",
    skills: [
      {
        id: "vampire_hunters_of_sylvania_special_skills_iron_will",
        name: "Iron Will",
        text: "Such is the work of Slayers that there is little room for hesitation. When the opportunity arises, one must be able to strike! As such, the warrior is hardened and immune to Fear.",
      },
      {
        id: "vampire_hunters_of_sylvania_special_skills_righteous_aura",
        name: "Righteous Aura",
        text: "Carrying many talismans from various gods, the warrior heads into battle assured of victory. Possessed or Undead opponents lose their first attack against the warrior in the first round of hand-to-hand combat (down to a minimum of 1).",
      },
      {
        id: "vampire_hunters_of_sylvania_special_skills_thirst_for_vengeance",
        name: "Thirst for Vengeance",
        text: "The warrior Hates all undead. In his quest for revenge, he gains +1 attack in a turn where he has charged.",
      },
      {
        id: "vampire_hunters_of_sylvania_special_skills_blessing_of_morr",
        name: "Blessing of Morr",
        text: "The warrior has the Death god's blessing in his work. Add +1 to all injury rolls against the undead.",
      },
      {
        id: "vampire_hunters_of_sylvania_special_skills_touch_of_darkness",
        name: "Touch of Darkness",
        text: "Long has the Slayer been dealing in death. Perhaps too long. Due to his heightened intuition, he ignores darkness penalties.",
      },
    ],
    source: { publication: "By Tom Bell (PDF)", file: "warbands/grade-2a-part2.md:1958-1964" },
  },
  {
    id: "wood_elves_of_athel_loren_special_skills",
    name: "Special Skills",
    warbandId: "wood_elves_of_athel_loren",
    intro: "Wood Elf Heroes with the Special skill available to them may choose to use the following skill list instead of any of the standard skill tables available to them.",
    skills: [
      {
        id: "wood_elves_of_athel_loren_special_skills_fey",
        name: "Fey",
        text: "The Wood Elf has a certain understanding of magic and therefore gets a saving throw of 4+ against hostile magic.",
      },
      {
        id: "wood_elves_of_athel_loren_special_skills_elven_luck",
        name: "Elven Luck",
        text: "The Elven Gods favour the Wood Elf. Once per game, he may reroll any failed roll.",
      },
      {
        id: "wood_elves_of_athel_loren_special_skills_excellent_sight_skill",
        name: "Excellent Sight (skill)",
        text: "By training his eyesight for years the Wood Elf can spot hidden enemy models up to 2 x I inch away. *(Note: the source page flags this as likely a duplicate/oversight, since the same effect is already granted by the warband-wide Excellent Sight special rule above.)*",
      },
      {
        id: "wood_elves_of_athel_loren_special_skills_seeker",
        name: "Seeker",
        text: "Being an expert Tracker, the Wood Elf is able to spot even hidden treasures. He may modify the result of one exploration die by +/- 1. Only one Elven Hero may possess this skill!",
        restriction: "Only one Elven Hero may possess this skill!",
      },
      {
        id: "wood_elves_of_athel_loren_special_skills_infiltration",
        name: "Infiltration",
        text: "The Wood Elf is an expert in infiltrating behind enemy lines. Therefore he is always deployed last, anywhere out of sight of the enemy. If both players have infiltrate, roll 1d6. Lowest roll deploys first.",
      },
    ],
    source: { publication: "(PDF), uncredited", file: "warbands/grade-2a-part2.md:2208-2214" },
  },
  {
    id: "the_restless_dead_variant_undead_special_skills",
    name: "Undead special skills",
    warbandId: "the_restless_dead_variant",
    intro: "Liches and Necromancers may choose to use the following skill list instead of any of the standard Skill tables available to them.",
    skills: [
      {
        id: "the_restless_dead_variant_undead_special_skills_corpse_bomb",
        name: "Corpse Bomb",
        text: "Special magics and rituals can cause a Zombie to explode when they are near the enemy. Secretly nominate one Zombie at the beginning of the battle to be a Corpse Bomb. If the enemy charges or is charged by the Zombie, it immediately detonates. All models within D6 inches take D3 Strength 4 hits. The detonated Zombie may never be used again as it is splattered in a million pieces all over Mordheim! Corpse bombs killed by shooting do not detonate. Only one Zombie at a time can be a corpse bomb although the skill can be taken by both the Necromancer and the Liche.",
      },
      {
        id: "the_restless_dead_variant_undead_special_skills_deathspeaker",
        name: "Deathspeaker",
        text: "At the start of the battle, the undead player may deploy D3 Zombies for free. These zombies do not count towards the maximum number of models in the warband, but increase the warband’s rating as normal. Zombies created in this way may not be used as Corpse Bombs. These Zombies only last for the duration of the battle.",
      },
      {
        id: "the_restless_dead_variant_undead_special_skills_wraith_touch",
        name: "Wraith Touch",
        text: "The hero may make a Wraith Touch attack instead of their normal attacks in close combat. The hero making a Wraith Touch makes a single unarmed attack, if it hits, it wounds automatically, all rules that apply to unarmed attacks apply to the Wraith Touch. If a Liche uses this skill and wounds, then he may regain one lost wound. This may not take the hero beyond his starting total. Necromancers do not regain wounds with this skill. This skill has no effect on the Possessed or Undead.",
      },
      {
        id: "the_restless_dead_variant_undead_special_skills_dark_ritual",
        name: "Dark Ritual",
        text: "Nominate one spell known by the hero with this skill. That spell, for the duration of the battle, gets a bonus of +D3 to see if the spell is cast. Roll the D3 at the beginning of the game, not for every separate casting of the spell.",
      },
      {
        id: "the_restless_dead_variant_undead_special_skills_summoner",
        name: "Summoner",
        text: "The maximum warband size is increased by 1.",
      },
    ],
    source: { publication: "PDF, author Chris de la Rosa (Town Cryer era fan material)", file: "warbands/restless-dead-variant.md:126-188" },
  },
];

/** Every warband-specific skill table for a warband template id (usually 0 or 1; Dwarf lists often have 2). */
export function skillTablesForWarband(warbandId: string): WarbandSkillTable[] {
  return WARBAND_SKILL_TABLES.filter((t) => t.warbandId === warbandId);
}

/** Look up a single warband skill by its (table-prefixed) id. */
export function findWarbandSkill(id: string) {
  for (const table of WARBAND_SKILL_TABLES) {
    const skill = table.skills.find((s) => s.id === id);
    if (skill) return { table, skill };
  }
  return undefined;
}

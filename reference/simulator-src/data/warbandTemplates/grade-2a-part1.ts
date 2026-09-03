// Warband templates — Grade 2a (Part 1), scraped from mordheimer.net (rules/warbands/grade-2a-part1.md).
//
// NOTE on equipment lists: `EquipmentList` (src/types/index.ts) only has meleeWeapons /
// missileWeapons / armour buckets — there is no bucket for a source "Miscellaneous Equipment"
// sub-list. Plain misc items with no independent write-up (e.g. a bare "Rope and hook — 5 gc" or
// "Horse — 40 gc" line) are therefore intentionally NOT reproduced in equipmentLists.
// Anything from a source's "### Special Equipment" section (named items with their own rules
// text, including mounts, whips, cloaks and firearms) is instead captured losslessly as a
// warband-level specialRules entry named "Special Equipment: <Item Name>", regardless of which
// unit(s) can buy it — this keeps every full-text rule discoverable in exactly one place per
// warband. Where an item is both costed in an equipment list AND has its own write-up (e.g. the
// Druchii Draich, or the Dwarf Axe), it appears in both places, matching the pattern already used
// in grade-1c.ts.
//
// NOTE on skillTableIds: only Heroes pick skills from the warband's skill table in Mordheim, so
// every henchmanTemplates entry below has skillTableIds: [] (a Henchman that's promoted to Hero
// via "The Lad's Got Talent" switches to that Hero type's own skill-list access — where the source
// spells out what that access becomes, e.g. the Ogre Hunting Party's Village Ogre, it is captured
// as specialRules text on that unit instead of pre-empting the promotion rule).
//
// NOTE on raceTraits: left as [] except where the source's warband-wide Special Rules literally
// restate the modeled Dwarf toughness traits (Dwarf Slayer Cult) — see traits.ts. Several warbands
// have psychology-flavoured special rules (Hatred, Cause Fear, Immune to Psychology, Frenzy, etc.)
// that apply to only some warband members (Witch Elves' Frenzy, the Necrarchs' undead henchmen,
// Grave Robbers' Undead Foes hatred, etc.), so per the task brief these are captured in
// specialRules text only (warband- or unit-level), not hoisted into raceTraits or invented as a
// UnitTemplate-level trait field (UnitTemplate has no traits array in the schema).
//
// NOTE on warbandSkillIds: only Dwarf Slayer Cult's Thick Skull and True Grit skills match an
// id already in data/skills.ts (both Dwarf-only skills, and the source text for each is an exact
// mechanical match). Every other warband-unique skill named in a "### Warband Skills" section is
// new and not invented as an id — its full name + text is instead captured as a warband-level
// specialRules entry named "Warband Skill: <Skill Name>".

import type { WarbandTemplate } from "../../types";

export const WARBANDS: WarbandTemplate[] = [
  // ===================================================================================
  // Dreamwalkers, Cult of Morr
  // ===================================================================================
  {
    id: `dreamwalkers_cult_of_morr`,
    name: `Dreamwalkers, Cult of Morr`,
    grade: `2a`,
    race: `Human (Ostermark, followers of Morr)`,
    originalSetting: `Mordheim`,
    sourcebook: `Mordheim Facebook Group (PDF)`,
    raceTraits: [],
    specialRules: [
      {
        name: `Choosen Of Morr`,
        text: `A Priest of Morr must ALWAYS certify that each dreamer is genuine, not a heretic...or worse! which means that he must prove through a ritual that the dreamer's dreams truly come from Morr and are not the product of necromantic magic or the corruption of chaos. When creating a band of dreamwalkers, the Priest of Morr must roll a D6. If you get a +4, you can hire the Dreamer; Otherwise, the Priest of Morr rejects him, through the necessary ritual he learns that the dreams of that dreamer do not come from Morr. Then the priest himself will take leadership of the warband to fulfill Morr's will (in game effects the priest of Morr will be considered the Leader). They will be able to try to find (hire) a new genuine Morr Dreamer again after their next battle... paying their costs normally. If the priest finds a genuine dreamer, he will give him the leadership of the band (for game purposes the Dreamer will be considered the leader, until he dies, in which case leadership will revert to the priest again). Once a band has a genuine Dreamer and he or she dies, they will not be able to hire another one again.`,
      },
      {
        name: `Hired Swords`,
        text: `Dreamwalkers may hire any Hired Swords allowed to a Human Mercenary warband, Witch Hunters and Sisters of Sigmar. Of course they can't hire any Hired Sword of a Necromantic or Chaotic nature.`,
      },
      {
        name: `Alliances`,
        text: `In multiplayer games, a Dreamwalkers warband may never forge an alliance with any Warband of a Necromantic or Chaotic nature (Undead, Possessed, Skaven, Beastmen, Dark Elves etc.)`,
      },
      {
        name: `Hate Undead`,
        text: `Vampires, necromancers, are Morr's ultimate enemies: they steal from his kingdom, violate his protection for their own benefit, and flout his authority. All heroes in a Dreamwalkers Warband hate all vampires, necromancers and undead.`,
      },
      {
        name: `New skills`,
        text: `When a hero from a band of Dreamwalkers gains a new skill on an advance roll, they have the same restrictions as witch hunters and sisters of sigmar when choosing skills from the skill list described in the Mordheim rulebook.`,
      },
      {
        name: `Warband Skill: Inspiring Presence`,
        text: `When a Dreamer proves to be a brave leader and truly chosen of Morr, his followers will follow their dreamer to death with unwavering courage. To represent this, Morr Worshwishpers can use the dreamer's lead if they are 12" away instead of the usual 6". (Only for Dreamer).`,
      },
      {
        name: `Warband Skill: Fanatical`,
        text: `The dreamwalkers are convinced that they are the chosen ones to carry out Morr's will and eradicate the necromantic plague of the old world. Once per game, if the Dreamer is not out of action, stunned or knocked down, you may re-roll a failed rout test. (Only for Dreamer).`,
      },
      {
        name: `Warband Skill: Inured to Horror`,
        text: `Only the true faithful followers of Morr know and accept death and become inured to horror. The model is immune to Fear, and need never take All Alone tests.`,
      },
      {
        name: `Warband Skill: Blessed by Morr`,
        text: `The hero has been blessed by Morr and has his protection against the magic that his enemies cast against him. Any spell that could affect the model is nullified with a D6 roll of +4 when fighting the undead. Note that if the spell is nullified, it does not affect this model, but it does affect any other model as it normally would.`,
      },
      {
        name: `Special Equipment: Scythe`,
        text: `Range: Close Combat · Strength: As user +1 · Special Rules: Two Handed. Scythes are normally implements used in the fields by farmers. It is rare to see them wielded as weapons of warfare. However, the scythe also carries with it an image of death. Priests of Morr, when they need to, may carry a Scythe as a weapon. This is of heavier manufacture, and designed to reap warriors rather than wheat. Because the Scythe is unwieldy, it must be used with two-hands and cannot be used with another weapon, shield or buckler.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `dreamwalkers_hero`,
        name: `Hero Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Rapier (Only Andanti)`, cost: `15 gc` },
          { name: `Main Gauche (Only Andanti)`, cost: `7 gc` },
        ],
        missileWeapons: [
          { name: `Crossbow`, cost: `25 gc` },
          { name: `Bow`, cost: `10 gc` },
          { name: `Short bow`, cost: `5 gc` },
          { name: `Pistol`, cost: `15 gc (30 for Brace)` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Heavy armour`, cost: `50 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Buckler`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
      {
        id: `dreamwalkers_morr_worshwishpers`,
        name: `Morr Worshwishpers Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
        ],
        missileWeapons: [
          { name: `Bow`, cost: `10 gc` },
          { name: `Short Bow`, cost: `5 gc` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Buckler`, cost: `5 gc` },
        ],
      },
      {
        id: `dreamwalkers_deaths_heads`,
        name: `Ostermark Death's Heads Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Halberd`, cost: `10 gc` },
        ],
        missileWeapons: [
          { name: `Crossbow`, cost: `25 gc` },
          { name: `Bow`, cost: `10 gc` },
          { name: `Short Bow`, cost: `5 gc` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Buckler`, cost: `5 gc` },
        ],
      },
    ],
    heroTemplates: [
      {
        id: `dreamwalkers_dreamer`,
        name: `Dreamer`,
        role: `hero`,
        cost: 70,
        rosterLimit: `0-1`,
        startingExperience: 20,
        stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: `dreamwalkers_hero`,
        skillTableIds: [`combat`, `shooting`, `academic`, `strength`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Leader`, text: `Any warrior within 6" of the Dreamer may use his Leadership instead of his own.` },
          { name: `Choosen Of Morr`, text: `See the warband's special rules section for the Priest of Morr's genuineness ritual and its effect on leadership.` },
          {
            name: `Guiding Dream`,
            text: `At the beginning of each battle, the Dreamer must roll D6 and consult the Guiding Dream table to discover what kind of vision Morr is sending him. 1 – Disturbing Vision: the Dreamer suffers a -1" Movement penalty. 2–3 – Vision of Truth: designate one of your opponent's heroes as a target; the Dreamer gets +1 to hit this model. 4–5 – Empowering Vision: designate one of your opponent's heroes as a target; the Dreamer has +1 Strength when fighting this model. 6 – Infuriating Vision: designate one of your opponent's heroes as a target; the Dreamer will have Frenzy against this model.`,
          },
        ],
      },
      {
        id: `dreamwalkers_priest_of_morr`,
        name: `Priest Of Morr`,
        role: `hero`,
        cost: 35,
        rosterLimit: `1`,
        startingExperience: 8,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 9 },
        // TODO: source restricts the Priest Of Morr to only a Dagger and a Scythe, and forbids
        // armour entirely — narrower than the shared Hero Equipment list referenced here. No
        // dedicated Priest-only EquipmentList table exists on the source page, so the restriction
        // is captured below in specialRules rather than as a separate equipmentListId.
        equipmentListId: `dreamwalkers_hero`,
        skillTableIds: [`academic`, `speed`, `warband-unique`],
        specialRules: [
          {
            name: `Weapons/Armour Restriction`,
            text: `As priests of Morr seldom engage in martial activities, they may only be armed with a Dagger and a Scythe as a weapon. Priests Of Morr may never wear armour.`,
          },
          {
            name: `Skills`,
            text: `Priest Of Morr may choose skills from the Academic and Speed skills list, or they may randomly determine a new funerary from the Funerary Rites list.`,
          },
          { name: `Loner`, text: `Few people care to spend any length of time in the company of a priest of Morr - even when it is their duty to do so. Priests of Morr do not suffer from the all alone rules.` },
          {
            name: `Funerary Rites`,
            text: `Priests of Morr are not wizards by any means, however, they do have numerous Funerary Rites, which they may perform. As such, priests of Morr may choose a Funerary Rite, using the rules for Magic. See the Magic section for details.`,
          },
        ],
      },
      {
        id: `dreamwalkers_black_guards_of_morr`,
        name: `Black Guards of Morr`,
        role: `hero`,
        cost: 55,
        rosterLimit: `0-2`,
        startingExperience: 8,
        stats: { M: 4, WS: 4, BS: 3, S: 4, T: 3, W: 1, I: 3, A: 1, Ld: 8 },
        equipmentListId: `dreamwalkers_hero`,
        skillTableIds: [`combat`, `shooting`, `speed`, `warband-unique`],
        specialRules: [
          {
            name: `Optional Warhorse`,
            text: `If using the optional rules for mounted models or the Blazing Saddles expanded mounted rules, the Black Guard may ride a Warhorse (M8 WS3 BS0 S3 T3 W1 I3 A1 Ld5), paying its cost, increasing their save by +4 while mounted.`,
          },
          {
            name: `Silent Guardian`,
            text: `If a Black Guard has been declared Hidden, enemies must take an Initiative test to spot them. And never suffer movement penalties for wearing armour.`,
          },
        ],
      },
      {
        id: `dreamwalkers_andanti`,
        name: `The Andanti`,
        role: `hero`,
        cost: 40,
        rosterLimit: `0-1`,
        startingExperience: 6,
        stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `dreamwalkers_hero`,
        skillTableIds: [`combat`, `shooting`, `strength`, `warband-unique`],
        specialRules: [
          {
            name: `Estalian Tecnique`,
            text: `The Andanti may parry using his rapier and Main Gauche if he can roll under his weapon skill as opposed to over his opponent's highest hit roll as per the normal rules.`,
          },
          {
            name: `Andanti Knowledge`,
            text: `Their secret knowledge passed from member to member makes them skilled fighters against vampires. When fighting a vampire they get +1 to hit in close combat.`,
          },
        ],
      },
    ],
    henchmanTemplates: [
      {
        id: `dreamwalkers_deaths_heads_of_ostermark`,
        name: `Death's Heads of Ostermark`,
        role: `henchman`,
        cost: 40,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `dreamwalkers_deaths_heads`,
        skillTableIds: [],
        specialRules: [
          {
            name: `Expert Halberdier`,
            text: `Death's Heads are so skilled with their weapons that they may fight carrying his halberd in one hand and shield in the other.`,
          },
        ],
      },
      {
        id: `dreamwalkers_morr_worshwishpers_henchmen`,
        name: `Morr Worshwishpers`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `dreamwalkers_morr_worshwishpers`,
        skillTableIds: [],
        specialRules: [],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-2a-warbands/dreamwalkers-cult-of-morr`,
  },

  // ===================================================================================
  // Druchii
  // ===================================================================================
  {
    id: `druchii`,
    name: `Druchii`,
    grade: `2a`,
    race: `Dark Elf`,
    originalSetting: `Mordheim`,
    sourcebook: `Druchii.net (PDF)`,
    raceTraits: [],
    specialRules: [
      { name: `Kindred Hatred`, text: `Dark Elves Hate any High Elf warriors including High Elf Hired Swords.` },
      {
        name: `Fey Acuity`,
        text: `During the Exploration phase when checking for artifacts or wyrdstone at the end of the game, add +1 to the number of pieces found by a Dark Elf warband, as long as at least one hero was searching.`,
      },
      { name: `Disdain`, text: `Dark Elves may never use black powder weapons, as they find them too crude, noisy and unreliable.` },
      { name: `Slavers`, text: `In case of finding prisoners (roll of "333" during Exploration phase) Druchii may follow the rules for Skaven.` },
      {
        name: `Maximum Characteristics`,
        text: `M 5 · WS 7 · BS 7 · S 4 · T 3 · W 3 · I 9 · A 4 · Ld 10.`,
      },
      {
        name: `Permitted Hired Swords`,
        text: `Due to their merciless nature a Druchii warband may only employ the following Hired Swords. Official: Pit Fighter, Ogre Bodyguard, Warlock, Imperial Assassin, Tilean Marksman, Highwayman. Unofficial, but published by SG: Duelist, Witch, Emissary of Chaos, Human Scout, Old Prospector. Lustria: Dark Elf Assassin, Pathfinder. Khemri: Nomad Scout, Thief. Completely unofficial: Shade Scout.`,
      },
      {
        name: `Warband Skill: Frenzied Charge`,
        text: `The Dark Elf is infused with an intense raging thirst for blood and is a whirlwind in hand-to-hand combat, moving from opponent to opponent. The Druchii may make a 4" follow up move if they take all of their opponents out of action. If the elf comes into contact with another enemy, this starts a new combat. This new combat takes place in the following turn and the model counts as charging.`,
      },
      {
        name: `Warband Skill: Fey Quickness`,
        text: `Few can ever hope to match an Elf's inhuman quickness and agility. An Elf with Fey Quickness can avoid melee or missile attacks on a roll of 6. If the Elf also has Step Aside or Dodge, this will increase to a 4+ in the relevant area. For example, an Elf with Fey Quickness and Step Aside avoids melee attacks on a 4+ and missile attacks on a 6.`,
      },
      { name: `Warband Skill: Infiltration`, text: `The Dark Elf can Infiltrate. This skill is identical to the Skaven skill.` },
      {
        name: `Warband Skill: Poisoner`,
        text: `The Dark Elf is proficient in concocting different poisons. If the Hero doesn't search for rare items, he may make D2 doses of Dark Venom instead. The poison must be used in the next battle and cannot be sold or traded to other warbands as the Dark Elves guard their secrets very carefully.`,
      },
      {
        name: `Warband Skill: Marksman of Naggaroth`,
        text: `Eyes of this hero are so keen and hands so steady that he can completely omit the penalty for long range if using a crossbow type weapon. Further, if he did not move this turn, he can shoot from repeater crossbow twice per turn without penalty or three times per turn with -1 penalty to hit.`,
      },
      {
        name: `Warband Skill: Will to Survive`,
        text: `Naggaroth is a harsh land with harsh inhabitants and weaklings are shown no mercy. This elf is able to survive by pure strength of will. If the model gets out of action and result of the Serious Injuries roll is death, make a Leadership test against unmodified Ld of the model (no holy relics etc.). If you succeed, the model will survive but will miss D3 battles instead.`,
      },
      {
        name: `Warband Skill: Keen Sight`,
        text: `There are numerous legends detailing the excellent eyesight of the Elves, both Druchii and Asur kin. This elf can spot Hidden enemies from twice as far away than normal warriors (i.e. twice his Initiative value in inches).`,
      },
      {
        name: `Special Equipment: Draich`,
        text: `Cost: 25 + 1D6 gc · Availability: Rare 8 · Range: Close combat · Strength: As user +2 · Special Rules: Two-handed, Swift. A Draich is a two-handed sword, typically used by dreaded Executioners of Har Ganeth, well balanced not to encumber elven swordsmen. Two-handed: a model armed with a double-handed weapon may not use a shield, buckler or additional weapon in close combat (still gets +1 to armour save vs shooting if shielded). Swift: unlike other double-handed weapons, a Draich does not Strike last.`,
      },
      {
        name: `Special Equipment: Darksteel Blade`,
        text: `Cost: 3 x base weapon price · Availability: Rare 9 · Range: Close combat · Strength: As user · Special Rules: Critical damage, Wicked edge. Forged in Hag Graef from black steel; any Druchii hero can use a close-combat weapon with a Darksteel blade. Critical Damage: a Darksteel weapon adds +1 to the result on the critical hit chart. Wicked Edge: a roll of 2–4 on the injury table is a stunned result.`,
      },
      {
        name: `Special Equipment: Beastlash`,
        text: `Cost: 10 + D6 gc · Availability: Rare 8 (Beastmaster only) · Range: Close combat · Strength: As user · Special Rules: Beastbane, Whipcrack, Cannot be parried, +1 Enemy armour save. Beastbane: causes Fear in animals (a Fear test is required to charge or be charged by a Beastmaster with this weapon). Whipcrack: +1A when the wielder charges (added after other modifiers); +1A (that may only be used against the charger, and 'strikes first') when the wielder is charged, even by multiple opponents simultaneously; only the first whip gets Whipcrack's bonus if dual-wielded. Cannot be parried. +1 Enemy armour save: a model wounded by a Beastlash gains +1 to its armour save, or a 6+ save if it has none.`,
      },
      {
        name: `Special Equipment: Sea Dragon Cloak`,
        text: `Cost: 30 + 2D6 gc · Availability: Rare 10. Dark Elf Corsairs use special cloaks fashioned from the skin and scales of sea monsters. Scales: the wearer receives +2 to his save against shooting (or a 5+ save if none) and +1 to his save in close combat (or a 6+ save if none). May be combined with other armour (shield, light armour) with no penalty.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `druchii_hero`,
        name: `Druchii Hero Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Draich`, cost: `25 gc` },
          { name: `Halberd`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Beastlash (Beastmaster only)`, cost: `10 gc` },
          { name: `Darksteel blade`, cost: `3 x price` },
        ],
        missileWeapons: [
          { name: `Repeater crossbow`, cost: `20 gc` },
          { name: `Crossbow pistol`, cost: `35 gc` },
          { name: `Throwing knives`, cost: `15 gc` },
        ],
        armour: [
          { name: `Helmet`, cost: `10 gc` },
          { name: `Light armour`, cost: `20 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Buckler`, cost: `5 gc` },
          { name: `Sea dragon cloak`, cost: `30 gc` },
        ],
      },
      {
        id: `druchii_corsair`,
        name: `Corsair Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Halberd`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
        ],
        missileWeapons: [{ name: `Repeater crossbow`, cost: `20 gc` }],
        armour: [
          { name: `Helmet`, cost: `10 gc` },
          { name: `Light armour`, cost: `20 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Buckler`, cost: `5 gc` },
          { name: `Sea dragon cloak`, cost: `30 gc` },
        ],
      },
      {
        id: `druchii_shades`,
        name: `Shades Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
        ],
        missileWeapons: [
          { name: `Repeater crossbow`, cost: `20 gc` },
          { name: `Bow`, cost: `10 gc` },
          { name: `Throwing knives`, cost: `15 gc` },
        ],
        armour: [
          { name: `Helmet`, cost: `10 gc` },
          { name: `Light armour`, cost: `20 gc` },
        ],
      },
      {
        id: `druchii_witch_elves`,
        name: `Witch Elves Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Halberd`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
        ],
        missileWeapons: [],
        armour: [
          { name: `Helmet`, cost: `10 gc` },
          { name: `Light armour`, cost: `20 gc` },
        ],
      },
      {
        id: `druchii_none`,
        name: `No Equipment (animal)`,
        meleeWeapons: [],
        missileWeapons: [],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: `druchii_noble`,
        name: `Noble`,
        role: `hero`,
        cost: 75,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 5, WS: 5, BS: 4, S: 3, T: 3, W: 1, I: 6, A: 1, Ld: 9 },
        equipmentListId: `druchii_hero`,
        skillTableIds: [`combat`, `shooting`, `academic`, `speed`, `warband-unique`],
        specialRules: [{ name: `Leader`, text: `Any models in the warband within 6" of the Noble may use his Leadership instead of their own.` }],
      },
      {
        id: `druchii_sorceress`,
        name: `Sorceress`,
        role: `hero`,
        cost: 45,
        rosterLimit: `0-1`,
        startingExperience: 8,
        stats: { M: 5, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 5, A: 1, Ld: 8 },
        equipmentListId: `druchii_hero`,
        skillTableIds: [`academic`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Armour Restriction`, text: `A Sorceress may not cast spells if wearing armour.` },
          { name: `Wizard`, text: `The Dark Elf Sorceress is a wizard and uses Dark Magic.` },
          { name: `Spell: Doombolt`, text: `Difficulty 8. An 18" bolt of pure dark energy, causing a Strength 5 hit; if the target is wounded, the next closest model within 6" is also hit on a 4+ at -1 Strength from the previous hit, leaping a maximum of four times or until out of targets. A model may only be hit once by a single casting. Armour saves apply as normal.` },
          { name: `Spell: Word of Pain`, text: `Difficulty 8. Range 12". The victim must re-roll all successful hand-to-hand or missile attacks and all to-wound rolls, and must pass a Leadership test before charging. Lasts until the beginning of the next Dark Elf turn.` },
          { name: `Spell: Soul Stealer`, text: `Difficulty 9. Once cast, the Sorceress must score at least one to-hit roll in close combat against a model in base contact; if successful the opponent suffers a wound with no armour save, and the Sorceress gains one wound (never more than one extra, lost at the end of the battle).` },
          { name: `Spell: Black Blade of Khaine`, text: `Difficulty 8. Engulfs a chosen hand-to-hand weapon of a warband member within 6" in black flames, adding +2 Strength and ignoring armour saves, until the Sorceress' shooting phase.` },
          { name: `Spell: Deathspasm`, text: `Difficulty 9. Range 6", must target the closest enemy model, who must roll on the injury chart. If successfully cast, the casting Sorceress is immediately knocked down (not preventable with Jump Up).` },
          { name: `Spell: Witch Flight`, text: `Difficulty 7. The Sorceress may immediately move anywhere within 12" and may count as charging; if she engages a fleeing enemy in close combat she scores 1 automatic hit and the opponent flees again.` },
        ],
      },
      {
        id: `druchii_beastmaster`,
        name: `Beastmaster`,
        role: `hero`,
        cost: 40,
        rosterLimit: `0-1`,
        startingExperience: 8,
        stats: { M: 5, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 5, A: 1, Ld: 8 },
        equipmentListId: `druchii_hero`,
        skillTableIds: [`combat`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Slavehounds`, text: `The Beastmaster may be accompanied by up to three Slavehounds. These are bought as henchmen and follow all rules listed for them.` },
        ],
      },
      {
        id: `druchii_lordlings`,
        name: `Lordlings`,
        role: `hero`,
        cost: 45,
        rosterLimit: `0-2`,
        startingExperience: 8,
        stats: { M: 5, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 6, A: 1, Ld: 8 },
        equipmentListId: `druchii_hero`,
        skillTableIds: [`combat`, `shooting`, `speed`, `warband-unique`],
        specialRules: [],
      },
    ],
    henchmanTemplates: [
      {
        id: `druchii_corsairs`,
        name: `Corsairs`,
        role: `henchman`,
        cost: 35,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 5, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 5, A: 1, Ld: 8 },
        equipmentListId: `druchii_corsair`,
        skillTableIds: [],
        specialRules: [{ name: `Sea Dragon Cloaks`, text: `Corsairs may wear Sea Dragon Cloaks even though they are not Heroes.` }],
      },
      {
        id: `druchii_shades_henchmen`,
        name: `Shades`,
        role: `henchman`,
        cost: 35,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 5, WS: 3, BS: 4, S: 3, T: 3, W: 1, I: 5, A: 1, Ld: 8 },
        equipmentListId: `druchii_shades`,
        skillTableIds: [],
        specialRules: [
          { name: `Natural Stealth`, text: `If a Shade is Hidden, enemy models halve their Initiative value for determining if they can detect it or not.` },
        ],
      },
      {
        id: `druchii_witch_elves_henchmen`,
        name: `Witch Elves`,
        role: `henchman`,
        cost: 45,
        rosterLimit: `0-3`,
        startingExperience: 0,
        stats: { M: 5, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 5, A: 1, Ld: 8 },
        equipmentListId: `druchii_witch_elves`,
        skillTableIds: [],
        specialRules: [
          { name: `Frenzy`, text: `Witch Elves, being intent on proving their battle prowess in Khaela Mensha Khaine's all-seeing gaze, follow the Frenzy special rule.` },
          {
            name: `Maibd Poison`,
            text: `Witch Elves may purchase Black Lotus as a Common item for a reduced price of 5 gc per dose, usable only by Witch Elves. The poison must be used in the next battle and cannot be sold or traded.`,
          },
        ],
      },
      {
        id: `druchii_slavehounds`,
        name: `Slavehounds`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `0-3 (requires a Beastmaster in the warband)`,
        startingExperience: 0,
        stats: { M: 7, WS: 4, BS: 0, S: 4, T: 3, W: 1, I: 4, A: 1, Ld: 5 },
        equipmentListId: `druchii_none`,
        skillTableIds: [],
        specialRules: [
          { name: `Animals`, text: `Slavehounds are animals, and all animal rules apply to them. They never gain experience.` },
          {
            name: `Beastmaster`,
            text: `As long as the Beastmaster is not knocked down, stunned or out of action, Slavehounds may use his Leadership instead of their own for any Leadership test, provided he is within 6" — but they cannot use the warband Leader's Leadership. If the Beastmaster is unable to participate, neither can the Slavehounds. Without a Beastmaster in the warband, Slavehounds cannot be controlled and stay in camp.`,
          },
          {
            name: `Pack Work`,
            text: `If a Slavehound knows about an enemy model (has line of sight, has unhidden it, etc.), the Beastmaster and all other Slavehounds of the same warband can declare a charge on this model even if they do not see it — no Initiative roll necessary.`,
          },
        ],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-2a-warbands/druchii`,
  },

  // ===================================================================================
  // Dwarf Slayer Cult
  // ===================================================================================
  {
    id: `dwarf_slayer_cult`,
    name: `Dwarf Slayer Cult`,
    grade: `2a`,
    race: `Dwarf (Slayers)`,
    originalSetting: `Mordheim`,
    sourcebook: `By Dave 'Styrofoam King' Joria, based on Mark Havener's Dwarf Treasure Hunters (PDF), Version V5.0`,
    raceTraits: [`hard_to_kill`, `hard_head`],
    specialRules: [
      {
        name: `Hard to Kill`,
        text: `Dwarfs are tough, resilient individuals who can only be taken out of action on a roll of 6 instead of 5-6 when rolling on the Injury chart. Treat a roll of 1-2 as knocked down, 3-5 as stunned, and 6 as out of action.`,
      },
      { name: `Hard Head`, text: `Dwarfs ignore the special rules for maces, clubs, etc. They are not easy to knock out!` },
      { name: `Grudgebearers`, text: `Dwarfs hold an ancient grudge against Elves. A Dwarf warband may never include any kind of Elven Hired Sword or Dramatis Personae.` },
      {
        name: `Hatred (Orcs and Goblins)`,
        text: `The Rememberer, Stubbles, and Axe Hurlers all Hate Orcs and Goblins. This is ignored if the warrior later becomes Immune to Psychology.`,
      },
      {
        name: `Deathwish`,
        text: `Slayers seek an honorable death in combat. Unless stated otherwise, all members of this are completely immune to all psychology and never need to test if fighting alone. This includes Hatred, Frenzy & Stupidity.`,
      },
      {
        name: `Damnable Luck`,
        text: `While Slayers SEEK death, it often eerily avoids them. In the postgame, after rolling for all injuries, you may reroll one result of Death for a single slayer hero or henchman, accepting the second result.`,
      },
      {
        name: `No Armour, No Toys!`,
        text: `Slayers may never use armour of any kind, nor cloaks that provide a constant save bonus (though they may use Lucky Charms). Also, they may not use any missiles that aren't thrown, nor may they learn magic.`,
      },
      {
        name: `Only in Victory`,
        text: `Slayer heroes do NOT gain exploration dice at the end of the battle if they were defeated or routed; they only gain them if they win the scenario, were allied with the winner, or tied. (Does not include the Rememberer)`,
      },
      {
        name: `Record of Valor`,
        text: `If a Slayer hero is taken out of action while the Rememberer was present on the board, you receive +1 Exploration dice in the post-game phase, provided the Slayer was taken out of action directly or indirectly by an enemy or NPC attack (not a self-inflicted or deliberate loss). If a Slayer is somehow brought back to the battlefield, this extra die is lost.`,
      },
      {
        name: `Back-up Records`,
        text: `If your warband includes a Bard Hired Sword, the bard gains the Rememberer ability "Record of Valor"; however, two rememberers do not stack (max 1 exploration die per Slayer taken OOA even if both witness it). This rule merely provides a backup if the Rememberer misses a game or is taken out of action.`,
      },
      {
        name: `Slayer Rites: The Rite of Trollslaying`,
        text: `If a slayer henchman takes an enemy out of action, and it was Large and started the game with multiple wounds, then in the post-game phase the henchman gains enough experience to bring it to the next advancement (or to 16 exp if maxed out), and treat it as if it rolled "That Lad's Got Talent!" If you have 6 heroes already and do not wish to replace an existing hero, you may roll a henchman advance as normal. If promoted, gift it an appropriate title, like Ogreslayer.`,
      },
      {
        name: `Slayer Rites: The Rite of Dragonslaying`,
        text: `If a Slayer takes out a model that is a large or gigantic scaled monster (Hydra, Dragon, Wyvern, Sea Drake, Merwyrm, Turtigon, or a young version of one) which has Skull of Iron and/or 4+ wounds, and is an NPC or rolls a death injury, then in the post-game the slayer may tan the hide and gain a Sea Dragon Cloak for free (provided they don't own one already) — the exception to Slayers never wearing armour. It may not be sold, given away, replaced if lost/stolen except through another Dragonslaying. If the slayer is a henchman, the Rite of Trollslaying also applies; if it can't be promoted, it may wear the item even while remaining a henchman. (Sea Dragon Cloak, from the Lustria Dark Elf warband: Scales — 5+ armour save in close combat, 4+ armour save against missiles.)`,
      },
      {
        name: `Warband Skill: Ferocious Charge`,
        text: `The Slayer may double his attacks on the turn in which he charges. He will suffer a -1 'to hit' penalty on that turn. Slayers Only.`,
      },
      {
        name: `Warband Skill: Monster Slayer`,
        text: `In close combat, the Slayer always wounds any opponent on a roll of 4+, regardless of Toughness, unless his own Strength (after all modifiers) would mean a lower roll is needed. Slayers Only.`,
      },
      { name: `Warband Skill: Berserker`, text: `The Slayer may add +1 to his close combat 'to hit' rolls during the turn in which he charges. Slayers Only.` },
      {
        name: `Warband Skill: Deathblow`,
        text: `If the Hero is taken out of action in hand-to-hand, he may immediately make the remainder of his attacks before being removed, if he hasn't made all of his attacks already this turn. He may use this skill if he is knocked down or stunned. Slayers Only.`,
      },
      {
        name: `Warband Skill: Relentless`,
        text: `If the Hero charges a model but the charge fails, the Hero may still move the full distance of his move. This skill may only be used against enemies within sight or that the Slayer can detect. Slayers Only.`,
      },
      {
        name: `Warband Skill: Axe Mastery`,
        text: `The Hero may reroll all missed attacks if he was using an axe or a dwarven axe in the hand-to-hand phase of the turn that he charges. May not be used with Whirling Blades.`,
      },
      { name: `Warband Skill: Songster`, text: `A Bard's rousing war songs steel the hearts of all those around him. Any friendly model within 6" of a Bard may re-roll any failed Leadership test with a +1 to Leadership, to a max of 10. This includes rout tests. Rememberer only.` },
      { name: `Warband Skill: Song of Honor`, text: `In the postgame, if one or more Slayers in your warband died, all heroes and henchmen gain +1 Experience. Rememberer only.` },
      {
        name: `Special Equipment: Dwarf Axe`,
        text: `Cost: 15 gc · Availability: Rare 8 (Dwarfs only) · Range: Close Combat · Strength: As User · Special Rules: Cutting Edge, Parry. Cutting Edge: an extra -1 save modifier (e.g. S4 gives a -2 save modifier). Parry: the wielder may roll a D6 when his opponent rolls to hit; if the score beats the opponent's highest to-hit score, the blow is parried and discarded. May not parry attacks made with double or more its own Strength. May not parry more than one attack per Close Combat phase; a model with two Dwarf axes (or a Dwarf axe and a sword, etc.) does not get to parry two attacks but may re-roll a failed parry instead.`,
      },
      {
        name: `Special Equipment: Throwing Axe`,
        text: `Cost: 15 gc · Availability: Slayers-Common, (Non-slayers, Rare 5) · Range: 6" · Strength: As User · Special Rules: Thrown Weapon, Axe Thrower. Thrown Weapon: no penalty for throwing over half range, or for moving and shooting. Axe Thrower: heroes armed with Throwing Axes with access to Shooting Skills may learn the skill "Axe Thrower" — throw up to two axes in the shooting phase, both gaining +1 Strength, divided between any targets in range; cannot be combined with Quick Shot or Knife Fighter. Knife Thrower does not allow multiple Throwing Axes.`,
      },
      {
        name: `Special Equipment: Whirling Blades`,
        text: `Cost: 30 gc per pair · Availability: Rare 9 (Slayers only) · Range: Close Combat · Strength: As User · Special Rules: Cannot be parried, Cutting Edge, Pair, Dance of Doom, Whirlwind of Death. Cannot be parried (nor may the target parry with swords or bucklers). Cutting Edge: an extra -1 save modifier. Pair: the off-hand weapon provides an additional attack like normal; the pair may not be split up or combined with a different off-hand weapon. Dance of Doom: on a charge, the main hand grants +1 attack in the first round; on being charged (by one or more opponents), the main hand grants an additional attack (only usable against a charger; still only +1A total if charged by multiple). Whirlwind of Death: when charged, the free attack from Dance of Doom and the additional off-hand attack both gain 'Strike First' for that turn; all other attacks strike at normal speed.`,
      },
    ],
    warbandSkillIds: [`thick_skull`, `true_grit`],
    equipmentLists: [
      {
        id: `dwarf_slayer_cult_slayer`,
        name: `Slayer Hero & Henchman Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace/Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Dwarf Axe`, cost: `15 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
          { name: `Gromril weapon`, cost: `3x cost` },
        ],
        missileWeapons: [{ name: `Throwing Axes`, cost: `15 gc` }],
        armour: [],
      },
      {
        id: `dwarf_slayer_cult_doomseeker`,
        name: `Doomseeker Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace/Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Dwarf Axe`, cost: `15 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
          { name: `Flail`, cost: `15 gc` },
          { name: `Whirling Blades`, cost: `30 gc` },
          { name: `Gromril weapon`, cost: `3x cost` },
        ],
        missileWeapons: [],
        armour: [],
      },
      {
        id: `dwarf_slayer_cult_rememberer`,
        name: `Rememberer Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace/Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Dwarf Axe (Dwarf only)`, cost: `15 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
          { name: `Gromril weapon (Dwarf only)`, cost: `3x cost` },
        ],
        missileWeapons: [
          { name: `Throwing Axes`, cost: `15 gc` },
          { name: `Pistols`, cost: `15 gc / 30 brace` },
          { name: `Crossbow`, cost: `25 gc` },
        ],
        armour: [
          { name: `Light Armour`, cost: `20 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Buckler`, cost: `5 gc` },
        ],
      },
    ],
    heroTemplates: [
      {
        id: `dwarf_slayer_cult_giant_slayer`,
        name: `Giant Slayer`,
        role: `hero`,
        cost: 85,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 3, WS: 5, BS: 4, S: 3, T: 4, W: 1, I: 3, A: 1, Ld: 9 },
        equipmentListId: `dwarf_slayer_cult_slayer`,
        skillTableIds: [`combat`, `shooting`, `academic`, `strength`, `warband-unique`],
        specialRules: [
          { name: `Leader`, text: `Any models in the warband within 6" of the Giant Slayer may use his Leadership instead of their own.` },
          { name: `Dwarf`, text: `See the warband's Dwarf Special Rules.` },
          { name: `Slayer`, text: `See the warband's Slayer Special Rules.` },
        ],
      },
      {
        id: `dwarf_slayer_cult_doomseeker_hero`,
        name: `Doomseeker`,
        role: `hero`,
        cost: 55,
        rosterLimit: `0-2`,
        startingExperience: 8,
        stats: { M: 3, WS: 4, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 9 },
        equipmentListId: `dwarf_slayer_cult_doomseeker`,
        skillTableIds: [`combat`, `strength`, `warband-unique`],
        specialRules: [
          { name: `Dwarf`, text: `See the warband's Dwarf Special Rules.` },
          { name: `Slayer`, text: `See the warband's Slayer Special Rules.` },
        ],
      },
      {
        id: `dwarf_slayer_cult_rememberer_hero`,
        name: `Rememberer`,
        role: `hero`,
        cost: 40,
        rosterLimit: `0-1`,
        startingExperience: 0,
        stats: { M: 3, WS: 3, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 8 },
        equipmentListId: `dwarf_slayer_cult_rememberer`,
        skillTableIds: [`combat`, `shooting`, `academic`, `warband-unique`],
        specialRules: [
          { name: `Dwarf`, text: `See the warband's Dwarf Special Rules.` },
          { name: `Record of Valor`, text: `See the warband's Record of Valor rule.` },
          {
            name: `Rememberer`,
            text: `Once per game, any Slayer Hero fighting against a Large creature or a creature with Toughness 5 or greater, and within 6" of the Rememberer, may re-roll any failed To Hit rolls once only.`,
          },
          {
            name: `Pick up the Slack`,
            text: `If he was not taken out of action, the Rememberer may make a rarity or Dramatis Personae roll for each Slayer hero that was taken out of action this game, in addition to their normal rarity search.`,
          },
          { name: `Not a Slayer`, text: `A Rememberer is not a Slayer, and the slayer rules don't apply. Also, they may not learn "Slayer Only" skills, and may never be warband leader.` },
        ],
      },
    ],
    henchmanTemplates: [
      {
        id: `dwarf_slayer_cult_troll_slayers`,
        name: `Troll Slayers`,
        role: `henchman`,
        cost: 40,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 3, WS: 4, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 9 },
        equipmentListId: `dwarf_slayer_cult_slayer`,
        skillTableIds: [],
        specialRules: [
          { name: `Dwarf`, text: `See the warband's Dwarf Special Rules.` },
          { name: `Slayer`, text: `See the warband's Slayer Special Rules.` },
        ],
      },
      {
        id: `dwarf_slayer_cult_axe_hurlers`,
        name: `Axe Hurlers`,
        role: `henchman`,
        cost: 40,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 3, WS: 3, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 9 },
        equipmentListId: `dwarf_slayer_cult_slayer`,
        skillTableIds: [],
        specialRules: [
          { name: `Dwarf`, text: `See the warband's Dwarf Special Rules.` },
          { name: `Strong Arm`, text: `When throwing weapons, the Axe Hurler may throw the missile extra inches equal to his Strength (e.g. S3 = +3").` },
          {
            name: `Born Marksmen`,
            text: `If an Axe Hurler rolls a "That Lad's Got Talent" as an advancement, he may always choose Shooting skills as one of his two skill list choices, even if there are no heroes with Shooting Skills in the warband. Even with Weapon Mastery, he may not use any missile weapons that aren't thrown.`,
          },
          {
            name: `Skittish`,
            text: `As newly crowned Slayers, Hurlers do not have the skill 'Death Wish', and suffer psychology like normal. When a Hurler gains 'That Lad's Got Talent', instead of making an immediate roll on the Hero Advance Table, he MUST learn the skill 'Death Wish.'`,
          },
        ],
      },
      {
        id: `dwarf_slayer_cult_stubbles`,
        name: `Stubbles`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 3, WS: 3, BS: 2, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 8 },
        equipmentListId: `dwarf_slayer_cult_slayer`,
        skillTableIds: [],
        specialRules: [
          { name: `Dwarf`, text: `See the warband's Dwarf Special Rules.` },
          {
            name: `Skittish`,
            text: `As newly crowned Slayers, Stubbles do not have the skill 'Death Wish', and suffer psychology like normal. When a Stubble gains 'That Lad's Got Talent', instead of making an immediate roll on the Hero Advance Table, he MUST learn the skill 'Death Wish.'`,
          },
        ],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-2a-warbands/dwarf-slayer-cult`,
  },

  // ===================================================================================
  // Grave Robbers
  // ===================================================================================
  {
    id: `grave_robbers`,
    name: `Grave Robbers`,
    grade: `2a`,
    race: `Human`,
    originalSetting: `Sylvania`,
    sourcebook: `Angelic Gobbo (Pawel), with help from Brahm Tazoul and MordainThade (PDF)`,
    raceTraits: [],
    specialRules: [
      { name: `Grave Goods`, text: `Grave Robbers gain +1 Gold Crown for each enemy model taken Out of Action in the Exploration Phase (once per battle).` },
      {
        name: `Shady Reputation`,
        text: `Grave Robber warbands may not hire the following Hired Swords: Bounty Hunter, Roadwarden, Law-Enforcer, Holy Man, or any Follower of Morr.`,
      },
      { name: `Undead Foes`, text: `Grave Robbers hate Undead models.` },
      { name: `Warband Skill: Darkstalker`, text: `The warrior is accustomed to darkness and has almost cat-like sight. Ignores All Alone tests and may double his Initiative when looking for Hidden models.` },
      {
        name: `Warband Skill: Instinctual Violence`,
        text: `Having experienced countless encounters with the Undead, this warrior is hardened to terror. When charged by any Undead models, he does not have to take a Fear test. Additionally, he may nominate one of his attacks to Strike First.`,
      },
      { name: `Warband Skill: De-animator`, text: `The warrior is adept at fighting animated corpses. He ignores the No Pain rule for Undead and may stun them as normal.` },
      { name: `Warband Skill: Hardy Constitution`, text: `Veteran of many grave-robbing escapades, the warrior is completely immune to all diseases and poisons.` },
      {
        name: `Warband Skill: Body Dealer`,
        text: `This warrior is skilled at salvaging the bodies of the dead for profit. On a 4+, you may recover the body (and gear) of a friendly model slain in the Serious Injury phase. You may also attempt to do the same for enemy models by comparing Initiative rolls between the Body Dealer and enemy leader (or their most experienced model). On a tie, nothing is recovered; if the enemy wins, your Body Dealer is captured.`,
      },
      {
        name: `Special Equipment: Hooded Lantern and Rig`,
        text: `Cost: 15 + D6 gold crowns · Availability: Rare 9. Allows a Grave Robber to do his work in private and free-handed whilst provided a source of light. Concealed Light: provides light like a regular Lantern, but removes the visibility for enemy models. Free-hand: allows the Graver free hands with which to ply his trade.`,
      },
      {
        name: `Special Equipment: Pry Bar`,
        text: `Cost: 10 gold crowns · Availability: Grave Robbers only · Range: Close Combat · Strength: As User · Special Rules: Parry. Whilst acting as a club in every sense, the pry bar allows the Graver to parry attacks.`,
      },
      {
        name: `Special Equipment: Surgeon's Journal`,
        text: `Cost: 80 + 4D6 gold crowns · Availability: Rare 11. Written by those who have cut into far too many injured, the Journal provides the Medic with further insight. Skilled Hand: a Medic equipped with the Journal may modify a single dice rolled for Serious Injury for one friendly model by +/- 1 instead of using his Sawbones skill.`,
      },
      {
        name: `Special Equipment: Finger Pendant`,
        text: `Cost: 15 gold crowns · Availability: Grave Robbers only. Death-Ward: gives a one-time 5+ save vs. Necromantic or Dark Arts magic.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `grave_robbers_hero`,
        name: `Hero Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Club`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Shovel (Halberd)`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
          { name: `Pry Bar`, cost: `10 gc` },
        ],
        missileWeapons: [
          { name: `Short Bow`, cost: `5 gc` },
          { name: `Bow`, cost: `10 gc` },
          { name: `Crossbow`, cost: `25 gc` },
        ],
        armour: [
          { name: `Light Armour`, cost: `20 gc` },
          { name: `Heavy Armour`, cost: `50 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Buckler`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
      {
        id: `grave_robbers_henchmen`,
        name: `Henchmen Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Club`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Shovel (Halberd)`, cost: `10 gc` },
        ],
        missileWeapons: [
          { name: `Short Bow`, cost: `5 gc` },
          { name: `Bow`, cost: `10 gc` },
        ],
        armour: [
          { name: `Light Armour`, cost: `20 gc` },
          { name: `Shield`, cost: `5 gc` },
        ],
      },
    ],
    heroTemplates: [
      {
        id: `grave_robbers_graver`,
        name: `Graver`,
        role: `hero`,
        cost: 60,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: `grave_robbers_hero`,
        skillTableIds: [`combat`, `shooting`, `strength`, `speed`, `warband-unique`],
        // TODO: unlike every other Grade 2a warband's "must-have-one" leader hero, the source page
        // does not give the Graver an explicit "Leader" special rule — this looks like a possible
        // omission in the scraped source rather than a deliberate design choice, but nothing is
        // invented here; specialRules is left matching exactly what the source states (none).
        specialRules: [],
      },
      {
        id: `grave_robbers_grave_robber`,
        name: `Grave Robbers`,
        role: `hero`,
        cost: 25,
        rosterLimit: `0-2`,
        startingExperience: 4,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `grave_robbers_hero`,
        skillTableIds: [`combat`, `shooting`, `strength`, `speed`, `warband-unique`],
        specialRules: [],
      },
      {
        id: `grave_robbers_junior_medic`,
        name: `Junior Medic`,
        role: `hero`,
        cost: 40,
        rosterLimit: `0-1`,
        startingExperience: 2,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 6 },
        equipmentListId: `grave_robbers_hero`,
        skillTableIds: [`academic`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Sawbones`, text: `You can re-roll the Serious Injury result for one friendly Hero. The second result stands. You may not use this ability if the Junior Medic was taken Out of Action during the battle.` },
        ],
      },
      {
        id: `grave_robbers_lookout`,
        name: `Lookouts`,
        role: `hero`,
        cost: 15,
        rosterLimit: `0-2`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `grave_robbers_hero`,
        skillTableIds: [`shooting`, `speed`, `warband-unique`],
        specialRules: [],
      },
    ],
    henchmanTemplates: [
      {
        id: `grave_robbers_thugs`,
        name: `Thugs`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `any (bought in groups of 1-5)`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `grave_robbers_henchmen`,
        skillTableIds: [],
        specialRules: [],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-2a-warbands/grave-robbers`,
  },

  // ===================================================================================
  // Halflings
  // ===================================================================================
  {
    id: `halflings`,
    name: `Halflings`,
    grade: `2a`,
    race: `Halfling`,
    originalSetting: `Mordheim`,
    sourcebook: `PDF`,
    raceTraits: [],
    specialRules: [
      { name: `Pretty Much Human`, text: `Halflings are pretty much human and therefore may hire any hired sword available to human mercenaries.` },
      {
        name: `Too Big`,
        text: `Halflings may never use Long bows, Elf Bows, Handguns, Long Rifles or Blunderbusses even if they gain an advance roll that would allow them to do so. Such big weapons aren't built for such tiny hands!`,
      },
      {
        name: `Halfling Items`,
        text: `Halflings do not gain any bonuses from having Halfling items (such as the Halfling Cookbook) because they already know all the knowledge that can be obtained from such things.`,
      },
      {
        name: `Warband Skill: Quiet as a Mouse`,
        text: `The halfling is adept at staying as quiet as a mouse whilst hiding. Enemy warriors must use half their initiative value in inches (rounded down) when trying to detect this hidden halfling.`,
      },
      {
        name: `Warband Skill: Crude Belch`,
        text: `During the first round of hand to hand combat the halfling can release his noxious fumes upon all enemies within base contact. Each affected enemy must take a leadership test or miss his first attack that round.`,
      },
      {
        name: `Warband Skill: Wizened Halfling (leaders only)`,
        text: `All halflings may re-roll any failed leadership test when within 6" of the leader as well as using his leadership for both tests.`,
      },
      {
        name: `Warband Skill: Stealthy (halfling thieves only)`,
        text: `The Halfling Thief can hide even after running, and can run while within 8" of enemy models if he starts and ends his move hidden.`,
      },
      {
        name: `Warband Skill: Skilled Huntsman`,
        text: `A Halfling may try and fire a ranged weapon and remain hidden. When shooting from hiding roll D6; on a 3+ the Halfling remains hidden that turn. May not be combined with black powder weapons.`,
      },
      { name: `Warband Skill: Layers of Fat`, text: `The Halfling always has a basic saving throw of 6 regardless of the enemy warrior's strength, on top of any armour he already wears.` },
      { name: `Warband Skill: Shifty`, text: `The halfling gains a bonus attack when charged that strikes first.` },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `halflings_adventurer`,
        name: `Adventurer Equipment List`,
        meleeWeapons: [
          { name: `Pairing Knife (Dagger) [Halfling Cooks only]`, cost: `1st free/2 gc` },
          { name: `Tenderiser (Hammer) [Halfling Cooks only]`, cost: `3 gc` },
          { name: `Meat Cleaver (Axe) [Halfling Cooks only]`, cost: `5 gc` },
          { name: `Machete (Sword) [Halfling Cooks only]`, cost: `10 gc` },
          { name: `Double-handed weapon [Heroes & Halfling Warriors only]`, cost: `15 gc` },
          { name: `Spear [Heroes & Halfling Warriors only]`, cost: `10 gc` },
        ],
        missileWeapons: [
          { name: `Short Bow`, cost: `5 gc` },
          { name: `Bow [may not be used by Halfling Warriors]`, cost: `10 gc` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Buckler`, cost: `5 gc` },
          { name: `Cooking Pot (Helmet) [Halfling Cooks only]`, cost: `10 gc` },
        ],
      },
      {
        id: `halflings_thief`,
        name: `Halfling Thief Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
        ],
        missileWeapons: [
          { name: `Crossbow Pistol`, cost: `35 gc` },
          { name: `Pistol`, cost: `25 gc (40 for a brace)` },
          { name: `Throwing Knives`, cost: `15 gc` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Buckler`, cost: `5 gc` },
        ],
      },
      {
        id: `halflings_village_ogre`,
        name: `Village Ogre Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
        ],
        missileWeapons: [{ name: `Long Bow`, cost: `15 gc` }],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
      {
        id: `halflings_none`,
        name: `No Equipment (animal)`,
        meleeWeapons: [],
        missileWeapons: [],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: `halflings_elder`,
        name: `Halfling Elder`,
        role: `hero`,
        cost: 60,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 4, WS: 3, BS: 5, S: 3, T: 3, W: 1, I: 5, A: 1, Ld: 9 },
        equipmentListId: `halflings_adventurer`,
        skillTableIds: [`combat`, `shooting`, `academic`, `speed`, `warband-unique`],
        specialRules: [{ name: `Leader`, text: `Any warrior within 6" of the Elder may use his Leadership when taking a Leadership test.` }],
      },
      {
        id: `halflings_cook`,
        name: `Halfling Cook`,
        role: `hero`,
        cost: 35,
        rosterLimit: `0-1`,
        startingExperience: 8,
        stats: { M: 4, WS: 4, BS: 2, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: `halflings_adventurer`,
        skillTableIds: [`strength`, `speed`, `warband-unique`],
        specialRules: [
          {
            name: `Master Chef`,
            text: `Roll a D6 after a battle. On a 5+ the cook has managed to make a little food go a long way, and when selling Treasure or Wyrdstone the warband is considered to be one size lower.`,
          },
        ],
      },
      {
        id: `halflings_thief_hero`,
        name: `Halfling Thief`,
        role: `hero`,
        cost: 30,
        rosterLimit: `0-1`,
        startingExperience: 8,
        stats: { M: 4, WS: 2, BS: 4, S: 2, T: 2, W: 1, I: 5, A: 1, Ld: 8 },
        equipmentListId: `halflings_thief`,
        skillTableIds: [`combat`, `shooting`, `speed`, `warband-unique`],
        specialRules: [
          {
            name: `Infiltrator`,
            text: `He may always be placed on the battlefield after enemy warband(s), anywhere out of sight of the opposing warband and at least 12" away from any enemy model. If more than one model has infiltrate, roll-off to see who places first.`,
          },
          { name: `Pick Locks`, text: `When testing to open a locked door, a Halfling Thief needs only make a successful Initiative test.` },
          { name: `Cutpurse`, text: `If the Halfling Thief took part in a battle and was not taken OOA, the warband gains +1 Treasure on top of what they would normally find.` },
        ],
      },
      {
        id: `halflings_youths`,
        name: `Halfling Youths`,
        role: `hero`,
        cost: 10,
        rosterLimit: `0-2`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 3, S: 2, T: 2, W: 1, I: 4, A: 1, Ld: 7 },
        equipmentListId: `halflings_adventurer`,
        skillTableIds: [`shooting`, `speed`, `warband-unique`],
        specialRules: [],
      },
    ],
    henchmanTemplates: [
      {
        id: `halflings_scouts`,
        name: `Halfling Scouts`,
        role: `henchman`,
        cost: 20,
        rosterLimit: `0-7`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 4, S: 2, T: 2, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: `halflings_adventurer`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `halflings_warriors`,
        name: `Halfling Warriors`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: `halflings_adventurer`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `halflings_piggies`,
        name: `Piggies`,
        role: `henchman`,
        cost: 20,
        rosterLimit: `0-4`,
        startingExperience: 0,
        stats: { M: 5, WS: 4, BS: 0, S: 3, T: 4, W: 1, I: 3, A: 1, Ld: 4 },
        equipmentListId: `halflings_none`,
        skillTableIds: [],
        specialRules: [{ name: `Animals`, text: `Piggies are animals and never gain experience.` }],
      },
      {
        id: `halflings_village_ogre_henchman`,
        name: `Village Ogre`,
        role: `henchman`,
        cost: 140,
        rosterLimit: `0-1`,
        startingExperience: 0,
        stats: { M: 6, WS: 3, BS: 2, S: 4, T: 4, W: 3, I: 3, A: 2, Ld: 7 },
        equipmentListId: `halflings_village_ogre`,
        skillTableIds: [],
        specialRules: [
          { name: `Fear`, text: `Ogre-kin are large and brutish creatures that cause Fear.` },
          { name: `Large`, text: `Ogre-kin are huge, lumbering creatures and therefor make tempting targets for archers. Any target may shoot at an Ogre, even if he is not the closest model.` },
          { name: `Skills`, text: `An Ogre-kin who becomes a Hero may only choose from Combat and Strength skill-lists.` },
          { name: `Slow Witted`, text: `Ogre-kin earn experience at half-rate.` },
          {
            name: `Protective`,
            text: `Once a Village Ogre is purchased, Ogre Bodyguards will not join the warband, and should one have been hired prior to the Village Ogre's arrival, he will move on.`,
          },
        ],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-2a-warbands/halflings`,
  },

  // ===================================================================================
  // Masters of Horror
  // ===================================================================================
  {
    id: `masters_of_horror`,
    name: `Masters of Horror`,
    grade: `2a`,
    race: `Human (with Vampire/Wolfman/Undead servants)`,
    originalSetting: `Mordheim`,
    sourcebook: `(PDF)`,
    raceTraits: [],
    specialRules: [
      { name: `Hired Swords`, text: `Masters of Horror warbands may hire the same Hired Swords as an Undead warband.` },
      { name: `No Promotion`, text: `Neither Zombies nor Flesh Constructs may become Heroes through Lads Got Talent.` },
      { name: `Wolfman Max Stats`, text: `M 6 · WS 4 · BS 3 · S 5 · T 4 · W 3 · I 7 · A 4 · Ld 8.` },
      { name: `Warband Skill: Surgeon`, text: `The Mad Scientist can attempt to operate upon an injured minion. Reroll one dice of a single injury roll. You must accept the second roll.` },
      {
        name: `Warband Skill: Alchemist`,
        text: `The Mad Scientist brews concoctions prior to battle. Roll a D6 at game-start: 1 Potion of Resilience (+1 Toughness for the game); 2 Brew of Strength (+1 Strength for the game); 3–4 Quicksilver (+1 Movement for the game); 5 Backley's Brew (-1 Strength and Initiative until a Toughness test is passed); 6 Aberrantius Vigortia (+1 Strength and Toughness, highly addictive — roll D6 after battle, on 5+ the Scientist becomes addicted and will not engage in any other activity until he has had his potion again, brewing potions until a 6 is rolled).`,
      },
      {
        name: `Warband Skill: Apt Revitalist`,
        text: `The Mad Scientist has gained the ability to recreate life from death. Any zombies within the warband now gain experience as normal human henchmen.`,
      },
      { name: `Warband Skill: Lunatic`, text: `The model causes Fear and may reroll any Leadership Test.` },
      {
        name: `Special Equipment: Chainsaw Sword`,
        text: `Cost: 15 + D6 gc · Availability: Masters of Horror only · Range: Close Combat · Strength: As user · Special Rules: Fear, Shredder. Fear: a model bearing a Chainsaw Sword causes Fear. Shredder: all blows from a Chainsaw Sword are at -2 Armour Save.`,
      },
      {
        name: `Special Equipment: Electric Trident`,
        text: `Cost: 15 + D6 gc · Availability: Masters of Horror only · Range: Close Combat · Strength: As user · Special Rules: Zzap!, Shocking, Nail in Boot. Zzap!: a model wounded by it is considered Stunned on a roll of 2-4. Shocking: on a natural 6 To-Hit followed by a natural 6 To-Wound, the weapon discharges a field 2" around the target, striking all models (save the bearer) with a S3 hit. Nail in Boot: a D6 roll of 1 on the To-Hit roll strikes the bearer with a S3 hit.`,
      },
      {
        name: `Special Equipment: Repeater Pistol`,
        text: `Cost: 25 + 3D6 gc · Availability: Masters of Horror only · Range: 8" · Strength: 4 · Special Rules: -2 Armour Save, Too Much Tinkering, Repeater. Too Much Tinkering: each trigger pull requires a D6 roll — 4+ the pistol fires fine, 2-3 it does nothing, 1 forces a roll on the Misfire Chart. Repeater: may fire more than once per Shooting phase; each additional shot rolls the same table at a cumulative -1 (max 3 shots per round).`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `masters_of_horror_hero`,
        name: `Hero Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Halberd`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
        ],
        missileWeapons: [
          { name: `Bow`, cost: `10 gc` },
          { name: `Short Bow`, cost: `5 gc` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
      {
        id: `masters_of_horror_bitten`,
        name: `Bitten Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
        ],
        missileWeapons: [],
        armour: [{ name: `Shield`, cost: `5 gc` }],
      },
      {
        id: `masters_of_horror_none`,
        name: `No Equipment`,
        meleeWeapons: [],
        missileWeapons: [],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: `masters_of_horror_mad_scientist`,
        name: `Mad Scientist`,
        role: `hero`,
        cost: 60,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: `masters_of_horror_hero`,
        skillTableIds: [`academic`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Leader`, text: `Any models in the warband within 6" of the Mad Scientist may use his Leadership value.` },
          { name: `Immune to Psychology`, text: `Mad Scientists are not affected by psychology (such as fear) due to the shattered state of their minds.` },
        ],
      },
      {
        id: `masters_of_horror_thrall`,
        name: `Thrall`,
        role: `hero`,
        cost: 70,
        rosterLimit: `0-1`,
        startingExperience: 8,
        stats: { M: 5, WS: 3, BS: 3, S: 4, T: 4, W: 1, I: 5, A: 1, Ld: 7 },
        equipmentListId: `masters_of_horror_hero`,
        skillTableIds: [`combat`, `strength`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Cause Fear`, text: `Vampires are terrifying Undead creatures and therefore cause Fear.` },
          { name: `Immune to Psychology`, text: `Vampires are not affected by psychology (such as fear) and never leave combat.` },
          { name: `Immune to Poison`, text: `Vampires are not affected by any poison.` },
          { name: `No Pain`, text: `Vampires treat a Stunned result on the Injury chart as Knocked Down.` },
        ],
      },
      {
        id: `masters_of_horror_wolfman`,
        name: `Wolfman`,
        role: `hero`,
        cost: 65,
        rosterLimit: `0-1`,
        startingExperience: 8,
        stats: { M: 6, WS: 3, BS: 3, S: 4, T: 3, W: 2, I: 2, A: 2, Ld: 7 },
        equipmentListId: `masters_of_horror_none`,
        skillTableIds: [`combat`, `strength`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Cannot Bear Equipment`, text: `A werewolf cannot bear equipment. They attack with tooth and claw, and suffer no penalties for doing so.` },
        ],
      },
      {
        id: `masters_of_horror_hunchbacks`,
        name: `Hunchbacks`,
        role: `hero`,
        cost: 25,
        rosterLimit: `0-2`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `masters_of_horror_hero`,
        skillTableIds: [`combat`, `strength`, `speed`, `warband-unique`],
        specialRules: [],
      },
    ],
    henchmanTemplates: [
      {
        id: `masters_of_horror_zombies`,
        name: `Zombies`,
        role: `henchman`,
        cost: 20,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 0, S: 3, T: 4, W: 1, I: 1, A: 1, Ld: 5 },
        equipmentListId: `masters_of_horror_none`,
        skillTableIds: [],
        specialRules: [
          { name: `Cause Fear`, text: `Zombies are terrifying Undead creatures and therefore cause Fear.` },
          { name: `May not Run`, text: `Zombies are slow Undead creatures and may not run (but may charge normally).` },
          { name: `Immune to Psychology`, text: `Zombies are not affected by psychology.` },
          { name: `Immune to Poison`, text: `Zombies are immune to poisons.` },
          { name: `No Pain`, text: `Zombies treat Stunned results on the Injury table as Knocked Down.` },
          { name: `No Brain`, text: `Zombies do not gain experience.` },
        ],
      },
      {
        id: `masters_of_horror_flesh_construct`,
        name: `Flesh Construct`,
        role: `henchman`,
        cost: 80,
        rosterLimit: `0-1`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 0, S: 4, T: 5, W: 2, I: 2, A: 2, Ld: 6 },
        equipmentListId: `masters_of_horror_none`,
        skillTableIds: [],
        specialRules: [
          { name: `Cause Fear`, text: `Flesh Constructs are terrifying Undead creatures and therefore cause Fear.` },
          { name: `Immune to Psychology`, text: `Flesh Constructs are not affected by psychology.` },
          { name: `Immune to Poison`, text: `Flesh Constructs are immune to poisons.` },
          { name: `No Pain`, text: `Flesh Constructs treat Stunned results as Knocked Down.` },
          {
            name: `A Bit Unhinged`,
            text: `Flesh Constructs do not gain experience normally. They must make a successful Leadership test in order to gain the experience for surviving the game.`,
          },
          {
            name: `It's Only a Flesh Wound`,
            text: `When a Flesh Construct is taken OOA, roll on the Henchmen Injury table as normal. On a roll of 1-2, the player is able to repair the damage for D6x5gc. If the warband is unable to pay immediately, the Construct cannot participate in the next battle; it remains on the roster until abandoned or repaired.`,
          },
          { name: `Cannot Run`, text: `Constructs may still charge normally, but cannot run.` },
        ],
      },
      {
        id: `masters_of_horror_the_bitten`,
        name: `The Bitten`,
        role: `henchman`,
        cost: 40,
        rosterLimit: `0-3`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 4, T: 3, W: 1, I: 4, A: 1, Ld: 6 },
        equipmentListId: `masters_of_horror_bitten`,
        skillTableIds: [],
        specialRules: [
          {
            name: `Transform`,
            text: `Roll a D6 each turn: 1 Madness — the Bitten suffers Stupidity this turn (if Transformed, reverts to human form); 2 to 5 — act as normal; 6 Transformed — the Bitten gains Frenzy and Sprint, lasting until a 1 is rolled, casting off all equipment (save a dagger) and fighting unarmed with no penalty; Transformed models do not roll again while in combat.`,
          },
        ],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-2a-warbands/masters-of-horror`,
  },

  // ===================================================================================
  // Mazzalupo
  // ===================================================================================
  {
    id: `mazzalupo`,
    name: `Mazzalupo`,
    grade: `2a`,
    race: `Human (Tilean)`,
    originalSetting: `Mordheim`,
    sourcebook: `Mordheim Italia PDF, Version V3.5`,
    raceTraits: [],
    specialRules: [
      { name: `Hired Swords`, text: `The Mazzalupo can hire the same types of Hired Swords and dramatis personae as the Mercenary warbands.` },
      {
        name: `Special Equipment: Bearcloak`,
        text: `Cost: 10 gc · Availability: Special. To acquire a bearcloak, a Sheepherder must pay 10 gc and roll equal to or under his Strength on a D6; if successful, he slays the bear and can wear its cloak. Sheepherders may buy bearcloaks when starting their warband without making an availability test. A model wearing a bearcloak gains +1 to their armour saves against all shooting attacks.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `mazzalupo_knight_noble`,
        name: `Wandering Knight and Fallen Noble Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Morning Star`, cost: `15 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
          { name: `Halberd`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Lance`, cost: `20 gc` },
        ],
        missileWeapons: [],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Heavy armour`, cost: `50 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Buckler`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Horse (Fallen nobles only if the Captain is mounted)`, cost: `40 gc` },
        ],
      },
      {
        id: `mazzalupo_finance_squire`,
        name: `Master of Finances and Squire Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
        ],
        missileWeapons: [
          { name: `Crossbow`, cost: `25 gc` },
          { name: `Bow`, cost: `10 gc` },
          { name: `Short bow`, cost: `5 gc` },
          { name: `Sling`, cost: `2 gc` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Heavy armour`, cost: `50 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Buckler`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
      {
        id: `mazzalupo_sheepherder_churl`,
        name: `Sheepherder and Churl Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Morning Star`, cost: `15 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
          { name: `Spear`, cost: `10 gc` },
        ],
        missileWeapons: [
          { name: `Crossbow`, cost: `25 gc` },
          { name: `Short bow`, cost: `5 gc` },
          { name: `Sling`, cost: `2 gc` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Bearcloak`, cost: `10 gc` },
        ],
      },
      {
        id: `mazzalupo_none`,
        name: `No Equipment (animal)`,
        meleeWeapons: [],
        missileWeapons: [],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: `mazzalupo_wandering_knight`,
        name: `Wandering Knight`,
        role: `hero`,
        cost: 70,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: `mazzalupo_knight_noble`,
        skillTableIds: [`combat`, `strength`, `speed`],
        specialRules: [
          { name: `Leader`, text: `Any models in the warband within 6" of the Wandering knight may use the Wandering knight's Leadership instead of their own.` },
          { name: `Riding (horse)`, text: `The Wandering knight has the Riding (horses) skill.` },
          {
            name: `Commands`,
            text: `During the recovery phase, if the Wandering knight is not knocked down, stunned, or out of action, he may shout a Command instead of running. Commands affect friendly models within 6" that can hear him (not stunned or knocked down); models may only benefit from one Command per turn. He knows one Command at creation and can acquire others the same way new spells are learned. Animals, allies, dramatis personae, and hired swords cannot be targeted by Commands. Unless explicitly specified, the Wandering knight is not affected by his own Commands. The Wandering knight does not count as a wizard and Commands do not count as spells, but are cast following the rules for Magic. If the Wandering knight dies, the new warband Captain gains the Commands ability starting with a random Command.`,
          },
          {
            name: `Command: Raise Our Insignia!`,
            text: `Difficulty 6. Can only be issued to the Squire if within 12" and not fleeing/knocked down/stunned/OOA. Until the beginning of the next Shooting phase, every model of the Mazzalupo warband (including the Wandering knight) with line of sight to the Squire can reroll failed Leadership tests, including the warband's Rout test.`,
          },
          {
            name: `Command: Move, Ye Miscreant!`,
            text: `Difficulty 6. A single Mazzalupo warrior within 6" of the Wandering knight may immediately move again up to its maximum Movement distance; if this brings them into base contact with an enemy, they count as charging.`,
          },
          {
            name: `Command: Follow Me, Mine Pugnacious Ones!`,
            text: `Difficulty 8. Members of the Mazzalupo warband within 4" of the Wandering knight gain +1 to hit in hand-to-hand combat until the end of the turn.`,
          },
          {
            name: `Command: Be On Guard, My Brave Ones!`,
            text: `Difficulty 7. Choose a member of the Mazzalupo warband within 12" engaged in hand-to-hand combat; that model can immediately move away from the combat up to its maximum Movement, but cannot come into contact with other enemy models.`,
          },
          {
            name: `Command: Pay Them No Heed!`,
            text: `Difficulty 6. Choose a Mazzalupo model within 12"; until the next Shooting phase it can target any enemy warrior even if not the closest.`,
          },
          {
            name: `Command: Art Thou Ready to Die Fighting?`,
            text: `Difficulty 8. Every Mazzalupo model within 4" (including the Wandering knight) can only be taken out of action on a roll of 6 until the next Mazzalupo turn.`,
          },
        ],
      },
      {
        id: `mazzalupo_fallen_noble`,
        name: `Fallen Noble`,
        role: `hero`,
        cost: 40,
        rosterLimit: `0-2`,
        startingExperience: 8,
        stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `mazzalupo_knight_noble`,
        skillTableIds: [`combat`, `academic`, `strength`, `speed`],
        specialRules: [
          { name: `Indolent`, text: `Fallen nobles can never be the target of a Wandering knight's Commands.` },
          { name: `Riding (horse)`, text: `The Fallen nobles have the Riding (horses) skill.` },
          {
            name: `Ye Give Way`,
            text: `When charging a Hero, the Fallen noble may challenge the target to yield the way. If refused, the Fallen Noble cannot charge that model but may continue their turn (even declaring a new challenge); the model who refused suffers -1 to hit in hand-to-hand combat, non-cumulative, until end of game. If accepted, combat proceeds normally with no other warrior able to join, though both models may still suffer area effects/spells. If the Fallen Noble puts the challenged opponent out of action, they gain +1 to hit in hand-to-hand and +1 S, non-cumulative, until end of game.`,
          },
        ],
      },
      {
        id: `mazzalupo_master_of_finances`,
        name: `Master of Finances`,
        role: `hero`,
        cost: 25,
        rosterLimit: `0-1`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `mazzalupo_finance_squire`,
        skillTableIds: [`shooting`, `academic`],
        specialRules: [
          {
            name: `Corruption`,
            text: `When hit in close combat but before rolling to wound, the Mazzalupo player can give 5 gold crowns to the opponent for each model that hit the Master of finances; the corrupted model must reroll a successful attack roll. Each model cannot reroll more than one attack this way, but multiple models can be bribed. Models immune to Psychology cannot be corrupted.`,
          },
          { name: `Haggle`, text: `The Master of finances has the Haggle skill.` },
        ],
      },
      {
        id: `mazzalupo_squire`,
        name: `Squire`,
        role: `hero`,
        cost: 20,
        rosterLimit: `0-1`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 6 },
        equipmentListId: `mazzalupo_finance_squire`,
        skillTableIds: [`combat`, `shooting`, `speed`],
        specialRules: [
          {
            name: `Petty Thief`,
            text: `If, at the end of the game, the Squire was not taken out of action, roll 1D6. On a result of 5+, subtract one Wyrdstone shard from a randomly determined opposing warband and add it to your reserve.`,
          },
        ],
      },
    ],
    henchmanTemplates: [
      {
        id: `mazzalupo_sheepherders`,
        name: `Sheepherders`,
        role: `henchman`,
        cost: 30,
        rosterLimit: `0-2`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 4, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `mazzalupo_sheepherder_churl`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `mazzalupo_churl`,
        name: `Churl`,
        role: `henchman`,
        cost: 20,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 6 },
        equipmentListId: `mazzalupo_sheepherder_churl`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `mazzalupo_black_sheep`,
        name: `Black Sheep`,
        role: `henchman`,
        cost: 10,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 6, WS: 2, BS: 0, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 4 },
        equipmentListId: `mazzalupo_none`,
        skillTableIds: [],
        specialRules: [
          { name: `Stupidity`, text: `A Black sheep is subject to stupidity unless a Sheepherder is within 6" of it.` },
          { name: `Animals`, text: `Black sheep are animals and do not gain experience.` },
          {
            name: `Butcher's Meat`,
            text: `Black sheep can be ignored by the opponent when determining the closest target in the Shooting phase. Mazzalupo warriors can shoot at enemy models if they are engaged in hand-to-hand combat exclusively against Black sheep, randomly determining which engaged model is hit.`,
          },
          { name: `Mountain Animals`, text: `Black sheep can climb up and down following normal rules despite being animals.` },
        ],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-2a-warbands/mazzalupo`,
  },

  // ===================================================================================
  // Necrarchs, the Soul Stealers
  // ===================================================================================
  {
    id: `necrarchs_the_soul_stealers`,
    name: `Necrarchs, the Soul Stealers`,
    grade: `2a`,
    race: `Vampire (Necrarch bloodline) and Undead servants`,
    originalSetting: `Mordheim`,
    sourcebook: `PDF`,
    raceTraits: [],
    specialRules: [
      {
        name: `Death of the Leader`,
        text: `Should the Necrarch perish, the Thrall shall pick up the mantle of Leader and all conferred bonuses shall be transferred to him. He may immediately roll on the spell list for one spell. You cannot hire another Necrarch, but you may create another Thrall from your current list of Acolyte Heroes; they retain their current stat-line but gain the benefits of being undead (Immune to Poison & Psychology, causes Fear & suffers No Pain). Should both Necrarch and Thrall be destroyed at once, the evil magics that bind the warband together fade, and all turns to dust.`,
      },
      { name: `Racial Maximum (Necrarch Vampire)`, text: `M 6 · WS 4 · BS 4 · S 6 · T 6 · W 4 · I 9 · A 3 · Ld 10.` },
      {
        name: `Special Equipment: Staff of Damnation`,
        text: `Cost: 25 gc · Availability: Necrarch only · Range: Close Combat · Strength: As user · Special Rules: Two-Handed, Magic-well. Two-Handed: may not use a shield, buckler or secondary weapon in close combat (still gets +1 armour save vs shooting with a shield). Magic-well: a Necrarch Vampire may cast a spell into the Staff during his Magic phase instead of casting normally; on a successful casting the spell is stored and may be released during a later shooting phase in lieu of casting another spell.`,
      },
      {
        name: `Special Equipment: Damned Book`,
        text: `Cost: 45 + 3D6 gc · Availability: Rare 11. Penned in the blood of elven maidens and written upon the flesh of virgins, the Damned Book perverts space about it. Cursed Aura: a model bearing the Damned Book causes all enemy models within 2 inches to suffer a -1 penalty to hit in close combat.`,
      },
      {
        name: `Warband Skill: Pupil of Nagash`,
        text: `The Necrarch Vampire may roll immediately on the Scrolls of Nagash for a spell, and choose to do so again instead of a future Skill.`,
      },
      { name: `Warband Skill: Master of the Black Arts`, text: `The range of all the Necrarch's magical workings is extended by half-again.` },
      {
        name: `Warband Skill: Pull of Undeath`,
        text: `As long as the Necrarch is within 4 inches of an undead henchman, they may only be taken Out of Action on a roll of a natural 6. Available only to the Leader.`,
      },
      {
        name: `Unidentified Item: Unholy Relic`,
        text: `Listed among Hero Miscellaneous Equipment at 15 gc, but the source page does not provide separate rule text for it beyond the cost listing.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `necrarchs_hero`,
        name: `Hero Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Halberd`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
        ],
        missileWeapons: [
          { name: `Bow`, cost: `10 gc` },
          { name: `Short Bow`, cost: `5 gc` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
      {
        id: `necrarchs_henchmen`,
        name: `Henchmen Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
        ],
        missileWeapons: [{ name: `Bow`, cost: `10 gc` }],
        armour: [{ name: `Shield`, cost: `5 gc` }],
      },
      {
        id: `necrarchs_none`,
        name: `No Equipment`,
        meleeWeapons: [],
        missileWeapons: [],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: `necrarchs_necrarch_vampire`,
        name: `Necrarch Vampire`,
        role: `hero`,
        cost: 110,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 6, WS: 3, BS: 3, S: 4, T: 4, W: 2, I: 6, A: 1, Ld: 8 },
        equipmentListId: `necrarchs_hero`,
        skillTableIds: [`academic`, `strength`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Leader`, text: `Any models in the warband within 6 inches of the Necrarch Vampire may use his Leadership instead of their own.` },
          { name: `Cause Fear`, text: `Vampires are terrifying Undead creatures and thus cause Fear.` },
          { name: `Wizard`, text: `Necrarch Vampires have one spell randomly generated from the Necromancy spell list.` },
          { name: `Immune to Psychology`, text: `Vampires are not affected by psychology (such as fear) and never leave combat.` },
          { name: `Immune to Poison`, text: `Vampires are not affected by any poison.` },
          { name: `No Pain`, text: `Vampires treat a Stunned result on the Injury chart as Knocked Down.` },
          {
            name: `Spell: Soulcage`,
            text: `Difficulty 9. Choose a model within 6"; all wounds are transferred to this model at +1 to the Injury Roll. A natural 6 on the Injury chart removes the Soulcaged model from action and Stuns the caster. Only one Soulcage spell may be in effect at a time.`,
          },
          {
            name: `Spell: Black Breath`,
            text: `Difficulty 8. Range 8", hits the first model within its path: 2 S4 hits on its target and one S3 hit on all models within 2".`,
          },
          {
            name: `Spell: Servants Eternal`,
            text: `Difficulty Auto. Must be cast before the game and only once; summons D3 Zombies to the caster's side that do not count towards the warband's maximum size (they turn to dust after the battle).`,
          },
          {
            name: `Spell: Fear of the Ages`,
            text: `Difficulty 9. All enemy models within 4" of the caster suffer a S3 hit, no armour saves allowed. Servants of Morr, Sigmar and Ulric suffer a S4 hit instead.`,
          },
          {
            name: `Spell: Wall of Despair`,
            text: `Difficulty 6. The caster is immune to all spells and prayers. Roll each turn during the Recovery Phase — on a 1 or 2 the Wall of Despair disappears.`,
          },
          {
            name: `Spell: Claws of Nagash`,
            text: `Difficulty 10. Grants the caster +1 Weapon Skill and Frenzy. Test each turn during the Recovery Phase — on a 2 or less the Claws of Nagash vanish.`,
          },
        ],
      },
      {
        id: `necrarchs_thrall`,
        name: `Thrall`,
        role: `hero`,
        cost: 60,
        rosterLimit: `0-1`,
        startingExperience: 8,
        stats: { M: 5, WS: 3, BS: 3, S: 4, T: 4, W: 1, I: 5, A: 1, Ld: 7 },
        // Note: the source skill table marks the Thrall's Special column "✓/*" rather than a plain
        // check — full Special-skill access appears tied to Pull of Undeath's "Available only to
        // the Leader" caveat (the Thrall only leads if the Necrarch has died). warband-unique is
        // still included here since the source table does check the column for the base Thrall row.
        equipmentListId: `necrarchs_hero`,
        skillTableIds: [`academic`, `strength`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Cause Fear`, text: `Vampires are terrifying Undead creatures and therefore cause Fear.` },
          { name: `Immune to Psychology`, text: `Vampires are not affected by psychology (such as fear) and never leave combat.` },
          { name: `Immune to Poison`, text: `Vampires are not affected by any poison.` },
          { name: `No Pain`, text: `Vampires treat a Stunned result on the Injury chart as Knocked Down.` },
        ],
      },
      {
        id: `necrarchs_acolytes`,
        name: `Acolytes`,
        role: `hero`,
        cost: 35,
        rosterLimit: `0-3`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `necrarchs_henchmen`,
        skillTableIds: [`academic`, `speed`],
        specialRules: [
          {
            name: `Vassal`,
            text: `As long as the Necrarch has line of sight to an Acolyte, and the Acolyte is not engaged in hand-to-hand combat, he may use it as a casting point for a spell. Upon a critical failure of a casting (rolling double 1's), regardless of skills such as Mind Focus, the Acolyte must roll on the Injury table and add +1.`,
          },
        ],
      },
    ],
    henchmanTemplates: [
      {
        id: `necrarchs_skeletal_warriors`,
        name: `Skeletal Warriors`,
        role: `henchman`,
        cost: 20,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 5 },
        equipmentListId: `necrarchs_henchmen`,
        skillTableIds: [],
        specialRules: [
          { name: `Cause Fear`, text: `Skeletal Warriors are terrifying Undead creatures and therefore cause Fear.` },
          { name: `May not Run`, text: `Skeletal Warriors are slow Undead creatures and may not run (but may charge normally).` },
          { name: `Immune to Psychology`, text: `Skeletal Warriors are not affected by psychology.` },
          { name: `Immune to Poison`, text: `Skeletal Warriors are immune to poisons.` },
          { name: `No Pain`, text: `Skeletal Warriors treat Stunned results as Knocked Down.` },
          { name: `No Brain`, text: `Skeletal Warriors do not gain experience.` },
        ],
      },
      {
        id: `necrarchs_zombies`,
        name: `Zombies`,
        role: `henchman`,
        cost: 15,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 0, S: 3, T: 3, W: 1, I: 1, A: 1, Ld: 5 },
        equipmentListId: `necrarchs_none`,
        skillTableIds: [],
        specialRules: [
          { name: `Cause Fear`, text: `Zombies are terrifying Undead creatures and therefore cause Fear.` },
          { name: `May not Run`, text: `Zombies are slow Undead creatures and may not run (but may charge normally).` },
          { name: `Immune to Psychology`, text: `Zombies are not affected by psychology.` },
          { name: `Immune to Poison`, text: `Zombies are immune to poisons.` },
          { name: `No Pain`, text: `Zombies treat Stunned results on the Injury table as Knocked Down.` },
          { name: `No Brain`, text: `Zombies do not gain experience.` },
        ],
      },
      {
        id: `necrarchs_abomination`,
        name: `Abomination`,
        role: `henchman`,
        cost: 190,
        rosterLimit: `0-1`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 0, S: 4, T: 5, W: 3, I: 2, A: 3, Ld: 5 },
        equipmentListId: `necrarchs_none`,
        skillTableIds: [],
        specialRules: [
          { name: `Cause Fear`, text: `Abominations are terrifying Undead creatures and thus cause Fear.` },
          { name: `Immune to Psychology`, text: `Abominations are not affected by psychology.` },
          { name: `Immune to Poison`, text: `Abominations are immune to poisons.` },
          { name: `No Pain`, text: `Abominations treat Stunned results as Knocked Down.` },
          { name: `Large Target`, text: `Abominations are Large Targets as defined in the shooting rules.` },
          {
            name: `Powered`,
            text: `A Necrarch has placed a shard of wyrdstone in the Abomination to bring it life. Should the Abomination be removed from combat, the model who took it down receives a shard of wyrdstone; a new shard is then needed to re-animate the Abomination.`,
          },
          { name: `Spare Parts`, text: `Abominations ignore rolls of 1&2 on the post battle Injury Table; they cannot be destroyed.` },
        ],
      },
      {
        id: `necrarchs_waifs`,
        name: `Waifs`,
        role: `henchman`,
        cost: 20,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `necrarchs_henchmen`,
        skillTableIds: [],
        specialRules: [],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-2a-warbands/necrarchs-the-soul-stealers`,
  },

  // ===================================================================================
  // Nipponese Expedition
  // ===================================================================================
  {
    id: `nipponese_expedition`,
    name: `Nipponese Expedition`,
    grade: `2a`,
    race: `Human (Nipponese)`,
    originalSetting: `Mordheim`,
    sourcebook: `PDF, Author: Krakatoa (SoCal Mordheim)`,
    raceTraits: [],
    specialRules: [
      { name: `May Hire`, text: `A Nippon warband is allowed the same selection of Hired Swords as Human Mercenary warbands.` },
      { name: `Strategic Minded`, text: `A Nipponese warband must rely on its battlefield experience so far from home. They may choose to rout after suffering 1 fewer casualty than normal.` },
      {
        name: `Warband Skill: Death Before Dishonor`,
        text: `Once per game: if this model would be removed from the battlefield as the result of a close combat attack, before removing it make a single close combat attack with them as normal.`,
      },
      {
        name: `Warband Skill: Night Fighter`,
        text: `Shinobi only. This model is able to run while remaining hidden, as per hiding rules.`,
      },
      {
        name: `Warband Skill: Iaijutsu`,
        text: `When this model is charged they gain +1A that they may only use against the charger; this additional attack will 'strike first'. If simultaneously charged by two or more opponents they still only receive a total of +1A. These attacks are resolved at the Strength value of the model, with no further modifiers.`,
      },
      {
        name: `Warband Skill: Last Stand`,
        text: `If this model would normally take an all-alone test, it may be re-rolled. In addition, at the start of this model's turn, if it is 6" away from friendly models, it can choose to have +1 to WS or BS until the start of its next turn.`,
      },
      {
        name: `Warband Skill: Tea Ceremony`,
        text: `After a battle, if this hero survives and did not go out of action, they can forgo searching for rare items and spend 10 gold crowns; choose any other hero and roll a D6 — on a 3+ the chosen hero gains an Experience point.`,
      },
      {
        name: `Warband Skill: Blessed by the Kami`,
        text: `When rolling on the Heroes Serious Injury chart for this Hero after a game in which he has been taken out of action, the dice may be re-rolled once; the second result must be accepted, even if worse.`,
      },
      {
        name: `Special Equipment: Kanabo`,
        text: `Cost: 15 gc · Availability: Common · Range: Close Combat · Strength: As user +1 · Special Rules: Two-handed, Concussion. Two-handed: may not use a shield, buckler or additional weapon in close combat (still +1 armour save vs shooting with a shield). Concussion: a roll of 2-4 is treated as stunned when rolling injuries.`,
      },
      {
        name: `Special Equipment: Sashimono`,
        text: `Cost: 15 gc · Availability: Common. A model wearing a Sashimono can re-roll all non-rout related leadership checks but must keep the second roll.`,
      },
      {
        name: `Special Equipment: Horo`,
        text: `Cost: 10 gc · Availability: Rare 6. A model wearing a horo receives +1 to all armour saves (6+ if no armour is worn) against ranged weapons, as long as they are mounted on a horse or warhorse.`,
      },
      {
        name: `Special Equipment: Kusarigama`,
        text: `Cost: 20 gc · Availability: Rare 8 · Range: Close Combat · Strength: As user · Special Rules: Two-handed, Cannot be parried, Chain Strike. Two-handed: may not use a shield, buckler or additional weapon in close combat (still +1 armour save vs shooting with a shield). Cannot be parried: attackers may not parry with a sword or buckler. Chain Strike: a model not engaged in combat with a Kusarigama can force enemies who fail a charge against them, or friendlies within 3", to become knocked down.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `nipponese_warrior`,
        name: `Nippon Warrior Equipment List`,
        meleeWeapons: [
          { name: `Tanto (Dagger)`, cost: `1st free/2 gc` },
          { name: `Wakizashi (Sword)`, cost: `10 gc` },
          { name: `Katana`, cost: `20 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
          { name: `Yari (Spear)`, cost: `10 gc` },
          { name: `Naginata (Halberd)`, cost: `10 gc` },
          { name: `Kanabo`, cost: `15 gc` },
        ],
        missileWeapons: [
          { name: `Hankyu (Short Bow)`, cost: `5 gc` },
          { name: `Yumi (Bow)`, cost: `10 gc` },
          { name: `Crossbow`, cost: `25 gc` },
          { name: `Teppo (Handgun)`, cost: `35 gc` },
        ],
        armour: [
          { name: `Light Armour`, cost: `20 gc` },
          { name: `Heavy Armour`, cost: `50 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Sashimono`, cost: `15 gc` },
        ],
      },
      {
        id: `nipponese_noble`,
        name: `Nippon Noble Equipment List`,
        meleeWeapons: [
          { name: `Tanto (Dagger)`, cost: `1st free/2 gc` },
          { name: `Wakizashi (Sword)`, cost: `10 gc` },
          { name: `Katana`, cost: `20 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
          { name: `Yari (Spear)`, cost: `10 gc` },
          { name: `Naginata (Halberd)`, cost: `10 gc` },
          { name: `Kanabo`, cost: `15 gc` },
          { name: `Nagamaki (Cathayan Longsword)`, cost: `75 gc` },
        ],
        missileWeapons: [
          { name: `Hankyu (Short Bow)`, cost: `5 gc` },
          { name: `Yumi (Bow)`, cost: `10 gc` },
          { name: `Crossbow`, cost: `25 gc` },
          { name: `Teppo (Handgun)`, cost: `35 gc` },
          { name: `Pistol`, cost: `15 gc (30 for a brace)` },
        ],
        armour: [
          { name: `Light Armour`, cost: `20 gc` },
          { name: `Heavy Armour`, cost: `50 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Sashimono`, cost: `15 gc` },
          { name: `Horo`, cost: `10 gc` },
          { name: `Barding`, cost: `30 gc` },
        ],
      },
      {
        id: `nipponese_shinobi`,
        name: `Shinobi Equipment List`,
        meleeWeapons: [
          { name: `Tanto (Dagger)`, cost: `1st free/2 gc` },
          { name: `Wakizashi (Sword)`, cost: `10 gc` },
          { name: `Katana`, cost: `20 gc` },
          { name: `Yari (Spear)`, cost: `10 gc` },
          { name: `Kusarigama`, cost: `20 gc` },
          { name: `Fighting Claws`, cost: `35 gc` },
          { name: `Sai (Sword Breaker)`, cost: `30 gc` },
        ],
        missileWeapons: [
          { name: `Shuriken (Throwing Stars)`, cost: `15 gc` },
          { name: `Blow Pipe`, cost: `25 gc` },
          { name: `Hankyu (Short Bow)`, cost: `5 gc` },
          { name: `Yumi (Bow)`, cost: `10 gc` },
          { name: `Crossbow`, cost: `25 gc` },
        ],
        armour: [],
      },
      {
        id: `nipponese_warrior_monk`,
        name: `Warrior Monk Equipment List`,
        meleeWeapons: [
          { name: `Tanto (Dagger)`, cost: `1st free/2 gc` },
          { name: `Wakizashi (Sword)`, cost: `10 gc` },
          { name: `Katana`, cost: `20 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
          { name: `Yari (Spear)`, cost: `10 gc` },
          { name: `Naginata (Halberd)`, cost: `10 gc` },
          { name: `Kanabo`, cost: `15 gc` },
        ],
        missileWeapons: [{ name: `Yumi (Bow)`, cost: `10 gc` }],
        armour: [
          { name: `Light Armour`, cost: `20 gc` },
          { name: `Sashimono`, cost: `15 gc` },
        ],
      },
    ],
    heroTemplates: [
      {
        id: `nipponese_hatamoto`,
        name: `Hatamoto`,
        role: `hero`,
        cost: 60,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: `nipponese_noble`,
        // Note: the source labels this warband's skill table "halfling skill table" — an evident
        // copy-paste artifact on the source page, reproduced here only as a note; the table's own
        // checkmarks (all six columns for Hatamoto) are what's mapped below.
        skillTableIds: [`combat`, `shooting`, `academic`, `strength`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Leader`, text: `Any warrior within 6" of the Hatamoto may use his Leadership when taking a Leadership test.` },
          { name: `Ride`, text: `The Hatamoto has the Ride skill as detailed in the Blazing Saddles article.` },
        ],
      },
      {
        id: `nipponese_vim_to_mage`,
        name: `Vim-To Mage`,
        role: `hero`,
        cost: 45,
        rosterLimit: `0-1`,
        startingExperience: 8,
        stats: { M: 4, WS: 3, BS: 2, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 7 },
        // TODO: the Vim-To Mage's own "Tenants of the Order" vow of poverty restricts it to only a
        // walking staff (club) and a dagger — no dedicated equipment list table exists for it on
        // the source page, so equipmentListId points at the general Warrior list, overridden by
        // the specialRules text below.
        equipmentListId: `nipponese_warrior`,
        skillTableIds: [`academic`, `speed`, `warband-unique`],
        specialRules: [
          {
            name: `Tenants of the Order`,
            text: `The Order of the Vim-To strictly enforces a vow of Poverty, meaning with the exception of a walking staff (club) and a dagger the Vim-To Mage may never have any equipment.`,
          },
          {
            name: `Arcane Vim-Toist`,
            text: `This model is the spiritual and magical leader of the Nippon Warband; they can cast Vim-Toist Magic (Arabian Elemental Magic) and start the game with one spell from this discipline learned.`,
          },
        ],
      },
      {
        id: `nipponese_shinobi_hero`,
        name: `Shinobi`,
        role: `hero`,
        cost: 70,
        rosterLimit: `0-1`,
        startingExperience: 15,
        stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 7 },
        equipmentListId: `nipponese_shinobi`,
        skillTableIds: [`combat`, `shooting`, `speed`, `warband-unique`],
        specialRules: [
          {
            name: `Infiltration`,
            text: `Always placed on the battlefield after the opposing warband, anywhere out of sight of the opposing warband and more than 12" away from any enemy model. If both players have infiltrating models, roll a D6 for each; the lowest roll sets up first.`,
          },
          { name: `Loner`, text: `Shinobi may never become the leader of the warband.` },
        ],
      },
      {
        id: `nipponese_retainers`,
        name: `Retainers`,
        role: `hero`,
        cost: 40,
        rosterLimit: `0-2`,
        startingExperience: 8,
        stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `nipponese_noble`,
        skillTableIds: [`combat`, `shooting`, `speed`, `warband-unique`],
        specialRules: [{ name: `Ride`, text: `A Retainer has the Ride skill as detailed in the Blazing Saddles article.` }],
      },
    ],
    henchmanTemplates: [
      {
        id: `nipponese_ashigaru`,
        name: `Ashigaru`,
        role: `henchman`,
        cost: 20,
        rosterLimit: `any (bought in groups of 1-5)`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 6 },
        equipmentListId: `nipponese_warrior`,
        skillTableIds: [],
        specialRules: [
          {
            name: `Wall of Steel`,
            text: `If wielding a spear you may choose to wield it two-handed, in which case the spear gains the parry special rule.`,
          },
        ],
      },
      {
        id: `nipponese_onnabushi`,
        name: `Onnabushi`,
        role: `henchman`,
        cost: 30,
        rosterLimit: `0-2`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `nipponese_warrior`,
        skillTableIds: [],
        specialRules: [
          {
            name: `Wardens of the Castle`,
            text: `While inside buildings or ruins, Onnabushi gain the fear ability. It's a good idea to define which bits of terrain count as 'buildings or ruins' at the start of a battle to avoid confusion later.`,
          },
        ],
      },
      {
        id: `nipponese_warrior_monks`,
        name: `Warrior Monks`,
        role: `henchman`,
        cost: 30,
        rosterLimit: `0-3`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 7 },
        equipmentListId: `nipponese_warrior_monk`,
        skillTableIds: [],
        specialRules: [],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-2a-warbands/nipponese-expedition`,
  },

  // ===================================================================================
  // Ogre Hunting Party
  // ===================================================================================
  {
    id: `ogre_hunting_party`,
    name: `Ogre Hunting Party`,
    grade: `2a`,
    race: `Ogre and Gnoblar`,
    originalSetting: `Mountains of the East / Empire Fringe`,
    sourcebook: `Dave "StyrofoamKing" Seidman-Joria and Catferret (PDF), Version V1.3`,
    raceTraits: [],
    specialRules: [
      {
        name: `Greenskins`,
        text: `Unlike Goblins, Gnoblars do not tend to work closely with Orcs. However, for all intents and purposes, they count as 'Greenskins'. They do not suffer Animosity, but suffer the Bicker rule instead.`,
      },
      {
        name: `Bicker`,
        text: `At the start of your turn, at the end of the Recovery phase, roll 1D6 for each Gnoblar henchman that is not in combat: on a roll of 1, it does nothing but issue insults at the nearest Gnoblar and may not move, shoot, or cast magic this turn. Once a Gnoblar henchman gains "That Lad's Got Talent", he loses the Bicker rule.`,
      },
      {
        name: `Ideas Above Their Station`,
        text: `If the Ogre Hunter is killed, the Gnoblar with the highest leadership takes over as leader (or, if tied, the Gnoblar with the highest experience). A replacement Ogre Hunter may be purchased, in which case he becomes the new leader.`,
      },
      {
        name: `Distasteful Company`,
        text: `Ogre Hunter warbands may only hire the following hired swords: Hobgoblin Scout, Gnoblar Botcher and Ninja Gnoblar. If your warband does not contain an Ogre Hunter for any reason, you may hire an Ogre Bodyguard and/or Ogre Slaver — however, if you rehire another Ogre Hunter, all other Ogres must leave the warband.`,
      },
      {
        name: `Characteristic Increase`,
        text: `Characteristics for warriors may not be increased beyond the following maximum limits. Ogre: M 6 · WS 6 · BS 4 · S 5 · T 5 · W 5 · I 4 · A 5 · Ld 9. Gnoblar: M 4 · WS 5 · BS 6 · S 3 · T 4 · W 3 · I 6 · A 4 · Ld 7.`,
      },
      {
        name: `Warband Skill: Crude Belch`,
        text: `A Hero with this 'condition' may unleash his noxious fumes on all enemies engaged in close combat. Those that do not pass a Ld test suffer a –1 'to hit' modifier for the turn. The Hero must wait until a new enemy engages him in combat before he relieves himself again.`,
      },
      {
        name: `Warband Skill: Scent Hound`,
        text: `The hero spots Hidden enemies from two times as far away as other warriors (i.e. twice his Initiative value in inches).`,
      },
      {
        name: `Warband Skill: Sabre Trainer`,
        text: `Whenever a Sabretusk cub rolls a 1 for Untamed, if it started the turn within 6" of this hero, you may move the cub 3D6" towards any model within 12" of it that it can see (instead of towards the nearest model).`,
      },
      {
        name: `Warband Skill: Maneater (Ogres only)`,
        text: `This Ogre may immediately learn one skill from the Shooting or Academic skill lists. This skill may be taken only once.`,
      },
      {
        name: `Warband Skill: Bull Charge (Ogres only)`,
        text: `When charging, an Ogre with this skill may attempt a single attack with a +1 'to hit' modifier rather than making his normal attacks. If successful the enemy model is automatically knocked down.`,
      },
      {
        name: `Warband Skill: Bellowing Roar (Leader only)`,
        text: `May only be taken by the warband leader, allowing him to reroll the first failed Rout test.`,
      },
      {
        name: `Warband Skill: Set Traps (Gnoblars only)`,
        text: `A Trapper may set a trap if he spends a turn doing nothing else (not while just recovered from Knocked Down). Place a marker in base contact with the Trapper. When another model moves within 2" of the marker, roll a D6 — on a 3+ it triggers a S4 hit (the Trapper won't trigger his own traps). If not triggered or the model has multiple wounds, it may finish its move; if Knocked Down or Stunned it is placed 2" from the marker. The marker is removed regardless.`,
      },
      {
        name: `Warband Skill: Infiltration (Gnoblars only)`,
        text: `Always placed on the battlefield after the opposing warband, anywhere out of sight of the opposing warband and more than 12" away from any enemy model. If both players have infiltrating models, roll a D6 for each; the lowest roll sets up first.`,
      },
      {
        name: `Warband Skill: Netter (Gnoblars only)`,
        text: `Each game, the hero starts with 3 Nets which may not be sold, traded, or given away; unused nets are assumed stashed or fallen apart. The next game the hero again starts with 3 nets, without penalty or cost.`,
      },
      {
        name: `Special Equipment: Sharp Stuff`,
        text: `Cost: 1st Free / Second 3gc · Availability: Common (Gnoblars only) · Range: 8" · Strength: 2 · Special Rules: No Limit, Thrown Weapon, +1 Armour Save, Stuff Thrower. No Limit: does not count towards a Gnoblar's missile weapon limit. Thrown Weapon: no penalty for moving and shooting or throwing over half range. Armour Save: targets hit receive +1 Armour Save. Stuff Thrower: combined with the Shooting skill 'Knife Thrower', a Gnoblar may throw three pieces of scrap instead of one (not combinable with throwing three knives the same turn).`,
      },
      {
        name: `Special Equipment: Pigback Mount`,
        text: `Cost: 50 gold crowns · Availability: Common (Gnoblar Heroes Only). A gnoblar hero may ride a luckless gnoblar (M5 WS2 BS– S2 T– W1 I3 A1 Ld5) forced to carry them piggyback. Like a Mount: uses standard Mounted Combat rules (cannot climb, uses mount's movement, can jump obstacles up to 2", uses Mounted rules for Spears). Cannot Infiltrate. Not Like a Mount: does NOT count as a large target, may enter buildings, doesn't gain +1AS, may not wear barding. Extra Hand: the Pigback has 1 free hand for a weapon (starts with a free dagger, or may be given a club or axe; alternatively a shield, which increases the rider's save by +1 but the mount cannot attack).`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `ogre_hunting_party_ogre`,
        name: `Ogre Equipment List`,
        meleeWeapons: [
          { name: `Cleaver (counts as axe)`, cost: `5 gc` },
          { name: `Ogre Club`, cost: `10 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
        ],
        missileWeapons: [{ name: `Harpoon Crossbow`, cost: `50 gc` }],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
      {
        id: `ogre_hunting_party_gnoblar`,
        name: `Gnoblar Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Club`, cost: `3 gc` },
          { name: `Cleaver`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
        ],
        missileWeapons: [
          { name: `Sharp Stuff`, cost: `1st free/3 gc` },
          { name: `Throwing Knives (Heroes Only)`, cost: `15 gc` },
          { name: `Slings (Flingers Only)`, cost: `2 gc` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
      {
        id: `ogre_hunting_party_none`,
        name: `No Equipment (animal)`,
        meleeWeapons: [],
        missileWeapons: [],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: `ogre_hunting_party_ogre_hunter`,
        name: `Ogre Hunter`,
        role: `hero`,
        cost: 145,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 6, WS: 4, BS: 3, S: 4, T: 4, W: 3, I: 3, A: 2, Ld: 8 },
        equipmentListId: `ogre_hunting_party_ogre`,
        skillTableIds: [`combat`, `strength`, `warband-unique`],
        specialRules: [
          { name: `Leader`, text: `Any warrior within 6" of the Ogre Hunter may use his Leadership when taking Ld tests.` },
          {
            name: `Huuuuge`,
            text: `All ogre models cause fear. All ogres are Large targets. Ogres also ignore all alone tests. An ogre can never have Ithilmar, Gromril or heavy armour — they don't make it in such sizes! All ogres have a warband rating of 20 plus experience (instead of 5).`,
          },
          { name: `Slow Witted`, text: `Ogres improve at half the rate of everyone else — they must earn twice the usual number of experience points to gain an advance.` },
          {
            name: `Don't Fight with Eating Knives`,
            text: `Ogres don't carry daggers for fighting, only for eating. If forced to fight unarmed (losing a weapon or carrying none), the -1S penalty for unarmed combat does not apply to them, but the +1 enemy armour save still does; they may make more than one unarmed attack per their Attacks value, but cannot combine it with another weapon.`,
          },
          {
            name: `Lazy`,
            text: `An Ogre Hunter is far too preoccupied with Hunting to worry about pretty stones. If any of your Gnoblar heroes are able to search for wyrdstone or Rare Items, the Ogre Hunter does not add an exploration dice or search; he may only explore and search if all other gnoblar heroes are unable to.`,
          },
          {
            name: `Central Figure`,
            text: `The gnoblars flock around the Ogre Hunter and take strength from his presence. If he is taken out of action during a game, the warband is automatically at Rout level, regardless of the number of casualties.`,
          },
          { name: `Sabre Trainer`, text: `See the warband's Sabre Trainer skill.` },
        ],
      },
      {
        id: `ogre_hunting_party_trappers`,
        name: `Trappers`,
        role: `hero`,
        cost: 30,
        rosterLimit: `0-3`,
        startingExperience: 8,
        stats: { M: 4, WS: 2, BS: 4, S: 2, T: 3, W: 1, I: 3, A: 1, Ld: 6 },
        equipmentListId: `ogre_hunting_party_gnoblar`,
        skillTableIds: [`combat`, `shooting`, `speed`, `warband-unique`],
        specialRules: [
          {
            name: `Veteran Tracker`,
            text: `A trapper starts with ONE of the following Special Skills, chosen upon the hero's purchase: Infiltration (max 1), Set Traps, Netter, or Scent Hound.`,
          },
        ],
      },
      {
        id: `ogre_hunting_party_sabre_baiter`,
        name: `Sabre-Baiter`,
        role: `hero`,
        cost: 20,
        rosterLimit: `0-1`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 3, S: 2, T: 3, W: 1, I: 4, A: 1, Ld: 5 },
        equipmentListId: `ogre_hunting_party_gnoblar`,
        skillTableIds: [`combat`, `speed`, `warband-unique`],
        specialRules: [
          {
            name: `Bait`,
            text: `Whenever a model declares a charge against a Sabre-baiter, he may immediately move 1D6" in the opposite direction of the charger (possibly causing the charge to fail if it moves him out of range). Usable once per turn, only if not knocked down, stunned, or in hand-to-hand combat. If the charger is a Sabretusk, move the baiter 2D6" instead, maneuvering around models in the path (potentially causing the Sabretusk to charge someone else).`,
          },
        ],
      },
    ],
    henchmanTemplates: [
      {
        id: `ogre_hunting_party_gnoblar_fighters`,
        name: `Gnoblar Fighters`,
        role: `henchman`,
        cost: 15,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 3, S: 2, T: 3, W: 1, I: 3, A: 1, Ld: 5 },
        equipmentListId: `ogre_hunting_party_gnoblar`,
        skillTableIds: [],
        specialRules: [{ name: `Bicker`, text: `See the warband's Bicker rule.` }],
      },
      {
        id: `ogre_hunting_party_flingers`,
        name: `Flingers`,
        role: `henchman`,
        cost: 20,
        rosterLimit: `0-7`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 3, S: 2, T: 3, W: 1, I: 3, A: 1, Ld: 5 },
        equipmentListId: `ogre_hunting_party_gnoblar`,
        skillTableIds: [],
        specialRules: [
          { name: `Bicker`, text: `See the warband's Bicker rule.` },
          {
            name: `Scrap Slinger`,
            text: `A Flinger may throw 3 pieces of Sharp Stuff every turn, instead of the normal 1 (does not combo with Knife Thrower, nor apply to throwing knives).`,
          },
        ],
      },
      {
        id: `ogre_hunting_party_sabretusk_cubs`,
        name: `Sabretusk Cubs`,
        role: `henchman`,
        cost: 50,
        rosterLimit: `0-3`,
        startingExperience: 0,
        stats: { M: 6, WS: 3, BS: 0, S: 4, T: 4, W: 1, I: 4, A: 1, Ld: 4 },
        equipmentListId: `ogre_hunting_party_none`,
        skillTableIds: [],
        specialRules: [
          { name: `Fear`, text: `Sabretusks are huge feline predators and thus cause fear.` },
          { name: `Animals`, text: `Sabretusks are animals, and don't gain experience.` },
          {
            name: `Untamed`,
            text: `Sabretusks don't bicker. At the start of each turn, roll 1D6 for each Sabretusk not in combat: on a 1, it moves 3D6" to the nearest non-sabretusk model instead of moving normally this turn; this counts as a charge. If it charges another member of your warband this way, after combat move it 1" away.`,
          },
          { name: `Charge`, text: `Sabretusks fight with 2 attacks instead of 1 during the turn they charge.` },
          { name: `Tough Hide`, text: `Sabretusks have a natural 5+ armour save.` },
        ],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-2a-warbands/ogre-hunting-party`,
  },
];

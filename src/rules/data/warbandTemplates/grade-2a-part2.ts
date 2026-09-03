// Warband templates — Grade 2a (Part 2), scraped from mordheimer.net on 2026-09-01.
// Source: rules/warbands/grade-2a-part2.md
//
// Magic/spell lists (Blessings of the Mare, Elemental Lores, Charms & Hexes, Dark Arts,
// Funerary Rites, Woodland Incantations) are NOT transcribed here — WarbandTemplate has no
// spell-list field in src/types/index.ts, and the relevant Hero's `specialRules` already
// records that they are a Wizard/Priest/Seer with access to a named spell list, so nothing
// about warband composition or stats is lost by omitting full spell text.

import type { WarbandTemplate } from "../../types";

export const WARBANDS: WarbandTemplate[] = [
  // ============================================================
  // Order of the Mare
  // ============================================================
  {
    id: "order_of_the_mare",
    name: "Order of the Mare",
    grade: "2a",
    race: "Human (Bretonnian Knights)",
    originalSetting: "Bretonnia / Mordheim",
    sourcebook: "Fredrik Edman (PDF)",
    raceTraits: [],
    specialRules: [
      {
        name: "Knight's Virtue",
        text: `A knight is a chivalrous warrior who is superior to ordinary warriors. He will never panic and break from combat and so does not have to pass a Leadership test for being all alone.`,
      },
      {
        name: "Hired Swords",
        text: `Order of the Mare warbands have access to the same hired swords as a mercenary warband would.`,
      },
      {
        name: "Horse and Rider",
        text: `Because the knights of Bretonnia are typically mounted on horseback, the Paragon and the Gallant may buy a single horse or warhorse each at half the normal price upon recruitment.`,
      },
      {
        name: "Blazing Saddles (optional, if Town Cryer #14 supplement is in play)",
        text: `The Paragon, Gallant, Esquiresses and Redeemed knights should all automatically have the Ride skill. In addition, Order of the Mare warbands should be allowed to ignore the normal warband limitation of two mounts in areas of dense terrain.`,
      },
      {
        name: "Equipment List: Footman — Miscellaneous",
        text: `Barding (Knights only): 30 gc. Warhorse (Knights only): 80 gc.`,
      },
      {
        name: "Equipment List: Archer — Miscellaneous",
        text: `Horse (Esquiresses only): 40 gc.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: "footman_equipment",
        name: "Footman Equipment List",
        meleeWeapons: [
          { name: "Dagger", cost: "1st free / 2 gc" },
          { name: "Mace", cost: "3 gc" },
          { name: "Axe", cost: "5 gc" },
          { name: "Sword", cost: "10 gc" },
          { name: "Spear (Pilgrims only)", cost: "10 gc" },
          { name: "Halberd (Pilgrims only)", cost: "10 gc" },
          { name: "Double-handed weapon", cost: "15 gc" },
          { name: "Flail", cost: "15 gc" },
          { name: "Morning star", cost: "15 gc" },
          { name: "Lance (Knights only)", cost: "20 gc" },
        ],
        missileWeapons: [{ name: "Bow (Pilgrims only)", cost: "10 gc" }],
        armour: [
          { name: "Shield", cost: "5 gc" },
          { name: "Helmet", cost: "10 gc" },
          { name: "Light armour", cost: "20 gc" },
          { name: "Heavy armour (Knights only)", cost: "50 gc" },
        ],
      },
      {
        id: "archer_equipment",
        name: "Archer Equipment List",
        meleeWeapons: [
          { name: "Dagger", cost: "1st free / 2 gc" },
          { name: "Mace", cost: "3 gc" },
          { name: "Axe", cost: "5 gc" },
          { name: "Sword", cost: "10 gc" },
          { name: "Spear (Esquiresses only)", cost: "10 gc" },
        ],
        missileWeapons: [
          { name: "Bow", cost: "10 gc" },
          { name: "Longbow", cost: "15 gc" },
        ],
        armour: [
          { name: "Shield", cost: "5 gc" },
          { name: "Helmet", cost: "10 gc" },
          { name: "Light armour", cost: "20 gc" },
        ],
      },
      {
        id: "dame_equipment",
        name: "Dame Equipment List",
        meleeWeapons: [
          { name: "Dagger", cost: "1st free / 2 gc" },
          { name: "Mace", cost: "3 gc" },
          { name: "Sword", cost: "10 gc" },
          { name: "Morning star", cost: "15 gc" },
        ],
        missileWeapons: [],
        armour: [],
      },
      {
        id: "no_equipment",
        name: "No Equipment (Companion Filly)",
        meleeWeapons: [],
        missileWeapons: [],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: "paragon",
        name: "Paragon",
        role: "hero",
        cost: 60,
        rosterLimit: "1",
        startingExperience: 20,
        stats: { M: 4, WS: 4, BS: 3, S: 4, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: "footman_equipment",
        skillTableIds: ["combat", "academic", "strength", "speed"],
        specialRules: [
          { name: "Leader", text: `Any warrior within 6" of the Questing knight may use his Leadership value when taking Leadership tests.` },
          { name: "Knight's Virtue", text: `The Paragon follows the rules of Knight's virtue.` },
          { name: "Vow of Poverty", text: `The Paragon may not use a Lance.` },
        ],
      },
      {
        id: "dame_of_the_mare",
        name: "Dame of the Mare",
        role: "hero",
        cost: 55,
        rosterLimit: "1",
        startingExperience: 8,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 8 },
        equipmentListId: "dame_equipment",
        skillTableIds: ["combat", "academic", "strength", "speed"],
        specialRules: [
          {
            name: "Ancient Armour",
            text: `The Dame of the Mare comes equipped with an ancient armour that may never be removed, traded or stolen. It does not prevent spell casting, and provides a 5+ save that cannot be modified, but doesn't work against magical attacks.`,
          },
          {
            name: "Prayers",
            text: `The Dame of the Mare may use prayers from the Blessings of the Mare list. She starts with one randomly determined prayer.`,
          },
        ],
      },
      {
        id: "gallant",
        name: "Gallant",
        role: "hero",
        cost: 35,
        rosterLimit: "0-1",
        startingExperience: 8,
        stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: "footman_equipment",
        skillTableIds: ["combat", "strength", "speed"],
        specialRules: [{ name: "Knight's Virtue", text: `The Gallant follows the rules of Knight's virtue.` }],
      },
      {
        id: "esquiresses",
        name: "Esquiresses",
        role: "hero",
        cost: 15,
        rosterLimit: "0-2",
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 6 },
        equipmentListId: "archer_equipment",
        skillTableIds: ["combat", "shooting", "speed"],
        specialRules: [],
      },
    ],
    henchmanTemplates: [
      {
        id: "pilgrims",
        name: "Pilgrims",
        role: "henchman",
        cost: 25,
        rosterLimit: "any",
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 6 },
        equipmentListId: "footman_equipment",
        skillTableIds: [],
        specialRules: [
          { name: "Hatred", text: `Pilgrims are so devout to the Dame of the Mare that they hate all and any enemies that defy her.` },
          {
            name: "Peasants",
            text: `While devout and loyal, pilgrims are simple peasants with no ambition other than following their chosen saint, and so may never become heroes. Reroll any "The Lad's Got Talent" results.`,
          },
        ],
      },
      {
        id: "bowmen",
        name: "Bowmen",
        role: "henchman",
        cost: 20,
        rosterLimit: "0-7",
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 6 },
        equipmentListId: "archer_equipment",
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: "redeemed_knights",
        name: "Redeemed Knights",
        role: "henchman",
        cost: 35,
        rosterLimit: "0-5",
        startingExperience: 0,
        stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: "footman_equipment",
        skillTableIds: [],
        specialRules: [{ name: "Knight's Virtue", text: `Redeemed knights follow the rules of Knight's virtue.` }],
      },
      {
        id: "companion_filly",
        name: "Companion Filly",
        role: "henchman",
        cost: 45,
        rosterLimit: "0-1",
        startingExperience: 0,
        stats: { M: 8, WS: 4, BS: 0, S: 3, T: 3, W: 1, I: 4, A: 2, Ld: 5 },
        equipmentListId: "no_equipment",
        skillTableIds: [],
        specialRules: [
          {
            name: "Horse",
            text: `The filly is an animal and thus does not gain any experience. Additionally it follows the movement rules for mounted warriors.`,
          },
          {
            name: "Fixed Covering",
            text: `The Filly fights with its hooves, and suffers no penalty for fighting unarmed. It is clad in odd-looking covering that provides a 5+ save that cannot be modified, but doesn't work against magical attacks. The filly may never take any equipment, except for the covering it already carries.`,
          },
        ],
      },
    ],
    sourceUrl: "https://mordheimer.net/docs/warbands/grade-2a-warbands/order-of-the-mare",
  },

  // ============================================================
  // Outlaws of Stirwood Forest Redux
  // ============================================================
  {
    id: "outlaws_of_stirwood_forest_redux",
    name: "Outlaws of Stirwood Forest Redux",
    grade: "2a",
    race: "Human",
    originalSetting: "The Empire — Stirland",
    sourcebook: "Redux version by Jon Davis (PDF)",
    raceTraits: [],
    specialRules: [
      {
        name: "Missile Weapon Restriction",
        text: `All warriors in an Outlaws warband may be equipped with only one missile weapon at any time. All warriors must carry a type of bow, but not crossbows, as part of their equipment. So, even if an Outlaw acquires skills that allow him to use additional ballistic weaponry, he cannot do so. The only exception to this is the Cleric who may choose to carry a bow, but is not compelled to do so.`,
      },
      {
        name: "Equipment List — Miscellaneous Equipment (Heroes only)",
        text: `Forest Cloak: 45 gc. Hunting Arrows: 30 gc. (Note: the equipment list price for a Forest Cloak, 45 gc, differs from the Special Equipment entry price, 50 gold crowns, as stated on the source page — reproduced here verbatim as a known discrepancy in the original text.)`,
      },
      {
        name: "Special Equipment: Forest Cloak",
        text: `Cost: 50 gold crowns. Availability: Rare 10 (Outlaws only). Some Outlaws use Forest Cloaks to camouflage themselves against being seen by their enemies. Any wearer of such a cloak would appear to blend into the surrounding forest making it almost impossible to be seen. So long as the wearer is beside a tree, bush or hedge, any enemy using any kind of missile weapon at a warrior wearing a Forest Cloak is at an additional -1 BS to hit (in addition to all other modifiers). Similarly, if any spellcaster wishes to target a magical attack against an Outlaw camouflaged in this way, he can only do so by successfully rolling a 4+ on a D6. The only exception to this is if the shooting warrior or the spellcaster is already within their Initiative range in inches.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: "outlaws_equipment",
        name: "Outlaws Equipment List",
        meleeWeapons: [
          { name: "Dagger", cost: "1st free/2 gc" },
          { name: "Mace", cost: "3 gc" },
          { name: "Hammer", cost: "3 gc" },
          { name: "Axe", cost: "5 gc" },
          { name: "Sword", cost: "10 gc" },
          { name: "Spear", cost: "10 gc" },
          { name: "Double-handed weapon", cost: "15 gc" },
        ],
        missileWeapons: [
          { name: "Bow", cost: "10 gc" },
          { name: "Short Bow", cost: "5 gc" },
          { name: "Long Bow (Heroes only)", cost: "15 gc" },
        ],
        armour: [
          { name: "Light armour", cost: "20 gc" },
          { name: "Helmet", cost: "10 gc" },
          { name: "Shield", cost: "5 gc" },
        ],
      },
    ],
    heroTemplates: [
      {
        id: "bandit_leader",
        name: "Bandit Leader",
        role: "hero",
        cost: 60,
        rosterLimit: "1",
        startingExperience: 20,
        stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: "outlaws_equipment",
        skillTableIds: ["combat", "shooting", "academic", "strength", "speed"],
        specialRules: [{ name: "Leader", text: `Any models in the warband within 6" of the Bandit Leader may use her Leadership instead of their own.` }],
      },
      {
        id: "champions",
        name: "Champions",
        role: "hero",
        cost: 35,
        rosterLimit: "0-2",
        startingExperience: 8,
        stats: { M: 4, WS: 3, BS: 4, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: "outlaws_equipment",
        skillTableIds: ["combat", "shooting", "strength"],
        specialRules: [],
      },
      {
        id: "cleric",
        name: "Cleric",
        role: "hero",
        cost: 35,
        rosterLimit: "0-1 (taken instead of a Champion or Petty Thief)",
        startingExperience: 8,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: "outlaws_equipment",
        skillTableIds: ["academic", "speed"],
        specialRules: [
          {
            name: "Disciple of Sigmar",
            text: `The Cleric has devoted his life in the constant service to Sigmar and as such he would start a campaign knowing one of the Prayers of Sigmar (see Mordheim rulebook page 57). As with a Witch-Hunter's Warrior Priest, he is also subject to some of the restrictions of being a follower of Lord Sigmar and may learn neither Sorcery nor Arcane Lore. As Prayers are not considered to be Spells, a Cleric may wear armour, if he wishes.`,
          },
        ],
      },
      {
        id: "petty_thieves",
        name: "Petty Thieves",
        role: "hero",
        cost: 20,
        rosterLimit: "0-2",
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: "outlaws_equipment",
        skillTableIds: ["combat", "shooting"],
        specialRules: [],
      },
    ],
    henchmanTemplates: [
      {
        id: "outlaws",
        name: "Outlaws",
        role: "henchman",
        cost: 25,
        rosterLimit: "any",
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: "outlaws_equipment",
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: "marksmen",
        name: "Marksmen",
        role: "henchman",
        cost: 25,
        rosterLimit: "0-7",
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 4, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: "outlaws_equipment",
        skillTableIds: [],
        specialRules: [],
      },
    ],
    sourceUrl: "https://mordheimer.net/docs/warbands/grade-2a-warbands/outlaws-of-stirwood-forest-redux",
  },

  // ============================================================
  // Protectorate of Sigmar
  // ============================================================
  {
    id: "protectorate_of_sigmar",
    name: "Protectorate of Sigmar",
    grade: "2a",
    race: "Human",
    originalSetting: "Mordheim",
    sourcebook: "(PDF), uncredited",
    raceTraits: [],
    specialRules: [
      {
        name: "Death of a Leader",
        text: `Should the Warrior Priest fall, the Acolyte with the most experience takes up the Mantle of Leader. Transfer all benefits of the Warrior Priest class to the Acolyte, and change his title accordingly. He does not immediately gain a Prayer, as that requires study and experience. With his next advance, he may choose to either take a prayer from the list, or roll for an advancement. All subsequent advancements are done as per the regular rules. Once promoted, the Acolyte becomes a Warrior Priest, thus freeing the Warband to hire another Acolyte.`,
      },
      {
        name: "Hired Swords",
        text: `The Protectorates are selective when it comes to which Hired Swords may accompany them. As such, they may recruit Hired Swords as if they were Witch Hunters.`,
      },
      {
        name: "Warband Skill: Protection of Sigmar",
        text: `The pious has been blessed by the Church. Any spell which would affect him is nullified on a D6 roll of 4+. Note that if the spell is nullified it will not affect any other models either.`,
      },
      {
        name: "Warband Skill: Unshakeable Faith",
        text: `Such is the faith of the warrior that there is little room for doubt or hesitation in his actions. When the opportunity arises to smite evil, one must be able to strike! As such, the warrior is hardened and immune to Fear.`,
      },
      {
        name: "Warband Skill: Utter Determination (Warrior Priest only)",
        text: `Allows him to re-roll any failed Rout tests.`,
      },
      {
        name: "Warband Skill: Rousing Sermon (Warrior Priest only)",
        text: `The Warrior Priest bellows his prayers to Sigmar, beseeching his protector to lend he and his men the strength to forge onwards. A Rousing Sermon must be declared at the beginning of a player's turn. The Warrior Priest and all friendly models within 6" gain +1 attack during that Hand to Hand combat phase. There may only be one Rousing Sermon per game.`,
      },
      {
        name: "Warband Skill: Sigmar's Guidance",
        text: `With the blessed hand of Sigmar guiding his aim, the warrior lets loose his arrow. He may freely choose his target, and not only the closest enemy when declaring ranged attacks.`,
      },
      {
        name: "Equipment List — Miscellaneous Equipment (Heroes only)",
        text: `Holy Water: 5 gc. Blessed Bolts: 25 gc. Holy Relic: 15 gc.`,
      },
      {
        name: "Special Equipment: Blessed Bolts",
        text: `Cost: 25 gold crowns. Availability: Common. Range: As Weapon. Strength: As Weapon. Special Rules: Holy. Holy: Blessed by the Warrior Priest and his Acolytes, the Blessed Bolts may be fired against the enemies of Sigmar. Any Chaotic being, be they Undead, Chaos-infused (mutants or Possessed) or Twister of Magic suffers greatly from these missiles. Add +1S to the weapon when fired against such a target.`,
      },
      {
        name: "Special Equipment: Shield of Sigmar",
        text: `Cost: 20 gold crowns. Availability: Rare 9. Range: n/a. Armour Save: 6. Special Rules: Shield of Faith. Shield of Faith: Passed down through the church, these shields were borne by men led by the Heldenhammer himself. An aura surrounds these shields, granting their bearer uncanny protection. Anyone protected by a Shield of Sigmar has a special 6+ save versus all ranged attacks. Furthermore, the weight of the shield seems diminished. The -1 penalty for bearing a shield with Heavy Armour does not apply.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: "protectorate_equipment",
        name: "Protectorate of Sigmar Equipment List",
        meleeWeapons: [
          { name: "Dagger", cost: "1st free/2 gc" },
          { name: "Hammer", cost: "3 gc" },
          { name: "Axe", cost: "5 gc" },
          { name: "Sword", cost: "10 gc" },
          { name: "Spear", cost: "10 gc" },
          { name: "Double-handed weapon", cost: "15 gc" },
          { name: "Sigmarite Warhammer (Heroes only)", cost: "15 gc" },
        ],
        missileWeapons: [
          { name: "Crossbow", cost: "25 gc" },
          { name: "Pistol", cost: "15 gc (30 for brace)" },
          { name: "Longbow", cost: "15 gc" },
        ],
        armour: [
          { name: "Light armour", cost: "20 gc" },
          { name: "Heavy armour", cost: "50 gc" },
          { name: "Shield", cost: "5 gc" },
          { name: "Buckler", cost: "5 gc" },
          { name: "Helmet", cost: "10 gc" },
          { name: "Shield of Sigmar (Heroes only)", cost: "20 gc" },
        ],
      },
      {
        id: "huntsman_equipment",
        name: "Huntsman Equipment List",
        meleeWeapons: [
          { name: "Dagger", cost: "1st free/2 gc" },
          { name: "Sword", cost: "10 gc" },
        ],
        missileWeapons: [{ name: "Longbow", cost: "15 gc" }],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: "warrior_priest",
        name: "Warrior Priest",
        role: "hero",
        cost: 80,
        rosterLimit: "1",
        startingExperience: 20,
        stats: { M: 4, WS: 4, BS: 3, S: 4, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: "protectorate_equipment",
        skillTableIds: ["combat", "academic", "strength", "speed", "warband-unique"],
        specialRules: [
          { name: "Leader", text: `Any models in the warband within 6" of the Warrior Priest may use his Leadership instead of their own.` },
          { name: "Prayers of Sigmar", text: `The Warrior Priest has studied the Prayers of Sigmar, and as such begins with one randomly generated prayer. See the Magic section of the core Mordheim rulebook.` },
        ],
      },
      {
        id: "templars",
        name: "Templars",
        role: "hero",
        cost: 45,
        rosterLimit: "0-2",
        startingExperience: 12,
        stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: "protectorate_equipment",
        skillTableIds: ["combat", "strength", "speed", "warband-unique"],
        specialRules: [
          {
            name: "Zealous",
            text: `Strong is the devotion of the Templar. The model hates any model belonging to a chaotic warband. This includes Skaven, Possessed, Carnival of Chaos, Beastmen and any warband that has a Daemon in it.`,
          },
        ],
      },
      {
        id: "acolytes",
        name: "Acolytes",
        role: "hero",
        cost: 25,
        rosterLimit: "0-2",
        startingExperience: 2,
        stats: { M: 4, WS: 3, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: "protectorate_equipment",
        skillTableIds: ["combat", "academic", "strength", "speed", "warband-unique"],
        specialRules: [],
      },
      {
        id: "huntsman",
        name: "Huntsman",
        role: "hero",
        cost: 45,
        rosterLimit: "0-1 (replaces one Templar)",
        startingExperience: 8,
        stats: { M: 4, WS: 3, BS: 4, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: "huntsman_equipment",
        skillTableIds: ["combat", "shooting", "warband-unique"],
        specialRules: [
          {
            name: "Beastmaster",
            text: `A Huntsman is naturally attuned to the earth and beasts around him. Any animal in the warband may use the Huntsman Leadership characteristic if it is within 6" of him. Any hostile beast must make a successful Ld Test to charge the Huntsman.`,
          },
        ],
      },
    ],
    henchmanTemplates: [
      {
        id: "archers",
        name: "Archers",
        role: "henchman",
        cost: 35,
        rosterLimit: "0-5",
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 4, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: "protectorate_equipment",
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: "crusaders",
        name: "Crusaders",
        role: "henchman",
        cost: 25,
        rosterLimit: "0-5",
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: "protectorate_equipment",
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: "hounds",
        name: "Hounds",
        role: "henchman",
        cost: 15,
        rosterLimit: "0-5",
        startingExperience: 0,
        stats: { M: 6, WS: 4, BS: 0, S: 4, T: 3, W: 1, I: 4, A: 1, Ld: 6 },
        equipmentListId: "protectorate_equipment",
        skillTableIds: [],
        specialRules: [
          { name: "Animals", text: `Hounds are animals, and thus gain no experience.` },
          { name: "Devoted", text: `Trained since pups, these Hounds are devoted beyond what a typical master could expect. A Hound may re-roll a failed Leadership check if within 12" of the Warrior Priest.` },
        ],
        notes: "A Hound never uses nor needs weapons or armour, and suffers no penalty for doing so — the referenced equipmentListId is nominal (never actually purchased from).",
      },
    ],
    sourceUrl: "https://mordheimer.net/docs/warbands/grade-2a-warbands/protectorate-of-sigmar",
  },

  // ============================================================
  // Skaven of Clan Moulder
  // ============================================================
  {
    id: "skaven_of_clan_moulder",
    name: "Skaven of Clan Moulder",
    grade: "2a",
    race: "Skaven",
    originalSetting: "Mordheim",
    sourcebook: "(PDF), uncredited",
    raceTraits: [],
    specialRules: [
      {
        name: "Currency",
        text: `Clan Moulder warbands use Warp Tokens (wt) as their currency, equivalent to Gold Crowns for all purposes.`,
      },
      {
        name: "Packmasters and Goading",
        text: `Clan Moulder Packmasters and Apprentices have access to a unique system known as "Goading," allowing them to whip their beasts into a frenzy with special effects based on success. See the Goading rules for details.`,
      },
      { name: "Mutations", text: `Certain models may purchase Mutations from the Possessed Warband list in the Mordheim Rulebook.` },
      { name: "Animal Limitations", text: `Giant Rats, Wolf Rats, and Rat Ogres do not gain Experience unless otherwise stated.` },
      { name: "Clan Moulder Only", text: `Equipment and certain skills marked as "Clan Moulder only" may not be used by any other warbands.` },
      {
        name: "Warband Skill: Black Hunger",
        text: `The Skaven can draw upon the dreaded Black Hunger, the fighting frenzy which gives him unnatural strength and speed but can ravage him from the inside. The Clan Moulder Hero may declare at the beginning of his turn that he is using this skill. The Hero may add +1 attack and +D3" to the total move on his profile for the duration of his own turn, but will suffer D3 S3 hits with no armour save possible at the end of the turn.`,
      },
      {
        name: "Warband Skill: Beastkin",
        text: `A Clan Moulder hero with this skill has developed such an affinity for the horrific creatures under their dominion that the range at which any Beast/Animal Handling skills operate is doubled to 12". This applies to any and all such skills the character has and any they take in future.`,
      },
      {
        name: "Warband Skill: Hypnotic Musk",
        text: `The Hero has a scent that is particularly compelling to animals of all kinds, inspiring within them a desire to obey him. Any animal or beast from an opposing warband wishing to charge him must pass a Leadership test to do so unless said charge is the result of Goading. Mounts are assumed to be sufficiently under the control of their riders as to make them immune to the effect.`,
      },
      {
        name: "Warband Skill: Subjugator of Mankind",
        text: `The Hero has become so adept with the Thingcatcher that even intelligent and nimble creatures such as Humans cannot escape him. If a Hero with this skill and equipped with a Thingcatcher takes an opposing model out of action, do not roll for injuries post-battle, instead treat the enemy as if they'd rolled Captured on the Serious Injuries chart. Large creatures such as Ogres cannot be caught in this way, but animals can.`,
      },
      {
        name: "Warband Skill: Twistkin (Stormvermin only)",
        text: `Accidental exposure to raw warpstone or the experimental attentions — welcome or otherwise — of a Clan Moulder superior has resulted in this Hero developing some monstrous but useful mutation. Upon taking this skill the Hero must buy a Mutation from the list in the Mordheim Rulebook (see Possessed Warband) at half the listed cost.`,
      },
      {
        name: "Special Equipment: Beastwhip",
        text: `Cost: 25 Warp Tokens. Availability: Rare 8, Clan Moulder only. Range: Close Combat. Strength: As user. Special rules: Cannot be parried, Whipcrack, Cruel Barbs. Cannot be parried: attempts to parry its attacks are futile — a model attacked with a Beastwhip may not make parries with weapons or bucklers. Whipcrack: when the wielder charges they gain +1A that turn, added after any other modifications; when charged they gain +1A only against the charger, striking first; if simultaneously charged by 2+ opponents, still only +1A; if dual-wielding, only one whip gains the bonus. Cruel Barbs: models equipped with a Beastwhip gain a +1 bonus to their roll when making Difficulty checks during Goading attempts (once per attempt, even with two Beastwhips).`,
      },
      {
        name: "Special Equipment: Thingcatcher",
        text: `Cost: 20 Warp Tokens. Availability: Rare 9, Clan Moulder only. Range: Close Combat. Strength: As user +1. Special rules: Two-handed, Iron Grip. Two-handed: a model armed with a Thingcatcher may not use a shield, buckler, or additional weapon in close combat — if the model has a shield it still gains a +1 bonus to armour save against shooting. Iron Grip: models equipped with a Thingcatcher can force beasts to reroll a failed Stupidity test resulting from a failed Goading attempt.`,
      },
      {
        name: "Special Equipment: Wolf Rat Mount",
        text: `Cost: 90 Warp Tokens. Availability: Rare 11, Clan Moulder only. Stats M9 WS3 BS0 S4 T3 W1 I4 A1 Ld4. Special Rules: Poisoned Attack — the mouths of Wolf Rats fester with any number of poxes and corrosive agents; any attacks made by a Wolf Rat Mount are considered to be Strength 4, but do not modify armour saves.`,
      },
      {
        name: "Goading",
        text: `Goading attempts are made at the very beginning of the Moulder turn, before any movement takes place. The Packmaster and his Apprentices can each attempt to Goad any single model or henchman group of beasts (Giant Rats, Wolf Rats, or Rat Ogres) from their own Warband who are within 6" of them when the turn begins (to Goad a henchman group, at least half of its members must be within 6"). To do so, they must pass a difficulty check as if casting a spell/prayer (roll equal to or greater than the Difficulty on 2D6): Giant Rat – Difficulty 6; Wolf Rat – Difficulty 8; Rat Ogre – Difficulty 10. If passed with double 6s, you may select the effect rather than rolling. If the check is failed, the beast/group must immediately take a Stupidity test; if failed with double 1s, the beast/group becomes enraged and turns on their erstwhile master, moving into base contact with the Goader and resolving one attack from each beast against him — the beast/group returns to the Moulder player's control at the beginning of his next turn.`,
      },
      {
        name: "Goading Results Chart",
        text: `1–2 "Yelp": the beast/group must run in the Movement phase, at up to triple normal movement, even if there are enemy models within 8". 3–4 "Growl": if an enemy is within Line of Sight, the beast/group must attempt to Charge it (Moulder player chooses the target if multiple), at triple normal movement, and cannot be Intercepted. 5–6 "Roar!": the beast/group is subject to Frenzy and Hatred (of all models in the opposing warband) until the beginning of the next Moulder turn.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: "moulder_heroes_equipment",
        name: "Heroes Equipment List",
        meleeWeapons: [
          { name: "Dagger", cost: "1st free/2 wt" },
          { name: "Mace/Club", cost: "3 wt" },
          { name: "Sword", cost: "10 wt" },
          { name: "Halberd", cost: "10 wt" },
          { name: "Flail", cost: "15 wt" },
          { name: "Spear", cost: "10 wt" },
          { name: "Beastwhip (Packmaster or Apprentices only)", cost: "25 wt" },
          { name: "Thingcatcher (Packmaster or Apprentices only)", cost: "20 wt" },
        ],
        missileWeapons: [
          { name: "Sling", cost: "2 wt" },
          { name: "Warplock Pistol", cost: "35 wt (70 for a brace)" },
        ],
        armour: [
          { name: "Light Armour", cost: "20 wt" },
          { name: "Heavy Armour", cost: "50 wt" },
          { name: "Shield", cost: "5 wt" },
          { name: "Buckler", cost: "5 wt" },
          { name: "Helmet", cost: "10 wt" },
        ],
      },
      {
        id: "moulder_henchmen_equipment",
        name: "Henchmen Equipment List",
        meleeWeapons: [
          { name: "Dagger", cost: "1st free/2 wt" },
          { name: "Club", cost: "3 wt" },
          { name: "Sword", cost: "10 wt" },
          { name: "Spear", cost: "10 wt" },
        ],
        missileWeapons: [{ name: "Sling", cost: "2 wt" }],
        armour: [
          { name: "Light Armour", cost: "20 wt" },
          { name: "Shield", cost: "5 wt" },
          { name: "Helmet", cost: "10 wt" },
        ],
      },
      {
        id: "no_equipment",
        name: "No Equipment (Giant Rats, Wolf Rats, Rat Ogres)",
        meleeWeapons: [],
        missileWeapons: [],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: "packmaster",
        name: "Packmaster",
        role: "hero",
        cost: 75,
        rosterLimit: "1",
        startingExperience: 20,
        stats: { M: 5, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 5, A: 1, Ld: 7 },
        equipmentListId: "moulder_heroes_equipment",
        skillTableIds: ["combat", "shooting", "academic", "strength", "speed", "warband-unique"],
        specialRules: [
          { name: "Leader", text: `Any warrior within 6" of the Packmaster may use his Leadership when taking Ld tests.` },
          {
            name: "Master Handler",
            text: `Packmasters are experts at handling all manner of twisted creatures. They have access to the Goading system, plus begin any one-off game or campaign with the Ride Wolf Rat skill and one additional Beast Handling skill (choose either Giant Rats or Wolf Rats).`,
          },
          {
            name: "Poke 'em in the Squidgy Bits",
            text: `Packmasters are trained to take full advantage of the tools of Clan Moulder's trade. If so equipped, they can gain the beneficial effects of both the Beastwhip and the Thingcatcher during a Goading attempt.`,
          },
        ],
      },
      {
        id: "stormvermin",
        name: "Stormvermin",
        role: "hero",
        cost: 40,
        rosterLimit: "0-2",
        startingExperience: 8,
        stats: { M: 5, WS: 4, BS: 3, S: 4, T: 3, W: 1, I: 4, A: 1, Ld: 6 },
        equipmentListId: "moulder_heroes_equipment",
        skillTableIds: ["combat", "strength", "speed", "warband-unique"],
        specialRules: [],
      },
      {
        id: "apprentices",
        name: "Apprentices",
        role: "hero",
        cost: 25,
        rosterLimit: "0-2",
        startingExperience: 4,
        stats: { M: 5, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 5 },
        equipmentListId: "moulder_heroes_equipment",
        skillTableIds: ["combat", "academic", "speed", "warband-unique"],
        specialRules: [
          {
            name: "Novice Handler",
            text: `An Apprentice has access to the Goading system, but can only use the beneficial effect of either a Beastwhip or a Thingcatcher during a Goad, not both.`,
          },
          {
            name: "Heir to Power",
            text: `If the Packmaster is slain, one of the Apprentices must be chosen to succeed him as Leader — treated as a Packmaster in all respects from that moment on, and a new Apprentice may be hired to take their place. If the Packmaster and all Apprentices die at once, or if there are no Apprentices when the Packmaster dies, the warband disbands.`,
          },
        ],
      },
    ],
    henchmanTemplates: [
      {
        id: "clanrats",
        name: "Clanrats",
        role: "henchman",
        cost: 20,
        rosterLimit: "0-5",
        startingExperience: 0,
        stats: { M: 5, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 5 },
        equipmentListId: "moulder_henchmen_equipment",
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: "giant_rats",
        name: "Giant Rats",
        role: "henchman",
        cost: 15,
        rosterLimit: "any",
        startingExperience: 0,
        stats: { M: 6, WS: 2, BS: 0, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 4 },
        equipmentListId: "no_equipment",
        skillTableIds: [],
        specialRules: [
          { name: "Pack Size", text: `You may recruit as many Giant Rats as you wish subject to the warband's maximum number of models.` },
          { name: "Experience", text: `Giant Rats are animals and so do not gain Experience.` },
        ],
      },
      {
        id: "wolf_rats",
        name: "Wolf Rats",
        role: "henchman",
        cost: 30,
        rosterLimit: "0-3",
        startingExperience: 0,
        stats: { M: 9, WS: 3, BS: 0, S: 4, T: 3, W: 1, I: 4, A: 1, Ld: 4 },
        equipmentListId: "no_equipment",
        skillTableIds: [],
        specialRules: [
          { name: "Poisoned Attack", text: `The mouths of Wolf Rats fester with any number of poxes and corrosive agents; their attacks are considered to be Strength 4 but do not modify armour saves.` },
          { name: "Experience", text: `Wolf Rats are animals and so do not gain Experience.` },
        ],
      },
      {
        id: "rat_ogres",
        name: "Rat Ogres",
        role: "henchman",
        cost: 200,
        rosterLimit: "0-2",
        startingExperience: 0,
        stats: { M: 6, WS: 3, BS: 3, S: 5, T: 5, W: 3, I: 4, A: 3, Ld: 4 },
        equipmentListId: "no_equipment",
        skillTableIds: [],
        specialRules: [
          { name: "Fear", text: `Rat Ogres are so terrifying they cause Fear.` },
          { name: "Stupidity", text: `A Rat Ogre is subject to Stupidity unless a Clan Moulder Hero is within 6" of it.` },
          { name: "Experience", text: `Rat Ogres do not gain experience.` },
          { name: "Large Target", text: `Rat Ogres are Large Targets as defined in the Shooting rules.` },
          {
            name: "It's Alive!",
            text: `Moulder Rat Ogres are twisted creatures ever subject to the cruel curiosity of their masters. When hired each Rat Ogre must purchase a single Mutation from the list in the Mordheim Rulebook at the listed price (see Possessed Warband section).`,
          },
          { name: "Hard to Handle", text: `Rat Ogres can only be bought individually, they never form a Henchman Group even if you hire more than one.` },
        ],
      },
    ],
    sourceUrl: "https://mordheimer.net/docs/warbands/grade-2a-warbands/skaven-of-clan-moulder",
  },

  // ============================================================
  // Snotlings
  // ============================================================
  // TODO: this warband's own page header self-reports "Grade: 2b", not Grade 2a, despite being
  // filed under the site's grade-2a-warbands URL path (and this batch's assignment). Recorded as
  // grade "2a" here per the task instructions, but flagged since the source disagrees with itself.
  {
    id: "snotlings",
    name: "Snotlings",
    grade: "2a",
    race: "Snotling & Goblin (mixed)",
    originalSetting: "Mordheim",
    sourcebook: `Luke "Ram Rock Ed First/Auretious Taak" Roberts and Dave "Styrofoamking" Seidman-Joria (PDF)`,
    raceTraits: [],
    specialRules: [
      {
        name: "Dodgy",
        text: `Due to their small and dodgy nature, all Snotlings have a 6+ dodge/step aside save in the same way as the Dark Elf Skill "Fey Quickness." Hence, if a Hero gains dodge or step aside, it can be combined to get a 4+ dodge/step aside save respectively.`,
      },
      { name: "Small Target", text: `All Snotlings are at minus one (-1) to be hit from ranged attacks because they are so diminutive and hard to hit from a distance.` },
      {
        name: "Small Hands",
        text: `Snotlings and the Bullied Goblin may never use Long bows, Elf Bows, Handguns, Long Rifles or Blunderbusses even if they gain an advance roll that would allow them to do so. The exception is Shoota Teams, which use teamwork to make up for the difference!`,
      },
      {
        name: "Not-So-Tough Gits",
        text: `When you roll on the injury table for Snotlings, a roll of a 1 is knocked down, 2-3 means stunned, and 4-6 means OoA. Henchmen who go OOA during a game will die on the roll of a 1-3 rather than just 1-2, and Snotling Heroes (not the Gobbo leader) must roll twice on the Heroes serious injury table.`,
      },
      {
        name: "Weakness in Numbers",
        text: `To represent this lack of confidence in a Snotling Warband's ability to deal vast amounts of death, Snotling warband ratings count as being half of its current value (e.g. 15 members with 42 experience gives a rating of 117, halved to 59). For Income and trading, Snotlings count as only half their actual warband size rounding up, producing a number between 3 and 15.`,
      },
      {
        name: "Scavengers!",
        text: `Snotlings always roll an additional exploration dice when exploring. They even get this extra dice when all the Heroes in the warband are knocked out of action.`,
      },
      {
        name: `That (Git)'s Got Talent!`,
        text: `When a Snotling henchman gets the "That Lad's Got Talent!" advance, they automatically learn the skills Mob Rule and The Rigors of Leadership.`,
      },
      {
        name: "Too Unruly",
        text: `Snotlings may never use any Hired Swords or Dramatis Personae, with the exception of Snotling Hired Swords and DPs, or HS/DP that mention the warband by name.`,
      },
      {
        name: "Characteristic Increase",
        text: `Characteristics for the Bullied Goblin and the Snotling warriors may not be increased beyond maximum limits. Goblin max: M4 WS5 BS6 S4 T4 W3 I6 A4 Ld7. Snotling max: M4 WS4 BS4 S3 T3 W2 I9 A4 Ld6. If a characteristic is at its maximum, take the other option or roll again if you can only increase one characteristic; if both are already maxed, increase any other by +1 instead. Henchmen can only add +1 to any characteristic.`,
      },
      {
        name: "Warband Skill: Stampede",
        text: `When the hero with Stampede charges an opposing warrior, keep track of any other Snotlings that charged that same warrior this turn. You may have one of those charging Snotlings forfeit his attack in order to give the Stampeding Hero +1 Strength for each Base Attack forfeited. This bonus lasts until the end of the turn and may be used multiple times, but each snotling may only forfeit his attack once per turn. A Snotling that forfeits his attacks forfeits them ALL. A Hero's Strength may not be increased beyond Strength 10.`,
      },
      {
        name: "Warband Skill: Achilles' Heel",
        text: `Your Snotling always causes Critical Hits on rolls of 6 (when wounding) regardless of opponent's toughness. In addition, when combined with the Stampede charge attack, on any successful rolls to wound of 5+, the opponent gains no armour save.`,
      },
      {
        name: "Warband Skill: Worm (Scout and Promoted Runts only)",
        text: `The Snotling is a master of fitting through small spaces and cracks in solid walls as well as burrowing under doors and floors. During the movement phase, you can declare that the Snotling is moving through a wall (even charging, if you can see/detect the target). Roll a D6: on anything but a 1, your Snotling squeezes through and can attack as normal; on a 1, he has charged the wall blindly, cannot move again this turn and counts as knocked down if attacked in close combat. Cannot be combined with Stampede.`,
      },
      {
        name: "Warband Skill: Big Bully (BigSnotz only)",
        text: `The BigSnot immediately learns ONE Strength Skill. May only be taken once. Cannot be combined with Frustratingly Tiny.`,
      },
      {
        name: "Warband Skill: Frustratingly Tiny (Snotlings only)",
        text: `In Hand-to-hand combat, enemies attacking your hero are at -1 to hit. Also, all opponents halve their Initiative when trying to detect a Hidden "Tiny" hero. Cannot be combined with Big Bully.`,
      },
      {
        name: "Warband Skill: Mob Master",
        text: `So long as your Hero is within 2" of a Snotling Mob, both he and the Snotling Mob become Immune to Psychology exactly as if the Hero counted as a second Snotling Mob. When combined with Stampede, the Hero automatically gains +1 to hit for each forfeited attack, in addition to +1 Strength. A natural roll of 1 will always fail to hit.`,
      },
      {
        name: "Equipment: Pointy Stick",
        text: `Cost: 1st free/2 gc. Availability: Common. Range: Close Combat. Strength: As user. +1 Enemy armour save: an enemy wounded by a Pointy Stick gains a +1 bonus to his armour save, and a 6+ armour save if he has none normally.`,
      },
      {
        name: "Equipment: Small Pebble",
        text: `Cost: free. Availability: Common (Snotling Warband Only). Range: 6". Strength: As user. Special Rule: Thrown weapon (no penalties for range or moving; cannot be used in close combat), +1 Enemy Armour Piercing (any model wounded with a Pebble gains +1 to its armour save), Easy to Find (free for Snotling warband members, easily replaced if lost, does NOT count towards the maximum number of missile weapons a warrior can carry).`,
      },
      {
        name: "Equipment: Slingshot",
        text: `Cost: 2 gc. Availability: Common (Snotling Warband Only). Maximum Range: 18". Strength: 2. Special Rule: Fire twice at half range — a sling-shooter may fire twice in the shooting phase if he does not move, but cannot shoot over half range (9") if he fires twice, and each shot is at -1 to hit.`,
      },
      {
        name: "Equipment: Power Squig",
        text: `Cost: 20 + D6 gc. Availability: Rare 8. The Power Squig acts exactly the same as a Familiar available to all warbands from the Shadow Warrior Equipment List — just more Snotlingish!`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: "snotling_equipment",
        name: "Snotling Equipment List",
        meleeWeapons: [
          { name: "Dagger/Pointy Stick", cost: "1st free/2 gc" },
          { name: "Club", cost: "3 gc" },
          { name: "Axe", cost: "5 gc" },
          { name: "Sword", cost: "10 gc" },
          { name: "Double-handed weapon", cost: "15 gc" },
        ],
        missileWeapons: [
          { name: "Short Bow (Goblin & BigSnotz only)", cost: "10 gc" },
          { name: "Pebble", cost: "Free!" },
          { name: "Slingshot", cost: "2 gc" },
        ],
        armour: [
          { name: "Light Armour (Goblin & BigSnotz only)", cost: "20 gc" },
          { name: "Shield", cost: "5 gc" },
          { name: "Helmet", cost: "10 gc" },
        ],
      },
      {
        id: "shoota_equipment",
        name: "Shoota Equipment List",
        meleeWeapons: [
          { name: "Dagger/Pointy Stick", cost: "1st free/2 gc" },
          { name: "Club", cost: "3 gc" },
        ],
        missileWeapons: [
          { name: "Pebble", cost: "Free!" },
          { name: "Slingshot", cost: "2 gc" },
          { name: "Crossbow", cost: "25 gc" },
          { name: "Blunderbuss (0-2 allowed)", cost: "30 gc" },
          { name: "Pistol (No Brace)", cost: "15 gc" },
        ],
        armour: [],
      },
      {
        id: "snotling_mob_equipment",
        name: "Snotling Mob Equipment List",
        meleeWeapons: [
          { name: "Dagger/Pointy Stick", cost: "1st free/2 gc" },
          { name: "Club", cost: "3 gc" },
          { name: "Axe", cost: "5 gc" },
          { name: "Double-handed weapon", cost: "15 gc" },
        ],
        missileWeapons: [
          { name: "Pebble", cost: "Free!" },
          { name: "Slingshot", cost: "2 gc" },
        ],
        armour: [],
      },
      {
        id: "wheelo_equipment",
        name: "Wheelo Fixed Loadout",
        meleeWeapons: [{ name: "Dagger (fixed, included)", cost: "included" }],
        missileWeapons: [{ name: "Pebble (fixed, x1, included)", cost: "included" }],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: "bullied_goblin",
        name: "Bullied Goblin",
        role: "hero",
        cost: 35,
        rosterLimit: "1",
        startingExperience: 20,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 6 },
        equipmentListId: "snotling_equipment",
        skillTableIds: ["combat", "shooting", "speed", "warband-unique"],
        specialRules: [
          { name: "Leader", text: `Any warrior within 6" of the Chieftain may use his Leadership value when taking Leadership tests.` },
          {
            name: "Not A Snotling",
            text: `The Bullied Goblin is NOT a Snotling, and does not use the rules for "Dodgy", "Small", and "Not so Tough Git". His rating is still halved (per Weakness in Numbers), and may still use a Pebble.`,
          },
          {
            name: "Mob Rule",
            text: `For every 2 Snotlings within 6" of the Hero, the Hero gains +1 Leadership, to a maximum of 10. These bonuses stack onto the Leader's base Leadership for the purposes of the Leader skill.`,
          },
          {
            name: "The Rigors of Leadership",
            text: `Heroes who lead this unruly mob gain +2 experience for surviving a battle.`,
          },
        ],
      },
      {
        id: "bigsnotz",
        name: "Snotling BigSnotz",
        role: "hero",
        cost: 15,
        rosterLimit: "0-2",
        startingExperience: 8,
        stats: { M: 4, WS: 2, BS: 2, S: 2, T: 2, W: 1, I: 3, A: 1, Ld: 5 },
        equipmentListId: "snotling_equipment",
        skillTableIds: ["combat", "speed", "warband-unique"],
        specialRules: [
          { name: "Mob Rule", text: `As Bullied Goblin's Mob Rule.` },
          { name: "The Rigors of Leadership", text: `As Bullied Goblin's The Rigors of Leadership.` },
          {
            name: "Snotling",
            text: `Subject to the warband-wide Dodgy, Small Target, Small Hands, and Not-So-Tough Gits rules.`,
          },
        ],
      },
      {
        id: "snotling_scouts",
        name: "Snotling Scouts",
        role: "hero",
        cost: 20,
        rosterLimit: "0-2",
        startingExperience: 4,
        stats: { M: 5, WS: 1, BS: 2, S: 1, T: 1, W: 1, I: 5, A: 1, Ld: 4 },
        equipmentListId: "snotling_equipment",
        skillTableIds: ["shooting", "speed", "warband-unique"],
        specialRules: [
          { name: "Mob Rule", text: `As Bullied Goblin's Mob Rule.` },
          { name: "The Rigors of Leadership", text: `As Bullied Goblin's The Rigors of Leadership.` },
          {
            name: "Snotling",
            text: `Subject to the warband-wide Dodgy, Small Target, Small Hands, and Not-So-Tough Gits rules.`,
          },
          {
            name: "Scout",
            text: `Each Snotling Scout has this modified Infiltration skill. The Snotling Scout is always placed on the battlefield after the opposing warband, anywhere out of sight of the opposing warband and more than 8" away from any enemy model. If both players have models which infiltrate, roll a D6 for each — the lowest roll sets up first.`,
          },
          { name: "He's No Threat!", text: `Scouts (and ONLY Scouts) may always run, even if there are enemy within 8" at the beginning of the turn.` },
        ],
      },
      {
        id: "snotling_shaman",
        name: "Snotling Shaman",
        role: "hero",
        cost: 30,
        rosterLimit: "0-1",
        startingExperience: 4,
        stats: { M: 4, WS: 1, BS: 1, S: 1, T: 1, W: 1, I: 4, A: 1, Ld: 5 },
        equipmentListId: "snotling_equipment",
        skillTableIds: ["speed", "warband-unique"],
        specialRules: [
          { name: "Mob Rule", text: `As Bullied Goblin's Mob Rule.` },
          { name: "The Rigors of Leadership", text: `As Bullied Goblin's The Rigors of Leadership.` },
          { name: "Wizard", text: `The Shaman starts with one spell from the Snotling Waaagh! Magic list.` },
          {
            name: "'Eadache!",
            text: `After each time that a Shaman attempts to cast a spell, successful or not, roll 1D6: on a roll of 1 or 2, the Shaman and every model in base contact with him suffer a S5 magical hit. If the Shaman owns a familiar that has not been used this turn, he may reroll to see if he suffers an 'Eadache', accepting the second result. A Shaman does not have to test for 'Eadache' if he is merely rolling to maintain a spell.`,
          },
        ],
      },
    ],
    henchmanTemplates: [
      {
        id: "snotling_shoota_team",
        name: "Snotling Shoota Team",
        role: "henchman",
        cost: 25,
        rosterLimit: "0-5",
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 3, S: 1, T: 1, W: 2, I: 3, A: 2, Ld: 4 },
        equipmentListId: "shoota_equipment",
        skillTableIds: [],
        specialRules: [
          { name: "Teamwork", text: `While a Shoota Team technically consists of 2 or more snotlings, for all intents and purposes, they count as one model.` },
          { name: "Cumbersome", text: `Any Shoota Team possessing a Missile weapon (other than Pebble or a Slingshot) can never run (only charge).` },
          {
            name: "Recoil",
            text: `When they fire a missile weapon other than a Pebble or Slingshot, Shoota Teams are immediately knocked backwards 1D6 inches, suffering a S2 hit on collision with terrain or another model (which also suffers S2). If the Shoota team fires a pistol in combat, they automatically move D6" directly away, leaving combat without a free attack from the opponent.`,
          },
        ],
        notes: "May only purchase ONE non-pebble/non-slingshot missile weapon.",
      },
      {
        id: "snotling_mobs",
        name: "Snotling Mobs",
        role: "henchman",
        cost: 40,
        rosterLimit: "0-3",
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 2, T: 2, W: 3, I: 3, A: 3, Ld: 5 },
        equipmentListId: "snotling_mob_equipment",
        skillTableIds: [],
        specialRules: [
          { name: "Teamwork", text: `While a Snotling Mob technically consists of LOTS of snotlings, for all intents and purposes, they count as one model.` },
          {
            name: "Not So Small, Surprisingly Tough",
            text: `A Snotling Mob does NOT get the normal Snotling "Small" rule (no -1 to hit from missile shots). It does not suffer "Not So Tough Gits" (rolls Injury on the normal table, killed only on 1–2). It has the "Dodgy" bonus as normal.`,
          },
          { name: "Mass Stupidity", text: `A Mob can never gain 'That Lad's Got Talent'. If TLGT is rolled, re-roll until a different advancement is gained.` },
          {
            name: "Mob Mentality",
            text: `When Snotling Mobs start a turn within 2" of another Snotling Mob, they both become Immune to Psychology for the rest of the turn (this applies to an opponent's turn as well).`,
          },
        ],
      },
      // TODO: the Wheelo's Movement characteristic is listed as "*" (variable, entirely
      // dependent on the crew) rather than a fixed number, which Stats.M (a required number)
      // cannot represent directly. M is set to 0 here as a placeholder; the actual movement
      // mechanic (1D6" walking, 2D6" running/charging, 3D6" with Sprint) is fully captured in
      // this unit's Movement special rule text below.
      {
        id: "snotling_wheelo",
        name: "Snotling Wheelo",
        role: "henchman",
        cost: 100,
        rosterLimit: "0-1",
        startingExperience: 0,
        stats: { M: 0, WS: 2, BS: 2, S: 4, T: 3, W: 2, I: 5, A: 2, Ld: 6 },
        equipmentListId: "wheelo_equipment",
        skillTableIds: ["combat", "strength", "speed"],
        specialRules: [
          {
            name: "Movement",
            text: `Walking: 1D6" in a straight line forwards or backwards, may pivot up to 90 degrees before moving; stops immediately on colliding with terrain other than open terrain, or a building wall. Running/Charging: 2D6" instead (not halved on a failed charge); every time a running/charging Wheelo moves over/through difficult terrain (rubble, barricades, houses, etc. — open terrain has no penalty) it takes an automatic Strength 5 hit, worked out immediately, and may continue if it survives.`,
          },
          {
            name: "Impact Hits",
            text: `Whenever a Wheelo moves into a model, that model automatically suffers 1D3 Strength 4 hits, worked out before any blows are struck (as a crossbow pistol). Dealt only in the first round of combat, only if the Wheelo "charged" this turn (models that charge the Wheelo do not suffer them). A friendly model rolled into still suffers Impact Hits. Impact Hits remain S4 regardless of crew Strength Upgrades.`,
          },
          {
            name: "Impact Hits and Multiple Charges",
            text: `If the Wheelo charged two models simultaneously, each suffers 1D3-1 Impact Hits (minimum 1 each, roll once, both take the same number). If it charged 3+ models, each suffers 1 Impact Hit.`,
          },
          {
            name: "Combat",
            text: `The Wheelo's stats represent its Crew, who fight in each hand-to-hand combat phase as normal whether the Wheelo charged or was charged (without the Impact Hit bonus if charged). If it accidentally rolls into a friendly model, that model suffers Impact Hits but the crew does not attack it. If it rolls into a Fear-causing opponent, it still counts as a charge (with Impact Hits), but the crew must pass a Leadership Test or hit on nothing but 6s.`,
          },
          {
            name: "Tough Machine",
            text: `The Snotling rules "Not So Tough Gits", "Small", and "Dodgy" do not apply to Wheelos. If Out of Action, roll 1D6 instead of the normal Injury Chart: 1 – permanently Destroyed; 2 – misses the next 1D3 games while repaired; 3–6 – survives relatively unscathed.`,
          },
          {
            name: "Upgrades",
            text: `Wheelos count as henchmen, but roll on the Hero's Advancement Table for advances (like a Hired Sword). They may never learn "That Lad's Got Talent", and may not have any stat increased more than once. The Wheelo ignores the normal max stats for Snotlings. A "Skill" advance may be a Combat, Strength, or Speed Skill, representing an upgrade (rocket motor, blades/saws, parachute, gripping tyres, etc.) rather than actual learning.`,
          },
          {
            name: "Special Skill Modifications: Weapons Training",
            text: `A Wheelo that gains 'Weapons Training' may have one weapon fitted to boost its Impact Hits: Axe – Impact Hits deal -1 Armour save. Club – Impact Hits deal Concussion. Spear – if charged, the Wheelo still deals a single Impact Hit to the charger before attacks are made. Morning Star – the first round of Impact Hits dealt each game are at S5 instead of S4 (subsequent rounds at normal Strength).`,
          },
          {
            name: "Special Skill Modifications: Sprint",
            text: `Instead of rolling 2D6" to run/charge, the Snotling player may choose to move the Wheelo 3D6" instead.`,
          },
          {
            name: "Special Skill Modifications: Mighty Blow",
            text: `The crew gains +1 to wound in combat. Has no effect on Impact Hits.`,
          },
        ],
        notes: `Base: the Wheelo uses a 40mm base. Weapons: the Crew are armed with a fixed Dagger and 1 Pebble (not purchased from an equipment list).`,
      },
      {
        id: "runts",
        name: "Runts",
        role: "henchman",
        cost: 5,
        rosterLimit: "any",
        startingExperience: 0,
        stats: { M: 4, WS: 1, BS: 1, S: 1, T: 1, W: 1, I: 4, A: 1, Ld: 3 },
        equipmentListId: "snotling_equipment",
        skillTableIds: [],
        specialRules: [
          {
            name: "Teeny Hands",
            text: `Runts can use Missile Weapons as normal. However, Runt Henchmen can only use a single One-Handed Weapon at a time (holstering any other), and are not allowed to take any armour. A Runt that rolls "That Lad's Got Talent" loses the "Teeny Hands" rule and may take weapons and armour as normal.`,
          },
          {
            name: "Smallest of the Small",
            text: `Opponents are at an additional -1 to hit Runts at range with missile weapon attacks (for a total of -2 to hit); hit as normal in combat. When taken out of action after a game, Runts die on an injury roll of 1–4 instead of 1–3.`,
          },
          {
            name: "Experience",
            text: `Runts can earn experience as normal, but each Enemy Hero or Henchman Group that knocks a Runt out of action must roll a D6 after the battle: on a 5+ the warrior gains one experience point; on 1–4, nothing.`,
          },
          { name: "Swarm Size", text: `Runts are brought in henchmen groups of 1+. There is no limit to how many Runts can be included in a single Henchman group.` },
        ],
      },
    ],
    sourceUrl: "https://mordheimer.net/docs/warbands/grade-2a-warbands/snotlings",
  },

  // ============================================================
  // Sorcerous Society
  // ============================================================
  {
    id: "sorcerous_society",
    name: "Sorcerous Society",
    grade: "2a",
    race: "Human",
    originalSetting: "Mordheim",
    sourcebook: `Chris "Miginath" Van Tighem and Tom "Brahm Tazoul" Bell (PDF)`,
    raceTraits: [],
    specialRules: [
      {
        name: "Keep It Secret, Keep It Safe!",
        text: `A Sorcerous Society warband may never have a Hired Sword or Dramatis Personae with the Wizard ability save for the High Elf Mage. Otherwise they may use any other Hired Sword as a Human Mercenary Warband.`,
      },
      {
        name: "The Vagaries of Magic",
        text: `Members of the Sorcerous Society are using powerful and sometimes little known spells. As a result they are susceptible to the chaotic lure of magic. If a Wizard in the Sorcerous Society Warband rolls a natural 2 (two 1's) when rolling for a spell then they must roll on the Magical Failure Table below. (Table used with permission from the Border Town Burning Supplement.)`,
      },
      {
        name: "Magical Failure Table (2D6)",
        text: `2 – Aaarrgh! The wizard horribly mutates to a Spawn of Chaos; remove from roster. 3 – Gglbddlh: the wizard is now stupid (D6 after battle, 2+ ends it). 4 – Magical Shutdown: cannot cast any spells for the rest of the battle. 5–6 – Uh-oh! The spell is cast successfully upon the wizard himself; further decisions made by the wizard's left player. 7 – Pooh, nothing at all, except the spell's failure. 8–9 – Magical Explosion: thrown D6" in a random direction, lands knocked down. 10–11 – Magical jam: cannot cast a spell in his next shooting phase (missile weapons unaffected). 12 – Wait, what's that? The wizard mutates, then the transmutation ends — choose a free Mutation from the Possessed's Mutations chart.`,
      },
      {
        name: "Additional Academic Skill: Scribe",
        text: `Any warrior with the ability to cast spells or use prayers may take this skill. It allows them to make a scroll before the battle and inscribe a single spell/prayer upon it that they are versed in. The scroll may be used just before they are about to cast the spell/prayer and allows the caster +2 to his difficulty roll.`,
      },
      {
        name: "Additional Academic Skill: Mind Focus",
        text: `When using a spell or prayer the warrior with this skill may re-roll one dice roll used in the difficulty roll. This cannot cancel a Miscast.`,
      },
      {
        name: "Additional Academic Skill: Magical Aptitude",
        text: `Only for a warrior capable of casting spells (not Sisters of Sigmar or Warrior Priests). The warrior may attempt to cast two spells each turn as long as he is not in hand-to-hand combat. After attempting the first spell he must take a Toughness test; if passed, he may attempt a second spell (or cast the same spell twice); if failed, roll on the injury table immediately with no saves, treating Out of Action as Stunned instead.`,
      },
      {
        name: "Equipment List — Miscellaneous Equipment (Heroes only)",
        text: `Familiar: 20 gc.`,
      },
      {
        name: "Special Equipment: Wizard's Staff",
        text: `Cost: 10 gold crowns. Availability: Common. Range: Close Combat. Strength: As User. Special Rules: Parry, 2 Handed, Concussion. Parry: may attempt to Parry a blow, just as a sword. 2 Handed: may not use a shield, buckler or additional weapon in close combat (a shield still gives +1 armour save vs shooting). Concussion: a roll of 2–4 is treated as stunned when rolling on the injury table.`,
      },
      {
        name: "Special Equipment: Familiar",
        text: `Cost: 20 + 2D6 gold crowns. Availability: Rare 9. Each Wizard may possess only one Familiar. Familiars are living creatures — if taken Out Of Action they roll for injuries as a Henchman, but do not count towards maximum warband size or Rout Tests. Small Target: models shooting at a Familiar suffer -1 BS. Dog (M6 WS4 BS- S3 T3 W1 I4 A1 Ld5): Loyal (immune to fear within 6" of wizard), Sniff (aids exploration with an extra dice). Cat (M6 WS4 BS- S2 T2 W1 I6 A1 Ld5): Go for the Eyes! (both attacks wounding blinds the enemy; one wounding gives -1 WS/BS until their next turn). Raven (M2 WS2 BS- S1 T1 W1 I4 A1 Ld5): Fly (up to 12"), I see you! (spells may be cast on models within range of either the Wizard or the Raven). Viper (M3 WS4 BS- S2/4 T1 W1 I5 A1 Ld5): Poison (a 6 to hit auto-wounds with no save; other wounds are S4, or S2 vs poison-immune targets), Coiled and Ready (Lightning Reflexes).`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: "sorcerous_equipment",
        name: "Sorcerous Society Equipment List",
        meleeWeapons: [
          { name: "Dagger", cost: "1st free/2 gc" },
          { name: "Hammer", cost: "3 gc" },
          { name: "Axe", cost: "5 gc" },
          { name: "Sword", cost: "10 gc" },
          { name: "Wizard's Staff", cost: "10 gc" },
          { name: "Spear", cost: "10 gc" },
          { name: "Halberd", cost: "15 gc" },
          { name: "Double-handed weapon", cost: "15 gc" },
        ],
        missileWeapons: [
          { name: "Bow", cost: "10 gc" },
          { name: "Crossbow", cost: "25 gc" },
          { name: "Pistol", cost: "15 gc (30 gc for a Brace)" },
          { name: "Handgun", cost: "35 gc" },
        ],
        armour: [
          { name: "Light Armour", cost: "20 gc" },
          { name: "Heavy Armour", cost: "20 gc" },
          { name: "Shield/Buckler", cost: "5 gc" },
          { name: "Helmet", cost: "10 gc" },
        ],
      },
    ],
    heroTemplates: [
      {
        id: "magus",
        name: "Magus",
        role: "hero",
        cost: 75,
        rosterLimit: "1",
        startingExperience: 20,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: "sorcerous_equipment",
        skillTableIds: ["academic", "speed"],
        specialRules: [
          { name: "Leader", text: `Any models in the warband within 6" of the Magus may use his Leadership instead of their own.` },
          { name: "Wizard", text: `The Magus is a powerful wizard and may randomly generate two spells from any one Elemental list, or from the Lesser Magic list found in the Core Rulebook.` },
        ],
      },
      {
        id: "companions",
        name: "Companions",
        role: "hero",
        cost: 45,
        rosterLimit: "0-2",
        startingExperience: 8,
        stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 8 },
        equipmentListId: "sorcerous_equipment",
        skillTableIds: ["combat", "shooting", "strength"],
        specialRules: [
          {
            name: "Don't Look at Me!",
            text: `A Companion may never become the Leader of a warband and his Leadership may never be used for any Leadership tests except his own — including Rout tests after the Leader has been taken Out of Action.`,
          },
          {
            name: "Body Guard",
            text: `If the Companion is within 2 inches of a Wizard and not involved in Hand to Hand combat, he will take all missile fire and intercept any charges directed at the Wizard, moved immediately even out of sequence, if he has a logical path.`,
          },
        ],
      },
      {
        id: "mages",
        name: "Mages",
        role: "hero",
        cost: 35,
        rosterLimit: "0-2",
        startingExperience: 8,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: "sorcerous_equipment",
        skillTableIds: ["academic", "speed"],
        specialRules: [
          { name: "Wizard", text: `The Mage is a wizard, and may randomly generate a spell from any one Elemental list, or from the Lesser Magic list found in the Core Rulebook.` },
          {
            name: "Respect Your Betters",
            text: `A Mage may never have more spells than the Leader. If a Mage has more spells than the leader he will immediately be challenged to a Wizard's Duel; the loser must leave the warband.`,
          },
        ],
      },
    ],
    henchmanTemplates: [
      {
        id: "untrained",
        name: "Untrained",
        role: "henchman",
        cost: 25,
        rosterLimit: "0-5",
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: "sorcerous_equipment",
        skillTableIds: [],
        specialRules: [
          { name: "Here, Hold This", text: `Untrained may be equipped with special items (like holy relics or lucky charms).` },
          {
            name: "Harnessed",
            text: `Should an Untrained roll a "Lads Got Talent" roll, they immediately gain the "Wizard" skill. They may choose to either forgo their additional advancement and randomly generate a spell, or may roll as the Hero advancement dictates.`,
          },
        ],
      },
      {
        id: "grunts",
        name: "Grunts",
        role: "henchman",
        cost: 25,
        rosterLimit: "any",
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: "sorcerous_equipment",
        skillTableIds: [],
        specialRules: [
          {
            name: "Prove That Talent!",
            text: `If "Lads Got Talent" is rolled the individual Grunt can either become a mundane Hero or may choose to become a "Grunt Untrained" instead — a Grunt who rolls two "Lads got Talent" may become a wizard.`,
          },
        ],
      },
    ],
    sourceUrl: "https://mordheimer.net/docs/warbands/grade-2a-warbands/sorcerous-society",
  },

  // ============================================================
  // Survivors of Strigos
  // ============================================================
  {
    id: "survivors_of_strigos",
    name: "Survivors of Strigos",
    grade: "2a",
    race: "Human (Strigany) with a Vampire (Strigoi) leader",
    originalSetting: "Sylvania",
    sourcebook: "Written & tested by Brahm Tazoul (PDF)",
    raceTraits: [],
    specialRules: [
      {
        name: "Undead Leader",
        text: `The Strigoi Vampire is the only Undead model in the warband. The warband does not disband if the Strigoi is killed, though it may not hire a new one.`,
      },
      { name: "Hired Swords", text: `The warband may hire Hired Swords available to Undead warbands.` },
      {
        name: "Warband Skill (Strigoi Vampire only): Iron Sinews",
        text: `After death the Vampire's muscles grow far greater than they ever could have in his mortal life. Add +1S to the Vampire's profile.`,
      },
      {
        name: "Warband Skill (Strigoi Vampire only): Great Thirster",
        text: `Once the Vampire takes a model Out of Action, treat him as Frenzied. This effect remains until he is Knocked Down, Stunned, or taken Out of Action.`,
      },
      {
        name: "Warband Skill (Strigoi Vampire only): Curse of the Revenant",
        text: `Once a Vampire has taken the Great Thirster special skill, he may choose the Curse of the Revenant. This skill allows the Vampire to regenerate lost wounds on a D6 roll of 5+. Only one wound may be recovered in this fashion per turn.`,
      },
      {
        name: "Warband Skill (Strigoi Vampire only): Dark Arts",
        text: `The Strigoi has retained some of its former magical aptitude. He may choose Arcane Lore as an advance, and immediately roll for a spell on the Dark Arts table. Subsequent spells may be chosen instead of skills.`,
      },
      {
        name: "Warband Skill (Strigany Heroes only, not the Strigoi Vampire): Light Fingers",
        text: `Should a Hero with this skill take an enemy model Out of Action, they will find an extra piece of Wyrdstone. Only one piece of treasure may be found in this manner per game.`,
      },
      {
        name: "Warband Skill (Strigany Heroes only, not the Strigoi Vampire): Practiced Arm",
        text: `Such is the skill with which the Gypsy can launch throwing knives that he can throw two of them per turn. These missiles must be at the same target and gain +1 to their injury rolls to represent the skill with which they were aimed.`,
      },
      {
        name: "Equipment List — Miscellaneous Equipment (Heroes only)",
        text: `Black Gold Wristbands: 35 gc. Ring of Strigos: 20 gc. Unholy Relic: 15 gc. Cursed Book: 50 gc.`,
      },
      {
        name: "Special Equipment: Chest Talon",
        text: `Cost: 15 gc. Availability: Strigany only. Range: Close Combat. Strength: As User +1. Special Rules: Two-Handed, Heart-Pierce. Two-Handed: may not use a shield, buckler or secondary weapon in close combat (a shield still gives +1 armour save vs shooting). Heart-Pierce: adds +1 to wound against a blood-thirster.`,
      },
      {
        name: "Special Equipment: Black Gold Wristbands",
        text: `Cost: 35 + 2D6 gc. Availability: Rare 10. Special Rules: Quickened — a model wearing Black Gold Wristbands gains a 6+ save against all missile-fire, including magical, stacking with the Dodge skill.`,
      },
      {
        name: "Special Equipment: Ring of Strigos",
        text: `Cost: 20 + D6 gc. Availability: Rare 9. Special Rules: Arcane Barrier — a model wearing a Ring of Strigos gains a 6+ save versus all spells that they are a target of, or find themselves affected by.`,
      },
      {
        name: "Special Equipment: Cursed Book",
        text: `Cost: 50 + 3D6 gc. Availability: Rare 11. Special Rules: Cursed Aura — a model bearing the Cursed Book causes all enemy models within 2" to suffer a -1 penalty to hit in close combat.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: "strigany_hero_equipment",
        name: "Hero Equipment List",
        meleeWeapons: [
          { name: "Dagger", cost: "1st free/2 gc" },
          { name: "Mace", cost: "3 gc" },
          { name: "Axe", cost: "5 gc" },
          { name: "Sword", cost: "10 gc" },
          { name: "Spear", cost: "10 gc" },
          { name: "Halberd", cost: "10 gc" },
          { name: "Chest Talon", cost: "15 gc" },
          { name: "Double-handed weapon", cost: "15 gc" },
        ],
        missileWeapons: [
          { name: "Throwing Knives", cost: "15 gc" },
          { name: "Bow", cost: "10 gc" },
          { name: "Short Bow", cost: "5 gc" },
        ],
        armour: [
          { name: "Light armour", cost: "20 gc" },
          { name: "Heavy armour", cost: "50 gc" },
          { name: "Shield", cost: "5 gc" },
          { name: "Helmet", cost: "10 gc" },
        ],
      },
      {
        id: "strigany_henchman_equipment",
        name: "Henchman Equipment List",
        meleeWeapons: [
          { name: "Dagger", cost: "1st free/2 gc" },
          { name: "Mace", cost: "3 gc" },
          { name: "Axe", cost: "5 gc" },
          { name: "Sword", cost: "10 gc" },
          { name: "Spear", cost: "10 gc" },
        ],
        missileWeapons: [{ name: "Throwing Knives", cost: "15 gc" }],
        armour: [
          { name: "Light armour", cost: "20 gc" },
          { name: "Shield", cost: "5 gc" },
        ],
      },
      {
        id: "no_equipment",
        name: "No Equipment (Strigoi Vampire, Ghouls, Giant Bats)",
        meleeWeapons: [],
        missileWeapons: [],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: "strigoi_vampire",
        name: "Strigoi Vampire",
        role: "hero",
        cost: 115,
        rosterLimit: "1",
        startingExperience: 20,
        stats: { M: 6, WS: 4, BS: 4, S: 4, T: 4, W: 2, I: 6, A: 2, Ld: 8 },
        equipmentListId: "no_equipment",
        skillTableIds: ["combat", "strength", "speed", "warband-unique"],
        specialRules: [
          { name: "Leader", text: `Any models in the warband within 6" of the Strigoi Vampire may use his Leadership instead of their own.` },
          { name: "Kindred Hatred", text: `A Strigoi Vampire Hates vampires of other blood-lines.` },
          { name: "Cause Fear", text: `Vampires are terrifying Undead creatures and therefore cause Fear.` },
          { name: "Immune to Psychology", text: `Vampires are not affected by psychology (such as fear) and never leave combat.` },
          { name: "Immune to Poison", text: `Vampires are not affected by any poison.` },
          { name: "No Pain", text: `Vampires treat a Stunned result on the Injury chart as Knocked Down.` },
        ],
        notes: "A Strigoi Vampire may not wield any weapons, relying on brute strength, tooth and claw — no penalty for fighting unarmed.",
      },
      {
        id: "seer",
        name: "Seer",
        role: "hero",
        cost: 40,
        rosterLimit: "0-1",
        startingExperience: 12,
        stats: { M: 4, WS: 2, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: "strigany_hero_equipment",
        skillTableIds: ["academic", "speed", "warband-unique"],
        specialRules: [
          { name: "Seeker", text: `Seers who partake in a battle, and are not taken Out of Action, may modify a single exploration dice by +/- 1.` },
          { name: "Wizard", text: `Seers have one spell randomly generated from the Charms & Hexes spell list.` },
        ],
      },
      {
        id: "domnu",
        name: "Domnu",
        role: "hero",
        cost: 30,
        rosterLimit: "0-3",
        startingExperience: 4,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 8 },
        equipmentListId: "strigany_hero_equipment",
        skillTableIds: ["combat", "speed", "warband-unique"],
        specialRules: [
          { name: "Child of Darkness", text: `Domnu are immune to the Spooky special rule for Sylvania.` },
          { name: "Gypsy Ward", text: `The Domnu has a special save of 5+ versus magical attacks.` },
        ],
      },
    ],
    henchmanTemplates: [
      {
        id: "strigany",
        name: "Strigany",
        role: "henchman",
        cost: 25,
        rosterLimit: "0-5",
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: "strigany_henchman_equipment",
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: "ghouls",
        name: "Ghouls",
        role: "henchman",
        cost: 40,
        rosterLimit: "any",
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 4, W: 1, I: 3, A: 2, Ld: 5 },
        equipmentListId: "no_equipment",
        skillTableIds: [],
        specialRules: [{ name: "Cause Fear", text: `Ghouls are twisted and repulsive creatures and therefore cause Fear.` }],
        notes: "Ghouls never carry any equipment, apart from a few bones which they use as primitive weapons.",
      },
      {
        id: "giant_bats",
        name: "Giant Bats",
        role: "henchman",
        cost: 40,
        rosterLimit: "0-2",
        startingExperience: 0,
        stats: { M: 6, WS: 3, BS: 0, S: 3, T: 3, W: 2, I: 3, A: 1, Ld: 6 },
        equipmentListId: "no_equipment",
        skillTableIds: [],
        specialRules: [
          { name: "Animals", text: `Giant Bats are animals and thus do not gain experience.` },
          { name: "Flying", text: `Giant Bats fly through the night air, and thus do not need to climb or leap over gaps, even if their movement phase ends with them over open air.` },
          { name: "Large", text: `Giant Bats are Large creatures.` },
          { name: "Sonic", text: `Giant Bats use sonic vibrations to navigate the dark of night. No Line of Sight is needed for a charge.` },
        ],
      },
    ],
    sourceUrl: "https://mordheimer.net/docs/warbands/grade-2a-warbands/survivors-of-strigos",
  },

  // ============================================================
  // Vampire Hunters of Sylvania
  // ============================================================
  {
    id: "vampire_hunters_of_sylvania",
    name: "Vampire Hunters of Sylvania",
    grade: "2a",
    race: "Human",
    originalSetting: "Sylvania",
    sourcebook: "By Tom Bell (PDF)",
    raceTraits: [],
    specialRules: [
      {
        name: "Hired Swords",
        text: `Vampire Hunters accept nearly all aid that is available. As such, they may recruit Hired Swords as if they were Human Mercenaries.`,
      },
      {
        name: "Warband Skill: Iron Will",
        text: `Such is the work of Slayers that there is little room for hesitation. When the opportunity arises, one must be able to strike! As such, the warrior is hardened and immune to Fear.`,
      },
      {
        name: "Warband Skill: Righteous Aura",
        text: `Possessed or Undead opponents lose their first attack against the warrior in the first round of hand-to-hand combat (down to a minimum of 1).`,
      },
      {
        name: "Warband Skill: Thirst for Vengeance",
        text: `The warrior Hates all undead. In his quest for revenge, he gains +1 attack in a turn where he has charged.`,
      },
      {
        name: "Warband Skill: Blessing of Morr",
        text: `Add +1 to all injury rolls against the undead.`,
      },
      {
        name: "Warband Skill: Touch of Darkness",
        text: `Long has the Slayer been dealing in death. Due to his heightened intuition, he ignores darkness penalties.`,
      },
      {
        name: "Equipment List — Miscellaneous Equipment (Heroes only)",
        text: `Holy Water: 10 gc. Blessed Bolts: 25 gc. Holy Relic: 15 gc. Throat Guard: 10 gc.`,
      },
      {
        name: "Special Equipment: Scythe",
        text: `Cost: 10 gc. Availability: Common. Range: Close Combat. Strength: As User +1. Special Rules: Two-Handed — may not use a shield, buckler, or additional weapon in close combat.`,
      },
      {
        name: "Special Equipment: Silver-tip Stake",
        text: `Cost: 15 gc. Availability: Common. Range: Close Combat. Strength: As User. Special Rules: Heart-seeker — adds +1 to the injury roll when it causes a wound against a Vampire. (Note: the equipment list price for the Silver-tip Stake, 10 gc, differs from the Special Equipment entry price, 15 gc, as stated on the source page — reproduced here verbatim as a known discrepancy in the original text.)`,
      },
      {
        name: "Special Equipment: Throat Guard",
        text: `Cost: 10 gc. Availability: Rare 7. Special Rules: Life Saver — all injury rolls caused by a Vampire have a special 6+ save while this equipment is worn. This save is not modified by strength, but can be bypassed by criticals that ignore armour. It does not add any armour-save modifiers, and can be worn on its own, or combined with light or heavy armour.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: "vampire_hunters_hero_equipment",
        name: "Hero Equipment List",
        meleeWeapons: [
          { name: "Dagger", cost: "1st free/2 gc" },
          { name: "Hammer", cost: "3 gc" },
          { name: "Axe", cost: "5 gc" },
          { name: "Sword", cost: "10 gc" },
          { name: "Scythe", cost: "10 gc" },
          { name: "Silver-tip Stake", cost: "10 gc" },
          { name: "Double-handed weapon", cost: "15 gc" },
        ],
        missileWeapons: [
          { name: "Crossbow", cost: "25 gc" },
          { name: "Pistol", cost: "15 gc (30 for brace)" },
          { name: "Crossbow Pistol", cost: "15 gc" },
        ],
        armour: [
          { name: "Light armour", cost: "20 gc" },
          { name: "Shield", cost: "5 gc" },
          { name: "Helmet", cost: "10 gc" },
        ],
      },
      {
        id: "pilgrim_equipment",
        name: "Pilgrim Equipment List",
        meleeWeapons: [
          { name: "Mace", cost: "3 gc" },
          { name: "Silver-tip Stake", cost: "10 gc" },
        ],
        missileWeapons: [],
        armour: [],
      },
      {
        id: "villager_equipment",
        name: "Villager Equipment List",
        meleeWeapons: [
          { name: "Dagger", cost: "1st free/2 gc" },
          { name: "Mace", cost: "3 gc" },
          { name: "Axe", cost: "5 gc" },
          { name: "Sword", cost: "10 gc" },
          { name: "Spear (Pitch Fork)", cost: "10 gc" },
        ],
        missileWeapons: [],
        armour: [],
      },
      {
        id: "no_equipment",
        name: "No Equipment (Wolfhounds)",
        meleeWeapons: [],
        missileWeapons: [],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: "vampire_hunter",
        name: "Vampire Hunter",
        role: "hero",
        cost: 60,
        rosterLimit: "1",
        startingExperience: 20,
        stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: "vampire_hunters_hero_equipment",
        skillTableIds: ["combat", "shooting", "academic", "strength", "speed", "warband-unique"],
        specialRules: [
          { name: "Leader", text: `Any models in the warband within 6" of the Vampire Hunter may use his Leadership instead of their own.` },
          { name: "Stake the Vampire!", text: `A Vampire Hunter Hates Vampires. They must always move towards a Vampire on the field (if he can see them) unless he can shoot (in which case he may choose).` },
        ],
      },
      {
        id: "priest_of_morr",
        name: "Priest of Morr",
        role: "hero",
        cost: 35,
        rosterLimit: "0-1",
        startingExperience: 12,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 9 },
        equipmentListId: "vampire_hunters_hero_equipment",
        skillTableIds: ["academic", "speed", "warband-unique"],
        specialRules: [
          { name: "Loner", text: `A priest of Morr is used to being alone. Priests of Morr do not suffer from the All Alone rules.` },
          { name: "Funerary Rites", text: `Priests of Morr are not wizards, however they may randomly choose a Funerary Rite.` },
          { name: "Equipment Restriction", text: `As priests of Morr seldom engage in martial activities, they may only be armed with a Dagger and a Scythe as weapons, and may never wear Armour.` },
        ],
      },
      {
        id: "slayers",
        name: "Slayers",
        role: "hero",
        cost: 25,
        rosterLimit: "0-3",
        startingExperience: 8,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 8 },
        equipmentListId: "vampire_hunters_hero_equipment",
        skillTableIds: ["combat", "shooting", "strength", "speed", "warband-unique"],
        specialRules: [
          { name: "Stake the Vampire!", text: `A Slayer Hates Vampires. They must always move towards a Vampire on the field (if he can see them) unless he can shoot (in which case he may choose).` },
        ],
      },
    ],
    henchmanTemplates: [
      {
        id: "villagers",
        name: "Villagers",
        role: "henchman",
        cost: 20,
        rosterLimit: "any",
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: "villager_equipment",
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: "pilgrims_of_the_dark_shroud",
        name: "Pilgrims",
        role: "henchman",
        cost: 40,
        rosterLimit: "0-4",
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 4, T: 4, W: 1, I: 3, A: 1, Ld: 10 },
        equipmentListId: "pilgrim_equipment",
        skillTableIds: [],
        specialRules: [
          {
            name: "Fanatical",
            text: `A Pilgrim of Pain believes that the end of the world is nigh should the undead threat not be stopped. Pilgrims automatically pass any leadership-based tests they are required to take. A Pilgrim may never become a Warband leader.`,
          },
          {
            name: "Blunt",
            text: `Due to bludgeoning weapons having a much more profound effect upon the undead, Pilgrims ignore all bladed and ranged weapons in favor of maces, hammers and staffs. The only exception is the silver-tip stake, for its incredible destructive powers against Vampires.`,
          },
        ],
      },
      {
        id: "wolfhounds",
        name: "Wolfhounds",
        role: "henchman",
        cost: 15,
        rosterLimit: "0-4",
        startingExperience: 0,
        stats: { M: 6, WS: 4, BS: 0, S: 4, T: 3, W: 1, I: 4, A: 1, Ld: 5 },
        equipmentListId: "no_equipment",
        skillTableIds: [],
        specialRules: [{ name: "Animal", text: `Wolfhounds are animals and thus do not gain experience.` }],
        notes: "Jaws and brutality — a Wolfhound never uses nor needs weapons or armour.",
      },
    ],
    sourceUrl: "https://mordheimer.net/docs/warbands/grade-2a-warbands/vampire-hunters-of-sylvania",
  },

  // ============================================================
  // Wood Elves of Athel Loren
  // ============================================================
  // TODO: raceTraits includes "hatred" for the warband-wide Hate Dark Elves rule, mapped
  // because the id already exists in the known trait list — but the source restricts this
  // hatred specifically to Dark Elves, not all enemies. If the engine's modeled "hatred" trait
  // is a blanket (untargeted) effect, this mapping over-applies it; flagging for review rather
  // than silently guessing which enemies it should trigger against.
  {
    id: "wood_elves_of_athel_loren",
    name: "Wood Elves of Athel Loren",
    grade: "2a",
    race: "Wood Elf",
    originalSetting: "Athel Loren",
    sourcebook: "(PDF), uncredited",
    raceTraits: ["hatred"],
    specialRules: [
      { name: "Hate Dark Elves", text: `All warriors in a Wood Elves Warband (excluding any Hired Swords) have an unyielding Hatred for Dark Elves.` },
      {
        name: "Excellent Sight",
        text: `Elves have eyesight unmatched by mere humans. All the Elves in a Wood Elf Warband can spot Hidden enemies from twice as far away as other warriors (i.e. twice their Initiative in inches).`,
      },
      {
        name: "Unforgiving",
        text: `In addition to their hatred of their corrupt kin, the folk of Athel Loren will not fight alongside the forces of Chaos. In multiplayer games, a Wood Elf warband may never forge an alliance with any Warband of a chaotic nature (Possessed, Skaven, Beastmen, Dark Elves, etc.).`,
      },
      {
        name: "Tolerant",
        text: `Due to their outsider status in the world, the Elves of Athel Loren have learned to stifle their distaste for 'lesser races'. A Wood Elf Warband may hire any Hired Sword that is not of a Chaotic or evil bent (so no Skaven, Possessed, Beastmen, Dark Elves, Undead, etc.).`,
      },
      {
        name: "Warband Skill: Fey",
        text: `The Wood Elf has a certain understanding of magic and therefore gets a saving throw of 4+ against hostile magic.`,
      },
      { name: "Warband Skill: Elven Luck", text: `The Elven Gods favour the Wood Elf. Once per game, he may reroll any failed roll.` },
      {
        name: "Warband Skill: Excellent Sight (skill)",
        text: `By training his eyesight for years the Wood Elf can spot hidden enemy models up to 2 x I inch away. (Note: the source page flags this as likely a duplicate/oversight, since the same effect is already granted by the warband-wide Excellent Sight special rule above.)`,
      },
      {
        name: "Warband Skill: Seeker",
        text: `Being an expert Tracker, the Wood Elf is able to spot even hidden treasures. He may modify the result of one exploration die by +/- 1. Only one Elven Hero may possess this skill!`,
      },
      {
        name: "Warband Skill: Infiltration",
        text: `The Wood Elf is an expert in infiltrating behind enemy lines. He is always deployed last, anywhere out of sight of the enemy. If both players have infiltrate, roll 1d6 — lowest roll deploys first.`,
      },
      {
        name: "Equipment List — Miscellaneous Equipment",
        text: `Elven Cloak: 75 gc. Elven Wine: 50 gc. Hunting arrows: 35 gc. Ithilmar weapon/armour prices (2 x price for weapons, 60 gc for armour) represent the lower rarity of these items in Ulthuan; when purchasing in Mordheim (or Lustria), Wood Elves pay the same prices as other Warbands and must roll to find them as normal — no roll is necessary when first starting a Wood Elf Warband.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: "wood_elf_hero_equipment",
        name: "Hero Equipment List",
        meleeWeapons: [
          { name: "Dagger", cost: "1st free/2 gc" },
          { name: "Sword", cost: "10 gc" },
          { name: "Double-handed weapon", cost: "15 gc" },
          { name: "Spear", cost: "10 gc" },
          { name: "Ithilmar weapon (Heroes only)", cost: "2 x price" },
        ],
        missileWeapons: [
          { name: "Bow", cost: "10 gc" },
          { name: "Long bow", cost: "15 gc" },
          { name: "Elf Bow", cost: "35 gc" },
        ],
        armour: [
          { name: "Light armour", cost: "20 gc" },
          { name: "Shield", cost: "5 gc" },
          { name: "Ithilmar armour (Heroes only)", cost: "60 gc" },
        ],
      },
      {
        id: "wood_elf_scout_equipment",
        name: "Scout Equipment List",
        meleeWeapons: [
          { name: "Dagger", cost: "1st free/2 gc" },
          { name: "Club", cost: "3 gc" },
          { name: "Axe", cost: "5 gc" },
          { name: "Sword", cost: "10 gc" },
          { name: "Ithilmar weapon (Heroes only)", cost: "2 x price" },
        ],
        missileWeapons: [
          { name: "Bow", cost: "10 gc" },
          { name: "Long bow", cost: "15 gc" },
          { name: "Elf Bow", cost: "35 gc" },
        ],
        armour: [
          { name: "Light armour", cost: "20 gc" },
          { name: "Ithilmar armour (Heroes only)", cost: "60 gc" },
        ],
      },
    ],
    heroTemplates: [
      {
        id: "hunt_master",
        name: "Hunt Master",
        role: "hero",
        cost: 60,
        rosterLimit: "1",
        startingExperience: 20,
        stats: { M: 5, WS: 4, BS: 5, S: 3, T: 3, W: 1, I: 6, A: 1, Ld: 9 },
        equipmentListId: "wood_elf_hero_equipment",
        skillTableIds: ["combat", "shooting", "academic", "speed", "warband-unique"],
        specialRules: [{ name: "Leader", text: `Any warrior within 6" of the Protector of the Hunt may use his Leadership value when taking Leadership tests.` }],
      },
      {
        id: "waywatcher",
        name: "Waywatcher",
        role: "hero",
        cost: 40,
        rosterLimit: "0-2",
        startingExperience: 12,
        stats: { M: 5, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 6, A: 1, Ld: 8 },
        equipmentListId: "wood_elf_hero_equipment",
        skillTableIds: ["combat", "shooting", "speed", "warband-unique"],
        specialRules: [
          { name: "Sniper", text: `Waywatchers can shoot while hiding. After the shot roll a D6, on a 5+ no one noticed where the arrow came from.` },
          {
            name: "Camouflage",
            text: `Waywatchers wear cloaks of green, brown or grey made from leaves sewn together, and paint their faces and bodies with green and brown paint. When a Waywatcher is hidden, each enemy model has to make an additional I test to spot them.`,
          },
        ],
      },
      {
        id: "forest_mage",
        name: "Forest Mage",
        role: "hero",
        cost: 55,
        rosterLimit: "0-1",
        startingExperience: 12,
        stats: { M: 5, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 6, A: 1, Ld: 8 },
        equipmentListId: "wood_elf_hero_equipment",
        skillTableIds: ["shooting", "academic", "speed", "warband-unique"],
        specialRules: [{ name: "Wizard", text: `The Forest Mage is a Wizard and may use the Woodland Incantations spell list.` }],
      },
    ],
    henchmanTemplates: [
      {
        id: "deepwood_scouts",
        name: "Deepwood Scouts",
        role: "henchman",
        cost: 25,
        rosterLimit: "any",
        startingExperience: 0,
        stats: { M: 5, WS: 3, BS: 4, S: 3, T: 3, W: 1, I: 6, A: 1, Ld: 8 },
        equipmentListId: "wood_elf_scout_equipment",
        skillTableIds: [],
        specialRules: [{ name: "Crossfire", text: `If more than one scout henchman shoots at the same target, they get +1 on the injury roll.` }],
        notes: `The source page states Deepwood Scouts cost "35 gold crowns to hire" in their entry heading but lists "25 gold crowns to hire" in the descriptive body text — both figures reproduced from the two locations on the source page as a known discrepancy; 25 gc used here as the body-text figure.`,
      },
      {
        id: "glade_guard",
        name: "Glade Guard",
        role: "henchman",
        cost: 30,
        rosterLimit: "any",
        startingExperience: 0,
        stats: { M: 5, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 5, A: 1, Ld: 7 },
        equipmentListId: "wood_elf_scout_equipment",
        skillTableIds: [],
        specialRules: [],
      },
    ],
    sourceUrl: "https://mordheimer.net/docs/warbands/grade-2a-warbands/wood-elves-of-athel-loren",
  },
];

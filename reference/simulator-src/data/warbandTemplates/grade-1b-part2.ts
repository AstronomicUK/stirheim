// Grade 1b (Part 2) warband templates — converted from rules/warbands/grade-1b-part2.md
// (mordheimer.net, scraped 2026-09-01). Fan-compiled community Mordheim rules reference.
//
// Conversion notes (read before editing):
// - `raceTraits` / `warbandSkillIds` only ever reference ids that already exist in
//   data/skills.ts or the known trait-id list (frenzy, hatred, stupidity,
//   immune_to_psychology, causes_fear, hard_to_kill, hard_head). Nothing here invents a new
//   skill/trait id — anything not already modeled is captured as full-text NamedRules instead
//   (on the WarbandTemplate for warband-wide rules, or on the relevant UnitTemplate for
//   unit-specific ones), so no rule text is lost even though it isn't wired into the engine yet.
// - "Special Equipment" sections (unique weapons/items with their own rules text) don't fit the
//   EquipmentListItem shape (name+cost only), so they're captured as NamedRule entries under
//   specialRules, labelled "Special Equipment: <name>", rather than shoehorned into
//   equipmentLists.
// - Several warbands offer fixed multi-piece "loadouts" (Pit Fighters' fighting styles) rather
//   than an a-la-carte list. EquipmentListItem has no bundle concept, so each style is recorded
//   as a single meleeWeapons entry whose name spells out the full bundle contents.
// - UnitTemplate has no `traits` field (only Character does), so per-unit racial/psychology
//   rules (e.g. a single Hero's Hard to Kill) are captured as that unit's specialRules text
//   only, even where the same concept has a modeled trait id elsewhere in the app.

import type { WarbandTemplate } from "../../types";

export const WARBANDS: WarbandTemplate[] = [
  // =========================================================================================
  // Imperial Outriders
  // =========================================================================================
  {
    id: `imperial_outriders`,
    name: `Imperial Outriders`,
    grade: `1b`,
    race: `Human`,
    originalSetting: `Nemesis Crown`,
    sourcebook: `Nemesis Crown Supplement (PDF)`,
    raceTraits: [],
    specialRules: [
      {
        name: `Hired Swords`,
        text: `The Imperial Outriders may only be accompanied by mounted Hired Swords. This includes the Freelance Knight from the Mordheim Rulebook and the Roadwarden from the Empire In Flames supplement. The Highwayman keeps himself a safe distance from any official representatives of the Empire and so may not be hired.`,
      },
      {
        name: `Further Mounted Rules — Two Weapon Fighting`,
        text: `Mounted warriors may not fight with two weapons, although a shield or buckler may be used as normal. Two-handed weapons are not permitted. The use of a pistol in the first round of hand-to-hand combat replaces the model's usual weapon.`,
      },
      {
        name: `Further Mounted Rules — Targeting Mounted Warriors`,
        text: `Enemies may not target a ridden horse, whether by missiles or in hand-to-hand combat. The rider will always be seen as the greater threat. Due to their prominence, any mounted warrior may always be chosen as a target by a shooter even if there are enemies closer. However the shooters do not gain +1 to hit - the rider is still the same size as before.`,
      },
      {
        name: `Further Mounted Rules — Injuries`,
        text: `To determine the effects of wounds on mounted models, use the Whoa Boy! table from the Blazing Saddles article.`,
      },
      {
        name: `Further Mounted Rules — Stunned Riders`,
        text: `Stunned riders will fall from their mounts as indicated on the Whoa Boy! table. Mounts which subsequently bolt may be remounted should the warrior make base contact with the horse before it leaves the table. Note that whether the mount leaves the table or not, it will be recovered unscathed after the battle.`,
      },
      {
        name: `Further Mounted Rules — Out-of-Action Models`,
        text: `It is possible for a rider to be killed while his mount survives. In this case the mount may be ridden by the dead model's replacement, reducing his cost by 40gc.`,
      },
      {
        name: `Further Mounted Rules — Dead Horses`,
        text: `Dead horses must be replaced before any other income is spent. All Treasures must be sold to fund this. Any model without a mount may not take part in the battle.`,
      },
      {
        name: `Further Mounted Rules — Dense Terrain`,
        text: `Imperial Outriders may ignore the normal warband limitation of two mounts in areas of dense terrain.`,
      },
      {
        name: `Further Mounted Rules — Scenarios`,
        text: `Several scenarios involve the moving of models across the board to achieve the objective, either chasing treasure or exiting the board. In these scenarios the players should place sizeable areas of dense terrain such that it is impossible to traverse the board without entering them. This will force the Outriders to dismount and so improve the game.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `imperial_outriders_standard`,
        name: `Imperial Outriders Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Morning Star`, cost: `15 gc` },
          { name: `Lance`, cost: `40 gc` },
        ],
        missileWeapons: [],
        armour: [
          { name: `Buckler`, cost: `5 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Light armour`, cost: `20 gc` },
          { name: `Heavy armour`, cost: `50 gc` },
          { name: `Barding`, cost: `80 gc` },
          { name: `Ithilmar armour`, cost: `90 gc` },
          { name: `Gromril Armour`, cost: `150 gc` },
        ],
      },
      {
        // TODO: schema forces one equipmentListId per unit, but Outriders/Chasseurs draw from
        // both the base melee/armour list AND the Outrider Missile Weapons list. Composited here
        // into a single list rather than splitting, since UnitTemplate can only reference one id.
        id: `imperial_outriders_outrider`,
        name: `Imperial Outriders Equipment List + Outrider Missile Weapons`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Morning Star`, cost: `15 gc` },
          { name: `Lance`, cost: `40 gc` },
        ],
        missileWeapons: [
          { name: `Pistol`, cost: `15 gc` },
          { name: `Handgun`, cost: `35 gc` },
          { name: `Blunderbuss`, cost: `30 gc` },
          { name: `Hochland Long Rifle`, cost: `200 gc` },
        ],
        armour: [
          { name: `Buckler`, cost: `5 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Light armour`, cost: `20 gc` },
          { name: `Heavy armour`, cost: `50 gc` },
          { name: `Barding`, cost: `80 gc` },
          { name: `Ithilmar armour`, cost: `90 gc` },
          { name: `Gromril Armour`, cost: `150 gc` },
        ],
      },
      {
        // TODO: same composite-list caveat as above, but for Scouts/Grooms + Scout Missile Weapons.
        id: `imperial_outriders_scout`,
        name: `Imperial Outriders Equipment List + Scout Missile Weapons`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Morning Star`, cost: `15 gc` },
          { name: `Lance`, cost: `40 gc` },
        ],
        missileWeapons: [{ name: `Throwing Knives`, cost: `15 gc` }],
        armour: [
          { name: `Buckler`, cost: `5 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Light armour`, cost: `20 gc` },
          { name: `Heavy armour`, cost: `50 gc` },
          { name: `Barding`, cost: `80 gc` },
          { name: `Ithilmar armour`, cost: `90 gc` },
          { name: `Gromril Armour`, cost: `150 gc` },
        ],
      },
    ],
    heroTemplates: [
      {
        id: `imperial_outriders_knight`,
        name: `Knight`,
        role: `hero`,
        cost: 85,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: `imperial_outriders_standard`,
        skillTableIds: [`combat`, `shooting`, `academic`, `strength`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Leader`, text: `Any warrior within 6” of the Knight may use his Leadership characteristic when taking a Leadership test.` },
          { name: `Ride`, text: `The Knight has the Ride skill as detailed in the Blazing Saddles article.` },
          { name: `Mount`, text: `Comes with a Riding Horse. This may be upgraded to a Warhorse for an additional +40 gc.` },
        ],
      },
      {
        id: `imperial_outriders_outrider`,
        name: `Outrider`,
        role: `hero`,
        cost: 65,
        rosterLimit: `0-2`,
        startingExperience: 8,
        stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `imperial_outriders_outrider`,
        skillTableIds: [`combat`, `shooting`, `strength`, `warband-unique`],
        specialRules: [
          { name: `Ride`, text: `Outriders have the Ride skill as detailed in the Blazing Saddles article.` },
          { name: `Mount`, text: `Comes with a Riding Horse which may be upgraded to a Warhorse for an additional +40 gc.` },
        ],
      },
      {
        id: `imperial_outriders_scout`,
        name: `Scout`,
        role: `hero`,
        cost: 45,
        rosterLimit: `0-2`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 6 },
        equipmentListId: `imperial_outriders_scout`,
        skillTableIds: [`combat`, `shooting`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Ride`, text: `Scouts have the Ride skill as detailed in the Blazing Saddles article.` },
          { name: `Mount`, text: `Comes with a Riding Horse.` },
        ],
      },
    ],
    henchmanTemplates: [
      {
        id: `imperial_outriders_chasseur`,
        name: `Chasseur`,
        role: `henchman`,
        cost: 55,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 4, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `imperial_outriders_outrider`,
        skillTableIds: [],
        specialRules: [
          { name: `Ride`, text: `Chasseurs have the Ride skill as detailed in the Blazing Saddles article.` },
          { name: `Mount`, text: `Comes with a Riding Horse.` },
        ],
      },
      {
        id: `imperial_outriders_hussar`,
        name: `Hussar`,
        role: `henchman`,
        cost: 60,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `imperial_outriders_standard`,
        skillTableIds: [],
        specialRules: [
          { name: `Ride`, text: `Horsemen have the Ride skill as detailed in the Blazing Saddles article.` },
          { name: `Combat Riding`, text: `Horsemen have the Combat Riding skill as detailed in the Blazing Saddles article.` },
          { name: `Mount`, text: `Comes with a Riding Horse. This may be upgraded to a Warhorse for an additional +40 gc.` },
        ],
      },
      {
        id: `imperial_outriders_groom`,
        name: `Groom`,
        role: `henchman`,
        cost: 50,
        rosterLimit: `0-2`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 6 },
        equipmentListId: `imperial_outriders_scout`,
        skillTableIds: [],
        specialRules: [
          { name: `Ride`, text: `Grooms have the Ride skill as detailed in the Blazing Saddles article.` },
          { name: `Horse Handling`, text: `Grooms have the Animal Handling skill as detailed in the Blazing Saddles article.` },
          { name: `Mount`, text: `Comes with a Riding Horse.` },
        ],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1b-warbands/imperial-outriders`,
  },

  // =========================================================================================
  // Lizardmen
  // =========================================================================================
  {
    id: `lizardmen`,
    name: `Lizardmen`,
    grade: `1b`,
    race: `Lizardmen (Saurus/Skink)`,
    originalSetting: `Lustria`,
    sourcebook: `Town Cryer #11 (PDF)`,
    raceTraits: [],
    specialRules: [
      {
        name: `Scaly Skin`,
        text: `All Lizardmen have a natural save thanks to their thick scales. Saurus have a 5+ save and Skinks have a 6+. This save cannot be modified beyond 6 due to Strength modifiers but any result of 'no save' on the Critical Hit chart will negate this 6+ save. Light Armour adds +1 to the save, as does the addition of a shield.`,
      },
      {
        name: `Armour`,
        text: `Armour is rare amongst the Lizardmen and the cost of light armour is always 50 gc, even if you are buying it from Equipment chart.`,
      },
      {
        name: `Bite Attack`,
        text: `Saurus have a powerful bite attack, this bite attack uses the Saurus' own Strength to wound and receive no penalty for not using a weapon. The Bite attack always strikes last, regardless of who charged or which weapon is used. The Bite even attacks after Double-Handed Weapons.`,
      },
      {
        name: `Cold Blooded`,
        text: `All Lizardmen are slow to react to psychology, they may roll 3D6 and select the lowest two dice when taking a psychology test or Rout test. A Lizardmen Warband may never use the Leadership of Saurus or Kroxigor when taking a rout test.`,
      },
      {
        name: `Aquatic`,
        text: `Skinks may move through water terrain with no penalty, and count as being in cover whilst they are in the water.`,
      },
      {
        name: `Jungle Born`,
        text: `All Skinks can move through jungle terrain without penalty.`,
      },
      {
        name: `Saurus Rarity`,
        text: `The Slann Mage-Priests would never include more Saurus braves in a Warband than Skink braves and thus you can never have more Saurus braves than Skink braves in the Warband.`,
      },
      {
        name: `Skills list prohibitions`,
        text: `Saurus cannot receive the Academic skill and can never use missile weapons.`,
      },
      {
        name: `Warband Skill: Infiltration (Skinks Only)`,
        text: `The Skink is a great hunter and is an expert at sneaking upon his prey unnoticed. The Hero may set up anywhere on the table but no closer than 12" to an enemy and he must start the game in hiding.`,
      },
      {
        name: `Warband Skill: Great Hunter (Skinks Only)`,
        text: `The Skink Great Crest is adept at making the most of the cover available and imposes an additional -1 to hit the Skink if he is in cover, i.e. a -2 to hit penalty.`,
      },
      {
        name: `Warband Skill: Bellowing Battle Roar (Saurus Only)`,
        text: `The Saurus' roar is so deafening that enemy models in base contact suffer -1 to hit in the first round of combat against them.`,
      },
      {
        name: `Warband Skill: Toughened Hide (Saurus Only)`,
        text: `Through years of battle the Saurus' hide has become hardened and the Saurus will only be taken out of action on a 6+.`,
      },
      {
        name: `Special Equipment: Poisoned Weapons`,
        text: `Skinks are experts at extracting and refining poisons from poisonous frogs, spiders and snakes. Skink Heroes may buy Dark Venom at a cost of 20 pts and Black Lotus at a cost of 10 pts, both of these items are treated as a common item however the poison may only be used on missile weapons. Only Saurus warriors may buy Dark Venom or Black Lotus and use it on their close combat weapons, and they have to buy it as normal from the Trading chart. Skink henchmen may buy low-strength Reptile Venom for their missile weapons at a cost of 5 pts per weapon; this common item adds +1 Strength to the weapon (no -1 save modifier) and lasts one battle only. All henchmen in a group must be armed the same.`,
      },
      {
        name: `Special Equipment: Sacred Markings (intro)`,
        text: `Many Skink and Saurus warriors are born with distinct markings or mutations, regarded as being blessed by the gods. A Hero may only have a single Sacred Marking and these may only be bought when you recruit the Hero, not mid-campaign.`,
      },
      {
        name: `Special Equipment: Oversized Jaws (Cost: 40 gc, Saurus Only)`,
        text: `The Saurus has been granted the addition of powerful neck muscles and oversized jaws, even greater than those of a normal Saurus. The Hero may make his bite attack with +1 Strength.`,
      },
      {
        name: `Special Equipment: Poison Glands (Cost: 40 gc, Skinks Only)`,
        text: `The Skink has been gifted with glands that produce a deadly poison. He may choose to make any number of attacks with his teeth instead of his weapons; these attacks are treated just like a Saurus bite attack. These attacks at +1 save modifier, regardless of the Strength of the Skinks, in addition add +1 to the roll on the Injury table as well.`,
      },
      {
        name: `Special Equipment: Mark of the Old Ones (Cost: 50 gc)`,
        text: `This is the greatest mark a Lizardman can be born with, for these Albinos are destined for greatness in the eyes of their gods and other Lizardmen. The Hero may change one of his failed dice rolls into a successful one; this mark may only be used once per battle and only on actions that the Hero is making himself. You may use this mark on a failed Rout test if you wish.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `lizardmen_saurus`,
        name: `Saurus Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Stone Axe (counts as a club)`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Halberd`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
        ],
        missileWeapons: [],
        armour: [
          { name: `Shield`, cost: `5 gc` },
          { name: `Bone Helmet`, cost: `10 gc` },
          { name: `Light armour`, cost: `50 gc` },
        ],
      },
      {
        id: `lizardmen_skinks`,
        name: `Skinks Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Stone Axe (counts as a club)`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword (Heroes only)`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
        ],
        missileWeapons: [
          { name: `Shortbow`, cost: `5 gc` },
          { name: `Bolas`, cost: `5 gc` },
          { name: `Javelins`, cost: `10 gc` },
          { name: `Throwing Knives`, cost: `15 gc` },
          { name: `Blowpipe`, cost: `25 gc` },
        ],
        armour: [
          { name: `Shield`, cost: `5 gc` },
          { name: `Buckler`, cost: `5 gc` },
          { name: `Bone Helmet (Skink Priest only)`, cost: `10 gc` },
        ],
      },
    ],
    heroTemplates: [
      {
        id: `lizardmen_skink_priest`,
        name: `Skink Priest`,
        role: `hero`,
        cost: 60,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 6, WS: 3, BS: 4, S: 3, T: 3, W: 1, I: 5, A: 1, Ld: 7 },
        equipmentListId: `lizardmen_skinks`,
        skillTableIds: [`academic`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Leader`, text: `The Skink Priest is the leader of the Warband and any Lizardmen within 6" may use his Leadership characteristic for any Leadership tests. If the Skink Priest is killed you may recruit a new Skink Priest but you must play at least one game without the leader to give him time to join up.` },
          { name: `Wizard`, text: `The Skink Priest is a Wizard and may use Lizardmen magic.` },
        ],
      },
      {
        id: `lizardmen_saurus_totem_warrior`,
        name: `Saurus Totem Warrior`,
        role: `hero`,
        cost: 60,
        rosterLimit: `0-1`,
        startingExperience: 11,
        stats: { M: 4, WS: 4, BS: 0, S: 4, T: 4, W: 1, I: 2, A: 2, Ld: 8 },
        equipmentListId: `lizardmen_saurus`,
        skillTableIds: [`combat`, `strength`, `warband-unique`],
        specialRules: [],
        notes: `Source profile lists Attacks as "1+1" (base 1, +1 special bonus over the normal Saurus maximum). Recorded here as the flat total, 2.`,
      },
      {
        id: `lizardmen_skink_great_crest`,
        name: `Skink Great Crest`,
        role: `hero`,
        cost: 30,
        rosterLimit: `0-2`,
        startingExperience: 8,
        stats: { M: 6, WS: 3, BS: 3, S: 3, T: 2, W: 1, I: 4, A: 1, Ld: 7 },
        equipmentListId: `lizardmen_skinks`,
        skillTableIds: [`shooting`, `speed`, `warband-unique`],
        specialRules: [],
      },
    ],
    henchmanTemplates: [
      {
        id: `lizardmen_skink_brave`,
        name: `Skink Brave`,
        role: `henchman`,
        cost: 20,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 6, WS: 2, BS: 3, S: 3, T: 2, W: 1, I: 4, A: 1, Ld: 6 },
        equipmentListId: `lizardmen_skinks`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `lizardmen_saurus_brave`,
        name: `Saurus Brave`,
        role: `henchman`,
        cost: 40,
        rosterLimit: `0-4 (never more Saurus Braves than Skink Braves in the warband)`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 0, S: 4, T: 4, W: 1, I: 1, A: 2, Ld: 7 },
        equipmentListId: `lizardmen_saurus`,
        skillTableIds: [],
        specialRules: [],
        notes: `Source profile lists Attacks as "1+1" (base 1, +1 special bonus over the normal Saurus maximum). Recorded here as the flat total, 2.`,
      },
      {
        // TODO: the Kroxigor's equipment ("equipped with a halberd") is a fixed loadout, not
        // a purchase from either equipment list. equipmentListId points at the closest list
        // (Saurus, which includes Halberd) for reference only — it is not actually chosen from it.
        id: `lizardmen_kroxigor`,
        name: `Kroxigor`,
        role: `henchman`,
        cost: 200,
        rosterLimit: `0-1`,
        startingExperience: 0,
        stats: { M: 6, WS: 3, BS: 0, S: 5, T: 4, W: 3, I: 1, A: 3, Ld: 8 },
        equipmentListId: `lizardmen_saurus`,
        skillTableIds: [],
        specialRules: [
          { name: `Fixed Equipment`, text: `The Kroxigor is equipped with a halberd (fixed — not chosen from an equipment list).` },
          { name: `Scaly Skin`, text: `Kroxigor has a natural save of 4+.` },
          { name: `Aquatic`, text: `Kroxigor may move through water with no penalty, and count as being in cover whilst in water.` },
          { name: `Cause Fear`, text: `Kroxigor are large and frightening monsters that cause Fear.` },
          { name: `Large`, text: `Kroxigor stand out amongst the rest of the Warband and may be picked out by an archer even if he is not the closest model.` },
          { name: `Animal`, text: `Kroxigor are slow-witted creatures that never learn from their mistakes. The Kroxigor doesn't gain experience.` },
        ],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1b-warbands/lizardmen`,
  },

  // =========================================================================================
  // Mootlanders
  // =========================================================================================
  {
    id: `mootlanders`,
    name: `Mootlanders`,
    grade: `1b`,
    race: `Halfling`,
    originalSetting: `Mordheim`,
    sourcebook: `Citadel Journal 36 (PDF)`,
    raceTraits: [],
    specialRules: [
      {
        name: `Fragile`,
        text: `Halflings are very weak and puny and even the lightest of blows tends to knock them senseless. When rolling for a Halfling's injury, treat a roll of a 2 as 'stunned'.`,
      },
      {
        name: `Special Equipment: Cleaver (Cost: 3 gc, Availability: Common)`,
        text: `Cleavers are one of the best kitchen tools for fighting with, it's fairly light and can cut through things rather like an axe. Range: Close Combat. Strength: As user. Special Rule — -1 Save: Target gets -1 to armour save.`,
      },
      {
        name: `Special Equipment: Kitchen Knife (Cost: 2 gc, Availability: Common)`,
        text: `The common kitchen knife does not only have to be used for chopping vegetables, in the chubby but expert hands of a Master Chef it can make an awful mess of his enemies! Range: Close Combat. Strength: As user. Special Rule — +1 Enemy armour save: kitchen knives are not the best weapons to use for penetrating an enemy model's armour. An enemy wounded by a kitchen knife gains a +1 bonus to his armour save, and a 6+ armour save if he has none normally.`,
      },
      {
        name: `Special Equipment: Ladle (Cost: 2 gc, Availability: Common)`,
        text: `A ladle isn't very good for killing your foes but if aimed correctly, a crack across the knuckles can seriously reduce even the best warrior's fighting ability. Range: Close Combat. Strength: As user. Special Rules — No save except shields: the only saving throws allowed against a ladle are from shields or skills. Knuckle Cracking: if a Master Chef manages to hit an enemy in close combat and scores a '6' in doing so he has rapped his enemy across the knuckles and forced him to drop his weapon.`,
      },
      {
        name: `Special Equipment: Tenderiser (Cost: 3 gc, Availability: Common)`,
        text: `Although other warbands scoff at your rolling pins and tenderisers, they are fully capable of crushing a skull or knocking an opponent unconscious. Range: Close Combat. Strength: As user. Special Rule — Stuns on 2-4.`,
      },
      {
        name: `Special Equipment: Cooking Pot Helmet (Cost: 8 gc, Availability: Common)`,
        text: `Any Master Chef worth his salt will remove his silly white hat and put on an even sillier looking cooking pot for protection when a fight is brewing. Special Rule — Avoid Stun: a Master Chef equipped with a cooking pot helmet has a special save of 5+ against being stunned. This save is never modified.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `mootlanders_standard`,
        name: `Mootlander Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Mace`, cost: `3 gc` },
        ],
        missileWeapons: [
          { name: `Bow`, cost: `10 gc` },
          { name: `Short Bow`, cost: `5 gc` },
          { name: `Sling`, cost: `2 gc` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Cooking Pot Helmet`, cost: `8 gc` },
        ],
      },
      {
        // TODO: the Cooking Pot Helmet is documented under Special Equipment (Trading Post
        // purchase) rather than the Master Chef's starting Utensils list, so it isn't included
        // here even though it's thematically a "chef" item — it's still fully captured above
        // under specialRules.
        id: `mootlanders_master_chef`,
        name: `Halfling Master Chef Utensils List`,
        meleeWeapons: [
          { name: `Kitchen Knife`, cost: `2 gc` },
          { name: `Cleaver`, cost: `3 gc` },
          { name: `Ladle`, cost: `2 gc` },
          { name: `Tenderiser`, cost: `3 gc` },
        ],
        missileWeapons: [],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: `mootlanders_moot_elder`,
        name: `Moot Elder`,
        role: `hero`,
        cost: 55,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 4, WS: 3, BS: 5, S: 2, T: 2, W: 1, I: 6, A: 1, Ld: 9 },
        equipmentListId: `mootlanders_standard`,
        skillTableIds: [`combat`, `shooting`, `academic`, `speed`],
        specialRules: [
          { name: `Leader`, text: `Any warrior within 6" of the Moot Elder may use his Leadership characteristic when taking Leadership tests.` },
          { name: `Pistol Option`, text: `The Moot Elder may be armed with a pistol for 15 GC, usually an old family heirloom.` },
        ],
      },
      {
        id: `mootlanders_master_chef`,
        name: `Master Chef`,
        role: `hero`,
        cost: 35,
        rosterLimit: `0-1`,
        startingExperience: 8,
        stats: { M: 4, WS: 3, BS: 4, S: 3, T: 2, W: 1, I: 5, A: 1, Ld: 9 },
        equipmentListId: `mootlanders_master_chef`,
        skillTableIds: [`combat`, `shooting`, `strength`, `speed`],
        specialRules: [
          { name: `Inspired Cooking`, text: `Any Halfling models within 6" of a Halfling Master Chef may re-roll any failed hits in combat (once per turn).` },
        ],
      },
      {
        id: `mootlanders_halfling_thief`,
        name: `Halfling Thief`,
        role: `hero`,
        cost: 25,
        rosterLimit: `0-3`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 4, S: 2, T: 2, W: 1, I: 5, A: 1, Ld: 9 },
        equipmentListId: `mootlanders_standard`,
        skillTableIds: [`shooting`, `academic`, `speed`],
        specialRules: [
          { name: `Sneaky`, text: `Halfling Thieves can hide in the slightest shadow or piece of cover. Halfling thieves always have a -1 to hit modifier when being shot at, this adds to any other modifiers.` },
        ],
        notes: `In the original printed version in Citadel Journal 36, Halfling Thieves had "0-2 Halfling Thieves" in their entry but the Choice of Warriors text stated "three". Since the word "three" was spelled out (easier to typo a "3" into a "2"), the source assumes this is a 0-3 entry.`,
      },
    ],
    henchmanTemplates: [
      {
        id: `mootlanders_warrior`,
        name: `Warrior`,
        role: `henchman`,
        cost: 15,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 4, S: 2, T: 2, W: 1, I: 5, A: 1, Ld: 8 },
        equipmentListId: `mootlanders_standard`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `mootlanders_scout`,
        name: `Scout`,
        role: `henchman`,
        cost: 20,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 4, S: 2, T: 2, W: 1, I: 5, A: 1, Ld: 8 },
        equipmentListId: `mootlanders_standard`,
        skillTableIds: [],
        specialRules: [
          { name: `Keen Eyesight`, text: `Halfling Scouts can spot hidden enemies at twice their Initiative value in inches.` },
        ],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1b-warbands/mootlanders`,
  },

  // =========================================================================================
  // Norse Explorers
  // =========================================================================================
  {
    id: `norse_explorers`,
    name: `Norse Explorers`,
    grade: `1b`,
    race: `Human (Norse)`,
    originalSetting: `Lustria`,
    sourcebook: `Town Cryer #13 (PDF), Border Town Burning (PDF)`,
    raceTraits: [],
    specialRules: [
      {
        name: `Seafaring`,
        text: `The Norse are seafaring people and spend much of their time rowing boats. To represent this, all Norse warriors get +2 to Strength when they row a boat. (Note: the usage of the Strength characteristic for rowing only comes up in the scenario "The Script of Sigmar"; presumably this was intended to be expanded upon later but this never happened.)`,
      },
      {
        name: `Warband Skill: Barbarian Courage`,
        text: `As Norse warriors strive to die bravely in battle, they learn to fear nothing and embrace hardship. This hero never needs to take all alone tests and may re-roll failed fear tests.`,
      },
      {
        name: `Warband Skill: Battle Tongue`,
        text: `Only a hero with the leader skill may gain this skill. It allows models within 12" of him to use his leadership, rather than the normal 6".`,
      },
      {
        name: `Warband Skill: Berserk Charge`,
        text: `The Norse are very skilled with weapons that many other races see as primitive and savage. When this hero is armed with an axe or double handed weapon, he may re-roll all failed to hit rolls when he charges.`,
      },
      {
        name: `Warband Skill: Crushing Blow`,
        text: `Norse warriors train in almost all of their spare time. They are expert fighters and learn to put all of their strength into very powerful attacks. No enemy may parry an attack made by this hero because it strikes with such great power that it pushes right through a buckler or sword.`,
      },
      {
        name: `Warband Skill: Shield Master`,
        text: `Norse warriors begin training with shields when they are still children. Some warriors become so skilled with these weapons they can block almost any blow against them. When this hero is armed with a shield he may parry with it in addition to getting a 6+ save.`,
      },
      {
        name: `Note: Wulfen Wounds (Border Town Burning)`,
        text: `There are two Norse warbands on Broheim: one from Town Cryer for the Lustria setting, and a slightly tweaked version from the Border Town Burning (BTB) supplement. The only difference is the Wulfen/Ulfwerenar's Wounds stat, which has an extra wound in the BTB version. The author for the Lustria warband confirmed the Wulfen in Town Cryer for Lustria was also supposed to be 2 wounds — it was a copy-paste error in the original layout. This document uses the corrected 2-wound value.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `norse_hero`,
        name: `Hero Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
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
        id: `norse_henchmen`,
        name: `Henchmen Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
        ],
        missileWeapons: [{ name: `Throwing Axes (same as Throwing Knives)`, cost: `15 gc` }],
        armour: [
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Light armour`, cost: `20 gc` },
        ],
      },
      {
        id: `norse_hunters`,
        name: `Hunters Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
        ],
        missileWeapons: [
          { name: `Javelins`, cost: `5 gc` },
          { name: `Bow`, cost: `10 gc` },
        ],
        armour: [
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
      {
        id: `norse_berserker`,
        name: `Berserker Equipment List (weapons only — Berserkers may never wear armour)`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
          { name: `Flail`, cost: `15 gc` },
        ],
        missileWeapons: [{ name: `Throwing Axes (same as Throwing Knives)`, cost: `15 gc` }],
        armour: [],
      },
      {
        id: `norse_no_equipment`,
        name: `No Equipment (natural weapons only)`,
        meleeWeapons: [],
        missileWeapons: [],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: `norse_jarl`,
        name: `Jarl`,
        role: `hero`,
        cost: 70,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 4, WS: 4, BS: 3, S: 4, T: 3, W: 1, I: 4, A: 2, Ld: 8 },
        equipmentListId: `norse_hero`,
        skillTableIds: [`combat`, `strength`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Leader`, text: `Any Warrior within 6" of the Jarl may use his Leadership instead of his own when taking Ld tests.` },
        ],
      },
      {
        id: `norse_berserker`,
        name: `Berserker`,
        role: `hero`,
        cost: 50,
        rosterLimit: `0-2`,
        startingExperience: 11,
        stats: { M: 4, WS: 4, BS: 3, S: 4, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `norse_berserker`,
        skillTableIds: [`combat`, `strength`, `warband-unique`],
        specialRules: [
          { name: `Berserkers`, text: `Berserkers are subject to frenzy as detailed in the Psychology section of the Mordheim rulebook.` },
        ],
      },
      {
        id: `norse_wulfen`,
        name: `Wulfen`,
        role: `hero`,
        cost: 90,
        rosterLimit: `0-1`,
        startingExperience: 11,
        stats: { M: 6, WS: 4, BS: 0, S: 4, T: 4, W: 2, I: 4, A: 2, Ld: 7 },
        equipmentListId: `norse_no_equipment`,
        skillTableIds: [`combat`, `strength`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Fear`, text: `Wulfen are terrifying creatures to behold and cause fear.` },
          { name: `Bestial`, text: `Wulfen are ravenous beasts and therefore immune to psychology. Also despite being greatly revered by their barbarian kinsmen, Wulfen are too feral and uncontrolled to become the leader of the warband.` },
          { name: `Unarmed`, text: `A Wulfen is a ravening beast of teeth and claws and may never use weapons or armour, although suffers no penalty for being unarmed.` },
        ],
        notes: `Wounds shown as 2, per the Border Town Burning correction (see the warband-level note on Wulfen Wounds) rather than the original Town Cryer 1-wound printing.`,
      },
      {
        id: `norse_bondsman`,
        name: `Bondsman`,
        role: `hero`,
        cost: 15,
        rosterLimit: `0-2`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 2, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 6 },
        equipmentListId: `norse_hero`,
        skillTableIds: [`combat`, `strength`, `speed`, `warband-unique`],
        specialRules: [],
      },
    ],
    henchmanTemplates: [
      {
        id: `norse_marauder`,
        name: `Marauder`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `norse_henchmen`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `norse_hunter`,
        name: `Hunter`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `norse_hunters`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `norse_wolf`,
        name: `Wolf`,
        role: `henchman`,
        cost: 15,
        rosterLimit: `0-5 (only usable if the warband includes a Wulfen)`,
        startingExperience: 0,
        stats: { M: 9, WS: 3, BS: 0, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 5 },
        equipmentListId: `norse_no_equipment`,
        skillTableIds: [],
        specialRules: [
          { name: `Animals`, text: `Wolves are animals and thus do not gain experience.` },
          { name: `Pack Leader`, text: `Wolves are feral animals that only respond to the strongest in their pack – the Wulfen. In the event that no Wulfen is included in the warband due to a death or an injury, the wolves cannot be used until the creature is replaced.` },
        ],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1b-warbands/norse`,
  },

  // =========================================================================================
  // Outlaws of Stirwood Forest
  // =========================================================================================
  {
    id: `outlaws_of_stirwood_forest`,
    name: `Outlaws of Stirwood Forest`,
    grade: `1b`,
    race: `Human`,
    originalSetting: `Mordheim`,
    sourcebook: `Town Cryer #29 (PDF)`,
    raceTraits: [],
    specialRules: [
      {
        name: `One Missile Weapon, Must Carry a Bow`,
        text: `All warriors in an Outlaws warband may be equipped with only one missile weapon at any time. All warriors must carry a type of bow, but not crossbows, as part of their equipment. So, even if an Outlaw acquires skills that allow him to use additional ballistic weaponry, he cannot do so. The only exception to this is the Cleric who may choose to carry a bow, but is not compelled to do so.`,
      },
      {
        name: `Hired Swords`,
        text: `The following Hired Swords are not available to the Outlaws: Bounty Hunter, Wolf-Priest of Ulric, Norse Shaman, Dark Elf Assassin.`,
      },
      {
        name: `Hunting Arrows`,
        text: `These are available to Heroes at the time of their initial recruitment without having to roll for Rarity. If you wish to subsequently purchase this item during the Trading and Exploration stages of the game, then you would have to roll for Rarity as normal.`,
      },
      {
        name: `Special Equipment: Forest Cloak (Cost: 50 gc, Availability: Rare 10, Heroes only)`,
        text: `Some Outlaws use Forest Cloaks to camouflage themselves against being seen by their enemies. Special Rules: so long as the wearer is beside a tree, bush or hedge, any enemy using any kind of missile weapon at a warrior wearing a Forest Cloak is at an additional –1BS to hit (in addition to all other modifiers). Similarly, if any spellcaster wishes to target a magical attack against an Outlaw camouflaged in this way, he can only do so by successfully rolling a 4+ on a D6. The only exception to this is if the shooting warrior or the spellcaster is already within their Initiative range in inches.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        // TODO: this composites the shared Outlaws equipment list with the items marked
        // "Heroes and Marksmen only" (Long bow, Light armour) — those two roles get the full
        // list; the base "Outlaw" Henchman does not (see outlaws_basic below). Hunting Arrows
        // and the Forest Cloak are captured under specialRules instead since they carry their
        // own rules text beyond a simple cost.
        id: `outlaws_full`,
        name: `Outlaws Equipment List (Heroes & Marksmen)`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Staff/Club/Mace`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
        ],
        missileWeapons: [
          { name: `Short Bow`, cost: `5 gc` },
          { name: `Bow`, cost: `10 gc` },
          { name: `Long bow (Heroes and Marksmen only)`, cost: `15 gc` },
        ],
        armour: [
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Light armour (Heroes and Marksmen only)`, cost: `20 gc` },
        ],
      },
      {
        id: `outlaws_basic`,
        name: `Outlaws Equipment List (rank-and-file Outlaw)`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Staff/Club/Mace`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
        ],
        missileWeapons: [
          { name: `Short Bow`, cost: `5 gc` },
          { name: `Bow`, cost: `10 gc` },
        ],
        armour: [
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
    ],
    heroTemplates: [
      {
        id: `outlaws_bandit_leader`,
        name: `Bandit Leader`,
        role: `hero`,
        cost: 60,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: `outlaws_full`,
        skillTableIds: [`combat`, `shooting`, `academic`, `strength`, `speed`],
        specialRules: [
          { name: `Leader`, text: `Any models in the warband within 6" of the Bandit Leader may use her Leadership instead of their own. (sic — source text uses "her" here.)` },
        ],
      },
      {
        id: `outlaws_champion`,
        name: `Champion`,
        role: `hero`,
        cost: 35,
        rosterLimit: `0-2`,
        startingExperience: 8,
        stats: { M: 4, WS: 3, BS: 4, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `outlaws_full`,
        skillTableIds: [`combat`, `shooting`, `strength`],
        specialRules: [],
      },
      {
        id: `outlaws_cleric`,
        name: `Cleric`,
        role: `hero`,
        cost: 35,
        rosterLimit: `0-1 (taken instead of either a Champion or a Petty Thief slot)`,
        startingExperience: 8,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `outlaws_full`,
        skillTableIds: [`academic`],
        specialRules: [
          { name: `Disciple of Sigmar`, text: `The Cleric has devoted his life in the constant service to Sigmar and as such he would start a campaign knowing one of the Prayers of Sigmar. As with a Witch-Hunter's Warrior Priest, he is also subject to some of the restrictions of being a follower of the Lord Sigmar and may learn neither Sorcery nor Arcane Lore.` },
          { name: `Armour Permitted`, text: `As Prayers are not considered to be Spells, a Cleric may wear armour, if he wishes.` },
        ],
      },
      {
        id: `outlaws_petty_thief`,
        name: `Petty Thief`,
        role: `hero`,
        cost: 20,
        rosterLimit: `0-2 (shares its recruitment slot with the Cleric)`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 6 },
        equipmentListId: `outlaws_full`,
        skillTableIds: [`combat`, `shooting`, `speed`],
        specialRules: [],
      },
    ],
    henchmanTemplates: [
      {
        id: `outlaws_marksman`,
        name: `Marksman`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `0-7`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 4, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `outlaws_full`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `outlaws_outlaw`,
        name: `Outlaw`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `outlaws_basic`,
        skillTableIds: [],
        specialRules: [],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1b-warbands/outlaws-of-stirwood-forest`,
  },

  // =========================================================================================
  // Pirates
  // =========================================================================================
  {
    id: `pirates`,
    name: `Pirates`,
    grade: `1b`,
    race: `Human`,
    originalSetting: `Mordheim`,
    sourcebook: `Town Cryer #9 (PDF)`,
    raceTraits: [],
    specialRules: [
      {
        name: `Swabbies (overview)`,
        text: `Pirate warbands can 'recruit' new members to join the adventuresome life of a pirate, sometimes willingly but oftentimes more as an alternative to walking the plank! Only humans can be recruited in this manner though – not even the most bloodthirsty pirate would ever trust a Skaven or Beastman, and other races even though friendly to mankind would normally never follow a mere human into battle!`,
      },
      {
        name: `Kidnapped!`,
        text: `Enemy human Heroes who after the game rolled up the Captured result (D66 roll of 61) can be 'offered' one opportunity to join the pirate crew (usually at the point of a cutlass!). As an alternative to exchanging/ransoming the captured Hero back to their original Warband (or selling him to slavers), the Pirate Captain can instead add the captured enemy to the ship's crew as follows. Both players roll 2D6, with the Pirate player adding the Captain's Leadership and the enemy player adding the Leadership of the captured Hero. If either side won that game, it may add +1 to its score. If the Pirate player's result is higher, the Hero renounces his old ways and joins the Crew (either starting a new group or joining an existing one of four models or fewer, at no extra cost, with equipment sold off in an even swap for his new unit's gear, and skills/characteristics changed to match a starting Crewman or his new crewmates). Otherwise, the Hero resists and is forced to become a Swabbie: stripped of equipment (handed out as the player desires), retains skills and original characteristics, but can only be re-armed from the Swabbie equipment list. Enemy human Henchmen taken Out of Action and then lost from their original Warband for good (a 1-2 rolled post-game) also have a chance of joining: roll a D6 for each, on a 4+ the Pirates drag them away and patch them up on the ship, then test to join exactly as above (Pirates get +1 automatically since this can only happen if they won). Hired Swords and Special Characters can never be recruited this way. If the Pirates encounter Stragglers (result 44) or Prisoners (result 333) when Searching, these options may be used instead of the regular ones: a Straggler joins as a Swabbie if the Captain passes a Leadership test; for Prisoners, roll a D3 for how many are rescued, each requiring a separate passed Leadership test to join the Crew (as above, or as a Swabbie if the warband can't afford to equip him, or if the test is failed).`,
      },
      {
        name: `Hired Swords`,
        text: `Unless noted otherwise, Pirate Warbands have the same access to Hired Swords & any other items as for a regular human Mercenary Warband, and follow all the normal rules for them as well. They must however pay an additional +20 gc in upkeep if they have both Dwarfs and Elves together in the same warband (the ship is only so big, and the confines make them more irritable than usual!).`,
      },
      {
        name: `One-off games`,
        text: `In one-off games, a Pirate Warband starts with two Swabbies for free.`,
      },
      {
        name: `Succession`,
        text: `If the Captain is killed, one of the Mates will take over in the same manner as a Champion taking over for a Mercenary warband.`,
      },
      {
        name: `Warband Skill: Sea Shanty Singer`,
        text: `The pirate is renowned throughout the seas as one of the greatest singers aboard a ship. At the start of his Close Combat phase he can burst out in song, distracting one opponent in base contact of his choosing. That enemy must pass a Leadership test, or lose 1 Attack that turn. Does not affect Undead or other non-living creatures, such as Possessed.`,
      },
      {
        name: `Warband Skill: Sea Legs`,
        text: `Even in the strongest seas, the pirate has learned to keep his footing and equilibrium. If he Falls during a battle, he may ignore the effects of the D3 hits on a roll of 4+ (single roll for all the hits). In addition, if knocked down or stunned within 1" of a precipice he may re-roll his Initiative test to see if he falls down or not.`,
      },
      {
        name: `Warband Skill: Cutlass Master`,
        text: `If the pirate is equipped with a Sword, this skill gives him the additional benefit of also being able to parry successfully if the player rolls equal to the number rolled to hit, not just higher as normal. This extra ability only applies when the Pirate is not in the open — only when in cover, in a building, or within 2" of a terrain feature like a wall or tree.`,
      },
      {
        name: `Warband Skill: Booming Voice (Captain only)`,
        text: `Once per turn, the captain may shout encouraging words (or threats) at any one pirate within 8" who just failed his test to see if he runs away from combat, or to stop running away if he was already fleeing. That pirate may then re-roll the test. This can only be done if the Captain is on his feet and not himself in close combat.`,
      },
      {
        name: `Warband Skill: Hardy Constitution`,
        text: `During the battle, the pirate may ignore any Critical Hits on a roll of 5+ (the wound is treated as normal if the roll is successful). If the roll is failed, the Critical Hit is worked out as normal.`,
      },
      {
        name: `Warband Skill: Swashbuckler`,
        text: `The pirate may make a Leadership Test at the end of any Hand-to-Hand phase (pirate's or enemy's turn) if still in base contact with any enemy models. If he passes he may make a normal movement away from the enemy (no run or charge), without the enemy striking any blows on him. If he fails he remains in combat and must fight as normal in the following turn.`,
      },
      {
        name: `Special Equipment: Boat Hook (Cost: 8 gc, Availability: Common)`,
        text: `Range: Close Combat. Strength: As user -1. Special Rules — Strike First: allows the user to Strike First in the first round of any close combat, no matter which model charged, but requires both hands. Two Handed: models using a Boat Hook in combat cannot use any other weapons, or gain benefit from a shield or buckler, while in close combat.`,
      },
      {
        name: `Special Equipment: Cat O' Nine Tails (Cost: 8 gc, Availability: Common, Heroes only)`,
        text: `Range: Close Combat. Strength: As user. Special Rules — Cannot be parried: like the Steel Whips of the Sisterhood, Cats cannot be parried by swords or bucklers. Weak: gives the enemy model a +1 to his armour save (6+ for no armour), like a hit from a fist or dagger. Whipcrack: when the wielder charges they gain +1A for that turn (added after other modifications); when charged they gain +1A usable only against the charger, and this bonus attack strikes first. If simultaneously charged by two or more opponents, still only +1A total. If using two whips, +1A for the additional hand weapon, but only the first whip gets the whipcrack +1A.`,
      },
      {
        name: `Special Equipment: Belaying Pins (Cost: 3 gc, Availability: Common)`,
        text: `Range: 6". Strength: As user -1. Special Rules — Awkward Thrown Weapon: no penalties for range, but still -1 to hit if used after moving that turn. Weak: strike at User Strength -1 and give the target +1 to its armour save (or 6+ if none), exactly as if hit by a bare fist.`,
      },
      {
        name: `Special Equipment: Swivel Gun (Cost: 65 gc, Availability: Rare 8)`,
        text: `Special Rules — Prepare shot: takes a complete turn to reload, fires every other turn. Move or fire: may not move and fire in the same turn (other than pivoting on the spot or standing up). Maximum 1 per warband. Cumbersome: user at –1 Initiative and –1 Movement throughout the battle; may never be fired twice per turn or fired if the user moved, regardless of Skills. Blackpowder Rules: the optional Blackpowder weapon rules always apply. Special Ammunition, bought per game and lasting one game each (Gunner declares type before firing if more than one is available): Ball Shot (Cost 5 gc) — Max Range 36", Strength 5, Armour Save -2, Concussion (Injury rolls of 2-4 treated as Stunned). Chain Shot (Cost 2 gc) — Max Range 24", Strength 4, Armour Save -1, All Wrapped Up! (enemy hit but not wounded is Knocked Down on a 4+, even if normally immune to being knocked down). Grape Shot (Cost 2 gc) — Max Range 24", Strength 3, It's Everywhere! (D6 other enemy models within 4" and in Line of Sight each take a single hit, starting with the closest; no armour save modifier; open-target hits can't spread to models in cover unless the original target was itself in cover; Pirates are never hit by friendly Grape Shot).`,
      },
      {
        name: `Special Equipment: Compass (Cost: 45 + 2D6 gc, Availability: Rare 9)`,
        text: `In any scenario where players roll to see which side deploys first, the warband may re-roll their result (only if the pirate with the compass is present). Only one re-roll allowed even with multiple Compasses; if both sides have one, no re-rolls are allowed.`,
      },
      {
        name: `Special Equipment: Hardtack Biscuits (Cost: 5 gc, Availability: Common)`,
        text: `At the start of any one of his turns (if not already in hand-to-hand combat) the pirate may eat some, temporarily gaining +1 Toughness for that turn and the following enemy turn. Roll a D6 after that turn; on a 1 the biscuits were tainted and the pirate must miss the next game (losses from multiple such effects stack to two missed games).`,
      },
      {
        name: `Special Equipment: Hook Hand (Cost: 4 gc, Availability: Common)`,
        text: `For pirates who have lost a hand or arm. Cannot use two-handed weapons, but always counts as having a close combat weapon in that hand, striking as a dagger. May be taken by a new pirate at recruitment. If the wearer suffers a further Hand Injury or Arm Wound, it can be ignored on a 4+ as the hit was taken by the Hook Hand instead.`,
      },
      {
        name: `Special Equipment: Jolly Roger (Cost: 40 + 2D6 gc, Availability: Rare 9)`,
        text: `Any Hero may carry it. Any Pirates within 12" of the Jolly Roger never count as being all alone in combat. Takes up one hand, so the carrier may not use two-handed weapons. Swabbies gain no benefit from it.`,
      },
      {
        name: `Special Equipment: Parrot (Cost: 15 gc, Availability: Rare 8, Captain and Mates only)`,
        text: `All enemy in base contact with the owner are at –1 to hit in their first round of combat with the pirate unless they pass a Leadership Test.`,
      },
      {
        name: `Special Equipment: Peg Leg (Cost: 8 gc, Availability: Common)`,
        text: `For pirates suffering a Leg Wound or Smashed Leg. Reduces Movement (and max possible M) by -1, but grants an unmodified 6+ save whenever any other saving throw is failed against a wounding hit (even where no save is normally allowed). May be taken by a new pirate at recruitment. A further Leg Wound/Smashed Leg can be ignored on a 4+ as the hit was taken by the Peg Leg instead.`,
      },
      {
        name: `Special Equipment: Spy Glass (Cost: 20 gc, Availability: Rare 8)`,
        text: `At the start of his turn, the owner can try to detect one Hidden enemy model with normal Line of Sight. On a 4+, the model loses Hidden status. The spying Pirate may move normally that turn but cannot run or charge.`,
      },
      {
        name: `Special Equipment: Treasure Map (Cost: 75 + 4D6 gc, Availability: Rare 10)`,
        text: `Used instead of regular exploration. Roll a D6 after the game: 1) fake map, but you trounce the seller for D6x5 gc; 2) minor stash — 1 shard of wyrdstone plus jewels worth 2D6x10 gc; 3) an alestash of barrels including one of Bugman's XXXX (as per Bugman's Ale rules), remainder sold for 2D6x10 gc; 4) chests of fine clothes plus blackmail notebooks (Facio's stash) — may buy one item from the regular Price Chart as if Common (except other Pirate-unique items) if affordable, then sell the notebooks for 2D6x10 gc; also, the Captain's Leadership is +1 next game when testing to recruit any Captured/Straggler/Prisoner; 5) a booby-trapped chest — one Hero must pass an Initiative test: success finds a Lucky Charm plus 3D6x10 gc; failure means he misses the next game recovering, but the crew still gets the gold (no Lucky Charm); 6) Black-Wyrd the Pirate King's secret burial site — a small chest yields 2+D3 shards of Wyrdstone plus a Mordheim Map.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `pirates_standard`,
        name: `Pirate Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Boat Hook`, cost: `8 gc` },
          { name: `Cat O' Nine Tails (Heroes only)`, cost: `8 gc` },
          { name: `Cutlass (Sword)`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
        ],
        missileWeapons: [
          { name: `Belaying Pin`, cost: `3 gc` },
          { name: `Crossbow`, cost: `25 gc` },
          { name: `Pistol`, cost: `15 gc (30 for a brace)` },
          { name: `Duelling Pistol`, cost: `30 gc (60 for a brace)` },
        ],
        armour: [
          { name: `Buckler`, cost: `5 gc` },
          { name: `Toughened Leathers`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Light armour`, cost: `20 gc` },
        ],
      },
      {
        id: `pirates_swabbie`,
        name: `Swabbie Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Boat Hook`, cost: `8 gc` },
          { name: `Cutlass (Sword)`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
        ],
        missileWeapons: [
          { name: `Belaying Pin`, cost: `3 gc` },
          { name: `Bow`, cost: `10 gc` },
        ],
        armour: [
          { name: `Buckler`, cost: `5 gc` },
          { name: `Toughened Leathers`, cost: `5 gc` },
        ],
      },
      {
        id: `pirates_gunner`,
        name: `Gunner Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Cutlass (Sword)`, cost: `10 gc` },
        ],
        missileWeapons: [
          { name: `Pistol`, cost: `15 gc (30 for a brace)` },
          { name: `Blunderbuss`, cost: `30 gc` },
          { name: `Duelling Pistol`, cost: `30 gc (60 for a brace)` },
          { name: `Handgun`, cost: `35 gc` },
          { name: `Swivel Gun (Rare 8; one per Warband)`, cost: `65 gc` },
        ],
        armour: [
          { name: `Toughened Leathers`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Light armour`, cost: `20 gc` },
        ],
      },
    ],
    heroTemplates: [
      {
        id: `pirates_captain`,
        name: `Pirate Captain`,
        role: `hero`,
        cost: 60,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: `pirates_standard`,
        skillTableIds: [`combat`, `shooting`, `academic`, `strength`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Leader`, text: `Any pirate within 6" of the Captain may use his Leadership characteristic when taking any Leadership tests.` },
        ],
      },
      {
        id: `pirates_ships_mate`,
        name: `Ship's Mate`,
        role: `hero`,
        cost: 35,
        rosterLimit: `0-2`,
        startingExperience: 8,
        stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `pirates_standard`,
        skillTableIds: [`combat`, `shooting`, `strength`, `warband-unique`],
        specialRules: [],
      },
      {
        id: `pirates_cabin_boy`,
        name: `Cabin Boy`,
        role: `hero`,
        cost: 15,
        rosterLimit: `0-2`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 6 },
        equipmentListId: `pirates_standard`,
        skillTableIds: [`combat`, `shooting`, `speed`, `warband-unique`],
        specialRules: [],
      },
    ],
    henchmanTemplates: [
      {
        id: `pirates_crew`,
        name: `Crew`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `pirates_standard`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `pirates_gunner`,
        name: `Gunner`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `0-7`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `pirates_gunner`,
        skillTableIds: [],
        specialRules: [
          { name: `Swivel Guns is Dangerous, Matey!`, text: `If a Pirate Warband includes a Swivel Gun, the Gunner wielding it will always be considered an individual and can never have anyone else with him. Since a Pirate Warband may only have one Swivel Gun, if a Gunner is equipped with one then he must either be a new Gunner, or split from an existing unit (retaining all Experience and Skills if the latter).` },
        ],
      },
      {
        id: `pirates_boatswain`,
        name: `Boatswain`,
        role: `henchman`,
        cost: 32,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `pirates_standard`,
        skillTableIds: [],
        specialRules: [
          { name: `Fixed Equipment`, text: `Boatswains start with a Rope & Hook, and may be equipped with weapons and armour chosen from the Pirate Equipment list. They can never sell off or give away their Rope & Hook.` },
          { name: `Expert Riggers`, text: `Boatswains may re-roll failed Initiative tests Leaping over Gaps, Jumping Down, and performing a Diving Charge, as well as the normal test for Climbing Up or Down that a Rope allows.` },
        ],
      },
      {
        id: `pirates_swabbie`,
        name: `Swabbie`,
        role: `henchman`,
        cost: null,
        rosterLimit: `0-5 (never more Swabbies than Crew)`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 6 },
        equipmentListId: `pirates_swabbie`,
        skillTableIds: [],
        specialRules: [
          { name: `Not Hired`, text: `Swabbies are not hired, they follow the special 'recruitment' rules described under the warband's Swabbies / Kidnapped! special rules.` },
          { name: `Never Gain Experience`, text: `Swabbies never gain experience in games.` },
          { name: `Rabble`, text: `Swabbies do not need to be armed all the same; each may be given different equipment, but only items listed in the Swabbie equipment list. Swabbies can never use magic or cast spells of any sort.` },
          { name: `'Blimey, they got away!'`, text: `If the Pirate Warband itself Routs, any Swabbies who have already left the table in previous turns are presumed to have escaped and are never seen again — remove them from the roster as if killed.` },
          { name: `'Don't mind them mates, they ain't true pirates!'`, text: `Any Swabbies who are running away or have been taken out of action do not count towards the need to take a Rout test for the warband.` },
        ],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1b-warbands/pirates`,
  },

  // =========================================================================================
  // Pit Fighters
  // =========================================================================================
  {
    id: `pit_fighters`,
    name: `Pit Fighters`,
    grade: `1b`,
    race: `Human/Dwarf/Ogre (mixed)`,
    originalSetting: `Mordheim`,
    sourcebook: `Town Cryer #21 (Revised from TC #14) (PDF)`,
    raceTraits: [`pit_fighter`],
    specialRules: [
      {
        name: `Pit Fighter (skill)`,
        text: `All Pit Fighters have the Pit Fighter skill as described in the Strength Skill List (+1 WS, +1 A when fighting in ruins, buildings and The Pit). Auto-granted to every member of the warband; corresponds to the existing "pit_fighter" skill id in data/skills.ts.`,
      },
      {
        name: `Hired Swords`,
        text: `Pit Fighters may hire all Hired Swords available except for the Elf Ranger, who feels working with such dirty and brutish individuals would just not do!`,
      },
      {
        name: `Weapons & Armour`,
        text: `Unlike other warbands that may choose which weapons and armour to equip their warriors with, Pit Fighters have to choose a specific fighting style which dictates their weapons and armour configuration (except for Trollslayers and Ogres, who choose from a limited selection). The fighting style does not restrict Heroes from using items not on their list if they learn the appropriate skills. Pit Fighters may change their fighting style at any stage by swapping with another warrior or buying a new style (or the separate components). A Henchman group may contain a mix of several different fighting styles and does not have to equip all of its warriors in the same manner.`,
      },
      {
        name: `Free the Slaves!`,
        text: `Pit Fighters hate all slavers. The Pit Fighters will never sell their captured opponents to the slavers.`,
      },
      {
        name: `In the Pit!`,
        text: `Pit Fighters who capture an opponent may decide to let him fight in the infamous fighting pits of Cutthroat's Haven, sending in one or more of their own fighters. If the Pit Fighter wins, he gains +2 Experience, the warband gets all the captive's armour and weapons +50gc. If the Pit Fighter loses, roll to see whether he is dead or injured as normal (ignoring Robbed, Captured, Hardened, Sold to the Pits, and Survives against the Odds results); he will not lose his armour or weapons. The captive gets the 50gc and +2 Experience when he wins. If the captive wins, roll a D6: on a 4+ the audience frees him; on a 1-3 he remains captive and may be fielded in the pits after future games.`,
      },
      {
        name: `Warband Skill: Bulging Biceps`,
        text: `The Pit Fighter may ignore the entire 'heavy' weapons special rule penalty. The Strength bonus will now apply to all rounds in Close-Combat (e.g. a Morning Star gives +1 Strength in every round, not only the first).`,
      },
      {
        name: `Warband Skill: Force of Will`,
        text: `When the Pit Fighter loses his last wound and is taken Out-of-Action, he must roll a D6 equal to or under his Toughness. Each following round he rolls again, with a cumulative -1 modifier per subsequent round. If he succeeds he gets up and may continue to fight. Taken Out-of-Action a second time, he is removed as normal.`,
      },
      {
        name: `Warband Skill: Arms Master`,
        text: `The Pit Fighter may ignore all 'difficult to use' rules for all weapons, enabling combinations such as a Morning Star with a buckler, or even a Morning Star with a Morning Star.`,
      },
      {
        name: `Warband Skill: Body Slam`,
        text: `Instead of a normal charge, the Pit Fighter may attempt to slam his opponent to the ground: instead of his normal attacks he makes a single attack at +1 Str, +1 to Hit, no weapon bonuses or abilities, critical hit on a 5+.`,
      },
      {
        name: `Warband Skill: Grizzled Veteran`,
        text: `The Pit Fighter is immune to all psychology.`,
      },
      {
        name: `Warband Skill: Troll Slayer — Ferocious Charge`,
        text: `The Slayer may double his attacks on the turn that he charges. He will suffer a -1 to hit penalty on that turn.`,
      },
      {
        name: `Warband Skill: Troll Slayer — Monster Slayer`,
        text: `The Slayer always wounds any opponent on a roll of 4+, regardless of Toughness, unless his own Strength (after all modifiers) would mean a lower roll is needed.`,
      },
      {
        name: `Warband Skill: Troll Slayer — Berserker`,
        text: `The Slayer may add +1 to his close combat to-hit rolls during the turn he charges (may not be used with Ferocious Charge).`,
      },
      {
        name: `Special Equipment: Trident (Cost: 15 gc, Availability: Rare 7)`,
        text: `Range: Close Combat. Strength: As user. Special Rules — Parry: can parry enemy blows. Strike first: strikes first when charged.`,
      },
      {
        name: `Special Equipment: Javelins (Cost: 5 gc, Availability: Common)`,
        text: `Range: 8". Strength: As user. Special Rule — Thrown weapon: no penalty for range or moving. Note on conflicting source material: multiple Town Cryer issues and Border Town Burning gave differing javelin rules/ranges; this reflects the thrown-weapon rule from the original rulebook, and the 8" range used by 4 of 5 source versions.`,
      },
      {
        name: `Note: Superseded TC #14 Version`,
        text: `The site also hosts an earlier "Pit Fighters (old)" version of this warband from Town Cryer #14, superseded by this TC #21 revision. That older variant was not separately compiled here.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        // TODO: fixed multi-item loadouts don't fit EquipmentListItem's name+cost shape, so each
        // named "style" is recorded as a single meleeWeapons entry whose name spells out the
        // full bundle (helmet + weapon(s) + shield/armour as applicable).
        id: `pit_fighters_styles`,
        name: `Pit Fighter Equipment List (fixed loadouts, choose one style)`,
        meleeWeapons: [
          { name: `Orc Style — Helmet; Dagger; Axe; Shield`, cost: `20 gc` },
          { name: `Undead Style — Helmet; Dagger; Spiked Gauntlet; Sword`, cost: `35 gc` },
          { name: `Empire Style — Helmet; Dagger; Double-handed Weapon; Light armour`, cost: `45 gc` },
          { name: `Chaos Style — Helmet; Dagger; Flail; Shield; Light armour`, cost: `50 gc` },
        ],
        missileWeapons: [],
        armour: [],
      },
      {
        id: `pit_fighters_pursuer_styles`,
        name: `Pursuer Equipment List (fixed loadouts, choose one style)`,
        meleeWeapons: [
          { name: `Skink Style — Helmet; Dagger; Trident or Javelins; Net or Buckler`, cost: `25 gc` },
          { name: `Witch Elf Style — Helmet; Dagger; 2 x Sword or Spear & Net`, cost: `30 gc` },
        ],
        missileWeapons: [],
        armour: [],
      },
      {
        id: `pit_fighters_ogre_slayer`,
        name: `Ogre & Slayer Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Dwarf Axe (Dwarf Trollslayer only)`, cost: `15 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Flail`, cost: `15 gc` },
          { name: `Spiked Gauntlet`, cost: `15 gc` },
          { name: `Gromril Weapon (Dwarf Trollslayer only)`, cost: `3 times the cost` },
        ],
        missileWeapons: [],
        armour: [
          { name: `Light armour (Ogre only)`, cost: `20 gc` },
          { name: `Helmet (Ogre only)`, cost: `10 gc` },
        ],
      },
    ],
    heroTemplates: [
      {
        id: `pit_fighters_pit_king`,
        name: `Pit King`,
        role: `hero`,
        cost: 80,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 4, WS: 4, BS: 3, S: 4, T: 4, W: 1, I: 4, A: 2, Ld: 8 },
        equipmentListId: `pit_fighters_styles`,
        skillTableIds: [`combat`, `strength`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Leader`, text: `Any models in the Warband within 6" of the King may use his Leadership instead of their own.` },
          { name: `Pit Fighter`, text: `A Pit King has the Pit Fighter skill.` },
        ],
      },
      {
        id: `pit_fighters_troll_slayer`,
        name: `Dwarf Troll Slayer`,
        role: `hero`,
        cost: 50,
        rosterLimit: `0-1`,
        startingExperience: 8,
        stats: { M: 3, WS: 4, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 9 },
        equipmentListId: `pit_fighters_ogre_slayer`,
        skillTableIds: [`combat`, `strength`, `warband-unique`],
        specialRules: [
          { name: `Pit Fighter`, text: `A Dwarf Troll Slayer has the Pit Fighter skill.` },
          { name: `Hard to Kill`, text: `Dwarfs are tough, resilient individuals who can only be taken out of action on a roll of a 6 instead of 5-6 when rolling on the Injury chart. Treat a roll of 1-2 as knocked down, 3-5 as stunned, and 6 as out of action.` },
          { name: `Hard Head`, text: `Dwarfs ignore the special rules for maces, clubs, etc. They are not easy to knock out!` },
          { name: `Hate Orcs and Goblins`, text: `All Dwarfs hate Orcs and Goblins. See the psychology section of the Mordheim rules for details on the effects of hatred.` },
          { name: `Grudgebearers`, text: `Dwarfs hold an ancient grudge against Elves. If the Pit Fighters ever hire any kind of Elven Hired Sword, he will leave the Warband immediately.` },
          { name: `Death Wish`, text: `Troll Slayers seek an honourable death in combat. They are completely immune to all psychology.` },
        ],
        notes: `May never carry or use missile weapons or any form of armour, despite drawing melee weapons from the Ogre & Slayer list.`,
      },
      {
        id: `pit_fighters_pit_veteran`,
        name: `Pit Veteran`,
        role: `hero`,
        cost: 35,
        rosterLimit: `0-2`,
        startingExperience: 8,
        stats: { M: 4, WS: 4, BS: 3, S: 4, T: 3, W: 1, I: 4, A: 1, Ld: 7 },
        equipmentListId: `pit_fighters_styles`,
        skillTableIds: [`combat`, `strength`, `speed`, `warband-unique`],
        specialRules: [{ name: `Pit Fighter`, text: `Pit Veterans have the Pit Fighter skill.` }],
      },
    ],
    henchmanTemplates: [
      {
        id: `pit_fighters_pit_fighter`,
        name: `Pit Fighter`,
        role: `henchman`,
        cost: 35,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `pit_fighters_styles`,
        skillTableIds: [],
        specialRules: [{ name: `Pit Fighter`, text: `Pit Fighters have the Pit Fighter skill.` }],
      },
      {
        id: `pit_fighters_pursuer`,
        name: `Pursuer`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `0-7`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `pit_fighters_pursuer_styles`,
        skillTableIds: [],
        specialRules: [
          { name: `Pit Fighter`, text: `Pursuers have the Pit Fighter skill.` },
          { name: `Evade`, text: `When an enemy charges a Pursuer he may choose to try and evade. On a successful Initiative test it is considered a failed charge and the normal rules apply.` },
        ],
      },
      {
        id: `pit_fighters_ogre`,
        name: `Ogre Pit Fighter`,
        role: `henchman`,
        cost: 165,
        rosterLimit: `0-1`,
        startingExperience: 0,
        stats: { M: 6, WS: 3, BS: 2, S: 4, T: 4, W: 3, I: 3, A: 2, Ld: 7 },
        equipmentListId: `pit_fighters_ogre_slayer`,
        skillTableIds: [],
        specialRules: [
          { name: `Pit Fighter`, text: `An Ogre Pit Fighter has the Pit Fighter skill.` },
          { name: `Fear`, text: `Ogre Pit Fighters are large, threatening creatures that cause fear.` },
          { name: `Large`, text: `Ogre Pit Fighters are huge, lumbering creatures and therefore make tempting targets for archers. Any model may shoot at the Ogre Pit Fighter, even if he is not the closest target.` },
          { name: `Skills`, text: `An Ogre Pit Fighter who becomes a Hero as a result of The Lad's Got Talent may choose from the Combat, Strength and Pit Fighter Special Skills.` },
          { name: `Slow Witted`, text: `Ogres only gain advances at half the rate of everyone else (i.e. they must accrue twice as much experience as normal to get an advance).` },
        ],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1b-warbands/pit-fighters`,
  },

  // =========================================================================================
  // Shadow Warriors
  // =========================================================================================
  {
    id: `shadow_warriors`,
    name: `Shadow Warriors`,
    grade: `1b`,
    race: `High Elf (Elves of Nagarythe)`,
    originalSetting: `Mordheim`,
    sourcebook: `Town Cryer #10 (PDF), revised in Mordheim Annual 2002`,
    raceTraits: [`hatred`],
    specialRules: [
      {
        name: `Hate Dark Elves`,
        text: `All warriors in a Shadow Warrior Warband (excluding any Hired Swords) have an unyielding hatred for Dark Elves. Modeled at the warband level via the "hatred" trait, targeted specifically at Dark Elf opponents.`,
      },
      {
        name: `Excellent Sight`,
        text: `Elves have eyesight unmatched by mere humans. All the Elves in a Shadow Warrior Warband can spot Hidden enemies from twice as far away as other warriors (i.e. twice their Initiative in inches).`,
      },
      {
        name: `Distaste for Poison`,
        text: `The use of poisons and various drugs is a Dark Elf specialty. As such, it is frowned upon by Shadow Warriors, even more so than by other High Elves. Warriors in a Shadow Warrior Warband may not use poisons of any type.`,
      },
      {
        name: `Unforgiving`,
        text: `In multiplayer games, a Shadow Warrior warband may never forge an alliance with any Warband of a Chaotic nature (Possessed, Skaven, Beastmen, Dark Elves, etc.).`,
      },
      {
        name: `Tolerant`,
        text: `A Shadow Warrior Warband may hire any Hired Sword that is not of a Chaotic or evil bent (so no Skaven, Possessed, Beastmen, Dark Elves, Undead, etc.). They also shun the company of anyone specialising in the use of poison (so no Assassins).`,
      },
      {
        name: `Warband Skill: Infiltration`,
        text: `An Elf with this skill is always placed on the battlefield after the opposing warband and can be placed anywhere on the table as long as it is out of sight of the opposing warband and more than 12" away from any enemy model. If both players have models which infiltrate, roll a D6 for each, and the lowest roll sets up first.`,
      },
      {
        name: `Warband Skill: See in Shadows`,
        text: `As long as he has movement to reach them, the warrior may always roll to charge opponents he cannot see (instead of the normal 4").`,
      },
      {
        name: `Warband Skill: Hide in Shadows`,
        text: `An enemy warrior attempting to detect this warrior when he is Hidden must halve his Initiative before measuring the distance.`,
      },
      {
        name: `Warband Skill: Sniper`,
        text: `If Hidden, a warrior with this skill may shoot or cast spells and still remain Hidden. If his target is not immediately taken out of action, they get to test against their Initiative to spot him; a successful test means the Sniper is spotted and no longer hidden.`,
      },
      {
        name: `Warband Skill: Powerful Build`,
        text: `A warrior with this skill may choose skills from the Strength skills table from now on. May not be taken by Shadow Weavers. Never more than two Elves with this skill in the warband at any one time.`,
      },
      {
        name: `Warband Skill: Master of Runes`,
        text: `When using Elven Runestones, the mage is +1 to his dispel roll. In addition, the mage can inscribe the weapons and armour of one fellow warrior with Elven runes, letting that warrior reroll a single failed armour save or Parry roll once per battle; the runes must be redone after each battle. May only be taken by Shadow Weavers.`,
      },
      {
        name: `Special Equipment: Elven Runestones (Cost: 50 + 2D6 gc, Availability: Rare 11, Weavers only)`,
        text: `A mage with Elven Runestones may use them to attempt to dispel a spell successfully cast against himself or another warband member, rolling against the spell's Difficulty (Sorcery does not help). Success negates the spell.`,
      },
      {
        name: `Special Equipment: Elven Wine (Cost: 50 + 3D6 gc, Availability: Rare 10)`,
        text: `A Shadow Warrior Warband that drinks Elven Wine before a battle will be immune to fear for the whole of the battle.`,
      },
      {
        name: `Special Equipment: Standard of Nagarythe (Cost: 75 + 3D6 gc, Availability: Rare 9)`,
        text: `Serves as a second rallying point (the Shadow Master is the first, via his Leader skill). Members within 12" of the standard may re-roll failed Leadership tests. Should the standard be captured (bearer taken Out of Action), all warband members are subject to Hatred for the rest of the game and may not voluntarily Rout — this does not affect Hired Swords. The bearer needs one hand free (no two-handed weapons); the standard can be used in combat as a makeshift spear (spear rules, -1 to hit). May only be purchased at warband creation.`,
      },
      {
        name: `Special Equipment: War Horn of Nagarythe (Cost: 25 + 1D6 gc, Availability: Rare 6)`,
        text: `Functions as a normal War Horn (except for its Rarity and price).`,
      },
      {
        name: `Special Equipment: Familiar (Cost: 20 + 1D6 gc — gold is spent even on an unsuccessful rare roll, Availability: Rare 8)`,
        text: `Represents the ritual cost/chance of summoning an animal familiar; the rarity roll's cost is paid regardless of success. Only spell-casters may attempt to find one. A wizard with a familiar may re-roll one failed spellcasting roll each turn (result must be accepted, no re-rolling a re-roll). Spell-users only, not Prayer-users. Any warband with a spellcaster may use this item if it can be summoned successfully — not exclusive to Shadow Warriors.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `shadow_warriors_standard`,
        name: `Shadow Warrior Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
          { name: `Ithilmar weapon (Heroes only)`, cost: `2 x price` },
        ],
        missileWeapons: [
          { name: `Bow`, cost: `10 gc` },
          { name: `Long bow`, cost: `15 gc` },
          { name: `Elf Bow`, cost: `35 gc` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Ithilmar armour (Heroes only)`, cost: `60 gc` },
        ],
      },
    ],
    heroTemplates: [
      {
        id: `shadow_warriors_shadow_master`,
        name: `Shadow Master`,
        role: `hero`,
        cost: 70,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 5, WS: 5, BS: 5, S: 3, T: 3, W: 1, I: 6, A: 1, Ld: 9 },
        equipmentListId: `shadow_warriors_standard`,
        skillTableIds: [`combat`, `shooting`, `academic`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Leader`, text: `Any warrior within 6" of the Shadow Master may use his Leadership characteristic when taking any Leadership tests.` },
        ],
      },
      {
        id: `shadow_warriors_shadow_walker`,
        name: `Shadow Walker`,
        role: `hero`,
        cost: 45,
        rosterLimit: `0-3`,
        startingExperience: 12,
        stats: { M: 5, WS: 5, BS: 4, S: 3, T: 3, W: 1, I: 6, A: 1, Ld: 8 },
        equipmentListId: `shadow_warriors_standard`,
        skillTableIds: [`combat`, `shooting`, `speed`, `warband-unique`],
        specialRules: [],
      },
      {
        id: `shadow_warriors_shadow_weaver`,
        name: `Shadow Weaver`,
        role: `hero`,
        cost: 55,
        rosterLimit: `0-1`,
        startingExperience: 12,
        stats: { M: 5, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 6, A: 1, Ld: 8 },
        equipmentListId: `shadow_warriors_standard`,
        skillTableIds: [`combat`, `academic`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Wizard`, text: `The Shadow Weaver is a wizard and may use the Shadow Magic.` },
          { name: `No Armour While Casting`, text: `May not cast spells if wearing armour.` },
        ],
      },
    ],
    henchmanTemplates: [
      {
        id: `shadow_warriors_shadow_warrior`,
        name: `Shadow Warrior`,
        role: `henchman`,
        cost: 35,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 5, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 6, A: 1, Ld: 8 },
        equipmentListId: `shadow_warriors_standard`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `shadow_warriors_novice`,
        name: `Shadow Warrior Novice`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 5, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 5, A: 1, Ld: 7 },
        equipmentListId: `shadow_warriors_standard`,
        skillTableIds: [],
        specialRules: [],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1b-warbands/shadow-warriors`,
  },

  // =========================================================================================
  // Skaven of Clan Pestilens
  // =========================================================================================
  {
    id: `skaven_of_clan_pestilens`,
    name: `Skaven of Clan Pestilens`,
    grade: `1b`,
    race: `Skaven`,
    originalSetting: `Mordheim`,
    sourcebook: `Town Cryer #29 (PDF)`,
    raceTraits: [],
    specialRules: [
      {
        name: `No warband-wide always-active rules`,
        text: `No warband-wide always-active special rules beyond the equipment, skills, and starting-experience rules are listed on the source page — Clan Pestilens' distinct flavour is carried entirely through its special skills and special equipment.`,
      },
      {
        name: `Warband Skill: Black Hunger`,
        text: `The Skaven Hero may declare at the beginning of his turn that he is using this skill. He may add +1 attack and +D3" to his total move for the duration of his own turn but will suffer D3 S3 hits with no armour save possible at the end of the turn.`,
      },
      {
        name: `Warband Skill: Censer Bearer`,
        text: `Only a Clan Pestilens member with the Black Hunger special skill may choose this. A Censer Bearer gains the special rule frenzy and the only weapon he may use in close combat is a censer.`,
      },
      {
        name: `Warband Skill: Rotten Body`,
        text: `A Clan Pestilens member with this skill is immune to poison and diseases and, if taken out of action because of a failed test while wielding a censer, does not roll for injuries at the end of the battle, recovering automatically.`,
      },
      {
        name: `Warband Skill: Contagious`,
        text: `Only a member with Rotten Body may choose this. A model who inflicts an injury in close combat that sends this member out of action must take a Toughness test (D6, roll higher than Toughness = automatic wound; a 6 always wounds). Undead and Possessed models never take this test.`,
      },
      {
        name: `Warband Skill: Ignore Pain`,
        text: `Only a member with the Resilient strength skill may choose this. Treats "Stunned" injuries as "Knocked Down".`,
      },
      {
        name: `Special Equipment: Censer (Cost: 40 gc, Availability: Rare 9)`,
        text: `Range: Close Combat. Strength: As user +2 (the +2 applies only to the first turn of combat — Heavy). Two-handed: requires two hands, no shield/buckler/additional weapon in close combat. Fog of Death: a model hit must take a Toughness test (D6 higher than Toughness = automatic wound in addition to the censer hit, a 6 always wounds; the wielder also tests and suffers a wound on a 6; Undead/Possessed immune). If the wielder also has fog-enhancing warpstone shards, missile attackers against him suffer -1 to hit.`,
      },
      {
        name: `Special Equipment: Disease Dagger (Cost: 15 gc, Availability: Rare 8)`,
        text: `Range: Close Combat. Strength: As user. +1 Enemy Armour Save (as a dagger). Infecting: a natural 6 to-hit means the target must take a Toughness test (D6 higher than Toughness = automatic wound in addition to the dagger hit; Undead/Possessed immune). A model wielding two Disease Daggers gains the usual +1 Attack for dual-wielding, with more chances to roll an infecting 6.`,
      },
      {
        name: `Special Equipment: Clan Pestilens Banner (Cost: 10 gc, Availability: Rare 5)`,
        text: `A model within 12" of the standard bearer (usually a Plague Monk or Monk Initiate) may reroll once every failed all-alone test. The staff counts as a two-handed weapon. A warband may have a single one at any time; used instead of the normal Banner.`,
      },
      {
        name: `Special Equipment: Fog-Enhancing Warpstone Shards (Cost: 100 + D6 x 10 gc, Availability: Rare 9)`,
        text: `Placed inside a censer, makes the resulting fumes thicker. The wielder of the censer becomes a difficult target to shoot at (-1 to hit for missile attackers). Used instead of the Elven Cloak.`,
      },
      {
        name: `Special Equipment: Liber Bubonicus (Cost: 200 + D6 x 25 gc, Availability: Rare 12)`,
        text: `A Pestilens Sorcerer may use it to permanently learn an additional spell randomly chosen from the Horned Rat spell list. A Plague Priest with the Magical Aptitude skill may use it to gain the special rule "Spellcaster" (casting from the Horned Rat spell list) and permanently learn a randomly chosen spell. Usable a single time; a warband cannot use more than one Liber Bubonicus in a campaign. Replaces the Tome of Magic — Arcane Lore is used to learn from it, as with the Tome of Magic.`,
      },
      {
        name: `Special Equipment: Liturgicus Infecticus (Cost: 30 + 2D6 gc, Availability: Rare 8)`,
        text: `At the start of a turn, or just before a Rout Test, the warband may chant it for a +1 Leadership bonus until the end of the turn. Replaces the War Horn.`,
      },
      {
        name: `Special Equipment: Vial of Pestilens (Cost: 25 + 2D6 gc, Availability: Rare 9)`,
        text: `May be opened and shoved in the face of the model in base contact that just took the Skaven Out of Action. The opponent must roll equal to or under Toughness or is automatically taken Out of Action, no save; if he succumbs, the Skaven is only Stunned, not Out of Action. Single use.`,
      },
      {
        name: `Special Equipment: Scroll of the Rat Familiar (Cost: 25 + 1D6 gc, Availability: Rare 8)`,
        text: `Usable by a Pestilens Sorcerer as many times as he wants. If the warband includes a Giant Rat, the spell can transform it into a Rat Familiar (profile: M6 WS2 BS0 S3 T3 W1 I4 A1 Ld4) before combat. If within 6", the sorcerer may reroll once per game the dice to overcome a spell's difficulty. Only one Rat Familiar at a time; it counts as a henchman toward the warband maximum. If the sorcerer dies, it reverts to a Giant Rat. Replaces the normal Familiar. Enchanted Animal: the Rat Familiar earns experience as a henchman; a 10-12 result on the henchman advancement table instead grants "Improved spellcasting" (+1 cumulative bonus to the sorcerer's spellcasting roll while within 6").`,
      },
      {
        name: `Special Equipment: Warpstone Amulet (Cost: 10 gc, Availability: Rare 5)`,
        text: `The owner may reroll a single die during the battle or, if not out of combat at the end of the game, a single die when looking for wyrdstone shards. Used instead of the Rabbit's Foot.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `skaven_pestilens_heroes`,
        name: `Heroes Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Club`, cost: `3 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Halberd`, cost: `10 gc` },
          { name: `Flail`, cost: `15 gc` },
          { name: `Disease Dagger`, cost: `15 gc` },
          { name: `Censer`, cost: `40 gc` },
        ],
        missileWeapons: [{ name: `Sling`, cost: `2 gc` }],
        armour: [
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
          { name: `Light armour`, cost: `20 gc` },
        ],
      },
      {
        id: `skaven_pestilens_henchmen`,
        name: `Henchmen Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Club`, cost: `3 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
        ],
        missileWeapons: [{ name: `Sling`, cost: `2 gc` }],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
      {
        id: `skaven_pestilens_no_equipment`,
        name: `No Equipment (natural weapons only)`,
        meleeWeapons: [],
        missileWeapons: [],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: `skaven_pestilens_plague_priest`,
        name: `Plague Priest`,
        role: `hero`,
        cost: 85,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 5, WS: 4, BS: 4, S: 4, T: 4, W: 1, I: 5, A: 1, Ld: 7 },
        equipmentListId: `skaven_pestilens_heroes`,
        skillTableIds: [`combat`, `shooting`, `academic`, `strength`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Leader`, text: `Any warrior within 6" of the Plague Priest may use his Leadership instead of his own.` },
        ],
      },
      {
        id: `skaven_pestilens_sorcerer`,
        name: `Pestilens Sorcerer`,
        role: `hero`,
        cost: 45,
        rosterLimit: `0-1`,
        startingExperience: 8,
        stats: { M: 5, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 6 },
        equipmentListId: `skaven_pestilens_heroes`,
        skillTableIds: [`academic`, `speed`, `warband-unique`],
        specialRules: [
          { name: `Spellcaster`, text: `The Pestilens Sorcerer is a spellcaster and may cast spells from the Horned Rat spell list.` },
        ],
      },
      {
        id: `skaven_pestilens_plague_monk`,
        name: `Plague Monk`,
        role: `hero`,
        cost: 45,
        rosterLimit: `0-2`,
        startingExperience: 8,
        stats: { M: 5, WS: 4, BS: 3, S: 3, T: 4, W: 1, I: 5, A: 1, Ld: 6 },
        equipmentListId: `skaven_pestilens_heroes`,
        skillTableIds: [`combat`, `shooting`, `strength`, `speed`, `warband-unique`],
        specialRules: [],
      },
      {
        id: `skaven_pestilens_monk_initiate`,
        name: `Monk Initiate`,
        role: `hero`,
        cost: 20,
        rosterLimit: `0-2`,
        startingExperience: 0,
        stats: { M: 5, WS: 2, BS: 3, S: 2, T: 2, W: 1, I: 4, A: 1, Ld: 4 },
        equipmentListId: `skaven_pestilens_heroes`,
        skillTableIds: [`combat`, `shooting`, `speed`, `warband-unique`],
        specialRules: [],
      },
    ],
    henchmanTemplates: [
      {
        id: `skaven_pestilens_plague_novice`,
        name: `Plague Novice`,
        role: `henchman`,
        cost: 20,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 5, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 5 },
        equipmentListId: `skaven_pestilens_henchmen`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `skaven_pestilens_giant_rat`,
        name: `Giant Rat`,
        role: `henchman`,
        cost: 15,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 6, WS: 2, BS: 0, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 4 },
        equipmentListId: `skaven_pestilens_no_equipment`,
        skillTableIds: [],
        specialRules: [{ name: `Experience`, text: `Giant Rats are animals and do not gain experience.` }],
      },
      {
        id: `skaven_pestilens_rat_ogre`,
        name: `Rat Ogre`,
        role: `henchman`,
        cost: 210,
        rosterLimit: `0-1`,
        startingExperience: 0,
        stats: { M: 6, WS: 3, BS: 3, S: 5, T: 5, W: 3, I: 4, A: 3, Ld: 4 },
        equipmentListId: `skaven_pestilens_no_equipment`,
        skillTableIds: [],
        specialRules: [
          { name: `Fear`, text: `Rat Ogres are so frightening they cause fear.` },
          { name: `Stupidity`, text: `A Rat Ogre is subject to stupidity unless a Skaven Hero is within 6" of it.` },
          { name: `Experience`, text: `Rat Ogres do not gain experience.` },
          { name: `Large Target`, text: `Rat Ogres are Large Targets as defined in the shooting rules.` },
        ],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1b-warbands/skaven-pestilens`,
  },

  // =========================================================================================
  // Tileans — Miragleans
  // =========================================================================================
  {
    id: `tileans_miragleans`,
    name: `Tileans — Miragleans`,
    grade: `1b`,
    race: `Human (Tilean)`,
    originalSetting: `Lustria, Cities of Gold`,
    sourcebook: `Town Cryer #14 (PDF)`,
    raceTraits: [`hatred`],
    specialRules: [
      {
        name: `Crossbow Accuracy`,
        text: `The Miragleans are deadly accurate with the city's official weapon, the crossbow. Miraglean Heroes have a +1 to hit when using crossbows only. Marksmen get a +1 to hit with any missile weapon they use.`,
      },
      {
        name: `Hatred of Skaven`,
        text: `All Miragleans have a deep-seated hatred toward Skaven, dating back to the red pox outbreak of 1812 when three quarters of the city's population perished. When fighting Skaven a Miraglean warband is affected by the rules for hatred towards them. Hired swords are not affected. Modeled at the warband level via the "hatred" trait.`,
      },
      {
        name: `Hired Swords`,
        text: `Miraglean warbands cannot have Skaven Hired Swords.`,
      },
      {
        name: `Note: Shared Tileans Source Page`,
        text: `This single source page covers three city-of-origin sub-warbands (Miragleans, Remasens, Trantios) sharing a common roster, profiles, and equipment lists, differing only in special rules and skill-table access. Modeled here as three separate WarbandTemplate entries. Community research notes that some rules present in the original submitted design were omitted from the published Town Cryer #14 version; this reflects the published version as presented on the source page.`,
      },
      {
        name: `Special Equipment: Pike (Tileans) (Cost: 12 gc, Availability: Rare 7)`,
        text: `Range: Close Combat (3"). Strength: As user. Special Rules — Strike First: can strike first in the first round of combat even when charged by a spear; after the initial round, resolve in Initiative order (can switch to normal weapons after). Long Polearm: can attack another model up to 3" away without joining a hand-to-hand melee. Unwieldy: requires both hands, only 1 attack allowed, no shield/buckler benefit while using it. Large: only man-sized or larger creatures can use pikes (not Skaven, Skinks, Halflings, etc). Note (Reach): since "reach" mechanics were removed from Mordheim, it's recommended to use the later Pike (Merchant Caravans) rules from Border Town Burning.`,
      },
      {
        name: `Special Equipment: Rapier (Cost: 15 gc, Availability: Rare 5)`,
        text: `Range: Close Combat. Strength: As user. Special Rules — Parry: as with all swords, may parry (opponent's hit is discarded if you roll greater than their highest to-hit roll). Barrage: if you hit but fail to wound, you may attack again as if you had another attack but at -1 to hit (down to a maximum of needing a 6), continuing as long as you hit. Armour Save: because a rapier is light and lacks a broadsword's armour-breaking blade, armour saves against it are made at +1.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `tileans_miragleans_standard`,
        name: `Tilean Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Halberd`, cost: `10 gc` },
          { name: `Pike`, cost: `12 gc` },
          { name: `Morning star`, cost: `15 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
          { name: `Rapier`, cost: `15 gc` },
        ],
        missileWeapons: [
          { name: `Crossbow`, cost: `25 gc` },
          { name: `Pistol`, cost: `15 gc (30 for a brace)` },
          { name: `Duelling Pistol`, cost: `25 gc (50 for a brace)` },
          { name: `Bow`, cost: `10 gc` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Buckler`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
      {
        id: `tileans_miragleans_marksman`,
        name: `Marksman Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
        ],
        missileWeapons: [
          { name: `Crossbow`, cost: `25 gc` },
          { name: `Pistol`, cost: `15 gc (30 for a brace)` },
          { name: `Duelling Pistol`, cost: `25 gc (50 for a brace)` },
          { name: `Long bow`, cost: `15 gc` },
          { name: `Handgun`, cost: `35 gc` },
          { name: `Hunting Rifle`, cost: `200 gc` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
    ],
    heroTemplates: [
      {
        id: `tileans_miragleans_captain`,
        name: `Captain`,
        role: `hero`,
        cost: 60,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 2, Ld: 8 },
        equipmentListId: `tileans_miragleans_standard`,
        skillTableIds: [`combat`, `shooting`, `academic`, `strength`, `speed`],
        specialRules: [
          { name: `Leader`, text: `Any warrior within 6" of the Captain may use his Leadership characteristic when taking Leadership tests.` },
        ],
      },
      {
        id: `tileans_miragleans_champion`,
        name: `Champion`,
        role: `hero`,
        cost: 35,
        rosterLimit: `0-2`,
        startingExperience: 8,
        stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 7 },
        equipmentListId: `tileans_miragleans_standard`,
        skillTableIds: [`combat`, `shooting`, `speed`],
        specialRules: [],
      },
      {
        id: `tileans_miragleans_youngblood`,
        name: `Youngblood`,
        role: `hero`,
        cost: 15,
        rosterLimit: `0-2`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 6 },
        equipmentListId: `tileans_miragleans_standard`,
        skillTableIds: [`shooting`, `strength`, `speed`],
        specialRules: [],
      },
    ],
    henchmanTemplates: [
      {
        id: `tileans_miragleans_warrior`,
        name: `Warrior`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `tileans_miragleans_standard`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `tileans_miragleans_marksman`,
        name: `Marksman`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `0-7`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `tileans_miragleans_marksman`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `tileans_miragleans_duellist`,
        name: `Duellist`,
        role: `henchman`,
        cost: 35,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 7 },
        equipmentListId: `tileans_miragleans_standard`,
        skillTableIds: [],
        specialRules: [
          { name: `Cloak & Dagger`, text: `Duellists are adept at fighting using their billowing cloaks to swirl at an enemy distracting him and warding off blows. The Duellist counts as using a buckler in close combat.` },
        ],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1b-warbands/tileans`,
  },

  // =========================================================================================
  // Tileans — Remasens
  // =========================================================================================
  {
    id: `tileans_remasens`,
    name: `Tileans — Remasens`,
    grade: `1b`,
    race: `Human (Tilean)`,
    originalSetting: `Lustria, Cities of Gold`,
    sourcebook: `Town Cryer #14 (PDF)`,
    raceTraits: [],
    specialRules: [
      {
        name: `Fight to the Death vs Dark Elves`,
        text: `In 1487 a fleet of Dark Elf warships invaded the coastal city of Remas and ever since the people of that city have a deep dislike of the Druchii. A warband from Remas will fight to the death against any Dark Elf warband they encounter. The Remasen player is allowed to re-roll any Rout test one time and must abide by the second roll. This only applies when fighting Dark Elves. (Mechanically a rout-test reroll, not the standard psychology "Hatred" rule — not mapped to the generic hatred trait.)`,
      },
      {
        name: `Steadfast Officers`,
        text: `Remasen officers are steadfast individuals whose years of training have afforded them excellent leadership. The Leadership value of a Remasen captain, champion and youngblood are always one point higher regardless of whom they are fighting. Applied directly to the Captain/Champion/Youngblood stat blocks below.`,
      },
      {
        name: `Hired Swords`,
        text: `Remasen warbands cannot have Dark Elf Hired Swords.`,
      },
      {
        name: `Note: Shared Tileans Source Page`,
        text: `See the Tileans — Miragleans entry for a note on the shared three-sub-warband source page (Miragleans, Remasens, Trantios all draw from the same mordheimer.net page).`,
      },
      {
        name: `Special Equipment: Pike (Tileans) (Cost: 12 gc, Availability: Rare 7)`,
        text: `Range: Close Combat (3"). Strength: As user. Special Rules — Strike First: can strike first in the first round of combat even when charged by a spear; after the initial round, resolve in Initiative order (can switch to normal weapons after). Long Polearm: can attack another model up to 3" away without joining a hand-to-hand melee. Unwieldy: requires both hands, only 1 attack allowed, no shield/buckler benefit while using it. Large: only man-sized or larger creatures can use pikes (not Skaven, Skinks, Halflings, etc). Note (Reach): since "reach" mechanics were removed from Mordheim, it's recommended to use the later Pike (Merchant Caravans) rules from Border Town Burning.`,
      },
      {
        name: `Special Equipment: Rapier (Cost: 15 gc, Availability: Rare 5)`,
        text: `Range: Close Combat. Strength: As user. Special Rules — Parry: as with all swords, may parry (opponent's hit is discarded if you roll greater than their highest to-hit roll). Barrage: if you hit but fail to wound, you may attack again as if you had another attack but at -1 to hit (down to a maximum of needing a 6), continuing as long as you hit. Armour Save: because a rapier is light and lacks a broadsword's armour-breaking blade, armour saves against it are made at +1.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `tileans_remasens_standard`,
        name: `Tilean Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Halberd`, cost: `10 gc` },
          { name: `Pike`, cost: `12 gc` },
          { name: `Morning star`, cost: `15 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
          { name: `Rapier`, cost: `15 gc` },
        ],
        missileWeapons: [
          { name: `Crossbow`, cost: `25 gc` },
          { name: `Pistol`, cost: `15 gc (30 for a brace)` },
          { name: `Duelling Pistol`, cost: `25 gc (50 for a brace)` },
          { name: `Bow`, cost: `10 gc` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Buckler`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
      {
        id: `tileans_remasens_marksman`,
        name: `Marksman Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
        ],
        missileWeapons: [
          { name: `Crossbow`, cost: `25 gc` },
          { name: `Pistol`, cost: `15 gc (30 for a brace)` },
          { name: `Duelling Pistol`, cost: `25 gc (50 for a brace)` },
          { name: `Long bow`, cost: `15 gc` },
          { name: `Handgun`, cost: `35 gc` },
          { name: `Hunting Rifle`, cost: `200 gc` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
    ],
    heroTemplates: [
      {
        id: `tileans_remasens_captain`,
        name: `Captain`,
        role: `hero`,
        cost: 60,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 2, Ld: 9 },
        equipmentListId: `tileans_remasens_standard`,
        skillTableIds: [`combat`, `shooting`, `academic`, `strength`, `speed`],
        specialRules: [
          { name: `Leader`, text: `Any warrior within 6" of the Captain may use his Leadership characteristic when taking Leadership tests.` },
        ],
        notes: `Ld shown as 9 (base 8 +1 from the Remasen "Steadfast Officers" special rule).`,
      },
      {
        id: `tileans_remasens_champion`,
        name: `Champion`,
        role: `hero`,
        cost: 35,
        rosterLimit: `0-2`,
        startingExperience: 8,
        stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
        equipmentListId: `tileans_remasens_standard`,
        skillTableIds: [`combat`, `academic`, `strength`],
        specialRules: [],
        notes: `Ld shown as 8 (base 7 +1 from the Remasen "Steadfast Officers" special rule).`,
      },
      {
        id: `tileans_remasens_youngblood`,
        name: `Youngblood`,
        role: `hero`,
        cost: 15,
        rosterLimit: `0-2`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `tileans_remasens_standard`,
        skillTableIds: [`combat`, `academic`, `speed`],
        specialRules: [],
        notes: `Ld shown as 7 (base 6 +1 from the Remasen "Steadfast Officers" special rule).`,
      },
    ],
    henchmanTemplates: [
      {
        id: `tileans_remasens_warrior`,
        name: `Warrior`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `tileans_remasens_standard`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `tileans_remasens_marksman`,
        name: `Marksman`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `0-7`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `tileans_remasens_marksman`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `tileans_remasens_duellist`,
        name: `Duellist`,
        role: `henchman`,
        cost: 35,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 7 },
        equipmentListId: `tileans_remasens_standard`,
        skillTableIds: [],
        specialRules: [
          { name: `Cloak & Dagger`, text: `Duellists are adept at fighting using their billowing cloaks to swirl at an enemy distracting him and warding off blows. The Duellist counts as using a buckler in close combat.` },
        ],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1b-warbands/tileans`,
  },

  // =========================================================================================
  // Tileans — Trantios
  // =========================================================================================
  {
    id: `tileans_trantios`,
    name: `Tileans — Trantios`,
    grade: `1b`,
    race: `Human (Tilean)`,
    originalSetting: `Lustria, Cities of Gold`,
    sourcebook: `Town Cryer #14 (PDF)`,
    raceTraits: [],
    specialRules: [
      {
        name: `Bonus Starting Gold`,
        text: `A warband hailing from Trantio will be the best-equipped and most experienced human warband in Lustria. To represent this, a Trantio warband will always start a one-off match with an extra 100 GC, and in a Lustrian campaign will start with an extra 20% GC added to their total.`,
      },
      {
        name: `Note: Shared Tileans Source Page`,
        text: `See the Tileans — Miragleans entry for a note on the shared three-sub-warband source page (Miragleans, Remasens, Trantios all draw from the same mordheimer.net page).`,
      },
      {
        name: `Special Equipment: Pike (Tileans) (Cost: 12 gc, Availability: Rare 7)`,
        text: `Range: Close Combat (3"). Strength: As user. Special Rules — Strike First: can strike first in the first round of combat even when charged by a spear; after the initial round, resolve in Initiative order (can switch to normal weapons after). Long Polearm: can attack another model up to 3" away without joining a hand-to-hand melee. Unwieldy: requires both hands, only 1 attack allowed, no shield/buckler benefit while using it. Large: only man-sized or larger creatures can use pikes (not Skaven, Skinks, Halflings, etc). Note (Reach): since "reach" mechanics were removed from Mordheim, it's recommended to use the later Pike (Merchant Caravans) rules from Border Town Burning.`,
      },
      {
        name: `Special Equipment: Rapier (Cost: 15 gc, Availability: Rare 5)`,
        text: `Range: Close Combat. Strength: As user. Special Rules — Parry: as with all swords, may parry (opponent's hit is discarded if you roll greater than their highest to-hit roll). Barrage: if you hit but fail to wound, you may attack again as if you had another attack but at -1 to hit (down to a maximum of needing a 6), continuing as long as you hit. Armour Save: because a rapier is light and lacks a broadsword's armour-breaking blade, armour saves against it are made at +1.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `tileans_trantios_standard`,
        name: `Tilean Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Halberd`, cost: `10 gc` },
          { name: `Pike`, cost: `12 gc` },
          { name: `Morning star`, cost: `15 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
          { name: `Rapier`, cost: `15 gc` },
        ],
        missileWeapons: [
          { name: `Crossbow`, cost: `25 gc` },
          { name: `Pistol`, cost: `15 gc (30 for a brace)` },
          { name: `Duelling Pistol`, cost: `25 gc (50 for a brace)` },
          { name: `Bow`, cost: `10 gc` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Shield`, cost: `5 gc` },
          { name: `Buckler`, cost: `5 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
      {
        id: `tileans_trantios_marksman`,
        name: `Marksman Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Hammer`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
        ],
        missileWeapons: [
          { name: `Crossbow`, cost: `25 gc` },
          { name: `Pistol`, cost: `15 gc (30 for a brace)` },
          { name: `Duelling Pistol`, cost: `25 gc (50 for a brace)` },
          { name: `Long bow`, cost: `15 gc` },
          { name: `Handgun`, cost: `35 gc` },
          { name: `Hunting Rifle`, cost: `200 gc` },
        ],
        armour: [
          { name: `Light armour`, cost: `20 gc` },
          { name: `Helmet`, cost: `10 gc` },
        ],
      },
    ],
    heroTemplates: [
      {
        id: `tileans_trantios_captain`,
        name: `Captain`,
        role: `hero`,
        cost: 60,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 2, Ld: 8 },
        equipmentListId: `tileans_trantios_standard`,
        skillTableIds: [`combat`, `shooting`, `academic`, `strength`, `speed`],
        specialRules: [
          { name: `Leader`, text: `Any warrior within 6" of the Captain may use his Leadership characteristic when taking Leadership tests.` },
        ],
      },
      {
        id: `tileans_trantios_champion`,
        name: `Champion`,
        role: `hero`,
        cost: 35,
        rosterLimit: `0-2`,
        startingExperience: 8,
        stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 7 },
        equipmentListId: `tileans_trantios_standard`,
        skillTableIds: [`combat`, `shooting`, `speed`],
        specialRules: [],
      },
      {
        id: `tileans_trantios_youngblood`,
        name: `Youngblood`,
        role: `hero`,
        cost: 15,
        rosterLimit: `0-2`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 6 },
        equipmentListId: `tileans_trantios_standard`,
        skillTableIds: [`combat`, `shooting`, `strength`],
        specialRules: [],
      },
    ],
    henchmanTemplates: [
      {
        id: `tileans_trantios_warrior`,
        name: `Warrior`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `tileans_trantios_standard`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `tileans_trantios_marksman`,
        name: `Marksman`,
        role: `henchman`,
        cost: 25,
        rosterLimit: `0-7`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `tileans_trantios_marksman`,
        skillTableIds: [],
        specialRules: [],
      },
      {
        id: `tileans_trantios_duellist`,
        name: `Duellist`,
        role: `henchman`,
        cost: 35,
        rosterLimit: `0-5`,
        startingExperience: 0,
        stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 7 },
        equipmentListId: `tileans_trantios_standard`,
        skillTableIds: [],
        specialRules: [
          { name: `Cloak & Dagger`, text: `Duellists are adept at fighting using their billowing cloaks to swirl at an enemy distracting him and warding off blows. The Duellist counts as using a buckler in close combat.` },
        ],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1b-warbands/tileans`,
  },

  // =========================================================================================
  // Tomb Guardians
  // =========================================================================================
  {
    id: `tomb_guardians`,
    name: `Tomb Guardians`,
    grade: `1b`,
    race: `Undead (Nehekharan)`,
    originalSetting: `Khemri`,
    sourcebook: `Town Cryer #18 (PDF)`,
    raceTraits: [`causes_fear`, `immune_to_psychology`],
    specialRules: [
      {
        name: `Lore: The Mortuary Cult`,
        text: `The Mortuary Cult was formed long ago to learn the mysterious arts of mummification and perform the hidden rituals of awakening. After many centuries, the priests discovered the secrets they were seeking and were able to mummify and preserve bodies. The Mortuary Cult perfected their magic over a thousand years until the cult could cheat death itself. When Nagash performed his Great Ritual, raising the dead of Nehekhara, the priests rose as Liche Priests, undead beings with a mind of their own. Their experiments had given them eternal unlife. The Liche Priests now hold a position of great power, standing by the Tomb King's side - they alone are now able to invoke the power that allows the Tomb King's armies to march to war. The Mortuary Cult Liche Priests do not use the evil Necromancy spells, instead they use a system of ancient scrolls, working just like normal spells with the usual test to read the incantation correctly.`,
      },
      {
        name: `Cause Fear`,
        text: `All Undead warriors cause Fear. Applies to every model in the warband (all Tomb Guardian units are Undead). Modeled at the warband level via the "causes_fear" trait.`,
      },
      {
        name: `Immune to Psychology`,
        text: `All Undead warriors are immune to psychology and never leave combat. Modeled at the warband level via the "immune_to_psychology" trait.`,
      },
      {
        name: `No Pain`,
        text: `All Undead warriors treat a Stunned result as Knocked Down.`,
      },
      {
        name: `May Not Run`,
        text: `No Undead warrior may run, but may charge as normal.`,
      },
      {
        name: `Immune to Poison`,
        text: `No Undead warrior is affected by poison.`,
      },
      {
        name: `No Brain`,
        text: `Skeletons are not alive, thus they never gain experience.`,
      },
      {
        name: `Note: Tomb Lords and Skills`,
        text: `Tomb Lords don't actually learn new skills, rather they remember the skills they knew when they were alive. Liche Priests and Acolytes are also undead but they have retained a form of living mind and are capable of learning from their experiences.`,
      },
      {
        name: `Flammable`,
        text: `The Tomb Lord is as dry as tinder and wrapped in bandages soaked in highly flammable resins and preservatives. A hit from a fire-based attack will cause double the normal number of wounds on it. (Source lists this under the general Special Rules heading, but the text is specific to the Tomb Lord — also captured on that Hero's own specialRules.)`,
      },
      {
        name: `Do Not Drink`,
        text: `Undead models do not need food and water. However any living animals that accompany the Mummies follow the water rules as normal.`,
      },
      {
        name: `Home Ground`,
        text: `The Tomb Guardians live in the Necropolises and have no trouble locating the hidden tombs in search of weapons and armour to help them defend their homes. A Tomb Guardian warband always rolls one extra dice in the Exploration phase.`,
      },
      {
        name: `Additional Skill: Drive Chariot (Academic)`,
        text: `Chariots are very difficult to control and a warrior must have this skill to drive a chariot effectively in combat. A charioteer without this skill cannot charge.`,
      },
      {
        // TODO: the Skeleton Chariot doesn't fit the Hero/Henchman UnitTemplate shape (dual
        // Chariot+Steed profile with non-numeric M/WS/BS/I/A fields, not sold in Heroes/Henchmen
        // groups) — captured here in full instead of as a UnitTemplate.
        name: `Special Equipment: Skeleton Chariot (0-1, 200 + 10D6 gold crowns to hire)`,
        text: `Made from the bones of the dead, pulled by two Skeleton Steeds and ridden by a member of the warband. Chariot profile: S4 T4 W3 (no M/WS/BS/I/A). Steed profile: M8 WS2 BS2 S3 T3 W1 I2 A1 Ld5. Special Rules — Mounting: a charioteer may mount/dismount as with a ridden steed. Movement: moves 8" and may not run, but may double its move when charging. Difficult Ground: D3 S4 hits moving over difficult ground (2D3 S6 hits if charging over it). Steeds: if one steed dies, the chariot is reduced to half movement (and half charge distance) but no longer makes impact hits; if both steeds die, the chariot is immobile and the charioteer fights on foot. Combat: the charioteer may charge any enemy warrior he can see in the open (not forced to charge the closest); if the chariot moved more than half its move it may make impact hits (models directly in its path get an Initiative test to dodge; on a hit, a single S4 wound with a -2 armour save). At the end of the charge move the charioteer may fight normally; enemies in contact may choose to strike the chariot (still requires a to-hit roll against the charioteer) or, if only in contact with a Steed, must hit the Steed. Shooting: the chariot is a large target (+1 to hit); if hit, roll a D6 for location: 1-2 steed, 3-4 chariot, 5-6 charioteer. Requires the Drive Chariot academic skill to charge (see the warband's additional skill above).`,
      },
      {
        name: `Special Equipment: Serpent Staff (Cost: 30 gc, Availability: Common)`,
        text: `Range: Close Combat. Strength: As user. Special Rule — Parry: used with two hands, may Parry. The Liche Priest may instead forgo all normal attacks and parries in a round to bring the serpent to life: it always attacks first in close combat, making a single attack with WS4 and S4.`,
      },
      {
        name: `Special Equipment: Nehekharan Javelins (Cost: 10 gc, Availability: Common)`,
        text: `Range: 8". Strength: As user. Special Rule — +1 to hit when thrown. Note: the original writing only gave +1 to hit; it's suggested to combine this with the normal javelin thrown-weapon rule (no penalty for range or moving).`,
      },
      {
        name: `Special Equipment: Asp Arrows (Cost: 10 gc, Availability: Common)`,
        text: `Made from the mummified remains of poisonous snakes, guided through the air by ancient magic. Special Rule — +1 to hit. Note: no Rarity is given in the source; also originally listed as a Missile Weapon even though it functions more like special arrows (e.g. hunting arrows), which are purchased as Miscellaneous Equipment.`,
      },
    ],
    warbandSkillIds: [],
    equipmentLists: [
      {
        id: `tomb_guardians_undead`,
        name: `Undead Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Halberd`, cost: `10 gc` },
          { name: `Spear`, cost: `10 gc` },
          { name: `Morning star`, cost: `15 gc` },
          { name: `Double-handed weapon`, cost: `15 gc` },
          { name: `Flail`, cost: `15 gc` },
        ],
        missileWeapons: [
          { name: `Bow`, cost: `10 gc` },
          { name: `Asp Arrows (Tomb Lords only)`, cost: `10 gc` },
          { name: `Nehekharan Javelin (Tomb Lords only)`, cost: `10 gc` },
        ],
        armour: [
          { name: `Shield`, cost: `5 gc` },
          { name: `Light armour`, cost: `20 gc` },
        ],
      },
      {
        id: `tomb_guardians_liche_priest`,
        name: `Liche Priest Equipment List`,
        meleeWeapons: [
          { name: `Dagger`, cost: `1st free/2 gc` },
          { name: `Mace`, cost: `3 gc` },
          { name: `Staff`, cost: `3 gc` },
          { name: `Axe`, cost: `5 gc` },
          { name: `Sword`, cost: `10 gc` },
          { name: `Morning star`, cost: `15 gc` },
          { name: `Serpent Staff (Liche Priests only)`, cost: `30 gc` },
        ],
        missileWeapons: [],
        armour: [],
      },
      {
        id: `tomb_guardians_no_equipment`,
        name: `No Equipment (natural weapons only)`,
        meleeWeapons: [],
        missileWeapons: [],
        armour: [],
      },
    ],
    heroTemplates: [
      {
        id: `tomb_guardians_tomb_lord`,
        name: `Tomb Lord`,
        role: `hero`,
        cost: 150,
        rosterLimit: `1`,
        startingExperience: 20,
        stats: { M: 4, WS: 4, BS: 3, S: 4, T: 5, W: 3, I: 3, A: 2, Ld: 8 },
        equipmentListId: `tomb_guardians_undead`,
        skillTableIds: [`combat`, `shooting`, `strength`],
        specialRules: [
          { name: `Leader`, text: `The Tomb Lord is the warband's Leader and follows all the rules for Leaders.` },
          { name: `Undead`, text: `The Tomb Lord is undead and follows all rules for the Undead.` },
          { name: `Flammable`, text: `The Tomb Lord is as dry as tinder and wrapped in bandages soaked in highly flammable resins and preservatives. A hit from a fire-based attack will cause double the normal number of wounds on it.` },
        ],
      },
      {
        id: `tomb_guardians_liche_priest`,
        name: `Liche Priest`,
        role: `hero`,
        cost: 55,
        rosterLimit: `0-1`,
        startingExperience: 8,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `tomb_guardians_liche_priest`,
        skillTableIds: [`academic`],
        specialRules: [
          { name: `Wizard`, text: `The Liche Priest is a Wizard and uses Mortuary Cult scrolls.` },
          { name: `Undead`, text: `The Liche Priest is undead and follows all rules for the Undead.` },
          { name: `No Armour`, text: `May not wear armour, as it interferes with his spell casting.` },
        ],
      },
      {
        id: `tomb_guardians_acolyte`,
        name: `Acolyte`,
        role: `hero`,
        cost: 20,
        rosterLimit: `0-2`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
        equipmentListId: `tomb_guardians_liche_priest`,
        skillTableIds: [`combat`, `academic`],
        specialRules: [{ name: `Undead`, text: `Acolytes are undead and follow all rules for the Undead.` }],
      },
    ],
    henchmanTemplates: [
      {
        id: `tomb_guardians_skeleton_warrior`,
        name: `Skeleton Warrior`,
        role: `henchman`,
        cost: 20,
        rosterLimit: `any`,
        startingExperience: 0,
        stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 5 },
        equipmentListId: `tomb_guardians_undead`,
        skillTableIds: [],
        specialRules: [{ name: `Undead`, text: `Skeletons are undead and follow all rules for the Undead.` }],
      },
      {
        id: `tomb_guardians_tomb_guard`,
        name: `Tomb Guard`,
        role: `henchman`,
        cost: 30,
        rosterLimit: `0-2`,
        startingExperience: 0,
        stats: { M: 4, WS: 3, BS: 2, S: 4, T: 3, W: 1, I: 3, A: 1, Ld: 5 },
        equipmentListId: `tomb_guardians_undead`,
        skillTableIds: [],
        specialRules: [{ name: `Undead`, text: `The Tomb Guards are undead and follow all rules for the Undead.` }],
        notes: `In the original Khemri source material these were called "Tomb Guards" and were specifically noted to gain experience — it's recommended that if played this way, the Tomb Lord's maximum characteristics are used as the cap.`,
      },
      {
        id: `tomb_guardians_tomb_scorpion`,
        name: `Tomb Scorpion`,
        role: `henchman`,
        cost: 15,
        rosterLimit: `0-3`,
        startingExperience: 0,
        stats: { M: 5, WS: 2, BS: 0, S: 2, T: 2, W: 1, I: 4, A: 1, Ld: 4 },
        equipmentListId: `tomb_guardians_no_equipment`,
        skillTableIds: [],
        specialRules: [
          { name: `Living`, text: `Scorpions are living beings and are affected by Psychology as normal. However as they are small desert creatures they do not need water.` },
          { name: `Animals`, text: `Scorpions are animals and do not gain experience points.` },
          { name: `Scorpion's Sting`, text: `Scorpions attack using the poisonous sting in their tails. This attack is worked out exactly as if the scorpion was attacking with Black Lotus. (Source profile marks Strength as "2*", the asterisk referring to this sting rule.)` },
        ],
      },
    ],
    sourceUrl: `https://mordheimer.net/docs/warbands/grade-1b-warbands/tomb-guardians`,
  },
];

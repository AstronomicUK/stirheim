// Item rules overlay: everything the equipment pages say about an item beyond its price, rarity and
// battle profile, in a shape the resolvers and the fight calculator can read. The catalogue
// (data/items) keeps the verbatim text; this layer says what the text does. Phase 16, from the
// weapons and armour audit (docs/WEAPONS-ARMOUR-RULES-GAPS.md).
//
// Three families, one entry per item id:
//   - restrictions: who may buy or carry it, how many, when, and whether it can be moved or sold;
//   - pricing: prices and rarities that change with the warband or the buyer;
//   - effects: what it does on the table (traits, saves, Leadership) and before the battle
//     (poisons, drugs, ammunition), and whether it is used up.
//
// Warband references use the group keys in ./warbandGroups (e.g. "undead", "elves") or a template
// id directly; unit references use unit template ids.

import type { Weapon } from "../../types";

// ---- Restrictions (audit A1, A13, C) ----

export interface ItemRestriction {
  /** Heroes only. Miscellaneous equipment defaults to true (rulebook); set false for the exceptions (Rain Coat, Winter Furs). */
  heroesOnly?: boolean;
  /** Only one in the warband at a time. */
  onePerWarband?: boolean;
  /** Only one per model (Peg Leg). */
  onePerModel?: boolean;
  /** May only be bought when the warband is created. */
  creationOnly?: boolean;
  /** Bought for a warrior when he is recruited (mutations, Blessings of Nurgle); the hire sheet offers it and later purchases warn. Second and later ones cost double. */
  recruitOnly?: boolean;
  /** Bought once per campaign per warband (Liber Bubonicus). */
  oncePerCampaign?: boolean;
  /** Once bought it stays with the buyer: never moved to the stash or another warrior. */
  fused?: boolean;
  /** Cannot be sold back. */
  unsellable?: boolean;
  /** May not be worn with a shield. */
  noShield?: boolean;
  /** Needs one of these items on the same warrior to be of any use (arrows need a bow). */
  requiresAnyOf?: { itemIds: string[]; label: string };
  /** Only these warbands (group keys or template ids). */
  onlyWarbands?: string[];
  /** Never these warbands (group keys or template ids). */
  notWarbands?: string[];
  /** Only these unit types (unit template ids). */
  onlyUnits?: string[];
  /** Counts as a missile weapon for the two-missile-weapons cap even though it is miscellaneous kit; false for kit that never counts. */
  countsAsMissile?: boolean;
  /** Plain-English source of the restriction for the warning line. */
  note?: string;
}

// ---- Pricing (audit A2) ----

export interface PriceCondition {
  /** Group keys or template ids. */
  warbands?: string[];
  /** Unit template ids of the buyer (the warrior the item is bought for). */
  units?: string[];
  /** The buyer's role. */
  role?: "hero" | "henchman";
  /** Any henchman group of one of these unit types exists in the warband (Mad Cap Mushrooms: "if warband includes Goblins"). */
  warbandHasUnits?: string[];
}

export interface PriceRule {
  when: PriceCondition;
  /** Replaces the listed base price (gc). */
  price?: number;
  /** Replaces the rarity; "common" removes the roll. */
  rarity?: number | "common";
  /** Bonus to the 2D6 rare roll for this item. */
  rareRollBonus?: number;
  /** Shown next to the price. */
  note: string;
}

export interface ItemPricing {
  rules?: PriceRule[];
  /** Dynamic rules the resolver computes from the roster; described here, applied in resolve/itemPricing.ts. */
  dynamic?: "chaosArmour" | "rhinox" | "familiar" | "strengthHunt";
  /** The rare roll is attempted but the gold is spent even on failure (Familiar). */
  paidOnFailure?: boolean;
  /** Bonus to every rare roll the warband makes while it owns this item (Opulent Coach +3). */
  warbandRareRollBonus?: number;
  /** A creation-time exemption from the Strength hunt test (Middenheimers and Wolfcloaks). */
  strengthHuntFreeAtCreationFor?: string[];
}

// ---- Effects (audit A3, A4, A6, A10, A12) ----

/** How a pre-battle consumable changes the wielder's attacks or defence for the battle. */
export interface PreBattleEffect {
  /** "Coated with Dark Venom", "Drunk before the battle". */
  label: string;
  /** Which attacks it changes: melee weapons, missile weapons, bows only, black powder only, every weapon,
   * every weapon except black powder ("Poison may not be used with blackpowder weapons", 02:1966), or the warrior himself. */
  appliesTo: "melee" | "ranged" | "bows" | "crossbows" | "blackpowder" | "allWeapons" | "nonBlackpowder" | "self";
  strengthBonus?: number;
  /** The Strength bonus does not worsen the armour save (Reptile Venom). */
  strengthBonusNoSaveModifier?: boolean;
  autoWoundOnSixToHit?: boolean;
  injuryRollBonus?: number;
  toHitBonus?: number;
  toughnessBonus?: number;
  stunnedBecomesKnockedDown?: boolean;
  traits?: string[];
  /** Informational: Initiative, Movement and other changes the calculator does not use. */
  note?: string;
  /** Warriors of these groups get nothing from it (Undead and Possessed and drugs). */
  noEffectOn?: string[];
}

/** What one result on a post-battle table does to the roster. Anything not listed here is a note for the table. */
export interface PostBattleOutcome {
  min: number;
  max: number;
  text: string;
  effect?: {
    /** Permanent characteristic change on the holder (Mandrake Root -1 T, Crimson Shade +1 I). */
    statDelta?: Partial<Record<"M" | "WS" | "BS" | "S" | "T" | "W" | "I" | "A" | "Ld", number>>;
    flag?: "stupidity" | "missNextGame" | "addicted" | "leaderSpawn";
    /** The item is lost (Cathayan Silk Clothes ruined, the Lamp lost). */
    removeItem?: boolean;
    /** Gold to the treasury: a fixed sum, or dice times a figure (D6x5 = { dice: 1, perPoint: 5 }). Negative for losses. */
    gold?: number | { dice: number; perPoint: number };
    shards?: number;
    xp?: number;
  };
}

/** A roll owed after the battle because of an item. */
export interface PostBattlePrompt {
  key: string;
  label: string;
  /** "used": the item was marked as taken this battle; "leaderOutOfAction": the holder is the leader and went down. */
  trigger: "used" | "leaderOutOfAction";
  dice: "D6" | "2D6";
  text: string;
  outcomes: PostBattleOutcome[];
  /** The player may leave it unrolled (a wish not taken). */
  optional?: boolean;
}

export interface ItemEffect {
  /** Rolls owed after a battle (audit A5). */
  postBattle?: PostBattlePrompt[];
  /** Traits the wearer gains (data/traits ids, or informational ones like immune_to_fear). */
  traits?: string[];
  /** Skills the wearer counts as having (Lookout-Gnoblar: Dodge). */
  skills?: string[];
  /** Ward save against every wound. */
  wardSave?: number;
  /** Special save against missile wounds only (Amulet of the Moon 5+, Shield of Sigmar 6+). */
  missileWardSave?: number;
  /** Modifier to enemy to-hit rolls (negative = harder to hit), by phase. */
  toBeHit?: { melee?: number; missile?: number };
  /** Bonus to the wearer's armour save, by phase (Wolfcloak +1 against shooting; Silk Armour +1 to all). A save appears from nothing at 6+ when the bonus is given with `savesFromNothing`. */
  saveBonus?: { melee?: number; missile?: number; savesFromNothing?: boolean; note?: string };
  /** The item is itself an armour save, by phase (Sea Dragon Cloak 5+ / 4+). */
  ownSave?: { melee: number; missile: number };
  /** A further unmodified save taken after every failed save, both phases (Peg Leg 6+). */
  afterSave?: number;
  /** Discard the first hit of the battle on this roll (Lucky Charm 4+). */
  firstHitDiscard?: number;
  /** Counts as carrying this engine weapon as well (Hook Hand: dagger; Sword-Gnoblar: its own attack). */
  extraWeaponId?: string;
  /** Leadership effects, read by the rout check. */
  leadership?: {
    /** The first Leadership test of the game is passed automatically (Holy Relic). */
    autoPassFirstTest?: boolean;
    /** +1 Leadership for the warband, once per battle (War Horn) or all game (Vodka). */
    bonus?: number;
    /** Friendly warriors nearby re-roll failed All Alone tests. */
    allAloneReroll?: boolean;
    note?: string;
  };
  /** Before the battle the wielder may mark it as taken or applied. */
  preBattle?: PreBattleEffect;
  /** The item is used up: per battle when marked, or on a single use. */
  consumable?: "battle" | "use";
  /** Alternative fire modes offered on the calculator (single shot for repeaters, the Sling's double shot). */
  altFire?: { label: string; shots: number; toHitPenalty: number; hint: string };
  /** The item is an upgrade applied to one of the wielder's weapons; the base is written on the item's note. */
  upgrade?: {
    /** Engine weapon ids the upgrade may be applied to; "anyMelee" for any hand weapon. */
    bases: string[] | "anyMelee";
    /** What changes on the base weapon. */
    apply: Partial<Weapon>;
    namePrefix: string;
    note: string;
  };
  /** One line for the calculator's notes when the item is carried. */
  note?: string;
}

export interface ItemRule {
  restriction?: ItemRestriction;
  pricing?: ItemPricing;
  effect?: ItemEffect;
}

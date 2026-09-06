// Rewards of the Shadowlord (Mordheim rulebook optional rule, as carried by mordheimer.net:
// /docs/optional-rules/mordheim-rulebook-optional-rules/rewards-of-the-shadowlord). A Magister or
// Mutant of a Cult of the Possessed warband who earns a New Skill may roll 2D6 on this table
// instead of taking the skill. Tom's rulings (2026-09-06): Possessed only, Magister and Mutants as
// written; Wrath takes the kit with the warrior; a Nothing result still spends the advance; a
// Possessed! warrior's other kit goes to the stash with a note.

export type RewardKind = "wrath" | "nothing" | "mutation" | "chaosArmour" | "daemonWeapon" | "possessed";

export interface RewardRow {
  min: number;
  max: number;
  kind: RewardKind;
  title: string;
  text: string;
}

export const REWARDS_OF_THE_SHADOWLORD: RewardRow[] = [
  { min: 2, max: 2, kind: "wrath", title: "Wrath of the Shadowlord!", text: "The warrior is mutated beyond recognition and vanishes into the ruins, joining the many other horrors that roam Mordheim." },
  { min: 3, max: 6, kind: "nothing", title: "Nothing Happens", text: "The capricious Shadowlord ignores the pleas of his servant." },
  {
    min: 7,
    max: 8,
    kind: "mutation",
    title: "Mutation",
    text: "The warrior develops a severe mutation. Roll a D6. On a roll of 1 you lose a single point from one of your warrior's characteristics (chosen by you), due to atrophy, or some such degrading mutation. On a roll of 2 or more you may choose which one of the mutations listed in the Cult of the Possessed Warbands section your warrior has been rewarded with.",
  },
  { min: 9, max: 10, kind: "chaosArmour", title: "Chaos Armour", text: "The warrior's body becomes encrusted with an arcane, all-enveloping suit of armour. This confers a basic 4+ save, but does not affect the model's ability to cast spells or move in any way." },
  {
    min: 11,
    max: 11,
    kind: "daemonWeapon",
    title: "Daemon Weapon",
    text: "The warrior receives a weapon with a bound Daemon inside it. This weapon adds +1 to his Strength in close combat, grants a +1 bonus on all to hit rolls using it. The user may choose the weapon's form (a sword, an axe, etc), though it will not have any of the special abilities normally associated with common weapons of that type.",
  },
  {
    min: 12,
    max: 12,
    kind: "possessed",
    title: "Possessed!",
    text: "A Daemon takes over the soul and body of the warrior. He immediately gains +1 Weapon Skill, +1 Strength, +1 Attacks and +1 Wounds. These increases do not count towards his maximum characteristics. The warrior loses D3 of his skills (chosen by the player) and may no longer use weapons or armour, except for Chaos Armour or Daemon weapons.",
  },
];

export function lookupReward(total2d6: number): RewardRow {
  const row = REWARDS_OF_THE_SHADOWLORD.find((r) => total2d6 >= r.min && total2d6 <= r.max);
  if (!row) throw new RangeError(`Not a 2D6 result: ${total2d6}`);
  return row;
}

/** Who may roll: the list and the hero types, as written. */
export const REWARDS_ELIGIBLE: Record<string, readonly string[]> = {
  cult_of_the_possessed: ["cult_of_the_possessed_magister", "cult_of_the_possessed_mutants"],
};

export function rewardsEligible(warbandTemplateId: string, unitTemplateId: string): boolean {
  return REWARDS_ELIGIBLE[warbandTemplateId]?.includes(unitTemplateId) ?? false;
}

/** The mutations of the Cult of the Possessed list, as items (data/items/warbandSpecial.ts). */
export const POSSESSED_MUTATION_IDS = ["daemon_soul", "great_claw", "cloven_hoofs", "tentacle", "blackblood", "spines", "scorpion_tail", "extra_arm", "hideous_mutation"] as const;

/** Kit a warrior Possessed by a Daemon may still use. */
export const POSSESSED_ALLOWED_ITEM_IDS = ["chaos_armour", "daemon_weapon"] as const;

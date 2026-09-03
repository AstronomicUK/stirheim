// Serious Injuries — reference/rules/03-campaigns-magic-optional-rules.md lines 91-229
// (mordheimer.net/docs/campaigns#serious-injuries). Text is verbatim; `effects` is a structured
// reading of it for roster tooling.
//
// D66 rolls: the first D6 is the tens digit and the second the units, so only values whose two
// digits are both 1-6 exist (11-16, 21-26, ..., 61-66). Anything containing a 0 or a 7-9 digit
// (e.g. 17, 20, 39) is not a valid D66 result and `lookupHeroInjury` throws on it. Printed bands
// such as "16-21" therefore cover only 16 and 21.

import type { HenchmanInjuryRule, InjuryResult } from "../../types/campaign";
import type { SourceRef } from "../../types/common";

export const INJURIES_SOURCE: SourceRef = {
  publication: "Mordheim Rulebook (mordheimer.net/docs/campaigns#serious-injuries)",
  file: "03-campaigns-magic-optional-rules.md:91-229",
};

export const HENCHMAN_INJURY: HenchmanInjuryRule = {
  deadOn: [1, 2],
  text:
    "Henchmen who are out of action at the end of the battle are removed permanently from the roster sheet on a D6 roll of 1-2. They have either suffered severe injuries, died of their wounds, or decided to quit the warband. On a roll of 3-6 they can fight in the next battle as normal.",
};

export const HERO_INJURIES: InjuryResult[] = [
  {
    code: "dead",
    band: { min: 11, max: 15 },
    name: "Dead",
    text: "The warrior is dead and his body is abandoned in the dark alleys of Mordheim, never to be found again. All the weapons and equipment he carried are lost. Remove him from the warband's roster.",
    effects: [{ kind: "dead" }, { kind: "loseEquipment" }],
  },
  {
    code: "multiple_injuries",
    band: { min: 16, max: 21 },
    name: "Multiple Injuries",
    text: "The warrior is not dead but has suffered a lot of wounds.\n\nRoll D6 times on this table.\n\nRe-roll any 'Dead', 'Captured' and further 'Multiple Injuries' results.",
    // Re-roll Dead (11-15), Captured (61) and further Multiple Injuries (16-21) when applying.
    effects: [{ kind: "multipleInjuries", rolls: "D6" }],
  },
  {
    code: "leg_wound",
    band: { min: 22, max: 22 },
    name: "Leg Wound",
    text: "The warrior's leg is broken. He suffers a -1 Movement characteristic penalty from now on.",
    effects: [{ kind: "statDelta", stat: "M", delta: -1 }],
  },
  {
    code: "arm_wound",
    band: { min: 23, max: 23 },
    name: "Arm Wound",
    text: "Roll again:\n- 1 = Severe arm wound. The arm must be amputated. The warrior may only use a single onehanded weapon from now on.\n- 2-6 = Light wound. The warrior must miss the next game.",
    effects: [
      {
        kind: "subRoll",
        die: "D6",
        outcomes: [
          {
            band: { min: 1, max: 1 },
            text: "Severe arm wound. The arm must be amputated. The warrior may only use a single onehanded weapon from now on.",
            effects: [{ kind: "flag", flag: "singleHandedWeaponsOnly" }],
          },
          {
            band: { min: 2, max: 6 },
            text: "Light wound. The warrior must miss the next game.",
            effects: [{ kind: "missNextGames", games: 1 }],
          },
        ],
      },
    ],
  },
  {
    code: "madness",
    band: { min: 24, max: 24 },
    name: "Madness",
    text: "Roll again:\n- 1-3 = The warrior suffers from stupidity.\n- 4-6 = The warrior suffers from frenzy from now on.",
    effects: [
      {
        kind: "subRoll",
        die: "D6",
        outcomes: [
          { band: { min: 1, max: 3 }, text: "The warrior suffers from stupidity.", effects: [{ kind: "flag", flag: "stupidity" }] },
          { band: { min: 4, max: 6 }, text: "The warrior suffers from frenzy from now on.", effects: [{ kind: "flag", flag: "frenzy" }] },
        ],
      },
    ],
  },
  {
    code: "smashed_leg",
    band: { min: 25, max: 25 },
    name: "Smashed Leg",
    text: "Roll again:\n- 1 = The warrior may not run any more but he may still charge.\n- 2-6 = The warrior misses the next game.",
    effects: [
      {
        kind: "subRoll",
        die: "D6",
        outcomes: [
          { band: { min: 1, max: 1 }, text: "The warrior may not run any more but he may still charge.", effects: [{ kind: "flag", flag: "noRunning" }] },
          { band: { min: 2, max: 6 }, text: "The warrior misses the next game.", effects: [{ kind: "missNextGames", games: 1 }] },
        ],
      },
    ],
  },
  {
    code: "chest_wound",
    band: { min: 26, max: 26 },
    name: "Chest Wound",
    text: "The warrior has been badly wounded in the chest. He recovers but is weakened by the injury so his Toughness is reduced by -1.",
    effects: [{ kind: "statDelta", stat: "T", delta: -1 }],
  },
  {
    code: "blinded_in_one_eye",
    band: { min: 31, max: 31 },
    name: "Blinded In One Eye",
    text: "The warrior survives but loses the sight in one eye; randomly determine which. A character that loses an eye has his Ballistic Skill reduced by -1.\n\nIf the warrior is subsequently blinded in his remaining good eye he must retire from the warband.",
    effects: [{ kind: "statDelta", stat: "BS", delta: -1 }, { kind: "flag", flag: "blindedInOneEye" }],
  },
  {
    code: "old_battle_wound",
    band: { min: 32, max: 32 },
    name: "Old Battle Wound",
    text: "The warrior survives, but his wound will prevent him from fighting if you roll a 1 on a D6 at the start of any battle. Roll at the start of each battle from now on.",
    effects: [{ kind: "flag", flag: "oldBattleWound" }],
  },
  {
    code: "nervous_condition",
    band: { min: 33, max: 33 },
    name: "Nervous Condition",
    text: "The warrior's nervous system has been damaged. His Initiative is permanently reduced by -1.",
    effects: [{ kind: "statDelta", stat: "I", delta: -1 }],
  },
  {
    code: "hand_injury",
    band: { min: 34, max: 34 },
    name: "Hand Injury",
    text: "The warrior's hand is badly injured. His Weapon Skill is permanently reduced by -1.",
    effects: [{ kind: "statDelta", stat: "WS", delta: -1 }],
  },
  {
    code: "deep_wound",
    band: { min: 35, max: 35 },
    name: "Deep Wound",
    text: "The warrior has suffered a serious wound and must miss the next D3 games while he is recovering. He may do nothing at all while recovering.",
    effects: [{ kind: "missNextGames", games: "D3" }],
  },
  {
    code: "robbed",
    band: { min: 36, max: 36 },
    name: "Robbed",
    text: "The warrior manages to escape, but all his weapons, armour and equipment are lost.",
    effects: [{ kind: "loseEquipment" }, { kind: "flag", flag: "robbed" }],
  },
  {
    code: "full_recovery",
    band: { min: 41, max: 55 },
    name: "Full Recovery",
    text: "The warrior has been knocked unconscious, or suffers a light wound from which he makes a full recovery.",
    effects: [],
  },
  {
    code: "bitter_enmity",
    band: { min: 56, max: 56 },
    name: "Bitter Enmity",
    text: "The warrior makes a full physical recovery, but is psychologically scarred by his experience. From now on the warrior hates the following (roll a D6):\n\n1-3: The individual who caused the injury. If it was a Henchman, he hates the enemy leader instead.\n4: The leader of the warband that caused the injury.\n5: The entire warband of the warrior responsible for the injury.\n6: All warbands of that type.",
    effects: [
      { kind: "flag", flag: "bitterEnmity" },
      {
        kind: "subRoll",
        die: "D6",
        outcomes: [
          { band: { min: 1, max: 3 }, text: "The individual who caused the injury. If it was a Henchman, he hates the enemy leader instead.", effects: [] },
          { band: { min: 4, max: 4 }, text: "The leader of the warband that caused the injury.", effects: [] },
          { band: { min: 5, max: 5 }, text: "The entire warband of the warrior responsible for the injury.", effects: [] },
          { band: { min: 6, max: 6 }, text: "All warbands of that type.", effects: [] },
        ],
      },
    ],
  },
  {
    code: "captured",
    band: { min: 61, max: 61 },
    name: "Captured",
    text: "The warrior regains consciousness and finds himself held captive by the other warband.\n\n- He may be ransomed at a price set by the captor or exchanged for one of their warband who is being held captive.\n- Captives may be sold to slavers at a price of D6x5 gc.\n- Undead may kill their captive and gain a new Zombie.\n- The Possessed may sacrifice the prisoner. The leader of the warband will gain +1 Experience if they do so.\n\nCaptives who are exchanged or ransomed retain all their weapons, armour and equipment; if captives are sold, killed or turned to Zombies, their weaponry, etc, is retained by their captors.",
    effects: [{ kind: "flag", flag: "captured" }],
  },
  {
    code: "hardened",
    band: { min: 62, max: 63 },
    name: "Hardened",
    text: "The warrior survives and becomes inured to the horrors of Mordheim.\n\nFrom now on he is immune to fear.",
    effects: [{ kind: "flag", flag: "immuneToFear" }],
  },
  {
    code: "horrible_scars",
    band: { min: 64, max: 64 },
    name: "Horrible Scars",
    text: "The warrior causes fear from now on.",
    effects: [{ kind: "flag", flag: "causesFear" }],
  },
  {
    code: "sold_to_the_pits",
    band: { min: 65, max: 65 },
    name: "Sold To The Pits",
    text: "The warrior wakes up in the infamous fighting pits of Cutthroat's Haven and must fight against a Pit Fighter.\n\nRoll to see which side charges, and fight the battle as normal.\n\n- If the warrior loses, roll to see whether he is dead or injured (ie, a D66 roll of 11-35). If he is not dead, he is thrown out of the fighting pits without his armour and weapons and may re-join his warband.\n- If the warrior wins he gains 50 gc, +2 Experience and is free to rejoin his warband with all his weapons and equipment.",
    effects: [{ kind: "flag", flag: "soldToThePits" }],
  },
  {
    code: "survives_against_the_odds",
    band: { min: 66, max: 66 },
    name: "Survives Against The Odds",
    text: "The warrior survives and rejoins his warband. He gains +1 Experience.",
    effects: [{ kind: "experience", delta: 1 }],
  },
];

/** True for the 36 real D66 results: both digits 1-6. */
export function isValidD66(value: number): boolean {
  if (!Number.isInteger(value)) return false;
  const tens = Math.floor(value / 10);
  const units = value % 10;
  return tens >= 1 && tens <= 6 && units >= 1 && units <= 6;
}

/** Look up a Hero's Serious Injury by D66 result. Throws on values that are not real D66 rolls. */
export function lookupHeroInjury(d66: number): InjuryResult {
  if (!isValidD66(d66)) {
    throw new RangeError(`Not a valid D66 result: ${d66} (both digits must be 1-6)`);
  }
  const hit = HERO_INJURIES.find((r) => d66 >= r.band.min && d66 <= r.band.max);
  if (!hit) throw new RangeError(`No Serious Injury entry covers D66 ${d66}`);
  return hit;
}

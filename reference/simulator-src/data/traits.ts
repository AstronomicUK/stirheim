// Trait catalogue — racial special rules and Serious-Injury-derived effects, sourced from
// mordheimer.net (Leadership & Psychology, and each warband's racial special-rules section).
// Not part of the original brief; added in response to a gap flagged after the v1 build (Frenzy
// specifically was the reported missing example). Each modeled trait's mechanic is hardcoded in
// the engine (buildAttackInput.ts / turnAggregate.ts / injury.ts) — see the `description` for the
// exact rule text each is built from.

import type { Trait } from "../types";

export const TRAITS: Trait[] = [
  {
    id: "frenzy",
    name: "Frenzy",
    modeled: true,
    conditional: false,
    source: "mordheimer.net — Leadership & Psychology",
    description:
      "Fights with double Attacks in hand-to-hand combat (the off-hand weapon's own +1 is not doubled). Must always charge if an enemy is in range — not enforced here, this tool only models the doubled-Attacks combat effect.",
  },
  {
    id: "hatred",
    name: "Hatred",
    modeled: true,
    conditional: true,
    source: "mordheimer.net — Leadership & Psychology",
    description:
      "Reroll missed to-hit rolls in the first turn of hand-to-hand combat against a hated enemy (toggle: vs hated enemy, melee only).",
  },
  {
    id: "stupidity",
    name: "Stupidity",
    modeled: false,
    conditional: false,
    source: "mordheimer.net — Leadership & Psychology",
    description:
      "Must pass a Leadership test each turn or be unable to fight/cast/shoot that turn. Whether the model gets to act at all isn't modeled here — no Hit/Wound/Injury math effect once it's their turn to fight.",
  },
  {
    id: "immune_to_psychology",
    name: "Immune to Psychology",
    modeled: false,
    conditional: false,
    source: "mordheimer.net — various (e.g. Undead, Troll Slayers' Deathwish)",
    description: "Never tests for Fear, Terror, Stupidity, Animosity, or All Alone — no Hit/Wound/Injury math effect.",
  },
  {
    id: "causes_fear",
    name: "Causes Fear",
    modeled: false,
    conditional: false,
    source: "mordheimer.net — Leadership & Psychology",
    description: "Enemies charging or being charged by this model must pass a Fear test — no Hit/Wound/Injury math effect for this tool.",
  },
  {
    id: "pit_fighter",
    name: "Pit Fighter (racial)",
    modeled: true,
    conditional: true,
    source: "mordheimer.net — Pit Fighters warband special rules (every member has the Pit Fighter skill)",
    description: "+1 Weapon Skill and +1 Attack when fighting inside buildings or ruins (toggle: inside buildings). Same effect as the Strength skill of the same name — a model with both does not get it twice.",
  },
  {
    id: "no_pain",
    name: "No Pain (undead)",
    modeled: true,
    conditional: false,
    source: "Restless Dead warbands — Zombies, Skeletons, Wights, Grave Guards, Bone Goliath",
    description: "Treats every Stunned result on the Injury chart as Knocked Down.",
  },
  {
    id: "undead_construct",
    name: "Undead Construct (Bone Goliath)",
    modeled: true,
    conditional: false,
    source: "The Restless Dead (Variant) — Bone Goliath",
    description: "Ignores any result rolled on the Injury chart on a 4+ and keeps fighting (the wound is still lost). Not an armour save, so not modified by Strength; does not apply to wounds from magic or magic weapons.",
  },
  {
    id: "large_target",
    name: "Large Target",
    modeled: true,
    conditional: false,
    source: "Core rules 01:674 / The Restless Dead (Variant) — Bone Goliath",
    description: "Shooters get +1 to hit this model, and may always choose to shoot at it.",
  },
  {
    id: "immune_to_poison",
    name: "Immune to Poison",
    modeled: true,
    conditional: false,
    source: "Restless Dead warbands — all undead models",
    description: "Poisoned weapons (Black Lotus, Poison Daggers, Weeping Blades, Blowpipe) do not auto-wound this model on a 6 to hit.",
  },
  {
    id: "wight_blades_5plus",
    name: "Wight Blades (crit on 5+)",
    modeled: true,
    conditional: false,
    source: "The Restless Dead (Variant) by Chris de la Rosa — Grave Guards",
    description: "Any non-magical close-combat weapon this model carries counts as a Wight Blade and causes critical hits on a 5+ instead of a 6 (Gromril and Ithilmar weapons excepted). This is the variant's version — the mordheimer.net Restless Dead's Wight Blade instead auto-wounds on a 6 to hit and is a weapon in the catalogue.",
  },
  {
    id: "hard_to_kill",
    name: "Hard to Kill (Dwarf)",
    modeled: true,
    conditional: false,
    source: "mordheimer.net — Dwarf warbands' racial special rules",
    description: "Remaps this model's Injury chart to 1-2 Knocked Down / 3-5 Stunned / 6 Out of Action.",
  },
  {
    id: "hard_head",
    name: "Hard Head (Dwarf)",
    modeled: true,
    conditional: false,
    source: "mordheimer.net — Dwarf warbands' racial special rules",
    description: "Ignores the Concussion special rule for maces, clubs, hammers, etc. — treated as if the attacking weapon isn't Concussion-tagged.",
  },
];

export function findTrait(id: string, customTraits: Trait[] = []): Trait | undefined {
  return TRAITS.find((t) => t.id === id) ?? customTraits.find((t) => t.id === id);
}

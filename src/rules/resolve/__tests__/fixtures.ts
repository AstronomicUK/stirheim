// Shared roster fixtures for the resolver tests. Generic on purpose so every resolver suite can
// start from the same small Reikland warband: a captain, a champion, one henchman group of two
// warriors, 100 gold and 3 wyrdstone.

import type { Stats } from "../../types";
import type { RosterHenchmanGroup, RosterHero, RosterHiredSword, RosterWarband } from "../../types/roster";

export const HUMAN_STATS: Stats = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 };

export function makeHero(overrides: Partial<RosterHero> = {}): RosterHero {
  return {
    id: "hero-1",
    name: "Test Hero",
    unitTemplateId: "mercenaries_reikland_champions",
    stats: { ...HUMAN_STATS },
    xp: 0,
    levelUps: 0,
    skillTableIds: ["combat", "shooting", "strength"],
    skillIds: [],
    spellIds: [],
    injuries: [],
    flags: {},
    equipment: [{ itemId: "dagger", quantity: 1 }],
    status: "active",
    ...overrides,
  };
}

export function makeHenchmanGroup(overrides: Partial<RosterHenchmanGroup> = {}): RosterHenchmanGroup {
  return {
    id: "group-1",
    name: "Warriors",
    unitTemplateId: "mercenaries_reikland_warriors",
    size: 2,
    stats: { ...HUMAN_STATS },
    xp: 0,
    levelUps: 0,
    statIncreases: {},
    equipment: [{ itemId: "dagger", quantity: 2 }],
    ...overrides,
  };
}

export function makeHiredSword(overrides: Partial<RosterHiredSword> = {}): RosterHiredSword {
  return {
    id: "hired-1",
    hiredSwordId: "ogre_bodyguard",
    name: "Test Ogre",
    stats: { M: 6, WS: 3, BS: 2, S: 4, T: 4, W: 3, I: 3, A: 2, Ld: 7 },
    xp: 0,
    levelUps: 0,
    skillIds: [],
    injuries: [],
    flags: {},
    equipment: [],
    status: "active",
    ...overrides,
  };
}

/** A Reikland warband: captain + champion (2 heroes), one henchman group of 2, 100 gc, 3 wyrdstone. */
export function makeWarband(overrides: Partial<RosterWarband> = {}): RosterWarband {
  return {
    id: "warband-1",
    name: "Test Warband",
    warbandTemplateId: "mercenaries_reikland",
    gold: 100,
    wyrdstone: 3,
    veteranPool: null,
    heroes: [
      makeHero({
        id: "captain",
        name: "Test Captain",
        unitTemplateId: "mercenaries_reikland_captain",
        stats: { ...HUMAN_STATS, WS: 4, BS: 4, Ld: 8 },
        xp: 20,
        skillTableIds: ["combat", "shooting", "academic", "strength", "speed"],
        equipment: [
          { itemId: "dagger", quantity: 1 },
          { itemId: "sword", quantity: 1 },
        ],
      }),
      makeHero({ id: "champion", name: "Test Champion", xp: 8 }),
    ],
    henchmenGroups: [makeHenchmanGroup()],
    hiredSwords: [],
    stash: [],
    ...overrides,
  };
}

/** Deterministic rng for tests: cycles through the given [0, 1) values. */
export function seededRng(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length];
    i++;
    return v;
  };
}

// Animals bought as equipment that fight as warriors (audit A8): Wardogs and Gnoblar Fighters.
// They are items on a hero's card, but on the table each is a model: it attacks, it can be taken
// out of action, it rolls a henchman's D6 for injury afterwards (dead on 1-2, the item lost), it
// counts towards the warband's maximum, and a Wardog counts for rout tests (a Gnoblar does not:
// "Largely Insignificant"). Ids are `animal:<heroId>:<itemId>:<n>` so tallies and log events can
// name one animal of several.

import type { Stats } from "../types";
import type { RosterHero, RosterWarband } from "../types/roster";

export interface AnimalKind {
  /** Biological animal for conditional Fear; Gnoblar companions are not animals. */
  isAnimal: boolean;
  name: string;
  stats: Stats;
  /** Engine weapon ids the animal fights with. */
  weaponIds: string[];
  /** Counts for the rout test and the starting model count. */
  countsForRout: boolean;
  /** Rating points per animal. */
  ratingPoints: number;
}

export const ANIMAL_KINDS: Record<string, AnimalKind> = {
  wardogs: {
    isAnimal: true,
    name: "Wardog",
    stats: { M: 6, WS: 4, BS: 0, S: 4, T: 3, W: 1, I: 4, A: 1, Ld: 5 },
    weaponIds: ["wardog_bite"],
    countsForRout: true,
    ratingPoints: 5,
  },
  gnoblar_fighter: {
    isAnimal: false,
    name: "Gnoblar Fighter",
    stats: { M: 4, WS: 2, BS: 3, S: 2, T: 3, W: 1, I: 3, A: 1, Ld: 5 },
    weaponIds: ["dagger", "gnoblar_sharp_stuff"],
    countsForRout: false,
    ratingPoints: 5,
  },
};

export interface AnimalFighter {
  id: string;
  itemId: string;
  kind: AnimalKind;
  /** "Wardog" or "Wardog 2" when the hero has several. */
  name: string;
  holderId: string;
  holderName: string;
}

export function isAnimalId(id: string): boolean {
  return id.startsWith("animal:");
}

export function parseAnimalId(id: string): { holderId: string; itemId: string; index: number } | null {
  const parts = id.split(":");
  if (parts.length !== 4 || parts[0] !== "animal") return null;
  return { holderId: parts[1], itemId: parts[2], index: Number(parts[3]) || 0 };
}

/** Every animal a fighting hero brings. `fighting` filters the heroes (the battle sheet's own rule). */
export function animalFighters(roster: RosterWarband, fighting: (hero: RosterHero) => boolean = (h) => h.status === "active"): AnimalFighter[] {
  const out: AnimalFighter[] = [];
  for (const hero of roster.heroes) {
    if (!fighting(hero)) continue;
    for (const entry of hero.equipment) {
      if (!entry.itemId) continue;
      const kind = ANIMAL_KINDS[entry.itemId];
      if (!kind) continue;
      for (let n = 1; n <= entry.quantity; n++) {
        out.push({ id: `animal:${hero.id}:${entry.itemId}:${n}`, itemId: entry.itemId, kind, name: entry.quantity > 1 ? `${kind.name} ${n}` : kind.name, holderId: hero.id, holderName: hero.name });
      }
    }
  }
  return out;
}

/** Animals on the roster, counting towards the warband maximum. */
export function animalCount(roster: RosterWarband): number {
  return animalFighters(roster).length;
}

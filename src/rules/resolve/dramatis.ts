// Searching for a Dramatis Persona (rulebook 03:1230): after a battle any number of heroes who were
// not taken out of action may look for one named character instead of searching for rare items.
// Roll a D6 for each searcher; a roll under the searcher's Initiative finds the character. Only
// one of each character can ever be found, however many searchers succeed.

import type { RosterHero } from "../types/roster";
import { RulesError } from "./errors";

export interface SearcherRoll {
  heroId: string;
  name: string;
  initiative: number;
  /** The D6, or null while not yet rolled. */
  roll: number | null;
}

export interface CharacterSearchResult {
  /** True once every searcher has rolled. */
  complete: boolean;
  found: boolean;
  /** Names of the searchers whose roll was under their Initiative. */
  finders: string[];
  lines: string[];
}

/** Interpret the searchers' dice. A roll strictly under Initiative finds the character. */
export function resolveCharacterSearch(searchers: SearcherRoll[]): CharacterSearchResult {
  if (searchers.length === 0) throw new RulesError("dramatis.noSearchers", "Send at least one hero to look");
  const finders: string[] = [];
  const lines: string[] = [];
  let complete = true;
  for (const s of searchers) {
    if (s.roll === null) {
      complete = false;
      continue;
    }
    if (!Number.isInteger(s.roll) || s.roll < 1 || s.roll > 6) throw new RulesError("dramatis.invalidDie", `Not a valid D6 result: ${s.roll}`);
    const hit = s.roll < s.initiative;
    if (hit) finders.push(s.name);
    lines.push(`${s.name}: rolled ${s.roll} against Initiative ${s.initiative}: ${hit ? "found the character" : "no luck"}`);
  }
  return { complete, found: complete && finders.length > 0, finders, lines };
}

/** Heroes who may go looking: active, standing after the battle, and not already sent searching this phase. */
export function characterSearchers(heroes: RosterHero[], heroesSearched: readonly string[], heroesOutOfAction: readonly string[]): RosterHero[] {
  const used = new Set(heroesSearched);
  const down = new Set(heroesOutOfAction);
  return heroes.filter((h) => h.status === "active" && !used.has(h.id) && !down.has(h.id));
}

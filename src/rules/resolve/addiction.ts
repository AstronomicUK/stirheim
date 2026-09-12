// Crimson Shade addiction (02:1983): "you must try to buy him a new batch of Crimson Shade before
// every battle from now on. If you fail to buy any, he will leave your warband."
//
// The checkable form: before a battle each addicted hero needs one physical dose of his item. This
// allocates doses deterministically — a hero's own kit first, then the warband stash, in roster
// order, one dose per hero — so a stash of one cannot supply two addicts and the same order can be
// reproduced by the battle-start SQL. It reads only; consuming the dose and dismissing the unsupplied
// happen in the start_match transaction (see docs/CORE-EQUIPMENT-CHECKPOINT-2026-09-12.md, Slice D).

import type { RosterHero, RosterItem, RosterWarband } from "../types/roster";

export interface AddictionSupplyLine {
  heroId: string;
  heroName: string;
  itemId: string;
  /** Where his dose comes from, or null when there is none left for him. */
  source: "kit" | "stash" | null;
}

function doses(items: readonly RosterItem[], itemId: string): number {
  return items.filter((i) => i.itemId === itemId).reduce((n, i) => n + Math.max(0, i.quantity), 0);
}

/** Heroes who owe the habit a dose this battle: active roster heroes with an `addictedTo` flag, in roster order. */
export function addictedHeroes(warband: RosterWarband): RosterHero[] {
  return warband.heroes.filter((h) => h.status === "active" && (h.flags.addictedTo?.length ?? 0) > 0);
}

/** One line per addicted hero and item, allocated in roster order: own kit, then the shared stash while it lasts. */
export function allocateAddictionBatches(warband: RosterWarband): AddictionSupplyLine[] {
  const stashLeft = new Map<string, number>();
  const out: AddictionSupplyLine[] = [];
  for (const hero of addictedHeroes(warband)) {
    for (const itemId of hero.flags.addictedTo ?? []) {
      if (doses(hero.equipment, itemId) > 0) {
        out.push({ heroId: hero.id, heroName: hero.name, itemId, source: "kit" });
        continue;
      }
      const left = stashLeft.get(itemId) ?? doses(warband.stash, itemId);
      if (left > 0) {
        stashLeft.set(itemId, left - 1);
        out.push({ heroId: hero.id, heroName: hero.name, itemId, source: "stash" });
      } else {
        stashLeft.set(itemId, 0);
        out.push({ heroId: hero.id, heroName: hero.name, itemId, source: null });
      }
    }
  }
  return out;
}

/** The addicted heroes who would leave if a battle started now. */
export function unsuppliedAddicts(warband: RosterWarband): AddictionSupplyLine[] {
  return allocateAddictionBatches(warband).filter((l) => l.source === null);
}

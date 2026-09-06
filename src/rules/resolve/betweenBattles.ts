// Things a hero may do between battles instead of searching for rare items (Phase 17, warband
// audit A18): a Dark Elf Master of Poisons brews Dark Venom, a Hochland bandit robs travellers, the
// Huckster runs a con, a Merchant sells a stored rare item. Each action spends the hero's search for
// the sequence; the outcome is applied to the roster and written to the trade reason.

import { findItem } from "../data/items";
import type { Resolution, ResolutionEvent, RosterHero, RosterItem, RosterWarband } from "../types/roster";
import { RulesError } from "./errors";
import { skillIdByName } from "./skillRestrictions";

export interface BetweenBattleAction {
  id: "master_of_poisons" | "banditry" | "slick_operator" | "trade";
  label: string;
  text: string;
  /** Dice the player rolls, in order, with a label for each. */
  dice: { key: string; label: string; sides: number }[];
  /** The hero qualifies by a skill (by printed name) or by unit type. */
  skillName?: string;
  unitIds?: string[];
  /** Needs a rare item from the stash to sell. */
  needsStashItem?: boolean;
}

export const BETWEEN_BATTLE_ACTIONS: BetweenBattleAction[] = [
  {
    id: "master_of_poisons",
    label: "Brew Dark Venom",
    text: "If the Hero doesn't search for rare items, he may make D3-1 doses of Dark Venom instead. The poison must be used in the next battle and cannot be sold or traded.",
    dice: [{ key: "d3", label: "D3 (roll a D6: 1-2 = 1, 3-4 = 2, 5-6 = 3)", sides: 6 }],
    skillName: "Master of Poisons",
  },
  {
    id: "banditry",
    label: "Banditry",
    text: "Instead of searching for rare equipment the hero robs travellers: roll a D6. On 2-6 he adds D6+1 gold to the stash; on a 1 the robbery goes wrong and he rolls on the Serious Injury table as if taken out of action.",
    dice: [
      { key: "d6", label: "D6", sides: 6 },
      { key: "gold", label: "D6 gold (+1)", sides: 6 },
    ],
    skillName: "Banditry",
  },
  {
    id: "slick_operator",
    label: "Run a con",
    text: "The Huckster runs a con on the locals: roll a D6. On 2-6 the warband gains 2D6 gold; on a 1 the con backfires and he misses the next game with no gold received.",
    dice: [
      { key: "d6", label: "D6", sides: 6 },
      { key: "gold1", label: "Gold die 1", sides: 6 },
      { key: "gold2", label: "Gold die 2", sides: 6 },
    ],
    unitIds: ["hochland_bandits_huckster"],
  },
  {
    id: "trade",
    label: "Sell a stored rare item",
    text: "Instead of searching, the Merchant sells a rare item stored in the Trade Wagon: roll a D6. 1-2 half the item's basic price, 3-4 the full basic price, 5-6 one and a half times.",
    dice: [{ key: "d6", label: "D6", sides: 6 }],
    unitIds: ["merchant_merchant"],
    needsStashItem: true,
  },
];

/** Actions this hero may take, by skill or unit type. */
export function actionsFor(hero: RosterHero): BetweenBattleAction[] {
  return BETWEEN_BATTLE_ACTIONS.filter((a) => {
    if (a.unitIds && a.unitIds.includes(hero.unitTemplateId)) return true;
    if (a.skillName) {
      const id = skillIdByName(a.skillName);
      if (id && hero.skillIds.includes(id)) return true;
    }
    return false;
  });
}

export interface ActionInput {
  actionId: BetweenBattleAction["id"];
  heroId: string;
  rolls: Record<string, number>;
  /** For the Merchant's Trade: the stash item sold. */
  stashItemId?: string;
}

function d3(d6: number): number {
  return Math.ceil(d6 / 2);
}

/** Apply an action; the events say what happened and the caller records the hero's search as used. */
export function performAction(warband: RosterWarband, input: ActionInput): Resolution<RosterWarband> {
  const hero = warband.heroes.find((h) => h.id === input.heroId && h.status === "active");
  if (!hero) throw new RulesError("action.unknownHero", `No active hero with id "${input.heroId}"`);
  const action = BETWEEN_BATTLE_ACTIONS.find((a) => a.id === input.actionId);
  if (!action) throw new RulesError("action.unknown", `No between-battle action "${input.actionId}"`);
  if (!actionsFor(hero).some((a) => a.id === action.id)) throw new RulesError("action.notAllowed", `${hero.name} may not ${action.label.toLowerCase()}`);
  for (const die of action.dice) {
    const v = input.rolls[die.key];
    if (die.key.startsWith("gold") && input.rolls.d6 === 1) continue; // no gold dice after a failed attempt
    if (!Number.isInteger(v) || v < 1 || v > die.sides) throw new RulesError("action.dice", `${die.label} needs a roll of 1-${die.sides}`);
  }
  const events: ResolutionEvent[] = [];
  const replaceHero = (next: RosterHero): RosterWarband => ({ ...warband, heroes: warband.heroes.map((h) => (h.id === next.id ? next : h)) });

  switch (action.id) {
    case "master_of_poisons": {
      const doses = d3(input.rolls.d3) - 1;
      if (doses <= 0) {
        events.push({ kind: "action", subjectId: hero.id, message: `${hero.name} brews poison between battles and produces nothing usable this time (rolled ${input.rolls.d3}).` });
        return { value: warband, events };
      }
      const venom: RosterItem = { itemId: "dark_venom", quantity: doses, notes: "Master of Poisons: use in the next battle; cannot be sold or traded" };
      const existing = hero.equipment.find((i) => i.itemId === "dark_venom" && i.notes === venom.notes);
      const equipment = existing ? hero.equipment.map((i) => (i === existing ? { ...i, quantity: i.quantity + doses } : i)) : [...hero.equipment, venom];
      events.push({ kind: "action", subjectId: hero.id, message: `${hero.name} brews ${doses} dose${doses === 1 ? "" : "s"} of Dark Venom (rolled ${input.rolls.d3}) for the next battle.`, data: { doses } });
      return { value: replaceHero({ ...hero, equipment }), events };
    }
    case "banditry": {
      if (input.rolls.d6 === 1) {
        events.push({ kind: "action", subjectId: hero.id, message: `${hero.name}'s robbery goes wrong (rolled 1): roll on the Serious Injury table for him as if taken out of action, and enter the result on his card.`, data: { failed: true } });
        return { value: warband, events };
      }
      const gold = input.rolls.gold + 1;
      events.push({ kind: "action", subjectId: hero.id, message: `${hero.name} robs travellers between battles: +${gold} gc (rolled ${input.rolls.d6}, then ${input.rolls.gold}+1).`, data: { gold } });
      return { value: { ...warband, gold: warband.gold + gold }, events };
    }
    case "slick_operator": {
      if (input.rolls.d6 === 1) {
        const flags = { ...hero.flags, missNextGames: Math.max(hero.flags.missNextGames ?? 0, 1) };
        events.push({ kind: "action", subjectId: hero.id, message: `${hero.name}'s con backfires (rolled 1): he is on the run and misses the next game.`, data: { failed: true } });
        return { value: replaceHero({ ...hero, flags }), events };
      }
      const gold = input.rolls.gold1 + input.rolls.gold2;
      events.push({ kind: "action", subjectId: hero.id, message: `${hero.name} runs a con: +${gold} gc for the warband (rolled ${input.rolls.d6}, then ${input.rolls.gold1}+${input.rolls.gold2}).`, data: { gold } });
      return { value: { ...warband, gold: warband.gold + gold }, events };
    }
    case "trade": {
      const stack = warband.stash.find((i) => i.itemId === input.stashItemId);
      const item = stack?.itemId ? findItem(stack.itemId) : undefined;
      if (!stack || !item) throw new RulesError("action.noItem", "Pick a stored item to sell");
      if (item.availability.kind !== "rare") throw new RulesError("action.notRare", `${item.name} is not a rare item`);
      const basic = item.price.base ?? 0;
      const roll = input.rolls.d6;
      const price = roll <= 2 ? Math.floor(basic / 2) : roll <= 4 ? basic : Math.floor(basic * 1.5);
      const stash = stack.quantity > 1 ? warband.stash.map((i) => (i === stack ? { ...i, quantity: i.quantity - 1 } : i)) : warband.stash.filter((i) => i !== stack);
      events.push({ kind: "action", subjectId: hero.id, message: `${hero.name} sells ${item.name} from the Trade Wagon for ${price} gc (rolled ${roll}: ${roll <= 2 ? "half" : roll <= 4 ? "the full" : "one and a half times the"} basic price of ${basic} gc).`, data: { itemId: item.id, price } });
      return { value: { ...warband, gold: warband.gold + price, stash }, events };
    }
  }
}

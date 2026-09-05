// Campaign house-rule switches: defaults, merging a partially specified set, and plain-English
// descriptions for the campaign settings screen. Defaults are Tom's group's (docs/PLANNING.md).

import type { CampaignHouseRules } from "../types/roster";
import { defaultCampaignHouseRules } from "../types/roster";

export { defaultCampaignHouseRules };

/** Fill any missing or undefined switch from the defaults; never mutates `partial`. */
export function applyHouseRuleDefaults(partial?: Partial<CampaignHouseRules> | null): CampaignHouseRules {
  const rules = defaultCampaignHouseRules();
  if (!partial) return rules;
  for (const key of Object.keys(rules) as (keyof CampaignHouseRules)[]) {
    const v = partial[key];
    if (typeof v === "boolean") rules[key] = v;
  }
  return rules;
}

/** One line per switch, stating what is in force. */
export function describeHouseRules(rules: CampaignHouseRules): string[] {
  return [
    rules.strengthArmourPiercing
      ? "Strength modifies armour saves (core rulebook chart: high Strength hits erode the save)."
      : "Strength does not modify armour saves (house rule: armour erosion off).",
    rules.optionalCriticalTables
      ? "Critical hits use the expanded per-weapon-type charts (Optional Rules)."
      : "Critical hits use the core rulebook chart.",
    rules.halfPriceArmour
      ? "Armour costs half its listed price, rounding down; shields, bucklers and helmets stay full price (house rule)."
      : "Armour costs its listed price.",
    rules.rabbitsFootBattleOnly
      ? "A Rabbit's Foot re-rolls one die during the battle only; no exploration re-roll (house rule)."
      : "A Rabbit's Foot unused in the battle re-rolls one exploration die (rulebook).",
  ];
}

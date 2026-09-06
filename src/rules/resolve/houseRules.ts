// Campaign house-rule switches: defaults, merging a partially specified set, and plain-English
// descriptions for the campaign settings screen. Defaults are Tom's group's (docs/PLANNING.md).

import type { CampaignBans, CampaignHouseRules } from "../types/roster";
import { defaultCampaignHouseRules, emptyCampaignBans } from "../types/roster";

export { defaultCampaignHouseRules, emptyCampaignBans };

/** Fill any missing or undefined switch from the defaults; never mutates `partial`. */
export function applyHouseRuleDefaults(partial?: Partial<CampaignHouseRules> | null): CampaignHouseRules {
  const rules = defaultCampaignHouseRules();
  if (!partial) return rules;
  for (const key of Object.keys(rules) as (keyof CampaignHouseRules)[]) {
    if (key === "bans") continue;
    const v = partial[key];
    if (typeof v === "boolean") rules[key] = v;
  }
  const bans = partial.bans;
  if (bans && typeof bans === "object") {
    for (const key of Object.keys(rules.bans) as (keyof CampaignBans)[]) {
      const list = bans[key];
      if (Array.isArray(list)) rules.bans[key] = list.filter((id): id is string => typeof id === "string" && id.length > 0);
    }
  }
  return rules;
}

/** Everything the campaign has banned, flattened, for a quick "is this banned?" check. */
export function isBanned(bans: CampaignBans | undefined, kind: keyof CampaignBans, id: string): boolean {
  return Boolean(bans?.[kind].includes(id));
}

export function bansCount(bans: CampaignBans | undefined): number {
  if (!bans) return 0;
  return bans.items.length + bans.spells.length + bans.hiredSwords.length + bans.characters.length + bans.skills.length;
}

/** One line per switch, stating what is in force. */
/** "; shields and helmets included" / "; shields included, helmets full price" / "; shields and helmets stay full price". */
function halfPriceScope(rules: CampaignHouseRules): string {
  if (rules.halfPriceShields && rules.halfPriceHelmets) return "; shields and helmets included";
  if (rules.halfPriceShields) return "; shields included, helmets full price";
  if (rules.halfPriceHelmets) return "; helmets included, shields full price";
  return "; shields, bucklers and helmets stay full price";
}

export function describeHouseRules(rules: CampaignHouseRules): string[] {
  return [
    rules.strengthArmourPiercing
      ? "Strength modifies armour saves (core rulebook chart: high Strength hits erode the save)."
      : "Strength does not modify armour saves (house rule: armour erosion off).",
    rules.optionalCriticalTables
      ? "Critical hits use the expanded per-weapon-type charts (Optional Rules)."
      : "Critical hits use the core rulebook chart.",
    rules.halfPriceArmour
      ? `Armour costs half its listed price, rounding down, at creation and in the trading post${halfPriceScope(rules)} (house rule).`
      : "Armour costs its listed price.",
    rules.rabbitsFootBattleOnly
      ? "A Rabbit's Foot re-rolls one die during the battle only; no exploration re-roll (house rule)."
      : "A Rabbit's Foot unused in the battle re-rolls one exploration die (rulebook).",
    rules.rewardsOfTheShadowlord
      ? "Rewards of the Shadowlord: a Possessed Magister or Mutant may roll on the Rewards table instead of taking a skill (rulebook optional rule)."
      : "Rewards of the Shadowlord not in use.",
    bansCount(rules.bans) === 0
      ? "Nothing is banned: every item, spell, hired sword, character and skill in the rules is in play."
      : `Banned in this campaign: ${bansCount(rules.bans)} ${bansCount(rules.bans) === 1 ? "entry" : "entries"} (${[
          rules.bans.items.length && `${rules.bans.items.length} item${rules.bans.items.length === 1 ? "" : "s"}`,
          rules.bans.spells.length && `${rules.bans.spells.length} spell${rules.bans.spells.length === 1 ? "" : "s"}`,
          rules.bans.hiredSwords.length && `${rules.bans.hiredSwords.length} hired sword${rules.bans.hiredSwords.length === 1 ? "" : "s"}`,
          rules.bans.characters.length && `${rules.bans.characters.length} character${rules.bans.characters.length === 1 ? "" : "s"}`,
          rules.bans.skills.length && `${rules.bans.skills.length} skill${rules.bans.skills.length === 1 ? "" : "s"}`,
        ]
          .filter(Boolean)
          .join(", ")}).`,
  ];
}

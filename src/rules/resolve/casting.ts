import { legacyHiredItemId } from '../data/items/hiredSpecial';
// Casting a spell or reciting a prayer, as the rulebook plays it (03-campaigns-magic-optional-rules.md:1447-1514).
//
// "To use a spell, the wizard must roll equal to or greater than the spell's Difficulty score on
// 2D6." Around that one roll sit the modifiers a warrior's skills and kit give him, the re-rolls he
// may spend, the enemy's chance to dispel, and the two prohibitions: no magic in armour (prayers
// excepted), and no missile weapons in a turn you cast.
//
// Pure. `casterProfile` reads a hero and says what he can do; `startCast` walks the dice.

import { findItem } from "../data/items";
import { findLore, SPELL_LORES, WIZARD_ALLOCATIONS } from "../data/campaign/magic";
import type { Spell, SpellLore } from "../types/magic";
import type { RosterHero } from "../types/roster";

// ---------------------------------------------------------------------------------------------
// Who can cast, and with what
// ---------------------------------------------------------------------------------------------

/** Prayers follow the same dice but ignore the armour prohibition, and take different kit. */
export type CasterKind = "spell" | "prayer";

/** Lores that are prayers rather than sorcery: their users may wear armour, and use prayer kit.
 * The rulebook names only Prayers of Sigmar for the armour exception (#58); Taal/Lady's/Ulric are
 * included here too as explicitly approved by Tom on 2026-09-09. */
export const PRAYER_LORE_IDS = ["prayers_of_sigmar", "prayers_of_taal", "ladys_prayers", "prayers_of_ulric"] as const;

/**
 * Armour a caster may keep on: helmets are not "armour" for this rule, Chaos Armour is explicitly
 * fused to the body and leaves spells unaffected, and barding belongs to a mount.
 */
const ARMOUR_ALLOWED_WHILE_CASTING = new Set(["helmet", "cooking_pot_helmet", "chaos_armour", "barding", "bretonnian_barding"]);

export interface CastModifier {
  id: string;
  name: string;
  /** Added to the 2D6 total. */
  amount: number;
  /** Where it comes from, for the line under the name. */
  source: string;
  /** The player turns it on for this cast rather than it always applying (a scroll, a nominated spell). */
  optional: boolean;
  /** Spent for good once used. */
  oncePerBattle: boolean;
  note?: string;
}

export interface CastReroll {
  id: string;
  name: string;
  detail: string;
  /** Magic Gubbinz only works on its own D6 of 4+; roll that before the re-roll is granted. */
  gate: { threshold: number; label: string } | null;
  /** Mind Focus re-rolls one die of the two, not the pair. */
  scope: "pair" | "oneDie";
  limit: "perTurn" | "perGame";
}

export interface DispelSource {
  ownerId?: string;
  ownerName?: string;
  limit?: "perTurn";
  /** Only explicit prayer-affecting protection can oppose Sigmar prayers. */
  affectsPrayers?: boolean;
  id: string;
  name: string;
  detail: string;
  /** Runestones roll against the spell's own Difficulty; the piety dispels are a flat D6 threshold. */
  against: "difficulty" | { threshold: number };
}

export interface CastableSpell {
  spell: Spell;
  /** Null for the handful of spells the source marks "Auto": they need no roll. */
  difficulty: number | null;
  /** The selected spell's lore supplies its own restrictions, kit and skills. */
  casting?: Omit<CasterProfile, 'spells'>;
}

export interface CasterProfile {
  heroId: string;
  name: string;
  kind: CasterKind;
  lore: SpellLore;
  spells: CastableSpell[];
  modifiers: CastModifier[];
  rerolls: CastReroll[];
  /** Why he may not cast at all this turn; empty when he may. */
  blocks: string[];
  /** Magical Aptitude: a second spell each turn, on a Toughness test, out of hand-to-hand. */
  secondSpell: boolean;
  /** Rules the player has to apply at the table because the sheet cannot see the board. */
  reminders: string[];
  /** Used by the Magical Aptitude second-spell test. */
  toughness: number;
}

interface CasterKitFinding {
  modifiers: CastModifier[];
  rerolls: CastReroll[];
  dispel: DispelSource[];
  reminders: string[];
}

/** Kit that changes a casting roll. Keyed by catalogue id so the trading post and the sheet agree. */
export const CASTING_ITEM_IDS = ["holy_tome", "familiar", "rosary", "magic_gubbinz", "elven_runestones", "scroll_of_the_rat_familiar"] as const;

/** Skills that change a casting roll. */
export const CASTING_SKILL_IDS = [
  "sorcery",
  "sorcerous_society_additional_academic_skills_scribe",
  "sorcerous_society_additional_academic_skills_mind_focus",
  "sorcerous_society_additional_academic_skills_magical_aptitude",
  "the_restless_dead_variant_undead_special_skills_dark_ritual",
  "the_restless_dead_skills_forbidden_rite",
] as const;

function itemIds(hero: RosterHero): Set<string> {
  return new Set(hero.equipment.filter(e=>e.quantity>0).map((e) => e.itemId ?? legacyHiredItemId(e.customName)).filter((id): id is string => typeof id === "string"));
}

/** Body armour, a shield or a buckler stops a wizard casting; helmets and Chaos Armour do not. */
export function armourBlockingCasting(hero: RosterHero): string[] {
  const out: string[] = [];
  for (const entry of hero.equipment) {
    if (!entry.itemId || ARMOUR_ALLOWED_WHILE_CASTING.has(entry.itemId)) continue;
    const item = findItem(entry.itemId);
    if (item?.category === "armour") out.push(item.name);
  }
  return out;
}

/** Everything the hero's kit and skills bring to a casting roll. */
function casterKit(hero: RosterHero, kind: CasterKind): CasterKitFinding {
  const has = itemIds(hero);
  const skill = (id: string) => hero.skillIds.includes(id);
  const out: CasterKitFinding = { modifiers: [], rerolls: [], dispel: [], reminders: [] };
  const identity = 'hiredSwordId' in hero ? hero.hiredSwordId : hero.unitTemplateId;
  if (kind === 'prayer' && identity === 'bertha_bestraufrung_high_matriarch_of_the_sisterhood') out.modifiers.push({ id: 'sigmars_handmaiden', name: 'Sigmar’s Handmaiden', amount: 2, source: 'Bertha’s special rule', optional: false, oncePerBattle: false });

  if (kind === "spell" && has.has("dark_emissary_staff")) out.modifiers.push({id:"dark_emissary_staff",name:"Staff of Darkness",amount:1,source:"Carried",optional:false,oncePerBattle:false});

  // ---- always-on modifiers ----
  if (kind === "spell" && skill("sorcery")) {
    out.modifiers.push({ id: "sorcery", name: "Sorcery", amount: 1, source: "Academic skill", optional: false, oncePerBattle: false });
  }
  if (kind === "prayer" && has.has("holy_tome")) {
    out.modifiers.push({ id: "holy_tome", name: "Holy Tome", amount: 1, source: "Carried", optional: false, oncePerBattle: false });
  }

  // ---- modifiers the player spends ----
  if (skill("sorcerous_society_additional_academic_skills_scribe")) {
    out.modifiers.push({
      id: "scribe_scroll",
      name: "Scroll",
      amount: 2,
      source: "Scribe",
      optional: true,
      oncePerBattle: true,
      note: "Written before the battle for one spell you know; used just before you cast it.",
    });
  }
  if (skill("the_restless_dead_variant_undead_special_skills_dark_ritual")) {
    out.modifiers.push({
      id: "dark_ritual",
      name: "Dark Ritual",
      amount: 0,
      source: "Undead special skill",
      optional: true,
      oncePerBattle: false,
      note: "+D3 to one nominated spell for the whole battle. Roll the D3 once at the start and enter it here.",
    });
  }
  if (skill("the_restless_dead_skills_forbidden_rite")) {
    out.modifiers.push({
      id: "forbidden_rite",
      name: "Forbidden Rite",
      amount: 0,
      source: "Restless Dead skill",
      optional: true,
      oncePerBattle: false,
      note: "A pool of D3+1 modifiers for the battle if he did not search for rare items last exploration. Spend as many at once as you like.",
    });
  }

  // ---- re-rolls ----
  if (kind === "spell" && has.has("familiar")) {
    out.rerolls.push({ id: "familiar", name: "Familiar", detail: "Re-roll one failed casting roll each turn. The re-roll stands, pass or fail.", gate: null, scope: "pair", limit: "perTurn" });
  }
  if (kind === "prayer" && has.has("rosary")) {
    out.rerolls.push({
      id: "rosary",
      name: "Rosary",
      detail: "Re-roll a failed Difficulty test, if he did nothing this turn but move at walking pace or stand still. Not in combat.",
      gate: null,
      scope: "pair",
      limit: "perTurn",
    });
  }
  if (has.has("magic_gubbinz")) {
    out.rerolls.push({ id: "magic_gubbinz", name: "Magic Gubbinz", detail: "Re-roll a failed magic test on a D6 of 4+.", gate: { threshold: 4, label: "Magic Gubbinz" }, scope: "pair", limit: "perTurn" });
  }
  if (has.has("scroll_of_the_rat_familiar")) {
    out.rerolls.push({
      id: "rat_familiar",
      name: "Rat Familiar",
      detail: 'Once a game, with the Rat Familiar within 6", re-roll the dice for a spell\'s difficulty.',
      gate: null,
      scope: "pair",
      limit: "perGame",
    });
  }
  if (skill("sorcerous_society_additional_academic_skills_mind_focus")) {
    out.rerolls.push({ id: "mind_focus", name: "Mind Focus", detail: "Re-roll one of the two dice. Cannot cancel a Miscast.", gate: null, scope: "oneDie", limit: "perTurn" });
  }

  // ---- dispels the warband can attempt against an enemy spell ----
  if (has.has("elven_runestones")) {
    out.dispel.push({ id: "elven_runestones", name: "Elven Runestones", detail: "Roll against the spell's Difficulty to dispel it. Sorcery does not help.", against: "difficulty" });
  }
  if (skill("dreamwalkers_cult_of_morr_skills_blessed_by_morr")) {
    out.dispel.push({ id: "blessed_by_morr", name: "Blessed by Morr", detail: "Nullify a spell aimed at this model on a D6 of 4+ when fighting the Undead.", against: { threshold: 4 } });
  }

  // ---- things the sheet cannot check ----
  if (has.has("rosary")) out.reminders.push("The Rosary only helps if he did nothing but move at walking pace, and never in combat.");
  if (has.has("scroll_of_the_rat_familiar")) out.reminders.push('The Rat Familiar must be within 6" for its re-roll.');
  out.reminders.push("A wizard may cast one spell per turn, and may not use missile weapons in a turn he casts. He may still run.");
  return out;
}

/** The lore a hero casts from, by the spells he knows or by his unit's row in the Wizard table. */
export function loreForCaster(hero: RosterHero, warbandName: string | undefined, unitName: string | undefined): SpellLore | null {
  if (hero.flags.magicLoreId && findLore(hero.flags.magicLoreId)) return findLore(hero.flags.magicLoreId)!;
  const known = hero.spellIds.length > 0 ? findLoreOfSpell(hero.spellIds) : null;
  if (known) return known;
  const labels = [warbandName && unitName ? `${warbandName} ${unitName}` : null, unitName ?? null].filter((x): x is string => x !== null).map((x) => x.toLowerCase());
  const row = WIZARD_ALLOCATIONS.find((a) => a.loreId !== null && labels.includes(a.wizard.toLowerCase()));
  return row?.loreId ? (findLore(row.loreId) ?? null) : null;
}

function findLoreOfSpell(spellIds: string[]): SpellLore | null {
  return SPELL_LORES.find((lore) => lore.spells.some((s) => spellIds.includes(s.id))) ?? null;
}

export interface CasterInput {
  hero: RosterHero;
  warbandName?: string;
  unitName?: string;
  /** Overrides the lore worked out from the roster (a Liber Bubonicus Plague Priest, say). */
  loreId?: string | null;
  /** Spells banned in this campaign are left off the list. */
  isBanned?: (spellId: string) => boolean;
}

/** What this hero can cast, or null when nothing on the roster says he is a wizard or priest. */
export function casterProfile(input: CasterInput): CasterProfile | null {
  const { hero } = input;
  const lore = input.loreId ? (findLore(input.loreId) ?? null) : loreForCaster(hero, input.warbandName, input.unitName);
  if (!lore) return null;

  // Every spell he knows, wherever it came from: a Tome of Magic or a Book of the Dead can leave a
  // warrior holding spells from two lores, and he may cast all of them.
  const seen = new Set<string>();
  const known: Spell[] = [];
  const knownLores = new Map<string, SpellLore>();
  for (const source of [lore, ...SPELL_LORES.filter((l) => l.id !== lore.id)]) {
    for (const spell of source.spells) {
      if (seen.has(spell.id) || !hero.spellIds.includes(spell.id)) continue;
      if (input.isBanned?.(spell.id) ?? false) continue;
      seen.add(spell.id);
      known.push(spell);
      knownLores.set(spell.id, source);
    }
  }

  return {
    ...castingRules(hero, lore),
    spells: known.map(spell => ({ spell, difficulty: spell.difficulty === null ? null : Math.max(0, spell.difficulty - (hero.flags.spellDifficultyReductions?.[spell.id] ?? 0)), casting: castingRules(hero, knownLores.get(spell.id) ?? lore) })),
  };
}

function castingRules(hero: RosterHero, lore: SpellLore): Omit<CasterProfile, 'spells'> {
  const kind: CasterKind = (PRAYER_LORE_IDS as readonly string[]).includes(lore.id) ? 'prayer' : 'spell';
  const kit = casterKit(hero, kind);
  const blocks: string[] = [];
  // Explicit source exceptions are independent of Tom’s four prayer-lores policy (#58).
  const armourPermittedByLore=lore.id==='norse_runes' || (lore.id==='lizardman_magic' && hero.unitTemplateId==='lizardmen_skink_priest');
  const innateWarriorWizard = hero.unitTemplateId === 'restless_dead_variant_liche' || ('hiredSwordId' in hero && hero.hiredSwordId === 'the_fallen_sister');
  if (kind === "spell" && !hero.skillIds.includes('warrior_wizard') && !innateWarriorWizard && !armourPermittedByLore) {
    const worn = armourBlockingCasting(hero);
    if (worn.length > 0) blocks.push(`A wizard may not use magic wearing armour, a shield or a buckler. Carrying: ${worn.join(", ")}.`);
  }
  if (hero.status !== "active") blocks.push(`${hero.name} is ${hero.status}.`);

  return {
    heroId: hero.id,
    name: hero.name,
    kind,
    lore,
    modifiers: kit.modifiers,
    rerolls: kit.rerolls,
    blocks,
    secondSpell: kind === "spell" && hero.skillIds.includes("sorcerous_society_additional_academic_skills_magical_aptitude"),
    reminders: kit.reminders,
    toughness: hero.stats.T,
  };
}

export function profileForSpell(profile: CasterProfile, spellId: string): CasterProfile {
  return { ...profile, ...profile.spells.find(s => s.spell.id === spellId)?.casting };
}

/** Everything on the roster that can try to stop an enemy spell. */
export function dispelsFor(hero: RosterHero): DispelSource[] {
  const sources=casterKit(hero, "spell").dispel;
  if(hero.equipment.some(i=>i.quantity>0 && (i.itemId==='staff_of_light' || (!i.itemId && legacyHiredItemId(i.customName)==='staff_of_light') || ('hiredSwordId' in hero && hero.hiredSwordId==='truthsayer' && i.itemId==='halberd' && i.notes?.startsWith('Staff of Light:'))))) sources.push({id:'staff_of_light',name:'Staff of Light',detail:'One attempt per turn, whether successful or not.',against:{threshold:4},limit:'perTurn'});
  return sources.map(source=>({...source,ownerId:hero.id,ownerName:hero.name}));
}

// ---------------------------------------------------------------------------------------------
// Rolling the cast
// ---------------------------------------------------------------------------------------------

export type CastStepKind = "cast" | "chooseReroll" | "gate" | "reroll" | "rerollOneDie" | "dispel" | "toughness" | "aptitudeInjury";

export interface CastStep {
  kind: CastStepKind;
  /** How many dice this step wants. */
  dice: number;
  label: string;
  detail: string;
  /** The player may skip it (spending a re-roll, attempting a dispel). */
  optional: boolean;
  /** Set on a re-roll step so the UI can name what is being spent. */
  rerollId?: string;
  /** Set on a dispel step: what the roll needs to beat, so resolution reads it instead of re-deriving it from the label text. */
  dispelAgainst?: DispelSource["against"];
  dispelSource?: DispelSource;
}

export type CastOutcome = "automatic" | "cast" | "failed" | "dispelled";

export interface CastLogLine {
  text: string;
  tone: "neutral" | "good" | "bad";
}

export interface CastState {
  profile: CasterProfile;
  spell: Spell;
  difficulty: number | null;
  /** Modifiers switched on for this cast, already totalled into `bonus`. */
  applied: { id: string; name: string; amount: number }[];
  bonus: number;
  dice: [number, number] | null;
  /** Whether `dice` came from the app's own Roll button or was tapped/typed in by hand; undefined when unknown. */
  diceManual?: boolean;
  /** Per-die reroll history for this casting attempt, retained through saved state. */
  rerolledDice?: [boolean, boolean];
  /** Re-roll ids spent in this cast or earlier this battle. */
  used: string[];
  pending: CastStep | null;
  log: CastLogLine[];
  outcome: CastOutcome | null;
  /** Magical Aptitude: the second attempt is offered once the first is resolved. */
  secondSpellOffered: boolean;
  done: boolean;
  /** Dispel sources actually available to whoever is opposing this cast; empty means nobody can. */
  enemyDispel: DispelSource[];
  dispelRolled?: { source: DispelSource; roll: number; manual: boolean };
}

const CAST_STEP = (over: Partial<CastStep> & Pick<CastStep, "kind" | "label" | "detail">): CastStep => ({ dice: 2, optional: false, ...over });

function modifierText(state: CastState): string {
  return state.applied.length === 0 ? "" : ` ${state.applied.map((m) => `${m.amount >= 0 ? "+" : ""}${m.amount} ${m.name}`).join(", ")}`;
}

export interface StartCastOptions {
  /** Modifier ids the player switched on, with the value for the ones that are rolled (Dark Ritual's D3). */
  modifiers?: { id: string; amount?: number }[];
  /** Re-roll ids already used up earlier in the battle or this turn. */
  alreadyUsed?: string[];
  /** Dispel sources the opposing side actually has on the table; omit or leave empty for none. */
  enemyDispel?: DispelSource[];
}

/** Actual Difficulty and separate casting-roll bonuses; bonuses never lower a dispel target. */
export function effectiveDifficulty(profile: CasterProfile, spell: Spell, options: StartCastOptions = {}) {
  profile = profileForSpell(profile, spell.id);
  const difficulty = profile.spells.find(s => s.spell.id === spell.id)?.difficulty ?? spell.difficulty;
  const chosen = options.modifiers ?? [];
  const applied = profile.modifiers
    .filter((m) => !m.optional || chosen.some((c) => c.id === m.id))
    .map((m) => ({ id: m.id, name: m.name, amount: chosen.find((c) => c.id === m.id)?.amount ?? m.amount }))
    .filter((m) => m.amount !== 0);
  const bonus = applied.reduce((n, m) => n + m.amount, 0);
  return { base: spell.difficulty, effective: difficulty, modifiers: applied, bonus };
}

export function startCast(profile: CasterProfile, spell: Spell, options: StartCastOptions = {}): CastState {
  profile = profileForSpell(profile, spell.id);
  const { effective: difficulty, modifiers: applied, bonus } = effectiveDifficulty(profile, spell, options);

  const state: CastState = {
    profile,
    spell,
    difficulty,
    applied,
    bonus,
    dice: null,
    rerolledDice: [false, false],
    used: [...(options.alreadyUsed ?? [])],
    pending: null,
    log: [],
    outcome: null,
    secondSpellOffered: false,
    done: false,
    enemyDispel: (options.enemyDispel ?? []).filter(source=>profile.lore.id!=='prayers_of_sigmar' || source.affectsPrayers===true),
  };

  if (spell.difficulty === null) {
    state.outcome = "automatic";
    state.log.push({ text: `${spell.name} is cast automatically — no Difficulty roll.`, tone: "good" });
    // Without a numerical Difficulty, only fixed-threshold dispels have a defined roll.
    state.enemyDispel=state.enemyDispel.filter(source=>source.against!=='difficulty');
    return offerDispel(state);
  }
  state.pending = CAST_STEP({
    kind: "cast",
    label: profile.kind === "prayer" ? "Recite the prayer" : "Cast the spell",
    detail: `${spell.name}: 2D6, needs ${difficulty}+${difficulty !== spell.difficulty ? ` (base ${spell.difficulty})` : ''}${bonus !== 0 ? ` with ${bonus >= 0 ? "+" : ""}${bonus}` : ""}.`,
  });
  return state;
}

/** Re-rolls still available: not spent, and matching the failure at hand. */
export function availableRerolls(state: CastState): CastReroll[] {
  const rerolled = state.rerolledDice ?? [false, false];
  return state.profile.rerolls.filter((r) => !state.used.includes(r.id)
    && (r.scope === "pair" ? !rerolled.some(Boolean) : !rerolled.every(Boolean)));
}

/** Feed the dice for the pending step. `manual` is whether the app rolled these or they were tapped/typed in by hand; omit when unknown. */
export function applyCastRoll(state: CastState, values: number[], manual?: boolean): CastState {
  const step = state.pending;
  if (!step) return state;
  const next: CastState = { ...state, log: [...state.log], used: [...state.used] };
  /** Matches RollResult's own wording (ui/Dice.tsx), so the persisted line agrees with what was shown on screen at the time. */
  const rollTag = manual === undefined ? "" : manual ? " (entered by hand)" : " (rolled by the app)";

  switch (step.kind) {
    case "chooseReroll":
      // Nothing to roll here: the player picks a re-roll with spendReroll, or declines.
      return state;
    case "cast":
    case "reroll": {
      if (step.kind === "reroll") next.rerolledDice = [true, true];
      next.dice = [values[0], values[1]];
      next.diceManual = manual;
      const sum = values[0] + values[1];
      const score = sum + next.bonus;
      const verb = step.kind === "reroll" ? "Re-rolled" : "Rolled";
      next.log.push({
        text: `${verb} ${values[0]} + ${values[1]}${rollTag} = ${sum}${modifierText(next)}${next.bonus !== 0 ? ` = ${score}` : ""} against ${next.difficulty}+.`,
        tone: score >= (next.difficulty ?? 0) ? "good" : "bad",
      });
      return score >= (next.difficulty ?? 0) ? succeed(next) : offerRerollOrFail(next);
    }
    case "rerollOneDie": {
      // values: [whichDie (1 or 2), newFace]
      const [which, face] = values;
      if ((which !== 1 && which !== 2) || state.rerolledDice?.[which - 1]) return state;
      next.rerolledDice = [...(state.rerolledDice ?? [false, false])];
      next.rerolledDice[which - 1] = true;
      const before = next.dice ?? [0, 0];
      next.dice = which === 1 ? [face, before[1]] : [before[0], face];
      next.diceManual = manual;
      const sum = next.dice[0] + next.dice[1];
      const score = sum + next.bonus;
      next.log.push({ text: `Mind Focus re-rolls the ${which === 1 ? "first" : "second"} die to ${face}${rollTag}: ${next.dice[0]} + ${next.dice[1]} = ${sum}${next.bonus !== 0 ? ` = ${score}` : ""}.`, tone: score >= (next.difficulty ?? 0) ? "good" : "bad" });
      return score >= (next.difficulty ?? 0) ? succeed(next) : offerRerollOrFail(next);
    }
    case "gate": {
      const gate = state.profile.rerolls.find((r) => r.id === step.rerollId)?.gate;
      const passed = gate ? values[0] >= gate.threshold : false;
      next.log.push({ text: `${gate?.label ?? "Gate"}: rolled ${values[0]}${rollTag}, ${passed ? `${gate?.threshold}+ — the re-roll is granted` : "no re-roll"}.`, tone: passed ? "good" : "bad" });
      next.used.push(step.rerollId!);
      if (!passed) return offerRerollOrFail(next);
      const reroll = state.profile.rerolls.find((r) => r.id === step.rerollId)!;
      next.pending = rerollStep(reroll, next);
      return next;
    }
    case "dispel": {
      const sum = values.length > 1 ? values[0] + values[1] : values[0];
      const target = step.dispelAgainst === "difficulty" ? (next.difficulty ?? 0) : (step.dispelAgainst?.threshold ?? 0);
      const dispelled = sum >= target;
      if(step.dispelSource) next.dispelRolled={source:step.dispelSource,roll:sum,manual:manual??false};
      next.log.push({ text: `Dispel attempt${step.dispelSource ? ` (${step.dispelSource.ownerName ?? "Warrior"}: ${step.dispelSource.name})` : ""}: rolled ${values.join(" + ")}${rollTag}${values.length > 1 ? ` = ${sum}` : ""} against ${target}+. ${dispelled ? "The spell fails to work." : "The spell works normally."}`, tone: dispelled ? "bad" : "good" });
      if (dispelled) next.outcome = "dispelled";
      return afterCast(next);
    }
    case "toughness": {
      const passed = values[0] < 6 && values[0] <= toughnessOf(state);
      next.log.push({
        text: `Magical Aptitude, Toughness test: rolled ${values[0]}${rollTag} against ${toughnessOf(state)}. ${passed ? "He may attempt a second spell." : "He is wracked by the effort."}`,
        tone: passed ? "good" : "bad",
      });
      if (passed) {
        next.pending = null;
        next.done = true;
        return next;
      }
      next.pending = CAST_STEP({ kind: "aptitudeInjury", dice: 2, label: "Injury roll", detail: "No saves. An Out of action result counts as Stunned instead." });
      return next;
    }
    case "aptitudeInjury": {
      const sum = values[0] + values[1];
      const band = sum <= 2 ? "Knocked down" : sum <= 4 ? "Stunned" : "Stunned (Out of action counts as Stunned)";
      next.log.push({ text: `Injury roll ${values[0]} + ${values[1]}${rollTag} = ${sum}: ${band}.`, tone: "bad" });
      next.pending = null;
      next.done = true;
      return next;
    }
  }
}

/** Skip an optional step: decline a re-roll, or decline the dispel attempt. */
export function declineCastStep(state: CastState): CastState {
  const step = state.pending;
  if (!step) return state;
  const next: CastState = { ...state, log: [...state.log] };
  if (step.kind === "dispel") {
    next.log.push({ text: "No dispel attempted.", tone: "neutral" });
    return afterCast(next);
  }
  if (step.kind === "toughness") {
    next.log.push({ text: "No second spell attempted.", tone: "neutral" });
    next.pending = null;
    next.done = true;
    return next;
  }
  // A declined re-roll ends the attempt.
  next.log.push({ text: "No re-roll.", tone: "neutral" });
  return fail(next);
}

/** Spend a named re-roll: pushes its gate roll first when it has one. */
export function spendReroll(state: CastState, rerollId: string): CastState {
  if (state.pending?.kind !== "chooseReroll") return state;
  const reroll = availableRerolls(state).find((r) => r.id === rerollId);
  if (!reroll) return state;
  const next: CastState = { ...state, log: [...state.log], used: [...state.used] };
  if (reroll.gate) {
    next.pending = CAST_STEP({ kind: "gate", dice: 1, label: `${reroll.name}: D6`, detail: `${reroll.gate.threshold}+ grants the re-roll.`, rerollId });
    return next;
  }
  next.used.push(rerollId);
  next.pending = rerollStep(reroll, next);
  return next;
}

function rerollStep(reroll: CastReroll, state: CastState): CastStep {
  if (reroll.scope === "oneDie") {
    return CAST_STEP({ kind: "rerollOneDie", dice: 2, label: `${reroll.name}: re-roll one die`, detail: `Currently ${state.dice?.[0]} and ${state.dice?.[1]}. Choose which die, then its new face.`, rerollId: reroll.id });
  }
  return CAST_STEP({ kind: "reroll", dice: 2, label: `${reroll.name}: re-roll`, detail: `2D6 again, needs ${state.difficulty}+. The result stands.`, rerollId: reroll.id });
}

function offerRerollOrFail(state: CastState): CastState {
  const left = availableRerolls(state);
  if (left.length === 0) return fail(state);
  const next = { ...state };
  next.pending = CAST_STEP({
    kind: "chooseReroll",
    dice: 0,
    label: "Spend a re-roll?",
    detail: `Available: ${left.map((r) => r.name).join(", ")}.`,
    optional: true,
  });
  return next;
}

function fail(state: CastState): CastState {
  const next: CastState = { ...state, log: [...state.log] };
  next.outcome = "failed";
  next.log.push({ text: `${next.spell.name} fails. ${next.profile.name} may not cast a spell this turn.`, tone: "bad" });
  return afterCast(next);
}

function succeed(state: CastState): CastState {
  const next: CastState = { ...state, log: [...state.log] };
  next.outcome = "cast";
  next.log.push({ text: `${next.spell.name} is cast.`, tone: "good" });
  return offerDispel(next);
}

function offerDispel(state:CastState):CastState {
  const next={...state};
  // Only offer a dispel roll when someone on the table actually has a way to attempt one — most
  // games have nobody with Elven Runestones, Blessed by Morr, or the like, and this used to ask
  // regardless.
  const source = next.enemyDispel[0];
  if (!source) return afterCast(next);
  const dice = source.against === "difficulty" ? 2 : 1;
  const target = source.against === "difficulty" ? next.difficulty : source.against.threshold;
  next.pending = CAST_STEP({
    kind: "dispel",
    dice,
    label: `${source.name}: any dispel?`,
    detail: `${source.detail} Needs ${target}+.`,
    optional: true,
    dispelAgainst: source.against,
    dispelSource: source,
  });
  return next;
}

export function selectDispelSource(state:CastState, index:number):CastState {
 if(state.pending?.kind!=='dispel') return state;
 const source=state.enemyDispel[index];
 if(!source) return state;
 const target=source.against==='difficulty'?state.difficulty:source.against.threshold;
 return {...state,pending:{...state.pending,dice:source.against==='difficulty'?2:1,label:`${source.name}: any dispel?`,detail:`${source.detail} Needs ${target}+.`,dispelAgainst:source.against,dispelSource:source}};
}

function afterCast(state: CastState): CastState {
  const next = { ...state };
  if (next.profile.secondSpell && !next.secondSpellOffered) {
    next.secondSpellOffered = true;
    next.pending = CAST_STEP({
      kind: "toughness",
      dice: 1,
      label: "Magical Aptitude: a second spell?",
      detail: "Take a Toughness test to attempt another spell this turn. Out of hand-to-hand only. A failure means an injury roll with no saves.",
      optional: true,
    });
    return next;
  }
  next.pending = null;
  next.done = true;
  return next;
}

function toughnessOf(state: CastState): number {
  return state.profile.toughness;
}

/** One line for the log tab and the battle record. */
export function describeCast(state: CastState): string {
  const who = state.profile.name;
  switch (state.outcome) {
    case "automatic":
      return `${who} casts ${state.spell.name} (automatic).`;
    case "cast":
      return `${who} casts ${state.spell.name}.`;
    case "dispelled":
      return `${who}'s ${state.spell.name} is dispelled.`;
    case "failed":
      return `${who} fails to cast ${state.spell.name}.`;
    default:
      return `${who} attempts ${state.spell.name}.`;
  }
}

export const CAST_OUTCOME_LABEL: Record<CastOutcome, string> = {
  automatic: "Cast automatically",
  cast: "Cast",
  failed: "Failed",
  dispelled: "Dispelled",
};

# Open items to confirm with Tom

Per the brief's own §11, these are flagged rather than guessed. The tool ships with the
documented default in each case, so nothing here blocks using it.

## Confirmed by Tom (2026-09-01)

- **Natural 1 fails / natural 6 succeeds** applies to every pass/fail threshold test (To Hit, To
  Wound, Armour Save, Parry, Step Aside, Dodge, Thick Skull) but not to the Injury chart's or
  Critical Hit table's own 1-6 band lookup. Confirmed correct as implemented.
- **Dual-wield resolution order** (primary weapon's attacks resolve first, then the off-hand's
  bonus attack — this determines which attack gets first claim on both the one-crit-per-phase and
  one-Parry-per-phase resources) — confirmed correct. Now also explained directly in the UI: see
  the note above the weapon order picker in Character Builder / Combat Analyzer (`shared.tsx`,
  `WeaponOrderedPicker`), not just here.
- **Off-hand weapon grants a flat +1 attack** (not a second full Attacks allocation, not boosted
  by attack-count skills or Frenzy) — confirmed correct.
- **Parry + two weapons = reroll a failed attempt is Dwarf-Axe-specific.** Two swords, or a sword
  + Buckler, do NOT get the reroll — only a combination involving at least one Dwarf Axe does.
  Implemented via `DefenderProfile.hasDwarfAxeParry` (`engine/buildAttackInput.ts`), with a
  matching UI checkbox that appears whenever 2 Parry items are selected (Combat Analyzer, Stat
  Sensitivity). This was previously a generalised assumption ("any two Parry weapons") — now
  fixed to match actual play.
- **Bucklers split from Shields.** Buckler = Parry, no save bonus; Shield = save bonus, no Parry.
  `Armour` now has both `shield` and `buckler` booleans (`types/index.ts`), with a UI checkbox for
  each. A Buckler counts toward `parryWeaponCount` the same as an equipped Parry weapon.
- **Ward saves** are now modeled — a per-character optional threshold (`Character.wardSaveThreshold`
  / `DefenderProfile.wardSaveThreshold`, e.g. `5` = "Ward (5+)"), attempted after the armour save
  and Step Aside, applying even when a crit ignores the armour save entirely or forces an
  automatic result, and never eroded by Strength — matches the verbatim mordheimer.net rule
  exactly ("Even if a hit ignores all armour saves, a model with a Ward may still try to take its
  Ward save as normal"). No universal chart for the threshold value — it's specific to whichever
  hero/creature has one, entered directly on the character sheet.
- The brief's "seven relevant characteristics" (§1.3) vs. eight-item list (§7) inconsistency —
  acknowledged as fine to leave as-is (doesn't change any actual numbers).

## Resolved — stacking Injury-chart remaps

Was flagged as a pending decision: Concussion (a hammer's weapon rule, remaps to 1 KD / 2-4
Stunned / 5-6 OOA), True Grit (a chosen Dwarf Hero skill, remaps to 1-3 KD / 4-5 Stunned / 6 OOA),
and Hard to Kill (automatic Dwarf racial rule, remaps to 1-2 KD / 3-5 Stunned / 6 OOA) can't all
apply at once, and nothing in the source material said which wins.

Turns out it's moot in practice: Dwarfs have a separate racial rule, **Hard Head** ("Dwarfs ignore
the special rules for maces, clubs, etc."), which cancels Concussion outright for any properly-
tagged Dwarf — regardless of which weapon hit them. So Concussion-vs-True-Grit and
Concussion-vs-Hard-to-Kill never actually arise for a correctly built Dwarf character. Hard Head
was already modeled (`engine/buildAttackInput.ts` — `concussion = weapon.concussion &&
!defender.activeTraitIds.includes("hard_head")`), so no code change was needed here.

The one catch: Hard to Kill and Hard Head are two separate checkboxes in the Traits picker
(matching the site's own two distinct named rules), so the immunity only applies if both are
ticked on a Dwarf character. Asked whether to bundle them into one "Dwarf" toggle to prevent
forgetting one — **kept as two separate checkboxes** (matches the site's own rule naming; more
flexible if a future warband ever needed one without the other). The existing `resolveInjuryBand`
precedence order (Concussion > True Grit > Hard to Kill > standard) stays as the fallback for the
edge case of a Dwarf missing the Hard Head tag, or a hypothetical non-Dwarf with True Grit.

## Also worth knowing

- Import "merge" and "replace" (brief §7 screen 5) act **per named warband**, not on the entire
  local dataset — replace overwrites that one warband's entry, other warbands already stored
  locally are untouched.
- The published Claude Artifact and the Netlify build are the same source, built two different
  ways (`npm run build:artifact` vs `npm run build`) — see README.md.
- `rules/00-index.md` is the entry point for the full mordheimer.net rules reference — everything
  scraped from the site (Core through Grade 2a warbands, all core/optional rules, magic, weapons)
  in searchable Markdown, cross-checked against the engine (found and fixed a real To Wound chart
  bug at Strength 8-10 — see `engine/toWound.ts`'s file comment).
- Still open, not yet built: Expert Swordsman's "sword" name-matching heuristic, Eagle Eyes' flat
  long-range-negation (vs. a true inches-based threshold shift). Not urgent, not yet raised.

## Schema build-out (2026-09-01): Warband/Unit templates + full weapons database

Per Tom's steer — plain TS/JSON data files, not a real database (the app is static/client-only by
design; a few hundred lookup-only records don't need SQL) — built out in two pieces:

1. **`WarbandTemplate`/`UnitTemplate`/`EquipmentList`** (`types/index.ts`), populated from
   `rules/warbands/*.md` via 6 parallel extraction agents (one per already-scraped file, no
   browsing needed). Result: **72 warband templates, 246 hero types, 228 henchman types**, zero
   duplicate ids, one real bug caught by a post-merge typecheck (a unit missing its `stats` block
   — fixed directly). Character Builder's new "Load from Warband Template" panel pre-fills stats/
   role/racial-traits/notes from these. Skills aren't pre-selected (Heroes gain them from Advances
   during play). Starting equipment is recorded as notes rather than auto-equipped, since it's
   free text, not weapon ids — see the next point for why that's fine now.
2. **Full weapons database** (`data/weapons/melee.ts` + `data/weapons/ranged-and-creatures.ts`,
   aggregated in `data/weapons.ts`), replacing the ~25-item placeholder seed. **120 weapons total**
   (65 melee, 53 ranged/creature attacks, 2 manual additions — Wight Blade and Zombie Claws, which
   don't appear as standalone entries on the source's general weapons/bestiary pages). Existing
   ids (`sword`, `hammer`, `bow`, etc.) were preserved for save-compatibility with characters built
   before this change.

**Schema gap found and fixed along the way:** `Weapon.strength` was `"user" | number` only, but
many melee weapons are written as "As user +N" (double-handed weapons etc.) — a Strength *bonus*
on top of the wielder's own stat, not a fixed replacement value. Added `strengthBonus?: number`
(only meaningful when `strength === "user"`), wired into `buildAttackInput.ts`. Confirmed with a
hand-derived test that the bonus actually reaches the To Wound lookup.

**Judgment calls made during weapon extraction** (all documented inline as code comments, not
silently decided):
- `concussion: true` (the mechanical house-rule flag) is set ONLY on weapons actually named/
  described as a hammer. Several other weapons carry an equivalent "2-4 = Stunned" remap under a
  different name (Club, Mace, Ogre Club, etc.) — these get an informational `"concussion"` tag in
  `special` instead of the mechanical flag, since the house rule as scoped is hammer-specific.
- `parry: true` is set only where a weapon's own rules explicitly grant Parry — turns out to be 17
  items, not just Sword/Dwarf Axe (several magic/named weapons too).
- Ranged weapons: the source gives one Range figure, not a short/long split, so `shortRange =
  maxRange / 2` per the core half-range-penalty rule, except weapons whose own rules say they
  ignore range penalties (thrown weapons, "Accurate" weapons) — those get `shortRange = maxRange`.
  This means these figures now *supersede* the old seed's placeholder numbers for the same ids
  (e.g. Bow is now 12"/24", not 16"/24") — the id was kept, the values were corrected.
- A handful of items don't fit the `Weapon` shape at all (double-barrelled firearms' one-hit/
  two-wound-roll structure, area-effect weapons, entangle-not-wound effects, etc.) — modeled
  best-effort with the real mechanic flagged in a `// TODO` comment rather than faked as a normal
  weapon or silently dropped. Search `data/weapons/*.ts` for `TODO` to find all of them.

## Bug/feedback pass (2026-09-03)

Tom tested the app after the schema build-out and reported 5 issues. All fixed:

1. **Weapon picker couldn't equip the same weapon twice.** `WeaponOrderedPicker` filtered its
   "add weapon" list by `!selectedIds.includes(w.id)`, so a second identical weapon (e.g. two
   plain swords) vanished from the dropdown after the first was added. Fixed: the add-list is no
   longer filtered, and the equipped list now keys/removes by index instead of id (`shared.tsx`).

2. **Gromril and Ithilmar weapons were fake standalone catalogue entries.** Per mordheimer.net,
   both are a *material upgrade* applied to an existing weapon choice ("you may choose which type
   of hand-to-hand weapon is offered"), not weapons of their own — the extraction agent had
   flagged this as a TODO but modeled them as one generic phantom "Gromril Weapon"/"Ithilmar
   Weapon" each, with no real identity and no mechanical effect. Fixed properly:
   - Added `Weapon.saveModifier` (extra armour-save threshold shift, e.g. Gromril's own -1) and
     `Weapon.initiativeModifier` (Ithilmar's +1 I — informational only, Initiative isn't wired into
     the probability engine, same as the character sheet's own I stat) to the schema
     (`types/index.ts`), and wired `saveModifier` into `buildAttackInput.ts`'s armour-threshold
     calculation (a weapon can make an existing save harder, but can't conjure a save out of
     nothing — IMPOSSIBLE stays IMPOSSIBLE).
   - Removed the two fake `gromril_weapon`/`ithilmar_weapon` entries from `data/weapons/melee.ts`.
   - Added `data/weapons/materialVariants.ts`, generating a proper Gromril/Ithilmar version of each
     of the 11 ordinary trading-post melee weapons (dagger, sword, axe, mace, club, hammer, spear,
     halberd, flail, double-handed weapon, morning star) — 22 new catalogue entries, e.g. "Gromril
     Sword" carries Sword's own profile plus Gromril's extra -1 save. Deliberately NOT generated
     for the setting's bespoke/magical named weapons (Cathayan Longsword, Starsword, Iron Fist,
     etc.), which are their own distinct items, not upgradeable trading-post weapons.
   - `storage.ts`'s `migrate()` remaps the two retired ids to their Sword variant, so a character
     saved during this session (before the fix) doesn't silently lose its equip slot.
   - Note: several *other* weapons' save-modifier `special` tags (axe/dwarf axe/great axe's
     "cuttingEdge", dagger's "plus1EnemyArmourSave", katar's "minus1EnemyArmourSave", etc.) remain
     informational-only, same as before this fix — only Gromril's own modifier was wired up, since
     that's what was asked; wiring up the rest is a larger follow-up, not done here.
   - Ithilmar Armour (a distinct 5+ save catalogue item, mordheimer.net) was NOT added as a new
     `ArmourType` — its only distinguishing rule vs. Heavy Armour is a movement-penalty exemption,
     and this engine doesn't model movement at all, so it would be probability-identical to Heavy
     Armour under current scope.

3. **"Reference opponent" was redundant under Skill Sensitivity — now fixed.** The Combat
   Analyzer/Stat Sensitivity redirect (see "Combat Analyzer redesign" below in git history) had
   already replaced "build a full opponent character" with a lightweight `OpponentScenario`, but
   Skill Sensitivity was never updated to match — it still required picking a full saved character
   as the "reference opponent." Fixed: extracted `OpponentScenario` + its editor into
   `domain/opponentScenario.ts` (plain data/helpers) and `components/shared.tsx`
   (`OpponentScenarioEditor`, the React piece), shared by both Analyser screens now. Skill Gain
   Analyser's defensive categories (where the opponent attacks) use a small synthetic attacker
   (opponent WS + a single picked weapon) instead of a saved character's full loadout — see
   `engine/skillSensitivity.ts`'s `syntheticAttacker`.

4. **Skill Sensitivity only showed the baseline OOA% delta, no breakdown.** Rewrote
   `computeSkillSensitivity` (`engine/skillSensitivity.ts`) to return Hit%/Wound%/Injury-roll-alone
   OOA%/Full-turn OOA% at both baseline and with-skill, for every result row — so the headline
   delta can be checked step by step instead of taken on faith, matching what was already shown
   for Combat Analyzer's single-weapon panels.

5. **Stat Sensitivity required a "reference defender" gate and only showed one column.**
   Merged Combat Analyzer + Stat Sensitivity into one screen, **Stat Gain Analyser**
   (`components/StatGainAnalyser.tsx`) — attacker + weapon picker, `OpponentScenario` (not a full
   defender), Hit%/Wound%/Injury-alone panels, the full WS×T swept Full-Turn OOA grid (no
   opponent-building required), and underneath all of that, a "+1 Stat Impact" table
   (`engine/statSensitivity.ts`'s `computeStatGainBreakdown`) with Hit%/Wound%/Injury-OOA%/Full-OOA%
   baseline-vs-+1 columns per stat, ranked by the Full-OOA delta, against an adjustable WS/T
   reference point (separate from the sweep grids, which always cover all 100 combinations).
   Skill Sensitivity similarly became **Skill Gain Analyser** (item 3/4 above). Tabs are now:
   Character Builder · Stat Gain Analyser · Skill Gain Analyser · Import/Export (4, as requested) —
   `App.tsx`. Old `CombatAnalyzer.tsx`/`StatSensitivityScreen.tsx`/`SkillSensitivityScreen.tsx` were
   deleted rather than kept alongside the new screens.

Verified: `tsc -b` clean, 53/53 tests pass (2 new — Gromril's saveModifier wiring and its
IMPOSSIBLE-stays-IMPOSSIBLE edge case), production build succeeds, and manually exercised in
Chrome — duplicate weapon equip, all 22 material variants appear correctly with no phantom
"Gromril Weapon"/"Ithilmar Weapon" entries, and both Analyser screens render and compute
hand-checkable numbers with zero console errors (Stat Gain: WS/S +1 deltas cross-checked directly
against the Hit%/Wound% grids; Skill Gain: conditional skills correctly show 0 delta with their
trigger context off, Step Aside correctly reduces defensive OOA%).

### Follow-up: opponent skills/traits felt redundant with Character Builder

Tom's next observation: the Opponent Scenario panel in both Analyser screens asks you to re-tick
skills/traits by hand, even though you may have already built that exact loadout as a saved
character in Character Builder. Fixed by adding `characterToOpponentScenario()`
(`domain/opponentScenario.ts`) and a small `LoadOpponentFromCharacter` control (`shared.tsx`) at
the top of the Opponent Scenario panel on both screens: pick a saved character, hit Load, and it
copies their armour/Parry/Ward/skills/traits (plus WS/Toughness, and — on Skill Gain's defensive
categories — their primary equipped weapon) straight into the scenario. Same "load and prefill,
then edit freely" pattern as Character Builder's own "Load from Warband Template" — not a live
link back to the character, and entirely optional (the default "build from scratch" scenario still
works with zero characters saved, so the earlier "no reference opponent required" fix still holds).
Also deduplicated `countParryItems`/character→DefenderProfile logic that had drifted into two
separate copies (`engine/skillSensitivity.ts` and the new domain helper) into one.

Verified: `tsc -b` clean, 53/53 tests still pass, production build succeeds, and manually
exercised in Chrome — loading a saved Dwarf character with a skill, heavy armour + shield, and
racial traits into the Opponent Scenario in one click correctly checked/set every corresponding
field (confirmed via DOM inspection, not just visually), with zero console errors.

## Feature/bug pass (2026-09-03, second round)

Tom's next batch, four items:

1. **House Rules tab.** Added `HouseRules` (`types/index.ts`) + `AppData.houseRules`
   (`state/storage.ts`, migrated with a default so old saves don't break), a new `House Rules` tab
   (`HouseRulesScreen.tsx`) between Skill Gain Analyser and Import/Export, and threaded it through
   `buildAttackInput`/`resolveCharacterTurn`/`computeStatGainBreakdown`/`computeSkillSensitivity`
   (all as an optional param defaulting to all-off, so existing callers/tests are unaffected). Only
   one real toggle exists in the engine today — Strength-based armour save erosion
   (`engine/armourSave.ts`), previously a hardcoded `false` constant — now a genuine per-install
   switch. Didn't invent new house rules (e.g. the documented-but-unimplemented "-1 to hit fighting
   with two weapons") just to fill the tab out; it's built to hold more as they come up.

2. **Two Stat Gain Analyser complaints, same root cause.** (a) "A random row is highlighted and I
   can't figure out why" — the Hit%/Wound% grids highlight the attacker's own effective WS/Strength
   row, but nothing said so; added a one-line caption above each grid naming the value and why it's
   highlighted. (b) "+1 stat impact doesn't seem to simulate extra attacks — every column looks the
   same, then Full OOA jumps by 10 points with nothing else changing." This wasn't a math bug —
   Attacks (A) only ever affects the full-turn aggregate (more independent chances to land a hit),
   never any single attack's own Hit%/Wound%/Injury-OOA% — but there was no way to *see* that,
   so the jump looked unexplained. Added `totalAttackCount()` (`engine/buildAttackInput.ts`) and an
   Attacks column (baseline vs +1/with-skill) to both the Stat Gain and Skill Gain breakdown tables
   — the "A" row's Attacks column now visibly goes 1→2, and the caption explains that a Full-OOA
   jump unmatched by the other columns means the whole effect is attack count, not landing more
   often. Hand-verified: 1-(1-p)^n roughly matches the observed jump for n=1→2.

3. **Selected character reset on every tab switch.** `selectedCharacterId` was local `useState` in
   each Analyser screen, which fully unmounts on tab switch (`App.tsx` conditionally renders one
   screen at a time) — so it always reset to blank. Lifted the character id (and its setter) to
   `App.tsx`, passed down as props to both Analyser screens; App itself never unmounts, so the pick
   now survives switching tabs (not page reloads — that's a `localStorage` decision deliberately
   not made here, since the ask was specifically about tab-switching). Caught a second instance of
   the same class of bug while testing this: `attackerWeaponIds`/`displayWeaponId` were *also* local
   `useState([])`/`useState("")` in both screens, so even with the character id now persisted, the
   weapon loadout still reset to empty on remount. Fixed by deriving both from the (now-persisted)
   character id via lazy `useState` initializers, so switching tabs keeps the weapon loadout too.

4. **Skill Gain Analyser still asked for a full Opponent Scenario, unlike Stat Gain Analyser.**
   Tom's read: it should structurally mirror Stat Gain Analyser, only needing weapon/WS/Toughness
   at the very bottom for the final ranked table. Restructured `SkillGainAnalyser.tsx` to match
   `StatGainAnalyser.tsx`'s layout exactly — Character+weapons panel, Opponent Scenario panel
   (still there, since Stat Gain Analyser has one too and it's the thing "Load opponent from a
   saved character" above was built for), Context, then the same Hit%/Wound%/Injury-alone/Full-Turn
   OOA grids showing the character's *current* baseline (before any candidate skill). The
   category selector + reference WS/Toughness + (defensive categories only) opponent's weapon now
   live in one "Eligible Skill Impact" panel at the bottom, and reference WS/Toughness there is the
   *same* state the grids above sweep from, not a separate `opponentWS`/`opponentT` pair — removing
   the duplication that made the old layout feel like it needed its own scenario. Extracted the
   grid-rendering pieces (`MeleeHitGrid`, `WoundGrid`, `RangedHitChart`, `Stat`, `pct`,
   `STATS_1_TO_10`) that both screens now share into `components/probGrids.tsx` rather than forking
   them a second time.

Verified: `tsc -b` clean, 56/56 tests pass (3 new: the House Rules toggle on/off, and
`totalAttackCount`), production build succeeds. Manually exercised in Chrome: House Rules checkbox
persists to `localStorage` and flips `armourThreshold` (heavy armour 5+ → 6+ at Strength 8 when
on); the "A" row's Attacks column showed 1→2 with an 8.37pt Full-OOA jump and every other column
unchanged, exactly as expected; selecting a character on Stat Gain Analyser and switching to Skill
Gain Analyser (and back) kept both the character *and* its equipped weapons without re-selecting
anything; Skill Gain Analyser's category switch (including a Defensive one) produced no console
errors and a populated results table with zero saved "opponent" character involved.

## Bug/feedback pass (2026-09-03, third round)

Two more from Tom, found while looking at the above:

1. **"Load from Warband Template" looked like it silently did nothing.** Investigated by loading
   several real units directly (Mercenaries Reikland's Captain, then Warriors) — the underlying
   code was actually correct (`setCharacter` fully replaces state, every field is a controlled
   input, `findUnitTemplate` resolves the right unit) and stats/role updated fine every time. The
   real problem: loading required an easy-to-miss separate "Load into form below" button *after*
   picking Warband and Unit — from Tom's description ("regardless of which Unit you pick"), the
   likely actual sequence was picking different units in the dropdown and watching the form below,
   never noticing the extra click was needed, since nothing calls that out. Fixed by loading
   immediately when a Unit is picked (`CharacterBuilder.tsx`'s `onSelectUnit`), removing the
   separate button — with a `window.confirm` guard if the current draft looks non-trivial (a name
   typed, or weapons/skills already picked) so an accidental re-pick can't silently discard work.
2. **Skill Gain Analyser's "Defensive Melee" only ever showed Step Aside — Resilient (and others)
   were invisible.** Root cause: `matchesCategory` required an exact `appliesTo === "melee"` for
   `defMelee` and `appliesTo === "ranged"` for `defRanged`; a defensive skill with no melee/ranged
   restriction (`appliesTo: "both"` or unset — Resilient, Thick Skull, True Grit) only ever matched
   the separate "Defensive (All)" category, so it never showed up under the two categories people
   actually compare skills in. Per Tom's steer, removed "Defensive (All)" entirely and changed
   `defMelee`/`defRanged` to also accept `"both"`/unset — an appliesTo-agnostic defensive skill now
   shows under *both* categories instead of a third bucket nobody was checking
   (`engine/skillSensitivity.ts`, `SkillGainAnalyser.tsx`'s `CATEGORIES` array). Left the
   equivalent offMelee/offRanged asymmetry alone — every currently-modeled offensive skill already
   has an explicit `appliesTo`, so no skill is actually affected by it today; changing it would be
   speculative, not a fix for an observed problem.

Verified: `tsc -b` clean, 56/56 tests pass, production build succeeds. Manually exercised in
Chrome: selecting Dwarf Noble → Engineer → Troll Slayer templates in sequence updated every stat
and the Role field correctly each time with a single dropdown pick (no extra click); typing a name
first and then re-picking a unit correctly triggered (and respected) the confirm-to-overwrite
guard; Skill Gain Analyser's Defensive Melee category now lists Resilient alongside Step Aside, and
"Defensive (All)" no longer appears as an option.

## Beta-readiness fix pass (2026-09-03, fourth round)

A full audit against `rules/*.md` (see `REVIEW-BETA-READINESS-2026-09-03.md` for the findings,
repro numbers and rules citations) followed by fixes for everything in it. Where an entry below
contradicts something recorded earlier in this file, the entry below is current — several earlier
"confirmed" decisions turned out to disagree with the rules text now in the repo and were
re-confirmed with Tom:

- **Buckler + sword re-rolls a failed Parry** (core rule 01:846) — supersedes the "Dwarf-Axe-only"
  decision above. Two plain swords still don't. Also Dwarf Axe + any Parry weapon, Fighting Claws,
  Iron Fist + sword/Iron Fist, Spiked Gauntlet (counts as a buckler). `DefenderProfile.parryReroll`
  replaces `hasDwarfAxeParry`, derived by `domain/opponentScenario.ts`'s `parryRerollFromItems`.
- **Armour and Ward saves that would need 7+ are no save** (rulebook reading, 01:734-752) —
  supersedes "natural 6 always succeeds" for saves. To-hit and to-wound keep the natural-1-fails /
  natural-6-succeeds convention.
- **Strength-vs-armour stays OFF by default** (Tom's group ruling). The House Rules copy now says
  plainly that this is a deviation from the rulebook.
- **Concussion is on Club, Mace, "Club, Mace or Hammer", Hammer, Sigmarite Warhammer, Dark Elf
  Blade, Ogre Club, Tenderiser and Bec de Corbin**, and NOT on Horseman's Hammer — supersedes the
  "hammer-only" judgment call in the schema build-out section (the rule text is identical on all of
  them). Hard Head still cancels it.
- **Wight Blade** (verified against the original Border Town Burning PDF on broheim.net): a natural
  6 to hit automatically wounds, roll to wound only to check for a critical. The previous "crit on
  5+" had no source and is gone. Same mechanic as Black Lotus poison (Poison Daggers, Weeping
  Blades, Hobgoblin daggers, Blowpipe) — all now modelled via `autoWoundOnNaturalSixToHit`.

Engine changes (all with hand-derived tests in `engine/__tests__/`):

- Critical hits that "cause 2 wounds" produce two Injury rolls, highest applies (01:770) — the
  standard chart's three results, Master Shot, Bladestorm (separate saves, binomial) and Sliced!.
  Standard-chart crit OOA vs an unarmoured target went from 44% to 67%.
- Helmets work: 4+ to turn Stunned into Knocked Down; Thick Skull 3+, 2+ with a helmet (replacing
  the helmet's own save). "Clubbed" still ignores both.
- Weapon armour-save modifiers wired for the whole catalogue (`saveModifier`, `ignoresArmourSave`):
  Cutting Edge, daggers/fists (+1 to the save, 6+ if none), pistols/handguns -2, Elf Bow, Warplock,
  Starsword/Sunstaff/Claw no-save, etc.
- Melee and missile weapons are never resolved together: `resolveCharacterTurn` takes a phase and
  ignores the other phase's weapons; both Analysers ask which phase is being simulated.
- Resilient is close-combat only and never touches armour saves or the Parry Strength check.
- Hunter is no longer +1 shot (it removes the reload turn; un-modelled). Quick Shot and Pistolier
  weapon lists completed. Nimble lets Move-or-Fire weapons shoot after moving (the -1 still
  applies); Move-or-Fire weapons otherwise get 0 shots after moving. Repeater weapons -1 to hit.
- Heavy weapons (Flail, Morning Star, Censer) and the Lance only get their Strength bonus on the
  charge / first turn of a combat (new "First turn of this combat" toggle).
- Expert Swordsman uses an explicit `isSword` flag (swords, Weeping Blades, Dark Elf Blade).
- Thrust knocks down even when saved; Blowpipe can't crit; whips can't be parried; Fist is capped
  at one attack; paired weapons carry their own +1; Whipcrack +1 on the charge; thrown weapons use
  the thrower's Strength; Pit Fighter modelled (skill and the warband's racial version) behind an
  "inside buildings" toggle.

Analysis/UI changes:

- Stat Gain Analyser measures every stat attacking AND defending, ranked by the two combined;
  cells a stat can't affect read "n/a" instead of 0.00.
- Skill Gain Analyser: Attacking / Defending for the chosen phase; defensive results carry the full
  Knocked Down / Stunned / OOA split and a weighted-severity delta (weights on the House Rules tab,
  default KD 0.25 / Stunned 0.6 / OOA 1) in addition to the existing OOA columns; candidates are
  filtered to the character's own skill lists (new `Character.skillTableIds`, pre-filled by the
  template loader, editable in Character Builder; untick to see all).
- Analyser state (character, phase, weapons, opponent, situation) is shared and survives tab
  switches. Weapon dropdowns are grouped and alphabetised. Loadout warnings for illegal
  combinations. Template loader offers the warrior's equipment options as one-click buttons.
  Delete / new / load confirm before discarding work. Import validates every character and warns
  about unknown ids; saving under a new warband name moves the character instead of duplicating it;
  an error boundary replaces the blank-page failure mode. Mobile layout fixed.

## Analyser table redesign (2026-09-03, fifth round)

Tom's read of the first fix pass: the Hit%/Wound% grids were sweeping attacker values we already
know, the highlighted column was unexplained, the impact tables measured a single attack (so +1 A
only appeared in the last column), and "Δ severity" was opaque. Rebuilt both Analysers:

- Hit and Wound are one row each — the character's own WS / attack Strength against every
  opponent value. The Out of Action grid still sweeps opponent WS × Toughness; clicking a cell
  makes it the reference opponent for the impact tables (default WS3 / T3). No WS/T inputs.
- Opponent armour / Parry / Ward / skills / hit-back weapon live in a collapsed line under
  Situation (defaults: unarmoured, sword at S3) — still there because armour changes the answer.
- Impact tables use one cumulative per-phase chain (`engine/chain.ts`): at least one hit → at
  least one wound through the saves → knocked down or worse → stunned or worse → out of action,
  all counted across every attack of the phase. Baseline "Now" row on top, one row per stat or
  skill. A dropdown picks which step to rank by (and which change column is shown); the ranked
  column is outlined. The weighted-severity score and its House Rules weights are gone — the
  "stunned or worse" / "knocked down or worse" columns say the same thing in plain percentages.
- Stat Gain shows an Attacking table and a Defending table (opponent hits back with the chosen
  weapon; lower is better, the change column is an improvement).
- Skill names are hoverable (table and chart axis): description, then the out-of-action numbers.
  The chart tooltip shows the same. Rows whose change is exactly zero say why ("condition is off"
  or "no change vs this opponent" — e.g. +1 WS that doesn't cross a to-hit boundary).
- The Situation toggles are repeated next to the impact tables so conditional skills can be
  switched on without scrolling back up.
- **Multi-Wound targets are modelled** (Tom, same round: "+1 W obviously has to matter"). The
  phase DP (`engine/turnAggregate.ts`) now carries wounds-taken as a state dimension: Injury is
  rolled for the wound that takes the target to zero and every wound after it (01:768-770), so a
  W2 model needs two wounds through in the phase (or one 2-wound critical) before anything is
  rolled. `resolveAttack.ts` now emits "wound events" (0/1/2 wounds through + the Injury modifiers
  they'd roll with) instead of a severity split, and the aggregation decides whether a roll happens.
  `DefenderProfile.W` / `OpponentScenario.W` added; the Stat Gain table treats W as a defensive
  stat; the "treated as a single Wound" warnings are gone. Hand-derived test: S4 sword vs T3 W2
  unarmoured, one attack = 1/27 OOA (only a 2-wound crit can do it).
- Sixth round (Tom): opponent settings (incl. WS/T, hit-back weapon, new **Attacks** and Wounds)
  now live in a collapsed line under "Situation and opponent" next to the impact tables; the top of
  the page keeps only the character, weapons and situation toggles. Hit/Wound rows read "Chance
  for one attack to hit" / "Chance for all N attacks to hit" (and the same for wounding). Highlights
  use an inset box-shadow (table borders collapsed unevenly). The out-of-action grid labels its
  axes explicitly ("Opponent Weapon Skill ↓" / "Opponent Toughness →").
- Seventh round (Tom): critical-hit columns on both chains — "Critical hit" (chance one is scored
  this phase, to-hit and to-wound rolls included, first 6 only) and "Out of action if it crits"
  (P(OOA | a crit landed), read straight off the DP's critConsumed dimension). +1 Strength is
  only marked relevant for a missile loadout if a weapon strikes at the thrower's own Strength.

## The Restless Dead (Variant) (2026-09-03)

Tom supplied a PDF of Chris de la Rosa's Liche-led "The Restless Dead" — this is the version whose
Grave Guards' Wight Blades **crit on a 5+**, which is what Tom remembered earlier; the mordheimer.net
list has the auto-wound-on-a-6 version instead. Both are now in: the catalogue "Wight Blade" weapon
keeps the mordheimer.net rule, and the variant's rule is the `wight_blades_5plus` trait on its Grave
Guards (any non-magical hand weapon, not Gromril/Ithilmar). Added as `data/warbandTemplates/
variants.ts` under a new "Variants and additions" group, transcribed to
`rules/warbands/restless-dead-variant.md`. New modelled traits it needed, all wired into the engine
with tests: **No Pain** (Stunned → Knocked Down), **Undead Construct** (ignore any Injury result on
4+, wound still lost, not vs magic), **Large Target** (+1 to hit when shot), **Immune to Poison**
(poison auto-wound off; a `poisoned` flag marks the poison weapons). `UnitTemplate.traitIds` added so
a warband's units can carry different traits (the Necromancer has none).
- Eighth round (Tom): the out-of-action grid has an Attacking / Defending switch (shared by both
  analysers). Defending: "Chance to be taken out of action this phase", rows = opponent Weapon
  Skill (Ballistic Skill in the shooting phase), columns = opponent Strength, cells = the chance the
  character goes down to an opponent with those stats using the hit-back weapon and Attacks from the
  opponent settings; clicking a cell sets that opponent. Hit/wound "all attacks" rows always read
  "Chance for all attacks to hit (N attacks)".
- Bug (Tom): a weapon added to a saved character in the Character Builder didn't show up in an
  Analyser that already had that character selected — the Analyser held a copy of the weapon list
  taken at selection time, so the attack count stayed at 1. Now the Analyser follows the saved
  character's weapons unless the loadout is changed in the Analyser itself (an explicit override
  with a "Use the saved loadout" link to drop it).

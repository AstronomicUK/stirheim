# Core magic checkpoint — 12 September 2026

## Codex

- Local commit `bb06837`: #186 casting reroll history tracks each casting die. A pair cannot be rerolled after either die has been rerolled. One-die sources cannot reroll an already rerolled die. Ineligible sources are not consumed and remain available for a later eligible cast. Spending a source requires the choose-reroll step. CastTab disables an already rerolled die in the one-die selector. Includes shared target metadata types and effectiveDifficulty helper consumed by Claude's UI.
- Validation: 26 resolver tests plus nine CastTab tests pass (35 total); TypeScript build passed before the final one-line disabled-state UI change. Broader integration and browser verification remain necessary before declaring release readiness.
- #28/#29: existing code already supplies Warrior Priest and other previously missing lore overrides. Five core native unit types pass a cross-layer empty-spell check through loreForHero (editor) and startingMagicOptions (creation): Warrior Priest, Sigmarite Matriarch, Necromancer, Eshin Sorcerer, Magister. New nativeCaster.test.ts plus magic data suite: 14 tests pass. Do not claim a newly fixed lookup bug; this is reconciliation/regression evidence. Actual empty-spell editor browser check remains pending.
- Claude's local UI handoffs: #206; core #32; #76/#85; #209; routine Priority 5 fixes. See bus messages and tracker working-tree notes. Unrelated tracker/audit edits remain preserved.
- Dice: Tom approved Option A popup setup, ivory/brass finish A and the consistent rounded 3D tumble v3. Full design/animation handoff in docs/design-drafts/dice-2026-09-12/HANDOFF.md. Attacks strictly sequential through injury/status changes. Sent approval to Claude; as of this checkpoint no later acknowledgment confirms implementation started.

No push/deployment performed. Production remains the previously verified release. Do not close mixed core/supplement umbrella entries merely on this checkpoint.

## Core Leadership work started — #161

Holy (Unholy) Relic source: reference/rules/02-weapons-armour-equipment.md:1719–1721. First-test automatic pass only; multiples do not grant extra uses. Added typed per-battle Leadership history and Rout action with explicit confirmation of no earlier table test. Earlier recorded Rout/Stupidity tests block eligibility. Logs automatic pass without claiming rolled dice, does not consume inventory, and repeat action is idempotent. Four focused relic cases plus Rout/sheet/recovery tests: 48 pass. Older live-state JSON receives an empty history default. This is a partial checkpoint: Stupidity/Fear/other Leadership consumers and Banner still need integration, correction flows and browser verification before #161 closes. Typecheck currently blocked by concurrent Dice.tsx TS2367, reported directly to Claude. No deployment.

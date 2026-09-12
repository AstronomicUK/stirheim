# Core magic checkpoint — 12 September 2026

## Codex

- Local commit `bb06837`: #186 casting reroll history tracks each casting die. A pair cannot be rerolled after either die has been rerolled. One-die sources cannot reroll an already rerolled die. Ineligible sources are not consumed and remain available for a later eligible cast. Spending a source requires the choose-reroll step. CastTab disables an already rerolled die in the one-die selector. Includes shared target metadata types and effectiveDifficulty helper consumed by Claude's UI.
- Validation: 26 resolver tests plus nine CastTab tests pass (35 total); TypeScript build passed before the final one-line disabled-state UI change. Broader integration and browser verification remain necessary before declaring release readiness.
- #28/#29: existing code already supplies Warrior Priest and other previously missing lore overrides. Five core native unit types pass a cross-layer empty-spell check through loreForHero (editor) and startingMagicOptions (creation): Warrior Priest, Sigmarite Matriarch, Necromancer, Eshin Sorcerer, Magister. New nativeCaster.test.ts plus magic data suite: 14 tests pass. Do not claim a newly fixed lookup bug; this is reconciliation/regression evidence. Actual empty-spell editor browser check remains pending.
- Claude's local UI handoffs: #206; core #32; #76/#85; #209; routine Priority 5 fixes. See bus messages and tracker working-tree notes. Unrelated tracker/audit edits remain preserved.
- Dice: Tom approved Option A popup setup, ivory/brass finish A and the consistent rounded 3D tumble v3. Full design/animation handoff in docs/design-drafts/dice-2026-09-12/HANDOFF.md. Attacks strictly sequential through injury/status changes. Sent approval to Claude; as of this checkpoint no later acknowledgment confirms implementation started.

No push/deployment performed. Production remains the previously verified release. Do not close mixed core/supplement umbrella entries merely on this checkpoint.

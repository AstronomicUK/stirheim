# Proposed core-first projects — 12 September 2026

Tom's instruction: finish the current Trade Wagon capture work, then agree the priority order before starting another project. Core Mordheim rulebook defects take precedence over supplement completeness. This is a proposal, not authorisation to start a new project.

## Release and scope boundary

The agreed #114/#122/#163/#112 release is already live. Subsequent equipment, combat, skills and Trade Wagon changes are local and must be batched. Do not repeat the earlier deployment. The main tracker status lines are often older than their dated follow-ups; they are not reliable remaining-work counts on their own.

Trade Wagon keep/ransom, report filing and withdrawal, cargo protection, mobile controls and the rare-search restriction have local verification. Contents-only theft awaits Tom's answer about the empty wagon. The question has already been sent; do not repeat it. #146 (wagon destruction/storage absence) is a separate supplement project and is not part of closing abandonment under #68.

## Recommended order

| Order | Project | Tracker scope | Why / completion boundary |
|---|---|---|---|
| 1 | Core magic and prayer flow | #29, #32, #76, #85, #209; core portions of #28 and #186 | Correct lore choices, appropriate friendly/enemy/no-target selection, clear difficulty and reliable reroll limits. Start with Lesser Magic, Necromancy, Chaos Rituals, Skaven magic and Prayers of Sigmar. Exercise the full cast flow and reload, preserving approved overrides. Do not make optional-lore completeness a condition of closing the core project. |
| 2 | Core battle and psychology rules | Core portions of #59, #70, #73, #156; #96 and Holy Relic/Banner portions of #161 | Close remaining core attack sequencing, weapon reload, psychology and Leadership gaps. Check the current code first: several old findings are already fixed locally. Movement and proximity need explicit table confirmations, not invented automation. Distinguish one model from grouped henchmen. |
| 3 | Core equipment use and post-battle consequences | Core portions of #139, #140 and #160 | Finish outstanding core poisons/drugs, Blessed Water, Healing Herbs and consumable lifetimes where applicable. Keep supplement devices and whole optional systems out of the acceptance criteria. Verify original rulebook provenance per item before including it. |
| 4 | Core rules verification and narrow rulings | #167, #193, #195; core portions of #200 | Verify wound/advancement charts against original images and resolve actual injury/save ambiguities. These are questions to settle, not automatically confirmed software bugs. Work that can be resolved from source images can be done without asking Tom. |
| 5 | Shared usability cleanup | #24, #30, #41, #46, #53, #92, #202, #203, #206, #210, subject to re-verification | Fix wrong-warband selection before cosmetic changes if still reproducible. Then clear defaults, readable mobile layouts, builder feedback and understandable hiring labels. Some entries may be stale; reproduce before promising a fix. |

A reproducible severe core data-loss or wrong-warband bug jumps ahead of this order. Small confirmed core correctness fixes should not wait behind a large redesign. Project 4 source checks can inform Projects 1–3 without starting another supplement implementation.

## Evidence checked for this proposal

- Current `CastTab.tsx` still constructs its target list from the friendly roster and describes enemy targeting as off-app. This supports a real remaining #32/#76 layout and targeting project.
- Current `casting.ts` `spendReroll` checks whether the named source was used; its dice history needs re-verification against #186 before changing anything. The reported two-item combination is supplementary, but the no-reroll-of-a-reroll principle is core. Do not label the entire item catalogue core.
- Current injury processing still records Bitter Enmity's target as prose in `flags.hates`; #96's structured target integration remains a reasonable core candidate.
- #176's dead-henchman equipment loss already has a dated completed implementation and subsequent regression coverage. It must not be advertised as an untouched new project.
- #180's Sigmar prayer protection filtering already has an implementation follow-up and appears in current casting code. Re-test as part of core magic; do not rebuild it as missing.
- #70 already includes failed Fear combat math and persisted Stupidity tests for individually tracked fighters. Its remaining scope is narrower than the main tracker heading.
- #59 already has local Strongman, Lightning Reflexes, Jump Up, equipment-training and eligibility work. Prioritise remaining core gaps, not repeated fixes.
- #67 is fixed locally awaiting deployment. It belongs in release verification, not a new project.

## Defer below core/shared work

Border Town Burning and other supplement-specific promotions, repair/reanimation systems, warband-only economics, named weapons, additional hired-sword/persona edge cases, #146's full wagon storage consequences, and owner-dependent source conflicts. Full Khemri remains a very low-priority potential upgrade (#227). The temporary multiplayer Pit Fighter battle remains a nice-to-have (#228). Optional campaign grade limits (#99) and other withdrawn/non-bug items must not become compulsory rules restrictions.

No fresh live audit was performed for this proposal. Candidate scope needs a short current-code/reproduction pass at the start of each approved project; the list is deliberately not a claimed count of proven outstanding defects.

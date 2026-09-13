# Casualties and recovery batch — local only

Authorised: #176, #124, #159, Restless Dead clauses of #132, #158. No push/deployment. Existing local commits 78bb683 and 6900be2 remain undeployed. Claude remains stopped; no delegation.

## Scope and progress

- #176: stale tracker status discovered. The existing `groupEquipmentLosses` report flow already handles ordinary, final-model, mixed-equipment and captured casualties, with persistent item patches. Verify and reconcile; do not duplicate equipment loss in the base injury resolver.
- #124: extend injury protection beyond Extra Tough/Medicine Chest/Eternal. Source-specific rerolls, Snotling double injuries, guardian exemptions, Conqueror Survivor, Will to Survive, conditional Rotten Body, medical aid and fire exceptions need separate checks. Elixir of Life/Kami/Onogal now being connected to the once-only reroll flow.
- #159: Cold One departure on handler death, no battle while handler absent; Wolves/Bear availability; Claimed Gnoblar per-item casualty rolls.
- #132: initial Goliath exemption versus later D3 Wound cost (minimum 1); rare-search exclusivity; Feed Upon Magic D3 shards and failure consumption; Liche Wound-to-skill/spell alternative. Do not close all #132.
- #158: actual casualty equipment recovered once, multiple Looters allow successive attempts, own/enemy participating warbands, no duplication and safe report withdrawal dependencies.

## Source anchors

Local scrape: grade-1b-part1.md:2547 Looting the Dead; :1447 Cold One Beastmaster; grade-1b-part2.md:826 Wolves; :1843 Rotten Body; core-and-grade-1a.md:2476–2479 Bear presence/protection; grade-1c.md:1551 Survivor; :1830 Claimed Gnoblars; :2236 Onogal; :3063 trained Squig; grade-2a-part1.md:356 Will to Survive, :678 Damnable Luck, :1133 Journal, :1176 Sawbones, :1526 Surgeon, :2462 Kami; grade-2a-part2.md:971 Snotling Heroes; Restless Dead variant.md:225–241 and :422–434.

Verification and final status must be completed before marking this batch ready.

## Implementation checkpoint — 13 September

Local implementation is complete for the agreed batch. Nothing pushed or deployed.

- **#176:** verified the existing report-level equipment-loss implementation rather than adding a second deduction. Normal groups, final casualties, mixed equipment, supplies already spent and captured models remain covered. The tracker’s former open status was stale.
- **#124:** named injury rerolls now cover Elixir of Life, Kami, Onogal and Silver Death Mask; Snotling Heroes resolve both injuries; trained Squigs gain the printed injury/XP/advancement and guardian rules; Bear Tamers gain their guardian protection; Conqueror Survivor persists its once-only use; Will to Survive records unmodified Leadership and D3 absence; Damnable Luck is shared between Hero/henchman casualties after injury resolution; Surgeon, Sawbones and Journal share provider allowances, with single-die support for henchmen where permitted; Rotten Body requires the explicit own-censer cause; Black Orc Troll fire and Scarecrow rerolls are exposed. Injury replacements retain history and clear dependent rolls. Journal/Mask resolution recognises their item identifiers and custom equipment names; their wider specialist acquisition/catalogue workflows remain under #130.
- **#159:** absent handlers remove dependent creatures from the battle choices; Beastmaster/Herder death removes the specified beasts and their carried equipment, cancelling their advances; Claimed Gnoblar rolls produce actual inventory quantity patches.
- **#132, Restless Dead scope only:** migration 134 supplies atomic, retry-safe Goliath construction and Feed Upon Magic, with costs, permanent Wounds, insufficient-shard consumption, prior OOA/search checks, warband-wide construction search exclusion and guarded undo. The starting exemption uses battle/history state, not merely absence of a current Goliath. Liche Wound advances offer a skill or the ordinary wizard spell route. The other #132 actions remain open.
- **#158:** migration 135 creates shared, report-backed casualty equipment pools. One attempt per surviving Looter per casualty; one successful recovery globally; own/enemy warbands; mixed kit must be allocated exactly once by its owner/GM before looting. Survivor/captive equipment is excluded. Transfers go to the stash and both reports record the outcome. Concurrent success, repeat requests, outsider access, late recruitment, changed-kit reversal and Awakening dependencies are checked. Reports cannot be withdrawn while unreversed looting depends on them. New offers are created when a report is applied; historical reports are not silently backfilled.

## Verification

- Full application regression: 2,493 passing tests (218 files).
- Full local API regression: 344 passing tests (62 files), including own-warband looting/Awakening.
- All 129 migration files replay successfully in filename order in an isolated empty database. Shared local application database retained.
- Production build and typecheck pass; lint reports only the existing audit/design-file warnings.
- At 390px mobile width: recorded a failed Looter attempt, selected the second model, recovered exactly one sword into the stash, and inspected the layout. Fixed stale dice/request state exposed by switching Looters. Recruited a starting Goliath: gold 500 → 275, no Liche Wound loss, duplicate recruitment disabled.
- API tests cover later construction, W1 floor, repeated Feed Upon Magic, insufficient shards, OOA restrictions, rare-search exclusivity and safe undo. Rules tests cover Liche Wound/skill/spell choices, trained Squig single-model recruitment/XP/LGT, mixed injury histories and provider sharing.

## Release boundary

Keep this work with the existing undeployed income and roster batches. Migrations 131–135 will be needed at the eventual combined release. The disposable browser-test warbands and campaign were removed and the temporary viewport override reset. No deployment authorised for this turn. Broader #132 and #130 specialist recruitment/catalogue work are not closed by this batch.

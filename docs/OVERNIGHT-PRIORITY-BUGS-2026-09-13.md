# Overnight priority bugs — 13 September 2026

Tom authorised working through the following order, grouping related fixes when useful. If all twenty are resolved before his next message, assess and begin the next twenty outstanding items. Keep changes local for a combined release; the prior deployment permission was for the completed release.

Order: #15, #181, #191, #69, #152, #59, #70, #139, #161, #160, #76, #29, #114, #146, #142, #141, #136, #138, #144, #143.

For each item, reconcile old findings with the current code and source before editing. Core behavior already delivered must remain intact. Preserve player overrides, document ruling-dependent clauses and continue independent work. No Claude delegation while usage remains reserved. Full Khemri stays deferred.

| Item | Progress |
|---|---|
| #15 | Existing scope verified locally: Well/Pit selected hero, books, held gems, Freetrader symbol, leader sacrifice XP. Old permanent-jewel/Haggle wording was incorrect. Book database regressions pass. |
| #181 | Fixed one-D6 injury roll and bands; preserves app/manual provenance. |
| #191 | Fixed Penthesilea’s 70-point rating, without adding XP. |
| #69/#152 | Sling/Slingshot double-shot conditions fixed. Censer/Disease Dagger ruling-dependent wounds remain deferred; Powder Keg still outstanding. Many historical weapon bullets already implemented. |
| #59/#70 | Powerful Build future Strength access, Big Bully/Renowned Virtue immediate single bonus pick, and Brave removal of Animosity implemented locally. Larger supplementary skill/psychology scope still open. |
| #139–#143 | Remaining items pending in approved order. |

## Checkpoint 1

Regression tests cover all six Magical Aptitude injury faces; Penthesilea actual catalogue rating at 0/25 XP; direct Sling and Slingshot stationary/half-range conditions; new and legacy Powerful Build; extra picks cannot be omitted, unrelated, known or banned, do not charge a second advance, and do not grant permanent table access. Forest Goblin Brave removal consumes one skill advance and cannot repeat; the flag survives the typed roster and removes the Animosity text from roster/battle cards.

Mobile local QA (390×844): Big Bully → extra Strength choice → Strongman → refresh/reopen → review → confirm. Database verified both skills, unchanged skill tables, one level-up, resolved pending advance, readable resolution. Disposable fixture deleted. Exploration book integration 3/3 passes. Full ordinary suite, build/typecheck and lint pass (existing audit warnings only). No migration, push or deployment.

Censer/Disease Dagger retain previously recorded save/timing rulings. General Animosity turn automation is not claimed by the Brave advancement fix. Further Magical Aptitude second-attempt enforcement and state application remain part of broad skill/battle work, not the narrow #181 dice correction.

## Checkpoint 2 — Swivel ammunition (#69/#139)

Three purchasable supplies now exist: Ball Shot 5 gc, Chain Shot 2 gc, Grape Shot 2 gc. Ammunition itself grants no weapon. The first firing attempt declares one exact inventory row; the supply remains available all battle. No charge per shot, no consumption merely for selecting a profile, no unused-type loss. Report uses existing exact-row consumable settlement; changed/missing stock is blocked until corrected. Stock may be the gunner’s own or the warband stash, never another warband’s or an unrelated warrior’s kit. No-stock exceptions require a saved explanation and deduct no fabricated item/gold. Explained withdrawal preserves firing/damage history.

Mobile local QA (390×844): Chain unavailable without stock; Ball available from stash; begin shot records one supply and normal reload record; hit/wound/injury logged to both sheets; refresh retains supply. Database inspected exact row. Disposable campaign/match/warbands removed. Tests cover multiple shots, different types, unused stock, reload, exact-row settlement, foreign/empty stock, exception and correction. Full suite 2,514 ordinary tests passes; build/typecheck passes. No migration or deployment.

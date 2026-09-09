# Rules audit plan

Agreed with Tom 2026-09-07. Each audit compares `reference/rules` against the build and produces a
gaps document in `docs/`. Work in this order, check in with Tom after each, and only after he has
reviewed the findings hand them to the QA session for the feedback tracker.

| # | Area | Status | Document |
|---|------|--------|----------|
| 1 | Warbands (special rules, composition, data errors) | done 2026-09-05 | WARBAND-RULES-GAPS.md |
| 2 | Weapons, armour and equipment | done 2026-09-05 | WEAPONS-ARMOUR-RULES-GAPS.md |
| 3 | Skills (core tables, warband tables, calculator effects, restrictions, campaign skills) | done — reviewed, handed to a1 2026-09-07 | SKILLS-RULES-GAPS.md |
| 4 | Hired swords and Dramatis Personae (hire, upkeep, rating, injuries, who may hire, advances) | done — reviewed, handed to a1 2026-09-07 | HIRED-SWORDS-RULES-GAPS.md |
| 5 | Magic and prayers (29 lores, starting spells, casting restrictions, spell items) | done — reviewed, handed to a1 2026-09-07 | MAGIC-RULES-GAPS.md |
| 6 | Experience and advances (thresholds, tables, racial maximums, promotion, underdog) | done — reviewed, sent to Stirheim Developer 2026-09-07 | EXPERIENCE-RULES-GAPS.md |
| 7 | Serious injuries (D66 chart, henchman and hired sword rolls, captured flow) | done — reviewed, sent to Stirheim Developer 2026-09-07 | INJURIES-RULES-GAPS.md |
| 8 | Exploration chart (every location, sub-tables, tests, shard counts) | done — reviewed, sent to Stirheim Developer 2026-09-07 | EXPLORATION-RULES-GAPS.md |
| 9 | Income and trading (wyrdstone chart, selling, rare searches, sequence order, veterans) | done — reviewed, sent to Stirheim Developer 2026-09-07 | INCOME-TRADING-RULES-GAPS.md |
| 10 | Warband rating and rout | done — reviewed, sent to Stirheim Developer 2026-09-07 | RATING-ROUT-RULES-GAPS.md |
| 11 | Core combat engine (to-hit, to-wound, saves, crits, injury, parry, modifiers) | done — sent to Stirheim Developer 2026-09-07 (pre-authorised, Tom reads on waking) | COMBAT-ENGINE-RULES-GAPS.md |
| 12 | Psychology and traits (fear, frenzy, hatred, stupidity, animosity, all alone) | done — sent to Stirheim Developer 2026-09-07 (pre-authorised) | PSYCHOLOGY-RULES-GAPS.md |
| 13 | Optional rules (mounted, misfires, encampments, weather, dense terrain) | done — sent to Stirheim Developer 2026-09-07 (pre-authorised) | OPTIONAL-RULES-GAPS.md |
| 14 | Scenarios (103 pages: deployment, victory, experience, special rules) | done — sent to Stirheim Developer 2026-09-07 (pre-authorised) | SCENARIOS-RULES-GAPS.md |
| 15 | Campaign settings not yet scraped (decide whether to scrape first) | done — sent to Stirheim Developer 2026-09-07 (pre-authorised; no findings) | SETTINGS-COVERAGE-GAPS.md |
| 16 | House rules (planning notes vs the settings screen) | done — sent to Stirheim Developer 2026-09-07 (pre-authorised) | HOUSE-RULES-GAPS.md |
| 17 | Scrape uncertainty markers (~55 flagged transcriptions) | done — sent to Stirheim Developer 2026-09-07 (pre-authorised) | SCRAPE-MARKERS-GAPS.md |
| 18 | Aliases and unresolved names (equipment and skill names with no catalogue entry) | done — sent to Stirheim Developer 2026-09-07 (pre-authorised) | ALIASES-GAPS.md |

**All 18 audits complete, 2026-09-07.** A single overview of the whole series, grouped by root cause, is in [RULES-AUDIT-SUMMARY.md](RULES-AUDIT-SUMMARY.md) — start there rather than with the individual documents.

> **Correction (2026-09-07):** audits 3, 5, 6, 12 and 13 originally said "49 warbands". The data holds **73** warband templates; 49 is the number that have a warband-specific skill table. The docs have been corrected and the Stirheim Developer told. Findings and per-unit counts were computed over all templates and are unaffected.

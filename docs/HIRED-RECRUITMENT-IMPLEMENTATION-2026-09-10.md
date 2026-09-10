# Hired-character recruitment follow-up — 10 September 2026

This is a partial implementation of the first outstanding area in Tom's larger tracker queue. The complete tracker is `FEEDBACK-TRACKER.md`; no other areas are represented as completed here.

## Equipment (#61, #74)

- Included material variants in equipment-name lookup, fixing Gromril Hammer resolution. Added printed-equivalent aliases including Scimitar, Mining Pick, Repeating Crossbow and Ninja Robe.
- Read additional equipment sentences, count pairs/braces, keep Rope & Hook together, and preserve separators inside parentheses. Reject weapon/armour prohibitions and the Headless Horseman's introductory narrative as equipment.
- Added visible starting-kit choices for Troll Slayer, Ogre Bodyguard, Gaoler, Norse Shaman, Witch Hunter and Chaos Centaur. The Ogre keeps light armour in all seven combinations. The same resolver generates the hire preview and persisted kit.
- Corrected explicit kit for Duellist, Knight of the White Wolf, Johann and Cursed Hillman. Shared the Snake Charmer and Marquand starting-kit definitions with the preview.
- Existing hired characters are not automatically re-equipped: equipment lost during play must not be restored by a parser update.

Sources: local `reference/rules/04-hired-swords.md` and `05-dramatis-personae.md`. Unique gear remains named custom equipment where its rules have no catalogue equivalent. Remaining special equipment, Luthor's role-dependent abilities, unresolved advancing racial profiles and companion workflows remain open.

## Legacy persona experience (#98)

Read-only production query grouped **all** `heroes` rows where `is_hired_sword` by rules ID/status and counted their minimum and maximum XP. Results: Beggar 1, Halfling Scout 2, Kislev Ranger 1, Warlock 1. All active, all XP 0. No Dramatis Personae exist on live rosters, so no stale persona experience needs repair. No production data was changed. Future persona experience accrual was already prevented by #60. Tracker #98 closed with this evidence.

## Warband restrictions (#119, partial)

Added Outlaws' named exclusions, Pit Fighters' Elf Ranger exclusion, Grave Robbers' Shady Reputation exclusions and Lustrian Reavers' named allowed list. Fixed the Cavalcade's Crow Master exception; the character already exists in the persona catalogue. An explicit warband permission takes precedence over generic entry-text matching. A restriction warning displays the actual reason, including warband-side restrictions, and retains the established player override.

Sources: local warbands `grade-1b-part2.md`, `grade-1c.md`, `grade-2a-part1.md`. Other warband lists and conditional departure/upkeep cases remain open under #119.

## Validation

Full unit suite, typechecked production build and lint run for this batch. Detailed final counts and deployment evidence are recorded below after shipping. Tests cover actual recruitment results, every configured equipment choice's catalogue IDs, parser regressions and warband restrictions. Local DB integration tests are skipped by the ordinary unit command; this batch changes no schema or database write protocol.

Validation result: **1,365 tests passed**, 78 local integration tests skipped; typechecked production build passed. Lint has only the three pre-existing unused-import warnings in the reconciliation probe. Build retains the existing CSS and bundle-size warnings.

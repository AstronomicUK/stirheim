# Rules lifecycle implementation — 10 September 2026

Authorised batch: #217; #218/#95; #60/#61/#183–185.

Implemented and verified locally:
- Casting logs snapshot the displayed shared round, including deferred updates and reloads.
- Resolved one-off injuries remain as repeatable history. Selected-hero/persona pit fights handle D66 chains, preserve miscellaneous equipment and atomically award XP and advancement boxes.
- Core captured-warrior outcomes update both rosters atomically, with permission, stale-snapshot and rollback checks. Includes Hashut work/sacrifice, Court conversion, Cavalcade Throne and Amazon Lizardman equipment bonus.
- Eligible hired swords use Henchman XP awards/thresholds and Hero advancement rolls. Personae and explicit no-XP entries are excluded. Personae receive Hero D66 injuries.
- Upkeep reminders, actual gold/resource payments, one-battle departures, rehire gaps and Old Coot/Marianna checks. Shared pair/retinue handling; three snakes and separate Ulli/Marquand records. Existing records have a reviewable repair action.
- Printed starting skills, unique/cavalry tables, numeric kit quantities, missing starting equipment, Luthor equipment roles and non-gold/dice hire fees.

Validation: 1,347 passing unit tests; 78 integration tests skipped in the ordinary suite. Four local database tests pass separately. Mobile UI verifies pit XP plus advancement, captive ransom and upkeep; desktop renders with no page errors. Build passes. Lint has only three existing warnings in an unrelated audit probe. Local QA used disposable records; the live CoC–Dwarves game was not changed.

Still open, not claimed complete:
- #95: Pirates/henchman/exploration captive recruitment, Engine of Chaos/Hashut’s Reward/capture acquisition, Ogre devouring and income, Pit Fighter arena sequence.
- #61: remaining uncertain racial maxima and kit choices/aliases, bespoke equipment effects and role-specific combat behaviour, older kit review.
- #184: optional mounts/earned bodyguards, snake hunting, explicit choice of retained Scout.

Existing player XP histories and resolved advances are preserved. Approved player overrides remain available. Two additive database functions support cross-roster and single-roster event saves; no table or existing player data is removed.

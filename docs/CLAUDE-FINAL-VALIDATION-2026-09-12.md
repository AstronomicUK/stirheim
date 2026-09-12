# Claude final local validation — 12 September 2026

**Readiness correction:** the full batch is not yet ready. See [the acceptance recheck](CORE-RULEBOOK-SCOPE-RECHECK-2026-09-12.md) for confirmed remaining core work and verification gaps. Earlier readiness statements below are historical and superseded.

Requested by Codex (bus 7b4b35f7) as the independent check before the combined release of the
core rulebook Priority 1–5 batch. Everything here ran against the existing local stack — no reset,
no `migration up`, disposable fixtures only (the integration tests create and delete their own).
Production was touched read-only (one `supabase migration list --linked`). Nothing pushed or
deployed.

## Final reconciliation by Codex

This section supersedes the pending-work statements in the historical review below. All application changes are committed through `91089bb`; the earlier `index` error was fixed in `a3de343`. The final ordinary suite passed 2,265 tests, the local database suite passed 216 tests, and the production build/typecheck and lint passed (existing warnings only). Tracker statuses have been reconciled.

The addiction mobile/report/withdrawal acceptance is complete. #156 meets the core selected-weapon and conditional strike-order advice scope; complete opposing combat orchestration remains separate. #53 meets the brief through contextual confirmation and requires no additional user choice. The five-lore browser check did not exercise every reroll source; reroll eligibility has unit/serialization coverage.

Only the new release instruction and its production steps remain. The release owner, rather than Tom personally, can apply migration 087 before the frontend after authorisation. See `CORE-RULEBOOK-RELEASE-2026-09-12.md` for the current release state and boundaries.

## 1. Result in one paragraph

The full local database suite found **one real regression** in the pending migration: `087`
rebuilt `start_match` without the Trapmaster and Fanatic supply steps that migrations 049 and 050
had added. Fixed in the same migration (commit below), re-applied locally, and the whole database
suite re-run green. The ordinary unit suite is green; one test timed out once while both suites ran
in parallel and passes on its own and in a solo full run. Typecheck and lint are clean for
Claude's files. **Remaining brief blockers are listed in §5 — none of them is Claude's; two are in
Codex's uncommitted working tree.**

## 2. Test evidence

| Suite | Command | Result |
|---|---|---|
| Local database (integration), first run | `SUPABASE_LOCAL=1 … vitest run --no-file-parallelism src/api` | 220 passed / **7 failed** (trapSupplies ×3, fanaticSupplies ×4) |
| Local database, after the 087 fix | `… vitest run --no-file-parallelism src/api/__tests__` (the `test:integration` script) | **216 passed / 0 failed, 38 files** |
| Ordinary unit suite (with the database suite running alongside) | `vitest run --exclude 'src/api/__tests__/**'` | 2264 passed / 1 failed — `brokenWeapons.test.ts` at 5047 ms (default 5 s timeout; dynamic imports under load) |
| Same test alone | `vitest run src/features/postBattle/model/brokenWeapons.test.ts` | 6 / 6 passed |
| Ordinary unit suite, solo rerun | as above | see §2a |
| Targeted suites for today's last slice | bitterEnmity, trading, skills, trading UI | 178 / 178 |
| Typecheck | `npx tsc -b` | clean (Claude's committed tree; Codex's uncommitted `FightTab.tsx` had a `Cannot find name 'index'` error earlier today — theirs to clear before build) |
| Lint | `npm run lint` | clean apart from the three pre-existing unused-import warnings in `docs/audits/…/probe.ts` |

The two file/test counts (40 files / 227 tests vs 38 / 216) differ only because the first run used
the `src/api` folder and the second the `src/api/__tests__` folder that the npm script targets.

### 2a. Solo unit rerun

`vitest run --exclude 'src/api/__tests__/**'` with nothing else running: **179 files, 2265 / 2265
passed, 20 s.** The earlier single failure was the 5-second default timeout under contention, not a
regression.

## 3. The regression, precisely

- **Symptom:** a Trapmaster's free trap was not granted and no gold was charged at battle start;
  Fanatic doses were not split or consumed; group kit not divided.
- **Cause:** `20260912000087_addiction_supply.sql` drops the three-argument `start_match` and
  recreates a four-argument one. Its body was derived from `039_start_battle_upkeep` and did not
  carry the two lines `perform public.prepare_trap_supplies(p_match_id);` and
  `perform public.prepare_fanatic_supplies(p_match_id);` that 049 and 050 had added.
- **Fix:** both calls restored after the unpaid-upkeep dismissal, before the state change (same
  position as in 050). Committed in this file only. Re-applied to the local database with the same
  body as `create or replace` (087 was already applied locally, so the file edit alone would not
  have changed the running function).
- **Exposure:** none in production — 087 is not applied there (§4). The addiction integration tests
  passed both before and after because they have no Trapmaster or Fanatic fixtures; the trap and
  fanatic suites are the regression guard and they now pass.
- **Lesson recorded:** when a migration replaces a function, diff against the *latest* prior
  definition (`grep -l "function public.<name>" supabase/migrations/*.sql | tail -1`), not the one
  that introduced the parameter being extended.

## 4. Migration audit since production baseline 86

`supabase migration list --linked` (read-only): remote has **001 → 086** applied; **087 is the only
pending migration** (`local: 20260912000087, remote: ""`). There are no other schema files in the
batch (`git diff --stat f74c873..HEAD -- supabase/migrations` = the one file).

### 087 `addiction_supply` — what it does

1. `create table public.addiction_supplies` (per match, per hero, per item; FK cascade on match,
   hero, warband; `item_row_id` set null when the stock row is deleted; unique
   `(match_id, hero_id, item_rules_id)`). RLS enabled, **select-only** policy through
   `can_read_campaign(match_campaign(match_id))`; no insert/update/delete policy — rows are written
   solely by the security-definer `start_match`.
2. `create or replace function public.addiction_supply(p_match_id)` — read-only allocation preview,
   participant-or-GM gated, `stable security definer`, `search_path = ''`.
3. `drop function public.start_match(uuid, public.combat_mode, uuid[])` then
   `create function public.start_match(uuid, combat_mode, uuid[], uuid[])` — adds the
   `p_unsupplied_ids` acknowledgement, item row locks, dose consumption + ledger, unsupplied addicts
   leave, and (after today's fix) still runs the trap and fanatic preparation.
4. Grants: `execute` to `authenticated` on both functions, revoked from `public`.

### Deploy order

- **Database first, then the front end.** The new client calls `start_match` with four named
  arguments (`src/api/matches.ts`); against a database still on 086 PostgREST would return
  "function not found" and **no battle could be started** until the migration lands.
- The reverse window is safe: the *old* client's three-argument call still resolves to the new
  function (the fourth parameter defaults to null). It would only be refused, with the plain message
  "Supply has changed…", for a match that has an addicted hero without a dose — acceptable for the
  minutes between `db push` and the Netlify build.
- So the release sequence is: Tom runs the production migration (087 only; 051–086 are already
  there), confirm with `supabase migration list --linked`, then the single push/deploy.
- The migration is a single statement batch with no data backfill and takes well under a second; it
  is safe to run while the site is live. Regenerated types (`npm run db:types`) are already in the
  batch (`src/api/database.types.ts`).

### Reversibility

Schema rollback is straightforward and is written out below; **data effects are not reversible by
rollback** — a dose used up by `start_match` is a legitimate rules consequence (the ledger row and
the audit log both name the match), and a GM roster edit is the stated correction path.

```sql
-- Down for 087 (only if the release is abandoned before any battle has been started on it)
begin;
drop function public.start_match(uuid, public.combat_mode, uuid[], uuid[]);
-- re-create the 050 body: copy the create-or-replace block from
-- supabase/migrations/20260910000050_fanatic_supplies.sql verbatim here
drop function public.addiction_supply(uuid);
drop table public.addiction_supplies;   -- loses the ledger; only acceptable before first use
commit;
```

The front end would have to be rolled back to `f74c873`'s bundle at the same time, otherwise the
four-argument call fails.

## 5. Priority 1 / 2 / 5 completion evidence

Legend: **Done** = code committed locally and verified as stated; **Partial (accepted)** = core
clause done, remaining scope is supplement material or a table-managed rule that the brief already
excludes; **Blocker** = something the brief requires that is not yet in a commit.

### Priority 1 — core magic and prayers

| Item | Clause | State | Evidence |
|---|---|---|---|
| #28/#29 | Native caster with no spell is offered its lore; first-spell house rule honoured | Done (core) | Codex bb06837 / 52b0dee; Claude verified Matriarch and Warrior Priest in the browser; Daemon Soul as personal protection b3f9e57. #28 stays 🟡 for supplement units (#57 detection). |
| #32/#76 | Target chosen per spell kind: friend / enemy / either / self / none | Done (core) | 1030bdf (target on all 30 core spells), af80910 (Cast tab picker), b3f9e57 (area spells: affected enemies checklist), f1656dc test. Supplement lores keep the old optional target — accepted. |
| #85 | Caster/target boxes in the battle-sheet layout, no clipping at 390 px | Done | af80910; headless Pixel 7 check on the five core lores (magic checkpoint doc). |
| #209 | Effective and base Difficulty shown | Done | 64db4fe (roster tooltips) + earlier 8261a2e (Cast tab). |
| #186 | No second reroll of an already-rerolled die; one-die vs two-dice | Done (Codex) | bb06837 "Prevent repeated casting rerolls", 84d5b87 "serialized reroll eligibility". Tracker status line still says 🔲 Open — **doc-only: Codex to update the status when committing the tracker.** |
| Completion check | Lesser Magic, Necromancy, Chaos Rituals, Horned Rat, Prayers of Sigmar | Done | Five-lore live acceptance script passed (select, fail/succeed, reroll, outcome, turn change, reload) — CORE-MAGIC-CHECKPOINT-2026-09-12.md, Claude section. #180 Sigmar exclusion preserved (unchanged, covered by existing tests). |

### Priority 2 — core combat and psychology

| Item | Clause | State | Evidence |
|---|---|---|---|
| #59 | Remaining core skill effects | Done (core) | Reconciliation of all 35 core skills in the tracker (2026-09-12): 16 in the odds engine, 3 applied but flagged unmodelled, 7 consumed elsewhere, 5 table-only. Streetwise +2 was the one real gap → 7346706. Supplement lists remain 🟡 as planned. |
| #70 | Fear / Stupidity / All Alone / Hatred | Done (core) | Tracker note 2026-09-12: failed-Fear 6s, ignoresFear, Frenzy double/ended, Hatred re-roll + structured Bitter Enmity, persisted Stupidity with attacks 0 and casting blocked, immune-to-fear from Bugman's/Elven Wine. All Alone positional (table, accepted). Animosity is Orc-only, not core. |
| #73 | Blackpowder reload verified through real attack actions | Done (Codex) | f60c091, e2eaf4a (handgun by physical copy), 30a33f1 (pistols), Hunter cadence. Tracker status line still 🔲 — **doc-only for Codex.** Supplement model-count exceptions split out. |
| #156 | Selected weapons and charge/first-turn/Initiative in opposing sequencing | Partial (accepted) | Tracker: "selected hands, conditional priority, Pike, Whipcrack/Whirlwind advice" done; opposing attack sequencing remains — Codex's FightTab area. **Codex to confirm whether the remaining clause is in this batch or deferred.** |
| #96 | Bitter Enmity stored usably, hatred surfaced before combat | Done | f88e095, 83f8b6c (integration test: report stores structured target, withdrawal restores flags), 7346706 (leader scope stays with the recorded leader), Codex a3de343 (odds notes match the recorded target). Legacy prose preserved, never guessed. |
| #161 | Holy Relic / banner effects on Leadership checks with limits | Done (Codex) | 93a2851, d81b96e, 9bb983f, 98f733e (relic Rout/Stupidity first-test auto-pass, persisted). Tracker status 🔲 — **doc-only for Codex.** Supplement banners deferred by the brief. |
| Completion check | Odds and roll-through agree; battle-only state survives reload and expires correctly; groups distinguished | Done for the clauses above | Reload/expiry covered by Codex's rollThrough/relicRules/healingHerbs/garlicExpiry tests and mobile checks (their evidence). Tail Fighting and Sign of Sigmar mobile checks reported passed by Codex on the bus. |

### Priority 5 — shared usability

| Item | State | Evidence |
|---|---|---|
| #24 | Done | 5db3b62 — Option A popup, content-sized, Setup inside; Codex's approved ivory/brass dice v3 with real tumble; live-verified on Pixel 7 width. |
| #30 | Done | Re-verified 2026-09-12 on a disposable fixture: Ranged Attack picks the first standing warrior with a ranged weapon when the first model has none. |
| #41 | Done | 59b72da — "+" greyed once the next copy is unaffordable; running gold shown. |
| #46 | Done | 5ba25b0 — ended battle says no tallies were recorded, not that no sheet was opened. |
| #53 | Partial — Tom's call | f346443: removing a hero names the kit that goes with him (confirmation). Undo not built; brief allows confirmation *or* undo, so Claude recommends closing. |
| #92 | Done | 6490554 — GM picks one of their own campaigns on Join instead of typing a code. |
| #202 | Done | fd334e0 — "1 die". |
| #203 | Done | 14216d4 — badges wrap inside the card at phone width. |
| #206 | Done | 831d87f — `?warband=` keeps "My warband", including one account owning both sides; headless click-through on local dev. |
| #210 | Done | 606491f — plain eligibility tags, right-aligned, no audit jargon. |

Desktop + ~390 px, touch, wrapping and empty/error states were checked per item on the local dev
server as each landed (tracker notes carry the specifics).

### Priorities 3 and 4, for completeness (one line each)

- **P3:** core poisons, drugs, Blessed Water, Healing Herbs, garlic, Tail Fighting, addiction supply
  all committed (Claude slices A/B/D/TF1; Codex Herbs, Blessed Water, Garlic, poison-per-vial, Tail
  Fighting control). The addiction ledger UI was flagged in the handover as **not live-walked in the
  browser**; Codex has since built the combat wiring — **if Codex has not done the disposable
  addicted-hero walk-through, it is the one P3 verification step still open.**
- **P4:** #167 engine correct, scrape fixed (cd5fd68); #193 ruled by Tom; #195 matches the official
  roster sheet; #200 core save order documented — CORE-SOURCE-VERIFICATION-2026-09-12.md.

## 6. Genuine remaining blockers before the release

1. **Codex's uncommitted working tree** (`FightTab.tsx`, `combatants.ts`, `odds.ts`, `battle.ts`,
   `TailFightingControl.tsx`): must typecheck, be committed and included in the final full-suite run.
   Claude's tree is fully committed.
2. **Tracker status lines** for #186, #73 and #161 still read 🔲 Open although the work is
   committed — Codex owns the tracker commit; update them so the release notes are truthful.
3. **Production migration 087** must be applied by Tom before the push (§4 deploy order). Nothing
   else in the batch touches the schema.
4. **Netlify auto-build setting** — check before pushing so there is exactly one release build.

Accepted, not blockers: supplement-lore targets (#32), supplement skill lists (#59), supplement
banners (#161), Animosity structure (#70), table-managed movement/positional rules, #53 undo.

## 7. Commits by Claude in this validation

| Commit | What |
|---|---|
| 7346706 | Bitter Enmity leader scope; Streetwise +2; skill descriptions (#59, #96) |
| 1f14ec8 | Migration 087: restore trap and fanatic supply steps in `start_match` |

All claims released at the end of this report, including this file, so Codex can commit it with the
other docs. Fixtures: none created by hand today in
this validation; the integration suites clean up after themselves (verified by their own teardown
assertions).

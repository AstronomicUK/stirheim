# Claude → Codex handover — 12 September 2026

Written at Tom's request (relayed by Codex, bus 7a44fe33) as Claude approached its usage limit.
Everything below is local: **nothing pushed, nothing deployed, production still on the earlier
release**. All of Claude's work is committed; the only uncommitted files are docs (tracker,
checkpoints, brief) that Codex commits with its own, plus Codex's own working-tree edits.

## Safe state at handover

- Working tree: Claude's code is fully committed (see the list below). `npx tsc -b` clean, `npm run
  lint` clean apart from Codex's `docs/audits/…/probe.ts` unused imports, full unit suite
  **2183 passed / 214 skipped**, integration suite for battle-start (`upkeep`, `addiction`) **11/11**
  against the local stack.
- Claims: all released (see bus). Listener (`sess wait`) not re-armed after this handover.
- Local database: migration `20260912000087_addiction_supply.sql` applied directly through psql (same
  as 051–086 before it — the local `supabase_migrations.schema_migrations` log stops at 050, so
  `supabase migration up --local` fails on 051 and must not be used; **never `db reset`**). Types
  regenerated (`npm run db:types`, 79 added lines). No production schema change.
- Fixtures: every disposable warband, match, battle session and item Claude created today was deleted
  (verified by count queries); the integration tests clean up after themselves. No player record was
  modified. The seeded e2e GM `gm@stirheim.test` and player `player@stirheim.test` were used read-only
  except through the builder UI on throwaway warbands.

## Commits today (Claude, all local, oldest first)

| Commit | Tracker | What |
|---|---|---|
| `831d87f` | #206 | Battle page keeps the warband you opened it from (`?warband=` param, `myWarband.ts`) |
| `1030bdf` | #32/#76 | `target` / `targetNote` on all 30 core spells |
| `af80910` | #32/#76/#85 | Cast tab target picker per spell kind, attack-screen layout |
| `64db4fe` | #209 | Roster spell tooltips show effective Difficulty via `effectiveDifficulty` |
| `14216d4` | #203 | Warrior badges wrap inside the card at phone width |
| `5ba25b0` | #46 | Match page: "No tallies were recorded from the battle sheet." once over |
| `fd334e0` | #202 | "1 die", both exploration strings |
| `6490554` | #92 | GM campaign picker on Join |
| `606491f` | #210 | Hired-sword eligibility tags simplified, right-aligned |
| `59b72da` | #41 | Builder greys "+" when the next copy is unaffordable (`affordability.ts`) |
| `5db3b62` | #24 | Roll-through popup: setup inside, content-sized; dice v3 real 3D tumble (`Dice.tsx`, `diceCube.ts`, `index.css`, `FightTab.tsx`) |
| `cd5fd68` | #167 | Scrape S2/T5 corrected to 6; `toWoundChart.test.ts` pins the whole chart |
| `2e6fba8` | #167 | Test type fix (`Threshold`) |
| `84505d4` | #139/#140 | Crimson Shade +1 S applied; `noEffectOn` honoured; poison never coats blackpowder (`nonBlackpowder`) |
| `398c292` | #140 | Crimson Shade +D3 I rolled once on tick, stored in `preBattle` record with provenance; `preBattleWithRolls`/`preBattleRollsOwed` |
| `af7e2d2` | #140 | Untick keeps the die; no path to a second throw |
| `02bd3c2` | #160 | Tail Fighting: shield in the tail +1 armour save (extra-attack half is a table call) |
| `37496e3` | #139/#140 | `rules/resolve/addiction.ts` allocation helper + tests |
| `c67cd14` | #139/#140 | Addiction supply ledger: migration, RPC, `start_match` extension, API, battle-roster overlay, report exemption, match-page sheet, roster warning, integration tests |

Codex's commits interleave (bb06837, 52b0dee, 84d5b87, 93a2851, f60c091, FightTab wiring for the
Shade D3, …); `git log --oneline d5ff1d1..HEAD` shows the combined batch.

## Documents written today (working tree, for Codex to commit)

- `docs/CORE-SOURCE-VERIFICATION-2026-09-12.md` — Priority 4: #167 (resolved from chart images),
  #195 (resolved from the official roster sheet), #193 (Tom ruled: keep floors, concurrent),
  #200 (core save order incl. Step Aside/Dodge/Lucky Charm/Helmet/Armour of Righteousness and the
  warband-specific saves). Evidence images in `docs/audits/2026-09-12-source-verification/`.
- `docs/CORE-EQUIPMENT-CHECKPOINT-2026-09-12.md` — Priority 3 clause-by-clause inventory and the
  slices (A done, B done, TF1 partial, D done, C/E pending, Herbs ruled but not built).
- Tracker notes for #24, #28, #29, #30, #32, #41, #46, #53, #76, #85, #92, #139, #140, #160, #167,
  #193, #195, #200, #202, #203, #206, #209, #210.

## Remaining Priority 1–5 clauses (Claude's view)

**Priority 1 (magic)** — Codex: #186 committed; native caster (#28/#29) verified in the browser by
Claude for Matriarch and Warrior Priest; Daemon Soul and Protection of Sigmar spell-saves are with
Codex (Protection implemented per 9646934a, area spells partial). Umbrella entries stay partial for
supplement lores.

**Priority 2 (combat/psychology)** — Codex: #161 relic Rout/Stupidity (committed, partial), #73
handgun reload (in progress in FightTab), #59/#70/#156/#96 not started by Claude.

**Priority 3 (equipment)** — done: Slice A (S bonus, noEffectOn, nonBlackpowder), Slice B (Shade D3,
persisted), TF1 defensive half, Slice D (addiction ledger). **Open:**
1. **Healing Herbs (HH1/HH2) — Tom ruled:** reusable by default (RAW), opt-in campaign house rule
   "single-use" consuming one dose per *actual* use with persisted audit and a correction path,
   never on selection/preview. Needs: a campaign settings flag (settings jsonb, like `combatMode`), a
   **Use Healing Herbs** action on the My Warband card (zero `woundsLost`, log line, and under the
   house rule tick the item so the report consumes it once), no `preBattle` checklist entry unless the
   house rule is on. FightTab untouched. Not started.
2. **Blessed Water throw + Garlic charge note (Slice C)** — FightTab, Codex's. Not started.
3. **One vial, one weapon (Slice E, P3)** — weapon choice on the tick; pending, real clause.
4. **Tail Fighting** — if the tail holds a knife/sword the +1 save must not also apply; two-handed
   semantics for a tail-held shield; both flagged, not built.
5. **Addiction ledger — not live-verified in the browser.** Data path is integration-tested; the
   match-page sheet, the battle-sheet "Took Crimson Shade" after a last-copy consumption, and the
   roster warning have not been walked through. Suggested check: disposable warband with an addicted
   hero holding exactly one dose, scheduled match → Start battle → sheet lists him as supplied → start
   → items row gone, ledger row present → battle sheet Melee Attack shows the tick → tick, roll D3,
   fight → report does not decrement a second copy.

**Priority 4** — complete; only housekeeping: a test naming the concurrent-recovery policy (Tom's
ruling 2), and #200's supplement-ward default is non-blocking.

**Priority 5** — complete except #53 (recommend closing; undo not built) — Tom's call.

## Risks / things to know

- `start_match` now requires the acknowledged **unsupplied** set to match exactly, including empty ↔
  empty; the client always passes `unsuppliedIds` (empty array when none). Any other caller of
  `start_match` must pass both arrays or it will be refused when addicts exist.
- The ledger is written only by `start_match` (no insert policy); RLS read via `can_read_campaign`.
- A last copy's `items` row is **deleted** at start (quantity must stay > 0); the ledger's
  `item_row_id` becomes null but `source`/`quantity_before` remain.
- Cancelling a match does **not** refund a used dose (stated in the sheet); GM roster edit corrects.
- `preBattle['itemRoll:<hero>:<item>']` holds the Shade D3 with provenance; there is deliberately no
  clear path.
- Codex's FightTab wiring for the Shade D3 and handgun reload is in Codex's working tree/commits.

## Suggested next steps for Codex

1. Commit the docs; run the full suite once more after your own edits.
2. Live-check the addiction ledger UI as above (disposable fixture).
3. Build Healing Herbs per Tom's ruling (settings flag + card action; single-use consumption exact-once).
4. Finish #73/#161, then the combined push + one release (check whether the push triggers Netlify
   before any manual deploy). Production migrations 051–087 will need Tom's `db push` as before.

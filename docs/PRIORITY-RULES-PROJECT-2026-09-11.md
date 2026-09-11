# Priority rules project — 11 September 2026

Tom authorised deploying the completed second feedback batch, then spending today working through the larger tracker areas in this order:

1. Combat and psychology: #59, #68–70, #149–175 (only combat-related entries in that range).
2. Experience, advancement and leadership: #62, #111–122, #178, #211.
3. Special warband mechanics: #120, #129–138, #147.
4. Equipment, trading and item lifetimes: #67, #139–146, #152–161.
5. Injuries, capture and recovery exceptions: #95–96, #124–128, #138, #158–159.
6. Magic rules and spellcasting consistency: #28–29, #32, #76, #85, #137, #179–186.
7. Game-day scheduling: #83.

These groups overlap. Reconcile each item against current code and evidence before implementing; older status lines are stale. Do not redo completed work or count a source/ruling question as a confirmed defect. Read source clauses before code and follow docs/RULES-AUDIT-METHOD.md. Preserve approved player overrides. Khemri #227 remains deferred. Do not alter live player histories for QA. No proactive subagents. Preserve unrelated dirty audit documents and selectively stage tracker changes.

Keep new work in local commits and accumulate the next release rather than deploying every fix. User authorised the completed second batch deployment; checkpoint that separately in SECOND-FEEDBACK-BATCH.md. Stop the daytime continuation after 11 September Europe/London unless Tom extends it; leave a concrete checkpoint of completed work, verification and next steps. Do not pause on one ambiguous rule if independent work in the current priority is possible.

## Current checkpoint

Second feedback release: tests 1,701 ordinary +169 local database passed. Production build targets bckbyomcukkiabkomlrs.supabase.co. Migration 72 applied to production; commit 5a8cac8 pushed. Netlify automatic builds paused; single explicit deploy in progress, output /tmp/stirheim-second-deploy.json. Must verify publication and served files, then inspect hosted CI before claiming CI green.

First priority: start source-first combat reconciliation with #162–175 against their source clauses and actual probability/interactive consumers. Then the broader skills, rout and psychology entries. No new combat code has been changed yet.

Second feedback batch deployed 11 September: commit 5a8cac8, Netlify 6aa396398993652a4f163c6f. Migration 72 applied. All 100 served HTML/JS/CSS files match the tested build. Final suites: 1,701 ordinary +169 database tests passed. Hosted CI 34567376962 still running at this checkpoint.

## Combat milestone 1 — #173 Trick Shooter

Confirmed against reference/rules/03-campaigns-magic-optional-rules.md:421–425. Cover immunity must belong to the shooter. buildAttackInput incorrectly read defenderSkills; now reads attackerSkills for terrain/pavise cover. Regression verifies shooter vs defender ownership, hit probabilities and retained movement/range penalties. Engine and interactive-roller suites passed. Local only; do not redeploy per fix.

Next: #174 Eagle Eyes removes every long-range penalty instead of extending range by 6 inches. Source read at reference/rules/03-campaigns-magic-optional-rules.md:403–407. Current buildAttackInput.ts skips the penalty for any rangeExtension; combat UI has only a boolean longRange toggle. Need maintain true long-range penalty while exposing the extended threshold accurately, checking both simulator and battle consumers before changing. #166 WS0 automatic hits also confirmed still absent (source01:435); preserve normal wound/injury behaviour, do not reuse knocked-down auto-OOA flag. Other #162–175 remain to reconcile.

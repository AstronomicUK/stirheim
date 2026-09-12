# Core pistol combat acceptance — 12 September 2026


### Core pistol UI and Bugman’s Ale — 12 September, local acceptance

Core #73/#69 pistol combat is now connected to the Battle Sheet: one bonus pistol attack alongside the ordinary weapon, a two-attack brace, and the separate BS crossbow-pistol opening shot. The physical inventory copy and confirmed combat are retained; starting another turn/choosing another opponent does not refresh use. An explained new combat does not bypass reload. An explained correction restores availability without rewriting earlier attacks. Brace attacks are sequential, and the unused second pistol can be resolved separately during the same opening round. The ordinary attack count is not replaced by a single pistol’s bonus. Crossbow-pistol tooltip/data no longer repeat the scraped normal-pistol WS paragraph absent from original core p29.

Actual disposable 390px browser checks passed: two distinct brace copies (including misses), saved use after reload and explained corrections; A3 normal weapon followed by one pistol (no premature pistol use); the BS opener at 6+ for BS3 and no blackpowder consumption; split brace across separate roller openings. Scripts are archived under `docs/audits/2026-09-12-core-pistol-combat/`. 84 focused profile/ledger/roller/physical-copy tests passed. The first browser pass exposed duplicate saved profile identity, which was fixed before rerunning. Initial script selector failures are not product failures; final runs cleaned all their disposable fixtures.

Bugman’s Ale is completed by Claude 85fb7a6 plus shared integration 141d13f: a declared barrel grants battle-long fear immunity to the warband except Elves, including a stash barrel; carrying an undrunk barrel does nothing. Exact inventory-row consumption, withdrawal, stale stock validation and duplicate legacy-tick suppression pass 21 focused tests. Claude’s mobile declaration/reload/correction acceptance passed 11 checks. This closes the erroneously excluded core clause, not every supplementary consumable in #139.

The shared combat boundary and positional ordering remain player-confirmed. Group use is per selected model with physical copies; uneven kit is explicitly blocked rather than assigned arbitrarily. All work remains local; no push or deployment.

Original source: https://www.broheim.net/downloads/rules/Mordheim%20Core%20Rules%20Printable.pdf, pp29–32.

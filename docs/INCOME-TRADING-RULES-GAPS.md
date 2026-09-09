# Income and trading — rules audit (audit #9 of RULES-AUDIT-PLAN.md)

**Date:** 2026-09-07  **Status:** findings awaiting Tom's review; not yet sent to the Stirheim Developer
**Sources compared:** `reference/rules/03-campaigns-magic-optional-rules.md` — the Income section
(lines 565-1038: exploration procedure, shards found, selling wyrdstone, the Sisters / Skaven /
Undead notes, spending income) and the Trading Rules section (1039-1120: spending cash, new recruits,
veterans, weapons, trading, availability, selling) — against `src/rules/data/campaign/income.ts`,
`src/rules/data/campaign/trading.ts`, `src/rules/resolve/income.ts`, `src/rules/resolve/trading.ts`,
`src/rules/resolve/itemPricing.ts`, `src/rules/resolve/itemRestrictions.ts`,
`src/rules/resolve/roster.ts`, `src/rules/resolve/recruitment.ts` and the four trading tabs.

**Method.** Read each clause against its implementation, and traced the two places the rules restrict
what a warrior may buy — the warband's own equipment list and the category bans — to see where, if
anywhere, they are checked.

---

## What is modelled

- **The wyrdstone income chart is complete and correct**, all eight rows by all six warband-size
  bands, with the open "8+" row. The scrape is missing the table itself, so the figures came from the
  rulebook and were verified against the site's own table image — that is noted in the data file with
  the date, which is exactly the right way to handle a gap in the source.
- **Warband size for the chart counts the right models**: active heroes plus every henchman, with
  hired swords excluded, and the Sell Wyrdstone tab says so on screen.
- **Partial sales work.** The player chooses how many shards to sell, which is the whole point of the
  chart — hoarding and selling a few at a time earns more — and the once-per-sequence limit is
  enforced separately, so the strategy the rules intend is available and not abusable.
- **Rare availability is right**: 2D6 against the rarity number, one roll per Hero, and warriors taken
  out of action in the last battle may not look. That last clause is easy to miss and is implemented.
- **Selling is right**: half the listed price, and for variable-priced rare items half of the basic
  cost only. Rounding is not specified by the source; the app floors and says so.
- **Veteran recruits** are complete: the 2D6 pool between battles, each recruit consuming the group's
  experience, and 2 gc per extra experience point.
- **New recruits buy at the trading post**, which is the correct reading of "a new hireling can only
  buy Common items freely; Rare items only via the normal trading rules" — because routing them
  through the shop makes the rare rules apply automatically rather than needing a second code path.
- **Half-price armour and the other house rules** are applied through `itemPrice` with their own
  switches, and dice-priced items are quoted rather than guessed.

---

## A. Gaps

1. **Nothing checks whether an item is on the warband's equipment list.** The rule is explicit: "your
   warriors lack the skill to use any weapons other than the ones listed in the Recruitment charts."
   The warband templates carry `equipmentLists` in full, but the only consumers are
   `builder.ts` (warband creation) and `freeDagger.ts`. The trading post never looks at them. After
   creation, any warrior can be sold anything in the catalogue with no warning at all — a Skaven with
   a halberd, a Sister of Sigmar with a bow.

   This is distinct from the item restrictions Phase 16 built, which are per-item warband rules
   ("Chaos Dwarfs only") held in `ITEM_RESTRICTIONS`. Those work well. List membership is a different
   question and has no check anywhere.
2. **Category equipment bans are not shown at the point of sale.** `equipmentBanReason` knows that a
   Troll Slayer may wear no armour, that Flagellants use no missile weapons, and so on, but it is only
   called from `validateRoster`, which runs on the Warband page. `itemRestrictionWarnings`, which the
   Buy tab does call, does not consult it. So the shop will sell a Slayer a suit of heavy armour
   without comment and the problem surfaces later, on a different screen, after the gold is spent.
   Everything needed is already written; it is a wiring gap rather than missing logic.
3. **Rare items must be limited to one per successful roll, and are not.** Tom's ruling, 2026-09-07:
   this should be **blocked, not warned**. Today the Buy tab shows "The rulebook allows one rare item
   per successful roll" above the quantity stepper and lets the purchase through
   (`features/trading/BuyTab.tsx:321`). The source agrees with the ruling: "You can only buy one rare
   item for each successful roll."

   **One exception the fix must keep.** A brace of pistols is a single purchase priced for two, and
   `BuyTab` already handles it: `braceAmountOf(item.price.text)` reads the bracketed price and
   `isBrace` applies it when quantity is exactly 2. Pistols are Rare 8, Duelling Pistols Rare 11 (12
   for a brace), so a blanket "rare means quantity 1" would break every brace purchase in the game.
   The cap should be 1, or 2 where the item's price line defines a brace amount and the brace price is
   the one charged.
4. **The Sisters, Skaven and Undead income notes are carried as text only.** The rules say gold for
   these warbands is not literally money — resources from the temple, Skaven currency, and the Undead
   being "beyond petty concepts of wealth". Purely flavour with no mechanical effect, so this is
   correct as text; noted only so nobody logs it as missing.

---

## B. Smaller points

5. **Rounding of half prices down is deliberate and correct.** Selling floors, so a 15 gc item fetches
   7. The source does not specify rounding; Tom confirmed on 2026-09-07 that flooring is his own
   instruction. Recorded here so it is not raised again as an open question.
6. **`searchesRemaining` is defined but the feature layer counts searchers itself.** `TradingPage` and
   `BuyTab` both call `eligibleSearchers` and take its length rather than using the resolver's helper.
   No behavioural difference today, just two ways of asking the same question.

---

## C. Fine as text

The prose about completing trading while both players are present, and about determining which rare
items are on offer before the players part, is table etiquette rather than something a tracker should
enforce. The flavour of the trading posts themselves needs no modelling.

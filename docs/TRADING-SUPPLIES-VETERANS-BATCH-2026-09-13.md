# Trading, supplies and veterans — 13 September 2026

Implemented locally. No push or deployment. Combine with the existing unreleased fixes.

| Item | Result |
|---|---|
| #145 Victuals | Wyrdstone sales offer a quantity selector after battle. Each supply lowers the income band once, down to 1–3. Uses available stash, active-hero and living-group supplies, in that order; excludes hired equipment and unavailable warriors. Works alongside Foragers, saved Master Chef, map income and Burning. Gold, shards and consumed inventory save together. |
| #133 Know Who To Sell To | Hochland Bandits record each copy’s price dice when selling variable-priced equipment. Receive half the basic cost plus half the random component, rounded down separately. Logs record dice, their source, quantity and gold. Other warbands retain ordinary half-basic resale. |
| #134 Uncommon | Sons of Hashut Chaos Dwarf Warriors and Blunderbuss Chaos Dwarfs use ceil(1.5 × group XP) pool points per recruit. Gold remains 2 gc per actual XP. Hobgoblins, other warbands and new green groups are unchanged. Quotes explain the distinction. |

## Source and scope

- Victuals: `reference/rules/02-weapons-armour-equipment.md:2410–2415`.
- Know Who To Sell To: `reference/rules/warbands/grade-1b-part1.md:2296`. The historic tracker also mentioned Pirates, but the local Pirate source does not grant this rule. No unsupported Pirate bonus was added.
- Uncommon: `reference/rules/warbands/grade-1c.md:3506`. Rounding is per recruited warrior, then multiplied by the number recruited.
- A nearby map-sale discrepancy was corrected: the displayed full basic resale offer now matches the saved gold, and applies only to weapons/armour. When both this map offer and Bandit variable resale apply, the higher independent offer is used; they are not multiplied together. This does not reconstruct original purchase-price history.
- Player overrides remain available. These checks protect the normal guided transactions; they do not remove generic roster editing.

## Validation

- 2,500 application tests passed.
- 349 authenticated local database tests passed, including five new saved-outcome tests.
- Production build and lint passed; existing large-chunk and audit/design-file warnings remain.
- All 130 migration files replayed successfully in an isolated empty database.
- Mobile browser checks at 390×844: Victuals changed the Bandit quote 70→80 gc, saved treasury 100→180, removed one supply and marked the sequence sold. Blessed Water dice 5+6+2 produced 11 gc and saved treasury 180→191, removing one copy. Two four-XP Chaos Dwarfs cost 96 gc total, saved treasury 500→404 and pool 12→0.
- Transaction tests cover stale stock, rollback when consumption is omitted, post-battle restriction, concurrent duplicate sale attempts, saved Chef compatibility, item removal, Bandit resale and veteran recruitment persistence.

## Release requirements

Apply `20260913000136_victuals_sale.sql` with the already pending migrations at the eventual combined deployment. The new RPC wraps the existing sale checks and validates the inventory snapshot and exact consumption within the same transaction. Its old implementation is no longer directly callable by app users.

The local tracker is updated; no public tracker or production data was changed.

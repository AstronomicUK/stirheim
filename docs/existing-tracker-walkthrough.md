# The existing tracker — reference notes for a campaign tracker

Purpose: observe how the existing tracker structures a Mordheim campaign manager so we can build
something similar on top of this repo's rules data and combat engine. These are behavioural
notes from using the tool, not copied text or assets.

## Status

- 2026-09-03: public landing/login reviewed, then full authenticated walkthrough via Tom's
  Chrome session: every module exercised end-to-end with throwaway data (2 test warbands, 1 test
  campaign, 2 complete battles incl. post-battle wizard, trading, advancements). See
  "Observations" and "Mapping to this repo" below.

## Tech observations (public)

- Frontend is a Go program compiled to WebAssembly (`/web/app.wasm`, ~30 MB, loaded via
  `wasm_exec.js` + `app.js`). Client logic is opaque; behaviour must be observed, not read.
- Served behind Caddy. Tailwind-style utility classes in the DOM, dark theme (`#131313`),
  fonts: Newsreader (headline), Noto Serif, Inter, Material Symbols icons.
- Installable PWA (`manifest.webmanifest`).
- Auth: email + password, forgot-password flow. No OAuth.

## Feature modules advertised on the landing page

1. **List Builder ("Warband Architect")** — recruit warriors, buy equipment, manage active
   roster; every purchase recorded in a ledger.
2. **Campaign Manager ("Campaign Chronicles")** — multi-player campaigns joined via invite
   codes; campaign flow orchestration; GM tools.
3. **Battle Helper** — live tracking of wounds, rout tests, experience gained; inline rule
   references.
4. **Post-Battle Sequence** — guided step-by-step: injuries, experience, exploration for
   Wyrdstone.
5. **Level Ups & Injuries** — skills, permanent injuries, stat advances tracked per hero.
6. **Trading Post** — Wyrdstone sale, rare-item purchase with rarity rolls.

## Navigation seen in the authenticated shell (from the served HTML skeleton)

Sidebar: Rosters (`/warbands`), Campaigns (`/campaigns`), Active Battles (`/battles`),
Tactical Command (`/tactical`), Scenarios (`/scenarios`), plus Logout. A campaign name
("The Damned Ledger") is shown in the sidebar header with the label "Mordheim Campaign",
suggesting a currently-selected campaign context.

## Walkthrough plan (once logged in)

Use clearly-named throwaway data only (e.g. campaign "ZZ TEST — delete me", warband
"ZZ Test Warband"). Do not modify or delete any existing campaign or roster.

- [x] Rosters: create a warband; note warband selection, starting gold, hero/henchman
      hiring UI, equipment purchase, rating calculation, validation rules, roster print/export.
- [x] Campaigns: create a campaign; note settings (house rules? starting gold? max warbands?),
      invite code flow, GM role and tools, campaign dashboard.
- [x] Active Battles: start a battle; note scenario selection, participants, per-model
      tracking (wounds, KD/stunned/OOA), rout test, XP tallying.
- [x] Post-battle: walk the full sequence; note the order of steps, dice handled by the app
      vs entered by the player, serious injury results, advances, exploration, income,
      selling Wyrdstone.
- [x] Trading Post: rarity rolls, price handling, hired swords.
- [x] Tactical Command and Scenarios pages: what they are.
- [~] Data: check for any export/import; capture network calls (API shape, JSON schemas).
- [ ] Clean up: delete the throwaway campaign/warband (confirm with Tom first).

## Observations

### Account-level structure & limits
- Rosters (warbands) are account-level objects, independent of campaigns: "4/20 ROSTERS". A roster
  can then be enrolled in a campaign. One player can have several warbands in the same campaign.
- Campaigns a user *administers* appear under Tactical Command ("CAMPAIGNS · 1/5"), with
  Manage/Delete. Campaigns a user *plays in* appear under Campaigns. Same object, two views
  (GM vs player).
- Scenario Library: ~100 "OFFICIAL" scenarios grouped by setting (Mordheim, Ostermark, The
  Empire, Albion, Khemri, Lustria, Black Fire Pass) each with a one-paragraph blurb + View Rules;
  users can add up to 50 custom scenarios; filters: search, creator (All/Official/Mine), setting.
- Sidebar: Rosters, Campaigns, Active Battles, Tactical Command, Scenario Library; footer:
  Tutorials, Feedback, Account. Header shows the *currently selected campaign* name.

### API surface seen (the tracker's API host, bearer token in localStorage `auth.token`)
- `GET /warbands`, `GET /warbands/{id}`
- `GET /campaigns`, `GET /warbands/{wid}/campaigns/{cid}` (per-warband campaign state: gold,
  wyrdstone, battle history — campaign-scoped, separate from the roster itself)
- `GET /matches?state=in_progress&state=awaiting_reports` (Active Battles page)
- `GET /matches?campaign_id=…&state=completed&state=awaiting_reports` (campaign dashboard)
- `GET /warbands/{wid}/challenges?campaign_id=…`
- `GET /scenarios`
- Data model implied: Warband, Campaign, CampaignMembership (warband×campaign), Match (states:
  in_progress → awaiting_reports → completed), MatchReport (one per participant), Challenge,
  Scenario. Warband type / unit type / injuries stored as SCREAMING_SNAKE enums
  (DWARF_TREASURE_HUNTERS, DWARF_NOBLE, HORRIBLE_SCARS, FRENZY).
- Saw a burst of 503s from the API mid-session — small hobby backend; be gentle.

### Roster list card
Name, warband type enum, model count, rating, and 4 actions: View / Printer Friendly / Edit / Delete.

### Roster detail (view mode)
- Header: name + type. **Treasury** strip: Gold (gc), Wyrd Stones, Stash (N items).
- **Special Rules** block: the warband's racial/faction rules, verbatim text.
- **Heroes (N)**: each card = name, unit type, EXP, stat line (M WS BS S T W I A LD), Special
  Rules (unit-level, verbatim), Equipment (chips, duplicates allowed e.g. two Pistols), Injuries
  (chips, e.g. "Horrible Scars", "Hardened", "Frenzy" — note Hardened/Frenzy are *injury-chart
  results*, so the injuries list is really "serious-injury outcomes" incl. positive ones), Skills
  & Spells (chips, e.g. "Master Of Blades"), Add Note, expand/collapse.
- **Henchmen (N groups)**: group name, "N WARRIORS", EXP, stat line, equipment, note.
- **Hired Swords (N)** section (empty state text).

### Campaign list (player view)
Card per campaign: name, invite code (e.g. `twisted-chapel-28`, word-word-number), "Your
warbands" in it, count of warbands clashing, View Campaign. Below: "Enlist" box — enter invite
code → Join.

### Campaign dashboard (player view, per warband)
- If the player has >1 warband enrolled, a modal first asks "Choose your warband" (shows each
  with its campaign gold).
- Header: warband name, "Currently participating in '<campaign>'", buttons View Roster / Battle
  Records.
- Three stat tiles: Warband Rating, Gold Crowns, Wyrdstone Shards (all campaign-scoped).
- **Completed Battles (N)** collapsible list: result + scenario ("Defeat — Breakthrough"), "VS.
  <warband> (<type>)", looted gc, wyrdstone, injured, dead; click → **Battle Report** modal:
  - result, 4 tiles (gold looted / wyrdstone / injured / dead)
  - **Experience Gained**: per hero and per henchman group, itemised lines ("Opposing warrior
    taken out of action +1" ×N, "Survived +1") with a total (+4 XP)
  - **Injuries Sustained**: per warrior, injury enum chips
  - **Fallen in Battle**: "Henchman Group 2 — 1 killed"
  - **Opponent Reports (1)**: the other side's report (result, gold, wyrdstone, injured, dead) —
    so each participant files their *own* report for the same match.
- **Strategic Orders** panel (buttons): Visit Trading Post, Recruit Warriors, Manage Stash,
  Review Campaign Rules, Bestow Advancements (disabled when nothing pending), Issue Challenge.
- **Allied & Rival Forces**: every other warband in the campaign with type, rating, model count,
  View Details.

### Trading Post (`/trading-post?warband=…&campaign=…`)
- Header tiles: Wyrdstone shards (with "Can sell again after next battle" — selling is
  once-per-post-battle), Gold available.
- Search + Category filter + Availability (All / Common / Rare).
- Item cards: name, price (supports dice prices "50 + 3D6 gc", "3 x base weapon price",
  "1st free/2 gc", "Free"), category chip (Close Combat Weapons, Missile, Blackpowder, Armour,
  Misc Equipment, Animal Bestiary, Close Combat Weapon Upgrades), availability chip incl.
  restrictions text ("RARE 9 (DWARFS ONLY)", "COMMON (PIRATES ONLY)"), truncated description,
  Full Details, Buy. Material upgrades (Gromril X / Ithilmar X / Dark Elf Blade X) are separate
  catalogue items in a "Close Combat Weapon Upgrades" category.
- Right rail: Equipment Stash (N items), Treasury, then one row per hero / henchman group
  (name, type, N items) — i.e. buying assigns to a warrior or to the stash.
- Catalogue is the full mordheimer.net equipment list incl. every warband-specific item — the
  app does NOT filter by warband eligibility, it shows the restriction text instead.

### Recruitment (`/recruitment?warband=…&campaign=…`) — "Recruitment Ledger"
- Two sections: **Heroes** ("0/3 recruitable" — hero slots left) and **Henchmen** ("3/3
  recruitable"). Each unit type card: name, role tag (LEADER / HERO / HENCHMAN), cost in gc,
  "MAX REACHED" when the template max is hit, Details / Recruit.
- **Details modal** for a unit type: name, tag chips (LEADER, race e.g. DWARF, cost, "MIN 1 /
  MAX 1"), Characteristics table, Special Rules, **Available Skill Tables** chips (Combat,
  Shooting, Strength, Warband Special…).
- Right rail: **Warband Roster** "6/12 units" (max warband size), gold available, heroes list
  (name, type, XP), henchmen groups (name, "×1 · N XP").
- Maps directly onto this repo's `UnitTemplate` (min/max, cost, stats, skill tables) and
  `WarbandTemplate.maxSize`.

### Stash (`/stash?warband=…&campaign=…`) — "The Ledger of Spoils"
- Header tiles: wyrdstone, gold.
- **Shared Stash** (N items, searchable): item cards with quantity badge, Sell / Move.
- **Active Roster**: per warrior, "Equipped Gear" rows (item, ×qty, Sell, Move). So equipment
  is a per-warrior inventory with quantities, plus one warband-level stash; items move between
  them; selling from either.

### Campaign Rules
- Player side: "Review Campaign Rules" opens a modal titled with the campaign name; "No rules
  have been established yet." GM side: Campaign Rules panel with View Rules / Edit Rules. So
  campaign rules = a free-text (probably markdown) house-rules document per campaign.

### Issue Challenge (player) — modal
- "Select a scenario and challenge rival warbands. All challenged warbands must accept before a
  match is created." Fields: Select Scenario (dropdown of all ~100 scenarios), Challenge
  Warbands (checkbox list of the other warbands in the campaign, multi-select ⇒ multiplayer
  matches supported). Buttons: Issue Challenge / Cancel.
- So two ways a Match is created: player Challenge (needs acceptance by all) or GM "Schedule
  Battle" (direct).

### GM view: Tactical Command → Manage (`/tactical/{campaignId}`)
- Header: campaign name + tagline.
- **Participating Warbands** (N "legions active"): each with icon by faction, name, type,
  rating, View Details, **Remove**.
- Collapsible sections: **Awaiting Reports** (matches where not all participants have filed),
  **Active Battles** (in progress), **Upcoming Engagements** (scheduled, not started),
  **Archive of Bloodshed** (N completed — cards: scenario name, "VICTORY: <winner> · A vs B",
  View Details, a "report" icon), **Cancelled Engagements**.
- Right rail: **Campaign Invite Code** with Copy; **Campaign Rules** (View / Edit); **Schedule
  Battle** form: Select Scenario dropdown + "Draft Combatants" checkbox list of all enrolled
  warbands ("select at least 2") + SCHEDULE BATTLE button.
- Match lifecycle implied: scheduled/upcoming → in_progress → awaiting_reports → completed
  (or cancelled). Reports are per participant; match completes when all reports are in.

### Tutorials (`/tutorial`) — "The Field Manual"
Four YouTube walkthroughs, useful as public reference for the flows we haven't driven yet:
1. Roster Creation — https://youtu.be/7vFodetH2Xg
2. Starting and Playing a Battle — https://youtu.be/EaWJMx1Ek_I
3. Post Game and Advancement — https://youtu.be/teAJj_jfGJE
4. Hiring, Trading, Managing Your Stuff — https://youtu.be/nKfAV0jt_TE

### UI quirk worth knowing
- Buttons in this WASM app frequently need a second click (first click only registers hover/
  focus) when driving via automation. Not a design note, just a testing note.

### Battle Records page (`/campaigns/{cid}/matches`) — "Campaign Chronicle"
- Header: "Every engagement fought in '<campaign>' — N Battles Recorded", **Export CSV** ("Download
  every post-battle report in this campaign as a CSV file").
- Filter tabs: All / Upcoming / In Progress / Awaiting Reports / Completed / Cancelled (= the
  match state machine, confirmed).
- Match card: setting (Mordheim), "Scenario: X", "Recorded: Aug 31, 2026 · 09:28", state badge,
  each participant (name, "YOURS" tag, type · rating), "<warband> reported" chips per
  participant, Details.
- GM match detail modal: state, scenario name + blurb + setting, collapsible **Scenario Rules**,
  **Participating Warbands** rows: result badge (VICTORY/DEFEAT), +N XP, N dead, expander.

### Create Warband flow (writes — test data "ZZ TEST Warband A (delete me)")
- Rosters → Create New Warband → modal: Warband Name, Starting Gold (default 500, editable —
  so non-standard starting gold is supported), Warband Type dropdown (69 types, snake_case
  values, e.g. `mercenaries_reikland`, `dwarf_treasure_hunters`, `restless_dead`). "Commence
  Recruitment" → navigates to `/warbands/new/build?name=…&type=…&gold=…` (builder state is in
  the URL until saved — nothing hits the API until Finalise).
- **Builder ("Recruitment Ledger")**, 3 columns:
  1. **Available Warriors**: every unit type from the warband template with role (Warband
     Leader / Champion (0/2) / Hero (0/2) / Henchman (0/7)…), cost, Details, Recruit. Counters
     show current/max per type; Recruit disables at max.
  2. **The Ledger**: recruited entries — auto-generated placeholder names (e.g.
     "delicate-sunset", "wandering-frost"), "TYPE • ROLE • cost". Henchmen are recruited as a
     *group* ("Warrior Grp1") with a −/+ group-size control on the ledger row; X removes.
  3. **Armory & Spells** for the selected ledger entry: name field (or Group Name for
     henchmen), then the warband's **equipment list** grouped Hand-to-Hand / Missile Weapons /
     Armour with price and a −/+ quantity per item (Dagger "Free (1st free, 2 gc ea)", Pistol
     "15 gc (30 gc for a brace)"). Footer: Warrior cost / Equipment / Total.
- Header: "1 / 15 models • 1 / 5 heroes" (warband max size & hero cap), gold remaining live,
  buttons **Recruit Hired Swords** and **Finalise Recruitment**.
- Starting equipment is chosen from the *warband's own equipment list* here; the Trading Post
  (campaign phase) exposes the full catalogue. Matches Mordheim's rule that starting purchases
  come from the warband list only.

### Create Campaign flow (writes — test data "ZZ TEST Campaign (delete me)")
- Tactical Command → Establish New Campaign → inline form: Campaign Name only ("A campaign
  cipher will be generated automatically for players to join"). Result: card with auto invite
  code `grim-wolf-33`, 0 warbands, Manage / Delete. Limit 5 campaigns per account.

### Saved roster facts (from the two test warbands)
- Test A: Mercenaries (Reikland), Captain (Sword + Light Armour), Champion, Youngblood, 1
  Marksman, 1 Warrior → 310 gc left, **rating 53**. Starting XP is pre-filled from the template
  (Captain 20, Champion 8, Youngblood 0, Witch Hunter 8). Rating = 5 per model + XP (Mordheim
  standard) — 5 models ×5 = 25 + 28 XP = 53 ✔.
- Roster gold carries into a campaign as that warband's campaign gold (310 gc in both places
  after enrolling). Whether gold is later campaign-scoped or roster-scoped needs checking after
  a purchase.
- Test B: Witch Hunters, Captain + Witch Hunter + 1 Zealot, no equipment → 395 gc.
- Warband "special rules" block is empty ("none") for Witch Hunters but populated for Dwarfs and
  Reikland — so the racial-rules text is part of the warband template data.

### Join campaign flow (player)
- Campaigns → invite code → Join → modal "Enlist in a Campaign": campaign code (prefilled) +
  **Select Warband** dropdown (all the player's rosters, "name — type") → Enlist. Lands on the
  campaign dashboard for that warband. The GM's Tactical view immediately shows it under
  Participating Warbands.
- New-campaign dashboard empty state: "No battles scheduled — The war-master has yet to arrange
  your next engagement."

### Trading Post purchase modal
- Buy → modal: item name, category + availability chips, price, description, **Purchase Price
  (gc)** — a *number input prefilled with the base price and editable* (so variable "50 + 3D6"
  prices are rolled by the player and typed in; no dice automation here), **Assign To**
  dropdown: Warband Stash / each Hero by name / each Henchman group ("Group 1 — Marksman (1
  members)"). Confirm Purchase / Cancel.
- (Rarity handling for RARE items: checked below.)

### Trading Post — RARE item purchase
- Buying a Rare item adds a third field **"Hero Rolling for Rare Item"** (dropdown of the
  warband's heroes). Once a hero is chosen the modal shows the rule text ("Roll 2D6. If the
  result is equal to or greater than 5, the hero finds the item…") and TWO outcome buttons:
  **Item Not Found** and **Item Found — Confirm Purchase**. i.e. the *player* rolls physical
  dice and records the outcome; the app enforces the structure (one hero per search, rarity
  threshold displayed) but doesn't roll. A Common item skips this and just has Confirm.
- After a purchase: gold decrements immediately (310 → 305 for a 5 gc Axe) and the item
  appears in the chosen warrior's inventory in the right rail ("Test Captain · 3 items").
- Purchase price field is editable, so the app trusts the player for dice-based prices too.

### Account page — "Ledger Maintenance"
Change Password (emails a reset link), Danger Zone: Delete Account (deletes warbands,
campaigns you own incl. matches/scenarios, memberships).

### GM: Schedule Battle (writes)
- Pick scenario (Skirmish), tick ≥2 draft combatants, Schedule Battle → an **Upcoming
  Engagements (1)** card appears: "SCHEDULED · Skirmish · Mordheim · A vs B" with **View
  Details** / **Cancel Match**. Form resets after submit.

### Player: from scheduled match to live battle
- Once the GM schedules, the player's campaign dashboard shows **Upcoming Engagements**: "A ⚔ B",
  setting, "Scenario: Skirmish", "Date: TBD", **Prepare for Battle**. (Active Battles page still
  empty at this point — it lists only in_progress/awaiting_reports matches.)
- Prepare for Battle → modal: scenario name + blurb, **The Encountering Forces** (each warband +
  rating), Scenario Rules expander, **Begin the Massacre** ("Fate is sealed…"). Starting moves
  the match to in_progress.
- **Live battle screen** `/battles/{campaignId}/{warbandId}/{matchId}` — one page per
  participating warband (each player tracks their own side):
  - Top card: Battle Scenario name, Scenario Rules expander, **End Battle** button.
  - **Loot & Treasure** expander ("No loot recorded") and **Battle Notes** expander.
  - **Expedition Ledger** (your warband): Warband Special Rules expander; then one card per
    hero: name, type, stat table, Equipment with each item's rule text inline (e.g. "Save: 6+
    Movement Penalty: No penalty when worn with a shield"), Special Rules list, Add Note, and
    two actions **Record XP** and **Out of Action**. Henchman group cards instead have Record XP
    and an **OOA counter** ("OOA: 0 / 1" with −/+), since individual henchmen aren't tracked.
  - Right rail **The Adversary**: opponent's roster (names, types, stat tables) read-only, so
    you can see enemy stats at the table without their sheet.
  - Notably NO wound/turn/rout tracking despite the landing-page copy: the helper is an XP +
    OOA tally plus reference. Simple and probably the right scope.

### Battle helper actions (tested)
- **Record XP** → modal "Record Experience — <warrior>": XP Gained (number, default 1), Reason
  (free text with suggestions, e.g. "Opposing warrior taken out of action", "Survived"),
  **Inscribe in the Ledger**. The warrior card then shows a "+1 XP" badge. These itemised lines
  are what the Battle Report later lists per warrior.
- **Out of Action** on a hero: instant toggle, no modal. Card greys out, sorts to the bottom of
  the ledger, button becomes **Restore**. Henchman groups use the −/+ "OOA: n / N" counter.
- **Loot & Treasure** expander: Gold Crowns counter (−5 / − / value / + / +5), Wyrdstone Shards
  counter (same), **Treasure** list with **Add Treasure** → modal offering "From Equipment List"
  (dropdown of the full catalogue, then Add) or "Enter Free Text". Added items appear as chips
  with an X.
- **Battle Notes** expander: free text.
- Both players see their own page for the same match; the opponent's roster is read-only in the
  right rail. Ending the battle is per-player (**End Battle**) and leads straight into that
  player's post-battle wizard.

### Post-battle wizard — Stage 1 "The Apothecary" (`/post-battle/injuries`)
- Full-screen stepper: **Injuries → Experience → Exploration** (3 stages).
- "Warriors Out of Action": one card per OOA warrior — name, type, status. Heroes get a **Roll
  D66** control (two dropdowns, Tens 1–6 and Units 1–6) then **Confirm**; henchmen get a D6
  (1–2 dead / 3–6 alive). Player rolls physical dice and enters the result — consistent with the
  Trading Post approach (app applies consequences, never rolls).
- Below: **"The Chronicler's Cheat Sheet"** — the Henchmen (D6) and Heroes (D66) serious injury
  tables rendered in full (roll / result / effect text). Nice pattern: rules reference inline at
  the point of use.
- Footer: **Continue Later** (wizard state persists — matches the `awaiting_reports` match
  state) and **"N warrior(s) remaining"** as the Next button (disabled until every OOA warrior
  is resolved).

### Stage 1 result display
After Confirm the card shows "Rolled 22 — Leg Wound / Permanent -1 to the warrior's Movement
characteristic. / ✓ INJURY RECORDED: LEG WOUND" with a **Reset** link. Result names are the
standard Mordheim D66 table (22 Leg Wound, 64 Horrible Scars, …) and the app applies the stat
effect itself.

### Post-battle wizard — Stage 2 "Hard-Won Wisdom" (`/post-battle/experience`)
- **The Survivors' Toll** banner: one button "Apply Survivors' Bonus (+1 XP)" adds a "Survived
  +1" line to every warrior/group that isn't dead — including ones marked INJURED (OOA but alive),
  which is correct per the rulebook.
- **Warriors Ledger**: card per hero and per henchman group with a status chip (SURVIVED /
  INJURED / presumably DEAD), "Battle XP: n", the itemised **Experience Log** (lines carried over
  from in-battle Record XP, each editable text + "+1" + delete), and an add row: "Deed
  performed…" + amount + Add. Footer: Previous Stage / Continue Later / Next Stage.
- Note the app does NOT auto-award the scenario XP (winning leader +1, per-scenario bonuses) —
  the player adds those as deeds. It also doesn't yet resolve *advances* here (that's "Bestow
  Advancements" back on the dashboard, gated on XP thresholds).

### Post-battle wizard — Stage 3 "Scouring the Ruins" (`/post-battle/exploration`)
- **Exploration Rolls** card: "Your warband has N hero(es) who were not taken out of action.
  Roll 1D6 per hero (max 6 dice total). Skills and equipment may grant extra dice or re-rolls."
  Checkbox "Did you win this battle? (+1 die)", "Suggested dice to roll: N", **Total of all
  dice rolled (sum)** number input, **Multiples found** dropdown (None / Doubles / Triples /
  Four / Five / Six of a kind) + a **Value (1–6)** dropdown when a multiple is chosen, then
  Confirm Exploration Rolls. Again: player rolls, app resolves.
- After confirm: summary chips (Won: Yes · Dice Total: 9 · Match: Doubles of 3) with Reset;
  **Wyrdstone Yield** ("From dice total of 9 → 2 shards"); then one card per exploration
  result, e.g. **"Corpse — Doubles of 3"** with the flavour text, a sub-roll ("To see what you
  find… roll a D6") as a dropdown + result table (1 D6 gc / 2 D6 gc / 3 Dagger / 4 Axe / 5 Sword
  / 6 Light Armour) and **Mark Location Resolved**. So the whole exploration chart (doubles 1-6,
  triples 1-6, … six-of-a-kind) is data with nested sub-tables.
- **Battle Gains** panel (applied only on submit): Gold Crowns (from exploration), Wyrdstone
  Shards (from exploration), Exploration Finds (items), Battlefield Treasure (from the in-battle
  Loot section), Effects Gained.
- **Chronicler's Reference**: Wyrdstone Shards Found table (1–5:1, 6–11:2, 12–17:3, 18–24:4,
  25–30:5, 31–35:6, 36+:7).
- Footer: Previous Stage / Continue Later / **Submit Battle Report**.

### Exploration sub-roll & submission
- Choosing the D6 value shows a **Confirm Roll** button; after confirming, "Result: Sword" is
  listed under the location and **Mark Location Resolved** commits it into Exploration Finds.
- **Submit Battle Report** → final modal **"The Veteran's Vigil"**: "Roll 2D6 — Veteran
  Experience Pool. This pool is used when recruiting new henchmen." (Mordheim's rule that new
  henchmen may start with experience.) Plus a "Final Submission — this report is final" warning.
  Submit Report → success page **"The Chronicle is Written"** with Return to Campaign.
- Battle Gains for Warband A correctly combined in-battle loot (5 gc, 2 shards, Sword treasure)
  with exploration (0 gc, 2 shards). Gold/shards are split "from battle" vs "from exploration".

### Dashboard after both reports submitted
- Warband A: rating 53 → **59** (+6 XP recorded across the warband; confirms rating = 5/model
  + total XP), gold 305 → **310** (+5 looted in battle), wyrdstone 0 → **4** (2 battle + 2
  exploration). Completed Battles (1): "Defeat — Skirmish · VS. ZZ TEST Warband B (Witch
  Hunters) · 5 GC looted · 4 wyrdstone · 1 injured · 0 dead".
- Result (Victory/Defeat) came from the "Did you win?" checkbox in Stage 3 — no separate
  "who won" step; each side self-reports, so the two reports can disagree (the GM sees both).
- **Bestow Advancements** stayed disabled: nobody crossed an XP threshold (Captain 20→22; hero
  thresholds are 2,4,6,8,11,14,17,20,24,…). So the app tracks thresholds and only enables the
  advance flow when one is crossed.

### Roster view after a battle
- "View Roster" on the dashboard opens the roster as a modal (same layout as the standalone
  roster page). Each hero now shows **"N XP to next level"** under EXP — so the hero/henchman
  advancement thresholds are data in the app, and this is what gates "Bestow Advancements".
- Injuries section lists the serious injury by name with its effect text ("Horrible Scars — The
  warrior causes fear from now on."). Stash shows the Sword found as battlefield treasure.
- GM Tactical view after both reports: Awaiting Reports empty, Archive of Bloodshed (1). Match
  lifecycle confirmed end-to-end: scheduled → in_progress → awaiting_reports → completed.

### Selling wyrdstone (Trading Post header → Sell)
- Modal "Sell Wyrdstone Shards": "You have 4 shard(s) • Warband size: 5 effective (5 models)"
  — the app computes the income-chart column from warband size (Mordheim's 1-3 / 4-6 / 7-9 /
  10-12 / 13-15 / 16+ bands; it says "effective" so Hired Swords / animals are presumably
  excluded per the rules).
- Table of Quantity → Total → Rate/shard for 1..N shards (for 5 models: 1=40, 2=55, 3=70,
  4=80 gc), input **Shards to sell**, warning "Selling fewer shards at a time yields more gold
  per stone. Wyrdstone can only be sold once between battles — choose your amount carefully."
  **Sell Shards**. After selling, the header shows "Can sell again after next battle".

### Second battle (Wyrdstone Hunt) — quick run to reach a level-up
- No OOA on either side → Stage 1 shows "No Casualties — All warriors fought bravely and escaped
  without serious injury." with just Continue to Experience.
- Recorded +2 XP "Winning leader" on Test Captain in-battle (XP Gained accepts any integer), +1
  survivors' bonus → Captain 22 → 25, crossing the 24 threshold. Dashboard after submit:
  rating 59 → **66**, "Victory — Wyrdstone Hunt · 0 GC · 2 wyrdstone · 0 injured · 0 dead",
  and **Bestow Advancements** became enabled.
- Wyrdstone sale of 2 shards for 55 gc: gold 310 → **365**, shards 4 → 2, header now says
  "Can sell again after next battle" (and 2 more shards arrived from battle 2 → 4 again).

### Bestow Advancements (level-ups)
- Modal **"The Fates Converge — Advancement Pending"**: lists every hero / henchman group that
  has crossed an XP threshold (Captain 25 XP, Youngblood 2 XP, both henchman groups at 2 XP;
  the Champion at 10 XP was correctly *not* listed — next hero threshold is 11). Each row:
  name, "Hero: <type>" or "Group N — <type> (×n)", Current Experience, **Advancement Rank:
  Unproven**, **Select for Advancement**.
- Select → **"Cast the Dice — Roll for Advancement"**: Die 1 / Die 2 dropdowns (1–6) + a
  **Random Roll** button (the one place the app *will* roll for you), Total, then **Confirm
  Roll**. "Back to Warriors" returns to the list.

### Roster Edit = "Manual Editing" (warning modal)
Rosters → Edit → modal: "Manual editing bypasses the campaign rules engine. It is intended only
for correcting data entry mistakes or implementing custom house rules agreed upon by your
campaign group." with pointers to the rules-driven paths: Campaign Manager (end-of-battle
sequence), The Treasury (buying/selling equipment), Warrior Recruiter (hiring). Cancel / Proceed
to Manual Editor. Good design: normal play goes through validated flows; an escape hatch
exists but is explicitly labelled.

### Advancement result → "New Skill Learned"
- Rolled 5+6 = 11 → the app resolved the Heroes advance table (10–12 = New Skill) and opened
  **"New Skill Learned"** (subject: Test Captain · Mercenary Captain · Rank: Unproven).
  Left column **Available Disciplines** = the skill tables this unit type may pick from
  (Combat / Shooting / Academic / Strength / Speed for a Mercenary Captain — comes from the
  `UnitTemplate` skill-table list). Right: discipline blurb + skill cards (name + full rule
  text: Combat Master, Expert Swordsman, Step Aside, Strike to Injure, …). Footer: Current
  Experience, **Dismiss**, **Learn Skill**. "Back to Roll" link.
- So the advance table (2–5 skill, 6 S/A, 7 WS/BS, 8 I/Ld, 9 W/T, 10–12 skill) and the
  per-table skill lists are data in the app; stat advances presumably show a choose-stat UI.

### Manual roster editor (`/warbands/{id}/edit`)
- Header: Warband name, Gold Crowns, Wyrdstone as raw inputs. **Heroes of the Damned**: per
  hero raw inputs for Name, Class/Type (free text, e.g. `witch_hunter_captain`), EXP,
  Level-ups, all 9 stats; Equipment / Skills / Spells / Injuries lists each with "+ Add"; Remove
  Hero; "+ Add Hero". Henchmen section below. Footer: **Discard Changes** / **Commit to
  Ledger**.
- Confirms injuries are applied to stats (late-flower shows M 3 after Leg Wound) and stored as
  a list; level-ups is a separate counter from EXP.

### Hired Swords (campaign Recruitment page, below Henchmen)
- Section **Hired Swords — 72 available**, searchable list; each row: name, hire cost (e.g.
  Beast Hunter 35 gc) with the **upkeep** shown underneath in small type (15 gc), Details /
  Recruit. The list is the full mordheimer.net hired-sword roster (Arabian Merchant, Bard,
  Beast Hunter, Beggar, Big Game Hunter, Black Orc Overseer, …) — not filtered by warband
  eligibility (same approach as the Trading Post: show restriction text rather than hide).
- After learning a skill the Captain disappeared from the "Advancement Pending" list — one
  pending advance per threshold crossed, consumed on resolution.

### Henchman advancement → "The Lad's Got Talent"
- Henchman group roll 6+6 = 12 → **"Fate Intervenes — The Lad's Got Talent!"**: "This Marksman
  leaves the group to forge their own path. The group will be disbanded." (group of 1 → whole
  group goes). Form: **Name your new hero**, **Select two skill lists** (checkbox cards for
  Academic / Combat / Shooting / Speed / Strength, "a hero must select exactly two paths of
  growth"), **Dismiss** / **Make Hero Advancement Roll** (the new hero immediately gets a hero
  advance roll, per the rules).
- So the henchman advance table (2–4 I, 5 S, 6–7 WS/BS, 8 A, 9 Ld, 10–12 talent) is implemented
  with the promotion side-effects (new Hero record, chosen skill tables, group disband/shrink).

### Printer-friendly roster (`/warbands/{id}/print`)
Plain white print layout: name, type, Gold, Wyrd Stones, **Veteran Pool** (the 2D6 recorded at
submission — so it's persisted on the warband), "Printed <date>", Special Rules, Heroes (stat
table, special rules, injuries with effect text incl. the note "This modifier is reflected in
the warrior's profile"), Henchmen groups, Print button.

### Stat advance UI
- Promoted hero's first roll 3+4 = 7 → modal **"The Path of the Tier I: Promoted Marksman
  Advance — Fate has cast the iron bones"**: shows the roll (7) → rule text "Choose one:
  increase WS or BS by +1.", then the warrior's full stat line with the eligible characteristics
  rendered as **highlighted clickable cells** ("Click a highlighted characteristic to apply the
  advance"); buttons **Dismiss without applying** / **Select a Characteristic**. Nice: the
  choice is made on the stat line itself. (Presumably racial maximums are enforced here too —
  not verified.)

### Roster after advancements (verification)
- Test Captain: EXP 25, Skills & Spells → **Combat Master**.
- **Promoted Marksman** now appears under HEROES (type MARKSMAN, EXP 2, BS 4 = 3 +1 from the
  advance, keeps the "Reikland Marksmen" unit special rule). HENCHMEN now "1 groups" (Group 1
  disbanded). Everything the wizard promised was applied to the persisted roster.

## Mapping to this repo

What the existing tracker has, vs. what `mordheim-simulator` already contains, vs. what we'd need to add.

| the existing tracker concept | Already in repo | To build / extract |
|---|---|---|
| Warband types (69) with unit types, min/max, cost, stats, skill tables, equipment lists, racial rules | `WarbandTemplate` / `UnitTemplate` / `EquipmentList` — 72 templates, 246 hero + 228 henchman types (`src/data/warbandTemplates/*`) | Add per-template `maxSize`, hero cap, starting-XP per unit type if missing; starting gold |
| Equipment catalogue (~250 items incl. Gromril/Ithilmar variants, restriction text, dice prices) | 120-item `Weapon` DB + material variants (`src/data/weapons/*`); full text in `rules/02-*.md` | Extract armour, misc equipment, animals, hired-sword-only items into a unified `Item` type with `price` (fixed / dice expression), `rarity`, `restrictionText`, `category` |
| Skills catalogue by discipline with rule text | `src/data/skills.ts` (386 lines) + verbatim text in `rules/03-*.md` §Skills | Check coverage of warband-specific skill tables (e.g. Troll Slayer) |
| Serious injuries D66 + henchmen D6 with stat effects | Verbatim table in `rules/03-*.md` §Serious Injuries | Extract to data: `{roll, name, effectText, apply(warrior)}` |
| Experience thresholds (hero/henchman), advance tables, "lad's got talent" | Verbatim in `rules/03-*.md` §Experience | Extract thresholds + both advance tables; implement promotion side-effects |
| Exploration: shard yield table + doubles…six-of-a-kind chart with nested sub-rolls | Verbatim in `rules/03-*.md` §Income/§Exploration chart (~400 lines) | Extract to nested data; UI = the existing tracker's "location card + sub-roll + Mark Resolved" |
| Income chart (shards × warband size) | `rules/03-*.md` §Income | Extract table; "effective size" rule |
| Trading: rarity roll (2D6 ≥ rarity), one search per hero per post-battle, price entry | `rules/03-*.md` §Trading | Small state: `heroSearchedThisPhase[]`, `wyrdstoneSoldThisPhase` |
| Hired Swords (72) with hire/upkeep, stats, restrictions, skill tables | `rules/03-*.md` §Hired Swords (list) | Extract to `HiredSwordTemplate` |
| Scenarios (~100) with blurb + full rules markdown, settings | `rules/03-*.md` §Scenarios (index only — narrative write-ups not scraped) | Scrape/collect full scenario texts if we want the library; otherwise ship the core rulebook scenarios only |
| Warband rating = 5/model + XP (hired swords/large creatures per rules) | Not in repo | Trivial function |
| Combat odds calculator | **Yes — the whole existing simulator** | Embed as a "tactical" tab inside a battle (the existing tracker has nothing like it — a differentiator) |

### Data model (proposed, mirroring what the existing tracker exposes)

- `Warband { id, name, typeId, gold, wyrdstone, veteranPool, stash: Item[], heroes: Hero[], henchmenGroups: HenchmanGroup[], hiredSwords: HiredSword[], notes }`
- `Hero { id, name, unitTypeId, stats, xp, levelUps, skills[], spells[], injuries[], equipment: Item[], skillTables[], notes }`
- `HenchmanGroup { id, name, unitTypeId, size, stats, xp, equipment[] }`
- `Campaign { id, name, inviteCode, gmUserId, rules: markdown, memberships: [{warbandId, joinedAt}] }`
- `Match { id, campaignId, scenarioId, participantWarbandIds[], state: scheduled|in_progress|awaiting_reports|completed|cancelled, reports: MatchReport[] }`
- `MatchReport { warbandId, won, xpLog: [{warriorId, reason, amount}], ooa: [{warriorId|groupId, count}], injuries: [{warriorId, roll, result}], loot: {gold, wyrdstone, treasure[]}, exploration: {diceTotal, multiples, locationResults[]}, veteranPoolRoll, notes }`
- `Challenge { campaignId, fromWarbandId, toWarbandIds[], scenarioId, acceptances[] }`

### Architecture decision for our build

- the existing tracker is server-backed (Go API + Postgres presumably) with accounts, invite codes, and two
  players filing reports for one match. Multi-player sync is core to its campaign features.
- Recommended for us: keep the existing **local-first, client-only** app for the single-player
  slice (roster builder, post-battle wizard, advancements, trading, printing) reusing all the
  data above, and add a thin sync layer later (e.g. a small hosted DB or export/import of
  `MatchReport` JSON between players) if the group wants the GM/challenge features. That keeps
  the head start intact and avoids building auth on day one.

### UX patterns worth copying

1. **Player rolls, app resolves**: dice inputs everywhere (D66 dropdowns, 2D6 total, "Random
   Roll" only as an optional button). Keeps the tabletop feel and avoids arguments about RNG.
2. **Rules reference at the point of use** ("Chronicler's Cheat Sheet" under the injury step,
   equipment rule text inline on the battle sheet, scenario rules expander on the match).
3. **Guided 3-stage post-battle wizard** with "Continue Later" persistence and a final,
   explicit "this is final" submission that applies all gains atomically.
4. **Threshold-gated advancement** ("2 XP to next level" on the roster; "Bestow Advancements"
   only enabled when something is pending).
5. **Manual-edit escape hatch** clearly labelled as bypassing the rules engine.
6. **Per-warband campaign context** (a roster can be in a campaign; campaign-scoped gold/XP
   history is really the roster's state, campaign just scopes matches).
7. Restriction text shown rather than filtering the catalogue (simpler, and house rules vary).

### Gaps / things the existing tracker does not do (opportunities)
- No wound/turn/rout tracking in the battle helper (landing copy oversells it).
- No automatic scenario XP (winning leader etc.) — player adds "deeds" manually.
- No hero rarity-roll bookkeeping visible after "Item Not Found" (didn't verify hero exclusion).
- No combat odds / probability tooling — we already have that.
- Catalogue and hired swords not filtered by warband eligibility.

## Test data left on Tom's account (delete when done)

- Campaign **"ZZ TEST Campaign (delete me)"** (invite `grim-wolf-33`, id `c39e0750-…`) — 2
  completed matches.
- Rosters **"ZZ TEST Warband A (delete me)"** (Reikland, id `62a8c6b7-…`) and **"ZZ TEST Warband
  B (delete me)"** (Witch Hunters, id `3132b20a-…`).
- Nothing else was modified. Existing rosters/campaign untouched.

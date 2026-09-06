// The field manual: one page of short, plain-English sections with anchors, so a link like
// /help#moving-over lands on the right heading. Written for the group, not for developers.

import { useEffect, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { PageHeader } from '../../ui'
import { usePageTitle } from '../onboarding/usePageTitle'

const SECTIONS = [
  { id: 'warbands', title: 'Warbands' },
  { id: 'campaigns', title: 'Campaigns' },
  { id: 'matches', title: 'Matches' },
  { id: 'post-battle', title: 'Post-battle report' },
  { id: 'between-battles', title: 'Between battles' },
  { id: 'records', title: 'Battle records and CSV export' },
  { id: 'simulator', title: 'Simulator' },
  { id: 'map', title: 'Map campaigns' },
  { id: 'moving-over', title: 'Moving from another tracker' },
  { id: 'house-rules', title: "Default house rules" },
] as const

export function HelpPage() {
  usePageTitle('Help')
  const { hash } = useLocation()

  // The router does not scroll to fragments on its own.
  useEffect(() => {
    const id = hash.replace(/^#/, '')
    if (!id) return
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ block: 'start' })
    el.focus({ preventScroll: true })
  }, [hash])

  return (
    <>
      <PageHeader eyebrow="Field manual" title="Help" description="How the ledger works, in the order a campaign happens." aside={<BackLink />} />

      <nav aria-label="Sections" className="rounded-md border border-border bg-surface-low px-4 py-3">
        <ol className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <Link to={`#${s.id}`} className="inline-flex min-h-9 items-center text-sm text-brass underline-offset-4 hover:underline">
                {s.title}
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <Topic id="warbands" title="Warbands">
        <P>
          <B>Build.</B> From the Warbands tab, tap <Go to="/warbands/new">New warband</Go>, pick a type and hire from its list. The builder tracks gold, the
          rating and the minimum and maximum of each warrior type; buy equipment from the warband's own list and finalise when the roster is legal. A
          half-finished draft survives a locked phone; it waits on the Warbands tab until you continue or discard it.
        </P>
        <P>
          <B>Edit.</B> Everyday changes (trading, recruiting, advances) go through their own screens so the rules are applied and logged. The{' '}
          <em>manual editor</em> on the roster page changes anything directly and is logged as a manual edit. Use it for corrections and for rebuilding a
          roster that already has history.
        </P>
        <P>
          <B>Read.</B> Hover over (or tap) any weapon, armour, skill or spell on a roster for its rules. Each warrior's experience shows as a row of pips,
          one per point, with a taller node at every advance box; filled pips are earned and a brass pill means an advance is owed. Characteristics above
          the starting profile show in green, below it in red. Two pistols read as a brace; armour and a shield each show the save they make together.
          Henchman groups can carry a name for each model (manual editor › Model names), shown on the card and the printed sheet. The
          <em> History</em> section at the foot of the roster lists everything that has changed it, manual edits included.
        </P>
        <P>
          <B>Templates.</B> <em>More › Save as template</em> on a roster keeps its warband type, warriors and kit. <Go to="/warbands/new">New warband</Go>{' '}
          lists your templates at the top; starting from one rebuilds the roster at today's list prices with the campaign's starting gold.
        </P>
        <P>
          <B>Print.</B> The roster page has a printer-friendly sheet: black on white, one warband per page, with room for notes.
        </P>
      </Topic>

      <Topic id="campaigns" title="Campaigns">
        <P>
          <B>Join with a code.</B> The GM shares an eight-character code (or a link). Go to <Go to="/campaigns/join">Join with a code</Go>, type it in any
          shape, then choose which of your warbands takes the field. A warband plays in one campaign at a time.
        </P>
        <P>
          <B>Your name in a campaign.</B> The campaign page has a box for the name the other players see in that campaign only; leave it blank to use
          your account name. The GM can set anyone's from Settings › Members.
        </P>
        <P>
          <B>GM settings.</B> Whoever starts a campaign runs it. Settings hold the starting gold, an optional roster cap, whether players roll their own dice,
          the house-rule switches and a free-text rules page written in Markdown. The GM can also regenerate the invite code, remove a warband, edit any
          roster (logged as a GM edit) and archive the campaign.
        </P>
        <P>
          <B>House rules.</B> Four switches cover the group's usual variations; the current set is listed on the campaign page. Half-price armour is
          applied automatically in the trading post and the Rabbit&apos;s Foot switch in the exploration step; the other two are for the table to remember.
          <em>Bans</em> remove items, spells, hired swords, Dramatis Personae or skills from the campaign: banned entries disappear from the trading post,
          spell tables, the hire sheet and skill pickers, and a roster that already holds one shows a warning. Anything else goes in the campaign rules text.
        </P>
        <P>
          <B>Moving to another campaign.</B> The warband page has <em>Move to another campaign</em> for owners: type the new campaign&apos;s invite code
          and the warband leaves its current campaign and joins the new one in one step. Battle records stay with the campaign they were fought in, and the
          old membership is kept in the history rather than deleted. A warband in no campaign simply joins.
        </P>
      </Topic>

      <Topic id="matches" title="Matches">
        <P>
          <B>Schedule or challenge.</B> The GM books a battle between any enrolled warbands with everyone pre-accepted. A player issues a challenge with one
          of their own warbands; the others accept or decline from the campaign page. Pick a scenario from the library, a custom one, or leave it to be
          decided at the table.
        </P>
        <P>
          <B>Battle helper.</B> Once the match starts each player gets a sheet for their warband: enemies taken out of action per warrior (for experience),
          your own casualties, wyrdstone found, loot, the turn, the rout state and notes. The scenario rules and the other warbands' stat lines are a tap away. Saves
          sync to every phone at the table.
        </P>
        <P>
          <B>Attack calculator.</B> The <em>Attack</em> tab of the battle sheet picks one of your warriors and one enemy model and shows the exact odds for
          this phase: the roll needed to hit, to wound and their armour save for each weapon, what a wound does on the injury chart, and the chance of a knock
          down, a stun or an out of action across every attack, with parries, criticals and the campaign&apos;s house rules already counted. Choose the weapon in
          each hand and tick the situation (charging, mounted, moved and shot, cover, long range, a repeater&apos;s single shot). Cloaks, amulets, a Peg Leg,
          a Lucky Charm and the weapons&apos; own quirks (a Starblade&apos;s 4+ parry, a Sigmarite Warhammer against the Undead, an Ogre Club swung two-handed) are
          in the numbers. Poisons, drugs and special ammunition a warrior carries appear under <em>Taken or applied this battle</em>: tick them and the odds
          change, and the report uses them up. <em>Roll it through</em> then walks real dice step by step, telling you what each roll needs and what it did,
          and an out of action result can be logged straight to that warrior&apos;s <em>Enemies out</em> tally. Kit the engine cannot model is listed under
          the odds so you can apply it at the table. Wardogs and Gnoblar Fighters appear on the sheet and in the calculator as models of their own: a Wardog
          counts for rout tests, a Gnoblar never does, and both roll a henchman&apos;s die for injury afterwards. Drugs and poisons a warrior took, a leader&apos;s
          silk clothes, a Treasure Map or a wish from a Lamp carry their own roll after the game, under <em>Kit after the battle</em> in the injuries step.
        </P>
        <P>
          <B>Shared combat log.</B> When a fight in the calculator ends, <em>Log to both sheets</em> records it once for the whole table: the kill lands on the
          attacker&apos;s sheet and the Wound or casualty on the target&apos;s, on every phone at once. The <em>Log</em> tab lists every entry; anyone at the table
          can revert a mistake, and the entry stays there struck through with the reason.
        </P>
        <P>
          <B>App calculates or players calculate.</B> Whoever starts the game picks how combat is scored: with the attack calculator, or tally sheets only, the
          tally-sheet way. The campaign settings set the default and can lock it so only the GM changes it.
        </P>
        <P>
          <B>Battle over.</B> When the game ends, tap <em>Battle over</em>. The match moves to awaiting reports and each player files their own post-battle
          report. Forgot to tap it? Filing a report closes the battle too.
        </P>
              <P>
          <B>Before the battle.</B> Warbands with Tarot Cards, the Blessing of the Lady, a Dreamer or a Runesmith get a box on the battle sheet to roll
          those tests and record the result; the tarot reading carries through to the exploration step.
        </P>
        <P>
          <B>Rout check.</B> Once a quarter of your starting models are out of action the battle sheet shows a Rout check box: roll the 2D6 in the
          app against a chosen Leadership (the leader while he stands, otherwise the best standing warrior), record a test passed at the table, or
          declare the rout. A failed roll marks the warband routed and offers to end the battle. The app does not track turns, so it reminds rather
          than forces.
        </P>
</Topic>

      <Topic id="post-battle" title="Post-battle report">
        <P>The report is an eight-step wizard, pre-filled from your battle sheet. You can leave part-way and come back; it remembers where you were.</P>
        <P>
          <B>Suggested, not forced.</B> The wizard tells you how many exploration dice the rulebook gives you, but you roll as many as your skills, kit, map
          bonuses or house rules say, with a reason. The same goes for injuries: tick <em>No injury roll needed</em> when a skill or item spares a warrior, or roll a
          different number of dice for a henchman group. Every such change is logged on the report and shows as <em>Adjusted</em> in the records. Bonus experience for
          scenario objectives works the same way: add a line with a reason. At the trading post and when hiring, <em>Override the cost</em> lets you pay a different
          price with a reason, which the campaign's activity feed records.
        </P>
        <P>
          <B>Advances.</B> Any advance earned in the battle can be rolled right there in the wizard. If the roll is a new skill or spell and you want time to think,
          tap <em>Pick the skill later</em>: the roll is kept and the choice waits under <em>Bestow advancements</em> on the roster page, highlighted until it is
          made. Leave the whole advance for later if you prefer; nothing is forced.
        </P>
        <P>
          <B>Approval and amendments.</B> If the campaign setting <em>Reports need GM approval</em> is on, a player's report waits, applying nothing, until the GM
          approves it or returns it with a note to file again. The GM can also <em>amend</em> a filed report: the old version's roster changes are undone, the new
          ones applied, and the previous version kept in a change log with the GM's note. The record shows <em>Amended by GM</em>.
        </P>
        <Steps
          items={[
            'Outcome: won, lost or drawn, and whether you routed.',
            'Casualties: confirm who went out of action.',
            'Injuries: roll D66 for each hero and D6 for each henchman that went down, and enter the result. The chart is shown underneath.',
            'Experience: survival, winning leader, enemies taken out and any scenario deeds, itemised per warrior.',
            'Exploration: enter your dice; multiples and location sub-rolls are worked out and the wyrdstone counted.',
            'Veterans: the pool for hiring experienced henchmen later, if the campaign uses it.',
            'Review and submit: the whole report on one screen. Submitting is final and applies everything to the roster at once.',
          ]}
        />
        <P>
          <B>Rolls are yours.</B> Every dice step takes the number you rolled at the table. If nobody objects, <em>Roll for me</em> rolls it in the app and
          records that it did. Advances earned during the report are queued, not resolved; see the next section.
        </P>
      </Topic>

      <Topic id="between-battles" title="Between battles">
        <P>
          <B>Advances.</B> When a warrior crosses an experience box the roster shows an advance owed. Open Advances from the roster, roll 2D6 (or have the
          app roll), then pick a skill from the warrior's tables or take the stat increase. Henchmen who roll "The lad's got talent" become heroes; the
          follow-up rolls are queued for you.
        </P>
        <P>
          <B>Trading post.</B> Buy common items at list price, search for rare items once per hero per trading phase, sell wyrdstone by the size band and
          manage the stash. A hero whose list lets him do something instead of searching (brew Dark Venom, rob travellers, run a con, sell from the Trade
          Wagon) finds it under <em>Instead of searching</em> on the Characters tab; it uses up his search. Half-price armour is applied here when the house rule is on. Prices and rarities follow the buyer where the rules say so (a Skink
          hero&apos;s Black Lotus, a priest&apos;s Holy Relic, the Gunnery School&apos;s handguns), and when the rules say a warrior may not have something (Heroes-only
          kit on a henchman, a Dwarf with an obsidian blade, a third hand weapon, a shield over Toughened Leathers) the shop says so and asks for a reason
          before selling anyway. Kit that fuses to its wearer stays put; Toughened Leathers cannot be sold back.
        </P>
        <P>
          <B>Recruitment.</B> Mutations and Blessings of Nurgle are bought with the recruit on the hire sheet, the first at its listed price and later
          ones double, since the rules allow them at no other time. Hire new heroes and henchmen against the warband's limits, add warriors to an existing group, dismiss warriors, and hire hired
          swords (their upkeep is paid here too). Restrictions are shown rather than hidden; the app warns and lets you decide.
        </P>
              <P>
          <B>Searching.</B> Heroes taken out of action cannot look for rare items; the trading post greys them out. The Characters tab sends heroes
          looking for a Dramatis Persona instead (a D6 under Initiative finds them) and hires the one you find. Mordheim Maps are graded when bought;
          maps, a Wyrdstone Pendulum, Tarot Cards and (unless the house rule says otherwise) a Rabbit&apos;s Foot offer their re-rolls in the exploration
          step, one die at a time, with the record kept.
        </P>
        <P>
          <B>A dead leader.</B> The warband page offers the successors the list names and re-templates the hero you choose as the leader.
        </P>
        <P>
          <B>Warband rules the app now applies.</B> Animals, undead, daemons and constructs gain no experience; Ogres cross their advance boxes at
          double cost; units their list says are never promoted send The lad&apos;s got talent back for a re-roll; Trolls make no injury roll and
          want feeding after every battle (Hired swords tab); Hobgoblins and Snotlings die or leave on wider dice; Dwarfs and Druchii find an extra
          shard; Grave Robbers earn gold per enemy out of action; Ogres eat for two and Snotling mobs count as one when selling wyrdstone;
          Marienburgers start with 600 gc and add +1 to rare rolls. Where a list forbids a hired sword or a piece of kit, the hire button says so and
          the roster page lists the offending item; you can still act against it, with a reason, and the log keeps it.
        </P>
</Topic>

      <Topic id="records" title="Battle records and CSV export">
        <P>
          Every campaign page links to its battle records: each finished match with the scenario, who fought, who won and each side's report (gold,
          wyrdstone, injuries, deaths, experience). Filter by warband or scenario and tap <em>Export CSV</em> to download a spreadsheet of everything shown.
          The GM can withdraw a report so a player can refile it; roster changes already applied stay and are listed in the activity log.
        </P>
      </Topic>

      <Topic id="simulator" title="Simulator">
        <P>
          <B>Any two warriors.</B> <Go to="/simulator">Simulator</Go> puts one warrior against another and shows the exact odds of the phase: to hit,
          to wound, their save, what a wound does, who strikes first and the chance of at least one hit, a wound through, knocked down, stunned or out of
          action. Each side is a warrior from one of your warbands, a warrior from another roster in one of your campaigns, or any published unit type
          with kit ticked from its list and skills added by hand. Choose the weapon, the other hand and the situation (charging, high ground, and so on)
          just as on the battle calculator.
        </P>
        <P>
          <B>Stat gains and skill gains.</B> The two other tabs answer the advance question. <em>Stat gains</em> adds one to each characteristic in turn
          and shows how much the chosen figure moves, attacking and defending. <em>Skill gains</em> does the same for every modelled skill the warrior could
          still take, ranked best first; untick <em>Only skills on the lists</em> to see the rest. Conditional skills count only when their situation is
          ticked. House rules follow whichever campaign you pick or the group defaults. Nothing here is rolled or saved.
        </P>
      </Topic>

      <Topic id="map" title="Map campaigns">
        <P>
          <B>Turn it on.</B> The GM ticks <em>Play on the Mordheim Campaign Map</em> in the campaign settings. From then on every battle is booked in one of
          the thirty districts, the campaign page shows a map card, and <em>Open the map</em> leads to the map itself: drag to pan, scroll or pinch to
          zoom, tap a district for its advantage, who holds it and its borders.
        </P>
        <P>
          <B>Exploring and footholds.</B> Everyone enters through one of the four gates, so a new warband&apos;s first battle is at a gate. Fighting in a
          district explores it; from an explored district that connects back to a gate a warband can reach its neighbours. Winning a battle in a district
          gives a foothold there and takes the loser&apos;s away; a warband with the only foothold controls the district. Footholds bring the district&apos;s
          advantage, except in <em>Hard Fought</em> districts where only the controller benefits. Winning in an <em>Abundance of Wyrdstone</em> district is
          worth D3 extra shards. All of this follows from the reports filed in the app; the GM can correct a district (a game played off the app, a mistake)
          with a reason that goes on the record.
        </P>
        <P>
          <B>Booking a battle.</B> The schedule form lists districts by who can reach them and says when a side cannot, what the map rules call for
          (Surprise Attack when one side controls the district, Defend the Find when both have footholds; one tap picks it) and the tolls: 5 gc at a gate
          without a foothold, and 2D6 gc to whoever controls the Middle Bridge when it is the only way through. The match page shows the district and lets
          the GM or a participant move it while the battle is open. The advantages a warband holds are applied where they bite: extra exploration dice, the
          Abundance D3, a temple&apos;s Full Recovery roll and the third veteran die in the report; half prices, the rare-roll bonus and resale at cost in the
          trading post and recruitment; a chosen spell on the advances screen. Each is labelled with its district. The rest of the report will
          apply them in a later phase.
        </P>
      </Topic>

      <Topic id="moving-over" title="Moving from another tracker">
        <P>
          <B>Rosters.</B> Open the roster's printer-friendly page in the old tracker (or, as GM, another player's warband from its campaign details
          panel), select all the text, copy it, and paste it into <Go to="/warbands/import">Import a roster</Go>. The app reads the treasury, every hero,
          henchman group and hired sword with their experience, characteristics, kit, skills, spells and injuries, and shows anything it could not match for
          you to fix before it creates the warband. The importer owns it; <em>Hand over to another player</em> on the roster page passes it on once its player
          has signed up.
        </P>
        <P>Moving a running campaign over is a two-part job. Nothing is copied automatically from the old tracker, so each player does their own roster.</P>
        <Steps
          items={[
            'Rebuild the roster with the builder as if it were new: same warband type, same warriors and groups, roughly the same kit. Do not worry about gold at this stage.',
            'Open the manual editor on the roster and set what the builder could not: each warrior’s experience, injuries and stat changes, the treasury, wyrdstone, and any items bought since. Save; the edit is logged as manual so everyone knows where the history starts.',
            'Join the group’s campaign with the rebuilt warband using the invite code.',
            'The GM exports the battle records from the old tracker as CSV and imports them from the campaign page (Import battle records). Past matches then appear in the records with the right winners and dates.',
          ]}
        />
        <P>Check the roster against the old sheet once, especially skills and experience, before the first new battle. After that the ledger keeps score.</P>
      </Topic>

      <Topic id="house-rules" title="Default house rules">
        <P>These are the defaults every new campaign starts with; a GM can change them in Settings.</P>
        <ul className="flex flex-col gap-1.5 pl-5 text-sm leading-relaxed text-ink marker:text-ink-dim">
          <li className="list-disc">Strength does not erode armour saves: a high-Strength hit never reduces the save.</li>
          <li className="list-disc">The optional critical hit tables are on: criticals use the per-weapon-type charts, not the single core chart.</li>
          <li className="list-disc">Armour costs half its listed price, rounded down. Shields, bucklers and helmets stay at full price.</li>
          <li className="list-disc">A Rabbit&apos;s Foot re-rolls one die during the battle only; no exploration re-roll.</li>
          <li className="list-disc">Nothing is banned until the GM says so; Nurgle&apos;s Rot is the usual first entry.</li>
        </ul>
        <P>Anything beyond these switches lives in the campaign rules text, which the GM writes and everyone can read from the campaign page.</P>
      </Topic>
    </>
  )
}

function BackLink() {
  return (
    <Link to="/account" className="inline-flex min-h-11 items-center px-2 text-sm text-brass underline-offset-4 hover:underline">
      Account
    </Link>
  )
}

function Topic({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} tabIndex={-1} className="scroll-mt-4 font-headline text-2xl leading-tight text-ink outline-none">
        {title}
      </h2>
      {children}
    </section>
  )
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-relaxed text-ink-dim">{children}</p>
}

function B({ children }: { children: ReactNode }) {
  return <strong className="font-medium text-ink">{children}</strong>
}

function Go({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="text-brass underline-offset-4 hover:underline">
      {children}
    </Link>
  )
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="flex flex-col gap-2 pl-6 text-sm leading-relaxed text-ink marker:marker:text-brass">
      {items.map((item) => (
        <li key={item} className="list-decimal">
          {item}
        </li>
      ))}
    </ol>
  )
}

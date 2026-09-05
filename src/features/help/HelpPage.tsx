// The field manual: one page of short, plain-English sections with anchors, so a link like
// /help#from-relic-and-ruin lands on the right heading. Written for the group, not for developers.

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
  { id: 'from-relic-and-ruin', title: 'From Relic & Ruin' },
  { id: 'house-rules', title: "House rules of Tom's group" },
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
          <B>Print.</B> The roster page has a printer-friendly sheet: black on white, one warband per page, with room for notes.
        </P>
      </Topic>

      <Topic id="campaigns" title="Campaigns">
        <P>
          <B>Join with a code.</B> The GM shares an eight-character code (or a link). Go to <Go to="/campaigns/join">Join with a code</Go>, type it in any
          shape, then choose which of your warbands takes the field. A warband plays in one campaign at a time.
        </P>
        <P>
          <B>GM settings.</B> Whoever starts a campaign runs it. Settings hold the starting gold, an optional roster cap, whether players roll their own dice,
          the house-rule switches and a free-text rules page written in Markdown. The GM can also regenerate the invite code, remove a warband, edit any
          roster (logged as a GM edit) and archive the campaign.
        </P>
        <P>
          <B>House rules.</B> Three switches cover the group's usual variations; the current set is listed on the campaign page. Half-price armour is
          applied automatically in the trading post; the other two are for the table to remember. Anything else goes in the campaign rules text.
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
          each hand and tick the situation (charging, moved and shot, cover, long range). <em>Roll it through</em> then walks real dice step by step, telling
          you what each roll needs and what it did, and an out of action result can be logged straight to that warrior&apos;s <em>Enemies out</em> tally.
          Kit the engine cannot model (custom items, most miscellaneous gear) is listed under the odds so you can apply it at the table.
        </P>
        <P>
          <B>App calculates or players calculate.</B> Whoever starts the game picks how combat is scored: with the attack calculator, or tally sheets only, the
          Relic &amp; Ruin way. The campaign settings set the default and can lock it so only the GM changes it.
        </P>
        <P>
          <B>Battle over.</B> When the game ends, tap <em>Battle over</em>. The match moves to awaiting reports and each player files their own post-battle
          report. Forgot to tap it? Filing a report closes the battle too.
        </P>
      </Topic>

      <Topic id="post-battle" title="Post-battle report">
        <P>The report is an eight-step wizard, pre-filled from your battle sheet. You can leave part-way and come back; it remembers where you were.</P>
        <P>
          <B>Suggested, not forced.</B> The wizard tells you how many exploration dice the rulebook gives you, but you roll as many as your skills, kit, map
          bonuses or house rules say, with a reason. Every such change is logged on the report and shows as <em>Adjusted</em> in the records. Bonus experience for
          scenario objectives works the same way: add a line with a reason.
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
          manage the stash. Half-price armour is applied here when the house rule is on.
        </P>
        <P>
          <B>Recruitment.</B> Hire new heroes and henchmen against the warband's limits, add warriors to an existing group, dismiss warriors, and hire hired
          swords (their upkeep is paid here too). Restrictions are shown rather than hidden; the app warns and lets you decide.
        </P>
      </Topic>

      <Topic id="records" title="Battle records and CSV export">
        <P>
          Every campaign page links to its battle records: each finished match with the scenario, who fought, who won and each side's report (gold,
          wyrdstone, injuries, deaths, experience). Filter by warband or scenario and tap <em>Export CSV</em> to download a spreadsheet of everything shown.
          The GM can withdraw a report so a player can refile it; roster changes already applied stay and are listed in the activity log.
        </P>
      </Topic>

      <Topic id="from-relic-and-ruin" title="From Relic & Ruin">
        <P>Moving a running campaign over is a two-part job. Nothing is copied automatically from Relic & Ruin's rosters, so each player does their own.</P>
        <Steps
          items={[
            'Rebuild the roster with the builder as if it were new: same warband type, same warriors and groups, roughly the same kit. Do not worry about gold at this stage.',
            'Open the manual editor on the roster and set what the builder could not: each warrior’s experience, injuries and stat changes, the treasury, wyrdstone, and any items bought since. Save; the edit is logged as manual so everyone knows where the history starts.',
            'Join the group’s campaign with the rebuilt warband using the invite code.',
            'The GM exports Battle Records from Relic & Ruin as CSV and imports them from the campaign page (Import battle records). Past matches then appear in the records with the right winners and dates.',
          ]}
        />
        <P>Check the roster against the old sheet once, especially skills and experience, before the first new battle. After that the ledger keeps score.</P>
      </Topic>

      <Topic id="house-rules" title="House rules of Tom's group">
        <P>These are the defaults every new campaign starts with; a GM can change them in Settings.</P>
        <ul className="flex flex-col gap-1.5 pl-5 text-sm leading-relaxed text-ink marker:text-ink-dim">
          <li className="list-disc">Strength does not erode armour saves: a high-Strength hit never reduces the save.</li>
          <li className="list-disc">The optional critical hit tables are on: criticals use the per-weapon-type charts, not the single core chart.</li>
          <li className="list-disc">Armour costs half its listed price, rounded down. Shields, bucklers and helmets stay at full price.</li>
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
      <h2 id={id} tabIndex={-1} className="scroll-mt-4 font-headline text-2xl font-semibold leading-tight text-ink outline-none">
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
    <ol className="flex flex-col gap-2 pl-6 text-sm leading-relaxed text-ink marker:font-mono marker:text-brass">
      {items.map((item) => (
        <li key={item} className="list-decimal">
          {item}
        </li>
      ))}
    </ol>
  )
}

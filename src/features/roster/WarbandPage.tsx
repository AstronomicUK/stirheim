import { SuccessorCommandCard } from './view/SuccessorCommandCard'
import { LeaderWaitingCard } from './view/LeaderWaitingCard'
import { collapsedWarbandReason } from '../../rules/resolve/leaderReplacement'
import { useRosterEvent } from '../../api/rosterEvents'
import { NecrarchSuccessionCard } from './view/NecrarchSuccessionCard'
import { LustrianPromotionCard } from './view/LustrianPromotionCard'
import { ExplorationBooksCard } from './view/ExplorationBooksCard'
import { RockTomeCard } from './view/RockTomeCard'
import { PirateUpkeepCard } from './view/PirateUpkeepCard'
import { HenchmanUpkeepCard } from './view/HenchmanUpkeepCard'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { usePendingAdvances } from '../../api/advances'
import { useSaveTemplate } from '../../api/templates'
import { useDeleteWarband, useProfiles, useTransferWarband, useUpdateRoster, useWarband, type WarbandDetail } from '../../api/warbands'
import { useWarbandCampaign } from '../../api/trading'
import { useMoveWarbandCampaign, useMyCampaigns } from '../../api/campaigns'
import { rosterToTemplatePayload } from '../../rules/resolve/warbandTemplates'
import { appointLeader, successionOptions } from '../../rules/resolve/succession'
import type { WarbandTemplate } from '../../rules/types'
import { useSession } from '../../app/session'
import { findWarbandTemplate } from '../../rules/data/warbandTemplates'
import { warbandRating } from '../../rules/resolve/rating'
import { validateRoster, warbandHeroCount, warbandModelCount } from '../../rules/resolve/roster'
import { unsuppliedAddicts } from '../../rules/resolve/addiction'
import { ActionTile, Button, Notice, SelectField, Sheet, Spinner, TextField, TwoColumn } from '../../ui'
import { BUTTON_BASE, BUTTON_VARIANTS } from '../../ui/buttonStyles'
import { unitTypeName, warbandTypeName } from './shared/names'
import { Card, ItemLines, KeyValue, Section, Tag } from './view/bits'
import { GroupCard } from './view/GroupCard'
import { itemsByHolder } from './view/lookups'
import { WarriorCard } from './view/WarriorCard'
import { RosterViewContext } from './view/context'
import { WarbandHistory } from './view/WarbandHistory'
import { ImportFixups } from './view/ImportFixups'
import { ImportQuestions } from './view/ImportQuestions'
import { GrimoireCard } from './view/GrimoireCard'
import { HiredRosterRepairCard } from './view/HiredRosterRepairCard'
import { HiredUpkeepCard } from './view/HiredUpkeepCard'
import { TradeWagonCard } from './view/TradeWagonCard'
import { CaptiveCard } from './view/CaptiveCard'
import { PitFightCard } from './view/PitFightCard'
import { PendingBattleCard } from './view/PendingBattleCard'
import { usePageTitle } from '../onboarding/usePageTitle'


export function WarbandPage() {
  const { id } = useParams<{ id: string }>()
  const query = useWarband(id)

  if (query.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Spinner label="Loading the roster" />
      </div>
    )
  }
  if (query.isError) {
    return (
      <>
        <Notice tone="error" title="Could not load this warband">
          {query.error.message}
        </Notice>
        <Link to="/" className="text-brass underline-offset-4 hover:underline">
          Back to your warbands
        </Link>
      </>
    )
  }
  return <WarbandView detail={query.data} />
}

function WarbandView({ detail }: { detail: WarbandDetail }) {
  const { warband, heroes, groups, items, roster } = detail
  usePageTitle(warband.name)
  const navigate = useNavigate()
  const user = useSession((s) => s.user)
  const update = useUpdateRoster(warband.id)
  const remove = useDeleteWarband()
  const [menuOpen, setMenuOpen] = useState(false)
  const [handOverOpen, setHandOverOpen] = useState(false)
  const [moveCampaignOpen, setMoveCampaignOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateSaved, setTemplateSaved] = useState(false)
  const saveTemplate = useSaveTemplate()
  const [confirmText, setConfirmText] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const template = useMemo(() => findWarbandTemplate(warband.type_rules_id), [warband.type_rules_id])
  const rating = useMemo(() => warbandRating(roster, template), [roster, template])
  const campaign = useWarbandCampaign(warband.id)
  const bans = campaign.data?.settings.houseRules.bans
  const problems = useMemo(() => (template ? validateRoster(roster, template, { bans }).problems : []), [roster, template, bans])
  const byHolder = useMemo(() => itemsByHolder(items), [items])

  const isOwner = user?.id === warband.owner_id
  // Between-battles flows are for whoever may write the roster; the GM's view stays read-only for now.
  const canEdit = isOwner
  const pending = usePendingAdvances(canEdit ? warband.id : undefined)
  const advancesDue = pending.data?.length ?? 0
  const activeHeroes = heroes.filter((h) => !h.is_hired_sword)
  const hiredSwords = heroes.filter((h) => h.is_hired_sword)
  const stash = byHolder.get('') ?? []

  async function toggleArchive() {
    setActionError(null)
    try {
      await update.mutateAsync({
        reason: 'archive',
        changes: [{ table: 'warbands', op: 'update', id: warband.id, data: { archived: !warband.archived } }],
      })
      setMenuOpen(false)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not update the warband.')
    }
  }

  async function confirmDelete() {
    setActionError(null)
    try {
      await remove.mutateAsync(warband.id)
      navigate('/', { replace: true })
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not delete the warband.')
    }
  }

  const deleteReady = confirmText.trim() === warband.name.trim()

  async function confirmSaveTemplate() {
    if (!user || !templateName.trim()) return
    setActionError(null)
    try {
      await saveTemplate.mutateAsync({ ownerId: user.id, name: templateName.trim(), typeRulesId: warband.type_rules_id, payload: rosterToTemplatePayload(roster) })
      setTemplateOpen(false)
      setTemplateSaved(true)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not save the template.')
    }
  }

  return (
    <>
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.25em] text-ink-dim">{warbandTypeName(warband.type_rules_id)}</p>
            <h1 className="font-headline text-3xl leading-tight text-ink">{warband.name}</h1>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 pt-1">
            {warband.archived ? <Tag>Archived</Tag> : null}
            {!isOwner ? <Tag tone="brass">GM view</Tag> : null}
          </div>
        </div>
      </header>

      <RosterViewContext.Provider value={{ houseRules: campaign.data?.settings.houseRules ?? null }}>
      <TwoColumn
        railFirst
        rail={
          <>
            {canEdit ? (
              <Section title="Between battles">
                <div className="grid grid-cols-3 gap-2 lg:grid-cols-2">
                  <ActionTile
                    to={`/warbands/${warband.id}/advances`}
                    icon="advances"
                    title="Advancements"
                    detail={advancesDue > 0 ? `${advancesDue} ${advancesDue === 1 ? 'advance' : 'advances'} to roll` : 'Nothing owed'}
                    count={advancesDue}
                    highlight={advancesDue > 0}
                    glow={advancesDue > 0}
                  />
                  <ActionTile to={`/warbands/${warband.id}/trade`} icon="trade" title="Trading post" detail={`${warband.gold} gc to spend`} />
                  <ActionTile to={`/warbands/${warband.id}/recruit`} icon="recruit" title="Recruit" detail="Heroes, henchmen, hired swords" />
                </div>
              </Section>
            ) : null}
            <div className="hidden lg:flex lg:flex-col lg:gap-3">
              <div className="grid grid-cols-2 gap-2">
                <ActionTile to={`/warbands/${warband.id}/edit`} icon="edit" title="Edit roster" detail="Manual changes, logged" />
                <ActionTile to={`/warbands/${warband.id}/print`} icon="print" title="Print sheet" detail="Roster on one page" />
              </div>
              <Button variant="secondary" block onClick={() => setMenuOpen(true)}>
                More…
              </Button>
            </div>
          </>
        }
      >
      <Card className="grid grid-cols-3 gap-y-4 px-4 py-3 md:grid-cols-6">
        <KeyValue icon="gold" label="Gold" value={`${warband.gold} gc`} />
        <KeyValue icon="wyrdstone" label="Wyrdstone" value={warband.wyrdstone} />
        <KeyValue icon="rating" label="Rating" value={rating.total} />
        <KeyValue icon="models" label="Models" value={warbandModelCount(roster)} />
        <KeyValue icon="heroes" label="Heroes" value={warbandHeroCount(roster)} />
        {warband.veteran_pool !== null ? <KeyValue icon="history" label="Veteran pool" value={warband.veteran_pool} /> : null}
      </Card>

      {canEdit ? <PendingBattleCard warbandId={warband.id} campaignId={campaign.data?.campaignId} userId={user?.id} /> : null}

      <ImportFixups detail={detail} canEdit={canEdit} />

      <ImportQuestions detail={detail} canEdit={canEdit} />

      {unsuppliedAddicts(detail.roster).length > 0 ? (
        <Notice tone="warn" title="Addicted heroes without a batch">
          <p>An addict needs a new batch of Crimson Shade before every battle, or he leaves. Nothing in kit or stash for: {unsuppliedAddicts(detail.roster).map((l) => l.heroName).join(', ')}.</p>
        </Notice>
      ) : null}
      {problems.length > 0 ? (
        <Notice tone="warn" title="Roster problems">
          <ul className="flex list-disc flex-col gap-1 pl-4">
            {problems.map((p, i) => (
              <li key={`${p.code}-${i}`}>{p.message}</li>
            ))}
          </ul>
        </Notice>
      ) : null}
      {canEdit && template && !warband.archived ? <SuccessionCard detail={detail} template={template} onError={setActionError} onRetire={toggleArchive} retiring={update.isPending} /> : null}

      <SuccessorCommandCard detail={detail} canEdit={canEdit} />
      <LeaderWaitingCard detail={detail} canEdit={canEdit} />
      <NecrarchSuccessionCard detail={detail} canEdit={canEdit} onError={setActionError} />
      <LustrianPromotionCard detail={detail} canEdit={canEdit} onError={setActionError} />
      <ExplorationBooksCard detail={detail} canEdit={canEdit} onError={setActionError} />
      <RockTomeCard detail={detail} template={template} canEdit={canEdit} onError={setActionError} />
      {(detail.roster.scenarioEffects?.raidCaptives??0)>0?<Card className="flex flex-col gap-2 px-4 py-3"><p className="font-medium">Raids resources</p><p className="text-sm">{detail.roster.scenarioEffects!.raidCaptives} captured resources available. Each can be spent once for an extra exploration die after a future battle.</p></Card>:null}
      <GrimoireCard detail={detail} template={template} canEdit={canEdit} onError={setActionError} />
      <HiredRosterRepairCard detail={detail} canEdit={canEdit} />
      <HiredUpkeepCard detail={detail} canEdit={canEdit} />
      <PirateUpkeepCard warbandId={detail.warband.id} gold={detail.roster.gold} enabled={canEdit && detail.roster.warbandTemplateId === 'pirates'} />
      <HenchmanUpkeepCard detail={detail} canEdit={canEdit} />
      {detail.roster.explorationDiscoveries && (detail.roster.explorationDiscoveries.catacombs || detail.roster.explorationDiscoveries.straggler || detail.roster.explorationDiscoveries.tunnels || detail.roster.explorationDiscoveries.freeHireReportId) ? <Card className="flex flex-col gap-2 px-4 py-3">
        <h3 className="font-semibold">Exploration discoveries</h3>
        {detail.roster.explorationDiscoveries.catacombs ? <p className="text-sm">Entrance to the Catacombs: permanently reroll one exploration die. Further entrances do not stack.</p> : null}
        {detail.roster.explorationDiscoveries.straggler ? <p className="text-sm">Straggler’s information: at your next exploration, roll one extra die and discard one.</p> : null}
        {detail.roster.explorationDiscoveries.tunnels ? <p className="text-sm">Catacombs: next battle, deploy up to three fighters at ground level at the end of your first turn, more than 8″ from enemies. Rat Ogres and Possessed cannot use the tunnels.</p> : null}
        {detail.roster.explorationDiscoveries.freeHireReportId && !detail.roster.hiredSwords.some(h=>h.flags.returningFavourReportId===detail.roster.explorationDiscoveries?.freeHireReportId) ? <p className="text-sm">Returning a Favour: recruit one eligible Hired Sword free for the next battle. Afterwards, dismiss them or pay normal upkeep.</p> : null}
      </Card> : null}

      <CaptiveCard detail={detail} campaignId={campaign.data?.campaignId} userId={user?.id} />
      <TradeWagonCard warbandId={detail.warband.id} userId={user?.id} />
      <PitFightCard detail={detail} canEdit={canEdit} onError={setActionError} />
      {rating.notes.length > 0 ? (
        <Notice tone="info" title="Rating notes">
          <ul className="flex list-disc flex-col gap-1 pl-4">
            {rating.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Notice>
      ) : null}
      {actionError ? <Notice tone="error">{actionError}</Notice> : null}
      {templateSaved ? (
        <Notice tone="success" title="Template saved">
          Start a new warband from it under New warband › Your templates.
        </Notice>
      ) : null}

      <Section title="Heroes" aside={`${activeHeroes.length}`}>
        {activeHeroes.length === 0 ? <p className="text-sm text-ink-dim">No heroes on the roster.</p> : null}
        {activeHeroes.map((h) => (
          <WarriorCard key={h.id} hero={h} equipment={byHolder.get(h.id) ?? []} template={template} />
        ))}
      </Section>

      {hiredSwords.length > 0 ? (
        <Section title="Hired swords" aside={`${hiredSwords.length}`}>
          {hiredSwords.map((h) => (
            <WarriorCard key={h.id} hero={h} equipment={byHolder.get(h.id) ?? []} template={template} />
          ))}
        </Section>
      ) : null}

      <Section title="Henchman groups" aside={`${groups.reduce((n, g) => n + g.size, 0)} models`}>
        {groups.length === 0 ? <p className="text-sm text-ink-dim">No henchman groups.</p> : null}
        {groups.map((g) => (
          <GroupCard key={g.id} group={g} equipment={byHolder.get(g.id) ?? []} template={template} />
        ))}
      </Section>

      <Section title="Stash">
        <Card className="px-4 py-3">
          <ItemLines items={stash} emptyText="The stash is empty." />
        </Card>
      </Section>

      <Section title="Notes">
        <Card className="px-4 py-3">
          {warband.notes ? <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{warband.notes}</p> : <p className="text-sm text-ink-dim">No campaign notes yet.</p>}
        </Card>
      </Section>

            <WarbandHistory warbandId={warband.id} />

      </TwoColumn>
      </RosterViewContext.Provider>

      <div className="mt-auto pt-2 lg:hidden">
        <div className="sticky bottom-0 -mx-5 flex gap-3 border-t border-border bg-surface px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <Link to={`/warbands/${warband.id}/edit`} className={`${BUTTON_BASE} ${BUTTON_VARIANTS.primary} flex-1 no-underline`}>
            Edit
          </Link>
          <Link to={`/warbands/${warband.id}/print`} className={`${BUTTON_BASE} ${BUTTON_VARIANTS.secondary} flex-1 no-underline`}>
            Print
          </Link>
          <Button variant="secondary" onClick={() => setMenuOpen(true)} aria-label="More actions" className="px-3">
            More
          </Button>
        </div>
      </div>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Warband" description={warband.name}>
        <div className="flex flex-col gap-3 py-2">
          <Button variant="secondary" block pending={update.isPending} onClick={toggleArchive}>
            {warband.archived ? 'Unarchive' : 'Archive'}
          </Button>
          <p className="text-sm text-ink-dim">
            {warband.archived
              ? 'Bring the warband back to the front of your list.'
              : 'Archived warbands drop to the bottom of your list and are left out of new matches. Nothing is lost.'}
          </p>
          {isOwner ? (
            <>
              <Button
                variant="secondary"
                block
                onClick={() => {
                  setMenuOpen(false)
                  setTemplateName(warband.name)
                  setTemplateOpen(true)
                }}
              >
                Save as template
              </Button>
              <p className="text-sm text-ink-dim">Keeps the warband type, warriors and kit (not experience, injuries or gold) to start future warbands from.</p>
            </>
          ) : null}
          <Button
            variant="secondary"
            block
            onClick={() => {
              setMenuOpen(false)
              setHandOverOpen(true)
            }}
          >
            Transfer to another player
          </Button>
          {isOwner ? (
            <Button
              variant="secondary"
              block
              onClick={() => {
                setMenuOpen(false)
                setMoveCampaignOpen(true)
              }}
            >
              {campaign.data?.name ? 'Move to another campaign' : 'Join a campaign'}
            </Button>
          ) : null}
          <Button
            variant="danger"
            block
            onClick={() => {
              setMenuOpen(false)
              setConfirmText('')
              setDeleteOpen(true)
            }}
          >
            Delete warband
          </Button>
        </div>
      </Sheet>

      <HandOver
        warbandId={warband.id}
        warbandName={warband.name}
        ownerId={warband.owner_id}
        viewerId={user?.id}
        onError={setActionError}
        open={handOverOpen}
        onOpenChange={setHandOverOpen}
      />
      {isOwner ? (
        <MoveCampaign
          warbandId={warband.id}
          warbandName={warband.name}
          currentCampaign={campaign.data?.name ?? null}
          currentCampaignId={campaign.data?.campaignId}
          onError={setActionError}
          open={moveCampaignOpen}
          onOpenChange={setMoveCampaignOpen}
        />
      ) : null}

      <Sheet
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        title="Save as template"
        description="Private to your account. Sharing with a campaign can come later."
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setTemplateOpen(false)} disabled={saveTemplate.isPending}>
              Cancel
            </Button>
            <Button className="flex-1" disabled={!templateName.trim()} pending={saveTemplate.isPending} onClick={() => void confirmSaveTemplate()}>
              Save template
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3 py-2">
          <TextField label="Template name" value={templateName} maxLength={80} autoComplete="off" onChange={(e) => setTemplateName(e.target.value)} />
        </div>
      </Sheet>

      <Sheet
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this warband?"
        description="Every hero, henchman, item and history entry goes with it. This cannot be undone."
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteOpen(false)} disabled={remove.isPending}>
              Keep it
            </Button>
            <Button variant="danger" className="flex-1" disabled={!deleteReady} pending={remove.isPending} onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3 py-2">
          <TextField
            label={`Type the warband's name to confirm`}
            hint={warband.name}
            value={confirmText}
            autoComplete="off"
            autoCapitalize="off"
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </div>
      </Sheet>
    </>
  )
}

/** The leader is dead: offer the list's successors and re-template the chosen hero. */
function SuccessionCard({ detail, template, onError, onRetire, retiring }: { detail: WarbandDetail; template: WarbandTemplate; onError: (e: string | null) => void; onRetire:()=>Promise<void>; retiring:boolean }) {
  const update = useRosterEvent(detail)
  const view = useMemo(() => successionOptions(detail.roster, template), [detail.roster, template])
  const [choice, setChoice] = useState('')
  if (!view) return null
  const chosen = view.candidates.find((c) => c.hero.id === choice) ?? (view.tiedIds.length > 1 ? undefined : view.candidates[0])

  async function appoint() {
    if (!chosen) return
    onError(null)
    try {
      const result = appointLeader(detail.roster, template, chosen.hero.id)
      await update.mutateAsync({ reason: result.events[0].message, next: result.value })
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not appoint the new leader.')
    }
  }

  return (
    <Notice tone="warn" title={`The warband has no ${view.leaderUnitName}`}>
      <div className="flex flex-col gap-3">
        <p>{view.note ?? 'The hero with the highest Leadership takes over; Experience breaks a tie. They retain their original skill lists, characteristics and equipment, and gain access to the leader’s equipment list.'}</p>
        {view.tiedIds.length > 1 ? <p>These leading candidates are tied: {view.candidates.filter(c => view.tiedIds.includes(c.hero.id)).map(c => c.hero.name).join(', ')}. Roll a D6 at the table to decide, then select the new leader below.</p> : null}
        {view.disbands ? (
          <div className="flex flex-col gap-2"><p className="text-accent">{collapsedWarbandReason(detail.roster) ?? 'The list names no one left who may take over.'}</p>
            {collapsedWarbandReason(detail.roster) ? <><p className="text-sm">Retiring archives the warband and keeps its history.</p><Button variant="secondary" pending={retiring} onClick={()=>void onRetire()}>Retire this warband</Button></> : null}
          </div>
        ) : view.candidates.length === 0 ? (
          <p>No active hero can lead; recruit one first.</p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <span className="flex-1">
              <SelectField label="New leader" value={chosen?.hero.id ?? ''} onChange={(e) => setChoice(e.target.value)}>
                {!chosen ? <option value="" disabled>Select after deciding the tie</option> : null}
                {view.candidates.map((c) => (
                  <option key={c.hero.id} value={c.hero.id}>
                    {c.hero.name} · {unitTypeName(template.id, c.hero.unitTemplateId)} · Ld {c.hero.stats.Ld} · {c.hero.xp} xp{c.reason ? ' · named by the list' : ''}
                  </option>
                ))}
              </SelectField>
            </span>
            <Button pending={update.isPending} disabled={!chosen} onClick={() => void appoint()}>
              Appoint {chosen ? chosen.hero.name : ''}
            </Button>
          </div>
        )}
      </div>
    </Notice>
  )
}

/** Owner: take the warband to another campaign with its invite code, in one step. GMs of their own
 * campaigns can pick one directly instead — no reason to make them look up their own invite code. */
function MoveCampaign({
  warbandId,
  warbandName,
  currentCampaign,
  currentCampaignId,
  onError,
  open,
  onOpenChange,
}: {
  warbandId: string
  warbandName: string
  currentCampaign: string | null
  currentCampaignId: string | undefined
  onError: (e: string | null) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const userId = useSession((s) => s.user?.id)
  const myCampaigns = useMyCampaigns(userId)
  const gmCampaigns = (myCampaigns.data ?? []).filter((c) => c.gm_id === userId && c.id !== currentCampaignId && !c.archived)
  const [selectedId, setSelectedId] = useState('')
  const [code, setCode] = useState('')
  const move = useMoveWarbandCampaign()
  const selected = gmCampaigns.find((c) => c.id === selectedId)
  const effectiveCode = selected?.invite_code ?? code.trim()

  async function confirm() {
    if (!effectiveCode) return
    onError(null)
    try {
      await move.mutateAsync({ warbandId, code: effectiveCode })
      onOpenChange(false)
      setSelectedId('')
      setCode('')
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not move the warband.')
    }
  }

  return (
    <>
      <Sheet
        open={open}
        onClose={() => onOpenChange(false)}
        title={currentCampaign ? 'Move to another campaign' : 'Join a campaign'}
        description={
          currentCampaign
            ? `${warbandName} leaves ${currentCampaign} and joins the campaign you pick or enter below. The roster comes with it; the battles it fought stay in ${currentCampaign}'s records.`
            : `${warbandName} joins the campaign you pick or enter below.`
        }
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => onOpenChange(false)} disabled={move.isPending}>
              Cancel
            </Button>
            <Button className="flex-1" disabled={!effectiveCode} pending={move.isPending} onClick={() => void confirm()}>
              {currentCampaign ? 'Move' : 'Join'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          {gmCampaigns.length > 0 ? (
            <>
              <SelectField
                label="One of your own campaigns"
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value)
                  setCode('')
                }}
              >
                <option value="">Not one of these — enter a code below</option>
                {gmCampaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectField>
              <p className="text-center text-xs text-ink-dim">or</p>
            </>
          ) : null}
          <TextField
            label="Invite code"
            value={code}
            autoComplete="off"
            placeholder="e.g. uz8k-hxtx"
            hint="The GM of the campaign you are joining shares this."
            disabled={selectedId !== ''}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
      </Sheet>
    </>
  )
}

/** Owner or GM: give the warband to another account (imported rosters start with the importer). */
function HandOver({
  warbandId,
  warbandName,
  ownerId,
  viewerId,
  onError,
  open,
  onOpenChange,
}: {
  warbandId: string
  warbandName: string
  ownerId: string
  viewerId: string | undefined
  onError: (e: string | null) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [target, setTarget] = useState('')
  const profiles = useProfiles(open)
  const transfer = useTransferWarband()
  const owner = profiles.data?.find((p) => p.user_id === ownerId)

  async function confirm() {
    if (!target) return
    onError(null)
    try {
      await transfer.mutateAsync({ warbandId, newOwnerId: target })
      onOpenChange(false)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not hand the warband over.')
    }
  }

  return (
    <>
      <Sheet
        open={open}
        onClose={() => onOpenChange(false)}
        title="Transfer this warband"
        description={`${warbandName} moves to another player's account. They take over its roster, reports and advances; you keep nothing but the history.${owner && owner.user_id !== viewerId ? ` Current owner: ${owner.display_name}.` : ''}`}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => onOpenChange(false)} disabled={transfer.isPending}>
              Keep it
            </Button>
            <Button className="flex-1" disabled={!target || target === ownerId} pending={transfer.isPending} onClick={() => void confirm()}>
              Hand over
            </Button>
          </div>
        }
      >
        {profiles.isPending ? (
          <Spinner label="Loading players" />
        ) : profiles.isError ? (
          <Notice tone="error">{profiles.error.message}</Notice>
        ) : (
          <SelectField label="New owner" value={target} onChange={(e) => setTarget(e.target.value)} hint="Only players who have signed up appear here.">
            <option value="">Pick a player…</option>
            {profiles.data
              .filter((p) => p.user_id !== ownerId)
              .map((p) => (
                <option key={p.user_id} value={p.user_id}>
                  {p.display_name}
                </option>
              ))}
          </SelectField>
        )}
      </Sheet>
    </>
  )
}

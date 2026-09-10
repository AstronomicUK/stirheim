import { useWarband } from '../../api/warbands'
import { Card } from '../roster/view/bits'

export function FanaticSupplies({ warbandId, matchId, scheduled }: { warbandId: string; matchId: string; scheduled: boolean }) {
  const detail = useWarband(warbandId)
  const roster = detail.data?.roster
  if (!roster) return null
  const groups = roster.henchmenGroups.filter(g => ['night_goblins_fanatics', 'night_goblins_web_fanatics'].includes(g.unitTemplateId) && g.size > 0)
  if (!groups.length) return null
  const count = groups.reduce((n, g) => n + g.size, 0)
  const doses = [...roster.stash, ...groups.flatMap(g => g.equipment)].filter(i => i.itemId === 'mad_cap_mushrooms').reduce((n, i) => n + i.quantity, 0)
  return <Card className="flex flex-col gap-2 px-4 py-3">
    <p className="font-medium">Fanatic mushroom supplies</p>
    {scheduled ? <>
      <p className="text-sm">{count} Fanatics need one dose each. {doses} doses are available in their kit and the stash.</p>
      <p className="text-sm text-ink-dim">Starting the battle consumes the available doses. Any Fanatic without a dose sits out. Buy Mad Cap Mushrooms before starting if you want everyone to fight.</p>
      {groups.some(g => g.size > 1) ? <p className="text-xs text-ink-dim">Fanatics will be recorded individually, keeping their equipment and experience, so supplies and permanent effects apply to the correct model.</p> : null}
    </> : groups.filter(g => g.campaignState?.fanaticBattleMatch === matchId).map(g => <p key={g.id} className="text-sm">{g.name}: {g.campaignState?.fanaticSittingOut ? 'sitting out — no mushroom dose' : 'supplied — fighting this battle'}{g.campaignState?.permanentStupidity ? ' · Permanent Stupidity' : ''}</p>)}
  </Card>
}

export const BRIGAND_OUTLAWS = ['highwayman', 'warlock', 'pit_fighter'] as const
export interface BrigandsDraft {
  role?: 'attacker' | 'defender'
  henchmen?: (number | null)[]
  heroes?: { name: string; die: number | null; captured?: boolean; captureDie?: number | null }[]
  outlaw?: string
  standing?: boolean
}
export function brigandsRewards(state: BrigandsDraft, won: boolean, campaign: boolean) {
  const result = { gold: 0, notes: [] as string[], problems: [] as string[], freeHire: undefined as typeof BRIGAND_OUTLAWS[number] | undefined }
  const die = (v: number | null | undefined): v is number => v != null && Number.isInteger(v) && v >= 1 && v <= 6
  if (!['attacker', 'defender'].includes(state.role ?? '')) { result.problems.push('Choose your Brigands role.'); return result }
  result.notes.push(`Brigands: ${state.role}; survivors and winning leader gain ${state.role === 'defender' ? 2 : 1} XP.`)
  if (!won) return result
  if (state.role === 'attacker') {
    for (const [i, roll] of (state.henchmen ?? []).entries()) {
      if (!die(roll)) result.problems.push(`Henchman bounty ${i + 1}: enter its D6.`)
      else { result.gold += roll; result.notes.push(`Enemy henchman ${i + 1} out of action: D6 ${roll}, +${roll} gc.`) }
    }
    const names = new Set<string>()
    for (const [i, hero] of (state.heroes ?? []).entries()) {
      const name = hero.name.trim()
      if (!name || names.has(name.toLowerCase())) result.problems.push(`Hero bounty ${i + 1}: enter a distinct enemy Hero name.`)
      names.add(name.toLowerCase())
      if (!die(hero.die)) result.problems.push(`${name || 'Hero'}: enter the bounty D6.`)
      else { result.gold += hero.die * 5; result.notes.push(`${name} out of action: D6 ${hero.die} × 5 = ${hero.die * 5} gc.`) }
      if (hero.captured) {
        if (!campaign) result.problems.push('The Captured bounty applies only in a campaign.')
        else if (!die(hero.captureDie)) result.problems.push(`${name}: enter the additional Captured bounty D6.`)
        else { result.gold += hero.captureDie * 10; result.notes.push(`${name} rolled Captured: D6 ${hero.captureDie} × 10 = ${hero.captureDie * 10} gc additional bounty.`) }
      }
    }
  } else if (state.outlaw === 'none') result.notes.push('Declined the free outlaw hire.')
  else if (!BRIGAND_OUTLAWS.includes(state.outlaw as typeof BRIGAND_OUTLAWS[number]) || !state.standing) result.problems.push('Choose a still-standing outlaw and confirm they survived standing, or decline the hire.')
  else { result.freeHire = state.outlaw as typeof BRIGAND_OUTLAWS[number]; result.notes.push(`Free outlaw recruitment earned: ${state.outlaw!.replaceAll('_', ' ')}. Complete the hire under Recruit; ordinary upkeep applies afterwards, even where the warband normally cannot hire this character.`) }
  return result
}

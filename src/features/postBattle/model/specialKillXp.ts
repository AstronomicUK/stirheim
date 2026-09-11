import type { BattleEventRow, BattleLiveState } from '../../../domain'
import type { RosterWarband } from '../../../rules/types/roster'

/** Runts: grade-2a-part2:1279. WEB Snotlings: grade-1c:3172. */
export interface KillXpRoll { value: number | null; source: 'app' | 'manual'; previous?: { value: number; source: 'app' | 'manual' }[] }
export interface SpecialKillXp { runts: number; snotlings: number; rolls: KillXpRoll[] }
export const emptySpecialKills = (): SpecialKillXp => ({ runts: 0, snotlings: 0, rolls: [] })
export const validKillDie = (value: number | null | undefined): value is number => Number.isInteger(value) && value! >= 1 && value! <= 6
export function recordKillDie(before: KillXpRoll | undefined, value: number | null, source: KillXpRoll['source']): KillXpRoll {
  return { value, source, previous: [...(before?.previous ?? []), ...(validKillDie(before?.value) ? [{ value: before!.value!, source: before!.source }] : [])] }
}
export function specialKillProblems(value: SpecialKillXp, total?: number): string[] {
  if (![value.runts, value.snotlings].every(n => Number.isSafeInteger(n) && n >= 0 && n <= 1000)) return ['Enter valid numbers of defeated Runts and Snotlings.']
  const problems: string[] = []
  if (total !== undefined && value.runts + value.snotlings > total) problems.push('Special enemy counts exceed the total enemies taken out. Update Casualties or correct these counts.')
  if (Array.from({ length: value.runts }, (_, i) => value.rolls[i]).some(r => !validKillDie(r?.value))) problems.push('Complete a 5+ experience test for each Runt taken out.')
  return problems
}
export function specialKillAwards(value: SpecialKillXp | undefined, hero = true): { amount: number; reason: string; keepZero: true }[] {
  if (!value) return []
  const out: { amount: number; reason: string; keepZero: true }[] = []
  if (hero && value.snotlings > 0) out.push({ keepZero: true, amount: Math.floor(value.snotlings / 2), reason: `${value.snotlings} Night Goblin Snotlings taken out: half XP each, rounded down after the battle` })
  for (let i = 0; i < Math.min(1000, value.runts); i++) {
    const roll = value.rolls[i]
    const describe = (r: { value: number; source: KillXpRoll['source'] }) => `${r.value} (${r.source === 'app' ? 'rolled by the app' : 'entered or changed by the player'})`
    const history = (roll?.previous ?? []).map(r => `earlier ${describe(r)}, replaced`).join('; ')
    const passed = validKillDie(roll?.value) && roll.value >= 5
    out.push({ keepZero: true, amount: passed ? 1 : 0, reason: `Runt ${i + 1} experience test: ${validKillDie(roll?.value) ? describe({ value: roll.value, source: roll.source }) + (passed ? ' — passed' : ' — failed') : 'roll still needed'}${history ? `; ${history}` : ''}` })
  }
  return out
}
/** Use unit identities rather than display names; ignore reverted and friendly casualties. */
export function specialKillsFromEvents(events: readonly BattleEventRow[], ownWarbandId: string, opponents: readonly RosterWarband[], sheets: readonly { warband_id: string; live_state: BattleLiveState }[] = []): Record<string, SpecialKillXp> {
  const units = new Map(opponents.flatMap(r => [...r.heroes, ...r.henchmenGroups].map(u => [`${r.id}:${u.id}`, u.unitTemplateId] as const)))
  const counts = new Map<string, { attacker: string; unit: string; events: number; manual: number }>()
  const count = (warband: string, target: string, attacker: string, unit: string) => {
    const key = `${warband}:${target}:${attacker}`
    if (!counts.has(key)) counts.set(key, { attacker, unit, events: 0, manual: 0 })
    return counts.get(key)!
  }
  for (const event of events) {
    if (event.kind !== 'attack' || event.reverted_at) continue
    const p = event.payload
    if (!p.out_of_action || p.attacker_warband_id !== ownWarbandId || p.target_warband_id === ownWarbandId) continue
    const unit = p.target_unit_template_id ?? units.get(`${p.target_warband_id}:${p.target_id}`)
    if (unit !== 'runts' && unit !== 'night_goblins_web_snotlings') continue
    count(p.target_warband_id, p.target_id, p.attacker_id, unit).events++
  }
  // Raw player-calculated sheets can identify casualties without an attack event. Do not
  // count both the sheet attribution and its matching logged attack as separate casualties.
  for (const sheet of sheets) {
    if (sheet.warband_id === ownWarbandId) continue
    for (const [target, killers] of Object.entries(sheet.live_state.takenOutBy)) {
      const unit = units.get(`${sheet.warband_id}:${target}`)
      if (unit !== 'runts' && unit !== 'night_goblins_web_snotlings') continue
      for (const killer of killers) if (killer.warbandId === ownWarbandId && killer.modelId) count(sheet.warband_id, target, killer.modelId, unit).manual++
    }
  }
  const out: Record<string, SpecialKillXp> = {}
  for (const c of counts.values()) {
    const line = out[c.attacker] ??= emptySpecialKills(), n = Math.max(c.events, c.manual)
    if (c.unit === 'runts') line.runts += n; else line.snotlings += n
  }
  return out
}

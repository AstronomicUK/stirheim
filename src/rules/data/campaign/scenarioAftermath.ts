import { scenarioDetail } from './scenarioDetails'

export interface ScenarioAward { amount: number; label: string; text: string }
const conflicts: Record<string, { label: RegExp; body: number; explanation: string }> = {
  bar_room_brawl: { label: /taking out sam/i, body: 3, explanation: 'Taking out Sam: heading +1, explanation +3.' },
  forbidden_square: { label: /winning leader/i, body: 2, explanation: 'Winning leader: heading +1, explanation +2.' },
  gathering_of_the_horde: { label: /winning leader/i, body: 2, explanation: 'Winning leader: heading +1, explanation +2.' },
  the_lair_of_the_snake: { label: /first to reach/i, body: 2, explanation: 'First to reach the platform and engage an opponent: heading +1, explanation +2.' },
  rat_attack: { label: /putting a skaven/i, body: 1, explanation: 'Skaven kills: heading +2, explanation +1; the page suggests +1 additional to normal kill XP.' },
}

/** Nested missions remain separate: never combine two mutually exclusive experience tables. */
export function scenarioExperienceOptions(id?: string | null): { name: string; text: string }[] {
  const detail = id ? scenarioDetail(id) : undefined
  if (!detail) return []
  const missions = detail.sections.filter(s => /^mission\s/i.test(s.name)).flatMap(s => {
    const match = s.text.match(/(?:^|\n)#{1,6}\s+experience\s*\n([\s\S]*?)(?=\n#{1,4}\s|$)/i)
    return match ? [{ name: s.name, text: match[1].trim() }] : []
  })
  return missions.length ? missions : detail.experience ? [{ name: 'Scenario', text: detail.experience }] : []
}

export function scenarioAftermath(id?: string | null, mission?: string, useBody?: boolean) {
  const options = scenarioExperienceOptions(id)
  const selected = options.length === 1 ? options[0] : options.find(o => o.name === mission)
  // Historical alternative XP systems and narrative appendices are reference text, not extra awards.
  const text = selected?.text.split(/\n(?:Original Experience|Possible Typo|Narrative content|\*\*Author.s note)/i)[0] ?? ''
  const awards: ScenarioAward[] = []
  for (const line of text.split('\n')) {
    const clean = line.replace(/[*_]/g, '').replace(/^\s*-\s*/, '').trim()
    const m = clean.match(/^\+(\d+)\s*[:.]?\s*([^.:]+)[.:]\s*(.*)$/)
    if (!m || /fame/i.test(m[2])) continue
    const conflict = id ? conflicts[id] : undefined
    awards.push({ amount: useBody && conflict?.label.test(m[2]) ? conflict.body : Number(m[1]), label: m[2], text: m[3] })
  }
  const survives = awards.find(a => /^survive/i.test(a.label))
  const leader = awards.find(a => /^winning leader/i.test(a.label))
  const kills = awards.find(a => /^(?:per )?enemy (?:out|taken out)/i.test(a.label))
  const defaults = selected && survives ? { survival: survives.amount, leader: leader?.amount ?? 0, kill: kills?.amount ?? 0 } : { survival: 1, leader: 1, kill: 1 }
  const bonuses = awards.filter(a => a !== survives && a !== leader && a !== kills)
  const detail = id ? scenarioDetail(id) : undefined
  const rewardRules = detail?.sections.filter(s => /after.*battle|treasure|reward|wyrdstone/i.test(s.name) || /gold crowns|\bgc\b|treasure|loot|crates?|swag|cargo/i.test(s.text)) ?? []
  const goldDice = [...new Set(rewardRules.flatMap(s => [...s.text.matchAll(/(\d*D[36](?:\s*[x×*]\s*\d+)?(?:\s*\+\s*\d+)?)\s*(?:gold crowns|gc\b)/gi)].map(m => m[1])))]
  return { options, selected, defaults, bonuses, rewardRules, goldDice, conflict: id ? conflicts[id]?.explanation : undefined, needsMission: options.length > 1 && !selected }
}

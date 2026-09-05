// Reads a the old tracker roster from the text of its pages: the printer-friendly roster page
// (`/warbands/{id}/print`, "Exp 22", "1 warriors", items joined with " · ") or the campaign's
// "View details" panel for another player's warband ("EXP" then the number on its own line,
// "1 WARRIORS", one item per line). Pure text parsing, no rules knowledge: ./rosterImport.ts maps
// the names to Stirheim's templates, items, skills and injuries.

import type { Stats } from '../../rules/types'

export interface ParsedWarrior {
  name: string
  /** As printed, e.g. "DWARF NOBLE" or "KNIGHT_ERRANT"; null when the page did not show one (henchman groups in the details panel). */
  typeName: string | null
  xp: number
  stats: Stats | null
  equipment: string[]
  injuries: string[]
  /** Skills and spells together, as printed ("Master Of Blades", "Lifestealer"). */
  skills: string[]
  /** Cult of the Possessed mutations ("Recruitment bonuses"). */
  mutations: string[]
}

export interface ParsedGroup extends ParsedWarrior {
  size: number
}

export interface ParsedRoster {
  name: string
  typeName: string
  gold: number
  wyrdstone: number
  veteranPool: number | null
  heroes: ParsedWarrior[]
  henchmen: ParsedGroup[]
  hiredSwords: ParsedWarrior[]
  /** Item names in the stash (printer page only; the details panel shows a count). */
  stash: string[]
  /** Lines the parser could not place, for the review screen. */
  unplaced: string[]
}

const STAT_KEYS: (keyof Stats)[] = ['M', 'WS', 'BS', 'S', 'T', 'W', 'I', 'A', 'Ld']

const SECTION_MARKERS: Record<string, 'heroes' | 'henchmen' | 'hiredSwords' | 'stash' | 'end'> = {
  heroes: 'heroes',
  henchmen: 'henchmen',
  'hired swords': 'hiredSwords',
  stash: 'stash',
  'equipment reference': 'end',
}

type Field = 'equipment' | 'injuries' | 'skills' | 'mutations' | 'rules' | 'none'

const FIELD_MARKERS: Record<string, Field> = {
  equipment: 'equipment',
  injuries: 'injuries',
  'skills & spells': 'skills',
  'recruitment bonuses': 'mutations',
  'special rules': 'rules',
  characteristics: 'none',
  notes: 'rules',
  cost: 'none',
  exp: 'none',
}

function isTypeLine(line: string): boolean {
  return /^[A-Z][A-Z0-9 _'&-]{2,}$/.test(line) && !(line.toLowerCase() in FIELD_MARKERS) && !(line.toLowerCase() in SECTION_MARKERS) && !/^\d+ WARRIORS$/i.test(line) && !isStatHeader(line)
}

function isStatHeader(line: string): boolean {
  return /^M\s+WS\s+BS\s+S\s+T\s+W\s+I\s+A\s+LD$/i.test(line.replace(/\t/g, ' '))
}

function parseStats(line: string): Stats | null {
  const parts = line.trim().split(/[\s\t]+/)
  if (parts.length !== 9 || !parts.every((p) => /^\d+$/.test(p))) return null
  const stats = {} as Stats
  STAT_KEYS.forEach((k, i) => {
    stats[k] = Number(parts[i])
  })
  return stats
}

/** "Lifestealer(Difficulty 10)" -> "Lifestealer"; "Spell Of Awakening(Auto)" -> "Spell Of Awakening". */
function cleanName(line: string): string {
  return line.replace(/\((Difficulty \d+|Auto)\)$/i, '').trim()
}

/** Prose the pages print under rule and injury names: sentences, or long lines. */
function isProse(line: string): boolean {
  return /[.!?]\s*$/.test(line) || line.length > 90 || /^[^:]{2,40}: .{20,}/.test(line) || /\s(the|a|an|of|and|is|are|may|when)\s/i.test(line) && line.split(' ').length > 6
}

function emptyWarrior(name: string): ParsedWarrior {
  return { name, typeName: null, xp: 0, stats: null, equipment: [], injuries: [], skills: [], mutations: [] }
}

/** The lines that start a new warrior: a name, then a TYPE and Exp/COST, or (details panel henchmen) "N WARRIORS". */
function startsWarrior(lines: string[], i: number): boolean {
  const line = lines[i]
  if (/^Exp \d+$/i.test(line) || /^\d+( gc| warriors)?$/i.test(line) || line.toLowerCase() in FIELD_MARKERS || isStatHeader(line)) return false
  const next = lines[i + 1] ?? ''
  const after = lines[i + 2] ?? ''
  if (/^\d+ WARRIORS$/i.test(next)) return true
  if (!isTypeLine(next)) return false
  return /^Exp \d+$/i.test(after) || /^EXP$/i.test(after) || /^COST$/i.test(after) || /^\d+ WARRIORS$/i.test(after)
}

export function parseRelicRoster(text: string): ParsedRoster {
  const lines = text
    .split('\n')
    .map((l) => l.replace(/\s+$/, '').trim())
    // Icon glyph tokens the pages leak into text ("sword_rose", "auto_stories"); "none" is kept as an empty marker.
    .filter((l) => l !== '' && !(/^[a-z][a-z0-9_]*$/.test(l) && l !== 'none'))

  const roster: ParsedRoster = { name: lines[0] ?? '', typeName: lines[1] ?? '', gold: 0, wyrdstone: 0, veteranPool: null, heroes: [], henchmen: [], hiredSwords: [], stash: [], unplaced: [] }

  let section: 'header' | 'heroes' | 'henchmen' | 'hiredSwords' | 'stash' | 'end' = 'header'
  let current: ParsedWarrior | ParsedGroup | null = null
  let field: Field = 'none'
  let expectNumberFor: 'xp' | 'gold' | 'wyrdstone' | 'stash' | null = null

  const push = () => {
    if (!current) return
    if (section === 'heroes') roster.heroes.push(current)
    else if (section === 'henchmen') roster.henchmen.push(current as ParsedGroup)
    else if (section === 'hiredSwords') roster.hiredSwords.push(current)
    current = null
    field = 'none'
  }

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i]
    const lower = line.toLowerCase()

    // Section changes.
    if (lower in SECTION_MARKERS) {
      push()
      section = SECTION_MARKERS[lower]
      field = 'none'
      if (section === 'end') break
      continue
    }

    if (section === 'header') {
      const gold = /^Gold (\d+)/i.exec(line)
      const wyrd = /^Wyrd Stones (\d+)/i.exec(line)
      const pool = /^Veteran Pool (\d+)/i.exec(line)
      if (gold) roster.gold = Number(gold[1])
      else if (wyrd) roster.wyrdstone = Number(wyrd[1])
      else if (pool) roster.veteranPool = Number(pool[1])
      else if (lower === 'gold') expectNumberFor = 'gold'
      else if (lower === 'wyrd stones') expectNumberFor = 'wyrdstone'
      else if (expectNumberFor && /^\d+/.test(line)) {
        const n = Number(/^(\d+)/.exec(line)![1])
        if (expectNumberFor === 'gold') roster.gold = n
        else if (expectNumberFor === 'wyrdstone') roster.wyrdstone = n
        expectNumberFor = null
      }
      continue
    }

    if (section === 'stash') {
      const m = /^(.+?)\s*\((\d+ gc)\)$/i.exec(line)
      if (m) roster.stash.push(m[1].trim())
      continue
    }

    // Warriors.
    if (/^No (hired swords|henchmen) /i.test(line) || /^No hired swords/i.test(line)) continue
    if (!current || (field !== 'rules' && startsWarrior(lines, i))) {
      if (current && startsWarrior(lines, i)) push()
      if (!current) {
        current = section === 'henchmen' ? { ...emptyWarrior(line), size: 1 } : emptyWarrior(line)
        field = 'none'
        continue
      }
    }
    const unit = current as ParsedWarrior | ParsedGroup

    if (unit.typeName === null && isTypeLine(line) && unit.stats === null && unit.xp === 0 && unit.equipment.length === 0) {
      unit.typeName = line
      continue
    }
    const exp = /^Exp (\d+)$/i.exec(line)
    if (exp) {
      unit.xp = Number(exp[1])
      field = 'none'
      continue
    }
    if (lower === 'exp') {
      expectNumberFor = 'xp'
      field = 'none'
      continue
    }
    if (expectNumberFor === 'xp' && /^\d+$/.test(line)) {
      unit.xp = Number(line)
      expectNumberFor = null
      continue
    }
    const size = /^(\d+) warriors$/i.exec(line)
    if (size) {
      ;(unit as ParsedGroup).size = Number(size[1])
      field = 'none'
      continue
    }
    if (/^\d+ gc$/i.test(line)) continue
    if (isStatHeader(line)) {
      const stats = parseStats(lines[i + 1] ?? '')
      if (stats) {
        unit.stats = stats
        i += 1
      }
      field = 'none'
      continue
    }
    if (lower in FIELD_MARKERS) {
      field = FIELD_MARKERS[lower]
      continue
    }
    if (line === 'none' || line === 'None') continue

    switch (field) {
      case 'equipment':
        for (const part of line.split(' · ')) if (part.trim()) unit.equipment.push(part.trim())
        break
      case 'injuries':
        if (!isProse(line)) unit.injuries.push(line)
        break
      case 'skills':
        if (!isProse(line)) unit.skills.push(cleanName(line))
        break
      case 'mutations':
        if (!isProse(line)) unit.mutations.push(line)
        break
      case 'rules':
        break
      default:
        if (!isProse(line)) roster.unplaced.push(line)
    }
  }
  push()
  return roster
}

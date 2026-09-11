// Turns audit_log rows into the one-line entries the campaign dashboard shows: "Ana edited Claws
// of Eshin by hand (gold 25 -> 30)". Pure; the table/action/reason/before/after shape comes from
// the audit_row() trigger in supabase/migrations/20260904000003_audit.sql.

import type { CampaignActivity } from '../../api/campaigns'
import type { Json } from '../../api/database.types'
import type { IconName } from '../../ui/icons'
import { findItem } from '../../rules/data/items'
import { warbandTypeName } from '../roster/shared/names'
import { findSpellOption, hiredSwordName, skillName, skillTableName, skillText, spellName } from '../roster/view/lookups'

import { WARBAND_TEMPLATES } from '../../rules/data/warbandTemplates'
import { HERO_INJURIES } from '../../rules/data/campaign/injuries'
import { SPELL_LORES } from '../../rules/data/campaign/magic'
import { reportActivityChanges } from './reportActivity'
import { advanceActivityChanges } from './advanceActivity'
import { defaultCampaignSettings } from '../../domain/settings'
import { HOUSE_RULE_SWITCHES, DICE_POLICY_OPTIONS, COMBAT_MODE_OPTIONS, FIRST_SPELL_RULE_OPTIONS } from './settingsForm'
import { banName, type BanKind } from './bans'
import { CORE_RULEBOOK_SCENARIO_IDS, SCENARIOS } from '../../rules/data/campaign/scenarios'

type Row = Record<string, Json | undefined>

function asRow(json: Json | null | undefined): Row | null {
  return json && typeof json === 'object' && !Array.isArray(json) ? (json as Row) : null
}

function str(row: Row | null, key: string): string | null {
  const v = row?.[key]
  return typeof v === 'string' && v.trim() ? v : null
}

function num(row: Row | null, key: string): number | null {
  const v = row?.[key]
  return typeof v === 'number' ? v : null
}

function actorName(entry: CampaignActivity): string {
  return entry.actor_display_name?.trim() || 'Someone'
}

/** The warband a row concerns, by name: the row itself for warbands, else the looked-up name. */
function warbandName(entry: CampaignActivity, after: Row | null, before: Row | null): string {
  if (entry.table_name === 'warbands') return str(after, 'name') ?? str(before, 'name') ?? entry.warband_name ?? 'a warband'
  return entry.warband_name ?? 'a warband'
}

/** "gold 25 -> 30, wyrdstone 0 -> 2" for the plain columns of a warband row that moved. */
export function describeWarbandChanges(before: Row | null, after: Row | null): string[] {
  if (!before || !after) return []
  const out: string[] = []
  for (const [key, label] of [
    ['gold', 'gold'],
    ['wyrdstone', 'wyrdstone'],
    ['veteran_pool', 'veteran pool'],
  ] as const) {
    const a = num(before, key)
    const b = num(after, key)
    if (a !== b && (a !== null || b !== null)) out.push(`${label} ${a ?? 'none'} -> ${b ?? 'none'}`)
  }
  const nameBefore = str(before, 'name')
  const nameAfter = str(after, 'name')
  if (nameBefore && nameAfter && nameBefore !== nameAfter) out.push(`renamed from ${nameBefore}`)
  if (before.archived !== after.archived && typeof after.archived === 'boolean') out.push(after.archived ? 'archived' : 'unarchived')
  if (before.notes !== after.notes) out.push('notes changed')
  return out
}

function withChanges(text: string, changes: string[]): string {
  return changes.length ? `${text} (${changes.join(', ')})` : text
}

function describeWarband(entry: CampaignActivity, before: Row | null, after: Row | null): string {
  const actor = actorName(entry)
  const name = warbandName(entry, after, before)
  if (entry.action === 'insert') return `${actor} created ${name}`
  if (entry.action === 'delete') return `${actor} deleted ${name}`
  const changes = describeWarbandChanges(before, after)
  switch (entry.reason) {
    case 'manual_edit':
      return withChanges(`${actor} edited ${name} by hand`, changes)
    case 'trading':
      return withChanges(`${actor} visited the trading post with ${name}`, changes)
    case 'recruitment':
      return withChanges(`${actor} recruited for ${name}`, changes)
    case 'post_battle':
      return withChanges(`${actor} recorded a post-battle sequence for ${name}`, changes)
    case 'advancement':
      return withChanges(`${actor} rolled advances for ${name}`, changes)
    case 'archive':
      return after?.archived === true ? `${actor} archived ${name}` : `${actor} unarchived ${name}`
    case 'toll':
      return withChanges(`${actor} settled a map toll for ${name}`, changes)
    case 'import_fixup':
      return `${actor} brought ${name}'s imported skills, spells and injuries up to date`
    default:
      return withChanges(`${actor} updated ${name}`, changes)
  }
}

function describeWarrior(entry: CampaignActivity, before: Row | null, after: Row | null, kind: 'hero' | 'group'): string {
  const actor = actorName(entry)
  const warband = warbandName(entry, after, before)
  const who = str(after, 'name') ?? str(before, 'name') ?? (kind === 'hero' ? 'a hero' : 'a henchman group')
  const hired = after?.is_hired_sword === true || before?.is_hired_sword === true
  const byHand = entry.reason === 'manual_edit' ? ' by hand' : ''
  if (entry.action === 'insert') return hired ? `${actor} hired ${who} for ${warband}` : `${actor} added ${who} to ${warband}${byHand}`
  if (entry.action === 'delete') return `${actor} removed ${who} from ${warband}${byHand}`
  const statusBefore = str(before, 'status')
  const statusAfter = str(after, 'status')
  if (statusBefore && statusAfter && statusBefore !== statusAfter) return `${actor} marked ${who} (${warband}) ${statusAfter.replace(/_/g, ' ')}`
  if (kind === 'group') {
    const a = num(before, 'size')
    const b = num(after, 'size')
    if (a !== null && b !== null && a !== b) return `${actor} changed ${who} (${warband}) from ${a} to ${b} models${byHand}`
  }
  return `${actor} edited ${who} (${warband})${byHand}`
}

function describeItem(entry: CampaignActivity, before: Row | null, after: Row | null): string {
  const actor = actorName(entry)
  const warband = warbandName(entry, after, before)
  if (entry.action === 'insert') return `${actor} added equipment to ${warband}`
  if (entry.action === 'delete') return `${actor} removed equipment from ${warband}`
  return `${actor} changed equipment on ${warband}`
}

function describeCampaign(entry: CampaignActivity, before: Row | null, after: Row | null): string {
  const actor = actorName(entry)
  if (entry.action === 'insert') return `${actor} created the campaign`
  if (entry.action === 'delete') return `${actor} deleted the campaign`
  const parts: string[] = []
  const nameAfter = str(after, 'name')
  if (before && after && str(before, 'name') !== nameAfter && nameAfter) parts.push(`renamed the campaign to ${nameAfter}`)
  if (before && after && before.archived !== after.archived) parts.push(after.archived === true ? 'archived the campaign' : 'unarchived the campaign')
  if (before && after && before.invite_code !== after.invite_code) parts.push('issued a new invite code')
  if (before && after && !sameValue(before.settings, after.settings)) {
    const changed=campaignSettingChanges(before.settings,after.settings)
    parts.push(...changed.slice(0,3).map(c=>c.sentence!.charAt(0).toLowerCase()+c.sentence!.slice(1).replace(/\.$/,'')))
    if(changed.length>3)parts.push(`made ${changed.length-3} other setting changes`)
  }
  if (before && after && before.rules_markdown !== after.rules_markdown) parts.push('updated the campaign rules')
  if (!parts.length) return `${actor} updated the campaign`
  return `${actor} ${joinNatural(parts)}`
}

function describeMembership(entry: CampaignActivity, before: Row | null, after: Row | null): string {
  const actor = actorName(entry)
  const warband = warbandName(entry, after, before)
  if (entry.action === 'insert') return `${actor} joined with ${warband}`
  if (entry.action === 'delete') return `${warband} was removed from the campaign`
  const leftBefore = str(before, 'left_at')
  const leftAfter = str(after, 'left_at')
  if (!leftBefore && leftAfter) {
    const owner = str(after, 'user_id')
    return owner && entry.actor_id && owner !== entry.actor_id ? `${actor} removed ${warband} from the campaign` : `${actor} left with ${warband}`
  }
  if (leftBefore && !leftAfter) return `${actor} rejoined with ${warband}`
  return `${actor} updated the membership of ${warband}`
}

function joinNatural(parts: string[]): string {
  if (parts.length <= 1) return parts.join('')
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

/** One plain-English line for an audit entry. Never throws on odd data; falls back to a generic line. */
export function describeActivity(entry: CampaignActivity): string {
  const before = asRow(entry.before)
  const after = asRow(entry.after)
  switch (entry.table_name) {
    case 'warbands':
      return describeWarband(entry, before, after)
    case 'heroes':
      return describeWarrior(entry, before, after, 'hero')
    case 'henchman_groups':
      return describeWarrior(entry, before, after, 'group')
    case 'items':
      return describeItem(entry, before, after)
    case 'campaigns':
      return describeCampaign(entry, before, after)
    case 'campaign_members':
      return describeMembership(entry, before, after)
    default: {
      const labels: Record<string, string> = {
        pending_advances: 'an advance', matches: 'a battle', match_participants: 'a battle participant',
        battle_sessions: 'a battle sheet', battle_events: 'a battle action', match_reports: 'a battle report',
        report_revisions: 'a report revision', map_adjustments: 'a map adjustment', hired_swords: 'a hired sword',
      }
      const what = labels[entry.table_name]
      const verb = entry.action === 'insert' ? 'added' : entry.action === 'delete' ? 'removed' : 'updated'
      const where = entry.warband_name ? ` for ${entry.warband_name}` : ''
      return what ? `${actorName(entry)} ${verb} ${what}${where}` : `${actorName(entry)} recorded changes${where}`
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Field-level before/after, for the expanded view of one audit row.
// ---------------------------------------------------------------------------------------------

/** Columns that are bookkeeping rather than something a player would want to see change. */
const BORING_FIELDS = new Set([
  'id',
  'created_at',
  'updated_at',
  'sort_order',
  'warband_id',
  'campaign_id',
  'owner_id',
  'gm_id',
  'invite_code',
  'holder_id',
  // Who made the change is already shown by the entry's own actor name — these are the same
  // information as a raw id, never anything a reader needs to see spelled out again.
  'user_id',
  'created_by',
  'submitted_by',
  'replaced_by',
  'actor_id',
  'reverted_by',
  'resolved_at',
  'version',
  'revision',
  'submitted_at',
])

/** Human labels for columns worth naming specially; anything else falls back to "un snaked case". */
const FIELD_LABELS: Record<string, string> = {
  name: 'name',
  gold: 'gold',
  wyrdstone: 'wyrdstone',
  veteran_pool: 'veteran pool',
  archived: 'archived',
  notes: 'notes',
  status: 'status',
  size: 'size',
  xp: 'XP',
  level_ups: 'advances taken',
  skill_tables: 'skill tables',
  skills: 'skills',
  spells: 'spells',
  injuries: 'injuries',
  flags: 'conditions',
  stats: 'characteristics',
  stat_increases: 'stat increases',
  is_large: 'large',
  is_hired_sword: 'hired sword',
  equipment_locked: 'equipment locked',
  quantity: 'quantity',
  threshold_xp: 'XP needed for this advance',
  subject_type: 'warrior type',
  resolution: 'advance result',
  item_rules_id: 'item',
  custom_name: 'custom item name',
  holder_type: 'equipment location',
  settings: 'campaign settings',
  rules_markdown: 'campaign rules',
  left_at: 'left the campaign',
  type_rules_id: 'warband type',
  unit_type_rules_id: 'unit type',
}

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').toLowerCase()
}

/** Rules-catalogue lookups for the handful of columns that store an id rather than plain text. */
const ID_LOOKUPS: Partial<Record<string, (id: string) => string>> = {
  skills: skillName,
  skill_tables: skillTableName,
  hired_sword_rules_id: hiredSwordName,
  magicLoreId: id => SPELL_LORES.find(lore => lore.id === id)?.name ?? id,
  unit_type_rules_id: id => WARBAND_TEMPLATES.flatMap(w => [...w.heroTemplates, ...w.henchmanTemplates]).find(u => u.id === id)?.name ?? id,
  spells: spellName,
  item_rules_id: (id) => findItem(id)?.name ?? id,
  type_rules_id: warbandTypeName,
}

/** A JSON value as something worth reading in a diff: "none" for empty, plain text otherwise.
 * `key` looks the value up in the rules catalogue first, for the columns that store an id. */
function displayValue(value: Json | undefined, key?: string): string {
  if (value === undefined || value === null) return 'none'
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  const lookup = key ? ID_LOOKUPS[key] : undefined
  if (typeof value === 'string') {
    if (!value.trim()) return 'none'
    if (/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value)) return 'a linked record'
    const named = lookup ? lookup(value) : value
    return lookup || key === 'status' || key === 'holder_type' ? named.replace(/_/g, ' ') : named
  }
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.length === 0 ? 'none' : value.map((v) => displayValue(v, key)).join(', ')
  if (Object.keys(value).length === 0) return 'none'
  if (typeof value.text === 'string') return value.text
  if (typeof value.summary === 'string') return value.summary
  if (key === 'injuries') {
    const injury = HERO_INJURIES.find(i => i.code === value.injuryCode)
    return [typeof value.name === 'string' ? value.name : injury?.name, typeof value.effect === 'string' ? value.effect : null].filter(Boolean).join(' — ') || 'Recorded injury'
  }
  return Object.entries(value).filter(([k]) => !BORING_FIELDS.has(k) && !/Id$|_id$/.test(k)).map(([k, v]) => `${fieldLabel(k)}: ${displayValue(v, k)}`).join('; ') || 'none'
}

const STAT_ORDER = ['M', 'WS', 'BS', 'S', 'T', 'W', 'I', 'A', 'Ld'] as const

/** A `heroes`/`henchman_groups` stats row: every characteristic present as a number. */
function asStats(value: Json | undefined): Record<string, number> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const row = value as Record<string, Json>
  return STAT_ORDER.every((k) => typeof row[k] === 'number') ? (row as Record<string, number>) : null
}

/** "M 4, WS 2, ..., Ld 6" — or just the characteristics that moved, when comparing two stat lines. */
function statsLine(stats: Record<string, number>, onlyKeys?: readonly string[]): string {
  const keys = onlyKeys ?? STAT_ORDER
  return keys.map((k) => `${k} ${stats[k]}`).join(', ')
}

function sameValue(a: Json | undefined, b: Json | undefined): boolean {
  if (a === b) return true
  if ((a === undefined || a === null) && (b === undefined || b === null)) return true
  return JSON.stringify(a) === JSON.stringify(b)
}

export interface FieldChange {
  sentence?: string
  details?: string
  label: string
  before: string
  after: string
}

const DEFAULT_SETTINGS = defaultCampaignSettings()

/** Describe actual setting changes, never whole nested settings snapshots. */
function campaignSettingChanges(before: Json | undefined, after: Json | undefined): FieldChange[] {
  const old = {...DEFAULT_SETTINGS,...asRow(before)} as Row, next = {...DEFAULT_SETTINGS,...asRow(after)} as Row
  const changes:FieldChange[]=[]
  const add=(label:string,a:Json|undefined,b:Json|undefined,sentence?:string)=>{
    if(sameValue(a,b))return
    const from=displayValue(a),to=displayValue(b)
    changes.push({label,before:from,after:to,sentence:sentence??`Changed ${label} from ${from} to ${to}.`})
  }
  for(const key of new Set([...Object.keys(old),...Object.keys(next)])){
    if(key==='houseRules'){
      const a={...DEFAULT_SETTINGS.houseRules,...asRow(old[key])} as Row,b={...DEFAULT_SETTINGS.houseRules,...asRow(next[key])} as Row
      for(const rule of new Set([...Object.keys(a),...Object.keys(b)])){
        if(rule==='bans'){
          const previous=asRow(a.bans)??{},current=asRow(b.bans)??{}
          const kinds:Record<BanKind,string>={items:'item',spells:'spell',skills:'skill',hiredSwords:'hired sword',characters:'character'}
          for(const kind of Object.keys(kinds) as BanKind[]){
            const was=new Set(Array.isArray(previous[kind])?previous[kind] as string[]:[]), now=new Set(Array.isArray(current[kind])?current[kind] as string[]:[])
            for(const id of new Set([...was,...now])){
              if(was.has(id)===now.has(id))continue
              const name=banName(kind,id)
              add(`${kinds[kind]} ban: ${name}`,was.has(id),now.has(id),now.has(id)?`Banned ${name} (${kinds[kind]}).`:`Lifted the ban on ${name} (${kinds[kind]}).`)
            }
          }
        }else{
          const explicit:Record<string,string>={halfPriceShields:'half-price shields',halfPriceHelmets:'half-price helmets'}
          const label=explicit[rule]??HOUSE_RULE_SWITCHES.find(s=>s.key===rule)?.label??fieldLabel(rule)
          if(rule==='firstSpellRule'){add(label,a[rule],b[rule],`Changed the first spell rule from ${FIRST_SPELL_RULE_OPTIONS.find(o=>o.value===a[rule])?.label??displayValue(a[rule])} to ${FIRST_SPELL_RULE_OPTIONS.find(o=>o.value===b[rule])?.label??displayValue(b[rule])}.`);continue}
          add(label,a[rule],b[rule],typeof b[rule]==='boolean'?`${b[rule]?'Enabled':'Disabled'} ${label}.`:undefined)
        }
      }
    }else if(key==='enabledScenarioIds'){
      const was=new Set(Array.isArray(old[key])?old[key] as string[]:CORE_RULEBOOK_SCENARIO_IDS),now=new Set(Array.isArray(next[key])?next[key] as string[]:CORE_RULEBOOK_SCENARIO_IDS)
      for(const id of new Set([...was,...now]))if(was.has(id)!==now.has(id)){
        const name=SCENARIOS.find(s=>s.id===id)?.title??id
        add(`scenario: ${name}`,was.has(id),now.has(id),`${now.has(id)?'Enabled':'Disabled'} ${name} for new battles.`)
      }
    }else {
      const options=key==='dicePolicy'?DICE_POLICY_OPTIONS:key==='combatMode'?COMBAT_MODE_OPTIONS:null
      const labels:Record<string,string>={reportApproval:'GM approval for post-battle reports',lockCombatMode:'GM-only combat-mode changes',mapCampaign:'map campaign'}
      const label=labels[key]??fieldLabel(key)
      add(label,old[key],next[key],options?`Changed ${label} from ${options.find(o=>o.value===old[key])?.label??displayValue(old[key])} to ${options.find(o=>o.value===next[key])?.label??displayValue(next[key])}.`:typeof next[key]==='boolean'?`${next[key]?'Enabled':'Disabled'} ${label}.`:undefined)
    }
  }
  return changes
}

/**
 * Every column that changed on one audit row, in plain English. An insert reads as "set to X", a
 * delete as "was X"; an update shows both sides. Bookkeeping columns (ids, timestamps) are left out.
 */
export function activityFieldChanges(entry: CampaignActivity): FieldChange[] {
  if(entry.table_name==='match_reports')return reportActivityChanges(entry)
  if(entry.table_name==='pending_advances')return advanceActivityChanges(entry)
  const before = asRow(entry.before)
  const after = asRow(entry.after)
  const keys = new Set([...(before ? Object.keys(before) : []), ...(after ? Object.keys(after) : [])])
  const out: FieldChange[] = []
  for (const key of keys) {
    if (BORING_FIELDS.has(key) || ((/_id$|Id$/.test(key)) && !ID_LOOKUPS[key])) continue
    const a = before?.[key]
    const b = after?.[key]
    if (before && after && sameValue(a, b)) continue
    if(key==='settings' && entry.table_name==='campaigns' && entry.action==='update'){out.push(...campaignSettingChanges(a,b));continue}
    if ((key === 'flags' || key === 'settings' || key === 'stat_increases') && (asRow(a) || asRow(b))) {
      const oldFields = asRow(a) ?? {}, newFields = asRow(b) ?? {}
      for (const child of new Set([...Object.keys(oldFields), ...Object.keys(newFields)])) {
        if (BORING_FIELDS.has(child) || sameValue(oldFields[child], newFields[child])) continue
        if (child === 'leaderLostInMatch') { out.push({label:'Replacement leader',before:'No waiting game recorded',after:'Must play one further game before recruiting'}); continue }
        if (child === 'leaderReplacementReadyAfter') { out.push({label:'Replacement leader',before:oldFields[child]?'Waiting game completed':'Waiting game outstanding',after:newFields[child]?'Waiting game completed — may recruit':'Waiting game outstanding'}); continue }
        if (child === 'protectoratePrayerChoice') { out.push({label:'Next advance',before:oldFields[child]?'Prayer or normal roll':'Normal advancement',after:newFields[child]?'Prayer or normal roll':'Normal advancement'}); continue }
        if (child === 'lustrianReplacementOf') { out.push({label:'Hero replacement',before:oldFields[child]?'Inherited a lost Hero’s position':'Not a replacement',after:newFields[child]?'Inherited a lost Hero’s position':'Not a replacement'}); continue }
        if (child === 'leaderRoleId') { out.push({label:'Leadership',before:oldFields[child]?'Appointed leader':'Not appointed',after:newFields[child]?'Appointed leader':'Not appointed'}); continue }
        if (child === 'spellDifficultyReductions') {
          const oldSpells = asRow(oldFields[child]) ?? {}, newSpells = asRow(newFields[child]) ?? {}
          for (const id of new Set([...Object.keys(oldSpells), ...Object.keys(newSpells)])) {
            if (!sameValue(oldSpells[id], newSpells[id])) out.push({ label: `${spellName(id)} difficulty reduction`, before: String(oldSpells[id] ?? 0), after: String(newSpells[id] ?? 0) })
          }
        } else out.push({ label: fieldLabel(child), before: displayValue(oldFields[child], child), after: displayValue(newFields[child], child) })
      }
      continue
    }
    const statsA = key === 'stats' ? asStats(a) : null
    const statsB = key === 'stats' ? asStats(b) : null
    const changedStats = statsA && statsB ? STAT_ORDER.filter((k) => statsA[k] !== statsB[k]) : null
    const beforeText = statsA ? statsLine(statsA, changedStats ?? undefined) : before ? displayValue(a, key) : '—'
    const afterText = statsB ? statsLine(statsB, changedStats ?? undefined) : after ? displayValue(b, key) : '—'
    // An insert or delete is only worth a line when the field actually held something.
    if ((!before && (afterText === 'none' || b === false)) || (!after && (beforeText === 'none' || a === false))) continue
    out.push({ label: fieldLabel(key), before: beforeText, after: afterText })
  }
  return out.sort((x, y) => x.label.localeCompare(y.label))
}

export interface ActivityTerm { label: string; text?: string }

export function activityTerms(entry: CampaignActivity, label: string, side: 'before' | 'after'): ActivityTerm[] | null {
  const key = Object.keys(FIELD_LABELS).find(k => FIELD_LABELS[k] === label)
  if (!key || !['skills', 'spells', 'item_rules_id', 'injuries'].includes(key)) return null
  const value = asRow(entry[side])?.[key]
  if (value == null) return null
  return (Array.isArray(value) ? value : [value]).map(v => {
    if (typeof v === 'string') {
      const item = key === 'item_rules_id' ? findItem(v) : undefined
      return { label: displayValue(v, key), text: key === 'skills' ? skillText(v) : key === 'spells' ? findSpellOption(v)?.text : item ? [item.description, ...item.specialRules.map(r => `${r.name}: ${r.text}`)].filter(Boolean).join('\n\n') : undefined }
    }
    const injury = asRow(v)
    return { label: displayValue(v, key), text: HERO_INJURIES.find(i => i.code === injury?.injuryCode)?.text }
  })
}

export interface ActivityLine {
  /** Id of the headline entry. */
  id: number
  at: string
  text: string
  /** How many audit rows this line stands for. */
  count: number
  /** What sort of thing happened, for the icon beside the line. */
  icon: IconName
  /** Where the changed thing lives, when it has a page. */
  to: string | null
  /** Every audit row this line stands for, newest first, for the expanded before/after view. */
  entries: CampaignActivity[]
}

/** The icon for an audit entry: what was done first, then which table it touched. */
export function activityIcon(entry: CampaignActivity): IconName {
  switch (entry.reason) {
    case 'trading':
    case 'record_trade':
      return 'trade'
    case 'recruitment':
    case 'hire':
      return 'recruit'
    case 'advancement':
    case 'resolve_pending_advance':
      return 'advances'
    case 'post_battle':
    case 'amend_report':
    case 'approve_report':
    case 'return_report':
    case 'withdraw_report':
      return 'records'
    case 'manual_edit':
    case 'import_fixup':
      return 'edit'
    case 'schedule':
    case 'challenge':
    case 'accept_challenge':
    case 'decline_challenge':
    case 'start_match':
    case 'end_match':
    case 'cancel_match':
    case 'set_district':
      return 'battle'
    case 'transfer_warband':
    case 'move_warband_campaign':
      return 'join'
    case 'toll':
      return 'gold'
  }
  switch (entry.table_name) {
    case 'warbands':
      return 'warbands'
    case 'heroes':
      return 'heroes'
    case 'henchman_groups':
      return 'henchmen'
    case 'items':
      return 'stash'
    case 'campaigns':
      return 'settings'
    case 'campaign_members':
      return 'join'
    case 'matches':
    case 'match_participants':
    case 'battle_sessions':
    case 'battle_events':
      return 'battle'
    case 'match_reports':
    case 'report_revisions':
      return 'records'
    case 'map_adjustments':
      return 'map'
    default:
      return 'history'
  }
}

/** The page for an audit entry: the warband for roster rows, the match for battle rows. */
export function activityLink(entry: CampaignActivity): string | null {
  const after = asRow(entry.after)
  const before = asRow(entry.before)
  const row = after ?? before
  switch (entry.table_name) {
    case 'matches':
    case 'match_participants':
    case 'battle_sessions':
    case 'battle_events':
    case 'match_reports':
    case 'report_revisions': {
      const matchId = entry.table_name === 'matches' ? str(row, 'id') : str(row, 'match_id')
      return matchId ? `/matches/${matchId}` : null
    }
    case 'campaigns':
      return null
    case 'map_adjustments':
      return str(row, 'campaign_id') ? `/campaigns/${str(row, 'campaign_id')}/map` : null
    default:
      return entry.warband_id ? `/warbands/${entry.warband_id}` : null
  }
}

/** Rows of the same batch, in the order we prefer to headline them. */
const HEADLINE_ORDER = ['warbands', 'campaign_members', 'campaigns', 'heroes', 'henchman_groups', 'items']

function headlineRank(table: string): number {
  const i = HEADLINE_ORDER.indexOf(table)
  return i === -1 ? HEADLINE_ORDER.length : i
}

/** Rows the trigger writes as a side effect of another row we already describe. */
function isNoise(entry: CampaignActivity): boolean {
  return entry.reason === 'create_warband' && entry.table_name !== 'warbands'
}

/**
 * Collapse one save into one line. A roster edit writes a row per table touched, all with the
 * same actor, warband and reason within the same transaction; we keep the most telling of them.
 * Expects entries newest first, as the API returns them.
 */
export function activityLines(entries: CampaignActivity[], windowMs = 3000): ActivityLine[] {
  const lines: ActivityLine[] = []
  let group: CampaignActivity[] = []

  const flush = () => {
    if (!group.length) return
    const headline = [...group].sort((a, b) => headlineRank(a.table_name) - headlineRank(b.table_name))[0]
    lines.push({ id: headline.id, at: group[0].at, text: describeActivity(headline), count: group.length, icon: activityIcon(headline), to: activityLink(headline), entries: group })
    group = []
  }

  for (const entry of entries) {
    if (isNoise(entry)) continue
    const first = group[0]
    const sameBatch =
      first &&
      first.actor_id === entry.actor_id &&
      first.warband_id === entry.warband_id &&
      first.reason !== null &&
      first.reason === entry.reason &&
      first.table_name !== 'campaign_members' &&
      Math.abs(Date.parse(first.at) - Date.parse(entry.at)) <= windowMs
    if (!sameBatch) flush()
    group.push(entry)
  }
  flush()
  return lines
}

/** "just now", "5 min ago", "3 h ago", "yesterday", "4 days ago", then a short date. */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return ''
  const seconds = Math.max(0, Math.round((now - then) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 14) return `${days} days ago`
  return new Date(then).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

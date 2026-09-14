import { SPELL_LORES, findLore, loreForUnit, startingMagicOptions, startingMagicFor } from '../../../rules/data/campaign/magic'
import { hiredSwordSpellLoreIds } from '../../../rules/resolve/recruitment'
import type { WarbandTemplate } from '../../../rules/types'
import type { HeroDraft } from './diff'

/** Editing preserves all existing spells, but offers additions from recorded/native sources only. */
export function editorSpellLores(hero: Pick<HeroDraft,'flags'|'spells'|'is_hired_sword'|'hired_sword_rules_id'|'unit_type_rules_id'>, template?: WarbandTemplate): string[] {
  const ids = new Set<string>()
  const chosen = hero.flags.magicLoreId && findLore(hero.flags.magicLoreId)
  if (hero.is_hired_sword) for (const id of hiredSwordSpellLoreIds(hero.hired_sword_rules_id ?? '')) ids.add(id)
  if (chosen) ids.add(chosen.id)
  if (!hero.is_hired_sword && !chosen && template && hero.unit_type_rules_id) {
    const unit = hero.unit_type_rules_id
    const options = startingMagicOptions(unit,template)
    const marked = unit === 'marauders_seer' && hero.flags.chaosMark ? startingMagicFor(unit,template,hero.flags.chaosMark) : undefined
    if (marked?.loreId) ids.add(marked.loreId)
    else if (marked?.id !== 'arkhar') {
      const native = loreForUnit(unit,template)
      if (native) ids.add(native.id)
      else if (options.length) {
        const possible = options.flatMap(option => option.loreId ? [option.loreId] : [])
        const known = SPELL_LORES.find(lore=>possible.includes(lore.id)&&lore.spells.some(spell=>hero.spells.includes(spell.id)))
        for (const id of known ? [known.id] : possible) ids.add(id)
      }
    }
  }
  if (hero.flags.readTomeOfMagic) ids.add('lesser_magic')
  if (hero.flags.readBookOfTheDead) ids.add('necromancy')
  if (hero.flags.readLiberBubonicus) ids.add('magic_of_the_horned_rat')
  // Legacy imported casters without a native/recorded allocation stay on their known lore.
  // An unrelated spell cannot replace a known native lore or a deliberately non-casting option.
  const nonCasterChoice = hero.flags.chronicler || hero.unit_type_rules_id === 'marauders_seer' && hero.flags.chaosMark === 'arkhar'
  if (!ids.size && !nonCasterChoice) for (const lore of SPELL_LORES) if (lore.spells.some(spell=>hero.spells.includes(spell.id))) ids.add(lore.id)
  if (hero.flags.chronicler && !chosen && !hero.flags.readTomeOfMagic) ids.clear()
  return [...ids]
}

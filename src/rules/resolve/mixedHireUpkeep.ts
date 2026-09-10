import type { RosterWarband } from '../types/roster'
export const DWARF_HIRES = ['dwarf_troll_slayer', 'dwarf_pathfinder', 'dwarf_treasure_hunter', 'dwarf_slayer_pirate']
export const ELF_HIRES = ['elf_ranger', 'elf_mage', 'dark_elf_assassin', 'shadow_warrior', 'wood_elf_hunter', 'aenur_the_sword_of_twilight']
export function mixedPirateCrew(roster: RosterWarband): boolean {
  const active = roster.hiredSwords.filter(s => s.status === 'active')
  return roster.warbandTemplateId === 'pirates' && active.some(s => DWARF_HIRES.includes(s.hiredSwordId)) && active.some(s => ELF_HIRES.includes(s.hiredSwordId))
}

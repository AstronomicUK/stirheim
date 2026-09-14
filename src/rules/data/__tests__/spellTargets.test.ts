import { describe, expect, it } from "vitest";
import { SPELL_LORES, findLore } from "../campaign/magic";
import type { SpellTarget } from "../../types/magic";

// Every current catalogue spell has a reviewed target category. Custom/imported
// spells may still omit it and use the existing explicit fallback in CastTab.
const CORE_LORES = ["lesser_magic", "necromancy", "chaos_rituals", "magic_of_the_horned_rat", "prayers_of_sigmar"];
const KINDS: SpellTarget[] = ["friendly", "enemy", "either", "self", "none"];

describe("catalogue spell targets", () => {
  it.each(SPELL_LORES.map(lore=>lore.id))("every spell in %s carries an explicit, valid target", (loreId) => {
    const lore = findLore(loreId);
    expect(lore, loreId).toBeDefined();
    expect(lore!.spells.length).toBeGreaterThan(0);
    for (const spell of lore!.spells) {
      expect(spell.target, `${loreId}/${spell.id}`).toBeDefined();
      expect(KINDS, `${loreId}/${spell.id}: ${spell.target}`).toContain(spell.target);
    }
  });

  it("spells with no roll (source 'Auto') never ask for a chosen model in battle", () => {
    for (const loreId of CORE_LORES) {
      for (const spell of findLore(loreId)!.spells) {
        if (spell.difficulty === null) expect(spell.target, `${loreId}/${spell.id}`).toBe("none");
      }
    }
  });


});


it("preserves any-model healing and distinguishes single enemies, self spells and areas",()=>{
  const spell=(lore:string,id:string)=>findLore(lore)!.spells.find(s=>s.id===id)!
  expect(spell('prayers_of_taal','blessed_ale').target).toBe('either')
  expect(spell('prayers_of_ulric','hammerschlag').target).toBe('either')
  expect(spell('prayers_of_taal','bears_paw').target).toBe('friendly')
  expect(spell('nurgle_rituals','scabrous_hide').target).toBe('self')
  expect(spell('nurgle_rituals','buboes').target).toBe('enemy')
  expect(spell('nurgle_rituals','pestilence').affects).toBe('enemies')
  expect(spell('nurgle_rituals','stench_of_nurgle').affects).toBeUndefined()
  expect(spell('nurgle_rituals','stench_of_nurgle').targetNote).toContain('Agree')
  expect(spell('waaaagh_magic','fire_of_gork').targetNote).toContain('no more than two')
})

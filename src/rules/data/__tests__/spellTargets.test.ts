import { describe, expect, it } from "vitest";
import { SPELL_LORES, findLore } from "../campaign/magic";
import type { SpellTarget } from "../../types/magic";

// The five core rulebook lores: every spell here must say who it is cast on, so the Cast tab can
// offer only the right models (#32/#76). Supplement lores are allowed to leave `target` unset for
// now; the picker falls back to its old behaviour for them. Verified supplements are listed below.
const CORE_LORES = ["lesser_magic", "necromancy", "chaos_rituals", "magic_of_the_horned_rat", "prayers_of_sigmar"];
const REVIEWED_SUPPLEMENTS = ["nurgle_rituals", "onogal_rituals", "prayers_of_taal", "prayers_of_ulric", "waaaagh_magic"];
const KINDS: SpellTarget[] = ["friendly", "enemy", "either", "self", "none"];

describe("core spell targets", () => {
  it.each([...CORE_LORES,...REVIEWED_SUPPLEMENTS])("every spell in %s carries an explicit, valid target", (loreId) => {
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

  it("unreviewed supplement lores retain their explicit fallback", () => {
    const touched = SPELL_LORES.filter((lore) => ![...CORE_LORES,...REVIEWED_SUPPLEMENTS].includes(lore.id)).flatMap((lore) => lore.spells.filter((s) => s.target !== undefined).map((s) => `${lore.id}/${s.id}`));
    expect(touched).toEqual([]);
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

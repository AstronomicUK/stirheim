import { describe, expect, it } from 'vitest'
import { describeDifficulty } from './spellDifficulty'

const d = (over: Partial<Parameters<typeof describeDifficulty>[0]>) => ({ base: 8, effective: 8, modifiers: [], bonus: 0, ...over })

describe('describeDifficulty (#209)', () => {
  it('shows just the Difficulty when nothing has changed it', () => {
    expect(describeDifficulty(d({}))).toBe('Difficulty: 8')
  })
  it("shows the printed base when a learned reduction has lowered it — Tom's own example", () => {
    expect(describeDifficulty(d({ effective: 7 }))).toBe('Difficulty: 7 (Base difficulty 8)')
  })
  it('keeps a casting-roll bonus as its own clause rather than a lower Difficulty', () => {
    expect(describeDifficulty(d({ modifiers: [{ id: 'sorcery', name: 'Sorcery', amount: 1 }], bonus: 1 }))).toBe('Difficulty: 8 · +1 to the casting roll (Sorcery)')
    expect(describeDifficulty(d({ effective: 7, modifiers: [{ id: 'holy_tome', name: 'Holy Tome', amount: 1 }], bonus: 1 }))).toBe('Difficulty: 7 (Base difficulty 8) · +1 to the casting roll (Holy Tome)')
  })
  it('names automatic spells as such', () => {
    expect(describeDifficulty(d({ base: null, effective: null }))).toBe('Cast automatically')
  })
})

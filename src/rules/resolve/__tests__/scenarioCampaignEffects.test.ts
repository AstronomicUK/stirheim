import { describe, it, expect } from 'vitest'
import { scenarioCampaignEffects, scenarioPurchasePrice, type ScenarioEffectReport } from '../scenarioCampaignEffects'
const report = (n: number, effects?: ScenarioEffectReport['effects']): ScenarioEffectReport => ({ id: String(n), matchId: `m${n}`, campaignId: 'c', submittedAt: `2026-09-${String(n).padStart(2, '0')}T12:00:00Z`, effects })
describe('scenario consequences reconstructed from reports', () => {
  it('keeps the escort ban while the rare-search penalty expires after the stated games', () => {
    const first = report(1, { caravanTreachery: 2 })
    expect(scenarioCampaignEffects([first], []).rareGamesRemaining).toBe(2)
    expect(scenarioCampaignEffects([first, report(2)], []).rareGamesRemaining).toBe(1)
    const done = scenarioCampaignEffects([first, report(2), report(3)], [])
    expect(done.rarePenalty).toBe(0); expect(done.caravanBannedCampaigns).toEqual(['c'])
    expect(scenarioCampaignEffects([report(2)], []).caravanBannedCampaigns).toEqual([])
  })
  it('expires a price adjustment at the next battle start, not when a future report is filed', () => {
    const first = report(1, { caravanTrade: { percent: -20, rounding: 'up' } })
    expect(scenarioCampaignEffects([first], []).trade?.percent).toBe(-20)
    expect(scenarioCampaignEffects([first], [{ id: 'm2', startedAt: '2026-09-02T10:00:00Z' }]).trade).toBeUndefined()
    expect(scenarioCampaignEffects([first], [{ id: 'm1', startedAt: '2026-09-01T10:00:00Z' }]).trade).toBeDefined()
  })
  it('does not feed later reports into an earlier report being edited', () => {
    const history = [report(1), report(2, { caravanTreachery: 4 }), report(3)]
    expect(scenarioCampaignEffects(history, [], 'm1').caravanBannedCampaigns).toEqual([])
    expect(scenarioCampaignEffects(history, [], 'm3').rareGamesRemaining).toBe(4)
  })
  it('rounds the complete purchase using the saved table choice', () => {
    expect(scenarioPurchasePrice(13, { percent: -20, rounding: 'up' })).toBe(11)
    expect(scenarioPurchasePrice(13, { percent: -20, rounding: 'down' })).toBe(10)
    expect(scenarioPurchasePrice(13, { percent: 20, rounding: 'up' })).toBe(16)
    expect(scenarioPurchasePrice(13)).toBe(13)
  })
})


it('does not renew benefits or reorder penalties when an old report is resubmitted later', () => {
  const first = { ...report(1, { caravanTrade: { percent: -20, rounding: 'up' }, caravanTreachery: 2 }), battleAt: '2026-09-01T10:00:00Z', submittedAt: '2026-09-09T10:00:00Z' }
  const second = { ...report(2), battleAt: '2026-09-02T10:00:00Z' }
  const r = scenarioCampaignEffects([second, first], [{ id: 'm2', startedAt: second.battleAt }])
  expect(r.trade).toBeUndefined(); expect(r.rareGamesRemaining).toBe(1)
})


it('keeps Raids resources between battles, excludes the current award and consumes each selected resource once',()=>{
 const gain=report(1,{raidCaptives:{gained:3,spent:0}}),use=report(2,{raidCaptives:{gained:0,spent:2}})
 expect(scenarioCampaignEffects([gain,use],[]).raidCaptives).toBe(1)
 expect(scenarioCampaignEffects([gain,use],[],'m2').raidCaptives).toBe(3)
 expect(scenarioCampaignEffects([gain,use],[],'m1').raidCaptives).toBeUndefined()
 expect(scenarioCampaignEffects([gain],[]).raidCaptives).toBe(3)
 expect(scenarioCampaignEffects([],[]).raidCaptives).toBeUndefined()
})

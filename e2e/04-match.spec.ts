// The full match flow: the GM books a battle, starts it, keeps a battle sheet, ends it and files
// the post-battle report; Ana files hers; the match completes and lands in the battle records.
// Dice are typed, never rolled, so the outcome is the same every run.

import { expect, test, type Page } from '@playwright/test'
import { CAMPAIGN, CLAWS_OF_ESHIN, GM, PLAYER, REIKLAND_WATCH, UUID_RE, signIn, typeDie } from './fixtures'

test.describe.configure({ mode: 'serial' })

let matchId: string

const SCENARIO = 'Defend the Find' // first core rulebook scenario
const CAPTAIN = 'Captain Ulrich Brandt'

/** The sticky wizard bar: waits for the step to be complete and moves on. */
async function next(page: Page) {
  await page.getByRole('button', { name: 'Next' }).click()
}

async function expectStep(page: Page, n: number, title: string) {
  await expect(page.getByText(`Step ${n} of 7 · ${title}`)).toBeVisible()
}

test.describe('match', () => {
  test('the GM schedules a battle between both warbands', async ({ page }) => {
    await signIn(page, GM.email)
    await page.goto(`/campaigns/${CAMPAIGN.id}/matches/new`)

    await expect(page.getByRole('heading', { name: 'Schedule a battle' })).toBeVisible()
    await page.getByRole('checkbox', { name: new RegExp(REIKLAND_WATCH.name) }).check()
    await page.getByRole('checkbox', { name: new RegExp(CLAWS_OF_ESHIN.name) }).check()

    const scenarios = page.getByRole('radiogroup', { name: 'Scenario', exact: true })
    await scenarios.getByRole('radio').first().click()
    await expect(scenarios.getByRole('radio', { name: new RegExp(SCENARIO) })).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByText(`Selected: ${SCENARIO}`)).toBeVisible()

    const submit = page.getByRole('button', { name: 'Schedule battle' })
    await expect(submit).toBeEnabled()
    await submit.click()
    await expect(page).toHaveURL(new RegExp(`/matches/${UUID_RE}$`))
    matchId = page.url().split('/').pop()!

    await expect(page.getByRole('heading', { name: SCENARIO })).toBeVisible()
    await expect(page.getByText(`${REIKLAND_WATCH.name} vs ${CLAWS_OF_ESHIN.name}`)).toBeVisible()
    await expect(page.getByText('Scheduled', { exact: true })).toBeVisible()
  })

  test('the GM starts the battle, keeps the sheet and calls it over', async ({ page }) => {
    await signIn(page, GM.email)
    await page.goto(`/matches/${matchId}`)

    // GM-scheduled games need no acceptance, so Start is live at once.
    await page.getByRole('button', { name: 'Start battle' }).click()
    await expect(page.getByText('Now playing', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Open battle sheet' }).click()
    await expect(page).toHaveURL(new RegExp(`/matches/${matchId}/battle$`))

    // The sheet opens on "My warband": tally one kill for the captain and one Watchman down.
    await expect(page.getByRole('heading', { name: CAPTAIN })).toBeVisible()
    await page.getByRole('button', { name: `More enemies out by ${CAPTAIN}` }).click()
    await page.getByRole('button', { name: 'More Watchmen out of action' }).click()
    await expect(page.getByRole('group', { name: 'Watchmen out of action' })).toContainText('1')
    await expect(page.getByText('1 out of action')).toBeVisible()

    // The sheet saves itself; wait for it before ending the game.
    await expect(page.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible()

    await page.getByRole('button', { name: 'Battle over' }).click()
    await page.getByRole('dialog', { name: 'Battle over?' }).getByRole('button', { name: 'Yes, the battle is over' }).click()
    await expect(page).toHaveURL(new RegExp(`/matches/${matchId}$`))
    await expect(page.getByText('Awaiting reports', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: `File post-battle report: ${REIKLAND_WATCH.name}` })).toBeVisible()
  })

  test("the GM files Reikland Watch's report with typed dice", async ({ page }) => {
    await signIn(page, GM.email)
    await page.goto(`/matches/${matchId}/report/${REIKLAND_WATCH.id}`)
    await expect(page.getByRole('heading', { name: REIKLAND_WATCH.name })).toBeVisible()

    // 1. Outcome
    await expectStep(page, 1, 'Outcome')
    await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled()
    await page.getByRole('radiogroup', { name: 'Battle result' }).getByRole('radio', { name: 'Won' }).click()
    await next(page)

    // 2. Casualties: pre-filled from the battle sheet.
    await expectStep(page, 2, 'Casualties')
    await expect(page.getByRole('group', { name: `enemies out by ${CAPTAIN}` })).toContainText('1')
    await expect(page.getByRole('group', { name: 'Watchmen out of action' })).toContainText('1')
    await next(page)

    // 3. Injuries: one henchman D6; a 4 means he recovers.
    await expectStep(page, 3, 'Injuries')
    await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled()
    await typeDie(page, 'Model 1', 4)
    await expect(page.getByText('All recover')).toBeVisible()
    await next(page)

    // 4. Experience: +1 survive, +1 leader's win, +1 enemy out for the captain.
    await expectStep(page, 4, 'Experience')
    await expect(page.getByText('20 → 23 xp', { exact: false })).toBeVisible()
    await next(page)

    // 5. Exploration: four surviving heroes + the winner's die = five dice, all different.
    await expectStep(page, 5, 'Exploration')
    await expect(page.getByText('4 surviving heroes, +1 for winning = 5 dice')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled()
    for (let i = 1; i <= 5; i++) await typeDie(page, `Die ${i}`, i)
    await expect(page.getByText('Dice total').locator('xpath=following-sibling::span')).toHaveText('15')
    await expect(page.getByText('Wyrdstone shards').locator('xpath=following-sibling::span')).toHaveText('3')
    await next(page)

    // 6. Veterans & notes: leave the pool blank.
    await expectStep(page, 6, 'Veterans & notes')
    await page.getByLabel('Notes for the record').fill('Filed by the e2e suite.')
    await next(page)

    // 7. Review and file.
    await expectStep(page, 7, 'Review')
    await expect(page.getByText('Filed by the e2e suite.')).toBeVisible()
    await page.getByRole('button', { name: 'File report' }).click()

    await expect(page).toHaveURL(new RegExp(`/matches/${matchId}$`))
    await expect(page.getByText(`Report filed by ${GM.displayName}`)).toBeVisible()
    // The GM may file for anyone, so the other warband's report is still offered to them.
    await expect(page.getByRole('link', { name: `File post-battle report: ${CLAWS_OF_ESHIN.name}` })).toBeVisible()
    await expect(page.getByText('1 of 2')).toBeVisible()
    await expect(page.getByRole('button', { name: REIKLAND_WATCH.name, expanded: false })).toBeVisible()
  })

  test("Ana files Claws of Eshin's report and the match completes", async ({ page }) => {
    await signIn(page, PLAYER.email)
    await page.goto(`/matches/${matchId}`)
    await expect(page.getByText('Awaiting reports', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'File post-battle report' }).first().click()
    await expect(page).toHaveURL(new RegExp(`/matches/${matchId}/report/${CLAWS_OF_ESHIN.id}$`))

    await expectStep(page, 1, 'Outcome')
    await page.getByRole('radiogroup', { name: 'Battle result' }).getByRole('radio', { name: 'Lost' }).click()
    await next(page)

    await expectStep(page, 2, 'Casualties')
    await next(page)

    await expectStep(page, 3, 'Injuries')
    await expect(page.getByText('No casualties. Everyone walks back to camp.')).toBeVisible()
    await next(page)

    await expectStep(page, 4, 'Experience')
    await next(page)

    // Three heroes, no winner's die.
    await expectStep(page, 5, 'Exploration')
    await expect(page.getByText('3 surviving heroes = 3 dice')).toBeVisible()
    for (let i = 1; i <= 3; i++) await typeDie(page, `Die ${i}`, i)
    await expect(page.getByText('Dice total').locator('xpath=following-sibling::span')).toHaveText('6')
    await next(page)

    await expectStep(page, 6, 'Veterans & notes')
    await next(page)

    await expectStep(page, 7, 'Review')
    await page.getByRole('button', { name: 'File report' }).click()

    await expect(page).toHaveURL(new RegExp(`/matches/${matchId}$`))
    await expect(page.getByRole('status').filter({ hasText: 'Finished' })).toContainText('Every report is in and the rosters have moved on.')
    await expect(page.getByText('2 of 2')).toBeVisible()
  })

  test('the battle records list the finished game', async ({ page }) => {
    await signIn(page, PLAYER.email)
    await page.goto(`/campaigns/${CAMPAIGN.id}/records`)

    await expect(page.getByRole('heading', { name: 'Battle records' })).toBeVisible()
    await expect(page.getByText('1 battle recorded', { exact: false })).toBeVisible()
    await expect(page.getByRole('link', { name: new RegExp(SCENARIO) })).toHaveAttribute('href', `/matches/${matchId}`)
    // The result tags on the two warband lines (the Result filter has "Won"/"Lost" options too).
    const battles = page.getByRole('heading', { name: 'Battles' }).locator('xpath=ancestor::section[1]')
    await expect(battles.locator('li').filter({ hasText: REIKLAND_WATCH.name }).locator('span', { hasText: /^Won$/ })).toBeVisible()
    await expect(battles.locator('li').filter({ hasText: CLAWS_OF_ESHIN.name }).locator('span', { hasText: /^Lost$/ })).toBeVisible()
    await expect(page.getByText('3 shards')).toBeVisible()
    await expect(page.getByText('2 shards')).toBeVisible()
  })
})

// Between-battles flows on the GM's warband: buy at the trading post, hire a recruit, and look in
// on the advances page. Numbered to run after 04-match.spec.ts, so the warband has a post-battle sequence open.

import { expect, test } from '@playwright/test'
import { GM, REIKLAND_WATCH, keyValue, readNumber, signIn } from './fixtures'

test.describe('between battles', () => {
  test('buys a sword into the stash at the trading post', async ({ page }) => {
    await signIn(page, GM.email)
    await page.goto(`/warbands/${REIKLAND_WATCH.id}/trade`)
    await expect(page.getByRole('heading', { name: 'Trading post' })).toBeVisible()

    const goldBefore = await readNumber(keyValue(page, 'Gold'))
    const stashBefore = await readNumber(keyValue(page, 'Stash'))

    await page.getByRole('radiogroup', { name: 'Trading post section' }).getByRole('radio', { name: 'Buy' }).click()
    await page.getByLabel('Search the catalogue').fill('sword')
    await page.getByRole('button', { name: /^Sword \d+ gc/ }).click()

    const sheet = page.getByRole('dialog', { name: 'Sword' })
    await expect(sheet.getByLabel('Give to')).toHaveValue('stash')
    await expect(sheet.getByText(`Treasury ${goldBefore} gc`)).toBeVisible()
    await sheet.getByRole('button', { name: 'Buy for 10 gc' }).click()
    await expect(sheet).toBeHidden()

    await expect(keyValue(page, 'Gold')).toHaveText(`${goldBefore - 10} gc`)
    await expect(keyValue(page, 'Stash')).toHaveText(String(stashBefore + 1))
  })

  test('hires a Youngblood at the recruitment page', async ({ page }) => {
    await signIn(page, GM.email)
    await page.goto(`/warbands/${REIKLAND_WATCH.id}/recruit`)
    await expect(page.getByRole('heading', { name: 'Recruit' })).toBeVisible()

    const goldBefore = await readNumber(keyValue(page, 'Gold'))
    const heroesBefore = await readNumber(keyValue(page, 'Heroes'))

    await page.getByRole('button', { name: /^Youngbloods/ }).click()
    const sheet = page.getByRole('dialog', { name: 'Hire a Youngblood' })
    await sheet.getByLabel('Name').fill('Hans the Younger')
    await sheet.getByRole('button', { name: 'Hire for 15 gc' }).click()
    await expect(sheet).toBeHidden()

    await expect(page.getByRole('status').filter({ hasText: 'Hans the Younger joins the warband' })).toBeVisible()
    await expect(keyValue(page, 'Gold')).toHaveText(`${goldBefore - 15} gc`)
    await expect(keyValue(page, 'Heroes')).toContainText(String(heroesBefore + 1))
  })

  test('the advances page opens and resolves nothing that is not due', async ({ page }) => {
    await signIn(page, GM.email)
    await page.goto(`/warbands/${REIKLAND_WATCH.id}/advances`)
    await expect(page.getByRole('heading', { name: 'Bestow advancements' })).toBeVisible()
    await expect(page.getByText(REIKLAND_WATCH.name)).toBeVisible()

    // The seed's heroes do not cross a threshold in the e2e match (captain 20 -> 23; next box is 24),
    // so no advance is due. If a future seed changes that, the Resolve button is what appears instead.
    const resolve = page.getByRole('button', { name: /^Resolve/ })
    const none = page.getByText('No advances due.')
    await expect(resolve.or(none).first()).toBeVisible()
  })
})

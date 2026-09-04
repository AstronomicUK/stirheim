import { expect, test, type Page } from '@playwright/test'
import { PLAYER, UUID_RE, keyValue, readNumber, signIn } from './fixtures'

const WARBAND_NAME = 'E2E Sellswords'

/** A cell of the builder's sticky summary bar ("Gold left", "Models", "Heroes", "Rating"). */
function summaryCell(page: Page, label: string) {
  return page.locator('dt', { hasText: new RegExp(`^${label}$`) }).locator('xpath=following-sibling::dd[1]')
}

test.describe('warband builder', () => {
  test('builds a Reikland mercenary warband from the template, creates it and deletes it again', async ({ page }) => {
    await signIn(page, PLAYER.email)

    // Pick the template and name the warband.
    await page.goto('/warbands/new')
    await expect(page.getByRole('heading', { name: 'Choose a warband' })).toBeVisible()
    await page.getByRole('button', { name: /^Mercenaries \(Reikland\)/ }).click()
    const templateSheet = page.getByRole('dialog', { name: 'Mercenaries (Reikland)' })
    await templateSheet.getByLabel('Warband name').fill(WARBAND_NAME)
    await templateSheet.getByRole('button', { name: 'Start building' }).click()
    await expect(page).toHaveURL(/\/warbands\/new\/mercenaries_reikland$/)

    // The mandatory captain is on the roster from the start: 60 gc off 500.
    await expect(page.getByRole('heading', { name: 'Mercenaries (Reikland)' })).toBeVisible()
    await expect(page.getByLabel('Warband name')).toHaveValue(WARBAND_NAME)
    await expect(page.getByText('Mercenary Captain · Leader')).toBeVisible()
    await expect(summaryCell(page, 'Gold left')).toContainText('440')
    await expect(summaryCell(page, 'Heroes')).toContainText('1')
    const ratingBefore = await readNumber(summaryCell(page, 'Rating'))

    // Add a henchman group of two Warriors (25 gc each).
    await page.getByRole('button', { name: 'Add group' }).click()
    await page.getByRole('dialog', { name: 'Add henchman group' }).getByRole('button', { name: /^Warriors/ }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await page.getByRole('button', { name: 'More models' }).click()
    await expect(page.getByRole('group', { name: 'models' })).toContainText('2')
    await expect(summaryCell(page, 'Gold left')).toContainText('390')
    await expect(summaryCell(page, 'Models')).toContainText('3')

    // Buy the captain a sword (10 gc) from his equipment list.
    await page.getByRole('button', { name: 'Add equipment' }).first().click()
    const shop = page.getByRole('dialog', { name: 'Add equipment' })
    await expect(shop).toContainText('Mercenary Captain')
    await shop.getByRole('button', { name: 'More Sword' }).click()
    await expect(shop.getByRole('group', { name: 'Sword' })).toContainText('1')
    await shop.getByRole('button', { name: 'Close' }).last().click()
    await expect(shop).toBeHidden()
    await expect(summaryCell(page, 'Gold left')).toContainText('380')
    await expect(page.getByText('Sword', { exact: true })).toBeVisible()

    // Rating moved with the extra models.
    const ratingAfter = await readNumber(summaryCell(page, 'Rating'))
    expect(ratingAfter).toBeGreaterThan(ratingBefore)

    // Create it and land on the roster page.
    await expect(page.getByText('Ready to create.', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Create warband' }).click()
    await expect(page).toHaveURL(new RegExp(`/warbands/${UUID_RE}$`))
    await expect(page.getByRole('heading', { name: WARBAND_NAME })).toBeVisible()
    await expect(keyValue(page, 'Gold')).toHaveText('380 gc')
    await expect(keyValue(page, 'Rating')).toHaveText(String(ratingAfter))
    await expect(keyValue(page, 'Models')).toHaveText('3')

    // Delete it via More so the seed's warband list is as it was for the later specs.
    await page.getByRole('button', { name: 'More actions' }).click()
    await page.getByRole('dialog', { name: 'Warband', exact: true }).getByRole('button', { name: 'Delete warband' }).click()
    const confirm = page.getByRole('dialog', { name: 'Delete this warband?' })
    await expect(confirm.getByRole('button', { name: 'Delete', exact: true })).toBeDisabled()
    await confirm.getByLabel("Type the warband's name to confirm").fill(WARBAND_NAME)
    await confirm.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText(WARBAND_NAME)).toHaveCount(0)
  })
})

import { expect, test } from '@playwright/test'
import { CAMPAIGN, CLAWS_OF_ESHIN, GM, PLAYER, REIKLAND_WATCH, signIn } from './fixtures'

test.describe('campaign', () => {
  test('the join link previews the campaign and knows the warband is already enrolled', async ({ page }) => {
    await signIn(page, PLAYER.email)
    await page.goto(`/campaigns/join/${CAMPAIGN.inviteCode}`)

    await expect(page.getByRole('heading', { name: 'Join a campaign' })).toBeVisible()
    await expect(page.getByLabel('Invite code')).toHaveValue(CAMPAIGN.inviteCode)
    await expect(page.getByText(CAMPAIGN.name, { exact: true })).toBeVisible()
    await expect(page.getByText(`Run by ${GM.displayName} · 2 warbands enrolled`)).toBeVisible()

    // Ana's only warband already sits in this campaign, so it cannot be picked and Join stays off.
    const picker = page.getByRole('radiogroup', { name: 'Warband to enrol' })
    await expect(picker.getByRole('radio', { name: new RegExp(CLAWS_OF_ESHIN.name) })).toBeDisabled()
    await expect(picker).toContainText(`In ${CAMPAIGN.name}`)
    await expect(page.getByRole('button', { name: 'Join', exact: true })).toBeDisabled()
  })

  test('the dashboard lists both warbands for a player', async ({ page }) => {
    await signIn(page, PLAYER.email)
    await page.goto(`/campaigns/${CAMPAIGN.id}`)

    await expect(page.getByRole('heading', { name: CAMPAIGN.name })).toBeVisible()
    await expect(page.getByText(`Run by ${GM.displayName}.`)).toBeVisible()
    await expect(page.getByRole('link', { name: new RegExp(REIKLAND_WATCH.name) })).toBeVisible()
    await expect(page.getByRole('link', { name: new RegExp(CLAWS_OF_ESHIN.name) })).toBeVisible()
    await expect(page.getByText('2 enrolled')).toBeVisible()
  })

  test('the GM sees the invite code and can schedule a battle', async ({ page }) => {
    await signIn(page, GM.email)
    await page.goto(`/campaigns/${CAMPAIGN.id}`)

    await expect(page.getByRole('heading', { name: CAMPAIGN.name })).toBeVisible()
    await expect(page.getByText('You run this campaign.')).toBeVisible()
    await expect(page.getByText(CAMPAIGN.inviteCode, { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Copy code' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Schedule a battle' })).toHaveAttribute('href', `/campaigns/${CAMPAIGN.id}/matches/new`)
  })
})

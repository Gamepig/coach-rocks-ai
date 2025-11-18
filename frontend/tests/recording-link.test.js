import { test, expect } from '@playwright/test'

test.describe('Recording Link', () => {
  test.beforeAll(() => {
    test.skip(true, '此測試需待 MeetingDetailView 與 API 完整整合後啟用')
  })

  test('顯示錄影連結與權限狀態', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('recording-link')).toBeVisible()
    await expect(page.getByTestId('access-badge')).toBeVisible()
  })

  test('可複製連結與於新分頁開啟', async ({ page }) => {
    await page.goto('/')
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByTestId('recording-link').click(),
    ])
    await expect(popup).toBeDefined()
    await page.getByTestId('copy-button').click()
  })

  test('尚未可用時顯示提示並可重試', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('recording-link-unavailable')).toBeVisible()
  })
})

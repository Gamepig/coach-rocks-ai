import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const tmpDir = path.join(process.cwd(), 'frontend', 'tmp')

async function ensureTmp() {
  await fs.promises.mkdir(tmpDir, { recursive: true })
}

async function createFile(filePath, sizeBytes) {
  // Create sparse file of given size
  const fd = await fs.promises.open(filePath, 'w')
  try {
    await fd.truncate(sizeBytes)
  } finally {
    await fd.close()
  }
}

test.describe('MeetingUploadModal Tests (T26)', () => {
  test.beforeEach(async ({ page }) => {
    await ensureTmp()
    // Seed session token before any app scripts run
    await page.addInitScript(() => {
      window.localStorage.setItem('sessionToken', 'pw-test-token')
    })

    // Stub backend APIs used on app boot
    await page.route('http://localhost:8788/api/validate-session', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, user: { email: 'test@example.com', onboarding_completed: true } }) })
    })
    await page.route('http://localhost:8788/api/dashboard', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) })
    })
    await page.route('http://localhost:8788/api/meetings/list', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    })
    await page.route('http://localhost:8788/api/clients/list', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [{ client_id: 'c1', name: 'Test Client' }] }) })
    })
    await page.route('http://localhost:8788/api/reels/list', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    })

    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Open modal
    await expect(page.getByText('Welcome back')).toBeVisible()
    await page.getByText('🚀 Analyze New Meeting').click()
    await expect(page.getByText('Analyze Meeting')).toBeVisible()
  })

  test('T26-BT-002 預設日期驗證與格式', async ({ page }) => {
    const dateInput = page.locator('#meeting-date')
    // 預設在第 1 步時日期欄位尚未顯示，先選擇一個小檔案讓流程進入第 3 步
    const smallFile = path.join(tmpDir, 'small.mp4')
    await createFile(smallFile, 512 * 1024) // 512KB
    await page.setInputFiles('input[accept=".mp4"]', smallFile)

    await expect(dateInput).toBeVisible()
    const value = await dateInput.inputValue()
    const today = new Date().toISOString().split('T')[0]
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(value).toBe(today)
  })

  test('T26-BT-001 日期選擇器更新', async ({ page }) => {
    const smallFile = path.join(tmpDir, 'small2.mp4')
    await createFile(smallFile, 1024 * 1024)
    await page.setInputFiles('input[accept=".mp4"]', smallFile)

    const dateInput = page.locator('#meeting-date')
    await dateInput.fill('2025-01-02')
    await expect(dateInput).toHaveValue('2025-01-02')
  })

  test('T26-BT-004 幫助文字顯示', async ({ page }) => {
    // 上傳區域幫助文字（步驟一）
    await expect(page.getByText('Recommended: Meetings under 60 minutes • Maximum file size: 1GB')).toBeVisible()

    // 進入步驟三後，檢查日期幫助文字
    const smallFile = path.join(tmpDir, 'small3.mp4')
    await createFile(smallFile, 256 * 1024)
    await page.setInputFiles('input[accept=".mp4"]', smallFile)
    await expect(page.getByText('Select the date when the meeting occurred')).toBeVisible()
  })

  test('T26-BT-003 檔案大小驗證（<, =, > 1GB）', async ({ page }) => {
    // < 1GB
    const smallFile = path.join(tmpDir, 'lt1g.mp4')
    await createFile(smallFile, 5 * 1024 * 1024)
    await page.setInputFiles('input[accept=".mp4"]', smallFile)
    await expect(page.getByRole('heading', { name: 'Select Client' })).toBeVisible()

    // 返回重新選檔（Change File）
    await page.getByText('Change File').click()

    // = 1GB（接受）
    const eqFile = path.join(tmpDir, 'eq1g.mp4')
    await createFile(eqFile, 1024 * 1024 * 1024)
    await page.setInputFiles('input[accept=".mp4"]', eqFile)
    await expect(page.getByRole('heading', { name: 'Select Client' })).toBeVisible()

    await page.getByText('Change File').click()

    // > 1GB（拒絕 + alert）
    const gtFile = path.join(tmpDir, 'gt1g.mp4')
    await createFile(gtFile, 1024 * 1024 * 1024 + 1)
    const dialogs = []
    page.once('dialog', async (d) => { dialogs.push(d.message()); await d.accept(); })
    await page.setInputFiles('input[accept=".mp4"]', gtFile)
    expect(dialogs[0]).toContain('File size exceeds 1GB limit')
    // 應該仍停留在第 1 步（未出現 Select Client）
    await expect(page.getByRole('heading', { name: 'Select Client' })).toHaveCount(0)
  })

  test('T26-BT-005 API Payload 包含 meetingDate', async ({ page }) => {
    const smallFile = path.join(tmpDir, 'payload.mp4')
    await createFile(smallFile, 1 * 1024 * 1024)
    await page.setInputFiles('input[accept=".mp4"]', smallFile)

    // 切換為 New Client 並輸入名稱
    await page.locator('label.client-option:has-text("New Client")').click()
    await page.fill('#new-client-name', 'Alice')

    // 設定特定日期
    const dateInput = page.locator('#meeting-date')
    await dateInput.fill('2025-01-02')

    let capturedBody = null
    await page.route('http://localhost:8788/api/analyze-authenticated-meeting', async route => {
      const body = route.request().postDataJSON()
      capturedBody = body
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, meetingId: 'm-1' }) })
    })

    await page.getByText('🚀 Analyze Meeting').click()
    await expect.poll(() => capturedBody ? 'ok' : '').toBe('ok')
    expect(capturedBody.meetingDate).toBe('2025-01-02')
  })

  test('T26-BT-006 關閉後狀態重置', async ({ page }) => {
    const smallFile = path.join(tmpDir, 'reset.mp4')
    await createFile(smallFile, 1 * 1024 * 1024)
    await page.setInputFiles('input[accept=".mp4"]', smallFile)

    const dateInput = page.locator('#meeting-date')
    await dateInput.fill('2025-01-02')

    // 關閉
    await page.getByRole('button', { name: '×' }).click()

    // 重新開啟
    await page.getByText('🚀 Analyze New Meeting').click()

    // 再次選檔讓日期欄位可見
    const smallFile2 = path.join(tmpDir, 'reset2.mp4')
    await createFile(smallFile2, 1 * 1024 * 1024)
    await page.setInputFiles('input[accept=".mp4"]', smallFile2)

    const value = await page.locator('#meeting-date').inputValue()
    const today = new Date().toISOString().split('T')[0]
    expect(value).toBe(today)
  })
})

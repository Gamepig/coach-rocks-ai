import { test, expect } from '@playwright/test'

/**
 * Week 1 Item 3: Bug 修復測試驗證
 * 
 * 測試範圍：
 * 1. REELS 顯示測試（在 MeetingDetailView 中）
 * 2. Clients OPEN 按鈕測試
 * 3. Mind Map 顯示測試（增強現有測試）
 * 
 * 執行方式：
 * - 本地環境：npm test (需要啟動前端開發伺服器)
 * - 使用 API mocking，不需要真實後端
 */

test.describe('Week 1 Item 3: Bug 修復測試驗證', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('sessionToken', 'test-session-token')
    })

    // Mock API endpoints
    await page.route('http://localhost:8788/api/validate-session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: true,
          user: { email: 'test@example.com', onboarding_completed: true }
        })
      })
    })

    // Mock clients API
    await page.route('**/api/clients/list', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                client_id: 'c1',
                name: 'Alice Johnson',
                email: 'alice@example.com',
                notes: 'VIP client',
                tags: [{ id: 't1', name: 'vip', color: '#e5e7eb' }],
                status: 'Active',
                is_favorite: true,
                meeting_count: 2,
                sessionCounts: 2,
                totalSessions: 2
              },
              {
                client_id: 'c2',
                name: 'Bob Smith',
                email: 'bob@example.com',
                notes: 'Regular client',
                tags: [],
                status: 'Active',
                is_favorite: false,
                meeting_count: 1,
                sessionCounts: 1,
                totalSessions: 1
              }
            ]
          })
        })
      } else {
        await route.continue()
      }
    })

    // Mock meetings API
    await page.route('**/api/meetings/list', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              meeting_id: 'm1',
              client_id: 'c1',
              client_name: 'Alice Johnson',
              meeting_title: 'Q1 Review',
              meeting_date: '2024-01-15',
              created_at: '2024-01-15T10:00:00Z',
              analysis_status: 'completed',
              hasReels: true,
              summary: { key_points: ['Point 1', 'Point 2'] },
              followUpEmail: { subject: 'Follow up', body: 'Email body' },
              socialMediaContent: { content: 'Social media post' }
            },
            {
              meeting_id: 'm2',
              client_id: 'c1',
              client_name: 'Alice Johnson',
              meeting_title: 'Strategy Session',
              meeting_date: '2024-02-20',
              created_at: '2024-02-20T14:00:00Z',
              analysis_status: 'completed',
              hasReels: false,
              summary: { key_points: ['Point 3'] },
              followUpEmail: { subject: 'Follow up 2', body: 'Email body 2' },
              socialMediaContent: { content: 'Social media post 2' }
            }
          ])
        })
      } else {
        await route.continue()
      }
    })

    // Mock dashboard API
    await page.route('**/api/dashboard/stats', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalMeetings: 2,
            totalClients: 2,
            clientsServed: 2,
            reelsGenerated: 1
          }
        })
      })
    })

    // Navigate to the app
    await page.goto('/')
    await page.waitForTimeout(2000) // Wait for initial load
  })

  // ==========================================
  // Test 1: REELS 顯示測試
  // ==========================================
  test('W1-BUG-1: REELS 顯示測試 - MeetingDetailView 中顯示 Reels', async ({ page }) => {
    // Mock meeting with Reels data
    const meetingWithReels = {
      meeting_id: 'm1',
      client_id: 'c1',
      client_name: 'Alice Johnson',
      meeting_title: 'Q1 Review',
      meeting_date: '2024-01-15',
      created_at: '2024-01-15T10:00:00Z',
      analysis_status: 'completed',
      summary: {
        summary: 'Meeting summary text',
        clientName: 'Alice Johnson',
        meetingTitle: 'Q1 Review'
      },
      followUpEmail: {},
      socialMediaContent: {
        reels: [
          {
            hook: '3 Mistakes That Kill Your Conversion Rate',
            narrative: 'Are you making these common mistakes? Here\'s how to fix them and boost your conversion rate.',
            callToAction: 'Book a free consultation today!',
            hashtags: ['coaching', 'business', 'growth']
          },
          {
            hook: 'The Secret to Client Success',
            narrative: 'Discover the proven strategies that top coaches use to help their clients achieve breakthrough results.',
            callToAction: 'Learn more in our free guide',
            hashtags: ['success', 'coaching', 'strategy']
          }
        ]
      },
      mindMap: 'mindmap\n  root((Client Goals))\n    Goal 1\n    Goal 2',
      nextMeetingPrep: {}
    }

    // Mock get-by-id API with Reels data
    await page.route('**/api/meetings/get-by-id*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: meetingWithReels
        })
      })
    })

    // Navigate to Clients tab
    await page.getByRole('button', { name: /Clients/i }).click()
    await page.waitForTimeout(1000)

    // Click on client row to open ClientDetails
    const clientRow = page.getByTestId('client-row-c1')
    await expect(clientRow).toBeVisible({ timeout: 10000 })
    await clientRow.click()
    await page.waitForTimeout(1000)

    // Wait for ClientDetails to load
    await expect(page.getByText('Alice Johnson')).toBeVisible({ timeout: 10000 })

    // Click "View Details" button for the first meeting
    const viewDetailsButton = page.getByRole('button', { name: /View Details/i }).first()
    await expect(viewDetailsButton).toBeVisible({ timeout: 10000 })
    await viewDetailsButton.click()
    await page.waitForTimeout(2000)

    // Wait for MeetingDetailView to load
    await expect(page.getByText('Q1 Review')).toBeVisible({ timeout: 10000 })

    // Verify Reels section exists
    const reelsSection = page.getByText('Social Media Reels Scripts')
    await expect(reelsSection).toBeVisible({ timeout: 10000 })

    // Expand Reels section (click on accordion)
    await reelsSection.click()
    await page.waitForTimeout(1000)

    // Verify Reel #1 content
    await expect(page.getByText('Reel #1')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('3 Mistakes That Kill Your Conversion Rate')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Are you making these common mistakes?')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Book a free consultation today!')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('#coaching')).toBeVisible({ timeout: 5000 })

    // Verify Reel #2 content
    await expect(page.getByText('Reel #2')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('The Secret to Client Success')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Discover the proven strategies')).toBeVisible({ timeout: 5000 })
  })

  test('W1-BUG-1-2: REELS 顯示測試 - 沒有 Reels 的會議不顯示區塊', async ({ page }) => {
    // Mock meeting without Reels data
    const meetingWithoutReels = {
      meeting_id: 'm2',
      client_id: 'c1',
      client_name: 'Alice Johnson',
      meeting_title: 'Strategy Session',
      meeting_date: '2024-02-20',
      created_at: '2024-02-20T14:00:00Z',
      analysis_status: 'completed',
      summary: {
        summary: 'Meeting summary text',
        clientName: 'Alice Johnson',
        meetingTitle: 'Strategy Session'
      },
      followUpEmail: {},
      socialMediaContent: {
        reels: [] // Empty reels array
      },
      mindMap: 'mindmap\n  root((Client Goals))',
      nextMeetingPrep: {}
    }

    // Mock get-by-id API without Reels data
    await page.route('**/api/meetings/get-by-id*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: meetingWithoutReels
        })
      })
    })

    // Navigate to Clients tab
    await page.getByRole('button', { name: /Clients/i }).click()
    await page.waitForTimeout(1000)

    // Click on client row
    const clientRow = page.getByTestId('client-row-c1')
    await expect(clientRow).toBeVisible({ timeout: 10000 })
    await clientRow.click()
    await page.waitForTimeout(1000)

    // Wait for ClientDetails to load
    await expect(page.getByText('Alice Johnson')).toBeVisible({ timeout: 10000 })

    // Find the second meeting (Strategy Session) and click View Details
    const viewDetailsButtons = page.getByRole('button', { name: /View Details/i })
    const buttonCount = await viewDetailsButtons.count()
    
    if (buttonCount > 1) {
      // Click the second View Details button
      await viewDetailsButtons.nth(1).click()
    } else {
      // If only one button, click it
      await viewDetailsButtons.first().click()
    }
    
    await page.waitForTimeout(2000)

    // Wait for MeetingDetailView to load
    await expect(page.getByText('Strategy Session')).toBeVisible({ timeout: 10000 })

    // Verify Reels section does NOT exist (empty reels array should not render the section)
    const reelsSection = page.getByText('Social Media Reels Scripts')
    await expect(reelsSection).not.toBeVisible({ timeout: 5000 })
  })

  // ==========================================
  // Test 2: Clients OPEN 按鈕測試
  // ==========================================
  test('W1-BUG-2: Clients OPEN 按鈕測試 - 按鈕點擊後打開客戶詳情頁面', async ({ page }) => {
    // Navigate to Clients tab
    await page.getByRole('button', { name: /Clients/i }).click()
    await page.waitForTimeout(1000)

    // Find the OPEN button for the first client (Alice Johnson)
    // The OPEN button should be in the Actions column
    const clientRow = page.getByTestId('client-row-c1')
    await expect(clientRow).toBeVisible({ timeout: 10000 })

    // Find the OPEN button within the client row
    const openButton = clientRow.getByRole('button', { name: /OPEN/i })
    await expect(openButton).toBeVisible({ timeout: 10000 })
    
    // Click the OPEN button
    await openButton.click()
    await page.waitForTimeout(2000)

    // Verify ClientDetails view is displayed
    await expect(page.getByText('Alice Johnson')).toBeVisible({ timeout: 10000 })
    
    // Verify client information is displayed
    await expect(page.getByText('alice@example.com')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('VIP client')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Active')).toBeVisible({ timeout: 5000 })

    // Verify meetings list is displayed
    await expect(page.getByText('Q1 Review')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Strategy Session')).toBeVisible({ timeout: 5000 })
  })

  test('W1-BUG-2-2: Clients OPEN 按鈕測試 - 關閉按鈕正常工作', async ({ page }) => {
    // Navigate to Clients tab
    await page.getByRole('button', { name: /Clients/i }).click()
    await page.waitForTimeout(1000)

    // Click OPEN button
    const clientRow = page.getByTestId('client-row-c1')
    await expect(clientRow).toBeVisible({ timeout: 10000 })
    const openButton = clientRow.getByRole('button', { name: /OPEN/i })
    await openButton.click()
    await page.waitForTimeout(2000)

    // Verify ClientDetails is displayed
    await expect(page.getByText('Alice Johnson')).toBeVisible({ timeout: 10000 })

    // Find and click the close button (usually an X button or Close button)
    const closeButton = page.getByRole('button', { name: /Close|×|✕/i }).first()
    await expect(closeButton).toBeVisible({ timeout: 5000 })
    await closeButton.click()
    await page.waitForTimeout(1000)

    // Verify ClientDetails is closed (client name should not be visible)
    await expect(page.getByText('Alice Johnson')).not.toBeVisible({ timeout: 5000 })
    
    // Verify we're back to Clients table
    await expect(page.getByTestId('client-row-c1')).toBeVisible({ timeout: 5000 })
  })

  test('W1-BUG-2-3: Clients OPEN 按鈕測試 - 狀態管理正確（無殘留狀態）', async ({ page }) => {
    // Navigate to Clients tab
    await page.getByRole('button', { name: /Clients/i }).click()
    await page.waitForTimeout(1000)

    // Open client 1
    const clientRow1 = page.getByTestId('client-row-c1')
    await expect(clientRow1).toBeVisible({ timeout: 10000 })
    const openButton1 = clientRow1.getByRole('button', { name: /OPEN/i })
    await openButton1.click()
    await page.waitForTimeout(2000)

    // Verify client 1 details are displayed
    await expect(page.getByText('Alice Johnson')).toBeVisible({ timeout: 10000 })

    // Close client 1
    const closeButton = page.getByRole('button', { name: /Close|×|✕/i }).first()
    await closeButton.click()
    await page.waitForTimeout(1000)

    // Open client 2
    const clientRow2 = page.getByTestId('client-row-c2')
    await expect(clientRow2).toBeVisible({ timeout: 10000 })
    const openButton2 = clientRow2.getByRole('button', { name: /OPEN/i })
    await openButton2.click()
    await page.waitForTimeout(2000)

    // Verify client 2 details are displayed (not client 1)
    await expect(page.getByText('Bob Smith')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Alice Johnson')).not.toBeVisible({ timeout: 5000 })
  })

  // ==========================================
  // Test 3: Mind Map 顯示測試（增強）
  // ==========================================
  test('W1-BUG-3: Mind Map 顯示測試 - Mermaid 渲染正常', async ({ page }) => {
    // Mock meeting with valid Mermaid mind map code
    const validMindMapCode = `mindmap
  root((Client Goals))
    Goal 1
    Goal 2
      Sub-goal 2.1
      Sub-goal 2.2
    Goal 3`

    const meetingWithMindMap = {
      meeting_id: 'm1',
      client_id: 'c1',
      client_name: 'Alice Johnson',
      meeting_title: 'Q1 Review',
      meeting_date: '2024-01-15',
      created_at: '2024-01-15T10:00:00Z',
      analysis_status: 'completed',
      summary: {
        summary: 'Meeting summary text',
        clientName: 'Alice Johnson',
        meetingTitle: 'Q1 Review'
      },
      followUpEmail: {},
      socialMediaContent: {},
      mindMap: validMindMapCode,
      nextMeetingPrep: {}
    }

    // Mock get-by-id API with Mind Map data
    await page.route('**/api/meetings/get-by-id*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: meetingWithMindMap
        })
      })
    })

    // Navigate to Clients tab
    await page.getByRole('button', { name: /Clients/i }).click()
    await page.waitForTimeout(1000)

    // Click on client row
    const clientRow = page.getByTestId('client-row-c1')
    await expect(clientRow).toBeVisible({ timeout: 10000 })
    await clientRow.click()
    await page.waitForTimeout(1000)

    // Wait for ClientDetails to load
    await expect(page.getByText('Alice Johnson')).toBeVisible({ timeout: 10000 })

    // Click "View Details" button
    const viewDetailsButton = page.getByRole('button', { name: /View Details/i }).first()
    await expect(viewDetailsButton).toBeVisible({ timeout: 10000 })
    await viewDetailsButton.click()
    await page.waitForTimeout(2000)

    // Wait for MeetingDetailView to load
    await expect(page.getByText('Q1 Review')).toBeVisible({ timeout: 10000 })

    // Verify Mind Map section exists
    const mindMapSection = page.getByText('Mind Map')
    await expect(mindMapSection).toBeVisible({ timeout: 10000 })

    // Expand Mind Map section
    await mindMapSection.click()
    await page.waitForTimeout(2000) // Wait for Mermaid to render

    // Verify Mermaid SVG is rendered (Mermaid outputs SVG elements)
    const mermaidSvg = page.locator('svg.mermaid, svg[id^="mermaid"]')
    await expect(mermaidSvg).toBeVisible({ timeout: 10000 })
  })
})


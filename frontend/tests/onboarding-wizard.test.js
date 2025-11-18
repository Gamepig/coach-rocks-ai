import { test, expect } from '@playwright/test'

test.describe('T24 Onboarding Wizard', () => {
  test.beforeEach(async ({ page }) => {
    // Seed tokens to satisfy App and Wizard
    await page.addInitScript(() => {
      window.localStorage.setItem('sessionToken', 'pw-session')
      window.localStorage.setItem('token', 'test-jwt')
    })

    // Dynamic flag for onboarding completion across reloads
    let onboardingCompleted = false

    await page.route('http://localhost:8788/api/validate-session', async route => {
      const body = { valid: true, user: { email: 'user@test.com', onboarding_completed: onboardingCompleted ? true : false } }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    })
    await page.route('http://localhost:8788/api/dashboard', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) })
    })
    await page.route('http://localhost:8788/api/meetings/list', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    })
    await page.route('http://localhost:8788/api/clients/list', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) })
    })
    await page.route('http://localhost:8788/api/reels/list', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    })

    // Complete onboarding endpoint mock; flip flag after success
    await page.route('/api/users/complete-onboarding', async route => {
      const req = route.request()
      const auth = req.headers()['authorization']
      const ok = auth === 'Bearer test-jwt'
      if (!ok) {
        await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Unauthorized' }) })
        return
      }
      onboardingCompleted = true
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    })

    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
  })

  test('T24_FE_1: OnboardingWizard renders when onboarding not completed', async ({ page }) => {
    const wizard = page.locator('.onboarding-wizard')
    await expect(wizard).toBeVisible()
    await expect(page.locator('.wizard-header h1')).toHaveText('Welcome to CoachRocks AI')
    await expect(page.locator('.wizard-header p')).toContainText("Let's set up your account in just a few steps")
  })

  test('T24_FE_2: Navigation between steps', async ({ page }) => {
    // Wait wizard visible
    await expect(page.locator('.onboarding-wizard')).toBeVisible()
    // Step 1 -> Step 2
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.locator('.integrations-step').getByRole('heading', { name: 'Connect Your Platforms' })).toBeVisible()
    // Step 2 -> Back -> Step 1
    await page.getByRole('button', { name: 'Previous' }).click()
    await expect(page.locator('.wizard-header h1')).toHaveText('Welcome to CoachRocks AI')
    // Step 1 -> Step 2 -> Step 3
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByText('All Set!')).toBeVisible()
  })

  test('T24_FE_3: Complete button calls API with Authorization header', async ({ page }) => {
    // Go to step 3
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    let called = false
    await page.unroute('/api/users/complete-onboarding')
    await page.route('/api/users/complete-onboarding', async route => {
      const auth = route.request().headers()['authorization']
      expect(auth).toBe('Bearer test-jwt')
      called = true
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    })
    await page.getByRole('button', { name: 'Complete Setup' }).click()
    await expect.poll(() => called ? 'ok' : '').toBe('ok')
  })

  test('T24_FE_4: Error handling when API fails', async ({ page }) => {
    // Go to step 3
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.unroute('/api/users/complete-onboarding')
    await page.route('/api/users/complete-onboarding', async route => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false }) })
    })
    await page.getByRole('button', { name: 'Complete Setup' }).click()
    await expect(page.getByText('Failed to complete onboarding. Please try again.')).toBeVisible()
    await expect(page.getByText('All Set!')).toBeVisible()
  })

  test('T24_FE_5: Progress indicator styling states', async ({ page }) => {
    await expect(page.locator('.onboarding-wizard')).toBeVisible()
    // Step 1 active label exists
    await expect(page.locator('.progress-step')).toContainText(['Welcome'])
    // Move to step 2
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.locator('.progress-step')).toContainText(['Integrations'])
    // Move to step 3
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.locator('.progress-step')).toContainText(['Complete'])
  })

  test('T24_APP_1: Show wizard when onboarding not completed', async ({ page }) => {
    await expect(page.locator('.onboarding-wizard')).toBeVisible()
    await expect(page.locator('.wizard-header h1')).toHaveText('Welcome to CoachRocks AI')
    await expect(page.locator('text=Start a New Analysis')).toHaveCount(0)
  })

  test('T24_APP_2: Show main app when onboarding completed', async ({ page }) => {
    // Simulate completed session by re-routing validate-session to true
    await page.unroute('http://localhost:8788/api/validate-session')
    await page.route('http://localhost:8788/api/validate-session', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, user: { email: 'user@test.com', onboarding_completed: true } }) })
    })
    await page.reload()
    await expect(page.getByText('Welcome back')).toBeVisible()
  })

  test('T24_APP_3: Transition from wizard to main app after completion', async ({ page }) => {
    // Navigate to completion and complete
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.unroute('/api/users/complete-onboarding')
    await page.route('/api/users/complete-onboarding', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    })
    await page.getByRole('button', { name: 'Complete Setup' }).click()
    // Wizard should go away after onComplete updates state
    await expect(page.getByText('Welcome back')).toBeVisible()
  })

  test('T24_APP_4: Session update persists after reload', async ({ page }) => {
    // Mark session as completed before reload
    await page.unroute('http://localhost:8788/api/validate-session')
    await page.route('http://localhost:8788/api/validate-session', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, user: { email: 'user@test.com', onboarding_completed: true } }) })
    })
    await page.reload()
    await expect(page.getByText('Welcome back')).toBeVisible()
  })

  test('T24_E2E_1: Complete user onboarding flow', async ({ page }) => {
    // Step1 -> Step2 -> Step3 -> Complete
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    let completed = false
    await page.unroute('/api/users/complete-onboarding')
    await page.route('/api/users/complete-onboarding', async route => {
      completed = true
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    })
    await page.getByRole('button', { name: 'Complete Setup' }).click()
    await expect.poll(() => completed ? 'ok' : '').toBe('ok')
    await expect(page.getByText('Welcome back')).toBeVisible()
  })

  test('T24_E2E_2: Back navigation preserves state visibility', async ({ page }) => {
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByText('All Set!')).toBeVisible()
    await page.getByRole('button', { name: 'Previous' }).click()
    await expect(page.getByText('Connect Your Platforms')).toBeVisible()
  })
})

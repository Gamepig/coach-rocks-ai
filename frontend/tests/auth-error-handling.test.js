import { test, expect } from '@playwright/test'

test.describe('Authentication Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Clear session token
    await page.addInitScript(() => {
      window.localStorage.removeItem('sessionToken')
    })

    // Mock API endpoints - default to unauthenticated
    await page.route('http://localhost:8788/api/validate-session', async route => {
      await route.fulfill({ 
        status: 401, 
        contentType: 'application/json', 
        body: JSON.stringify({ valid: false }) 
      })
    })

    await page.route('http://localhost:8788/api/dashboard', async route => {
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json', 
        body: JSON.stringify({ 
          success: true, 
          data: {
            totalMeetings: 0,
            clientsServed: 0,
            reelsGenerated: 0,
            thisWeekUploads: 0
          }
        }) 
      })
    })

    await page.route('http://localhost:8788/api/meetings/list', async route => {
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json', 
        body: JSON.stringify([]) 
      })
    })

    await page.route('http://localhost:8788/api/clients/list', async route => {
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json', 
        body: JSON.stringify({ success: true, data: [] }) 
      })
    })

    await page.route('http://localhost:8788/api/reels/list', async route => {
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json', 
        body: JSON.stringify([]) 
      })
    })

    await page.route('http://localhost:8788/api/tags', async route => {
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json', 
        body: JSON.stringify({ success: true, tags: [] }) 
      })
    })

    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)
  })

  test('EH_1: Login with incorrect password shows error message', async ({ page }) => {
    // Click login button on landing page
    const loginButton = page.locator('button:has-text("登入")')
    if (await loginButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loginButton.click()
      await page.waitForTimeout(1000)
    }

    // Wait for login form to appear
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible({ timeout: 5000 })

    // Fill in email and incorrect password
    await emailInput.fill('test@example.com')
    const passwordInput = page.locator('input[type="password"]')
    await passwordInput.fill('wrongpassword')

    // Mock login API to return 401 with error message
    await page.route('http://localhost:8788/api/login-new', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Invalid password',
          message: 'Invalid password. Please try again.'
        })
      })
    })

    // Click Sign In button (use exact match to avoid matching "Sign In with Google")
    const signInButton = page.getByRole('button', { name: 'Sign In', exact: true })
    await signInButton.click()

    // Wait for error message to appear
    await page.waitForTimeout(1000)

    // Check that error message is displayed
    const errorMessage = page.locator('.error-message, [role="alert"]')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
    
    // Check error message content
    const errorText = await errorMessage.textContent()
    expect(errorText).toContain('Invalid password')
    expect(errorText).toContain('Error')

    // Verify login form is still visible (not closed)
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('EH_2: Login with non-existent user shows error message', async ({ page }) => {
    // Click login button on landing page
    const loginButton = page.locator('button:has-text("登入")')
    if (await loginButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loginButton.click()
      await page.waitForTimeout(1000)
    }

    // Wait for login form to appear
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible({ timeout: 5000 })

    // Fill in non-existent user email and password
    await emailInput.fill('nonexistent@example.com')
    const passwordInput = page.locator('input[type="password"]')
    await passwordInput.fill('somepassword')

    // Mock login API to return 401 with user not found message
    await page.route('http://localhost:8788/api/login-new', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'User not found',
          message: 'User not found. Please sign up first or use email verification.'
        })
      })
    })

    // Click Sign In button (use exact match to avoid matching "Sign In with Google")
    const signInButton = page.getByRole('button', { name: 'Sign In', exact: true })
    await signInButton.click()

    // Wait for error message to appear
    await page.waitForTimeout(1000)

    // Check that error message is displayed
    const errorMessage = page.locator('.error-message, [role="alert"]')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
    
    // Check error message content
    const errorText = await errorMessage.textContent()
    expect(errorText).toContain('User not found')
    expect(errorText).toContain('Error')

    // Verify login form is still visible (not closed)
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('EH_3: Login with unverified email shows error message', async ({ page }) => {
    // Click login button on landing page
    const loginButton = page.locator('button:has-text("登入")')
    if (await loginButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loginButton.click()
      await page.waitForTimeout(1000)
    }

    // Wait for login form to appear
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible({ timeout: 5000 })

    // Fill in email and password
    await emailInput.fill('unverified@example.com')
    const passwordInput = page.locator('input[type="password"]')
    await passwordInput.fill('correctpassword')

    // Mock login API to return 401 with email not verified message
    await page.route('http://localhost:8788/api/login-new', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Email not verified',
          message: 'Email not verified. Please verify your email first.'
        })
      })
    })

    // Click Sign In button (use exact match to avoid matching "Sign In with Google")
    const signInButton = page.getByRole('button', { name: 'Sign In', exact: true })
    await signInButton.click()

    // Wait for error message to appear
    await page.waitForTimeout(1000)

    // Check that error message is displayed
    const errorMessage = page.locator('.error-message, [role="alert"]')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
    
    // Check error message content
    const errorText = await errorMessage.textContent()
    expect(errorText).toContain('Email not verified')
    expect(errorText).toContain('Error')

    // Verify login form is still visible (not closed)
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('EH_4: Login with invalid email format shows error message', async ({ page }) => {
    // Click login button on landing page
    const loginButton = page.locator('button:has-text("登入")')
    if (await loginButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loginButton.click()
      await page.waitForTimeout(1000)
    }

    // Wait for login form to appear
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible({ timeout: 5000 })

    // Fill in invalid email format
    await emailInput.fill('invalid-email')
    const passwordInput = page.locator('input[type="password"]')
    await passwordInput.fill('somepassword')

    // Mock login API to return 400 with invalid request message
    await page.route('http://localhost:8788/api/login-new', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Invalid request',
          message: 'Invalid request. Please check your email format.'
        })
      })
    })

    // Click Sign In button (use exact match to avoid matching "Sign In with Google")
    const signInButton = page.getByRole('button', { name: 'Sign In', exact: true })
    await signInButton.click()

    // Wait for error message to appear
    await page.waitForTimeout(1000)

    // Check that error message is displayed
    const errorMessage = page.locator('.error-message, [role="alert"]')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
    
    // Check error message content
    const errorText = await errorMessage.textContent()
    expect(errorText).toContain('Invalid request')
    expect(errorText).toContain('Error')

    // Verify login form is still visible (not closed)
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('EH_5: Registration with existing email shows error message', async ({ page }) => {
    // Click login button on landing page
    const loginButton = page.locator('button:has-text("登入")')
    if (await loginButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loginButton.click()
      await page.waitForTimeout(1000)
    }

    // Wait for login form to appear
    await page.waitForTimeout(1000)
    
    // Switch to register form
    const registerLink = page.locator('button:has-text("Don\'t have an account? Register")')
    if (await registerLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await registerLink.click()
      await page.waitForTimeout(1000)
    }

    // Wait for register form to appear
    const emailInput = page.locator('input[type="email"]').first()
    await expect(emailInput).toBeVisible({ timeout: 5000 })

    // Fill in existing email and password
    await emailInput.fill('existing@example.com')
    const passwordInput = page.locator('input[type="password"]').first()
    await passwordInput.fill('password123')
    const confirmPasswordInput = page.locator('input[type="password"]').nth(1)
    await confirmPasswordInput.fill('password123')

    // Mock register API to return 400 with user already exists message
    await page.route('http://localhost:8788/api/register-new', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'User already exists',
          message: 'User with this email already exists. Please sign in instead.'
        })
      })
    })

    // Click Register button
    const registerButton = page.getByRole('button', { name: 'Register', exact: true })
    await registerButton.click()

    // Wait for error message to appear
    await page.waitForTimeout(1000)

    // Check that error message is displayed
    const errorMessage = page.locator('.error-message, [role="alert"]')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
    
    // Check error message content
    const errorText = await errorMessage.textContent()
    expect(errorText).toContain('User already exists')
    expect(errorText).toContain('Error')

    // Verify register form is still visible (not closed)
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('EH_6: Registration with password mismatch shows error message', async ({ page }) => {
    // Click login button on landing page
    const loginButton = page.locator('button:has-text("登入")')
    if (await loginButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loginButton.click()
      await page.waitForTimeout(1000)
    }

    // Wait for login form to appear
    await page.waitForTimeout(1000)
    
    // Switch to register form
    const registerLink = page.locator('button:has-text("Don\'t have an account? Register")')
    if (await registerLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await registerLink.click()
      await page.waitForTimeout(1000)
    }

    // Wait for register form to appear
    const emailInput = page.locator('input[type="email"]').first()
    await expect(emailInput).toBeVisible({ timeout: 5000 })

    // Fill in email with mismatched passwords
    await emailInput.fill('newuser@example.com')
    const passwordInput = page.locator('input[type="password"]').first()
    await passwordInput.fill('password123')
    const confirmPasswordInput = page.locator('input[type="password"]').nth(1)
    await confirmPasswordInput.fill('differentpassword')

    // Click Register button (client-side validation should catch this)
    const registerButton = page.locator('button:has-text("Register")')
    await registerButton.click()

    // Wait for error message to appear
    await page.waitForTimeout(1000)

    // Check that error message is displayed (client-side validation)
    const errorMessage = page.locator('.error-message, [role="alert"]')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
    
    // Check error message content
    const errorText = await errorMessage.textContent()
    expect(errorText).toContain('Passwords do not match')
    expect(errorText).toContain('Error')

    // Verify register form is still visible (not closed)
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('EH_7: Server error during login shows generic error message', async ({ page }) => {
    // Click login button on landing page
    const loginButton = page.locator('button:has-text("登入")')
    if (await loginButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loginButton.click()
      await page.waitForTimeout(1000)
    }

    // Wait for login form to appear
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible({ timeout: 5000 })

    // Fill in email and password
    await emailInput.fill('test@example.com')
    const passwordInput = page.locator('input[type="password"]')
    await passwordInput.fill('password123')

    // Mock login API to return 500 server error
    await page.route('http://localhost:8788/api/login-new', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error',
          message: 'An unexpected error occurred'
        })
      })
    })

    // Click Sign In button (use exact match to avoid matching "Sign In with Google")
    const signInButton = page.getByRole('button', { name: 'Sign In', exact: true })
    await signInButton.click()

    // Wait for error message to appear
    await page.waitForTimeout(1000)

    // Check that error message is displayed
    const errorMessage = page.locator('.error-message, [role="alert"]')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
    
    // Check error message content (should show server error message)
    const errorText = await errorMessage.textContent()
    expect(errorText).toContain('Error')
    // Should show server error message or generic fallback
    expect(errorText.toLowerCase()).toMatch(/server error|try again later|unexpected error/i)

    // Verify login form is still visible (not closed)
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })
})


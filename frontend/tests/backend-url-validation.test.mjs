import test from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeBackendUrlValue } from '../src/services/backendUrlValidation.js'

const TEST_DEFAULT_URL = 'https://coach-backend.gamepig1976.workers.dev'
globalThis.__TEST_VITE_BACKEND_BASE_URL__ = TEST_DEFAULT_URL

const { getBackendBaseUrl, DEFAULT_BACKEND_URL } = await import('../src/services/api.js')

test('TC-1: 非 ASCII 字符自動回退到預設 URL', () => {
  const raw = 'https://coach-backend.\u2502'
  const validation = sanitizeBackendUrlValue(raw)
  assert.strictEqual(validation.ok, false)
  assert.strictEqual(validation.reason, 'trailing-dot')

  const resolved = getBackendBaseUrl(raw, { isProductionOverride: true })
  assert.strictEqual(resolved, DEFAULT_BACKEND_URL)
})

test('TC-2: 以點結尾的 URL 會回退到預設值', () => {
  const raw = 'https://coach-backend.'
  const validation = sanitizeBackendUrlValue(raw)
  assert.strictEqual(validation.ok, false)
  assert.strictEqual(validation.reason, 'trailing-dot')

  const resolved = getBackendBaseUrl(raw, { isProductionOverride: true })
  assert.strictEqual(resolved, DEFAULT_BACKEND_URL)
})

test('TC-3: 正常 URL 會被保留', () => {
  const raw = 'https://coach-backend.gamepig1976.workers.dev'
  const validation = sanitizeBackendUrlValue(raw)
  assert.strictEqual(validation.ok, true)
  assert.strictEqual(validation.cleanedOrigin, raw)

  const resolved = getBackendBaseUrl(raw)
  assert.strictEqual(resolved, raw)
})

test('TC-4: 生產環境未設定值時回退至預設 URL', () => {
  const previous = globalThis.__TEST_VITE_BACKEND_BASE_URL__
  globalThis.__TEST_VITE_BACKEND_BASE_URL__ = undefined

  try {
    const resolved = getBackendBaseUrl(undefined, { isProductionOverride: true })
    assert.strictEqual(resolved, DEFAULT_BACKEND_URL)
  } finally {
    globalThis.__TEST_VITE_BACKEND_BASE_URL__ = previous
  }
})

test('TC-5: 含換行符的 URL 會被清理後保留', () => {
  const raw = `${TEST_DEFAULT_URL}\n`
  const validation = sanitizeBackendUrlValue(raw)
  assert.strictEqual(validation.ok, true)
  assert.strictEqual(validation.cleanedOrigin, TEST_DEFAULT_URL)

  const resolved = getBackendBaseUrl(raw)
  assert.strictEqual(resolved, TEST_DEFAULT_URL)
})

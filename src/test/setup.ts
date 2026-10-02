import '@testing-library/jest-dom/vitest'
import { resetViewport } from './browser-polyfills'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { configureMock, resetMockConfig } from '../mocks/config'
import { resetDb } from '../mocks/db'
import { server } from '../mocks/node'
import { useThemeStore, useToastStore } from '@/shared/model'

// Deterministic mock API for every test: no latency, no random failures,
// fresh seeded data per test. Unhandled requests are bugs, so they fail loudly.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

beforeEach(() => {
  resetDb()
  useToastStore.getState().clear()
  resetViewport()
  localStorage.clear()
  useThemeStore.setState({ preference: 'system' })
  delete document.documentElement.dataset.theme
  resetMockConfig()
  configureMock({ minDelayMs: 0, maxDelayMs: 0, failureRate: 0, devControls: true })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
})

afterAll(() => server.close())



export interface MockConfig {
  minDelayMs: number
  maxDelayMs: number

  failureRate: number

  devControls: boolean
}

function parseFailureRate(raw: string | undefined): number {
  const value = Number(raw)
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0.05
}

const defaults: MockConfig = {
  minDelayMs: 200,
  maxDelayMs: 1200,
  failureRate: parseFailureRate(import.meta.env.VITE_MOCK_FAILURE_RATE),
  devControls: import.meta.env.DEV,
}

export const mockConfig: MockConfig = { ...defaults }

export function configureMock(overrides: Partial<MockConfig>) {
  Object.assign(mockConfig, overrides)
}

export function resetMockConfig() {
  Object.assign(mockConfig, defaults)
}

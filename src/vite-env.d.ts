/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Probability (0–1) of random 500s from the mock API. Defaults to 0.05. */
  readonly VITE_MOCK_FAILURE_RATE?: string
  /** Set to `false` to stop the simulated teammates that change incidents in the browser. */
  readonly VITE_MOCK_LIVE_UPDATES?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

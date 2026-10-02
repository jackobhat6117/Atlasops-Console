import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import { ApiUnavailable } from './app/ui/ApiUnavailable'

// The mock API runs in every environment, including the deployed demo,
// because there is no real backend. It must be ready before the first request.
async function startMockApi() {
  const { startMockApi: start } = await import('./mocks/browser')
  await start()
}

const root = createRoot(document.getElementById('root')!)

startMockApi()
  .then(() => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
  .catch(() => {
    // Only reached if the mock API module itself fails to load (e.g. a network error fetching the chunk).
    root.render(<ApiUnavailable />)
  })

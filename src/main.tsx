import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ApiUnavailable } from './app/ui/ApiUnavailable'
import { App } from './app/App'

// The mock API runs in every environment, including the deployed demo,
// because there is no real backend. It must be ready before the first request.
async function startMockApi() {
  const { worker } = await import('./mocks/browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: import.meta.env.PROD,
  })
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
    root.render(<ApiUnavailable />)
  })

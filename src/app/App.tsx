import { useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryProvider } from './providers/QueryProvider'
import { createAppRouter } from './router'

export function App() {
  const [router] = useState(createAppRouter)
  return (
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  )
}

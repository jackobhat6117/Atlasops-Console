import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import { paths } from '@/shared/config'
import { RootLayout } from './layouts/RootLayout'
import { PageFallback } from './ui/PageFallback'
import { RouteErrorPage } from './ui/RouteErrorPage'

/**
 * Pages are lazy-loaded, so each route ships its own chunk. The pathless child
 * route holds the error boundary, so errors render inside the layout and the
 * header and navigation stay usable.
 */
export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    HydrateFallback: PageFallback,
    children: [
      {
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <Navigate to={paths.incidents} replace /> },
          {
            path: paths.incidents,
            lazy: () => import('@/pages/incidents-list').then((m) => ({ Component: m.IncidentsListPage })),
          },
          {
            path: paths.newIncident,
            lazy: () => import('@/pages/create-incident').then((m) => ({ Component: m.CreateIncidentPage })),
          },
          {
            path: `${paths.incidents}/:incidentId`,
            lazy: () => import('@/pages/incident-detail').then((m) => ({ Component: m.IncidentDetailPage })),
          },
          {
            path: '*',
            lazy: () => import('@/pages/not-found').then((m) => ({ Component: m.NotFoundPage })),
          },
        ],
      },
    ],
  },
]

export function createAppRouter() {
  return createBrowserRouter(routes)
}

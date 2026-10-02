import { useQuery } from '@tanstack/react-query'
import { fetchServices } from './service-api'

export const serviceKeys = {
  all: ['services'] as const,
}

/** Reference data: rarely changes, so it is cached for the whole session. */
export function useServices() {
  return useQuery({
    queryKey: serviceKeys.all,
    queryFn: ({ signal }) => fetchServices(signal),
    staleTime: Infinity,
  })
}

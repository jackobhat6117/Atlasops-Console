import { useQuery } from '@tanstack/react-query'
import { fetchUsers } from './user-api'

export const userKeys = {
  all: ['users'] as const,
}

/** Reference data: rarely changes, so it is cached for the whole session. */
export function useUsers() {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: ({ signal }) => fetchUsers(signal),
    staleTime: Infinity,
  })
}

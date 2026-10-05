import { useId, useState, type KeyboardEvent } from 'react'
import { useDebouncedCallback } from '@/shared/lib'
import { SearchIcon, Spinner, XIcon } from '@/shared/ui'

export const SEARCH_DEBOUNCE_MS = 300

interface IncidentSearchProps {
  value: string
  onSearch: (q: string) => void
  isSearching?: boolean
}


export function IncidentSearch({ value, onSearch, isSearching = false }: IncidentSearchProps) {
  const inputId = useId()
  const [draft, setDraft] = useState(value)
  const debouncedSearch = useDebouncedCallback(onSearch, SEARCH_DEBOUNCE_MS)

  // Sync when the URL changes from elsewhere (Clear all, chip removal, back/forward).
  const [syncedValue, setSyncedValue] = useState(value)
  if (value !== syncedValue) {
    setSyncedValue(value)
    setDraft(value)
  }

  const change = (next: string) => {
    setDraft(next)
    debouncedSearch.run(next)
  }

  const clear = () => {
    debouncedSearch.cancel()
    setDraft('')
    if (value !== '') onSearch('')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      debouncedSearch.flush()
    } else if (event.key === 'Escape' && draft !== '') {
      event.preventDefault()
      clear()
    }
  }

  return (
    <div className="relative w-full sm:max-w-sm">
      <label htmlFor={inputId} className="sr-only">
        Search incidents
      </label>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-subtle" />
      <input
        id={inputId}
        type="search"
        value={draft}
        onChange={(event) => change(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Search by ID, title, service or assignee"
        autoComplete="off"
        spellCheck={false}
        maxLength={200}
        className="h-9 w-full rounded-md border border-line-strong bg-surface pr-16 pl-9 text-sm shadow-sm placeholder:text-subtle [&::-webkit-search-cancel-button]:hidden"
      />
      <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
        {isSearching && (
          <>
            <Spinner size={14} className="text-subtle" />
            <span className="sr-only">Searching</span>
          </>
        )}
        {draft && (
          <button
            type="button"
            onClick={clear}
            className="rounded p-1 text-subtle hover:bg-surface-muted hover:text-fg"
            aria-label="Clear search"
          >
            <XIcon size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

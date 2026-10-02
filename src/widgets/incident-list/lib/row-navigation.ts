import type { KeyboardEvent } from 'react'

const ROW_LINK = '[data-row-link]'

/**
 * Arrow-key navigation between rows. Each row's primary link is a normal tab
 * stop; ArrowUp/ArrowDown/Home/End move focus between those links, like a list.
 */
export function handleRowKeyDown(event: KeyboardEvent<HTMLElement>) {
  const target = event.target as HTMLElement
  if (!target.matches(ROW_LINK)) return
  const links = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(ROW_LINK))
  const index = links.indexOf(target)
  const next =
    event.key === 'ArrowDown'
      ? links[index + 1]
      : event.key === 'ArrowUp'
        ? links[index - 1]
        : event.key === 'Home'
          ? links[0]
          : event.key === 'End'
            ? links.at(-1)
            : undefined
  if (next) {
    event.preventDefault()
    next.focus()
  }
}

/** Focus a row's link, e.g. the incident the user just returned from. */
export function focusRow(container: HTMLElement | null, id: string) {
  const link = container?.querySelector<HTMLElement>(`${ROW_LINK}[data-id="${CSS.escape(id)}"]`)
  link?.focus()
  link?.scrollIntoView({ block: 'nearest' })
}

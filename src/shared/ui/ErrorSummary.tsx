import { AlertOctagonIcon } from './icons'

export interface ErrorSummaryItem {
  id: string
  message: string
  onSelect: () => void
}

/**
 * Lists every problem at the top of a form, after a failed submit. Each entry
 * moves focus to its field. Re-mount it (via `key`) on every submit, so the
 * alert is announced again.
 */
export function ErrorSummary({ title, items }: { title: string; items: ErrorSummaryItem[] }) {
  if (items.length === 0) return null
  return (
    <div role="alert" className="rounded-md border border-red-200 bg-danger-soft p-3 text-sm">
      <p className="flex items-center gap-1.5 font-semibold text-danger">
        <AlertOctagonIcon size={16} />
        {title}
      </p>
      <ul className="mt-1.5 ml-6 list-disc text-danger">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(event) => {
                event.preventDefault()
                item.onSelect()
              }}
              className="underline underline-offset-2"
            >
              {item.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

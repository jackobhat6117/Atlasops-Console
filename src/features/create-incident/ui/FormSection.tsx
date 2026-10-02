import { useId, type ReactNode } from 'react'

/** Numbered form section card: breaks a long form into short, scannable steps. */
export function FormSection({
  step,
  title,
  description,
  children,
}: {
  step: number
  title: string
  description?: string
  children: ReactNode
}) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="rounded-xl border border-line bg-surface shadow-panel">
      <header className="flex items-start gap-3 border-b border-line px-5 py-4">
        <span
          aria-hidden="true"
          className="mt-px grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent ring-1 ring-accent/20"
        >
          {step}
        </span>
        <div>
          <h2 id={headingId} className="text-sm font-semibold text-fg">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
      </header>
      <div className="flex flex-col gap-5 p-5">{children}</div>
    </section>
  )
}

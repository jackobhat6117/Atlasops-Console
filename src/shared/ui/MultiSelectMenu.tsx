import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '@/shared/lib'
import { CheckIcon, ChevronDownIcon } from './icons'

export interface MultiSelectOption<T extends string> {
  value: T
  label: string
}

interface MultiSelectMenuProps<T extends string> {
  label: string
  options: readonly MultiSelectOption<T>[]
  selected: readonly T[]
  onToggle: (value: T) => void
  onClear: () => void
  disabled?: boolean
}


export function MultiSelectMenu<T extends string>({
  label,
  options,
  selected,
  onToggle,
  onClear,
  disabled,
}: MultiSelectMenuProps<T>) {
  const count = selected.length

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        disabled={disabled}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm shadow-sm whitespace-nowrap disabled:opacity-60',
          count > 0
            ? 'border-accent bg-accent-soft font-medium text-accent'
            : 'border-line-strong bg-surface text-fg hover:bg-surface-muted',
        )}
        aria-label={count > 0 ? `${label} filter, ${count} selected` : `${label} filter`}
      >
        {label}
        {count > 0 && (
          <span className="rounded-full bg-accent px-1.5 text-xs leading-5 font-semibold text-on-accent tabular-nums">
            {count}
          </span>
        )}
        <ChevronDownIcon className="text-subtle" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={4}
          className="z-40 min-w-48 rounded-lg border border-line bg-surface p-1 shadow-lg"
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-xs font-semibold tracking-wide text-subtle uppercase">
            {label}
          </DropdownMenu.Label>
          {options.map((option) => (
            <DropdownMenu.CheckboxItem
              key={option.value}
              checked={selected.includes(option.value)}
              onCheckedChange={() => onToggle(option.value)}
              onSelect={(event) => event.preventDefault()}
              className="flex cursor-default items-center gap-2 rounded px-2 py-1.5 text-sm text-fg outline-none select-none data-[highlighted]:bg-accent-soft data-[highlighted]:outline-2 data-[highlighted]:-outline-offset-2 data-[highlighted]:outline-focus"
            >
              <span
                className={cn(
                  'flex size-4 items-center justify-center rounded border',
                  selected.includes(option.value) ? 'border-accent bg-accent text-on-accent' : 'border-line-strong',
                )}
              >
                <DropdownMenu.ItemIndicator>
                  <CheckIcon size={12} strokeWidth={3} />
                </DropdownMenu.ItemIndicator>
              </span>
              {option.label}
            </DropdownMenu.CheckboxItem>
          ))}
          {count > 0 && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-line" />
              <DropdownMenu.Item
                onSelect={onClear}
                className="cursor-default rounded px-2 py-1.5 text-sm text-muted outline-none select-none data-[highlighted]:bg-accent-soft data-[highlighted]:outline-2 data-[highlighted]:-outline-offset-2 data-[highlighted]:outline-focus data-[highlighted]:text-fg"
              >
                Clear {label.toLowerCase()}
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

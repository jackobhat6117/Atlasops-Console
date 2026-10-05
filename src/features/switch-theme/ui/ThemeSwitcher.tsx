import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { THEME_PREFERENCES, useTheme, type ThemePreference } from '@/shared/model'
import { cn } from '@/shared/lib'
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from '@/shared/ui'

const OPTIONS: Record<ThemePreference, { label: string; Icon: typeof SunIcon }> = {
  light: { label: 'Light', Icon: SunIcon },
  dark: { label: 'Dark', Icon: MoonIcon },
  system: { label: 'System', Icon: MonitorIcon },
}


function ThemeSegmented() {
  const { preference, resolved, setPreference } = useTheme()
  return (
    <div role="group" aria-label="Theme" className="flex rounded-lg bg-surface-muted p-0.5 ring-1 ring-line">
      {THEME_PREFERENCES.map((value) => {
        const { label, Icon } = OPTIONS[value]
        const active = preference === value
        const name = value === 'system' ? `System theme (currently ${resolved})` : `${label} theme`
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            aria-label={name}
            title={name}
            onClick={() => setPreference(value)}
            className={cn(
              'grid size-7 place-items-center rounded-md transition-colors',
              active ? 'bg-surface text-fg shadow-sm ring-1 ring-line' : 'text-subtle hover:text-fg',
            )}
          >
            <Icon size={14} />
          </button>
        )
      })}
    </div>
  )
}


export function ThemeSwitcher({ variant = 'icon' }: { variant?: 'icon' | 'segmented' }) {
  const { preference, resolved, setPreference } = useTheme()
  if (variant === 'segmented') return <ThemeSegmented />
  const current = OPTIONS[preference]
  const TriggerIcon = resolved === 'dark' ? MoonIcon : SunIcon
  const description = preference === 'system' ? `System (${resolved})` : current.label

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`Theme: ${description}`}
        className="inline-flex size-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-fg"
      >
        <TriggerIcon size={16} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-40 rounded-lg border border-line bg-surface p-1 text-fg shadow-lg"
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-xs font-semibold tracking-wide text-subtle uppercase">
            Theme
          </DropdownMenu.Label>
          <DropdownMenu.RadioGroup
            value={preference}
            onValueChange={(value) => setPreference(value as ThemePreference)}
          >
            {THEME_PREFERENCES.map((value) => {
              const { label, Icon } = OPTIONS[value]
              return (
                <DropdownMenu.RadioItem
                  key={value}
                  value={value}
                  className="flex cursor-default items-center gap-2 rounded px-2 py-1.5 text-sm outline-none select-none data-[highlighted]:bg-accent-soft data-[highlighted]:outline-2 data-[highlighted]:-outline-offset-2 data-[highlighted]:outline-focus"
                >
                  <Icon size={15} className="text-muted" />
                  {label}
                  <DropdownMenu.ItemIndicator className="ml-auto text-accent">
                    <CheckIcon size={14} strokeWidth={2.5} />
                  </DropdownMenu.ItemIndicator>
                </DropdownMenu.RadioItem>
              )
            })}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

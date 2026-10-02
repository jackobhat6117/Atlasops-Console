import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { THEME_PREFERENCES, useTheme, type ThemePreference } from '@/shared/model'
import { cn } from '@/shared/lib'
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from '@/shared/ui'

const OPTIONS: Record<ThemePreference, { label: string; Icon: typeof SunIcon }> = {
  light: { label: 'Light', Icon: SunIcon },
  dark: { label: 'Dark', Icon: MoonIcon },
  system: { label: 'System', Icon: MonitorIcon },
}

/**
 * Light / Dark / System menu (Radix DropdownMenu radio group: arrow keys,
 * typeahead, Esc, focus returns to the trigger). The trigger's accessible name
 * states the current choice, and what "System" resolved to.
 */
export function ThemeSwitcher({ variant = 'icon' }: { variant?: 'icon' | 'row' }) {
  const { preference, resolved, setPreference } = useTheme()
  const current = OPTIONS[preference]
  const TriggerIcon = resolved === 'dark' ? MoonIcon : SunIcon
  const description = preference === 'system' ? `System (${resolved})` : current.label

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`Theme: ${description}`}
        className={cn(
          'inline-flex items-center gap-2 rounded-md text-sm text-muted transition-colors hover:bg-surface-muted hover:text-fg',
          variant === 'icon' ? 'size-9 justify-center' : 'w-full px-3 py-2',
        )}
      >
        <TriggerIcon size={16} />
        {variant === 'row' && (
          <>
            <span className="font-medium">Theme</span>
            <span className="ml-auto text-xs text-subtle">{description}</span>
          </>
        )}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          side={variant === 'row' ? 'top' : 'bottom'}
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

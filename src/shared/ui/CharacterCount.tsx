import { cn, formatNumber } from '@/shared/lib'


export function CharacterCount({ value, max }: { value: number; max: number }) {
  const over = value > max
  return (
    <span className={cn('text-xs tabular-nums', over ? 'font-medium text-danger' : 'text-subtle')}>
      {formatNumber(value)} / {formatNumber(max)}
      {over && <span className="sr-only"> characters, over the limit</span>}
    </span>
  )
}

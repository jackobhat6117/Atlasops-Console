import { cn } from '@/shared/lib'


export function BrandMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={cn('shrink-0', className)}
    >
      <rect width="32" height="32" rx="8" className="fill-accent" />
      <path
        d="M8.5 24 16 8l7.5 16"
        fill="none"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-on-accent"
      />
      <path
        d="M10.4 18.6h3.1l1.4-2.6 2.2 4.6 1.4-2h3.1"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-on-accent"
      />
    </svg>
  )
}

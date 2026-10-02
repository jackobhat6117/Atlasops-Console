/**
 * Always-mounted, visually hidden live region. Screen readers only announce
 * changes inside a live region that already exists, so conditional UI (banners,
 * notices) should not be the live region itself. Render this unconditionally
 * and change `message` instead; an empty string means silence.
 */
export function LiveMessage({ message, assertive = false }: { message: string; assertive?: boolean }) {
  return (
    <p aria-live={assertive ? 'assertive' : 'polite'} className="sr-only">
      {message}
    </p>
  )
}


export function LiveMessage({ message, assertive = false }: { message: string; assertive?: boolean }) {
  return (
    <p aria-live={assertive ? 'assertive' : 'polite'} className="sr-only">
      {message}
    </p>
  )
}

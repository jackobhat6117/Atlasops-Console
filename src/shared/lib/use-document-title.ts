import { useEffect } from 'react'

const APP_NAME = 'AtlasOps'

/** Sets a descriptive page title, which screen readers announce on navigation. */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME
  }, [title])
}

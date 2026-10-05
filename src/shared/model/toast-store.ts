import { create } from 'zustand'


export type ToastTone = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  tone: ToastTone
  message: string
}

interface ToastState {
  toasts: Toast[]
  push: (tone: ToastTone, message: string) => number
  dismiss: (id: number) => void
  clear: () => void
}

const MAX_VISIBLE_TOASTS = 4
let nextId = 1

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: (tone, message) => {
    const id = nextId++
    set((state) => ({ toasts: [...state.toasts, { id, tone, message }].slice(-MAX_VISIBLE_TOASTS) }))
    return id
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  clear: () => set({ toasts: [] }),
}))

/** Imperative helpers for non-component code such as mutation callbacks. */
export const notify = {
  success: (message: string) => useToastStore.getState().push('success', message),
  error: (message: string) => useToastStore.getState().push('error', message),
  info: (message: string) => useToastStore.getState().push('info', message),
}

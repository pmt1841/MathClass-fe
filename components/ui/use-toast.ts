'use client'

// Inspired by react-hot-toast library
import * as React from 'react'

import type { ToastActionElement, ToastProps } from '@/components/ui/toast'
import { toast as sonnerToast } from 'sonner'

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType['ADD_TOAST']
      toast: ToasterToast
    }
  | {
      type: ActionType['UPDATE_TOAST']
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType['DISMISS_TOAST']
      toastId?: ToasterToast['id']
    }
  | {
      type: ActionType['REMOVE_TOAST']
      toastId?: ToasterToast['id']
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: 'REMOVE_TOAST',
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t,
        ),
      }

    case 'DISMISS_TOAST': {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      }
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, 'id'>

/**
 * MAT-254: Delegate sang hệ thống toast Sonner (đã mount `<Toaster />` ở root layout).
 *
 * Trước đây hàm này chỉ push vào memoryState của shadcn reducer, NHƯNG shadcn `<Toaster />`
 * không được mount ở bất kỳ đâu trong app → toast không bao giờ hiển thị.
 * Giờ `toast({ title, description, variant })` được map sang `sonnerToast.success/error`
 * để hiển thị đúng trên Sonner Toaster của app.
 */
function toast({ title, description, variant, ...props }: Toast) {
  // Vẫn dispatch để giữ tương thích với `useToast()` / `toaster.tsx` nếu có nơi dùng
  const id = genId()
  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      title,
      description,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  const message = title as React.ReactNode
  const opts = { description: description as React.ReactNode }

  if (variant === 'destructive') {
    sonnerToast.error(message, opts)
  } else {
    sonnerToast.success(message, opts)
  }

  const update = (next: ToasterToast) =>
    dispatch({
      type: 'UPDATE_TOAST',
      toast: { ...next, id },
    })
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id })

  return {
    id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  }
}

export { useToast, toast }

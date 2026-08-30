'use client'

import { useEffect, useCallback } from 'react'

interface HotkeyMap {
  [key: string]: () => void
}

export function useHotkeys(handlers: HotkeyMap, deps: any[] = []) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

    const key = e.key.toLowerCase()
    const handler = handlers[key]
    if (handler) {
      e.preventDefault()
      handler()
    }
  }, [handlers, ...deps])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

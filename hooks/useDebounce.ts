import { useState, useEffect } from 'react'

/**
 * Delays updating the returned value until `delay` ms have passed
 * without `value` changing. Use this to throttle expensive effects
 * (e.g. API calls) triggered by rapidly-changing state like search inputs.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

import { useEffect, useState } from "react"

/**
 * Returns a copy of `value` that only updates `delayMs` after the last change.
 * Used on the search box so filtering the ~4,000-course dataset runs once per
 * pause in typing rather than on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs = 150): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])

  return debounced
}

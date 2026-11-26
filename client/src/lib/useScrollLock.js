import { useEffect } from 'react'

let locks = 0
let previousOverflow

// A nested history/date dialog must not unlock the page behind its parent.
export const useScrollLock = (active) => {
  useEffect(() => {
    if (!active) return undefined
    if (locks++ === 0) {
      previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    return () => {
      if (--locks === 0) document.body.style.overflow = previousOverflow
    }
  }, [active])
}

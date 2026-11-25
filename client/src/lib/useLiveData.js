import { useEffect, useState } from 'react'
import { subscribeDataChange } from './liveEvents'

// Stable string avoids resubscribing when a component renders an inline array.
export const useLiveData = (userId, tables, enabled = true) => {
  const [version, setVersion] = useState(0)
  const key = tables.join(',')
  useEffect(() => {
    if (!userId || !enabled) return undefined
    return subscribeDataChange(userId, key.split(','), () => setVersion((value) => value + 1))
  }, [userId, key, enabled])
  return version
}

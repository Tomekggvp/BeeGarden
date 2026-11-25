export const ACCOUNT_DATA_EVENT = 'beegarden:account-data'
export const DATA_TABLES = ['hives', 'apiaries', 'beehive_details', 'tasks', 'hive_checks', 'honey_pumpings', 'treatments', 'task_notification_history', 'push_subscriptions', 'user_locations']

export const dispatchDataChange = (userId, table = '*') => {
  window.dispatchEvent(new CustomEvent(ACCOUNT_DATA_EVENT, { detail: { userId, table } }))
}

export const subscribeDataChange = (userId, tables, callback) => {
  const listener = ({ detail }) => {
    if (detail?.userId === userId && (detail.table === '*' || tables.includes(detail.table))) callback()
  }
  window.addEventListener(ACCOUNT_DATA_EVENT, listener)
  return () => window.removeEventListener(ACCOUNT_DATA_EVENT, listener)
}

import { supabase, createUserClient } from './db.js'
import { createApp } from './app.js'

const { app, checkDueReminders, pushEnabled } = createApp({ supabase, createUserClient })
const PORT = process.env.PORT || 10000
const runReminders = () => checkDueReminders().catch((error) => console.error('Reminder run failed:', error.message))
const server = app.listen(PORT, () => {
  console.log(`Server on port ${PORT}`)
  if (pushEnabled) runReminders()
})
const interval = pushEnabled ? setInterval(runReminders, 30_000) : null
const shutdown = () => {
  if (interval) clearInterval(interval)
  server.close()
  setTimeout(() => process.exit(1), 10_000).unref()
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

import { readAllPages } from './pagination.js'

// The main hive list must not depend on a sleeping/restarting Render instance.
// Supabase applies the same owner RLS used for the other browser data queries.
export const loadUserHives = (client, userId, signal) => readAllPages((from, to) => {
  let query = client.from('hives').select('hive_number,created_at,apiary_id')
    .eq('user_id', userId).order('created_at').order('hive_number').range(from, to)
  if (signal) query = query.abortSignal(signal)
  return query
})

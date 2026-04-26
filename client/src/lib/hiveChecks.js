import { supabase } from '../services/supabaseClient'

export const EMPTY_HIVE_CHECKS = Object.freeze({
  pumpingRequired: false,
  pumpingNotificationsEnabled: false,
  treatmentRequired: false,
  treatmentNotificationsEnabled: false,
})

const withHiveChecksHint = (error) => {
  if (!error) return error
  if (error.code === 'PGRST205' || /hive_checks/i.test(String(error.message || ''))) {
    return Object.assign(new Error(
      "Не найдена таблица 'public.hive_checks' в Supabase. Выполните SQL из файла supabase_hive_checks.sql и обновите PostgREST schema cache в настройках API."
    ), { originalError: error })
  }

  return error
}

export const normalizeHiveCheck = (row) => {
  const safeRow = row || {}

  return {
    pumpingRequired: Boolean(safeRow.pumping_required),
    pumpingNotificationsEnabled: Boolean(safeRow.pumping_notifications_enabled),
    treatmentRequired: Boolean(safeRow.treatment_required),
    treatmentNotificationsEnabled: Boolean(safeRow.treatment_notifications_enabled),
  }
}

const toDbPayload = (userId, hiveId, state) => ({
  user_id: userId,
  hive_id: String(hiveId),
  pumping_required: Boolean(state.pumpingRequired),
  pumping_notifications_enabled: Boolean(state.pumpingRequired && state.pumpingNotificationsEnabled),
  treatment_required: Boolean(state.treatmentRequired),
  treatment_notifications_enabled: Boolean(state.treatmentRequired && state.treatmentNotificationsEnabled),
  updated_at: new Date().toISOString(),
})

export const fetchHiveCheck = async (userId, hiveId) => {
  const { data, error } = await supabase
    .from('hive_checks')
    .select('*')
    .eq('user_id', userId)
    .eq('hive_id', String(hiveId))
    .maybeSingle()

  if (error) throw withHiveChecksHint(error)
  return normalizeHiveCheck(data)
}

export const fetchHiveChecksMap = async (userId) => {
  const { data, error } = await supabase
    .from('hive_checks')
    .select('*')
    .eq('user_id', userId)

  if (error) throw withHiveChecksHint(error)

  return (data || []).reduce((accumulator, row) => {
    accumulator[String(row.hive_id)] = normalizeHiveCheck(row)
    return accumulator
  }, {})
}

export const upsertHiveCheck = async (userId, hiveId, state) => {
  const payload = toDbPayload(userId, hiveId, state)

  const { data, error } = await supabase
    .from('hive_checks')
    .upsert(payload, { onConflict: 'user_id,hive_id' })
    .select()
    .single()

  if (error) throw withHiveChecksHint(error)
  return normalizeHiveCheck(data)
}

export const clearHiveCheckRequirement = async (userId, hiveId, kind) => {
  const nextValues = kind === 'pumping'
    ? {
      pumping_required: false,
      pumping_notifications_enabled: false,
    }
    : {
      treatment_required: false,
      treatment_notifications_enabled: false,
    }

  const { error } = await supabase
    .from('hive_checks')
    .update({
      ...nextValues,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('hive_id', String(hiveId))

  if (error) throw withHiveChecksHint(error)
}

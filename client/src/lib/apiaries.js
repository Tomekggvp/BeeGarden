import { supabase } from '../services/supabaseClient'
import { readAllPages } from './pagination'

export const listApiaries = async (userId) => {
  const { error } = await supabase.rpc('ensure_default_apiary')
  if (error) throw error
  return readAllPages((from, to) => supabase.from('apiaries')
    .select('id,name,is_default,latitude,longitude,saved_at,created_at')
    .eq('user_id', userId)
    .order('created_at').order('id').range(from, to))
}

export const saveApiary = async (userId, name, id) => {
  const trimmedName = name.trim()
  if (!trimmedName || trimmedName.length > 120) throw new Error('Название должно содержать от 1 до 120 символов.')
  const query = id
    ? supabase.from('apiaries').update({ name: trimmedName, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId)
    : supabase.from('apiaries').insert({ user_id: userId, name: trimmedName })
  const { data, error } = await query.select('id,name,is_default,latitude,longitude,saved_at,created_at').single()
  if (error) throw error
  return data
}

import { readAllPages } from './pagination.js'

// The main hive list must not depend on a sleeping/restarting Render instance.
// Supabase applies the same owner RLS used for the other browser data queries.
export const loadUserHives = (client, userId, signal) => readAllPages((from, to) => {
  let query = client.from('hives').select('hive_number,created_at,apiary_id')
    .eq('user_id', userId).order('created_at').order('hive_number').range(from, to)
  if (signal) query = query.abortSignal(signal)
  return query
})

export const normalizeHiveNumber = (value) => {
  const number = String(value ?? '').trim()
  if (!number || number.length > 64 || !/^[\p{L}\p{N}_ .-]+$/u.test(number)) {
    throw new Error('Введите номер улья: до 64 букв, цифр, пробелов, точек или дефисов.')
  }
  return number
}

const hiveWriteError = (error) => {
  if (error.code === '23505') return new Error('Улей с таким номером уже есть в аккаунте. Номер или название должны быть уникальными среди всех пасек.', { cause: error })
  return new Error('Не удалось сохранить изменения. Проверьте соединение и выбранную пасеку, затем повторите.', { cause: error })
}

export const createUserHive = async (client, userId, hiveNumber, apiaryId) => {
  if (!userId || !apiaryId) throw new Error('Сначала выберите пасеку.')
  const { data, error } = await client.from('hives')
    .insert({ user_id: userId, hive_number: normalizeHiveNumber(hiveNumber), apiary_id: apiaryId })
    .select('hive_number,created_at,apiary_id').single()
  if (error) throw hiveWriteError(error)
  return data
}

export const deleteUserHive = async (client, userId, hiveNumber) => {
  const { error } = await client.from('hives').delete()
    .eq('user_id', userId).eq('hive_number', normalizeHiveNumber(hiveNumber))
  if (error) throw hiveWriteError(error)
}

export const moveUserHive = async (client, userId, hiveNumber, apiaryId) => {
  if (!userId || !apiaryId) throw new Error('Выберите пасеку назначения.')
  const { data, error } = await client.from('hives').update({ apiary_id: apiaryId })
    .eq('user_id', userId).eq('hive_number', normalizeHiveNumber(hiveNumber))
    .select('hive_number,created_at,apiary_id').single()
  if (error) throw hiveWriteError(error)
  return data
}

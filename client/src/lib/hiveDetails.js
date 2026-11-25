export const parseSwarmCount = (value) => {
  const count = value === '' || value == null ? 0 : Number(value)
  if (!Number.isSafeInteger(count) || count < 0 || count > 100000) {
    throw new Error('Количество роений должно быть целым числом от 0 до 100000.')
  }
  return count
}

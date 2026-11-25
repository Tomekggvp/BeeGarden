// Supabase caps individual responses. Fetch every page rather than truncating places.
export const readAllPages = async (readPage, pageSize = 500) => {
  const rows = []
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await readPage(offset, offset + pageSize - 1)
    if (error) throw error
    rows.push(...(data || []))
    if (!data || data.length < pageSize) return rows
  }
}

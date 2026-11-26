import { useState } from 'react'

export default function HiveTransfer({ apiaries, currentApiaryId, onTransfer }) {
  const [destination, setDestination] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (apiaries.length < 2 || !onTransfer) return null
  const transfer = async () => {
    if (!destination || busy) return
    setBusy(true)
    setError('')
    try { await onTransfer(destination) }
    catch (error) { setError(error.response?.data?.error || error.message || 'Не удалось перенести улей.') }
    finally { setBusy(false) }
  }
  return (
    <section aria-label="Перенос улья" className="mt-6 rounded-lg border border-[#f1d88a] bg-[#fffaf0] p-4">
      <h3 className="font-black text-[#7a5a1a]">Перенести в другую пасеку</h3>
      <p className="mt-2 text-sm text-[#7a5a1a]">Номер, карточка, задачи и история улья сохранятся.</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <select aria-label="Пасека назначения" value={destination} onChange={(event) => setDestination(event.target.value)} disabled={busy} className="min-w-0 flex-1 rounded-lg border-2 border-[#f1d88a] bg-white px-3 py-3">
          <option value="">Выберите пасеку</option>
          {apiaries.filter((item) => item.id !== currentApiaryId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <button type="button" onClick={transfer} disabled={!destination || busy} className="rounded-lg primary-action px-4 py-3 font-bold disabled:opacity-50">{busy ? 'Переношу...' : 'Перенести улей'}</button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm font-bold text-red-700">{error}</p>}
    </section>
  )
}

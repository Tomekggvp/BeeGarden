import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, MapPinned, PanelTopClose, Plus, Pencil } from 'lucide-react'

export default function ApiaryPanel({ apiaries, activeApiary, onSelect, onSave, loading, error, compact = false }) {
  const [expanded, setExpanded] = useState(false)
  const panelId = useId()
  const [mode, setMode] = useState(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const openForm = (nextMode) => {
    setMode(nextMode)
    setName(nextMode === 'rename' ? activeApiary?.name || '' : '')
    setSaveError('')
  }
  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setSaveError('')
    try {
      await onSave(name, mode === 'rename' ? activeApiary.id : undefined)
      setMode(null)
    } catch (error) {
      setSaveError(error.message || 'Не удалось сохранить пасеку.')
    } finally { setSaving(false) }
  }
  return (
    <section aria-label="Выбор пасеки" className="mb-5 rounded-lg border border-[#f1d88a] bg-[#fffdf7] p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#7a5a1a]">Пасека</p>
          <p className="truncate text-base font-black text-[#2f2100]">{loading ? 'Загрузка...' : activeApiary?.name || 'Выберите пасеку'}</p>
        </div>
        <button type="button" aria-label={expanded ? 'Скрыть выбор пасеки' : 'Показать выбор пасеки'} title={expanded ? 'Скрыть выбор пасеки' : 'Показать выбор пасеки'} aria-expanded={expanded} aria-controls={panelId} onClick={() => setExpanded((value) => !value)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#f1d88a] bg-[#fff4cc] text-[#7a5a1a] transition-colors hover:bg-[#ffe8a3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a5a00]">
          {expanded ? <PanelTopClose size={22} /> : <MapPinned size={22} />}
        </button>
      </div>
      <div id={panelId} hidden={!expanded} className="mt-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid min-w-0 basis-full gap-2 text-sm font-bold text-[#7a5a1a] sm:flex-1 sm:basis-[220px]">
          {loading ? 'Загрузка пасек...' : 'Текущая пасека'}
          <select aria-label="Текущая пасека" value={activeApiary?.id || ''} disabled={loading || !apiaries.length} onChange={(event) => onSelect(event.target.value)} className="min-w-0 rounded-lg border-2 border-[#f1d88a] bg-white px-3 py-3 text-base font-bold text-[#2f2100]">
            {!apiaries.length && <option value="">Нет доступных пасек</option>}
            {apiaries.map((apiary) => <option key={apiary.id} value={apiary.id}>{apiary.name}</option>)}
          </select>
        </label>
        {!compact && <>
          <button type="button" onClick={() => openForm('create')} disabled={loading} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[#f8b400] px-3 py-3 text-sm font-bold text-[#2f2100] sm:flex-none sm:px-4 sm:text-base"><Plus size={18} />Добавить пасеку</button>
          <button type="button" onClick={() => openForm('rename')} disabled={!activeApiary || loading} aria-label="Переименовать пасеку" className="rounded-lg border border-[#f1d88a] p-3 text-[#7a5a1a]"><Pencil size={20} /></button>
        </>}
        {activeApiary && <Link to="/location" className="inline-flex min-h-12 basis-full items-center justify-center gap-2 rounded-lg border border-[#f1d88a] px-4 py-3 font-bold text-[#7a5a1a] sm:basis-auto"><MapPin size={18} />{activeApiary.latitude == null ? 'Выбрать локацию' : 'Изменить локацию'}</Link>}
        {compact && <Link to="/" className="px-2 py-3 font-bold text-[#7a5a1a]">Управление пасеками</Link>}
      </div>
      {!compact && <p className="mt-3 text-sm text-[#7a5a1a]">Количество не ограничено. У каждой пасеки — своя локация и погода.</p>}
      {mode && <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="grid min-w-0 basis-full gap-2 text-sm font-bold text-[#7a5a1a] sm:flex-1 sm:basis-auto">{mode === 'rename' ? 'Новое название пасеки' : 'Название новой пасеки'}<input autoFocus aria-label="Название пасеки" required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder="Например, Липовая роща" className="min-w-0 rounded-lg border-2 border-[#f1d88a] px-3 py-3 text-base text-[#2f2100]" /></label>
        <button type="submit" disabled={saving || !name.trim()} className="rounded-lg bg-[#f8b400] px-4 py-3 font-bold disabled:opacity-50">{saving ? 'Сохраняю...' : 'Сохранить пасеку'}</button>
        <button type="button" disabled={saving} onClick={() => setMode(null)} className="px-3 py-3 font-bold text-[#7a5a1a]">Отмена</button>
      </form>}
      </div>
      {(error || saveError) && <p role="alert" className="mt-3 text-sm font-bold text-red-700">{saveError || error}</p>}
    </section>
  )
}

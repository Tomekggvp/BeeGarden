import { useMemo, useState } from 'react'
import { History, Plus, X } from 'lucide-react'
import { supabase } from '../services/supabaseClient'
import TreatmentHistoryModal from './TreatmentHistoryModal'

const getLocalDateInputValue = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value)
  const timezoneOffset = date.getTimezoneOffset() * 60000

  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

const createInitialFormState = () => {
  const today = getLocalDateInputValue()

  return {
    startDate: today,
    endDate: today,
    disease: '',
    medication: '',
    dosage: '',
  }
}

const inputClassName = 'w-full rounded-lg border-2 border-[#f1d88a] bg-white px-4 py-3 font-semibold text-[#2f2100] outline-none transition-all focus:border-[#f8b400] focus:ring-4 focus:ring-[#f8b400]/20'

const formatTreatmentDate = (value) => {
  if (!value) return ''

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

const TreatmentModal = ({ isOpen, onClose, hiveId, session }) => {
  const [form, setForm] = useState(createInitialFormState)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)

  const treatmentPeriod = useMemo(() => {
    if (!form.startDate || !form.endDate) return ''

    const startDate = formatTreatmentDate(form.startDate)
    const endDate = formatTreatmentDate(form.endDate)

    if (!startDate || !endDate) return ''
    if (startDate === endDate) return `Лечение: ${startDate}`

    return `Период: ${startDate} - ${endDate}`
  }, [form.endDate, form.startDate])

  const updateField = (field) => (event) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: event.target.value,
    }))
  }

  const handleSave = async () => {
    if (!session?.user?.id || !hiveId || isSaving) return

    const disease = form.disease.trim()
    const medication = form.medication.trim()
    const dosage = form.dosage.trim()

    if (!form.startDate || !form.endDate || !disease || !medication || !dosage) {
      setSuccessMessage('')
      setErrorMessage('Заполните все поля лечения.')
      return
    }

    if (form.endDate < form.startDate) {
      setSuccessMessage('')
      setErrorMessage('Конечная дата не может быть раньше даты начала лечения.')
      return
    }

    setIsSaving(true)
    setErrorMessage('')

    const { error } = await supabase
      .from('treatments')
      .insert([{
        user_id: session.user.id,
        hive_id: String(hiveId),
        start_date: form.startDate,
        end_date: form.endDate,
        disease,
        medication,
        dosage,
      }])

    setIsSaving(false)

    if (error) {
      console.error('Save treatment error:', error)
      setSuccessMessage('')
      setErrorMessage('Не удалось сохранить лечение. Выполните SQL-обновление для таблицы treatments в Supabase.')
      return
    }

    setForm(createInitialFormState())
    setHistoryRefreshKey((currentKey) => currentKey + 1)
    setErrorMessage('')
    setSuccessMessage(`Лечение для улья №${hiveId} сохранено.`)
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 z-0 bg-[#111827]/35 backdrop-blur-sm" />

        <div
          className="relative z-10 my-4 flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col rounded-lg border border-[#f1d88a] bg-[#fffdf7] p-6 shadow-[0_24px_70px_rgba(93,58,0,0.18)] sm:max-w-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full text-[#9a5a00] transition-colors hover:bg-[#fff4cc] hover:text-[#2f2100]"
            aria-label="Закрыть лечение"
          >
            <X size={18} />
          </button>

          <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-[#9a5a00]">
            Лечение
          </p>
          <h2 className="font-['Tenor_Sans'] text-4xl leading-none text-[#2f2100]">
            Улей №{hiveId}
          </h2>

          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="mt-5 inline-flex w-fit items-center gap-2 rounded-lg border border-[#f1d88a] bg-[#fffaf0] px-4 py-2 text-sm font-black text-[#8b4f00] transition-all hover:border-[#f8b400] hover:bg-[#fff4cc]"
          >
            <History size={16} />
            История лечения
          </button>

          {treatmentPeriod && (
            <p className="mt-4 rounded-lg bg-[#fff4cc] px-3 py-2 text-sm font-bold text-[#8b4f00]">
              {treatmentPeriod}
            </p>
          )}

          <div className="mt-5 grid gap-3 overflow-y-auto pr-1">
            <label className="grid gap-2 text-sm font-bold text-[#7a5a1a]">
              Дата начала лечения
              <input
                type="date"
                value={form.startDate}
                onChange={updateField('startDate')}
                className={inputClassName}
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[#7a5a1a]">
              Конечная дата
              <input
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={updateField('endDate')}
                className={inputClassName}
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[#7a5a1a]">
              Заболевание
              <input
                type="text"
                value={form.disease}
                onChange={updateField('disease')}
                className={inputClassName}
                placeholder="Например, варроатоз"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[#7a5a1a]">
              Препарат
              <input
                type="text"
                value={form.medication}
                onChange={updateField('medication')}
                className={inputClassName}
                placeholder="Название препарата"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[#7a5a1a]">
              Дозировка
              <textarea
                value={form.dosage}
                onChange={updateField('dosage')}
                className={`${inputClassName} min-h-24 resize-none`}
                placeholder="Опишите дозировку и схему применения"
              />
            </label>

            {errorMessage && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                {errorMessage}
              </p>
            )}

            {successMessage && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                {successMessage}
              </p>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#f8b400] px-4 font-black text-[#2b1a00] transition-all hover:bg-[#ffd24a] active:scale-[0.99] disabled:opacity-60"
            >
              <Plus size={18} />
              {isSaving ? 'Сохранение...' : 'Сохранить лечение'}
            </button>
          </div>
        </div>
      </div>

      <TreatmentHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        hiveId={hiveId}
        session={session}
        refreshKey={historyRefreshKey}
      />
    </>
  )
}

export default TreatmentModal

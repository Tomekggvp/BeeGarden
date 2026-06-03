import { useEffect, useState } from 'react'
import { Droplets, Plus, X } from 'lucide-react'
import { clearHiveCheckRequirement } from '../lib/hiveChecks'
import { supabase } from '../services/supabaseClient'

const HONEY_TYPE_OPTIONS = [
  { value: 'Рапсовый', label: 'Рапсовый' },
  { value: 'Липовый', label: 'Липовый' },
  { value: 'Гречишный', label: 'Гречишный' },
  { value: 'other', label: 'Иное' },
]

const getLocalDateInputValue = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value)
  const timezoneOffset = date.getTimezoneOffset() * 60000

  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

const createInitialFormState = () => ({
  pumpingDate: getLocalDateInputValue(),
  volumeLiters: '',
  honeyType: '',
  customHoneyType: '',
})

const inputClassName = 'w-full rounded-lg border-2 border-[#f1d88a] bg-white px-4 py-3 font-semibold text-[#2f2100] outline-none transition-all focus:border-[#f8b400] focus:ring-4 focus:ring-[#f8b400]/20'

const formatPumpingDate = (value) => {
  if (!value) return ''

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

const formatVolume = (value) => {
  if (value === null || value === undefined || value === '') return ''

  return `${Number(value).toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} л`
}

const PumpingModal = ({ isOpen, onClose, hiveId, session, onPumpingSaved }) => {
  const [form, setForm] = useState(createInitialFormState)
  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!isOpen || !hiveId || !session?.user?.id) return

    const fetchPumpings = async () => {
      setIsLoading(true)

      const { data, error } = await supabase
        .from('honey_pumpings')
        .select('*')
        .eq('hive_id', String(hiveId))
        .eq('user_id', session.user.id)
        .order('pumping_date', { ascending: false })
        .order('created_at', { ascending: false })

      setIsLoading(false)

      if (error) {
        console.error('Load pumpings error:', error)
        setErrorMessage('Не удалось загрузить записи по откачке.')
        return
      }

      setErrorMessage('')
      setRecords(data || [])
    }

    fetchPumpings()
  }, [hiveId, isOpen, session?.user?.id])

  const updateField = (field) => (event) => {
    const nextValue = event.target.value

    setForm((currentForm) => {
      if (field !== 'honeyType') {
        return {
          ...currentForm,
          [field]: nextValue,
        }
      }

      return {
        ...currentForm,
        honeyType: nextValue,
        customHoneyType: nextValue === 'other' ? currentForm.customHoneyType : '',
      }
    })
  }

  const handleSave = async () => {
    if (!session?.user?.id || !hiveId || isSaving) return

    const volumeValue = Number.parseFloat(String(form.volumeLiters).replace(',', '.'))
    const customHoneyType = form.customHoneyType.trim()
    const honeyType = form.honeyType === 'other' ? customHoneyType : form.honeyType

    if (!form.pumpingDate || !form.volumeLiters || !form.honeyType) {
      setSuccessMessage('')
      setErrorMessage('Заполните дату, объем и вид мёда.')
      return
    }

    if (form.honeyType === 'other' && !customHoneyType) {
      setSuccessMessage('')
      setErrorMessage('Введите свой вид мёда.')
      return
    }

    if (Number.isNaN(volumeValue) || volumeValue <= 0) {
      setSuccessMessage('')
      setErrorMessage('Укажите корректный объем в литрах.')
      return
    }

    setIsSaving(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('honey_pumpings')
      .insert([{
        user_id: session.user.id,
        hive_id: String(hiveId),
        pumping_date: form.pumpingDate,
        volume_liters: volumeValue,
        honey_type: honeyType,
      }])
      .select()
      .single()

    setIsSaving(false)

    if (error) {
      console.error('Save pumping error:', error)
      setSuccessMessage('')
      setErrorMessage('Не удалось сохранить откачку. Выполните SQL-обновление для таблицы honey_pumpings в Supabase.')
      return
    }

    try {
      await clearHiveCheckRequirement(session.user.id, hiveId, 'pumping')
      onPumpingSaved?.(String(hiveId))
    } catch (clearError) {
      console.error('Clear pumping check flag error:', clearError)
    }

    setRecords((currentRecords) => [data, ...currentRecords])
    setForm(createInitialFormState())
    setErrorMessage('')
    setSuccessMessage(`Откачка для улья №${hiveId} сохранена.`)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[30010] flex items-center justify-center overflow-y-auto p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[#111827]/35 backdrop-blur-sm" />

      <div
        className="relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-y-auto rounded-lg border border-[#f1d88a] bg-[#fffdf7] p-6 shadow-[0_24px_70px_rgba(93,58,0,0.18)] sm:max-w-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full text-[#9a5a00] transition-colors hover:bg-[#fff4cc] hover:text-[#2f2100]"
          aria-label="Закрыть откачку"
        >
          <X size={18} />
        </button>

        <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-[#9a5a00]">
          Откачка
        </p>
        <h2 className="font-['Tenor_Sans'] text-4xl leading-none text-[#2f2100]">
          Улей №{hiveId}
        </h2>

        <div className="mt-5 grid gap-3 overflow-y-auto pr-1">
          <label className="grid gap-2 text-sm font-bold text-[#7a5a1a]">
            Дата откачки
            <input
              type="date"
              value={form.pumpingDate}
              onChange={updateField('pumpingDate')}
              className={inputClassName}
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-[#7a5a1a]">
            Объем, литры
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={form.volumeLiters}
              onChange={updateField('volumeLiters')}
              className={inputClassName}
              placeholder="Например, 12.5"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-[#7a5a1a]">
            Вид мёда
            <select
              value={form.honeyType}
              onChange={updateField('honeyType')}
              className={inputClassName}
            >
              <option value="">Выберите вид мёда</option>
              {HONEY_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {form.honeyType === 'other' && (
            <label className="grid gap-2 text-sm font-bold text-[#7a5a1a]">
              Свой вид мёда
              <input
                type="text"
                value={form.customHoneyType}
                onChange={updateField('customHoneyType')}
                className={inputClassName}
                placeholder="Введите вид мёда"
              />
            </label>
          )}

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
            {isSaving ? 'Сохранение...' : 'Сохранить откачку'}
          </button>
        </div>

        <div className="mt-6 overflow-y-auto pr-1">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#9a5a00]">
            Записи по улью
          </p>

          {isLoading ? (
            <p className="rounded-lg border border-[#f1d88a] bg-white/80 px-4 py-5 text-center text-sm font-semibold text-[#7a5a1a]">
              Загружаю записи...
            </p>
          ) : records.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#f1d88a] bg-white/80 px-4 py-5 text-center text-sm font-semibold text-[#7a5a1a]">
              Для этого улья пока нет записей об откачке.
            </p>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="rounded-lg border border-[#f1d88a] bg-white px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-[#2f2100]">
                        {record.honey_type}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#7a5a1a]">
                        {formatPumpingDate(record.pumping_date)}
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-2 rounded-full bg-[#fff4cc] px-3 py-1 text-xs font-black text-[#8b4f00]">
                      <Droplets size={14} />
                      {formatVolume(record.volume_liters)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PumpingModal

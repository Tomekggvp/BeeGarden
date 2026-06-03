import { useEffect, useState } from 'react'
import { CalendarDays, Pill, Syringe, Trash2, X } from 'lucide-react'
import { supabase } from '../services/supabaseClient'

const formatTreatmentDate = (value) => {
  if (!value) return ''

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

const getTreatmentPeriod = (record) => {
  const startDate = formatTreatmentDate(record.start_date)
  const endDate = formatTreatmentDate(record.end_date)

  if (!startDate && !endDate) return ''
  if (!endDate || startDate === endDate) return startDate
  return `${startDate} - ${endDate}`
}

const TreatmentHistoryModal = ({ isOpen, onClose, hiveId, session, refreshKey = 0 }) => {
  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('beegarden:modal-visibility', {
      detail: { open: isOpen, modalId: 'treatment-history-modal' },
    }))

    return () => {
      window.dispatchEvent(new CustomEvent('beegarden:modal-visibility', {
        detail: { open: false, modalId: 'treatment-history-modal' },
      }))
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !hiveId || !session?.user?.id) return

    const fetchTreatmentHistory = async () => {
      setIsLoading(true)

      const { data, error } = await supabase
        .from('treatments')
        .select('*')
        .eq('hive_id', String(hiveId))
        .eq('user_id', session.user.id)
        .order('start_date', { ascending: false })
        .order('created_at', { ascending: false })

      setIsLoading(false)

      if (error) {
        console.error('Load treatments error:', error)
        setErrorMessage('Не удалось загрузить историю лечения.')
        return
      }

      setErrorMessage('')
      setRecords(data || [])
    }

    fetchTreatmentHistory()
  }, [hiveId, isOpen, refreshKey, session?.user?.id])

  const handleDelete = async (recordId) => {
    if (!session?.user?.id || deletingId) return

    setDeletingId(recordId)

    const { error } = await supabase
      .from('treatments')
      .delete()
      .eq('id', recordId)
      .eq('hive_id', String(hiveId))
      .eq('user_id', session.user.id)

    setDeletingId(null)

    if (error) {
      console.error('Delete treatment error:', error)
      setErrorMessage('Не удалось удалить запись о лечении.')
      return
    }

    setErrorMessage('')
    setRecords((currentRecords) => currentRecords.filter((record) => record.id !== recordId))
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[30020] flex items-center justify-center overflow-y-auto p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[#111827]/40 backdrop-blur-sm" />

      <div
        className="relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-y-auto rounded-lg border border-[#f1d88a] bg-[#fffdf7] p-6 shadow-[0_24px_70px_rgba(93,58,0,0.18)] sm:max-w-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#9a5a00] transition-colors hover:bg-[#fff4cc] hover:text-[#2f2100]"
          aria-label="Закрыть историю лечения"
        >
          <X size={18} />
        </button>

        <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-[#9a5a00]">
          История лечения
        </p>
        <h2 className="font-['Tenor_Sans'] text-4xl leading-none text-[#2f2100]">
          Улей №{hiveId}
        </h2>

        {errorMessage && (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
            {errorMessage}
          </p>
        )}

        <div className="mt-6 overflow-y-auto pr-1">
          {isLoading ? (
            <p className="rounded-lg border border-[#f1d88a] bg-white/80 px-4 py-5 text-center text-sm font-semibold text-[#7a5a1a]">
              Загружаю историю...
            </p>
          ) : records.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#f1d88a] bg-white/80 px-4 py-5 text-center text-sm font-semibold text-[#7a5a1a]">
              Для этого улья пока нет записей о лечении.
            </p>
          ) : (
            <div className="space-y-3">
              {records.map((record) => {
                const isDeleting = deletingId === record.id

                return (
                  <div
                    key={record.id}
                    className="rounded-lg border border-[#f1d88a] bg-white px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black text-[#2f2100]">
                          {record.disease}
                        </p>
                        <p className="mt-1 inline-flex items-center gap-2 rounded-full bg-[#fff4cc] px-3 py-1 text-xs font-black text-[#8b4f00]">
                          <CalendarDays size={14} />
                          {getTreatmentPeriod(record)}
                        </p>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="rounded-full border border-[#f1d88a] bg-[#fffaf0] px-3 py-1 text-xs font-black text-[#9a5a00]">
                          {record.dosage}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleDelete(record.id)}
                          disabled={isDeleting}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 transition-colors hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label="Удалить запись о лечении"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm font-semibold text-[#6f5a26] sm:grid-cols-2">
                      <div className="rounded-lg bg-[#fffaf0] px-3 py-3">
                        <span className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#9a5a00]">
                          <Pill size={14} />
                          Препарат
                        </span>
                        <p className="text-base text-[#2f2100]">{record.medication}</p>
                      </div>

                      <div className="rounded-lg bg-[#fffaf0] px-3 py-3">
                        <span className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#9a5a00]">
                          <Syringe size={14} />
                          Дозировка
                        </span>
                        <p className="whitespace-pre-line text-base text-[#2f2100]">{record.dosage}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TreatmentHistoryModal

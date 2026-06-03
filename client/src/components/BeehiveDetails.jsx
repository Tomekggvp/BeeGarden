import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { X } from 'lucide-react'
import ComboBox from '../componentsMUI/ComboBox'
import DateSelect from '../componentsMUI/DateSelect'
import { supabase } from '../services/supabaseClient'

const BeehiveDetails = ({ isOpen, onClose, hiveId, session }) => {
  const [details, setDetails] = useState({
    breed: null,
    swarms: '',
    date: null,
    customNote: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('beegarden:modal-visibility', {
      detail: { open: isOpen, modalId: 'beehive-details' },
    }))

    return () => {
      window.dispatchEvent(new CustomEvent('beegarden:modal-visibility', {
        detail: { open: false, modalId: 'beehive-details' },
      }))
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && hiveId && session?.user?.id) {
      setLoading(true)

      supabase
        .from('beehive_details')
        .select('*')
        .eq('hive_id', String(hiveId))
        .eq('user_id', session.user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) throw error

          if (data?.hive_id) {
            setDetails({
              breed: data.breed || null,
              swarms: data.swarms || '',
              date: data.install_date ? dayjs(data.install_date) : null,
              customNote: data.custom_note || '',
            })
          } else {
            setDetails({ breed: null, swarms: '', date: null, customNote: '' })
          }
        })
        .catch((err) => {
          console.error('Load error:', err.message)
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen, hiveId, session])

  if (!isOpen) return null

  const handleSave = async (event) => {
    event.preventDefault()
    if (!session?.user?.id) return alert('Вы не авторизованы')

    setLoading(true)
    try {
      const payload = {
        hive_id: String(hiveId),
        user_id: session.user.id,
        breed: details.breed,
        swarms: parseInt(details.swarms, 10) || 0,
        install_date: details.date ? details.date.format('YYYY-MM-DD') : null,
        custom_note: String(details.customNote || '').trim() || null,
      }

      const { error } = await supabase
        .from('beehive_details')
        .upsert(payload, { onConflict: 'hive_id,user_id' })

      if (error) throw error

      onClose()
    } catch (err) {
      const errorMessage = err.message || 'Ошибка сохранения'
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[30000] flex items-center justify-center overflow-y-auto p-4">
      <div
        className="absolute inset-0 bg-[#111827]/35 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-lg border border-[#f1d88a] bg-[#fffdf7] p-6 shadow-[0_24px_70px_rgba(93,58,0,0.18)] sm:max-w-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#9a5a00] transition-colors hover:bg-[#fff4cc] hover:text-[#2f2100]"
          aria-label="Закрыть"
        >
          <X size={18} />
        </button>

        <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-[#9a5a00]">
          Карточка улья
        </p>
        <h2 className="font-['Tenor_Sans'] text-4xl leading-none text-[#2f2100]">
          Улей №{hiveId}
        </h2>

        <form onSubmit={handleSave} className="mt-6">
          <div className="grid gap-5">
            <ComboBox
              value={details.breed}
              onChange={(value) => setDetails({ ...details, breed: value })}
            />

            <div className="flex flex-col">
              <label className="mb-2 block text-sm font-bold text-[#7a5a1a]">
                Количество роений
              </label>
              <input
                type="number"
                value={details.swarms}
                onChange={(event) => setDetails({ ...details, swarms: event.target.value })}
                className="rounded-lg border-2 border-[#f1d88a] bg-white px-4 py-3 text-base font-bold text-[#2f2100] outline-none transition-all focus:border-[#f8b400] focus:ring-4 focus:ring-[#f8b400]/20"
                required
              />
            </div>

            <DateSelect
              value={details.date}
              onChange={(value) => setDetails({ ...details, date: value })}
            />

            <div className="flex flex-col">
              <label className="mb-2 block text-sm font-bold text-[#7a5a1a]">
                Свободная запись
              </label>
              <textarea
                value={details.customNote}
                onChange={(event) => setDetails({ ...details, customNote: event.target.value })}
                rows={5}
                className="rounded-lg border-2 border-[#f1d88a] bg-white px-4 py-3 text-base font-medium text-[#2f2100] outline-none transition-all placeholder:text-[#b79d63] focus:border-[#f8b400] focus:ring-4 focus:ring-[#f8b400]/20"
                placeholder="Введите любой текст: наблюдения, комментарий, напоминание"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-[#f8b400] px-5 py-4 font-black text-[#2b1a00] shadow-sm transition-all hover:bg-[#ffd24a] active:scale-95 disabled:opacity-60"
          >
            {loading ? 'Сохранение...' : 'Сохранить данные'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default BeehiveDetails

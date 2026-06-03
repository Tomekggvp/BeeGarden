import { useEffect, useState } from 'react'
import { Bell, Clock3, Trash2, X } from 'lucide-react'
import { supabase } from '../services/supabaseClient'

const formatDateTime = (value) => {
  if (!value) return ''

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

const TaskNotificationsModal = ({ isOpen, onClose, session }) => {
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!isOpen || !session?.user?.id) return

    const fetchNotificationHistory = async () => {
      setIsLoading(true)

      const { data, error } = await supabase
        .from('task_notification_history')
        .select('*')
        .eq('user_id', session.user.id)
        .order('delivered_at', { ascending: false })

      setIsLoading(false)

      if (error) {
        console.error('Load notification history error:', error)
        setErrorMessage('Не удалось загрузить историю уведомлений.')
        return
      }

      setErrorMessage('')
      setNotifications(data || [])
    }

    fetchNotificationHistory()
  }, [isOpen, session?.user?.id])

  const handleDelete = async (id) => {
    if (!session?.user?.id || deletingId || isDeletingAll) return

    setDeletingId(id)

    const { error } = await supabase
      .from('task_notification_history')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    setDeletingId(null)

    if (error) {
      console.error('Delete notification history item error:', error)
      setErrorMessage('Не удалось удалить уведомление.')
      return
    }

    setErrorMessage('')
    setNotifications((currentNotifications) =>
      currentNotifications.filter((notification) => notification.id !== id)
    )
  }

  const handleDeleteAll = async () => {
    if (!session?.user?.id || isDeletingAll || deletingId || notifications.length === 0) return

    setIsDeletingAll(true)

    const { error } = await supabase
      .from('task_notification_history')
      .delete()
      .eq('user_id', session.user.id)

    setIsDeletingAll(false)

    if (error) {
      console.error('Delete all notification history error:', error)
      setErrorMessage('Не удалось очистить историю уведомлений.')
      return
    }

    setErrorMessage('')
    setNotifications([])
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
          aria-label="Закрыть историю уведомлений"
        >
          <X size={18} />
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4 pr-10">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-[#9a5a00]">
              История уведомлений
            </p>
            <h2 className="font-['Tenor_Sans'] text-4xl leading-none text-[#2f2100]">
              Все напоминания
            </h2>
          </div>

          <button
            type="button"
            onClick={handleDeleteAll}
            disabled={isDeletingAll || notifications.length === 0}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-black text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={16} />
            {isDeletingAll ? 'Удаляю...' : 'Очистить всё'}
          </button>
        </div>

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
          ) : notifications.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#f1d88a] bg-white/80 px-4 py-5 text-center text-sm font-semibold text-[#7a5a1a]">
              Пока нет уведомлений, которые уже пришли.
            </p>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const isDeleting = deletingId === notification.id

                return (
                  <div
                    key={notification.id}
                    className="rounded-lg border border-[#f1d88a] bg-white px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#9a5a00]">
                          <Bell size={14} />
                          Улей №{notification.hive_id}
                        </p>
                        <p className="mt-2 break-words text-lg font-black text-[#2f2100]">
                          {notification.task_text}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full bg-[#fff4cc] px-3 py-1 text-xs font-black text-[#8b4f00]">
                            <Clock3 size={14} />
                            Пришло: {formatDateTime(notification.delivered_at)}
                          </span>

                          {notification.reminder_at && (
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#f1d88a] bg-[#fffaf0] px-3 py-1 text-xs font-black text-[#9a5a00]">
                              Напоминание на: {formatDateTime(notification.reminder_at)}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(notification.id)}
                        disabled={isDeleting}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 transition-colors hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Удалить уведомление"
                      >
                        <Trash2 size={16} />
                      </button>
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

export default TaskNotificationsModal

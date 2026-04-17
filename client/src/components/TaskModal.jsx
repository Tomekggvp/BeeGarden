import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker'
import { Bell, Plus, Trash2, X } from 'lucide-react'
import { supabase } from '../services/supabaseClient'
import 'dayjs/locale/ru'

const honeyTextFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#2f2100',
    fontWeight: 700,
    '& fieldset': {
      borderColor: '#f1d88a',
      borderWidth: '2px',
    },
    '&:hover fieldset': {
      borderColor: '#f8b400',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#f8b400',
      boxShadow: '0 0 0 4px rgba(248, 180, 0, 0.2)',
    },
  },
}

const formatReminderDate = (value) => {
  if (!value) return ''

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

const getReminderDate = (value) => {
  if (!value) return null
  if (dayjs.isDayjs(value)) return value.isValid() ? value.toDate() : null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

const sortTasks = (tasks = []) =>
  [...tasks].sort((firstTask, secondTask) => {
    if (!firstTask.reminder_at && !secondTask.reminder_at) return 0
    if (!firstTask.reminder_at) return 1
    if (!secondTask.reminder_at) return -1

    return new Date(firstTask.reminder_at).getTime() - new Date(secondTask.reminder_at).getTime()
  })

const getNotificationPermission = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }

  return Notification.permission
}

const TaskModal = ({ isOpen, onClose, hiveId, session }) => {
  const [tasks, setTasks] = useState([])
  const [text, setText] = useState('')
  const [reminderAt, setReminderAt] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission)

  const minReminderAt = useMemo(() => dayjs(), [])

  useEffect(() => {
    if (!isOpen || !hiveId || !session?.user?.id) return

    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('hive_id', String(hiveId))
        .eq('user_id', session.user.id)

      if (error) {
        console.error('Load tasks error:', error)
        setErrorMessage('Не удалось загрузить задачи.')
        return
      }

      setErrorMessage('')
      setTasks(sortTasks(data || []))
    }

    fetchTasks()
  }, [isOpen, hiveId, session?.user?.id])

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported')
      return 'unsupported'
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)

      if (permission === 'granted') {
        window.dispatchEvent(new Event('beegarden:notifications-permission-changed'))
      }

      return permission
    }

    setNotificationPermission(Notification.permission)

    if (Notification.permission === 'granted') {
      window.dispatchEvent(new Event('beegarden:notifications-permission-changed'))
    }

    return Notification.permission
  }

  const handleAdd = async () => {
    const taskText = text.trim()
    if (!taskText || isSaving) return

    setErrorMessage('')

    const reminderDate = getReminderDate(reminderAt)

    if (reminderAt && !reminderDate) {
      setErrorMessage('Выберите корректную дату и время.')
      return
    }

    if (reminderDate && reminderDate.getTime() <= Date.now()) {
      setErrorMessage('Выберите дату и время в будущем.')
      return
    }

    if (reminderDate) {
      await requestNotificationPermission()
    }

    setIsSaving(true)

    const basePayload = {
      hive_id: String(hiveId),
      user_id: session.user.id,
      task_text: taskText,
    }

    const payload = reminderDate
      ? {
        ...basePayload,
        reminder_at: reminderDate.toISOString(),
        reminder_enabled: true,
        reminder_notified_at: null,
      }
      : basePayload

    const { data, error } = await supabase
      .from('tasks')
      .insert([payload])
      .select()
      .single()

    setIsSaving(false)

    if (error) {
      console.error('Add task error:', error)

      const message = reminderDate
        ? 'Не удалось сохранить задачу с напоминанием. Выполните SQL-обновление для таблицы tasks в Supabase.'
        : 'Не удалось сохранить задачу. Проверьте доступ к таблице tasks в Supabase.'

      setErrorMessage(message)
      return
    }

    setTasks((currentTasks) => sortTasks([...currentTasks, data]))
    setText('')
    setReminderAt(null)
  }

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Delete task error:', error)
      setErrorMessage('Не удалось удалить задачу.')
      return
    }

    setErrorMessage('')
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto p-4">
      <div
        className="absolute inset-0 bg-[#111827]/35 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md -translate-y-20 rounded-lg border border-[#f1d88a] bg-[#fffdf7] p-6 shadow-[0_24px_70px_rgba(93,58,0,0.18)] sm:translate-y-0"
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
          Задачи
        </p>
        <h2 className="font-['Tenor_Sans'] text-4xl leading-none text-[#2f2100]">
          Улей №{hiveId}
        </h2>

        <div className="mt-6 grid gap-3">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="w-full rounded-lg border-2 border-[#f1d88a] bg-white px-4 py-3 font-semibold text-[#2f2100] outline-none transition-all focus:border-[#f8b400] focus:ring-4 focus:ring-[#f8b400]/20"
            placeholder="Добавить задачу..."
          />

          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
            <div className="grid gap-2">
              <label className="text-sm font-bold text-[#7a5a1a]">
                Напомнить
              </label>
              <MobileDateTimePicker
                value={reminderAt}
                minDateTime={minReminderAt}
                onChange={setReminderAt}
                ampm={false}
                minutesStep={1}
                timeSteps={{ minutes: 1 }}
                format="DD.MM.YYYY HH:mm"
                localeText={{
                  cancelButtonLabel: 'Отмена',
                  okButtonLabel: 'Выбрать',
                  toolbarTitle: 'Дата и время',
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'medium',
                    placeholder: 'Дата и время напоминания',
                    sx: honeyTextFieldSx,
                  },
                  dialog: {
                    sx: {
                      zIndex: 10001,
                      '& .MuiPaper-root': {
                        borderRadius: '8px',
                        border: '1px solid #f1d88a',
                      },
                    },
                  },
                }}
              />
            </div>
          </LocalizationProvider>

          {errorMessage && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
              {errorMessage}
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-[#8b4f00]">
              {notificationPermission === 'granted' && 'Уведомления включены.'}
              {notificationPermission === 'default' && 'При добавлении напоминания браузер спросит разрешение.'}
              {notificationPermission === 'denied' && 'Уведомления запрещены в настройках браузера.'}
              {notificationPermission === 'unsupported' && 'Этот браузер не поддерживает уведомления.'}
            </p>
            <button
              type="button"
              onClick={handleAdd}
              disabled={isSaving}
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#f8b400] px-4 font-black text-[#2b1a00] transition-all hover:bg-[#ffd24a] active:scale-95 disabled:opacity-60"
              aria-label="Добавить задачу"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">{isSaving ? 'Сохранение' : 'Добавить'}</span>
            </button>
          </div>
        </div>

        <div className="mt-5 max-h-64 space-y-2 overflow-y-auto pr-1">
          {tasks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#f1d88a] bg-white/70 px-4 py-5 text-center text-sm font-semibold text-[#7a5a1a]">
              Для этого улья пока нет задач.
            </p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-[#f1d88a] bg-white px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <span className="block break-words font-semibold text-[#2f2100]">
                    {task.task_text}
                  </span>

                  {task.reminder_at && (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#fff4cc] px-2 py-1 text-xs font-black text-[#8b4f00]">
                      <Bell size={13} />
                      {formatReminderDate(task.reminder_at)}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(task.id)}
                  className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label="Удалить задачу"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskModal

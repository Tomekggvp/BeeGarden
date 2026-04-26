import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, Droplets, Plus, Save, X } from 'lucide-react'
import api from '../api/axios'
import {
  EMPTY_HIVE_CHECKS,
  fetchHiveCheck,
  upsertHiveCheck,
} from '../lib/hiveChecks'
import {
  isPushSupported,
  requestNotificationPermission,
  subscribeUserToPush,
} from '../lib/pushNotifications'

const Toggle = ({ checked, onChange, disabled = false, activeColorClass = 'peer-checked:bg-[#f8b400]' }) => (
  <label className={`relative inline-flex h-7 w-12 items-center ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="peer sr-only"
    />
    <span className={`h-7 w-12 rounded-full bg-[#dcc78a] transition-colors ${activeColorClass}`} />
    <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
  </label>
)

const defaultLoadedState = { ...EMPTY_HIVE_CHECKS }

const CheckStatusModal = ({ isOpen, onClose, hiveId, session, onSaved }) => {
  const [form, setForm] = useState(defaultLoadedState)
  const [loadedState, setLoadedState] = useState(defaultLoadedState)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const saveTimerRef = useRef(null)
  const pendingPushKindsRef = useRef(new Set())

  useEffect(() => {
    if (!isOpen || !session?.user?.id || !hiveId) return

    const loadHiveCheck = async () => {
      setIsLoading(true)

      try {
        const state = await fetchHiveCheck(session.user.id, hiveId)
        setForm(state)
        setLoadedState(state)
        setErrorMessage('')
        setSuccessMessage('')
      } catch (error) {
        console.error('Load hive check error:', error)
        setErrorMessage('Не удалось загрузить настройки проверки.')
      } finally {
        setIsLoading(false)
      }
    }

    loadHiveCheck()
  }, [hiveId, isOpen, session?.user?.id])

  useEffect(() => () => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
  }, [])

  const isDirty = useMemo(() => (
    form.pumpingRequired !== loadedState.pumpingRequired
    || form.pumpingNotificationsEnabled !== loadedState.pumpingNotificationsEnabled
    || form.treatmentRequired !== loadedState.treatmentRequired
    || form.treatmentNotificationsEnabled !== loadedState.treatmentNotificationsEnabled
  ), [form, loadedState])

  const updateFlag = (field) => (event) => {
    const nextChecked = event.target.checked

    setForm((currentForm) => {
      if (field === 'pumpingRequired' && !nextChecked) {
        return {
          ...currentForm,
          pumpingRequired: false,
          pumpingNotificationsEnabled: false,
        }
      }

      if (field === 'treatmentRequired' && !nextChecked) {
        return {
          ...currentForm,
          treatmentRequired: false,
          treatmentNotificationsEnabled: false,
        }
      }

      if (field === 'pumpingRequired' && nextChecked) {
        return {
          ...currentForm,
          pumpingRequired: true,
          pumpingNotificationsEnabled: true,
        }
      }

      if (field === 'treatmentRequired' && nextChecked) {
        return {
          ...currentForm,
          treatmentRequired: true,
          treatmentNotificationsEnabled: true,
        }
      }

      return {
        ...currentForm,
        [field]: nextChecked,
      }
    })
  }

  const saveState = async (nextState, options = {}) => {
    if (!session?.user?.id || !hiveId || isSaving) return
    const { showSuccess = true } = options

    const shouldSendPumpingNotification = nextState.pumpingRequired
      && nextState.pumpingNotificationsEnabled
      && !loadedState.pumpingRequired

    const shouldSendTreatmentNotification = nextState.treatmentRequired
      && nextState.treatmentNotificationsEnabled
      && !loadedState.treatmentRequired

    const shouldPreparePush = shouldSendPumpingNotification || shouldSendTreatmentNotification

    setIsSaving(true)
    setErrorMessage('')

    try {
      if (shouldPreparePush) {
        if (!isPushSupported()) {
          throw new Error('Этот браузер не поддерживает push-уведомления.')
        }

        const permission = await requestNotificationPermission()
        if (permission !== 'granted') {
          throw new Error('Чтобы получать уведомления, разрешите их в браузере.')
        }

        const subscribed = await subscribeUserToPush(session.user.id, { forceRefresh: true })
        if (!subscribed) {
          throw new Error('Не удалось подготовить push-уведомления для этого устройства.')
        }
      }

      const savedState = await upsertHiveCheck(session.user.id, hiveId, nextState)
      setLoadedState(savedState)
      setForm(savedState)

      const notificationsToSend = []
      if (shouldSendPumpingNotification) notificationsToSend.push('pumping')
      if (shouldSendTreatmentNotification) notificationsToSend.push('treatment')

      if (notificationsToSend.length > 0) {
        try {
          await Promise.all(notificationsToSend.map((kind) =>
            api.post('/api/check-notifications/send', {
              user_id: session.user.id,
              hive_id: String(hiveId),
              kind,
            })
          ))
        } catch (pushError) {
          console.error('Check push notification error:', pushError)
          setSuccessMessage('Сохранено, но push-уведомление не отправлено (серверный эндпоинт недоступен).')
        }
      }

      pendingPushKindsRef.current.clear()

      if (showSuccess) {
        setSuccessMessage(`Проверки для улья №${hiveId} сохранены.`)
      }
      onSaved?.(String(hiveId), savedState)
    } catch (error) {
      console.error('Save hive check error:', error)
      const serverMessage = error?.response?.data?.error
      setSuccessMessage('')
      setErrorMessage(serverMessage || error.message || 'Не удалось сохранить проверки.')
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (!isOpen || isLoading || !session?.user?.id || !hiveId) return
    if (!isDirty) return
    if (isSaving) return

    if (!loadedState.pumpingRequired && form.pumpingRequired && form.pumpingNotificationsEnabled) {
      pendingPushKindsRef.current.add('pumping')
    }

    if (!loadedState.treatmentRequired && form.treatmentRequired && form.treatmentNotificationsEnabled) {
      pendingPushKindsRef.current.add('treatment')
    }

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = window.setTimeout(() => {
      saveState(form, { showSuccess: false })
    }, 350)
  }, [
    form,
    hiveId,
    isDirty,
    isLoading,
    isOpen,
    isSaving,
    loadedState.pumpingRequired,
    loadedState.treatmentRequired,
    session?.user?.id,
  ])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[#111827]/35 backdrop-blur-sm" />

      <div
        className="relative z-10 my-4 flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col rounded-lg border border-[#f1d88a] bg-[#fffdf7] p-6 shadow-[0_24px_70px_rgba(93,58,0,0.18)] sm:max-w-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full text-[#9a5a00] transition-colors hover:bg-[#fff4cc] hover:text-[#2f2100]"
          aria-label="Закрыть проверки"
        >
          <X size={18} />
        </button>

        <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-[#9a5a00]">
          Проверки
        </p>
        <h2 className="font-['Tenor_Sans'] text-4xl leading-none text-[#2f2100]">
          Улей №{hiveId}
        </h2>

        <div className="mt-6 space-y-4 overflow-y-auto pr-1">
          <div className="rounded-lg border border-[#f1d88a] bg-white px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-2 text-lg font-black text-[#2f2100]">
                  <Droplets size={18} />
                  Откачка мёда
                </p>
                <p className="mt-1 text-sm font-semibold text-[#7a5a1a]">
                  Включите, если этот улей пора отправить на откачку.
                </p>
              </div>
              <Toggle
                checked={form.pumpingRequired}
                onChange={updateFlag('pumpingRequired')}
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 rounded-lg bg-[#fffaf0] px-3 py-3">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-[#8b4f00]">
                <Bell size={16} />
                Уведомление на откачку
              </span>
              <Toggle
                checked={form.pumpingNotificationsEnabled}
                onChange={updateFlag('pumpingNotificationsEnabled')}
                disabled={!form.pumpingRequired}
              />
            </div>
          </div>

          <div className="rounded-lg border border-[#f1d88a] bg-white px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-2 text-lg font-black text-[#2f2100]">
                  <Plus size={18} />
                  Лечение
                </p>
                <p className="mt-1 text-sm font-semibold text-[#7a5a1a]">
                  Включите, если этому улью нужно лечение.
                </p>
              </div>
              <Toggle
                checked={form.treatmentRequired}
                onChange={updateFlag('treatmentRequired')}
                activeColorClass="peer-checked:bg-[#2f9e44]"
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 rounded-lg bg-[#fffaf0] px-3 py-3">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-[#8b4f00]">
                <Bell size={16} />
                Уведомление на лечение
              </span>
              <Toggle
                checked={form.treatmentNotificationsEnabled}
                onChange={updateFlag('treatmentNotificationsEnabled')}
                disabled={!form.treatmentRequired}
                activeColorClass="peer-checked:bg-[#2f9e44]"
              />
            </div>
          </div>

          {isLoading && (
            <p className="rounded-lg border border-[#f1d88a] bg-white/80 px-4 py-3 text-sm font-semibold text-[#7a5a1a]">
              Загружаю текущие настройки...
            </p>
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
            onClick={() => saveState(form, { showSuccess: true })}
            disabled={isSaving || isLoading || !isDirty}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#f8b400] px-4 font-black text-[#2b1a00] transition-all hover:bg-[#ffd24a] active:scale-[0.99] disabled:opacity-60"
          >
            <Save size={18} />
            {isSaving ? 'Сохраняю...' : isDirty ? 'Сохранить' : 'Сохранено'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CheckStatusModal

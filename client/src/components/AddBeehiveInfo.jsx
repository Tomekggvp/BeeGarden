import { useEffect } from 'react'
import { XIcon } from 'lucide-react'

const AddBeehiveInfo = ({ isOpen, onClose, onConfirm, beehiveNum, setBeehiveNum, isSaving = false, errorMessage = '' }) => {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('beegarden:modal-visibility', {
      detail: { open: isOpen, modalId: 'add-beehive-info' },
    }))

    return () => {
      window.dispatchEvent(new CustomEvent('beegarden:modal-visibility', {
        detail: { open: false, modalId: 'add-beehive-info' },
      }))
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="app-modal fixed inset-0 z-[30000] flex items-center justify-center overflow-y-auto p-4">
      <div
        className="absolute inset-0 bg-[#111827]/35 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="app-modal-panel relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-lg border border-[#f1d88a] bg-[#fffdf7] p-6 shadow-[0_24px_70px_rgba(93,58,0,0.18)] sm:max-w-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#9a5a00] transition-colors hover:bg-[#fff4cc] hover:text-[#2f2100]"
          aria-label="Закрыть"
        >
          <XIcon size={18} />
        </button>

        <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-[#9a5a00]">
          Новый улей
        </p>
        <h3 className="font-['Rubik'] text-4xl leading-none text-[#2f2100]">
          Номер улья
        </h3>

        <form onSubmit={(event) => { event.preventDefault(); onConfirm() }}>
        <div className="mt-6">
          <label className="mb-2 block text-sm font-bold text-[#7a5a1a]">
            Введите номер
          </label>
          <input
            type="text"
            aria-label="Номер нового улья"
            required
            autoComplete="off"
            enterKeyHint="done"
            maxLength={64}
            value={beehiveNum}
            onChange={(event) => setBeehiveNum(event.target.value)}
            className="w-full rounded-lg border-2 border-[#f1d88a] bg-white px-4 py-4 text-2xl font-black text-[#2f2100] outline-none transition-all focus:border-[#f8b400] focus:ring-4 focus:ring-[#f8b400]/20"
            autoFocus
          />
        </div>
        {errorMessage && <p role="alert" className="mt-3 text-sm font-bold text-red-700">{errorMessage}</p>}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#f1d88a] px-5 py-3 font-bold text-[#7a5a1a] transition-colors hover:bg-[#fff4cc]"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg primary-action px-5 py-3 font-black   transition-all  active:scale-95 disabled:opacity-60"
          >
            {isSaving ? 'Сохранение...' : 'Подтвердить'}
          </button>
        </div>
        </form>
      </div>
    </div>
  )
}

export default AddBeehiveInfo

import { XIcon } from 'lucide-react'

const AddBeehiveInfo = ({ isOpen, onClose, onConfirm, beehiveNum, setBeehiveNum, isSaving = false }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#111827]/35 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-lg border border-[#f1d88a] bg-[#fffdf7] p-6 shadow-[0_24px_70px_rgba(93,58,0,0.18)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-[#9a5a00] transition-colors hover:bg-[#fff4cc] hover:text-[#2f2100]"
          aria-label="Закрыть"
        >
          <XIcon size={22} />
        </button>

        <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-[#9a5a00]">
          Новый улей
        </p>
        <h3 className="font-['Tenor_Sans'] text-4xl leading-none text-[#2f2100]">
          Номер улья
        </h3>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-bold text-[#7a5a1a]">
            Введите номер
          </label>
          <input
            type="text"
            value={beehiveNum}
            onChange={(event) => setBeehiveNum(event.target.value)}
            className="w-full rounded-lg border-2 border-[#f1d88a] bg-white px-4 py-4 text-2xl font-black text-[#2f2100] outline-none transition-all focus:border-[#f8b400] focus:ring-4 focus:ring-[#f8b400]/20"
            autoFocus
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#f1d88a] px-5 py-3 font-bold text-[#7a5a1a] transition-colors hover:bg-[#fff4cc]"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="rounded-lg bg-[#f8b400] px-5 py-3 font-black text-[#2b1a00] shadow-sm transition-all hover:bg-[#ffd24a] active:scale-95 disabled:opacity-60"
          >
            {isSaving ? 'Сохранение...' : 'Подтвердить'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddBeehiveInfo

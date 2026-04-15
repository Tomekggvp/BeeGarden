import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, hiveId }) => {
  const [input, setInput] = useState('')

  if (!isOpen) return null

  const isMatched = input === String(hiveId)
  const handleClose = () => {
    setInput('')
    onClose()
  }
  const handleConfirm = () => {
    setInput('')
    onConfirm()
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#111827]/35 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-sm rounded-lg border border-[#f1d88a] bg-[#fffdf7] p-6 shadow-[0_24px_70px_rgba(93,58,0,0.18)]">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-[#9a5a00] transition-colors hover:bg-[#fff4cc] hover:text-[#2f2100]"
          aria-label="Закрыть"
        >
          <X size={20} />
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <AlertTriangle size={26} />
        </div>

        <h3 className="mt-5 font-['Tenor_Sans'] text-3xl leading-none text-[#2f2100]">
          Удалить улей №{hiveId}?
        </h3>
        <p className="mt-3 text-sm font-semibold text-[#7a5a1a]">
          Данные по этому улью будут удалены без восстановления.
        </p>

        <div className="mt-6">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[#9a5a00]">
            Введите номер улья
          </label>
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={`Напишите ${hiveId}`}
            className="w-full rounded-lg border-2 border-[#f1d88a] bg-white px-4 py-3 text-center text-lg font-black text-[#2f2100] outline-none transition-all focus:border-red-400 focus:ring-4 focus:ring-red-100"
            autoFocus
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-lg border border-[#f1d88a] px-4 py-3 font-bold text-[#7a5a1a] transition-colors hover:bg-[#fff4cc]"
          >
            Отмена
          </button>
          <button
            type="button"
            disabled={!isMatched}
            onClick={handleConfirm}
            className="flex-1 rounded-lg bg-red-500 px-4 py-3 font-black text-white shadow-sm transition-all hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDeleteModal
